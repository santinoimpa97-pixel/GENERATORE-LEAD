
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Sector } from '../types';

export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    // Use process.env.API_KEY directly as required
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey.length < 5) {
        console.error("Gemini API Key missing");
        throw new Error("AUTH_REQUIRED");
    }

    // Always create a new GoogleGenAI instance right before making an API call to use the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const validSectors = Object.values(Sector).join(', ');
    const exclusionContext = existingLeads.length > 0 
        ? `NON includere queste aziende già in database: ${existingLeads.map(l => l.name).slice(0, 10).join(', ')}.`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: `Trova ${count} aziende REALI, ATTIVE e VERIFICABILI per: "${query}". ${exclusionContext}`,
            config: {
                systemInstruction: `Sei un Lead Generator professionale specializzato in dati REALI. 
                Non inventare MAI informazioni. Usa Google Search come unica fonte di verità.

                PROTOCOLLO DI VALIDAZIONE:
                1. IDENTITÀ: Trova aziende con una presenza fisica reale (Google Maps/Sito Ufficiale).
                2. INDIRIZZO: Estrai l'indirizzo civico completo (Via, Numero, CAP, Città). Risultati senza Via e Civico devono essere SCARTATI.
                3. CONTATTO: Dai priorità assoluta a numeri di cellulare o WhatsApp (prefissi 3xx). Inserisci il telefono solo se verificato.
                4. DESCRIZIONE: Fornisci una breve descrizione reale di cosa fa l'azienda.

                RESTITUISCI SOLO JSON:
                [{"name": "...", "sector": "...", "location": "...", "email": "...", "phone": "...", "website": "...", "description": "..."}]`,
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 4000 },
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            sector: { type: Type.STRING },
                            location: { type: Type.STRING, description: "Indirizzo completo: Via, Civico, Città" },
                            email: { type: Type.STRING },
                            phone: { type: Type.STRING, description: "Numero cellulare o WhatsApp reale" },
                            website: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["name", "sector", "location", "phone"]
                    }
                }
            },
        });

        const text = response.text;
        if (!text) return [];
        
        // As per Search Grounding guidelines, text output might not be pure JSON. 
        // We find the JSON block using regex to safely parse it.
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const results = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        
        // Extract website URLs from groundingChunks and list them as required by Search Grounding rules
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({
                uri: chunk.web.uri,
                title: chunk.web.title
            }));

        // Safety filter and attach grounding sources to each lead
        return results.filter((lead: any) => 
            lead.name && 
            lead.location && 
            lead.location.length > 5 &&
            !lead.phone?.includes("000000")
        ).map((lead: any) => ({
            ...lead,
            sources: sources.length > 0 ? sources : undefined
        }));

    } catch (error: any) {
        console.error("Gemini Error:", error);
        // If request fails with entity not found, reset key selection state as per guidelines
        if (error?.message?.includes("Requested entity was not found")) {
            const win = window as any;
            if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
                win.aistudio.openSelectKey();
            }
        }
        if (error?.status === 429) throw new Error("QUOTA_EXHAUSTED");
        if (error?.message?.includes("403") || error?.message?.includes("API_KEY")) throw new Error("AUTH_REQUIRED");
        throw error;
    }
};
