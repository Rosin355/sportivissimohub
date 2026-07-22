import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getLocationBySlug } from "@/data/locations";
import { enrollmentSubmissionSchema, type EnrollmentSubmission } from "./validation";

export type SubmitEnrollmentResult =
  | { ok: true; id: string; code: string }
  | { ok: false; error: string };

// Submit del wizard: profilo genitore, upsert figlio, iscrizione e delegati.
// La validazione zod viene rieseguita qui (inputValidator) e i vincoli di sede,
// settimane e orari vengono ricontrollati server-side: il client non è fidato.
export const submitEnrollment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown): EnrollmentSubmission => enrollmentSubmissionSchema.parse(input))
  .handler(async ({ data }): Promise<SubmitEnrollmentResult> => {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Devi accedere per inviare l'iscrizione." };
    }

    const loc = getLocationBySlug(data.session.locationSlug);
    if (!loc) return { ok: false, error: "Sede non valida." };

    const validWeeks = new Set(loc.weeks.map((w) => w.id));
    if (!data.session.weekIds.every((id) => validWeeks.has(id))) {
      return { ok: false, error: "Una o più settimane selezionate non sono valide." };
    }
    if (!loc.timeSlots.includes(data.session.timeSlot)) {
      return { ok: false, error: "Fascia oraria non valida." };
    }
    const validExtras = new Set(loc.extraServices.map((e) => e.id));
    if (!data.session.extras.every((id) => validExtras.has(id))) {
      return { ok: false, error: "Uno o più servizi extra non sono validi." };
    }

    // Il wizard è la fonte più aggiornata dei dati anagrafici del genitore.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: data.guardian.firstName,
        last_name: data.guardian.lastName,
        phone: data.guardian.phone,
        fiscal_code: data.guardian.fiscalCode.toUpperCase(),
        address: data.guardian.address,
        city: data.guardian.city,
        province: data.guardian.province.toUpperCase(),
        zip: data.guardian.zip,
      })
      .eq("id", user.id);
    if (profileError) {
      return { ok: false, error: "Impossibile salvare i dati del genitore. Riprova." };
    }

    // Upsert del figlio per (genitore, codice fiscale): riusabile tra iscrizioni.
    const childFiscalCode = data.child.fiscalCode.toUpperCase();
    const childRecord = {
      first_name: data.child.firstName,
      last_name: data.child.lastName,
      birth_date: data.child.birthDate,
      fiscal_code: childFiscalCode,
      school: data.child.school,
      grade: data.child.grade,
      allergies: data.child.allergies,
      medical_notes: data.child.medicalNotes,
      special_needs: data.child.specialNeeds,
    };
    const { data: existingChild } = await supabase
      .from("children")
      .select("id")
      .eq("parent_id", user.id)
      .eq("fiscal_code", childFiscalCode)
      .maybeSingle();

    let childId: string;
    if (existingChild) {
      childId = existingChild.id;
      const { error } = await supabase.from("children").update(childRecord).eq("id", childId);
      if (error) return { ok: false, error: "Impossibile salvare i dati del bambino. Riprova." };
    } else {
      const { data: inserted, error } = await supabase
        .from("children")
        .insert({ ...childRecord, parent_id: user.id })
        .select("id")
        .single();
      if (error || !inserted) {
        return { ok: false, error: "Impossibile salvare i dati del bambino. Riprova." };
      }
      childId = inserted.id;
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .insert({
        parent_id: user.id,
        child_id: childId,
        location_slug: loc.slug,
        week_ids: data.session.weekIds,
        time_slot: data.session.timeSlot,
        extras: data.session.extras,
        consent_privacy: data.consents.privacy,
        consent_photos: data.consents.photos,
        consent_outings: data.consents.outings,
        consent_rules: data.consents.rules,
        consent_data_processing: data.consents.dataProcessing,
      })
      .select("id, code")
      .single();
    if (enrollmentError || !enrollment) {
      return { ok: false, error: "Impossibile salvare l'iscrizione. Riprova tra qualche istante." };
    }

    if (data.delegates.length > 0) {
      const { error: delegatesError } = await supabase.from("pickup_delegates").insert(
        data.delegates.map((d) => ({
          enrollment_id: enrollment.id,
          first_name: d.firstName,
          last_name: d.lastName,
          phone: d.phone,
          document: d.document,
        })),
      );
      if (delegatesError) {
        // L'iscrizione è già salvata: segnala senza bloccare la conferma.
        console.error("Errore salvataggio delegati:", delegatesError);
      }
    }

    return { ok: true, id: enrollment.id, code: enrollment.code };
  });

export type SignedUrlResult = { ok: true; url: string } | { ok: false; error: string };

// Download sempre via URL firmato a scadenza breve, generato server-side.
// Le RLS decidono chi può vedere il documento (genitore proprietario o admin).
export const getDocumentDownloadUrl = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ documentId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<SignedUrlResult> => {
    const supabase = getSupabaseServerClient();
    const { data: doc } = await supabase
      .from("enrollment_documents")
      .select("storage_path")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!doc) return { ok: false, error: "Documento non trovato o non accessibile." };

    const { data: signed, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.storage_path, 60);
    if (error || !signed) {
      return { ok: false, error: "Impossibile generare il link di download." };
    }
    return { ok: true, url: signed.signedUrl };
  });
