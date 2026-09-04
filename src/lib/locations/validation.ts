import { z } from "zod";

// Schema dell'editor sedi (admin) e della server function saveLocation: la
// stessa validazione gira nel browser e sul server.

export const LOCATION_TYPES = ["centro_estivo", "doposcuola", "corso", "progetto_scuola"] as const;
export const LOCATION_STATUSES = ["bozza", "pubblicata"] as const;
export const THEMES = ["sun", "grass", "magic", "flame", "royal"] as const;
export const DAY_ICONS = ["sun", "ball", "lunch", "art", "team", "hug"] as const;

export const LOCATION_TYPE_LABELS: Record<(typeof LOCATION_TYPES)[number], string> = {
  centro_estivo: "Centro estivo",
  doposcuola: "Doposcuola",
  corso: "Corso / attività",
  progetto_scuola: "Progetto per le scuole",
};

export const THEME_LABELS: Record<(typeof THEMES)[number], string> = {
  sun: "Sole (giallo)",
  grass: "Prato (verde)",
  magic: "Magia (viola)",
  flame: "Fiamma (arancio)",
  royal: "Royal (blu)",
};

export const DAY_ICON_LABELS: Record<(typeof DAY_ICONS)[number], string> = {
  sun: "Sole",
  ball: "Sport",
  lunch: "Pranzo",
  art: "Arte",
  team: "Squadra",
  hug: "Saluti",
};

const CODE_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const codeSchema = (msg: string) => z.string().trim().regex(CODE_REGEX, msg);
const money = z.coerce.number().min(0, "Importo non valido.");
const isoDateOrEmpty = z
  .string()
  .trim()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Data non valida (AAAA-MM-GG).");

// Elenchi inseriti "una voce per riga": le righe vuote si scartano.
const lines = z.array(z.string().trim()).transform((a) => a.filter(Boolean));

export const pricingSchema = z.object({
  residentFullDay: money,
  residentHalfDay: money,
  nonResidentFullDay: money,
  nonResidentHalfDay: money,
  siblingDiscountFullDay: money,
  siblingDiscountHalfDay: money,
  membershipBase: money,
  membershipSuperIntegrativa: money,
  lateFee: money,
});

export const weekInputSchema = z.object({
  code: codeSchema("Codice settimana: solo minuscole, numeri e trattini (es. w1)."),
  number: z.coerce.number().int().min(1, "Numero settimana da 1 in su."),
  label: z.string().trim().min(1, "Inserisci l'etichetta della settimana."),
  startDate: isoDateOrEmpty,
  endDate: isoDateOrEmpty,
  spots: z.coerce.number().int().min(0, "Posti non validi."),
});

export const extraInputSchema = z.object({
  id: codeSchema("Codice extra: solo minuscole, numeri e trattini (es. anticipo)."),
  label: z.string().trim().min(1, "Inserisci l'etichetta del servizio."),
  price: money,
});

export const locationInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: codeSchema("Slug: solo minuscole, numeri e trattini (es. galzignano-terme)."),
    type: z.enum(LOCATION_TYPES),
    status: z.enum(LOCATION_STATUSES),
    name: z.string().trim().min(1, "Inserisci il nome della sede."),
    comune: z.string().trim(),
    address: z.string().trim(),
    ageLabel: z.string().trim(),
    ageMin: z.coerce.number().int().min(0).max(30),
    ageMax: z.coerce.number().int().min(0).max(30),
    tagline: z.string().trim(),
    description: z.string().trim(),
    theme: z.enum(THEMES),
    contacts: z.object({
      phone: z.string().trim(),
      email: z.string().trim().email("Email di contatto non valida.").or(z.literal("")),
      manager: z.string().trim(),
    }),
    pricing: pricingSchema,
    timeSlots: lines,
    activities: lines,
    includedServices: lines,
    requiredDocuments: lines,
    badges: z.array(
      z.object({
        label: z.string().trim().min(1, "Etichetta badge vuota."),
        color: z.enum(THEMES),
      }),
    ),
    weeks: z.array(weekInputSchema),
    extraServices: z.array(extraInputSchema),
    dayPlan: z.array(
      z.object({
        time: z.string().trim(),
        title: z.string().trim().min(1, "Titolo del blocco vuoto."),
        description: z.string().trim(),
        icon: z.enum(DAY_ICONS),
        color: z.enum(THEMES),
      }),
    ),
    faq: z.array(
      z.object({
        q: z.string().trim().min(1, "Domanda vuota."),
        a: z.string().trim().min(1, "Risposta vuota."),
      }),
    ),
    logoPath: z.string().nullable(),
    adminNotes: z.string().trim(),
    sortOrder: z.coerce.number().int(),
  })
  .superRefine((loc, ctx) => {
    if (loc.ageMax < loc.ageMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ageMax"],
        message: "L'età massima deve essere maggiore o uguale alla minima.",
      });
    }
    const weekCodes = new Set<string>();
    loc.weeks.forEach((w, i) => {
      if (weekCodes.has(w.code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weeks", i, "code"],
          message: `Codice settimana duplicato: ${w.code}.`,
        });
      }
      weekCodes.add(w.code);
      if (w.startDate && w.endDate && w.endDate < w.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weeks", i, "endDate"],
          message: "La fine settimana precede l'inizio.",
        });
      }
    });
    const extraCodes = new Set<string>();
    loc.extraServices.forEach((e, i) => {
      if (extraCodes.has(e.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["extraServices", i, "id"],
          message: `Codice extra duplicato: ${e.id}.`,
        });
      }
      extraCodes.add(e.id);
    });
    // Una sede pubblicata deve essere iscrivibile.
    if (loc.status === "pubblicata") {
      if (loc.weeks.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weeks"],
          message: "Per pubblicare la sede serve almeno una settimana.",
        });
      }
      if (loc.timeSlots.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["timeSlots"],
          message: "Per pubblicare la sede serve almeno una fascia oraria.",
        });
      }
    }
  });

export type LocationInput = z.infer<typeof locationInputSchema>;
