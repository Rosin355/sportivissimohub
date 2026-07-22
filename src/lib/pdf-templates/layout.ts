import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";

// Impaginatore minimale per moduli A4: titoli, sezioni, righe etichetta/valore,
// caselle di consenso e righe firma. I font Standard usano WinAnsi: il testo
// viene ripulito dai caratteri non supportati.

const A4 = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const INK = rgb(0.13, 0.16, 0.23);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.8, 0.82, 0.86);
const ACCENT = rgb(0.97, 0.45, 0.09);

function sanitize(text: string): string {
  return (
    text
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/–/g, "-")
      .replace(/—/g, "-")
      .replace(/\u00a0/g, " ")
      // qualunque altro carattere fuori da Latin-1 diventa "?" (niente crash WinAnsi)
      .replace(/[^\x20-\x7E¡-ÿ€]/g, "?")
  );
}

export const BLANK = "____________________";

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

  header(title: string, subtitle: string, orgLine: string) {
    this.page.drawText(sanitize(orgLine), {
      x: MARGIN,
      y: this.y - 12,
      size: 13,
      font: this.bold,
      color: ACCENT,
    });
    this.y -= 30;
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
