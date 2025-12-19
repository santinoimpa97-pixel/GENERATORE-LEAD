import { GoogleGenAI } from "@google/genai";
import { Lead, Source, Sector } from '../types';

// Helper to safely get API Key
const getApiKey = (): string | undefined => {
    let key: string | undefined = undefined;

    // 1. Try custom global object
    // @ts-ignore
    if (typeof window !== 'undefined' && window.__APP_CONFIG__) {
        // @ts-ignore
        key = window.__APP_CONFIG__.API_KEY || window.__APP_CONFIG__.VITE_API_KEY;
    }

    if (key && !key.includes('INSERISCI_QUI')) return key;

    // 2. Try window.process
    try {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.process && window.process.env) {
            // @ts-ignore
            key = window.process.env.API_KEY || window.process.env.VITE_API_KEY;
        }
    } catch (e) {}

    if (key && !key.includes('INSERISCI_QUI')) return key;

    // 3. Try import.meta.env
    try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            key = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
        }
    } catch (e) {}
    
    if (key && key.includes('INSERISCI_QUI')) return undefined;

    return key;
};

const API_KEY = getApiKey();

const isApiKeyValid = API_KEY && API_KEY.length > 10;

export const geminiConnectionError = !isApiKeyValid
    ? "Chiave API Gemini non trovata. Controlla env.js." 
    : null;

const ai = isApiKeyValid ? new GoogleGenAI({ apiKey: API_KEY! }) : null;

export const generateLeads = async (query: string, count: number, existingLeads: { name: string; location: string }[]): Promise<Partial<Lead>[]> => {
    if (!ai) {
        throw new Error("Chiave API Gemini mancante o non valida.");
    }
    
    const validSectors = Object.values(Sector).join(', ');
    const exclusionList = existingLeads.length > 0 
        ? `IMPORTANTE: Escludi ASSOLUTAMENTE questi lead già presenti (non restituirli): ${JSON.stringify(existingLeads)}.`
        : '';

    const systemInstruction = `
        Sei un assistente AI specializzato nella Lead Generation B2B con focus su **WhatsApp Marketing**.

        PROTOCOLLO OPERATIVO OBBLIGATORIO:
        1.  **RICERCA:** Utilizza ORA lo strumento 'googleSearch' per cercare aziende reali. Cerca specificamente pagine "Contatti", footer di siti web e profili social per trovare numeri di telefono.
        2.  **FOCUS WHATSAPP:** Il tuo obiettivo principale è trovare numeri di **cellulare** o numeri indicati come **WhatsApp**. Cerca prefissi mobili (es. +39 3...) o diciture "scrivici su WhatsApp".
        3.  **ESTRAZIONE:** 
            - Se un'azienda ha sia un numero fisso che un cellulare, **INSERISCI IL CELLULARE** nel campo 'phone'.
            - Se trovi solo il fisso, inserisci quello, ma dai priorità ai risultati con cellulare.
        4.  **OUTPUT:** Genera un array JSON con i risultati.

        CRITERI DI QUALITÀ:
        *   **Solo Dati Reali:** Non inventare mai email o numeri. Se non trovi un dato, lascia il campo vuoto o omettilo.
        *   **B2B Focus:** Privilegia contatti aziendali pubblici.
        *   **Settori Validi:** [${validSectors}]. Usa 'Altro' se incerto.

        FORMATO RISPOSTA:
        Restituisci ESCLUSIVAMENTE un array JSON valido [ ... ].
        NON usare blocchi markdown (\`\`\`json).
        NON scrivere testo introduttivo (es. "Ecco i lead...").
        Se non trovi NUOVI lead validi dopo la ricerca, restituisci esattamente la stringa: "no_new_leads_found".

        SCHEMA OGGETTO LEAD:
        {
          "name": "Nome Azienda",
          "location": "Indirizzo/Città",
          "website": "URL Sito",
          "description": "Breve descrizione attività",
          "phone": "Telefono (Preferibilmente Cellulare/WhatsApp)",
          "email": "Email",
          "sector": "Settore"
        }
    `;
    
    const userPrompt = `
        Trova ${count} lead B2B per: "${query}".
        ${exclusionList}
        Usa Google Search. Dai priorità assoluta alle aziende che mostrano un numero di **cellulare** o **WhatsApp** visibile.
    `;

    try {
        let response;
        let attempt = 0;
        const maxRetries = 3;

        while (true) {
            try {
                attempt++;
                response = await ai.models.generateContent({
                    model: "gemini-3-pro-preview",
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemInstruction,
                        tools: [{ googleSearch: {} }],
                    },
                });
                break; 
            } catch (apiError: any) {
                const msg = apiError.message || JSON.stringify(apiError);
                console.warn(`Tentativo ${attempt} Gemini fallito:`, msg);

                const isRetriable = msg.includes('500') || 
                                    msg.includes('503') || 
                                    msg.includes('Internal error') || 
                                    msg.includes('INTERNAL') ||
                                    msg.includes('Overloaded') ||
                                    msg.includes('fetch'); // Retry on fetch errors too

                if (isRetriable && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw apiError;
            }
        }

        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
            const reason = response.candidates[0].finishReason;
            if (reason === 'SAFETY') throw new Error(`blocked:SAFETY`);
            if (reason === 'MALFORMED_FUNCTION_CALL') throw new Error(`malformed_function_call`);
            throw new Error(`interrupted:${reason}`);
        }
        
        if (!response.text) {
             if (response.candidates && response.candidates.length > 0) {
                throw new Error('empty_response_with_candidates');
            }
            throw new Error('empty_response');
        }

        const text = response.text.trim();
        if (text === 'no_new_leads_found') throw new Error('no_new_leads_found');
        
        const startIndex = text.indexOf('[');
        const endIndex = text.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1) {
             throw new SyntaxError("L'AI ha restituito del testo ma non è un array JSON valido.");
        }

        const jsonString = text.substring(startIndex, endIndex + 1);
        const parsedLeads: Partial<Lead>[] = JSON.parse(jsonString);
        
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const sources: Source[] | undefined = groundingMetadata?.groundingChunks
            ?.map((chunk: any) => ({
                uri: chunk.web?.uri,
                title: chunk.web?.title,
            }))
            .filter((source: any): source is Source => source.uri);

        return parsedLeads.map(lead => ({
            ...lead,
            sector: lead.sector || Sector.OTHER,
            sources: sources || [],
        }));

    } catch (error) {
        console.error("Errore Gemini:", error);
        if (error instanceof SyntaxError) throw new Error("Risposta AI non valida. Riprova.");
        if (error instanceof Error) {
            if (error.message.includes('API key')) throw new Error("API Key non valida o revocata.");
            throw new Error(`Errore AI: ${error.message}`);
        }
        throw new Error("Errore sconosciuto.");
    }
};