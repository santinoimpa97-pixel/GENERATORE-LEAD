import { GoogleGenAI } from "@google/genai";
import { Lead, Source, Sector } from '../types';

// Implementazione di un fallback per consentire lo sviluppo locale e la produzione.
// Vercel utilizzerà la variabile API_KEY, mentre l'anteprima locale userà il valore segnaposto.
// L'utente deve sostituire questo segnaposto per far funzionare l'anteprima.
const apiKey = process.env.API_KEY || "AIzaSyCZQEn1PJQwko91jg2rx-zPWxyKCB7iSr4";

// Il controllo per la chiave segnaposto è stato rimosso per consentire il funzionamento dell'anteprima.
// In un ambiente di produzione, è necessario impostare una API_KEY valida.
export const geminiConnectionError = !apiKey
    ? "La variabile d'ambiente API_KEY è obbligatoria." 
    : null;

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateLeads = async (query: string, count: number, existingLeads: { name: string; location: string }[]): Promise<Partial<Lead>[]> => {
    if (!ai) {
        throw new Error("La chiave API di Gemini non è configurata. Imposta API_KEY nelle tue variabili d'ambiente o nel file di servizio.");
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
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                tools: [{ googleSearch: {} }],
            },
        });

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
            if (error.message === 'malformed_function_call') {
                throw new Error(
                    "Errore tecnico nella comunicazione con lo strumento di ricerca dell'AI (Malformed Call). Per favore riprova la ricerca."
                );
            }
            if (error.message.startsWith('blocked:')) {
                const reason = error.message.split(':')[1];
                throw new Error(
                    `La ricerca è stata bloccata per motivi di sicurezza (Codice: ${reason}). Prova a riformulare con termini più professionali.`
                );
            }
             if (error.message.startsWith('interrupted:')) {
                const reason = error.message.split(':')[1];
                throw new Error(
                    `La generazione è stata interrotta (Codice: ${reason}). Riprova.`
                );
            }
            if (error.message === 'empty_response' || error.message === 'empty_response_with_candidates') {
                throw new Error(
                    "L'AI non ha restituito dati leggibili. Potrebbe aver provato a cercare senza successo. Riprova."
                );
            }
            if (error.message === 'no_new_leads_found') {
                throw new Error(
                    "L'AI non ha trovato nuovi lead unici per questa ricerca. Potresti averli già tutti o la ricerca era troppo specifica."
                );
            }
            if (error.message.includes('API key not valid')) {
                throw new Error(
                    "Errore di autenticazione: API Key non valida."
                );
            }
            if (error.message.toLowerCase().includes('quota')) {
                 throw new Error(
                    "Hai superato la tua quota di utilizzo API. Attendi qualche minuto."
                );
            }
             // For other generic API errors
            throw new Error(`Errore AI: ${error.message}`);
        }
        
        throw new Error("Errore sconosciuto durante la generazione.");
    }
};