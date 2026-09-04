import { z } from "zod";
import type { CustomFieldType } from "@/lib/supabase/types";

// Campi personalizzati per sede (M10.3): definizioni, validazione dinamica
// (stessa schema nel wizard e nella server function) e formattazione.
//
// LIMITI ESPLICITI, da mantenere:
// - i campi personalizzati NON influenzano prezzi, posti o logica: sono solo
//   informazioni raccolte e mostrate (admin, genitori, CSV, PDF);
// - modificare o disattivare un campo NON altera le risposte già raccolte:
//   restano in enrollments.custom_answers con il code originale, e vengono
//   mostrate con l'etichetta corrente del campo (o con il code se il campo
//   non esiste più);
// - il code è generato alla creazione e non cambia mai (trigger nel DB).

export type CustomFieldDef = {
  code: string;
  label: string;
  fieldType: CustomFieldType;
  options: string[]; // solo per "scelta"
  required: boolean;
};

export type CustomAnswerValue = string | boolean;
export type CustomAnswers = Record<string, CustomAnswerValue>;

export const MAX_ACTIVE_CUSTOM_FIELDS = 15;

export const CUSTOM_FIELD_TYPES: CustomFieldType[] = ["testo", "si_no", "scelta", "data"];

export const CUSTOM_FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  testo: "Testo",
  si_no: "Sì / No",
  scelta: "Scelta da elenco",
  data: "Data",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Schema zod costruita dalle definizioni ATTIVE della sede. Le chiavi non
// definite vengono scartate; i campi facoltativi assenti prendono il default.
export function customAnswersSchema(fields: CustomFieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    const req = `"${f.label}" è obbligatorio.`;
    switch (f.fieldType) {
      case "testo":
        shape[f.code] = f.required
          ? z.string({ required_error: req }).trim().min(1, req).max(500, "Massimo 500 caratteri.")
          : z.string().trim().max(500, "Massimo 500 caratteri.").default("");
        break;
      case "si_no":
        shape[f.code] = f.required
          ? z.boolean({ required_error: req, invalid_type_error: req })
          : z.boolean().default(false);
        break;
      case "scelta": {
        const opts = f.options;
        const msg = `Scegli un valore per "${f.label}".`;
        shape[f.code] = f.required
          ? z
              .string({ required_error: msg })
              .trim()
              .refine((v) => opts.includes(v), msg)
          : z
              .string()
              .trim()
              .refine((v) => v === "" || opts.includes(v), msg)
              .default("");
        break;
      }
      case "data":
        shape[f.code] = f.required
          ? z.string({ required_error: req }).regex(ISO_DATE, `Inserisci la data per "${f.label}".`)
          : z
              .string()
              .regex(/^(\d{4}-\d{2}-\d{2})?$/, `Data non valida per "${f.label}".`)
              .default("");
        break;
    }
  }
  return z.object(shape);
}

export function validateCustomAnswers(
  fields: CustomFieldDef[],
  answers: unknown,
): { ok: true; answers: CustomAnswers } | { ok: false; error: string } {
  const parsed = customAnswersSchema(fields).safeParse(answers ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Controlla le informazioni richieste dalla sede.",
    };
  }
  return { ok: true, answers: parsed.data as CustomAnswers };
}

export function formatCustomAnswer(field: CustomFieldDef | undefined, value: unknown): string {
  if (typeof value === "boolean") return value ? "Sì" : "No";
  if (typeof value !== "string") return "";
  if (field?.fieldType === "data" || ISO_DATE.test(value)) {
    const m = ISO_DATE.exec(value);
    if (m) return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
  }
  return value;
}

// Righe pronte per admin, genitori, CSV e PDF: etichetta corrente del campo
// (anche se disattivato) o il code se il campo non esiste più.
export function answersForDisplay(
  fields: CustomFieldDef[],
  answers: CustomAnswers,
): Array<{ code: string; label: string; value: string }> {
  const byCode = new Map(fields.map((f) => [f.code, f]));
  const rows: Array<{ code: string; label: string; value: string }> = [];
  for (const f of fields) {
    if (!(f.code in answers)) continue;
    rows.push({ code: f.code, label: f.label, value: formatCustomAnswer(f, answers[f.code]) });
  }
  for (const [code, value] of Object.entries(answers)) {
    if (byCode.has(code)) continue;
    rows.push({ code, label: code, value: formatCustomAnswer(undefined, value) });
  }
  return rows.filter((r) => r.value !== "");
}

export function parseCustomAnswers(value: unknown): CustomAnswers {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const out: CustomAnswers = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" || typeof v === "boolean") out[k] = v;
  }
  return out;
}

// Slug stabile dall'etichetta, unico tra i code già usati dalla sede.
export function generateFieldCode(label: string, existing: string[]): string {
  const base =
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/g, "") || "campo";
  let code = base;
  let n = 2;
  while (existing.includes(code)) code = `${base}-${n++}`;
  return code;
}
