
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Sector } from '../types';

export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    // Il punto unico di verità è process.env.API_KEY, popolato da index.html
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey.length < 5) {
        console.error("Gemini API Key missing in process.env.API_KEY");
        throw new Error("AUTH_REQUIRED");
    }

    const ai = new GoogleGenAI({ apiKey });
    const validSectors = Object.values(Sector).join(', ');
    const exclusionContext = existingLeads.length > 0 
        ? `Escludi: ${existingLeads.map(l => l.name).join(', ')}.`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Trova ${count} lead reali per: "${query}". ${exclusionContext}`,
            config: {
                systemInstruction: `Sei un esperto Lead Generator. Trova aziende REALI in Italia usando Google Search. Estrai: nome, settore (tra: ${validSectors}), città, email, telefono, sito web e descrizione. Restituisci un array JSON.`,
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
                        required: ["name", "sector", "location", "email", "phone"]
                    }
                }
            },
        });

        const text = response.text;
        if (!text) return [];
        
        const parsed = JSON.parse(text);
        
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            uri: chunk.web?.uri,
            title: chunk.web?.title
        })).filter((s: any) => s.uri) || [];

        return parsed.map((lead: any) => ({ ...lead, sources }));

    } catch (error: any) {
        console.error("Gemini Error Detail:", error);
        if (error?.message?.includes("403") || error?.message?.includes("API_KEY") || error?.message?.includes("not found") || error?.message?.includes("expired")) {
            throw new Error("AUTH_REQUIRED");
        }
        throw error;
    }
};
