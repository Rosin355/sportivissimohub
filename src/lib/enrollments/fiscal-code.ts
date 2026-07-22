// Validazione completa del codice fiscale italiano, senza dipendenze:
// struttura (con omocodia) + carattere di controllo secondo l'algoritmo
// ufficiale (DM 23/12/1976). Usata sia client che server.

// Struttura: 6 lettere, 2 cifre anno (con omocodia LMNPQRSTUV), lettera mese
// (ABCDEHLMPRST), 2 cifre giorno (con omocodia), lettera + 3 cifre comune
// (con omocodia), carattere di controllo.
export const FISCAL_CODE_REGEX =
  /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/i;

// Valori dei caratteri in posizione dispari (1ª, 3ª, … — 1-indexed)
const ODD_VALUES: Record<string, number> = {
  "0": 1,
  "1": 0,
  "2": 5,
  "3": 7,
  "4": 9,
  "5": 13,
  "6": 15,
  "7": 17,
  "8": 19,
  "9": 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23,
};

// Valori dei caratteri in posizione pari: cifre a valore nominale, lettere A=0…Z=25
function evenValue(ch: string): number {
  return ch >= "0" && ch <= "9" ? ch.charCodeAt(0) - 48 : ch.charCodeAt(0) - 65;
}

export function fiscalCodeCheckChar(first15: string): string {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const ch = first15[i];
    // i è 0-indexed: i pari = posizione dispari 1-indexed
    sum += i % 2 === 0 ? ODD_VALUES[ch] : evenValue(ch);
  }
  return String.fromCharCode(65 + (sum % 26));
}

export function isValidFiscalCode(raw: string): boolean {
  const cf = raw.trim().toUpperCase();
  if (cf.length !== 16 || !FISCAL_CODE_REGEX.test(cf)) return false;
  return cf[15] === fiscalCodeCheckChar(cf.slice(0, 15));
}
