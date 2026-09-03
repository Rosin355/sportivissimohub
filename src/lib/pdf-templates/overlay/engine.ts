import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFFont,
  PDFName,
  PDFNumber,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { sanitizePdfText } from "../text.ts";

// Motore di overlay: scrive testo e spunte a coordinate fisse sopra un modulo
// cartaceo originale (PDF scansionato o esportato). Coordinate in punti PDF,
// origine in basso a sinistra, pagine numerate da 1.
//
// Nota: gli import relativi con estensione .ts servono perché questo modulo
// viene eseguito anche fuori da Vite dallo script di calibrazione
// (node scripts/pdf-calibrate.ts).

export type TextSlot = { x: number; y: number; w: number };

export type TextField = {
  page: number;
  // Righe disponibili in ordine: il testo va a capo da una all'altra.
  slots: TextSlot[];
  size?: number; // corpo di partenza (default 10)
  minSize?: number; // corpo minimo prima di troncare (default 7)
};

export type CheckField = { page: number; x: number; y: number; s: number };

export type Region = { page: number; x: number; y: number; w: number; h: number };

export type OverlayOp =
  | { kind: "text"; field: TextField; value: string }
  | { kind: "check"; field: CheckField; checked: boolean }
  // Rettangolo bianco sopra il contenuto della pagina (segni prestampati).
  | ({ kind: "whiteout" } & Region)
  // Rimuove le annotazioni (FreeText, timbri…) il cui centro cade nella
  // regione: le annotazioni si disegnano sopra tutto, un whiteout non basta.
  | ({ kind: "strip-annotations" } & Region);

export type OverlayOptions = {
  // Pagine da tenere nel PDF finale (1-based, in ordine); default: tutte.
  keepPages?: number[];
  // Solo per la calibrazione: griglia di coordinate e contorno dei campi.
  debug?: { grid?: boolean; outline?: boolean };
};

const INK = rgb(0.08, 0.14, 0.4); // blu inchiostro: si distingue dal prestampato
const WHITE = rgb(1, 1, 1);
const DEFAULT_SIZE = 10;
const DEFAULT_MIN_SIZE = 7;

export function text(field: TextField, value: string): OverlayOp {
  return { kind: "text", field, value };
}

export function check(field: CheckField, checked: boolean): OverlayOp {
  return { kind: "check", field, checked };
}

// Copre un segno prestampato dentro una casella (es. una X di default),
// lasciando intatto il bordo.
export function whiteoutBox(field: CheckField, inset = 1.3): OverlayOp {
  return {
    kind: "whiteout",
    page: field.page,
    x: field.x + inset,
    y: field.y + inset,
    w: field.s - inset * 2,
    h: field.s - inset * 2,
  };
}

// Elimina le annotazioni centrate su una casella (es. una X inserita come
// FreeText da un editor PDF): la casella disegnata nella pagina resta.
export function stripAnnotationsOnBox(field: CheckField, margin = 3): OverlayOp {
  return {
    kind: "strip-annotations",
    page: field.page,
    x: field.x - margin,
    y: field.y - margin,
    w: field.s + margin * 2,
    h: field.s + margin * 2,
  };
}

function stripAnnotations(doc: PDFDocument, page: PDFPage, region: Region) {
  const annots = page.node.Annots();
  if (!annots) return;
  const kept = [];
  for (let i = 0; i < annots.size(); i++) {
    const item = annots.get(i);
    const dict = doc.context.lookup(item);
    let inside = false;
    if (dict instanceof PDFDict) {
      const rect = dict.lookup(PDFName.of("Rect"));
      if (rect instanceof PDFArray && rect.size() === 4) {
        const nums = [0, 1, 2, 3].map((k) => {
          const v = rect.lookup(k);
          return v instanceof PDFNumber ? v.asNumber() : NaN;
        });
        const cx = (nums[0] + nums[2]) / 2;
        const cy = (nums[1] + nums[3]) / 2;
        inside =
          cx >= region.x &&
          cx <= region.x + region.w &&
          cy >= region.y &&
          cy <= region.y + region.h;
      }
    }
    if (!inside) kept.push(item);
  }
  page.node.set(PDFName.of("Annots"), doc.context.obj(kept));
}

// Prova a distribuire le parole sulle righe disponibili al corpo dato.
function fitLines(
  words: string[],
  slots: TextSlot[],
  size: number,
  font: PDFFont,
): string[] | null {
  const lines: string[] = [];
  let wi = 0;
  for (const slot of slots) {
    let line = "";
    while (wi < words.length) {
      const attempt = line ? `${line} ${words[wi]}` : words[wi];
      if (font.widthOfTextAtSize(attempt, size) <= slot.w) {
        line = attempt;
        wi++;
      } else if (!line) {
        return null; // parola singola più larga della riga
      } else {
        break;
      }
    }
    lines.push(line);
    if (wi >= words.length) break;
  }
  return wi >= words.length ? lines : null;
}

function truncate(line: string, w: number, size: number, font: PDFFont): string {
  if (font.widthOfTextAtSize(line, size) <= w) return line;
  let out = line;
  while (out.length > 1 && font.widthOfTextAtSize(`${out}...`, size) > w) {
    out = out.slice(0, -1);
  }
  return `${out}...`;
}

