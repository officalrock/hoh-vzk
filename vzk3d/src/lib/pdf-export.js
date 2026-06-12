/**
 * PDF Export utilities — jsPDF + html2canvas for packing list & Regelplan PDFs
 */

import jsPDF from 'jspdf';
import { fussplattenGesamt } from './packing-list.js';

export function generatePackingListPDF(packingList, project = null) {
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
    yPos += 10;
  }

  // Table headers
  doc.setFontSize(10);
  const headers = ['Nr.', 'Bezeichnung', 'Einheit', 'Menge', 'Fußplatten'];
  doc.text(headers[0], 20, yPos);
  doc.text(headers[1], 50, yPos);
  doc.text(headers[2], 110, yPos);
  doc.text(headers[3], 140, yPos);
  doc.text(headers[4], 160, yPos);
  yPos += 8;

  // Table rows
  packingList.forEach((pos) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    if (pos.type === 'sign') {
      doc.text(pos.zeichennummer, 20, yPos);
      doc.text(pos.bezeichnung + (pos.wunschtext ? ` (${pos.wunschtext})` : ''), 50, yPos);
      doc.text('Stk.', 110, yPos);
      doc.text(String(pos.stueckzahl), 140, yPos);
    } else if (pos.type === 'material') {
      const fp = fussplattenGesamt(pos);
      const ort = pos.aufstellort === 'ausserorts' ? ' (außerorts)' : '';
      doc.text('', 20, yPos);
      doc.text(pos.name, 50, yPos);
      doc.text(pos.einheit, 110, yPos);
      doc.text(String(pos.stueckzahl), 140, yPos);
      doc.text(fp ? String(fp) + ort : '', 160, yPos);
    }
    yPos += 6;
  });

  return doc;
}

export function downloadPDF(doc, filename = 'packliste.pdf') {
  doc.save(filename);
}

export default {
  generatePackingListPDF,
  downloadPDF,
};
