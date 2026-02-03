
import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from '../types';

export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    /**
     * LOGICA DI RECUPERO CHIAVE (Standard Senior)
     * Cerchiamo la chiave in più punti per superare i limiti di injection dei browser:
     * 1. process.env.API_KEY (Standard richiesto)
     * 2. window.process.env.API_KEY (Fallback per alcuni bundler)
     */
    let apiKey: string | undefined;

    try {
        // @ts-ignore
        apiKey = process.env.API_KEY;
    } catch (e) {
        // process non è definito in questo contesto browser
    }

    if (!apiKey || apiKey === 'undefined') {
        // Fallback: controllo se è stata iniettata nel contesto globale
        const globalEnv = (window as any).process?.env;
        apiKey = globalEnv?.API_KEY || (window as any).API_KEY;
    }

    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        console.error("ERRORE CRITICO: La variabile 'API_KEY' non è stata iniettata nel bundle.");
        console.warn("SOLUZIONE VERCEL: 1. Verifica che il nome sia esattamente 'API_KEY'. 2. Vai su Vercel -> Deployments -> Clicca sull'ultimo -> Redeploy. Senza redeploy le modifiche alle variabili non hanno effetto.");
        throw new Error("MISSING_API_KEY");
    }

    const ai = new GoogleGenAI({ apiKey });
    const exclusionContext = existingLeads.length > 0 
        ? `Escludi queste aziende già presenti: ${existingLeads.map(l => l.name).slice(0, 5).join(', ')}.`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Trova ${count} aziende reali per la ricerca: "${query}". ${exclusionContext}`,
            config: {
                systemInstruction: `Sei un Lead Generator professionale. Trova dati REALI e verificabili tramite ricerca web.
                Rispondi ESCLUSIVAMENTE in formato JSON (array di oggetti).
                FORMATO: [{"name": "...", "sector": "...", "location": "...", "email": "...", "phone": "...", "website": "...", "description": "..."}]`,
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            sector: { type: Type.STRING },
                            location: { type: Type.STRING },
                            email: { type: Type.STRING },
                            phone: { type: Type.STRING },
                            website: { type: Type.STRING },
                            description: { type: Type.STRING }
                        },
                        required: ["name", "location", "phone"]
                    }
                }
            },
        });

        const text = response.text;
        if (!text) return [];
        
        const results = JSON.parse(text);
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .filter((chunk: any) => chunk.web)
            .map((chunk: any) => ({
                uri: chunk.web.uri,
                title: chunk.web.title
            }));

        return results.map((lead: any) => ({
            ...lead,
            sources: sources.length > 0 ? sources : undefined
        }));

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
