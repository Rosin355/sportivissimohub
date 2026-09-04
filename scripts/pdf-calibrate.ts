// Calibrazione dell'overlay sul modulo cartaceo Galzignano 2026.
//
//   node scripts/pdf-calibrate.ts [--no-grid] [--no-outline] [--acsi] [output.pdf]
//
// Genera il template con griglia di coordinate (linee ogni 10 pt, etichette
// ogni 50 pt), contorno dei campi mappati (rosso testo, blu caselle) e dati di
// prova compilati. Aprire il PDF e confrontarlo con il modulo cartaceo; le
// coordinate si correggono in src/lib/pdf-templates/overlay/galzignano-2026.ts.
// Node >= 22.18 esegue i .ts direttamente (type stripping).
import fs from "node:fs";
import path from "node:path";
import type { Enrollment } from "../src/data/enrollments";
import { renderOverlay } from "../src/lib/pdf-templates/overlay/engine.ts";
import {
  GALZIGNANO_2026,
  acsiMinorOps,
  galzignanoEnrollmentOps,
} from "../src/lib/pdf-templates/overlay/galzignano-2026.ts";

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const out = args.find((a) => !a.startsWith("--")) ?? "galzignano-2026-calibrazione.pdf";

const root = path.resolve(import.meta.dirname, "..");
const template = new Uint8Array(fs.readFileSync(path.join(root, GALZIGNANO_2026.asset)));

// Dati di prova volutamente lunghi per verificare adattamento e a capo.
const sample: Enrollment = {
  id: "00000000-0000-0000-0000-000000000000",
  code: "ENR-2026-0042",
  createdAt: "2026-04-12T10:00:00.000Z",
  status: "confermata",
  paymentStatus: "acconto",
  figlioOrdine: 2,
  guardian: {
    firstName: "Maria Francesca",
    lastName: "Rossi Bianchi",
    email: "maria.rossi.bianchi@example.com",
    phone: "+39 340 1234567",
    fiscalCode: "RSSMFR85T45G224X",
    address: "Via dei Colli Euganei 123/B",
    city: "Galzignano Terme",
    province: "PD",
    zip: "35030",
  },
  secondaryGuardian: {
    firstName: "Giovanni",
    lastName: "Verdi",
    email: "giovanni.verdi@example.com",
    phone: "+39 333 7654321",
    fiscalCode: "VRDGNN83A01L840W",
    address: "Piazza della Repubblica 4",
    city: "Battaglia Terme",
    province: "PD",
    zip: "35041",
  },
  child: {
    firstName: "Alessandro Maria",
    lastName: "Rossi Verdi",
    birthDate: "2017-09-23",
    fiscalCode: "RSSLSN17P23G224Y",
    age: 8,
    school: "Scuola primaria G. Marconi",
    grade: "3ª primaria",
    allergies: "Allergia alle arachidi e alla frutta a guscio (porta EpiPen)",
    medicalNotes: "Asma da sforzo lieve: inalatore nello zaino, usare prima di attività intense.",
    specialNeeds: "Preferisce gruppi piccoli nei primi giorni.",
    sesso: "M",
    comuneNascita: "Padova",
    provinciaNascita: "PD",
    nazioneNascita: "Italia",
    hasItalianCf: true,
    cittadinanza: "",
    nazioneResidenza: "",
    tipoDocumento: "",
    numeroDocumento: "",
  },
  session: {
    locationSlug: "galzignano-terme",
    locationName: "Galzignano Terme",
    weekIds: ["w1", "w2", "w5", "w9"],
    weekLabels: ["8 - 12 giugno", "15 - 19 giugno", "6 - 10 luglio", "3 - 7 agosto"],
    timeSlot: "07:45 - 16:00 (giornata intera)",
    extras: ["anticipo", "gite"],
    residenteNelComune: true,
    tesseraTipo: "super_integrativa",
  },
  delegates: [
    { firstName: "Anna", lastName: "Rossi", phone: "049 1234567", document: "CI AB1234567" },
    { firstName: "Luca", lastName: "Verdi", phone: "347 9876543", document: "" },
  ],
  consents: {
    privacy: true,
    photos: true,
    outings: true,
    rules: true,
    dataProcessing: true,
    acsiDati24: true,
    acsiDati25: false,
    acsiFotoMarketing: true,
  },
  documents: [],
};

// Settimane della sede (nel DB dalla M10.1): qui bastano codici e numeri.
const sampleLocation = {
  weeks: Array.from({ length: 9 }, (_, i) => ({
    id: `w${i + 1}`,
    number: i + 1,
    label: "",
    startDate: null,
    endDate: null,
    spots: 12,
    confirmed: 0,
  })),
};

const ops = flags.has("--acsi")
  ? acsiMinorOps(sample)
  : [...galzignanoEnrollmentOps(sample, sampleLocation), ...acsiMinorOps(sample)];

const bytes = await renderOverlay(template, ops, {
  keepPages: flags.has("--acsi") ? [GALZIGNANO_2026.acsiPage] : undefined,
  debug: { grid: !flags.has("--no-grid"), outline: !flags.has("--no-outline") },
});
fs.writeFileSync(out, bytes);
console.log(`Scritto ${out} (${(bytes.length / 1024).toFixed(0)} KB, ${ops.length} operazioni)`);
