/**
 * PDF Export utilities — jsPDF + html2canvas for packing list & Regelplan PDFs
 */

import jsPDF from 'jspdf';
import { fussplattenGesamt } from './packing-list.js';
import { signWindlast, packlisteFussplatten } from './packing-windlast.js';

export function generatePackingListPDF(packingList, project = null, settings = { aufstellort: 'innerorts', aufstellhoehe: 2.0 }) {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(16);
  doc.text('Packliste', 20, yPos);
  yPos += 10;

  if (project) {
    doc.setFontSize(11);
    doc.text(`Projekt: ${project.name}`, 20, yPos);
    yPos += 6;
    if (project.stadt || project.strasse) {
      const standort = [project.stadt, project.strasse, project.hausnummern?.von && `${project.hausnummern.von}-${project.hausnummern.bis}`]
        .filter(Boolean)
        .join(', ');
      doc.text(`Standort: ${standort}`, 20, yPos);
      yPos += 6;
    }
    doc.text(`Erstellt: ${new Date(project.erstelltAm).toLocaleDateString('de-DE')}`, 20, yPos);
    yPos += 6;
  }

  // Windlast-Parameter
  doc.setFontSize(10);
  const ortLabel = settings.aufstellort === 'ausserorts' ? 'außerorts (0,42 kN/m²)' : 'innerorts (0,25 kN/m²)';
  doc.text(`Aufstellort: ${ortLabel} · Aufstellhöhe: ${settings.aufstellhoehe} m`, 20, yPos);
  yPos += 8;

  // Table headers
  const headers = ['Nr.', 'Bezeichnung', 'Menge', 'Windlast', 'Fußplatten'];
  doc.text(headers[0], 20, yPos);
  doc.text(headers[1], 42, yPos);
  doc.text(headers[2], 120, yPos);
  doc.text(headers[3], 140, yPos);
  doc.text(headers[4], 172, yPos);
  yPos += 7;

  // Table rows
  packingList.forEach((pos) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    if (pos.type === 'sign') {
      const w = signWindlast(pos.zeichennummer, pos.stueckzahl, settings.aufstellort, settings.aufstellhoehe);
      doc.text(pos.zeichennummer, 20, yPos);
      doc.text((pos.bezeichnung + (pos.wunschtext ? ` (${pos.wunschtext})` : '')).slice(0, 42), 42, yPos);
      doc.text(String(pos.stueckzahl), 120, yPos);
      doc.text(`${w.momentNm} Nm`, 140, yPos);
      doc.text(String(w.fussplattenGesamt), 172, yPos);
    } else if (pos.type === 'material') {
      const fp = fussplattenGesamt(pos);
      const ort = pos.aufstellort === 'ausserorts' ? ' (a.o.)' : '';
      doc.text('', 20, yPos);
      doc.text(`${pos.name} (${pos.einheit})`.slice(0, 42), 42, yPos);
      doc.text(String(pos.stueckzahl), 120, yPos);
      doc.text('—', 140, yPos);
      doc.text(fp ? String(fp) + ort : '', 172, yPos);
    }
    yPos += 6;
  });

  // Summe
  yPos += 4;
  doc.setFontSize(11);
  const gesamt = packlisteFussplatten(packingList, settings.aufstellort, settings.aufstellhoehe);
  doc.text(`K1-Fußplatten gesamt: ${gesamt}`, 20, yPos);

  return doc;
}

export function downloadPDF(doc, filename = 'packliste.pdf') {
  doc.save(filename);
}

export default {
  generatePackingListPDF,
  downloadPDF,
};
