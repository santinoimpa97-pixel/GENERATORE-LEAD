
import { GoogleGenAI } from "@google/genai";
import { Lead, Source, Sector } from '../types';

/**
 * The API key must be obtained exclusively from the environment variable process.env.API_KEY.
 * Use this string directly when initializing the @google/genai client instance.
 */
const API_KEY = process.env.API_KEY;

// Check if API key is present and not a placeholder
const isApiKeyValid = !!API_KEY && API_KEY.length > 10 && !API_KEY.includes('INSERISCI_QUI');

export const geminiConnectionError = isApiKeyValid
    ? null
    : "Chiave API Gemini non trovata. Verifica l'ambiente.";

/**
 * Generates leads using Gemini AI with Google Search grounding.
 */
export const generateLeads = async (
    query: string, 
    count: number, 
    existingLeads: { name: string; location: string }[]
): Promise<Partial<Lead>[]> => {
    
    if (!isApiKeyValid) {
        throw new Error("Chiave API Gemini mancante o non valida.");
    }

    // Creating a new instance right before the call as per guidelines for Gemini 3 series
    const ai = new GoogleGenAI({ apiKey: API_KEY! });
    
    const validSectors = Object.values(Sector).join(', ');
    const exclusionList = existingLeads.length > 0 
        ? `IMPORTANTE: Escludi ASSOLUTAMENTE questi lead già presenti (non restituirli): ${JSON.stringify(existingLeads)}.`
        : '';

    // Fix: Escaping triple backticks inside the template literal to prevent breaking the string.
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
        NON usare blocchi markdown (es. \` \` \`json).
        NON scrivere testo introduttivo.
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
        let finalResponse = null;
        let attempt = 0;
        const maxRetries = 5;

        while (attempt < maxRetries) {
            try {
                attempt++;
                // Using gemini-3-flash-preview as per task requirements
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
                const msg = apiError.message || JSON.stringify(apiError);
                console.warn(`Tentativo ${attempt} Gemini fallito:`, msg);

                const isQuotaError = msg.includes('429') || msg.includes('quota') || msg.includes('exhausted');
                const isRetriable = isQuotaError || 
                                    msg.includes('500') || 
                                    msg.includes('503') || 
                                    msg.includes('Internal error') || 
                                    msg.includes('INTERNAL') ||
                                    msg.includes('Overloaded') ||
                                    msg.includes('fetch');

                if (isRetriable && attempt < maxRetries) {
                    const baseDelay = isQuotaError ? 3000 : 1000;
                    const delay = Math.pow(2, attempt) * baseDelay;
                    console.info(`Riprovo tra ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                
                if (isQuotaError) {
                    throw new Error("Quota API Gemini esaurita. Attendi qualche minuto.");
                }
                throw apiError;
            }
        }

        if (!finalResponse) {
            throw new Error("Impossibile ottenere una risposta dall'AI dopo diversi tentativi.");
        }

        if (finalResponse.candidates?.[0]?.finishReason && finalResponse.candidates[0].finishReason !== 'STOP') {
            const reason = finalResponse.candidates[0].finishReason;
            if (reason === 'SAFETY') throw new Error("Il contenuto è stato bloccato dai filtri di sicurezza AI.");
            throw new Error(`Generazione interrotta: ${reason}`);
        }
        
        // Correct usage of .text property (not a method)
        const textOutput = finalResponse.text;
        if (!textOutput) {
            throw new Error('L\'AI ha restituito una risposta vuota.');
        }

        const trimmedText = textOutput.trim();
        if (trimmedText === 'no_new_leads_found') throw new Error('no_new_leads_found');
        
        const startIndex = trimmedText.indexOf('[');
        const endIndex = trimmedText.lastIndexOf(']');

        if (startIndex === -1 || endIndex === -1) {
             throw new SyntaxError("L'AI ha restituito del testo ma non è un array JSON valido.");
        }

        const jsonString = trimmedText.substring(startIndex, endIndex + 1);
        const parsedLeads: Partial<Lead>[] = JSON.parse(jsonString);
        
        // Extracting website URLs from grounding chunks as per guidelines
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
            sources: sources.length > 0 ? sources : [],
        }));

    } catch (error) {
        console.error("Errore Gemini:", error);
        if (error instanceof SyntaxError) {
            throw new Error("Risposta AI malformata. Riprova con una ricerca più specifica.");
        }
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Errore sconosciuto nella generazione dei lead.");
    }
};
