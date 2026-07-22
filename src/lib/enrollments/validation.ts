import { z } from "zod";
import { isValidFiscalCode, FISCAL_CODE_REGEX } from "./fiscal-code";

export { FISCAL_CODE_REGEX };

const phoneSchema = z
  .string()
  .refine((v) => v.replace(/\D/g, "").length >= 8, "Inserisci un numero di telefono valido.");

const cfSchema = (msg: string) =>
  z
    .string()
    .trim()
    .refine((v) => isValidFiscalCode(v), msg);

export const guardianSchema = z.object({
  firstName: z.string().trim().min(1, "Inserisci il nome del genitore."),
  lastName: z.string().trim().min(1, "Inserisci il cognome del genitore."),
  email: z.string().trim().email("Inserisci un'email valida."),
  phone: phoneSchema,
  fiscalCode: cfSchema(
    "Codice fiscale del genitore non valido (controlla anche l'ultimo carattere).",
  ),
  address: z.string().trim().min(1, "Inserisci l'indirizzo."),
  city: z.string().trim().min(1, "Inserisci il comune."),
  province: z.string().trim().length(2, "Provincia: usa la sigla di 2 lettere."),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "CAP non valido."),
});

// Secondo genitore per il tesseramento ACSI: blocco facoltativo, ma se
// presente deve essere completo.
export const secondaryGuardianSchema = z.object({
  firstName: z.string().trim().min(1, "Inserisci il nome del secondo genitore."),
  lastName: z.string().trim().min(1, "Inserisci il cognome del secondo genitore."),
  email: z.string().trim().email("Email del secondo genitore non valida."),
  phone: phoneSchema,
  fiscalCode: cfSchema(
    "Codice fiscale del secondo genitore non valido (controlla anche l'ultimo carattere).",
  ),
  address: z.string().trim().min(1, "Inserisci l'indirizzo del secondo genitore."),
  city: z.string().trim().min(1, "Inserisci il comune del secondo genitore."),
  province: z.string().trim().length(2, "Provincia del secondo genitore: sigla di 2 lettere."),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "CAP del secondo genitore non valido."),
});

// Schema base del figlio: usato dal form "aggiungi figlio" dell'area genitori
// (anagrafica minima, CF italiano richiesto).
export const childBaseSchema = z.object({
  firstName: z.string().trim().min(1, "Inserisci il nome del bambino."),
  lastName: z.string().trim().min(1, "Inserisci il cognome del bambino."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Inserisci la data di nascita.")
    .refine((v) => {
      const d = new Date(v);
      return !Number.isNaN(d.getTime()) && d < new Date();
    }, "Data di nascita non valida."),
  fiscalCode: cfSchema(
    "Codice fiscale del bambino non valido (controlla anche l'ultimo carattere).",
  ),
  school: z.string().trim().min(1, "Completa scuola e classe."),
  grade: z.string().trim().min(1, "Completa scuola e classe."),
  allergies: z.string().trim(),
  medicalNotes: z.string().trim(),
  specialNeeds: z.string().trim(),
});

export const childSchema = childBaseSchema;

// Schema completo del figlio per il wizard: anagrafica estesa e supporto ai
// minori senza codice fiscale italiano.
export const childFullSchema = childBaseSchema
  .omit({ fiscalCode: true })
  .extend({
    sesso: z.enum(["M", "F"], { errorMap: () => ({ message: "Indica il sesso del bambino." }) }),
    comuneNascita: z.string().trim().min(1, "Inserisci il comune (o la città) di nascita."),
    provinciaNascita: z.string().trim(),
    nazioneNascita: z.string().trim().min(1, "Inserisci la nazione di nascita."),
    hasItalianCf: z.boolean(),
    fiscalCode: z.string().trim(),
    cittadinanza: z.string().trim(),
    nazioneResidenza: z.string().trim(),
    tipoDocumento: z.string().trim(),
    numeroDocumento: z.string().trim(),
  })
  .superRefine((c, ctx) => {
    if (c.hasItalianCf) {
      if (!isValidFiscalCode(c.fiscalCode)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fiscalCode"],
          message: "Codice fiscale del bambino non valido (controlla anche l'ultimo carattere).",
        });
      }
    } else {
      for (const [key, label] of [
        ["cittadinanza", "la cittadinanza"],
        ["nazioneResidenza", "la nazione di residenza"],
        ["tipoDocumento", "il tipo di documento"],
        ["numeroDocumento", "il numero del documento"],
      ] as const) {
        if (!c[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `Per un bambino senza codice fiscale italiano indica ${label}.`,
          });
        }
      }
    }
  });

export const sessionSchema = z.object({
  locationSlug: z.string().min(1, "Sede non valida."),
  weekIds: z.array(z.string()).min(1, "Seleziona almeno una settimana."),
  timeSlot: z.string().min(1, "Scegli una fascia oraria."),
  extras: z.array(z.string()).default([]),
  residenteNelComune: z.boolean(),
  tesseraTipo: z.enum(["base", "super_integrativa"]),
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
  // Consensi ACSI: il trattamento dati per il tesseramento è obbligatorio,
  // gli altri due sono facoltativi e mai pre-spuntati.
  acsiDati24: z.literal(true, {
    errorMap: () => ({
      message: "Il consenso ACSI al trattamento dati per il tesseramento è obbligatorio.",
    }),
  }),
  acsiDati25: z.boolean(),
  acsiFotoMarketing: z.boolean(),
});

// Payload completo del submit del wizard: rieseguita anche nella server function.
export const enrollmentSubmissionSchema = z.object({
  guardian: guardianSchema,
  secondaryGuardian: secondaryGuardianSchema.nullable(),
  child: childFullSchema,
  session: sessionSchema,
  delegates: z.array(delegateSchema),
  consents: consentsSchema,
});

export type EnrollmentSubmission = z.infer<typeof enrollmentSubmissionSchema>;
