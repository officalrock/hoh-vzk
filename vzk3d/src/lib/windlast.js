/**
 * Windlastberechnung von Verkehrszeichen – Nachbildung des IVST-Rechners.
 * Portiert aus der Vanilla-App (js/windlast.js); Formel + Klassengrenzen
 * 1:1 am Originalrechner verifiziert.
 *
 *   M [Nm] = q [N/m²] · A [m²] · h_s [m]
 *   q  = Staudruck (Aufstellort), A = Schildfläche,
 *   h_s = Schwerpunkthöhe = Aufstellhöhe(Unterkante) + Schwerpunktanteil·Schildhöhe
 *
 * Aufstellklasse = kleinstes K mit Haltemoment ≥ M.
 * 1 Klassenschritt = 120 Nm = Haltemoment einer K1-Fußplatte.
 */

export const STAUDRUCK = {
  innerorts: { q: 250, label: "Innerorts (0,25 kN/m²)" },
  ausserorts: { q: 420, label: "Außerorts (0,42 kN/m²)" },
};

export const AUFSTELLHOEHEN = [4.5, 2.2, 2.0, 1.5, 1.0, 0.6];

const KLASSEN_MAX = [120, 240, 360, 480, 600, 720, 960, 1080, 1920];
export const EINZEL_MAX = 1920;
export const HALTEMOMENT_K1 = 120;

export const FORMEN = {
  rechteck: { name: "Rechteck", faktor: 1.0, schwerpunkt: 0.5, masse: "bh" },
  kreis: { name: "Kreis (rund)", faktor: Math.PI / 4, schwerpunkt: 0.5, masse: "d" },
  achteck: { name: "Achteck (Stop)", faktor: 0.8284, schwerpunkt: 0.5, masse: "bh" },
  raute: { name: "Raute (auf der Spitze)", faktor: 0.5, schwerpunkt: 0.5, masse: "d" },
  dreieck_oben: { name: "Dreieck (Spitze oben)", faktor: 0.5, schwerpunkt: 1 / 3, masse: "bh" },
  dreieck_unten: { name: "Dreieck (Spitze unten)", faktor: 0.5, schwerpunkt: 2 / 3, masse: "bh" },
};

export function geometrie(formKey, breiteMm, hoeheMm, aufstellhoeheM) {
  const f = FORMEN[formKey] || FORMEN.rechteck;
  const b = (breiteMm || 0) / 1000;
  const h = (hoeheMm || 0) / 1000;
  return {
    flaeche: f.faktor * b * h,
    schwerpunktHoehe: aufstellhoeheM + f.schwerpunkt * h,
    oberkante: aufstellhoeheM + h,
    form: f,
  };
}

export function moment(qNm2, flaecheM2, schwerpunktHoeheM) {
  return qNm2 * flaecheM2 * schwerpunktHoeheM;
}

export function klasseIndex(M) {
  for (let i = 0; i < KLASSEN_MAX.length; i++) {
    if (M <= KLASSEN_MAX[i] + 1e-6) return i + 1;
  }
  return null;
}

export function klasse(M) {
  if (M <= EINZEL_MAX + 1e-6) {
    return { text: "K " + klasseIndex(M), staender: 1, proStaender: klasseIndex(M), zuHoch: false };
  }
  if (M <= 2 * EINZEL_MAX + 1e-6) {
    const n = klasseIndex(M / 2);
    return { text: "2 × K " + n, staender: 2, proStaender: n, zuHoch: false };
  }
  return { text: "Windlast zu hoch", staender: null, proStaender: null, zuHoch: true };
}

export function fussplattenK1(M) {
  return Math.max(1, Math.ceil(M / HALTEMOMENT_K1 - 1e-6));
}

/** params = { q (N/m²), form, breiteMm, hoeheMm, aufstellhoeheM } */
export function berechne(params) {
  const g = geometrie(params.form, params.breiteMm, params.hoeheMm, params.aufstellhoeheM);
  const M = moment(params.q, g.flaeche, g.schwerpunktHoehe);
  return {
    q: params.q,
    flaeche: g.flaeche,
    schwerpunktHoehe: g.schwerpunktHoehe,
    oberkante: g.oberkante,
    moment: M,
    klasse: klasse(M),
    fussplatten: fussplattenK1(M),
  };
}
