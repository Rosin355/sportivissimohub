export type ActivityBadge = {
  label: string;
  color: "sun" | "grass" | "magic" | "flame" | "royal";
};

export type CampWeek = {
  id: string;
  number: number;
  label: string; // "24 - 28 giugno"
  spots: number;
};

export type DayBlock = {
  time: string;
  title: string;
  description: string;
  icon: "sun" | "ball" | "lunch" | "art" | "team" | "hug";
  color: "sun" | "grass" | "magic" | "flame" | "royal";
};

export type LocationFaq = { q: string; a: string };

// Tariffe reali per settimana e quote tessera (regolamento 2026).
export type LocationPricing = {
  residentFullDay: number;
  residentHalfDay: number;
  nonResidentFullDay: number;
  nonResidentHalfDay: number;
  siblingDiscountFullDay: number; // sconto per settimana dal 2° figlio
  siblingDiscountHalfDay: number;
  membershipBase: number; // tessera ACSI base
  membershipSuperIntegrativa: number; // supplemento tessera super-integrativa
  lateFee: number; // mora iscrizione fuori termine
};

export type Location = {
  slug: string;
  name: string;
  comune: string;
  address: string;
  age: string;
  ageMin: number;
  ageMax: number;
  tagline: string;
  description: string;
  pricing: LocationPricing;
  totalSpots: number;
  bookedSpots: number;
  badges: ActivityBadge[];
  weeks: CampWeek[];
  timeSlots: string[];
  dayPlan: DayBlock[];
  activities: string[];
  includedServices: string[];
  extraServices: { id: string; label: string; price: number }[];
  requiredDocuments: string[];
  contacts: { phone: string; email: string; manager: string };
  faq: LocationFaq[];
  theme: "sun" | "grass" | "magic" | "flame" | "royal";
};

const defaultWeeks: CampWeek[] = [
  { id: "w1", number: 1, label: "10 - 14 giugno", spots: 12 },
  { id: "w2", number: 2, label: "17 - 21 giugno", spots: 10 },
  { id: "w3", number: 3, label: "24 - 28 giugno", spots: 8 },
  { id: "w4", number: 4, label: "1 - 5 luglio", spots: 14 },
  { id: "w5", number: 5, label: "8 - 12 luglio", spots: 9 },
  { id: "w6", number: 6, label: "15 - 19 luglio", spots: 11 },
  { id: "w7", number: 7, label: "22 - 26 luglio", spots: 7 },
  { id: "w8", number: 8, label: "29 lug - 2 ago", spots: 6 },
];

const defaultDayPlan: DayBlock[] = [
  {
    time: "07:30 - 09:00",
    title: "Buongiorno e accoglienza",
    description: "Anticipo facoltativo, giochi liberi e merenda di benvenuto.",
    icon: "sun",
    color: "sun",
  },
  {
    time: "09:00 - 12:30",
    title: "Sport & avventura",
    description: "Attività sportive a rotazione: calcio, pallavolo, atletica.",
    icon: "ball",
    color: "grass",
  },
  {
    time: "12:30 - 14:00",
    title: "Pranzo in compagnia",
    description: "Mensa con menù controllato e momento di relax.",
    icon: "lunch",
    color: "flame",
  },
  {
    time: "14:00 - 16:00",
    title: "Laboratori creativi",
    description: "Arte, musica, costruzioni e mini-esperimenti.",
    icon: "art",
    color: "magic",
  },
  {
    time: "16:00 - 17:30",
    title: "Giochi di squadra",
    description: "Tornei, cacce al tesoro e sfide a squadre.",
    icon: "team",
    color: "royal",
  },
  {
    time: "17:30 - 18:30",
    title: "Saluti e posticipo",
    description: "Ritiro bambini, posticipo facoltativo fino alle 18:30.",
    icon: "hug",
    color: "sun",
  },
];

const defaultDocs = [
  "Documento d'identità del genitore",
  "Tessera sanitaria del bambino/a",
  "Certificato medico di sana e robusta costituzione",
  "Modulo deleghe firmato",
];

