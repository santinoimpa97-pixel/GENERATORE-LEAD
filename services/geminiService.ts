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
        ? `IMPORTANTISSIMO: Escludi questi lead perché sono già presenti nel CRM dell'utente: ${JSON.stringify(existingLeads)}.`
        : 'Non ci sono lead esistenti da escludere.';

    const systemInstruction = `
        Sei un assistente AI etico specializzato nella generazione di lead B2B (Business-to-Business) di alta qualità. La tua funzione è trovare contatti professionali e aziendali resi pubblici tramite ricerche Google e restituire i dati in un formato JSON specifico.

        **REGOLE ETICHE E DI SICUREZZA (MASSIMA PRIORITÀ):**
        1. **SOLO DATI PUBBLICI IN CONTESTO PROFESSIONALE:** Raccogli ESCLUSIVAMENTE informazioni di contatto che sono state rese pubbliche in un chiaro contesto di business. Questo include siti web aziendali, profili professionali (es. LinkedIn), e directory di settore.
        2. **DISTINZIONE DEI CONTATTI:** Il tuo obiettivo è trovare contatti per scopi commerciali. Fai questa distinzione:
           - **Contatti Aziendali (Preferiti):** Dai priorità a email generiche (es. info@..., contatti@...) e numeri di telefono fissi aziendali.
           - **Contatti Personali (Accettabili solo se Pubblici e Professionali):** Puoi includere email personali (es. @gmail.com) o numeri di cellulare **SOLO ED ESCLUSIVAMENTE** se sono stati resi pubblici dal proprietario in un contesto chiaramente professionale. Esempi validi: un libero professionista che elenca il suo cellulare e la sua Gmail sul proprio sito portfolio; un consulente che usa la sua email personale per affari. Se un contatto personale è trovato in un contesto non professionale (es. forum, social media privati), **NON INCLUDERLO**.
        3. **CONTATTO OBBLIGATORIO:** Ogni lead DEVE avere almeno un'email o un numero di telefono. Se non trovi alcun tipo di contatto pubblico che rispetti le regole sopra, il lead va SCARTATO.

        **REGOLE DI FORMATTAZIONE:**
        4. **NON INVENTARE:** Non devi MAI inventare dati. Se un'informazione non è disponibile pubblicamente, lascia il campo vuoto.
        5. **SETTORE SPECIFICO:** Assegna a ogni lead un settore scegliendo ESCLUSIVAMENTE da questa lista: [${validSectors}]. Se nessuno corrisponde, scegli 'Altro'.
        6. **FORMATO JSON PURO:** La tua risposta deve essere UNICAMENTE un array JSON. Non includere MAI testo, spiegazioni o markdown. L'output deve iniziare con '[' e finire con ']'.

        **SCHEMA DI OUTPUT PER OGNI LEAD:**
        {
          "name": "Nome ufficiale dell'azienda o del professionista.",
          "location": "Città e indirizzo, se disponibile.",
          "website": "URL del sito web ufficiale o portfolio.",
          "description": "Breve descrizione dell'attività (massimo una frase).",
          "phone": "Numero di telefono di contatto (fisso o cellulare se professionale).",
          "email": "Email di contatto (aziendale o personale se professionale).",
          "sector": "Uno dei settori validi."
        }

        Se non trovi NESSUN NUOVO lead che rispetti TUTTE queste regole, la tua UNICA risposta deve essere la stringa esatta: "no_new_leads_found".
    `;
    
    const userPrompt = `
        Trova ${count} lead commerciali unici basati sulla seguente richiesta: "${query}".
        ${exclusionList}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
            throw new Error(`interrupted:${reason}`);
        }
        
        if (!response.text) {
             if (response.candidates && response.candidates.length > 0) {
                // Gestisce il caso in cui ci sono candidati ma nessun testo, che potrebbe implicare un blocco non segnalato
                throw new Error('empty_response_with_candidates');
            }
            throw new Error('empty_response');
        }

        const text = response.text.trim();

        if (text === 'no_new_leads_found') {
            throw new Error('no_new_leads_found');
        }
        
        let jsonString = text;
        if (jsonString.startsWith('```json')) {
            jsonString = jsonString.slice(7, -3).trim();
        } else if (jsonString.startsWith('```')) {
            jsonString = jsonString.slice(3, -3).trim();
        }

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
                "L'AI ha risposto in un formato inaspettato (non JSON valido). Questo può accadere a causa di un output imprevisto del modello. Riprova la tua ricerca."
            );
        }

        if (error instanceof Error) {
            if (error.message.startsWith('blocked:')) {
                const reason = error.message.split(':')[1];
                throw new Error(
                    `La ricerca è stata bloccata per motivi di sicurezza (Codice: ${reason}). Questo accade quando la richiesta o i risultati contengono argomenti sensibili. Prova a riformulare la ricerca con termini più generici e professionali.`
                );
            }
             if (error.message.startsWith('interrupted:')) {
                const reason = error.message.split(':')[1];
                throw new Error(
                    `La generazione è stata interrotta (Codice: ${reason}). Prova a semplificare la ricerca.`
                );
            }
            if (error.message === 'empty_response' || error.message === 'empty_response_with_candidates') {
                throw new Error(
                    "L'AI ha restituito una risposta vuota. Questo è spesso causato da filtri di sicurezza molto restrittivi. Riprova o modifica i termini della ricerca per essere più specifico su contesti aziendali."
                );
            }
            if (error.message === 'no_new_leads_found') {
                throw new Error(
                    "L'AI non ha trovato nuovi lead unici per questa ricerca. Potresti averli già tutti o la ricerca era troppo specifica. Prova a usare termini diversi."
                );
            }
            if (error.message.includes('API key not valid')) {
                throw new Error(
                    "Errore di autenticazione: La tua API Key per Gemini non è valida o è scaduta. Controlla le tue impostazioni."
                );
            }
            if (error.message.toLowerCase().includes('quota')) {
                 throw new Error(
                    "Limite di richieste raggiunto: Hai superato la tua quota di utilizzo per l'API di Gemini. Attendi un po' prima di riprovare."
                );
            }
             // For other generic API errors from the SDK
            throw new Error(`Errore di comunicazione con l'AI: ${error.message}`);
        }
        
        throw new Error("Si è verificato un errore sconosciuto durante la generazione di lead. Controlla la console per i dettagli.");
    }
};