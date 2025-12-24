
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Sector } from '../types';

const getApiKey = () => {
  const win = window as any;
  return process.env.VITE_API_KEY || 
         process.env.API_KEY || 
         win.process?.env?.VITE_API_KEY || 
         win.process?.env?.API_KEY || 
         "";
};

export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    const apiKey = getApiKey();
    
    if (!apiKey || apiKey.length < 10) {
        throw new Error("AUTH_REQUIRED");
    }

    const ai = new GoogleGenAI({ apiKey });
    const validSectors = Object.values(Sector).join(', ');
    const exclusionContext = existingLeads.length > 0 
        ? `Escludi queste aziende: ${existingLeads.map(l => l.name).join(', ')}.`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Trova ${count} lead reali per questa ricerca: "${query}". ${exclusionContext}`,
            config: {
                systemInstruction: `Sei un esperto Lead Generator. Trova aziende REALI in Italia usando Google Search. Estrai: nome, settore (tra: ${validSectors}), città, email, telefono, sito web e descrizione. Restituisci SOLO un array JSON.`,
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

        return parsed.map((lead: any) => ({
            ...lead,
            sources
        }));

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        const msg = error?.message || "";
        if (msg.includes("403") || msg.includes("API_KEY")) {
            throw new Error("AUTH_REQUIRED");
        }
        throw new Error("Errore durante la ricerca lead: " + msg);
    }
};