const defaultExtras = [
  { id: "anticipo", label: "Anticipo (dalle 7:30)", price: 15 },
  { id: "posticipo", label: "Posticipo (fino 18:30)", price: 15 },
  { id: "mensa", label: "Mensa settimanale", price: 35 },
  { id: "gite", label: "Uscita / gita", price: 20 },
];

const defaultIncluded = [
  "Tutte le attività sportive",
  "Materiali per i laboratori",
  "Merenda di metà mattina",
  "Staff qualificato e assicurato",
  "Maglietta Sportivissimo",
];

// Prezzi placeholder per le sedi senza regolamento confermato: struttura reale,
// valori derivati dal vecchio prezzo unico. DA CONFERMARE CON L'ASSOCIAZIONE.
function placeholderPricing(fullDay: number): LocationPricing {
  return {
    residentFullDay: fullDay,
    residentHalfDay: Math.max(fullDay - 35, 25),
    nonResidentFullDay: fullDay + 20,
    nonResidentHalfDay: Math.max(fullDay - 15, 40),
    siblingDiscountFullDay: 10,
    siblingDiscountHalfDay: 5,
    membershipBase: 10,
    membershipSuperIntegrativa: 30,
    lateFee: 15,
  };
}

// Galzignano Terme 2026: 9 settimane dall'8 giugno al 7 agosto.
const galzignanoWeeks: CampWeek[] = [
  { id: "w1", number: 1, label: "8 - 12 giugno", spots: 12 },
  { id: "w2", number: 2, label: "15 - 19 giugno", spots: 12 },
  { id: "w3", number: 3, label: "22 - 26 giugno", spots: 12 },
  { id: "w4", number: 4, label: "29 giu - 3 lug", spots: 12 },
  { id: "w5", number: 5, label: "6 - 10 luglio", spots: 12 },
  { id: "w6", number: 6, label: "13 - 17 luglio", spots: 12 },
  { id: "w7", number: 7, label: "20 - 24 luglio", spots: 12 },
  { id: "w8", number: 8, label: "27 - 31 luglio", spots: 12 },
  { id: "w9", number: 9, label: "3 - 7 agosto", spots: 12 },
];

function base(partial: Partial<Location> & Pick<Location, "slug" | "name" | "comune">): Location {
  return {
    address: "Via dello Sport 1",
    age: "6-13 anni",
    ageMin: 6,
    ageMax: 13,
    tagline: "Una settimana di sport, amici e avventure!",
    description:
      "Una sede pensata per far divertire i bambini con sport, laboratori e tantissimi nuovi amici. Lo staff Sportivissimo accompagna ogni piccolo atleta in una giornata piena di energia.",
    pricing: placeholderPricing(120),
    totalSpots: 60,
    bookedSpots: 46,
    badges: [
      { label: "Sport", color: "flame" },
      { label: "Natura", color: "grass" },
      { label: "Giochi di squadra", color: "magic" },
    ],
    weeks: defaultWeeks,
    timeSlots: ["08:30 - 17:00 (tempo pieno)", "08:30 - 13:00 (mezza giornata)"],
    dayPlan: defaultDayPlan,
    activities: [
      "Calcio",
      "Pallavolo",
      "Atletica",
      "Laboratori creativi",
      "Cacce al tesoro",
      "Giochi d'acqua",
    ],
    includedServices: defaultIncluded,
    extraServices: defaultExtras,
    requiredDocuments: defaultDocs,
    contacts: {
      phone: "+39 049 0000000",
      email: "info@sportivissimo.it",
      manager: "Lo staff Sportivissimo",
    },
    faq: [
      {
        q: "Posso iscrivere più di una settimana?",
        a: "Sì, basta selezionare tutte le settimane desiderate nel modulo di iscrizione.",
      },
      {
        q: "Il pranzo è incluso?",
        a: "Il pranzo è un servizio extra opzionale: puoi attivarlo durante l'iscrizione.",
      },
      {
        q: "Posso ritirare prima mio figlio?",
        a: "Certo. Puoi indicarlo allo staff anche la mattina stessa.",
      },
      {
        q: "Cosa serve per partecipare?",
        a: "Servono solo abbigliamento sportivo, cappellino, borraccia e tanta voglia di divertirsi!",
      },
    ],
    theme: "royal",
    ...partial,
  };
}

