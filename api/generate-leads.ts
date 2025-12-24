
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  maxDuration: 60, // Aumentiamo il timeout per ricerche web lunghe
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("ERRORE: API_KEY non configurata su Vercel.");
    return res.status(500).json({ error: 'Configurazione server incompleta (API_KEY mancante).' });
  }

  const { query, count, existingLeads, sectors } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const exclusionContext = existingLeads?.length > 0 
        ? `Escludi: ${existingLeads.map((l: any) => l.name).join(', ')}.`
        : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Trova ${count} lead reali per: "${query}". ${exclusionContext}`,
      config: {
        systemInstruction: `Sei un esperto Lead Generator. Trova aziende REALI in Italia usando Google Search. Estrai: nome, settore (tra: ${sectors}), città, email, telefono, sito web e descrizione. Restituisci un array JSON.`,
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
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri,
      title: chunk.web?.title
    })).filter((s: any) => s.uri) || [];

    const leads = text ? JSON.parse(text) : [];
    
    return res.status(200).json({ 
      leads: leads.map((lead: any) => ({ ...lead, sources })) 
    });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ 
      error: error.message || 'Errore durante la generazione dei lead.' 
    });
  }
}
