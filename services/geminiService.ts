
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Sector } from '../types';

// Fix: Simplified API key retrieval to use process.env.API_KEY as the single source of truth.
export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    // Fix: Obtained API key exclusively from environment variables as per hard requirement.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey.length < 5) {
        throw new Error("AUTH_REQUIRED");
    }

    // Fix: Initialize GoogleGenAI with a named parameter object.
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

        // Fix: Direct access to the .text property of GenerateContentResponse.
        const text = response.text;
        if (!text) return [];
        
        const parsed = JSON.parse(text);
        
        // Fix: Extract website URLs from groundingChunks as per Google Search grounding requirements.
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            uri: chunk.web?.uri,
            title: chunk.web?.title
        })).filter((s: any) => s.uri) || [];

        return parsed.map((lead: any) => ({ ...lead, sources }));

    } catch (error: any) {
        console.error("Gemini Error:", error);
        // Fix: Improved error handling for common API key issues.
        if (error?.message?.includes("403") || error?.message?.includes("API_KEY") || error?.message?.includes("not found")) {
            throw new Error("AUTH_REQUIRED");
        }
        throw error;
    }
};
