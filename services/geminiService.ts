
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, Sector } from '../types';

export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey.length < 5) {
        console.error("Gemini API Key missing in process.env.API_KEY");
        throw new Error("AUTH_REQUIRED");
    }

    // Utilizziamo Gemini 3 Pro per la massima qualità e precisione dei dati
    const ai = new GoogleGenAI({ apiKey });
    const validSectors = Object.values(Sector).join(', ');
    const exclusionContext = existingLeads.length > 0 
        ? `NON includere assolutamente queste aziende: ${existingLeads.map(l => l.name).join(', ')}.`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Upgrade a Pro per evitare allucinazioni
            contents: `Esegui una ricerca web approfondita e trova ${count} aziende REALI, ESISTENTI e ATTIVE per: "${query}". ${exclusionContext}`,
            config: {
                systemInstruction: `Sei un verificatore di dati aziendali professionale. Il tuo obiettivo è fornire lead REALI verificati tramite Google Search.

                PROTOCOLLO DI VERIFICA (MANDATORIO):
                1. Usa Google Search per trovare aziende che hanno una presenza fisica o un sito web attivo.
                2. INDIRIZZO REALE: Devi estrarre l'indirizzo fisico completo (Via, Numero Civico, Città). Se non trovi la via e il civico, SCARTA l'azienda. Non accettare solo la città.
                3. CONTATTO WHATSAPP/CELLULARE: Cerca attivamente numeri mobili italiani (che iniziano con 3). Se il sito o la scheda Maps ha un cellulare, usalo come numero principale.
                4. NO DATI FINTI: Se non sei sicuro dell'esistenza di un'azienda o dei suoi recapiti, non includerla. Meglio restituire meno risultati ma tutti veri.
                
                REGOLE JSON:
                - 'name': Nome legale o commerciale esatto.
                - 'sector': Scegli SOLO tra [${validSectors}].
                - 'location': Indirizzo completo e preciso (Es: Corso Vittorio Emanuele II, 101, Roma).
                - 'phone': Numero verificato (Priorità a cellulari/WhatsApp).
                - 'email': Email aziendale reale.
                
                Sii ossessionato dalla verità del dato. Non inventare mai email o telefoni.`,
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                // Aumentiamo il budget di pensiero per permettere al modello di "ragionare" sui risultati di ricerca
                thinkingConfig: { thinkingBudget: 4000 },
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            sector: { type: Type.STRING },
                            location: { type: Type.STRING, description: "Indirizzo completo con via e civico" },
                            email: { type: Type.STRING },
                            phone: { type: Type.STRING, description: "Numero reale (preferibilmente cellulare)" },
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
        
        const results = JSON.parse(text);
        
        // Pulizia ulteriore per rimuovere eventuali placeholder "N/A" o simili
        return results.filter((lead: any) => 
            lead.name && 
            lead.location && 
            !lead.location.toLowerCase().includes("non disponibile") &&
            !lead.phone.toLowerCase().includes("non disponibile")
        );

    } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        if (error?.status === 429 || error?.message?.includes("429")) {
            throw new Error("QUOTA_EXHAUSTED");
        }
        if (error?.message?.includes("403") || error?.message?.includes("API_KEY")) {
            throw new Error("AUTH_REQUIRED");
        }
        throw error;
    }
};
