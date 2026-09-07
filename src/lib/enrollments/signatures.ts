import type { Enrollment, EnrollmentSignature } from "@/data/enrollments";
import type { SignerRole } from "@/lib/supabase/types";

// Firma elettronica semplice: regole condivise tra area genitori, admin,
// server function e PDF. La firma NON è obbligatoria per l'iscrizione.

export const SIGNATURE_CONSENT_TEXT =
  "Apponendo la firma dichiaro di sottoscrivere i moduli indicati e confermo i consensi espressi in fase di iscrizione online.";

export const SIGNER_ROLE_LABELS: Record<SignerRole, string> = {
  genitore_1: "Genitore 1 (titolare dell'account)",
  genitore_2: "Genitore 2",
};

// Firmatari previsti per l'iscrizione: il titolare sempre, il secondo
// genitore solo se indicato nel modulo.
export function expectedSigners(e: Enrollment): Array<{ role: SignerRole; name: string }> {
  const list: Array<{ role: SignerRole; name: string }> = [
    { role: "genitore_1", name: `${e.guardian.firstName} ${e.guardian.lastName}`.trim() },
  ];
  if (e.secondaryGuardian) {
    list.push({
      role: "genitore_2",
      name: `${e.secondaryGuardian.firstName} ${e.secondaryGuardian.lastName}`.trim(),
    });
  }
  return list;
}

// Firma più recente per ruolo (le precedenti restano conservate).
export function latestSignatures(e: Enrollment): Partial<Record<SignerRole, EnrollmentSignature>> {
  const out: Partial<Record<SignerRole, EnrollmentSignature>> = {};
  for (const s of [...e.signatures].sort((a, b) => b.signedAt.localeCompare(a.signedAt))) {
    if (!out[s.signerRole]) out[s.signerRole] = s;
  }
  return out;
}

export type SignatureStatus = "assente" | "parziale" | "completa";

export function signatureStatus(e: Enrollment): SignatureStatus {
  const expected = expectedSigners(e);
  const latest = latestSignatures(e);
  const done = expected.filter((s) => latest[s.role]).length;
  if (done === 0) return "assente";
  return done === expected.length ? "completa" : "parziale";
}

export const SIGNATURE_STATUS_LABELS: Record<SignatureStatus, string> = {
  assente: "Moduli non firmati",
  parziale: "Firma parziale",
  completa: "Moduli firmati",
};

export function formatSignedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
}

export function signedCaption(name: string, iso: string): string {
  return `Firmato elettronicamente da ${name} il ${formatSignedAt(iso)}`;
}
