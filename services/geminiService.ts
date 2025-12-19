import { GoogleGenAI } from "@google/genai";
import { Lead, Source, Sector } from '../types';

/**
 * Generates leads using Gemini AI with Google Search grounding.
 * Strictly follows Google GenAI SDK guidelines for API Key usage.
 */
export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    // REQUIREMENT: Use process.env.API_KEY directly.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey.includes('INSERISCI_QUI') || apiKey.length < 10) {
        throw new Error("Chiave API Gemini non configurata correttamente nell'ambiente.");
    }

    // REQUIREMENT: Use new GoogleGenAI({ apiKey: process.env.API_KEY })
    const ai = new GoogleGenAI({ apiKey });
    
    const validSectors = Object.values(Sector).join(', ');
    const exclusionList = existingLeads.length > 0 
        ? `IMPORTANTE: Escludi ASSOLUTAMENTE questi lead già presenti: ${JSON.stringify(existingLeads)}.`
        : '';

    const systemInstruction = `
        Sei un assistente AI specializzato nella Lead Generation B2B.
        1. RICERCA: Usa 'googleSearch' per trovare aziende reali.
        2. FOCUS: Trova numeri di cellulare o WhatsApp.
        3. OUTPUT: Restituisci un array JSON di oggetti lead.
        
        FORMATO RISPOSTA: ESCLUSIVAMENTE un array JSON [ ... ]. 
        Se non trovi nulla, scrivi: no_new_leads_found.
    `;
    
    const userPrompt = `Trova ${count} lead per: "${query}". ${exclusionList} Usa Google Search.`;

    try {
        let finalResponse = null;
        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries) {
            try {
                attempt++;
                // Using gemini-3-flash-preview for optimal quota on Vercel
                const response = await ai.models.generateContent({
                    model: "gemini-3-flash-preview",
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemInstruction,
                        tools: [{ googleSearch: {} }],
                    },
                });
                
                finalResponse = response;
                break; 
            } catch (apiError: any) {
                const msg = apiError.message || "";
                if ((msg.includes('429') || msg.includes('quota')) && attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                    continue;
                }
                throw apiError;
            }
        }

        if (!finalResponse || !finalResponse.text) {
            throw new Error("L'AI non ha prodotto una risposta valida.");
        }

        const textOutput = finalResponse.text.trim();
        if (textOutput === 'no_new_leads_found') return [];
        
        const startIndex = textOutput.indexOf('[');
        const endIndex = textOutput.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1) {
             throw new Error("Formato dati AI non valido.");
        }

        const jsonString = textOutput.substring(startIndex, endIndex + 1);
        const parsedLeads: Partial<Lead>[] = JSON.parse(jsonString);
        
        const groundingMetadata = finalResponse.candidates?.[0]?.groundingMetadata;
        const sources: Source[] = (groundingMetadata?.groundingChunks || [])
            .map((chunk: any) => ({
                uri: chunk.web?.uri,
                title: chunk.web?.title,
            }))
            .filter((source: any): source is Source => !!source.uri);

        return parsedLeads.map(lead => ({
            ...lead,
            sector: lead.sector || Sector.OTHER,
            sources: sources,
        }));

    } catch (error: any) {
        console.error("Gemini Error:", error);
        throw error;
    }
};

export const geminiConnectionError = null;