export const LOCATIONS: Location[] = [
  base({
    slug: "galzignano-terme",
    name: "Galzignano Terme",
    comune: "Galzignano Terme (PD)",
    address: "Via Roma 12 — Galzignano Terme",
    age: "6-13 anni",
    ageMin: 6,
    ageMax: 13,
    tagline: "Centro estivo immerso nel verde dei Colli Euganei.",
    // Valori reali dal regolamento 2026
    pricing: {
      residentFullDay: 75,
      residentHalfDay: 40,
      nonResidentFullDay: 95,
      nonResidentHalfDay: 55,
      siblingDiscountFullDay: 10,
      siblingDiscountHalfDay: 5,
      membershipBase: 10,
      membershipSuperIntegrativa: 30,
      lateFee: 15,
    },
    weeks: galzignanoWeeks,
    timeSlots: ["07:45 - 16:00 (giornata intera)", "07:45 - 12:30 (mezza giornata)"],
    totalSpots: 60,
    bookedSpots: 46,
    badges: [
      { label: "Sport", color: "flame" },
      { label: "Piscina", color: "royal" },
      { label: "Natura", color: "grass" },
    ],
    activities: ["Calcio", "Pallavolo", "Piscina", "Mini golf", "Laboratori", "Escursioni"],
    theme: "grass",
  }),
  base({
    slug: "castegnero-champions-camp",
    name: "Castegnero Champions Camp",
    comune: "Castegnero (VI)",
    address: "Via dello Stadio 4 — Castegnero",
    age: "8-14 anni",
    ageMin: 8,
    ageMax: 14,
    tagline: "Il camp per i veri campioni del pallone.",
    pricing: placeholderPricing(150), // DA CONFERMARE CON L'ASSOCIAZIONE
    totalSpots: 50,
    bookedSpots: 28,
    badges: [
      { label: "Calcio", color: "grass" },
      { label: "Squadra", color: "magic" },
      { label: "Tornei", color: "flame" },
    ],
    activities: [
      "Allenamenti calcio",
      "Tecnica individuale",
      "Mini tornei",
      "Video analisi",
      "Fair play",
    ],
    theme: "flame",
  }),
  base({
    slug: "san-pietro-viminario",
    name: "S. Pietro Viminario",
    comune: "San Pietro Viminario (PD)",
    address: "Piazza della Pace 2 — S. Pietro Viminario",
    age: "5-11 anni",
    ageMin: 5,
    ageMax: 11,
    tagline: "Tanti laboratori creativi per piccoli artisti.",
    pricing: placeholderPricing(115), // DA CONFERMARE CON L'ASSOCIAZIONE
    totalSpots: 45,
    bookedSpots: 36,
    badges: [
      { label: "Creatività", color: "magic" },
      { label: "Giochi", color: "sun" },
      { label: "Inglese", color: "royal" },
    ],
    activities: ["Pittura", "Musica", "Mini inglese", "Giochi all'aperto", "Costruzioni"],
    theme: "magic",
  }),
  base({
    slug: "vo-euganeo",
    name: "Vo' Euganeo",
    comune: "Vo' (PD)",
    address: "Via dei Colli 7 — Vo' Euganeo",
    age: "6-12 anni",
    ageMin: 6,
    ageMax: 12,
    tagline: "Avventure nel cuore dei Colli Euganei.",
    pricing: placeholderPricing(120), // DA CONFERMARE CON L'ASSOCIAZIONE
    totalSpots: 40,
    bookedSpots: 22,
    badges: [
      { label: "Natura", color: "grass" },
      { label: "Avventura", color: "flame" },
      { label: "Trekking", color: "sun" },
    ],
    activities: [
      "Trekking",
      "Orienteering",
      "Giochi nel bosco",
      "Sport di squadra",
      "Laboratori natura",
    ],
    theme: "grass",
  }),
  base({
    slug: "asigliano-veneto",
    name: "Asigliano Veneto",
    comune: "Asigliano Veneto (VI)",
    address: "Via della Scuola 5 — Asigliano Veneto",
    age: "5-11 anni",
    ageMin: 5,
    ageMax: 11,
    pricing: placeholderPricing(110), // DA CONFERMARE CON L'ASSOCIAZIONE
    totalSpots: 35,
    bookedSpots: 23,
    badges: [
      { label: "Sport", color: "flame" },
      { label: "Creatività", color: "magic" },
    ],
    activities: ["Multisport", "Laboratori", "Giochi a squadre"],
    theme: "sun",
  }),
  base({
    slug: "sossano",
    name: "Sossano",
    comune: "Sossano (VI)",
    address: "Via dello Sport 3 — Sossano",
    pricing: placeholderPricing(125), // DA CONFERMARE CON L'ASSOCIAZIONE
    totalSpots: 40,
    bookedSpots: 33,
    badges: [
      { label: "Piscina", color: "royal" },
      { label: "Giochi di squadra", color: "sun" },
    ],
    activities: ["Piscina", "Calcio", "Pallavolo", "Laboratori"],
    theme: "royal",
  }),
  base({
    slug: "orgiano",
    name: "Orgiano",
    comune: "Orgiano (VI)",
    address: "Via Marconi 9 — Orgiano",
    age: "5-12 anni",
    ageMin: 5,
    ageMax: 12,
    pricing: placeholderPricing(115), // DA CONFERMARE CON L'ASSOCIAZIONE
    totalSpots: 38,
    bookedSpots: 22,
    badges: [
      { label: "Sport", color: "flame" },
      { label: "Natura", color: "grass" },
    ],
    activities: ["Multisport", "Escursioni", "Laboratori"],
    theme: "grass",
  }),
  base({
    slug: "noventa-vicentina",
    name: "Noventa Vicentina",
    comune: "Noventa Vicentina (VI)",
    address: "Via Roma 22 — Noventa Vicentina",
    pricing: placeholderPricing(135), // DA CONFERMARE CON L'ASSOCIAZIONE
    totalSpots: 55,
    bookedSpots: 35,
    badges: [
      { label: "Multisport", color: "magic" },
      { label: "Piscina", color: "royal" },
    ],
    activities: ["Multisport", "Piscina", "Tornei", "Laboratori"],
    theme: "magic",
  }),
  base({
    slug: "bastia-frassanelle",
    name: "Bastia / Frassanelle",
    comune: "Rovolon (PD)",
    address: "Via Frassanelle 1 — Rovolon",
    age: "7-14 anni",
    ageMin: 7,
    ageMax: 14,
    pricing: placeholderPricing(140), // DA CONFERMARE CON L'ASSOCIAZIONE
    totalSpots: 45,
    bookedSpots: 34,
    badges: [
      { label: "Avventura", color: "flame" },
      { label: "Natura", color: "grass" },
    ],
    activities: ["Trekking", "Mountain bike", "Tiro con l'arco", "Cacce al tesoro"],
    theme: "flame",
  }),
];

export function getLocationBySlug(slug: string): Location | undefined {
  return LOCATIONS.find((l) => l.slug === slug);
}

export function locationCardSummary(loc: Location) {
  return {
    name: loc.name,
    slug: loc.slug,
    age: loc.age,
    weeks: loc.weeks.length,
    spots: Math.max(loc.totalSpots - loc.bookedSpots, 0),
    total: loc.totalSpots,
    tags: loc.badges.slice(0, 3),
  };
}
