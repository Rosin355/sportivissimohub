import type { Enrollment, GuardianData } from "../../../data/enrollments";
import type { Location } from "../../../data/locations";
import { sexFromFiscalCode } from "../../enrollments/fiscal-code.ts";
import {
  check,
  text,
  stripAnnotationsOnBox,
  type CheckField,
  type OverlayOp,
  type TextField,
} from "./engine.ts";

// Mappa coordinate del modulo cartaceo "Il colore del gioco" 2026 (Galzignano
// Terme): assets/pdf-templates/galzignano-2026.pdf, 4 pagine A4.
//   p1  regolamento (nessun campo)
//   p2  note informative allergie/necessità particolari
//   p3  modulo iscrizione centro estivo
//   p4  modulo ACSI di tesseramento per conto di minore (uguale per tutte le sedi)
// Coordinate in punti PDF, origine in basso a sinistra. Per ricalibrare:
// node scripts/pdf-calibrate.ts (griglia + campi evidenziati + dati di prova).

export const GALZIGNANO_2026 = {
  locationSlug: "galzignano-terme",
  asset: "assets/pdf-templates/galzignano-2026.pdf",
  pages: 4,
  acsiPage: 4,
} as const;

const line = (page: number, x: number, y: number, w: number, size = 10): TextField => ({
  page,
  size,
  slots: [{ x, y, w }],
});
const lines = (page: number, slots: Array<[number, number, number]>, size = 10): TextField => ({
  page,
  size,
  slots: slots.map(([x, y, w]) => ({ x, y, w })),
});
const box = (page: number, x: number, y: number, s: number): CheckField => ({ page, x, y, s });

/* ---------- p2: note informative allergie ---------- */

const P2 = {
  nomeCognome: line(2, 198, 599.5, 246),
  natoA: line(2, 89.5, 576.5, 189),
  natoIl: line(2, 295, 576.5, 125),
  // Righe Sì/No (caselle 7.5 pt): Sì a x=473, No a x=547.5
  rows: {
    sport: 470.7,
    laboratorio: 424.7,
    asma: 378.4,
    epilessia: 332.7,
    allergia: 309.6,
    intolleranza: 263.4,
    certificazione: 217.6,
  },
  siX: 473.0,
  noX: 547.5,
  boxSize: 7.5,
  allergiaTesto: line(2, 112, 289, 345, 9),
  intolleranzaTesto: line(2, 246, 241, 211, 9),
  particolarita: lines(
    2,
    [
      [305, 172, 152],
      [60, 151, 397],
    ],
    9,
  ),
};

/* ---------- p3: modulo iscrizione ---------- */

const P3 = {
  nome: line(3, 92, 702.5, 176),
  cognome: line(3, 320, 702.5, 228),
  natoA: line(3, 93, 681.5, 217),
  natoProv: line(3, 315.5, 681.5, 19, 9),
  natoIl: line(3, 423, 681.5, 125),
  indirizzo: lines(3, [
    [175, 661, 372],
    [66, 640, 482],
  ]),
  classe: line(3, 204, 619.5, 347),
  mamma: line(3, 220, 598.5, 332),
  papa: line(3, 162, 578, 390),
  telMamma: line(3, 203, 557, 125),
  telPapa: line(3, 374, 557, 177),
  ritiro: line(3, 250, 516, 300),
  // Settimane: una riga per settimana (1..9), caselle 8.5 pt
  weekRowsY: [402.2, 388.7, 375.2, 362.2, 348.4, 335.9, 322.9, 310.1, 295.6],
  halfDayX: 210.5,
  fullDayX: 352.2,
  weekBoxSize: 8.5,
  tesseraBase: box(3, 209.1, 243.4, 8.5),
  tesseraSuper: box(3, 209.3, 230.1, 8.5),
  note: lines(
    3,
    [
      [226, 197, 333],
      [201, 184, 358],
      [201, 171.3, 350],
    ],
    9,
  ),
};

/* ---------- p4: modulo ACSI minore ---------- */

