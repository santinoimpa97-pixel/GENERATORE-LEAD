
import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from '../types';

export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    // Utilizzo ESCLUSIVO di process.env.API_KEY come da specifiche di sicurezza
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        console.error("Gemini API Key non configurata nell'ambiente.");
        throw new Error("AUTH_REQUIRED");
    }

    const ai = new GoogleGenAI({ apiKey });
    const exclusionContext = existingLeads.length > 0 
        ? `Escludi: ${existingLeads.map(l => l.name).slice(0, 5).join(', ')}.`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Trova ${count} aziende reali per la ricerca: "${query}". ${exclusionContext}`,
            config: {
                systemInstruction: `Sei un esperto Lead Generator. 
                Trova dati REALI tramite ricerca Google.
                Restituisci solo un array JSON di oggetti.
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
        console.error("Gemini Error:", error);
        if (error?.status === 429) throw new Error("QUOTA_EXHAUSTED");
        throw error;
    }
};
