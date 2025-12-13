import { GoogleGenAI } from "@google/genai";
import { Lead, Source, Sector } from '../types';

// La chiave API deve essere fornita ESCLUSIVAMENTE tramite variabili d'ambiente.
// Non inserire mai chiavi reali direttamente nel codice per evitare che vengano revocate da Google.
const apiKey = process.env.API_KEY;

export const geminiConnectionError = !apiKey
    ? "La variabile d'ambiente API_KEY è obbligatoria."
    : null;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateLeads = async (query: string, count: number, existingLeads: { name: string; location: string }[]): Promise<Partial<Lead>[]> => {
    if (!ai) {
        throw new Error("La chiave API di Gemini non è configurata. Imposta API_KEY nelle tue variabili d'ambiente su Vercel.");
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

        // Loop di retry per gestire errori transitori (500, Internal Error)
        while (true) {
            try {
                attempt++;
                response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemInstruction,
                        // tools: [{ googleSearch: {} }], // DISABILITATO: Base sicura al 100%
                    },
                });
                break; // Se ha successo, esci dal ciclo
            } catch (apiError: any) {
                const msg = apiError.message || JSON.stringify(apiError);
                console.warn(`Tentativo ${attempt} Gemini fallito:`, msg);

                // Controlla se è un errore server (5xx) o un errore interno generico
                const isRetriable = msg.includes('500') ||
                    msg.includes('503') ||
                    msg.includes('Internal error') ||
                    msg.includes('INTERNAL') ||
                    msg.includes('Overloaded');

                if (isRetriable && attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Backoff esponenziale: 2s, 4s
                    console.log(`Riprovo tra ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }

                // Se non è riprovabile o abbiamo finito i tentativi, lancia l'errore
                throw apiError;
            }
        }

        if (response.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
            const reason = response.candidates[0].finishReason;
            console.error(`Generazione interrotta da Gemini. Motivo: ${reason}.`);

            if (reason === 'SAFETY') {
                throw new Error(`blocked:SAFETY`);
            }
            if (reason === 'MALFORMED_FUNCTION_CALL') {
                throw new Error(`malformed_function_call`);
            }
            throw new Error(`interrupted:${reason}`);
        }

        if (!response.text) {
            if (response.candidates && response.candidates.length > 0) {
                console.warn("Risposta con candidati ma senza testo. Grounding metadata:", response.candidates[0].groundingMetadata);
                throw new Error('empty_response_with_candidates');
            }
            throw new Error('empty_response');
        }

        const text = response.text.trim();

        if (text === 'no_new_leads_found') {
            throw new Error('no_new_leads_found');
        }

        // Estrazione robusta del JSON: Cerca la prima [ e l'ultima ]
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
            sector: lead.sector || Sector.OTHER, // Fallback just in case
            sources: sources || [],
        }));

    } catch (error) {
        console.error("Errore durante la generazione di lead con Gemini:", error);

        if (error instanceof SyntaxError) {
            throw new Error(
                "L'AI ha risposto in un formato non valido (probabile testo extra). Riprova."
            );
        }

        if (error instanceof Error) {
            const msg = error.message || '';

            if (msg.includes('Internal error') || msg.includes('500') || msg.includes('INTERNAL')) {
                throw new Error(
                    "Errore momentaneo sui server di Google (Internal Error). Riprova tra qualche secondo."
                );
            }
            if (msg === 'malformed_function_call') {
                throw new Error(
                    "Errore tecnico nella comunicazione con lo strumento di ricerca dell'AI (Malformed Call). Per favore riprova la ricerca."
                );
            }
            if (msg.startsWith('blocked:')) {
                const reason = msg.split(':')[1];
                throw new Error(
                    `La ricerca è stata bloccata per motivi di sicurezza (Codice: ${reason}). Prova a riformulare con termini più professionali.`
                );
            }
            if (msg.startsWith('interrupted:')) {
                const reason = msg.split(':')[1];
                throw new Error(
                    `La generazione è stata interrotta (Codice: ${reason}). Riprova.`
                );
            }
            if (msg === 'empty_response' || msg === 'empty_response_with_candidates') {
                throw new Error(
                    "L'AI non ha restituito dati leggibili. Potrebbe aver provato a cercare senza successo. Riprova."
                );
            }
            if (msg === 'no_new_leads_found') {
                throw new Error(
                    "L'AI non ha trovato nuovi lead unici per questa ricerca. Potresti averli già tutti o la ricerca era troppo specifica."
                );
            }
            if (msg.includes('API key not valid') || msg.includes('leaked')) {
                throw new Error(
                    `Errore API Key: La chiave è stata revocata o non è valida. Dettaglio: ${msg}`
                );
            }
            if (msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate') || msg.includes('429')) {
                throw new Error(
                    `Limite API raggiunto. Errore originale: ${msg}`
                );
            }
            // For other generic API errors - MOSTRA L'ERRORE ORIGINALE
            throw new Error(`Errore Gemini: ${msg}`);
        }

        throw new Error("Errore sconosciuto durante la generazione.");
    }
};