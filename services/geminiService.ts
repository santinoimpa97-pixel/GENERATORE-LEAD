
import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from '../types';

export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    // La chiave viene ottenuta ESCLUSIVAMENTE dalla variabile d'ambiente del sistema.
    // Questo impedisce il blocco da parte di Google Security se il codice viene pushato su GitHub.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        throw new Error("MISSING_SERVER_CONFIG");
    }

    const ai = new GoogleGenAI({ apiKey });
    const exclusionContext = existingLeads.length > 0 
        ? `Escludi queste aziende: ${existingLeads.map(l => l.name).slice(0, 5).join(', ')}.`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Trova ${count} aziende reali per: "${query}". ${exclusionContext}`,
            config: {
                systemInstruction: `Sei un esperto Lead Generator. Trova dati REALI. 
                Restituisci solo un array JSON.
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
