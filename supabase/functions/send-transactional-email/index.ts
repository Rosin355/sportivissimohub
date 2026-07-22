// Edge Function: email transazionali via Resend.
// Invocata da un Database Webhook su INSERT/UPDATE di public.enrollments
// (vedi supabase/README.md). Secrets richiesti: RESEND_API_KEY, EMAIL_FROM.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono iniettati automaticamente.

import { createClient } from "npm:@supabase/supabase-js@2";

type EnrollmentRecord = {
  id: string;
  code: string;
  status: string;
  parent_id: string;
  location_slug: string;
};

type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: EnrollmentRecord | null;
  old_record: EnrollmentRecord | null;
};

const STATUS_LABELS: Record<string, string> = {
  nuova: "Nuova",
  revisione: "In revisione",
  "documenti-mancanti": "Documenti mancanti",
  "attesa-pagamento": "In attesa di pagamento",
  confermata: "Confermata",
  "lista-attesa": "In lista d'attesa",
  annullata: "Annullata",
};

function locationName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function layout(title: string, body: string): string {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    <h1 style="color: #f97316; font-size: 22px; margin-bottom: 4px;">Sportivissimo A.S.D.</h1>
    <h2 style="font-size: 18px; margin-top: 0;">${title}</h2>
    <div style="font-size: 15px; color: #334155; line-height: 1.6;">${body}</div>
    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      Questa è un'email automatica: per qualsiasi domanda rispondi pure o contatta la segreteria.
    </p>
  </div>`;
}

function buildEmail(
  payload: WebhookPayload,
  firstName: string,
): { subject: string; html: string } | null {
  const rec = payload.record;
  if (!rec) return null;
  const sede = locationName(rec.location_slug);
  const saluto = firstName ? `Ciao ${firstName},` : "Ciao,";

  if (payload.type === "INSERT") {
    return {
      subject: `Iscrizione ${rec.code} ricevuta — Sportivissimo`,
      html: layout(
        "Abbiamo ricevuto la tua iscrizione! 🎉",
        `<p>${saluto}</p>
         <p>l'iscrizione <strong>${rec.code}</strong> per la sede <strong>${sede}</strong> è arrivata
         alla squadra Sportivissimo. La esamineremo al più presto: puoi seguirne lo stato in ogni
         momento dalla tua area genitori.</p>`,
      ),
    };
  }

  if (payload.type === "UPDATE" && payload.old_record && rec.status !== payload.old_record.status) {
    if (rec.status === "documenti-mancanti") {
      return {
        subject: `Documenti mancanti per l'iscrizione ${rec.code} — Sportivissimo`,
        html: layout(
          "Mancano alcuni documenti 📄",
          `<p>${saluto}</p>
           <p>per completare l'iscrizione <strong>${rec.code}</strong> (sede ${sede}) mancano ancora
           alcuni documenti. Accedi alla tua area genitori e caricali quando vuoi: bastano pochi
           minuti.</p>`,
        ),
      };
    }
    const label = STATUS_LABELS[rec.status] ?? rec.status;
    return {
      subject: `Aggiornamento iscrizione ${rec.code}: ${label} — Sportivissimo`,
      html: layout(
        "La tua iscrizione è stata aggiornata",
        `<p>${saluto}</p>
         <p>lo stato dell'iscrizione <strong>${rec.code}</strong> (sede ${sede}) è ora:
         <strong>${label}</strong>.</p>
         <p>Trovi tutti i dettagli nella tua area genitori.</p>`,
      ),
    };
  }

  return null;
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    if (payload.table !== "enrollments" || !payload.record) {
      return Response.json({ skipped: true });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY non configurata nei secrets.");
      return Response.json({ error: "missing RESEND_API_KEY" }, { status: 500 });
    }

    // Client service-role: serve solo a leggere l'email del genitore.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name")
      .eq("id", payload.record.parent_id)
      .maybeSingle();
    if (!profile?.email) {
      console.error("Email del genitore non trovata per", payload.record.parent_id);
      return Response.json({ skipped: true, reason: "no parent email" });
    }

    const message = buildEmail(payload, profile.first_name ?? "");
    if (!message) return Response.json({ skipped: true, reason: "no template for event" });

    const from = Deno.env.get("EMAIL_FROM") ?? "Sportivissimo <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [profile.email],
        subject: message.subject,
        html: message.html,
      }),
    });
    if (!res.ok) {
      console.error("Errore Resend:", res.status, await res.text());
      return Response.json({ error: "resend failed" }, { status: 502 });
    }
    return Response.json({ sent: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "bad request" }, { status: 400 });
  }
});
