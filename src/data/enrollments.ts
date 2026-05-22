export type EnrollmentStatus =
  | "nuova"
  | "revisione"
  | "documenti-mancanti"
  | "attesa-pagamento"
  | "confermata"
  | "lista-attesa"
  | "annullata";

export type GuardianData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  fiscalCode: string;
  address: string;
  city: string;
  province: string;
  zip: string;
};

export type ChildData = {
  firstName: string;
  lastName: string;
  birthDate: string;
  fiscalCode: string;
  age: number;
  school: string;
  grade: string;
  allergies: string;
  medicalNotes: string;
  specialNeeds: string;
};

export type SessionData = {
  locationSlug: string;
  locationName: string;
  weekIds: string[];
  weekLabels: string[];
  timeSlot: string;
  extras: string[];
};

export type PickupDelegate = {
  firstName: string;
  lastName: string;
  phone: string;
  document: string;
};

export type ConsentsData = {
  privacy: boolean;
  photos: boolean;
  outings: boolean;
  rules: boolean;
  dataProcessing: boolean;
};

export type DocumentMeta = {
  type: string;
  fileName: string;
  size: number;
};

export type Enrollment = {
  id: string;
  createdAt: string;
  status: EnrollmentStatus;
  guardian: GuardianData;
  child: ChildData;
  session: SessionData;
  delegates: PickupDelegate[];
  consents: ConsentsData;
  documents: DocumentMeta[];
  adminNotes?: string;
};

const STORAGE_KEY = "sportivissimo:enrollments";
const SEED_FLAG = "sportivissimo:enrollments:seeded";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function seed(): Enrollment[] {
  const now = Date.now();
  return [
    {
      id: "ENR-001",
      createdAt: new Date(now - 86400000 * 6).toISOString(),
      status: "confermata",
      guardian: {
        firstName: "Giulia", lastName: "Rossi", email: "giulia.rossi@example.it", phone: "+39 333 1234567",
        fiscalCode: "RSSGLI80A41L840A", address: "Via Roma 5", city: "Padova", province: "PD", zip: "35100",
      },
      child: {
        firstName: "Marco", lastName: "Rossi", birthDate: "2016-04-12", fiscalCode: "RSSMRC16D12L840B",
        age: 9, school: "Scuola primaria Dante", grade: "4ª elementare",
        allergies: "Nessuna", medicalNotes: "—", specialNeeds: "—",
      },
      session: {
        locationSlug: "galzignano-terme", locationName: "Galzignano Terme",
        weekIds: ["w3", "w4"], weekLabels: ["24 - 28 giugno", "1 - 5 luglio"],
        timeSlot: "08:30 - 17:00 (tempo pieno)", extras: ["mensa"],
      },
      delegates: [
        { firstName: "Luca", lastName: "Bianchi", phone: "+39 333 7654321", document: "CI AX1234567" },
      ],
      consents: { privacy: true, photos: true, outings: true, rules: true, dataProcessing: true },
      documents: [
        { type: "Documento genitore", fileName: "carta_identita.pdf", size: 312000 },
        { type: "Tessera sanitaria",  fileName: "tessera_marco.pdf",  size: 184000 },
      ],
      adminNotes: "Iscrizione completa e pagamento ricevuto.",
    },
    {
      id: "ENR-002",
      createdAt: new Date(now - 86400000 * 3).toISOString(),
      status: "documenti-mancanti",
      guardian: {
        firstName: "Andrea", lastName: "Verdi", email: "andrea.verdi@example.it", phone: "+39 348 8765432",
        fiscalCode: "VRDNDR78H10L840Z", address: "Via Verdi 12", city: "Vicenza", province: "VI", zip: "36100",
      },
      child: {
        firstName: "Sofia", lastName: "Verdi", birthDate: "2018-09-22", fiscalCode: "VRDSFO18P62L840Y",
        age: 6, school: "Scuola primaria Manzoni", grade: "1ª elementare",
        allergies: "Intolleranza al lattosio", medicalNotes: "—", specialNeeds: "—",
      },
      session: {
        locationSlug: "vo-euganeo", locationName: "Vo' Euganeo",
        weekIds: ["w5"], weekLabels: ["8 - 12 luglio"],
        timeSlot: "08:30 - 13:00 (mezza giornata)", extras: ["anticipo"],
      },
      delegates: [],
      consents: { privacy: true, photos: false, outings: true, rules: true, dataProcessing: true },
      documents: [
        { type: "Documento genitore", fileName: "doc_andrea.pdf", size: 240000 },
      ],
      adminNotes: "Manca il certificato medico.",
    },
    {
      id: "ENR-003",
      createdAt: new Date(now - 86400000 * 1).toISOString(),
      status: "nuova",
      guardian: {
        firstName: "Martina", lastName: "Neri", email: "martina.neri@example.it", phone: "+39 320 1112223",
        fiscalCode: "NRMRTN85B41L840K", address: "Via Mazzini 8", city: "Noventa Vicentina", province: "VI", zip: "36025",
      },
      child: {
        firstName: "Luca", lastName: "Neri", birthDate: "2015-11-03", fiscalCode: "NRELCU15S03L840W",
        age: 10, school: "Scuola primaria Foscolo", grade: "5ª elementare",
        allergies: "Nessuna", medicalNotes: "—", specialNeeds: "—",
      },
      session: {
        locationSlug: "noventa-vicentina", locationName: "Noventa Vicentina",
        weekIds: ["w1", "w2", "w6"], weekLabels: ["10 - 14 giugno", "17 - 21 giugno", "15 - 19 luglio"],
        timeSlot: "08:30 - 17:00 (tempo pieno)", extras: ["mensa", "gite"],
      },
      delegates: [
        { firstName: "Anna", lastName: "Neri", phone: "+39 333 0001112", document: "CI BX0099887" },
      ],
      consents: { privacy: true, photos: true, outings: true, rules: true, dataProcessing: true },
      documents: [
        { type: "Documento genitore",  fileName: "doc_martina.pdf",   size: 210000 },
        { type: "Tessera sanitaria",   fileName: "tessera_luca.pdf",  size: 160000 },
        { type: "Certificato medico",  fileName: "certificato.pdf",   size: 320000 },
      ],
      adminNotes: "",
    },
  ];
}

function read(): Enrollment[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Enrollment[];
  } catch {
    /* ignore */
  }
  const seeded = seed();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  window.localStorage.setItem(SEED_FLAG, "1");
  return seeded;
}

function write(list: Enrollment[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getEnrollments(): Enrollment[] {
  return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getEnrollment(id: string): Enrollment | undefined {
  return read().find((e) => e.id === id);
}

export function saveEnrollment(
  data: Omit<Enrollment, "id" | "createdAt" | "status">,
): Enrollment {
  const list = read();
  const id = `ENR-${String(list.length + 1).padStart(3, "0")}`;
  const newEnrollment: Enrollment = {
    id,
    createdAt: new Date().toISOString(),
    status: "nuova",
    ...data,
  };
  write([newEnrollment, ...list]);
  return newEnrollment;
}

export function updateEnrollmentStatus(id: string, status: EnrollmentStatus, adminNotes?: string) {
  const list = read();
  const next = list.map((e) => (e.id === id ? { ...e, status, adminNotes: adminNotes ?? e.adminNotes } : e));
  write(next);
}

/* ---------- draft (per-slug) ---------- */

export function draftKey(slug: string) {
  return `sportivissimo:draft:${slug}`;
}

export function readDraft<T>(slug: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(draftKey(slug));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeDraft<T>(slug: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(draftKey(slug), JSON.stringify(value));
}

export function clearDraft(slug: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(draftKey(slug));
}