const P4 = {
  tesseraBaseSport: box(4, 169.5, 771.8, 10.8),
  tesseraIntegrativa: box(4, 330.8, 771.8, 10.8),
  g1Nome: line(4, 60, 713.5, 140),
  g1Cognome: line(4, 213, 713.5, 178),
  g1Cf: line(4, 404, 713.5, 131),
  g1Via: line(4, 60.5, 677.5, 363),
  g1Comune: line(4, 439, 677.5, 96),
  g1Prov: line(4, 60.5, 637.2, 27),
  g1Cap: line(4, 99, 637.2, 38),
  g1Email: line(4, 151.5, 637.2, 272),
  g1Tel: line(4, 439, 637.2, 96),
  g2Nome: line(4, 58.5, 550, 140),
  g2Cognome: line(4, 212, 550, 178),
  g2Cf: line(4, 402.5, 550, 131),
  g2Coincide: box(4, 56.5, 505.6, 17),
  g2Via: line(4, 58.5, 478.7, 363),
  g2Comune: line(4, 438, 478.7, 96),
  g2Prov: line(4, 59, 438.4, 20),
  g2Cap: line(4, 92, 438.4, 30),
  mNome: line(4, 58.5, 370, 191),
  mCognome: line(4, 263.5, 370, 195),
  mNascita: line(4, 473, 370, 61, 9),
  mComune: line(4, 57.8, 332.6, 155),
  mProv: line(4, 228, 332.6, 22),
  mCf: line(4, 263.5, 332.6, 270),
  // Consensi: il PDF ha già una X (annotazione) su "prestare" (2.4, 2.5) e su
  // "non autorizzare" (foto): vanno rimosse e ridisegnate secondo i consensi.
  c24Si: box(4, 55.8, 180.8, 10.2),
  c24No: box(4, 189.0, 180.8, 10.2),
  c25Si: box(4, 55.8, 158.2, 10.2),
  c25No: box(4, 189.0, 158.2, 10.2),
  fotoSi: box(4, 55.8, 138.8, 10.2),
  fotoNo: box(4, 189.0, 138.8, 10.2),
};

/* ---------- helper dati ---------- */

function itDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function fullName(g: GuardianData | null | undefined): string {
  return g ? `${g.firstName} ${g.lastName}`.trim() : "";
}

function residence(g: GuardianData): string {
  if (!g.address && !g.city) return "";
  return `${g.address}, ${g.zip} ${g.city} (${g.province})`.replace(/\s+/g, " ").trim();
}

function birthPlace(e: Enrollment): string {
  const c = e.child;
  if (!c.comuneNascita) return "";
  const estero =
    c.nazioneNascita && !/^italia$/i.test(c.nazioneNascita) ? ` - ${c.nazioneNascita}` : "";
  return `${c.comuneNascita}${estero}`;
}

function sameResidence(a: GuardianData, b: GuardianData): boolean {
  const key = (g: GuardianData) =>
    `${g.address}|${g.zip}|${g.city}`.toLowerCase().replace(/\s+/g, " ").trim();
  return key(a) === key(b);
}

// Il modulo comunale ha righe "mamma" e "papà": il sesso dei genitori si
// ricava dal codice fiscale; se non è determinabile si va in ordine.
function motherFather(e: Enrollment): { mamma: GuardianData | null; papa: GuardianData | null } {
  const g1 = e.guardian;
  const g2 = e.secondaryGuardian;
  let mamma: GuardianData | null = null;
  let papa: GuardianData | null = null;
  for (const g of [g1, g2]) {
    if (!g) continue;
    const sex = sexFromFiscalCode(g.fiscalCode);
    if (sex === "F" && !mamma) mamma = g;
    else if (sex === "M" && !papa) papa = g;
  }
  for (const g of [g1, g2]) {
    if (!g || g === mamma || g === papa) continue;
    if (!mamma) mamma = g;
    else if (!papa) papa = g;
  }
  return { mamma, papa };
}

function isHalfDay(timeSlot: string): boolean {
  return /mezza/i.test(timeSlot);
}

/* ---------- operazioni ---------- */

