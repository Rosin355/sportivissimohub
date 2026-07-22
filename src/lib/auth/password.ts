// Requisiti password condivisi tra client e server (rispecchiano la policy di
// Supabase Auth). Se un requisito qui passa, anche il server deve accettarlo.
export type PasswordRequirement = {
  id: "length" | "upper" | "lower" | "digit";
  label: string;
  test: (v: string) => boolean;
};

export const passwordRequirements: PasswordRequirement[] = [
  { id: "length", label: "Almeno 8 caratteri", test: (v) => v.length >= 8 },
  { id: "upper", label: "Una lettera maiuscola", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "Una lettera minuscola", test: (v) => /[a-z]/.test(v) },
  { id: "digit", label: "Un numero", test: (v) => /\d/.test(v) },
];

export function passwordMeetsRequirements(v: string): boolean {
  return passwordRequirements.every((r) => r.test(v));
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3; label: string; tone: "weak" | "medium" | "strong" | "empty" };

// Indicatore informativo (non bloccante): lunghezza + varietà di categorie.
export function passwordStrength(v: string): PasswordStrength {
  if (!v) return { score: 0, label: "", tone: "empty" };
  const categories =
    (/[a-z]/.test(v) ? 1 : 0) +
    (/[A-Z]/.test(v) ? 1 : 0) +
    (/\d/.test(v) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(v) ? 1 : 0);
  const long = v.length >= 12;
  const medium = v.length >= 8;
  if (long && categories >= 3) return { score: 3, label: "Forte", tone: "strong" };
  if (medium && categories >= 2) return { score: 2, label: "Media", tone: "medium" };
  return { score: 1, label: "Debole", tone: "weak" };
}