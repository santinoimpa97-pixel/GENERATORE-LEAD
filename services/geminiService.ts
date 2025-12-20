import { GoogleGenAI } from "@google/genai";
import { Lead, Source, Sector } from '../types';

/**
 * Funzione di utilità per recuperare la chiave API in modo resiliente ai bundler.
 * Alcuni compilatori (Vite/Webpack) sostituiscono process.env.API_KEY a build-time.
 * Questa funzione garantisce di pescare il valore reale iniettato in index.html a runtime.
 */
const getApiKey = (): string | undefined => {
    // 1. Tenta l'accesso standard (richiesto dalle linee guida)
    try {
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return process.env.API_KEY;
        }
    } catch (e) {}

    // 2. Fallback al global scope (window) dove index.html inietta la configurazione
    const globalConfig = (window as any).__APP_CONFIG__;
    if (globalConfig && globalConfig.API_KEY) {
        return globalConfig.API_KEY;
    }

    // 3. Fallback a window.process (polyfill per browser)
    const browserProcess = (window as any).process;
    if (browserProcess?.env?.API_KEY) {
        return browserProcess.env.API_KEY;
    }

    return undefined;
};

/**
 * Generates leads using Gemini AI with Google Search grounding.
 */
export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    const apiKey = getApiKey();
    
    if (!apiKey || apiKey.includes('INSERISCI_QUI') || apiKey.length < 10) {
        throw new Error("Chiave API Gemini non trovata. Assicurati che sia configurata correttamente in Vercel o index.html.");
    }

    // Inizializzazione istanza con la chiave recuperata
    const ai = new GoogleGenAI({ apiKey });
    
    const validSectors = Object.values(Sector).join(', ');
    const exclusionList = existingLeads.length > 0 
        ? `Escludi questi lead già presenti: ${JSON.stringify(existingLeads.map(l => l.name))}.`
        : '';

    const systemInstruction = `
        Sei un assistente AI specializzato nella Lead Generation B2B.
        PROTOCOLLO:
        1. RICERCA: Usa 'googleSearch' per trovare aziende reali.
        2. DATI: Cerca numeri di cellulare o WhatsApp. Non inventare mai i dati.
        3. OUTPUT: Restituisci ESCLUSIVAMENTE un array JSON di oggetti lead.
        
        FORMATO RISPOSTA: Array JSON [ ... ]. 
        Se non trovi nulla di nuovo, scrivi: no_new_leads_found.
    `;
    
    const userPrompt = `Trova ${count} nuovi lead per: "${query}". ${exclusionList} Usa Google Search.`;

    try {
        let finalResponse = null;
        let attempt = 0;
        const maxRetries = 3;

        while (attempt < maxRetries) {
            try {
                attempt++;
                // Utilizziamo gemini-3-flash-preview per massimizzare la quota disponibile
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
                // Gestione Retry per Quota (429)
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
             throw new Error("L'AI ha restituito un formato non valido. Riprova tra un istante.");
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
        if (error.message?.includes('429')) {
            throw new Error("Quota API esaurita. Attendi 60 secondi prima di riprovare.");
        }
        throw error;
    }
};

export const geminiConnectionError = null;