// Pagine 2 e 3: note informative + modulo iscrizione del Comune. La sede
// serve per tradurre i codici settimana nelle righe del modulo.
export function galzignanoEnrollmentOps(
  e: Enrollment,
  loc: Pick<Location, "weeks"> | null,
): OverlayOp[] {
  const ops: OverlayOp[] = [];
  const c = e.child;
  const childName = `${c.firstName} ${c.lastName}`.trim();

  // p2 — note informative. Le caselle Sì/No vengono spuntate solo quando
  // l'iscrizione contiene un'informazione positiva: nessun "No" dedotto.
  ops.push(text(P2.nomeCognome, childName));
  ops.push(text(P2.natoA, birthPlace(e) + (c.provinciaNascita ? ` (${c.provinciaNascita})` : "")));
  ops.push(text(P2.natoIl, itDate(c.birthDate)));
  if (c.allergies.trim()) {
    ops.push(check(box(2, P2.siX, P2.rows.allergia, P2.boxSize), true));
    ops.push(text(P2.allergiaTesto, c.allergies));
  }
  const particolarita = [c.medicalNotes.trim(), c.specialNeeds.trim()].filter(Boolean).join(" - ");
  if (particolarita) ops.push(text(P2.particolarita, particolarita));

  // p3 — modulo iscrizione
  ops.push(text(P3.nome, c.firstName));
  ops.push(text(P3.cognome, c.lastName));
  ops.push(text(P3.natoA, birthPlace(e)));
  ops.push(text(P3.natoProv, c.provinciaNascita));
  ops.push(text(P3.natoIl, itDate(c.birthDate)));
  ops.push(text(P3.indirizzo, residence(e.guardian)));
  ops.push(text(P3.classe, [c.grade, c.school].filter(Boolean).join(" - ")));

  const { mamma, papa } = motherFather(e);
  ops.push(text(P3.mamma, fullName(mamma)));
  ops.push(text(P3.papa, fullName(papa)));
  ops.push(text(P3.telMamma, mamma?.phone ?? ""));
  ops.push(text(P3.telPapa, papa?.phone ?? ""));
  ops.push(
    text(P3.ritiro, e.delegates.map((d) => `${d.firstName} ${d.lastName} (${d.phone})`).join(", ")),
  );

  const half = isHalfDay(e.session.timeSlot);
  for (const id of e.session.weekIds) {
    const number = loc?.weeks.find((w) => w.id === id)?.number;
    if (!number || number < 1 || number > P3.weekRowsY.length) continue;
    const y = P3.weekRowsY[number - 1];
    ops.push(check(box(3, half ? P3.halfDayX : P3.fullDayX, y, P3.weekBoxSize), true));
  }
  ops.push(check(P3.tesseraBase, e.session.tesseraTipo === "base"));
  ops.push(check(P3.tesseraSuper, e.session.tesseraTipo === "super_integrativa"));

  const extras = e.session.extras.length ? ` Servizi extra: ${e.session.extras.join(", ")}.` : "";
  ops.push(
    text(
      P3.note,
      `Iscrizione online ${e.code}. Residente nel Comune: ${e.session.residenteNelComune ? "sì" : "no"}. Figlio n. ${e.figlioOrdine}.${extras}`,
    ),
  );
  return ops;
}

// Pagina 4: modulo ACSI di tesseramento per conto di minore.
export function acsiMinorOps(e: Enrollment): OverlayOp[] {
  const ops: OverlayOp[] = [];
  const g1 = e.guardian;
  const g2 = e.secondaryGuardian;
  const c = e.child;

  ops.push(check(P4.tesseraBaseSport, e.session.tesseraTipo === "base"));
  ops.push(check(P4.tesseraIntegrativa, e.session.tesseraTipo === "super_integrativa"));

  ops.push(text(P4.g1Nome, g1.firstName));
  ops.push(text(P4.g1Cognome, g1.lastName));
  ops.push(text(P4.g1Cf, g1.fiscalCode));
  ops.push(text(P4.g1Via, g1.address));
  ops.push(text(P4.g1Comune, g1.city));
  ops.push(text(P4.g1Prov, g1.province));
  ops.push(text(P4.g1Cap, g1.zip));
  ops.push(text(P4.g1Email, g1.email));
  ops.push(text(P4.g1Tel, g1.phone));

  if (g2) {
    ops.push(text(P4.g2Nome, g2.firstName));
    ops.push(text(P4.g2Cognome, g2.lastName));
    ops.push(text(P4.g2Cf, g2.fiscalCode));
    if (sameResidence(g1, g2)) {
      ops.push(check(P4.g2Coincide, true));
    } else {
      ops.push(text(P4.g2Via, g2.address));
      ops.push(text(P4.g2Comune, g2.city));
      ops.push(text(P4.g2Prov, g2.province));
      ops.push(text(P4.g2Cap, g2.zip));
    }
  }

  ops.push(text(P4.mNome, c.firstName));
  ops.push(text(P4.mCognome, c.lastName));
  ops.push(text(P4.mNascita, itDate(c.birthDate)));
  ops.push(text(P4.mComune, birthPlace(e)));
  ops.push(text(P4.mProv, c.provinciaNascita));
  ops.push(
    text(
      P4.mCf,
      c.hasItalianCf
        ? c.fiscalCode
        : `Senza CF italiano - ${c.tipoDocumento} n. ${c.numeroDocumento} (${c.cittadinanza})`,
    ),
  );

  // Consensi: le X di default sono annotazioni FreeText sopra le caselle
  // (2.4 sì, 2.5 sì, foto no): si rimuovono e si ridisegnano le scelte reali.
  ops.push(
    stripAnnotationsOnBox(P4.c24Si),
    stripAnnotationsOnBox(P4.c25Si),
    stripAnnotationsOnBox(P4.fotoNo),
  );
  ops.push(check(P4.c24Si, e.consents.acsiDati24), check(P4.c24No, !e.consents.acsiDati24));
  ops.push(check(P4.c25Si, e.consents.acsiDati25), check(P4.c25No, !e.consents.acsiDati25));
  ops.push(
    check(P4.fotoSi, e.consents.acsiFotoMarketing),
    check(P4.fotoNo, !e.consents.acsiFotoMarketing),
  );
  return ops;
}
