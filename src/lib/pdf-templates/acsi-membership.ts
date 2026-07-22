import type { Enrollment, GuardianData } from "@/data/enrollments";
import { PdfBuilder, BLANK } from "./layout";
import { ASSOCIAZIONE } from "./config";

function guardianBlock(pdf: PdfBuilder, title: string, g: GuardianData | null) {
  pdf.section(title);
  pdf.kvPair("Cognome", g?.lastName ?? "", "Nome", g?.firstName ?? "");
  pdf.kv("Codice fiscale", g?.fiscalCode ?? "");
  pdf.kv(
    "Residenza",
    g && (g.address || g.city) ? `${g.address}, ${g.zip} ${g.city} (${g.province})` : "",
  );
  pdf.kvPair("Email", g?.email ?? "", "Telefono", g?.phone ?? "");
}

// Modulo di tesseramento ACSI per conto di minore. Per iscrizioni precedenti
// alla M9.1 i campi mancanti restano in bianco, da completare a mano.
export async function buildAcsiMembershipPdf(e: Enrollment): Promise<Uint8Array> {
  const pdf = await PdfBuilder.create();

  pdf.header(
    "Modulo di tesseramento ACSI per conto di minore",
    `Sodalizio: ${ASSOCIAZIONE.denominazione} — C.F. ${ASSOCIAZIONE.codiceFiscale} — ${ASSOCIAZIONE.enteAffiliazione}. Iscrizione ${e.code}.`,
    ASSOCIAZIONE.denominazione,
  );

  guardianBlock(pdf, "Genitore / tutore 1 (richiedente)", e.guardian);
  guardianBlock(pdf, "Genitore / tutore 2", e.secondaryGuardian);

  pdf.section("Dati del minore da tesserare");
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
    pdf.kv("Minore senza codice fiscale italiano", "Sì");
    pdf.kvPair(
      "Cittadinanza",
      e.child.cittadinanza,
      "Nazione di residenza",
      e.child.nazioneResidenza,
    );
    pdf.kvPair(
      "Tipo documento",
      e.child.tipoDocumento,
      "Numero documento",
      e.child.numeroDocumento,
    );
  }

  pdf.section("Tipo di tessera richiesta");
  pdf.checkbox("Tessera base", e.session.tesseraTipo === "base");
  pdf.checkbox(
    "Tessera super-integrativa (massimali assicurativi maggiorati)",
    e.session.tesseraTipo === "super_integrativa",
  );

  pdf.section("Consensi al trattamento dei dati (informativa ACSI)");
  pdf.checkbox(
    "ACCONSENTO al trattamento dei dati personali del minore per il tesseramento e le finalità istituzionali ACSI (punto 2.4 dell'informativa) — consenso necessario al tesseramento",
    e.consents.acsiDati24,
  );
  pdf.checkbox(
    "ACCONSENTO alle comunicazioni su iniziative, convenzioni e attività promosse da ACSI (punto 2.5 dell'informativa) — facoltativo",
    e.consents.acsiDati25,
  );
  pdf.checkbox(
    "AUTORIZZO l'utilizzo e la diffusione di immagini e video del minore per finalità promozionali ACSI — facoltativo",
    e.consents.acsiFotoMarketing,
  );

  pdf.spacer(6);
  pdf.paragraph(
    "Il/La sottoscritto/a, in qualità di esercente la responsabilità genitoriale, chiede il tesseramento del minore sopra indicato e dichiara che i dati riportati corrispondono al vero.",
  );
  pdf.signatures([`Data: ${BLANK}`, "Firma del genitore 1", "Firma del genitore 2"]);

  return pdf.bytes();
}
