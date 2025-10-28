// supabase/functions/send-email/index.ts

// Fix: Declare Deno to resolve 'Cannot find name' error. This file runs in a Deno environment where Deno is a global object.
declare const Deno: any;

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";
import sgMail from 'npm:@sendgrid/mail';

const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
} else {
  console.error("La variabile d'ambiente SENDGRID_API_KEY non è impostata!");
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!sendGridApiKey) {
      throw new Error("Configurazione del server incompleta: API Key di SendGrid mancante.");
    }
    
    // Crea un client Supabase autenticato usando il token dell'utente dalla richiesta
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Utente non autenticato.");
    }

    const { to, subject, body, attachments } = await req.json();

    let sgAttachments = [];

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      sgAttachments = await Promise.all(
        attachments.map(async (att: { name: string, type: string }) => {
          try {
            // Usa il client autenticato per scaricare il file in modo sicuro
            const filePath = `${user.id}/${att.name}`;
            const { data: blob, error } = await supabaseClient.storage
              .from('email_attachments')
              .download(filePath);

            if (error) {
              console.error(`Impossibile scaricare l'allegato: ${filePath}`, error);
              return null;
            }
            
            const buffer = await blob.arrayBuffer();
            const content = encode(buffer);

            return {
              content: content,
              filename: att.name,
              type: att.type,
              disposition: 'attachment',
            };
          } catch (e) {
            console.error(`Errore nel processare l'allegato ${att.name}:`, e);
            return null;
          }
        })
      );
      sgAttachments = sgAttachments.filter(att => att !== null);
    }

    const msg = {
      to: to,
      from: 'info@esempiocrm.com', // <-- IMPORTANTE: Usa il tuo indirizzo verificato su SendGrid.
      subject: subject,
      html: body.replace(/\n/g, '<br>'),
      attachments: sgAttachments,
    };

    await sgMail.send(msg);

    return new Response(JSON.stringify({ message: `Email inviata a ${to}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Errore nell'invio dell'email:", error);
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
