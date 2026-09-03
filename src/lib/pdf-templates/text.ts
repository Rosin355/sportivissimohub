// Pulizia del testo per i font Standard di pdf-lib (codifica WinAnsi): le
// virgolette tipografiche e i trattini lunghi vengono normalizzati, qualunque
// altro carattere fuori da Latin-1 diventa "?" invece di far fallire il render.
export function sanitizePdfText(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/…/g, "...")
    .replace(/\u00a0/g, " ")
    .replace(/[^\x20-\x7E¡-ÿ€]/g, "?");
}