function drawTextField(page: PDFPage, font: PDFFont, field: TextField, value: string) {
  const clean = sanitizePdfText(value).trim();
  if (!clean) return;
  const words = clean.split(/\s+/);
  const start = field.size ?? DEFAULT_SIZE;
  const min = field.minSize ?? DEFAULT_MIN_SIZE;

  let size = start;
  let lines: string[] | null = null;
  for (let s = start; s >= min - 0.001; s -= 0.5) {
    lines = fitLines(words, field.slots, s, font);
    if (lines) {
      size = s;
      break;
    }
  }
  if (!lines) {
    // Non entra nemmeno al corpo minimo: riempi le righe e tronca l'ultima.
    size = min;
    lines = [];
    let wi = 0;
    for (const slot of field.slots) {
      let line = "";
      while (wi < words.length) {
        const attempt = line ? `${line} ${words[wi]}` : words[wi];
        if (font.widthOfTextAtSize(attempt, size) <= slot.w) {
          line = attempt;
          wi++;
        } else break;
      }
      lines.push(line);
    }
    const last = field.slots.length - 1;
    const rest = words.slice(wi).join(" ");
    lines[last] = truncate(
      rest ? `${lines[last]} ${rest}`.trim() : lines[last],
      field.slots[last].w,
      size,
      font,
    );
  }

  lines.forEach((line, i) => {
    if (!line) return;
    const slot = field.slots[i];
    page.drawText(line, { x: slot.x, y: slot.y, size, font, color: INK });
  });
}

function drawCheck(page: PDFPage, field: CheckField) {
  const i = Math.max(1.4, field.s * 0.18);
  const opts = { thickness: Math.max(1, field.s * 0.13), color: INK };
  page.drawLine({
    start: { x: field.x + i, y: field.y + i },
    end: { x: field.x + field.s - i, y: field.y + field.s - i },
    ...opts,
  });
  page.drawLine({
    start: { x: field.x + i, y: field.y + field.s - i },
    end: { x: field.x + field.s - i, y: field.y + i },
    ...opts,
  });
}

function drawGrid(page: PDFPage, font: PDFFont) {
  const { width, height } = page.getSize();
  const minor = rgb(0.75, 0.85, 1);
  const major = rgb(1, 0.3, 0.3);
  for (let x = 0; x <= width; x += 10) {
    const isMajor = x % 50 === 0;
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: isMajor ? 0.5 : 0.25,
      color: isMajor ? major : minor,
      opacity: isMajor ? 0.7 : 0.6,
    });
    if (isMajor) {
      for (const y of [3, height - 8]) {
        page.drawText(String(x), { x: x + 1, y, size: 5, font, color: major });
      }
    }
  }
  for (let y = 0; y <= height; y += 10) {
    const isMajor = y % 50 === 0;
    page.drawLine({
      start: { x: 0, y },
      end: { x: width, y },
      thickness: isMajor ? 0.5 : 0.25,
      color: isMajor ? major : minor,
      opacity: isMajor ? 0.7 : 0.6,
    });
    if (isMajor) {
      for (const x of [2, width - 14]) {
        page.drawText(String(y), { x, y: y + 1, size: 5, font, color: major });
      }
    }
  }
}

function drawOutline(page: PDFPage, op: OverlayOp) {
  if (op.kind === "text") {
    const size = op.field.size ?? DEFAULT_SIZE;
    for (const slot of op.field.slots) {
      page.drawRectangle({
        x: slot.x,
        y: slot.y - 2,
        width: slot.w,
        height: size + 2,
        borderColor: rgb(0.9, 0.1, 0.1),
        borderWidth: 0.4,
        opacity: 0,
        borderOpacity: 0.9,
      });
    }
  } else if (op.kind === "check") {
    page.drawRectangle({
      x: op.field.x,
      y: op.field.y,
      width: op.field.s,
      height: op.field.s,
      borderColor: rgb(0.1, 0.4, 0.9),
      borderWidth: 0.5,
      opacity: 0,
      borderOpacity: 0.9,
    });
  }
}

// Applica le operazioni al template e restituisce i byte del PDF risultante.
export async function renderOverlay(
  template: Uint8Array,
  ops: OverlayOp[],
  options: OverlayOptions = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(template, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const pageOf = (n: number): PDFPage | null => pages[n - 1] ?? null;

  // Prima le coperture, poi testo e spunte, così una whiteout non cancella mai
  // un segno appena disegnato.
  for (const op of ops) {
    if (op.kind === "whiteout") {
      const page = pageOf(op.page);
      if (page) page.drawRectangle({ x: op.x, y: op.y, width: op.w, height: op.h, color: WHITE });
    } else if (op.kind === "strip-annotations") {
      const page = pageOf(op.page);
      if (page) stripAnnotations(doc, page, op);
    }
  }
  for (const op of ops) {
    if (op.kind === "text") {
      const page = pageOf(op.field.page);
      if (page) drawTextField(page, font, op.field, op.value);
    } else if (op.kind === "check") {
      const page = pageOf(op.field.page);
      if (page && op.checked) drawCheck(page, op.field);
    }
  }

  if (options.debug?.grid) for (const page of pages) drawGrid(page, font);
  if (options.debug?.outline) {
    for (const op of ops) {
      const n = op.kind === "text" || op.kind === "check" ? op.field.page : op.page;
      const page = pageOf(n);
      if (page) drawOutline(page, op);
    }
  }

  if (!options.keepPages) return doc.save();

  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    doc,
    options.keepPages.map((n) => n - 1).filter((i) => i >= 0 && i < pages.length),
  );
  for (const p of copied) out.addPage(p);
  return out.save();
}
