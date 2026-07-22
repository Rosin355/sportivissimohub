import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Json, PaymentStatus } from "@/lib/supabase/types";
import type { Enrollment } from "@/data/enrollments";
import { estimateForEnrollment } from "./pricing";

// Operazioni riservate all'admin: le RLS bloccano chiunque altro. Ogni azione
// scrive anche in audit_log (dati di minori: tracciabilità).

async function audit(action: string, entity: string, entityId: string, detail: Json) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_log").insert({
    actor_id: user.id,
    action,
    entity,
    entity_id: entityId,
    detail,
  });
}

export async function setDocumentStatus(
  documentId: string,
  status: "caricato" | "verificato" | "rifiutato",
  rejectionReason?: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("enrollment_documents")
    .update({
      status,
      rejection_reason: status === "rifiutato" ? (rejectionReason ?? "") : null,
    })
    .eq("id", documentId);
  if (error) throw new Error("Aggiornamento del documento non riuscito: verifica i permessi.");
  await audit("update_document_status", "enrollment_document", documentId, {
    status,
    rejection_reason: rejectionReason ?? null,
  });
}

export async function setPaymentStatus(
  enrollmentId: string,
  paymentStatus: PaymentStatus,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("enrollments")
    .update({ payment_status: paymentStatus })
    .eq("id", enrollmentId);
  if (error) throw new Error("Aggiornamento del pagamento non riuscito: verifica i permessi.");
  await audit("update_payment_status", "enrollment", enrollmentId, {
    payment_status: paymentStatus,
  });
}

/* ---------- export CSV ---------- */

function csvEscape(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function enrollmentsToCsv(list: Enrollment[]): string {
  const headers = [
    "Codice",
    "Stato",
    "Pagamento",
    "Sede",
    "Settimane",
    "Orario",
    "Residente",
    "Tessera ACSI",
    "Figlio n.",
    "Costo stimato EUR",
    "Servizi extra",
    "Bambino",
    "Sesso",
    "Nato/a a",
    "CF bambino",
    "Documento (senza CF)",
    "Data nascita",
    "Allergie",
    "Note mediche",
    "Genitore",
    "Email",
    "Telefono",
    "CF genitore",
    "Indirizzo",
    "Secondo genitore",
    "CF secondo genitore",
    "Consenso ACSI 2.4",
    "Consenso ACSI 2.5",
    "Consenso ACSI foto",
    "Data iscrizione",
  ];
  const rows = list.map((e) => {
    const estimate = estimateForEnrollment(e);
    return [
      e.code,
      e.status,
      e.paymentStatus,
      e.session.locationName,
      e.session.weekLabels.join("; "),
      e.session.timeSlot,
      e.session.residenteNelComune ? "Sì" : "No",
      e.session.tesseraTipo === "base" ? "base" : "super-integrativa",
      String(e.figlioOrdine),
      estimate ? String(estimate.total) : "",
      e.session.extras.join("; "),
      `${e.child.firstName} ${e.child.lastName}`,
      e.child.sesso || "",
      e.child.comuneNascita
        ? `${e.child.comuneNascita}${e.child.provinciaNascita ? ` (${e.child.provinciaNascita})` : ""} - ${e.child.nazioneNascita}`
        : "",
      e.child.fiscalCode,
      e.child.hasItalianCf
        ? ""
        : `${e.child.cittadinanza}; ${e.child.tipoDocumento} ${e.child.numeroDocumento}`.trim(),
      e.child.birthDate,
      e.child.allergies,
      e.child.medicalNotes,
      `${e.guardian.firstName} ${e.guardian.lastName}`,
      e.guardian.email,
      e.guardian.phone,
      e.guardian.fiscalCode,
      `${e.guardian.address}, ${e.guardian.zip} ${e.guardian.city} (${e.guardian.province})`,
      e.secondaryGuardian ? `${e.secondaryGuardian.firstName} ${e.secondaryGuardian.lastName}` : "",
      e.secondaryGuardian?.fiscalCode ?? "",
      e.consents.acsiDati24 ? "Sì" : "No",
      e.consents.acsiDati25 ? "Sì" : "No",
      e.consents.acsiFotoMarketing ? "Sì" : "No",
      new Date(e.createdAt).toLocaleDateString("it-IT"),
    ]
      .map(csvEscape)
      .join(";");
  });
  // BOM per l'apertura corretta degli accenti in Excel
  return "﻿" + [headers.map(csvEscape).join(";"), ...rows].join("\r\n");
}

export function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
