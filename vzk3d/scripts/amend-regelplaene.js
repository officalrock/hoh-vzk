/**
 * Amend regelplaene.json mit anforderungen-Heuristik.
 * Usage: node scripts/amend-regelplaene.js
 *
 * ⚠️ ACHTUNG — KEINE AMTLICHE RSA-21-PRUEFUNG.
 * Werte sind aus dem `titel` (Verkehrsfuehrung) + README-Ableitung abgeleitet,
 * NICHT aus den amtlichen RSA-21-Tabellen. Ein Fachplaner MUSS jeden Plan
 * gegen das Originaldokument pruefen, bevor das Auswertmodul produktiv genutzt
 * wird. Quelle README-Logik: <2,75 m Umleitung; 2,75–5,50 m einstreifig (LSA);
 * >=5,50 m innerorts Gegenverkehr.
 */

import fs from 'fs';
import path from 'path';

const REGELPLAENE_PATH = path.join(process.cwd(), 'src/data/regelplaene.json');

// Straßenklasse je RSA-Teil (Vorfilter; Plan kann enger sein).
const KLASSEN_JE_TEIL = {
  B: ['Gemeindestraße', 'Kreisstraße'],   // innerorts
  C: ['Kreisstraße', 'Bundesstraße'],     // Landstraße
  D: ['Bundesstraße'],                     // Autobahn
};

/**
 * Leitet Restbreite-Mindestwert aus der Verkehrsfuehrung im titel ab.
 *
 * Schwellenwerte aus RSA-21-Fachliteratur (stvo2go.de/baustelle-fahrbahnbreite):
 *   Wechselverkehr/halbseitig:  3,00 m (LSA-Ausnahme 2,75 m)
 *   Gegenverkehr innerorts:     5,70 m Mindest / 6,00 m Regel
 *   Gegenverkehr Landstraße:    6,00 m (5,50 m mit Behelfsfahrstreifen)
 *   Fahrstreifen Autobahn:      3,25 m Haupt / 2,60–3,25 m weitere
 * Per-Plan-Zuordnung bleibt Heuristik (titel-basiert) → unverifiziert.
 */
function restbreiteAusTitel(titel, teil) {
  const t = (titel || '').toLowerCase();
  const gegenInnerorts = teil === 'B' ? 5.7 : 6.0;

  // Vollsperrung / Umleitung → keine Durchfahrt, Restbreite irrelevant.
  if (t.includes('sperrung einer straße') || (t.includes('umleitung') && t.includes('sperrung der'))) {
    return { min_m: null, max_m: null, hinweis: 'Vollsperrung/Umleitung — keine Restbreite' };
  }
  // Gegenverkehr / zweistreifig ohne halbseitige Sperrung → Begegnung noetig.
  if ((t.includes('gegenverkehr') || t.includes('zweistreifig')) && !t.includes('halbseitig')) {
    return { min_m: gegenInnerorts, max_m: null, hinweis: `Begegnungsverkehr ≥ ${gegenInnerorts} m (RSA 21)` };
  }
  // Behelfsfahrstreifen → eigene Spur, je Fahrstreifen 3,0 m.
  if (t.includes('behelfsfahrstreifen')) {
    return { min_m: 3.0, max_m: null, hinweis: 'Behelfsfahrstreifen 3,0 m/Spur (RSA 21)' };
  }
  // Halbseitige Sperrung / LSA / einstreifig → Wechselverkehr 3,0 m.
  if (t.includes('halbseitig') || t.includes('lichtzeichenanlage') || t.includes('einstreifig')) {
    return { min_m: 3.0, max_m: null, hinweis: 'Wechselverkehr ≥ 3,0 m (LSA-Ausnahme 2,75 m)' };
  }
  // Geh-/Radweg-Plaene → Fahrbahn meist gering eingeengt, Standardspur.
  if (t.includes('gehweg') || t.includes('radweg')) {
    return { min_m: 2.85, max_m: null, hinweis: 'Fahrbahn gering eingeengt (Mindestspur 2,85 m)' };
  }
  // Geringe Einengung → Mindest-Fahrstreifen.
  if (t.includes('geringe einengung') || t.includes('geringer verkehrsstärke')) {
    return { min_m: 2.85, max_m: null, hinweis: 'Geringe Einengung (Mindestspur 2,85 m)' };
  }
  // Default: Wechselverkehr-Mindest.
  return { min_m: 3.0, max_m: null, hinweis: 'Default Wechselverkehr 3,0 m — pruefen' };
}

/**
 * Laenge-Heuristik: Teil B innerorts kurz, C/D Landstraße/Autobahn laenger.
 * KEINE amtliche Quelle.
 */
function laengeAusTeil(teil) {
  switch (teil) {
    case 'B': return { min_m: null, max_m: null, hinweis: 'innerorts, laengenunabhaengig' };
    case 'C': return { min_m: null, max_m: null, hinweis: 'Landstraße' };
    case 'D': return { min_m: null, max_m: null, hinweis: 'Autobahn' };
    default:  return { min_m: null, max_m: null };
  }
}

try {
  const data = JSON.parse(fs.readFileSync(REGELPLAENE_PATH, 'utf-8'));

  let amended = 0;
  data.forEach((plan) => {
    const rb = restbreiteAusTitel(plan.titel, plan.teil);
    const lg = laengeAusTeil(plan.teil);
    plan.anforderungen = {
      restbreite: { min_m: rb.min_m, max_m: rb.max_m },
      laenge: { min_m: lg.min_m, max_m: lg.max_m },
      strassenklassen: KLASSEN_JE_TEIL[plan.teil] || KLASSEN_JE_TEIL.B,
      heuristik: rb.hinweis,
      unverifiziert: true, // MUSS gegen amtliche RSA 21 geprueft werden
    };
    amended++;
  });

  fs.writeFileSync(REGELPLAENE_PATH, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`✅ ${amended} Regelplaene mit Heuristik-anforderungen versehen`);
  console.log(`⚠️  ALLE als "unverifiziert: true" markiert — Fachplaner muss gegen RSA 21 pruefen`);
} catch (err) {
  console.error('❌ Fehler:', err.message);
  process.exit(1);
}
