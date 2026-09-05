import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { sanitizePdfText as sanitize } from "./text.ts";

// Impaginatore minimale per moduli A4: titoli, sezioni, righe etichetta/valore,
// caselle di consenso e righe firma. I font Standard usano WinAnsi: il testo
// viene ripulito dai caratteri non supportati (vedi text.ts).

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const INK = rgb(0.13, 0.16, 0.23);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.8, 0.82, 0.86);
const ACCENT = rgb(0.97, 0.45, 0.09);

export const BLANK = "____________________";

// Immagine per l'intestazione: pdf-lib incorpora solo PNG e JPEG.
export type LogoImage = { bytes: Uint8Array; mime: "image/png" | "image/jpeg" };

export type HeaderOptions = {
  locationName?: string; // "Sede: …" sotto la riga dell'associazione
  leftLogo?: LogoImage | null; // logo Sportivissimo
  rightLogo?: LogoImage | null; // logo del comune della sede
};

const LOGO_HEIGHT = 42;
const LOGO_MAX_WIDTH = 120;

export class PdfBuilder {
  private doc: PDFDocument;
  private page: PDFPage;
  private font: PDFFont;
  private bold: PDFFont;
  private y: number;

  private constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.doc = doc;
    this.font = font;
    this.bold = bold;
    this.page = doc.addPage([A4.width, A4.height]);
    this.y = A4.height - MARGIN;
  }

  static async create(): Promise<PdfBuilder> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    return new PdfBuilder(doc, font, bold);
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN) {
      this.page = this.doc.addPage([A4.width, A4.height]);
      this.y = A4.height - MARGIN;
    }
  }

  private wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = sanitize(text).split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const attempt = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(attempt, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    }
    if (line) lines.push(line);
    return lines.length > 0 ? lines : [""];
  }

  private async embedLogo(logo: LogoImage | null | undefined): Promise<PDFImage | null> {
    if (!logo) return null;
    try {
      return logo.mime === "image/png"
        ? await this.doc.embedPng(logo.bytes)
        : await this.doc.embedJpg(logo.bytes);
    } catch (e) {
      console.error("Logo PDF non incorporabile:", e);
      return null;
    }
  }

  private drawLogo(img: PDFImage, x: number, top: number, alignRight = false): number {
    const scale = Math.min(LOGO_HEIGHT / img.height, LOGO_MAX_WIDTH / img.width);
    const w = img.width * scale;
    const h = img.height * scale;
    this.page.drawImage(img, { x: alignRight ? x - w : x, y: top - h, width: w, height: h });
    return w;
  }

  // Intestazione: logo Sportivissimo a sinistra, logo del comune a destra
  // (se c'è), riga dell'associazione e nome sede, poi titolo e sottotitolo.
  async header(title: string, subtitle: string, orgLine: string, opts: HeaderOptions = {}) {
    const left = await this.embedLogo(opts.leftLogo);
    const right = await this.embedLogo(opts.rightLogo);
    const top = this.y;
    let textX = MARGIN;
    if (left) textX += this.drawLogo(left, MARGIN, top) + 12;
    const rightWidth = right ? this.drawLogo(right, A4.width - MARGIN, top, true) + 12 : 0;
    const textMaxWidth = A4.width - MARGIN - textX - rightWidth;

    // La riga dell'associazione non va spezzata: si riduce il corpo finché entra.
    const org = sanitize(orgLine);
    let orgSize = 13;
    while (orgSize > 9 && this.bold.widthOfTextAtSize(org, orgSize) > textMaxWidth) orgSize -= 0.5;
    this.page.drawText(this.wrap(org, this.bold, orgSize, textMaxWidth)[0], {
      x: textX,
      y: top - 14,
      size: orgSize,
      font: this.bold,
      color: ACCENT,
    });
    if (opts.locationName) {
      this.page.drawText(this.wrap(`Sede: ${opts.locationName}`, this.font, 10, textMaxWidth)[0], {
        x: textX,
        y: top - 29,
        size: 10,
        font: this.font,
        color: MUTED,
      });
    }
    const block = Math.max(left || right ? LOGO_HEIGHT : 0, opts.locationName ? 34 : 18);
    this.y = top - block - 8;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: A4.width - MARGIN, y: this.y },
      thickness: 0.8,
      color: LINE,
    });
    this.y -= 10;
    for (const line of this.wrap(title, this.bold, 16, A4.width - MARGIN * 2)) {
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y - 14,
        size: 16,
        font: this.bold,
        color: INK,
      });
      this.y -= 20;
    }
    if (subtitle) {
      for (const line of this.wrap(subtitle, this.font, 10, A4.width - MARGIN * 2)) {
        this.page.drawText(line, {
          x: MARGIN,
          y: this.y - 10,
          size: 10,
          font: this.font,
          color: MUTED,
        });
        this.y -= 13;
      }
    }
    this.y -= 8;
  }

  section(title: string) {
    this.ensure(34);
    this.y -= 22;
    this.page.drawText(sanitize(title).toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 11,
      font: this.bold,
      color: INK,
    });
    this.y -= 6;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: A4.width - MARGIN, y: this.y },
      thickness: 0.8,
      color: LINE,
    });
    this.y -= 4;
  }

  // Riga "Etichetta: valore" (con a capo automatico del valore).
  kv(label: string, value: string) {
    const size = 10;
    const labelText = `${sanitize(label)}: `;
    const labelWidth = this.bold.widthOfTextAtSize(labelText, size);
    const maxValueWidth = A4.width - MARGIN * 2 - labelWidth;
    const lines = this.wrap(value || BLANK, this.font, size, maxValueWidth);
    this.ensure(15 * lines.length + 4);
    this.y -= 15;
    this.page.drawText(labelText, {
      x: MARGIN,
      y: this.y,
      size,
      font: this.bold,
      color: MUTED,
    });
    this.page.drawText(lines[0], {
      x: MARGIN + labelWidth,
      y: this.y,
      size,
      font: this.font,
      color: INK,
    });
    for (const extra of lines.slice(1)) {
      this.y -= 13;
      this.page.drawText(extra, {
        x: MARGIN + labelWidth,
        y: this.y,
        size,
        font: this.font,
        color: INK,
      });
    }
  }

  // Due colonne di kv sulla stessa riga (per campi corti).
  kvPair(leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) {
    const size = 10;
    this.ensure(19);
    this.y -= 15;
    const colWidth = (A4.width - MARGIN * 2) / 2;
    const draw = (x: number, label: string, value: string, maxW: number) => {
      const labelText = `${sanitize(label)}: `;
      const lw = this.bold.widthOfTextAtSize(labelText, size);
      this.page.drawText(labelText, { x, y: this.y, size, font: this.bold, color: MUTED });
      const val = this.wrap(value || BLANK, this.font, size, maxW - lw)[0];
      this.page.drawText(val, { x: x + lw, y: this.y, size, font: this.font, color: INK });
    };
    draw(MARGIN, leftLabel, leftValue, colWidth - 10);
    draw(MARGIN + colWidth, rightLabel, rightValue, colWidth - 10);
  }

  checkbox(label: string, checked: boolean) {
    const size = 9.5;
    const boxSize = 10;
    const textX = MARGIN + boxSize + 8;
    const lines = this.wrap(label, this.font, size, A4.width - MARGIN - textX);
    this.ensure(14 * lines.length + 6);
    this.y -= 16;
    const boxY = this.y - 1;
    this.page.drawRectangle({
      x: MARGIN,
      y: boxY,
      width: boxSize,
      height: boxSize,
      borderColor: INK,
      borderWidth: 0.9,
    });
    if (checked) {
      this.page.drawText("X", {
        x: MARGIN + 2.2,
        y: boxY + 1.6,
        size: 9,
        font: this.bold,
        color: INK,
      });
    }
    this.page.drawText(lines[0], { x: textX, y: this.y, size, font: this.font, color: INK });
    for (const extra of lines.slice(1)) {
      this.y -= 12;
      this.page.drawText(extra, { x: textX, y: this.y, size, font: this.font, color: INK });
    }
  }

  paragraph(text: string, size = 9.5) {
    const lines = this.wrap(text, this.font, size, A4.width - MARGIN * 2);
    this.ensure(13 * lines.length + 4);
    for (const line of lines) {
      this.y -= 13;
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color: MUTED });
    }
  }

  // Righe firma affiancate, lasciate in bianco.
  signatures(labels: string[]) {
    this.ensure(58);
    this.y -= 42;
    const colWidth = (A4.width - MARGIN * 2) / labels.length;
    labels.forEach((label, i) => {
      const x = MARGIN + colWidth * i;
      this.page.drawLine({
        start: { x, y: this.y },
        end: { x: x + colWidth - 24, y: this.y },
        thickness: 0.8,
        color: INK,
      });
      this.page.drawText(sanitize(label), {
        x,
        y: this.y - 12,
        size: 8.5,
        font: this.font,
        color: MUTED,
      });
    });
    this.y -= 18;
  }

  spacer(h = 8) {
    this.ensure(h);
    this.y -= h;
  }

  async bytes(): Promise<Uint8Array> {
    return this.doc.save();
  }
}
