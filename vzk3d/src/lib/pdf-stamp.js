/**
 * Firmenheader-Stempel auf bestehende Regelplan-PDFs (pdf-lib).
 *
 * Lädt das Original-Plan-PDF, stempelt auf jede Seite ein Kopfband mit
 * HOH-Logo + Aufsteller-/Firmendaten (links) und Projekt + Datum (rechts).
 * Auf Seite 1 zusätzlich ein Fußband mit dem Kunden-Anmerkungstext.
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { assetUrl, brandingUrl } from '../utils/assetPath.js';

const ORANGE = rgb(0.937, 0.498, 0.102); // HOH #EF7F1A
const INK = rgb(0.12, 0.12, 0.16);
const GREY = rgb(0.4, 0.4, 0.45);

async function fetchBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Konnte Datei nicht laden (${res.status}): ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

// Text auf maxWidth umbrechen (wortweise).
function wrapText(text, font, size, maxWidth) {
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const probe = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(probe, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// pdf-lib (WinAnsi) kann nur einen Zeichensatz; exotische Glyphen entfernen.
function safe(s = '') {
  return String(s).replace(/[^\x00-\xFF]/g, '');
}

/**
 * @returns {Promise<Uint8Array>} gestempeltes PDF
 */
export async function stampRegelplanPDF({ pdfPath, firma = {}, projekt = null, kundentext = '', nr = '', datum = null }) {
  const bytes = await fetchBytes(assetUrl(pdfPath));
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontB = await pdf.embedFont(StandardFonts.HelveticaBold);

  let logo = null;
  try {
    logo = await pdf.embedPng(await fetchBytes(brandingUrl('HOH_Logo.png')));
  } catch {
    /* Logo optional */
  }

  const datumStr = datum || new Date().toLocaleDateString('de-DE');
  const pages = pdf.getPages();
  const H = 46; // Kopfband-Höhe

  pages.forEach((page) => {
    const { width, height } = page.getSize();

    // Kopfband
    page.drawRectangle({ x: 0, y: height - H, width, height: H, color: rgb(1, 1, 1), opacity: 0.93 });
    page.drawRectangle({ x: 0, y: height - H - 2, width, height: 2, color: ORANGE });

    let tx = 14;
    if (logo) {
      const lh = H - 16;
      const lw = (logo.width / logo.height) * lh;
      page.drawImage(logo, { x: 14, y: height - H + 8, width: lw, height: lh });
      tx = 14 + lw + 12;
    }

    page.drawText(safe(firma.firma || 'HOH Verkehrstechnik'), { x: tx, y: height - 21, size: 11, font: fontB, color: INK });
    const sub = [firma.anschrift, firma.telefon && `Tel. ${firma.telefon}`, firma.bearbeiter && `Bearb. ${firma.bearbeiter}`]
      .filter(Boolean)
      .join('   ·   ');
    if (sub) page.drawText(safe(sub), { x: tx, y: height - 34, size: 8, font, color: GREY });

    // rechts: Projekt + Datum
    const right1 = safe(projekt?.name || (nr ? `Regelplan ${nr}` : 'Regelplan'));
    const right2 = safe([projekt?.stadt, projekt?.strasse].filter(Boolean).join(', ') || datumStr);
    const w1 = fontB.widthOfTextAtSize(right1, 10);
    page.drawText(right1, { x: width - 14 - w1, y: height - 21, size: 10, font: fontB, color: INK });
    const w2 = font.widthOfTextAtSize(right2, 8);
    page.drawText(right2, { x: width - 14 - w2, y: height - 34, size: 8, font, color: GREY });
    if (projekt?.stadt || projekt?.strasse) {
      const wd = font.widthOfTextAtSize(datumStr, 8);
      page.drawText(datumStr, { x: width - 14 - wd, y: height - 44, size: 8, font, color: GREY });
    }
  });

  // Kundentext-Fußband auf Seite 1
  const txt = safe(kundentext).trim();
  if (txt) {
    const page = pages[0];
    const { width } = page.getSize();
    const lines = wrapText(txt, font, 9, width - 28).slice(0, 2);
    const FH = 22 + lines.length * 11;
    page.drawRectangle({ x: 0, y: 0, width, height: FH, color: rgb(1, 1, 1), opacity: 0.93 });
    page.drawRectangle({ x: 0, y: FH, width, height: 2, color: ORANGE });
    page.drawText('Anmerkung Kunde:', { x: 14, y: FH - 13, size: 8, font: fontB, color: INK });
    lines.forEach((ln, i) => page.drawText(ln, { x: 14, y: FH - 24 - i * 11, size: 9, font, color: INK }));
  }

  return pdf.save();
}

/** Uint8Array als Datei herunterladen. */
export function downloadBytes(bytes, filename = 'plan.pdf') {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default { stampRegelplanPDF, downloadBytes };
