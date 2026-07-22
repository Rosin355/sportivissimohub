import { z } from "zod";

// Regex reale del codice fiscale italiano (16 caratteri, con gestione omocodia:
// nelle posizioni numeriche possono comparire le lettere LMNPQRSTUV).
export const FISCAL_CODE_REGEX =
  /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i;

const phoneSchema = z
  .string()
  .refine((v) => v.replace(/\D/g, "").length >= 8, "Inserisci un numero di telefono valido.");

export const guardianSchema = z.object({
  firstName: z.string().trim().min(1, "Inserisci il nome del genitore."),
  lastName: z.string().trim().min(1, "Inserisci il cognome del genitore."),
  email: z.string().trim().email("Inserisci un'email valida."),
  phone: phoneSchema,
  fiscalCode: z.string().trim().regex(FISCAL_CODE_REGEX, "Codice fiscale del genitore non valido."),
  address: z.string().trim().min(1, "Inserisci l'indirizzo."),
  city: z.string().trim().min(1, "Inserisci il comune."),
  province: z.string().trim().length(2, "Provincia: usa la sigla di 2 lettere."),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "CAP non valido."),
});

export const childSchema = z.object({
  firstName: z.string().trim().min(1, "Inserisci il nome del bambino."),
  lastName: z.string().trim().min(1, "Inserisci il cognome del bambino."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Inserisci la data di nascita.")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d < new Date();
    }, "Data di nascita non valida."),
  fiscalCode: z.string().trim().regex(FISCAL_CODE_REGEX, "Codice fiscale del bambino non valido."),
  school: z.string().trim().min(1, "Completa scuola e classe."),
  grade: z.string().trim().min(1, "Completa scuola e classe."),
  allergies: z.string().trim(),
  medicalNotes: z.string().trim(),
  specialNeeds: z.string().trim(),
});

export const sessionSchema = z.object({
  locationSlug: z.string().min(1, "Sede non valida."),
  weekIds: z.array(z.string()).min(1, "Seleziona almeno una settimana."),
  timeSlot: z.string().min(1, "Scegli una fascia oraria."),
  extras: z.array(z.string()).default([]),
});

export const delegateSchema = z.object({
  firstName: z.string().trim().min(1, "Completa i dati di tutti i delegati o eliminali."),
  lastName: z.string().trim().min(1, "Completa i dati di tutti i delegati o eliminali."),
  phone: phoneSchema,
  document: z.string().trim(),
});

export const consentsSchema = z.object({
  privacy: z.literal(true, {
    errorMap: () => ({ message: "Devi accettare privacy, regolamento e trattamento dati." }),
  }),
  rules: z.literal(true, {
    errorMap: () => ({ message: "Devi accettare privacy, regolamento e trattamento dati." }),
  }),
  dataProcessing: z.literal(true, {
    errorMap: () => ({ message: "Devi accettare privacy, regolamento e trattamento dati." }),
  }),
  photos: z.boolean(),
  outings: z.boolean(),
});

// Payload completo del submit del wizard: rieseguita anche nella server function.
export const enrollmentSubmissionSchema = z.object({
  guardian: guardianSchema,
  child: childSchema,
  session: sessionSchema,
  delegates: z.array(delegateSchema),
  consents: consentsSchema,
});

export type EnrollmentSubmission = z.infer<typeof enrollmentSubmissionSchema>;
