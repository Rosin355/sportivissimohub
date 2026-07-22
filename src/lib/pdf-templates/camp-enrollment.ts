import type { Enrollment } from "@/data/enrollments";
import { estimateForEnrollment } from "@/lib/enrollments/pricing";
import { PdfBuilder, BLANK } from "./layout";
import { ASSOCIAZIONE } from "./config";

// Modulo di iscrizione al centro estivo, precompilato con i dati del wizard.
export async function buildCampEnrollmentPdf(e: Enrollment): Promise<Uint8Array> {
  const pdf = await PdfBuilder.create();
  const estimate = estimateForEnrollment(e);

  pdf.header(
    `Modulo di iscrizione — Centro estivo ${e.session.locationName}`,
    `Iscrizione ${e.code} del ${new Date(e.createdAt).toLocaleDateString("it-IT")} — stato: ${e.status}.`,
    ASSOCIAZIONE.denominazione,
  );

  pdf.section("Dati del bambino/a");
  pdf.kvPair("Cognome", e.child.lastName, "Nome", e.child.firstName);
  pdf.kvPair(
    "Data di nascita",
    e.child.birthDate,
    "Sesso",
    e.child.sesso === "M" ? "Maschio" : e.child.sesso === "F" ? "Femmina" : "",
  );
  pdf.kv(
    "Luogo di nascita",
    e.child.comuneNascita
      ? `${e.child.comuneNascita}${e.child.provinciaNascita ? ` (${e.child.provinciaNascita})` : ""} — ${e.child.nazioneNascita}`
      : "",
  );
  if (e.child.hasItalianCf) {
    pdf.kv("Codice fiscale", e.child.fiscalCode);
  } else {
    pdf.kv(
      "Documento (minore senza CF italiano)",
      `${e.child.tipoDocumento} ${e.child.numeroDocumento} — cittadinanza ${e.child.cittadinanza}`.trim(),
    );
  }
  pdf.kv(
    "Residenza",
    e.guardian.address
      ? `${e.guardian.address}, ${e.guardian.zip} ${e.guardian.city} (${e.guardian.province})`
      : "",
  );
  pdf.kvPair("Scuola frequentata", e.child.school, "Classe", e.child.grade);
  pdf.kv("Allergie / intolleranze", e.child.allergies || "Nessuna segnalata");
  pdf.kv("Note mediche", e.child.medicalNotes || "Nessuna segnalata");
  pdf.kv("Bisogni specifici", e.child.specialNeeds || "Nessuno segnalato");

  pdf.section("Genitori / tutori");
  pdf.kv("Genitore 1", `${e.guardian.firstName} ${e.guardian.lastName}`.trim());
  pdf.kvPair("Telefono", e.guardian.phone, "Email", e.guardian.email);
  pdf.kv(
    "Genitore 2",
    e.secondaryGuardian ? `${e.secondaryGuardian.firstName} ${e.secondaryGuardian.lastName}` : "",
  );
  if (e.secondaryGuardian) {
    pdf.kvPair("Telefono", e.secondaryGuardian.phone, "Email", e.secondaryGuardian.email);
  }

  pdf.section("Persone delegate al ritiro");
  if (e.delegates.length === 0) {
    pdf.kv("Delegati", "Nessuno: il ritiro è consentito solo ai genitori");
  } else {
    for (const d of e.delegates) {
      pdf.kv(
        `${d.firstName} ${d.lastName}`,
        `tel. ${d.phone}${d.document ? ` — documento ${d.document}` : ""}`,
      );
    }
  }

  pdf.section("Settimane e servizi scelti");
  pdf.kv("Settimane", e.session.weekLabels.join(", ") || e.session.weekIds.join(", "));
  pdf.kv("Fascia oraria", e.session.timeSlot);
  pdf.kvPair(
    "Residente nel comune",
    e.session.residenteNelComune ? "Sì" : "No",
    "Tesseramento",
    e.session.tesseraTipo === "base" ? "Tessera base" : "Tessera super-integrativa",
  );
  pdf.kv("Servizi extra", e.session.extras.join(", ") || "Nessuno");
  if (estimate) {
    pdf.kv(
      "Costo stimato",
      `EUR ${estimate.total} (${estimate.weeks} settimana/e x EUR ${estimate.perWeek}${
        estimate.siblingDiscountPerWeek > 0
          ? ` - EUR ${estimate.siblingDiscountPerWeek}/sett. sconto fratelli`
          : ""
      } + tessera EUR ${estimate.membership}${estimate.extras > 0 ? ` + extra EUR ${estimate.extras}` : ""})`,
    );
  }
  pdf.kv("Note", e.adminNotes ?? "");

  pdf.spacer(6);
  pdf.paragraph(
    "Il/La sottoscritto/a chiede l'iscrizione del minore al centro estivo indicato, dichiara di aver preso visione del regolamento e conferma i consensi espressi in fase di iscrizione online.",
  );
  pdf.signatures([`Data: ${BLANK}`, "Firma del genitore"]);

  return pdf.bytes();
}
