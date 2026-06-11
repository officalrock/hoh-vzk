/**
 * Zentrale Design-Tokens der VZK-App.
 *
 * Designsprache: industrielle Verkehrssicherung. Neutraler, dunkler (bzw.
 * heller) Grund, darauf die amtlichen Signalfarben als SEMANTISCHE Akzente
 * (Kategorie-Codierung). Eine einzige interaktive Akzentfarbe (Warnorange).
 *
 * Diese Datei ist die einzige Quelle für Farben/Abstände/Radien. Three.js
 * liest die Farbwerte hier direkt; CSS bezieht sie als Variablen aus
 * styles/global.css (Werte gespiegelt).
 */

// Amtliche Signalfarben (an RAL/StVO angelehnt) – semantische Kategoriefarben.
export const SIGNAL = {
  rot: "#e2231a", // Verkehrsrot (Gefahr-/Vorschriftzeichen)
  orange: "#ef7f1a", // Warnorange (Arbeitsstellen, interaktiver Akzent)
  gelb: "#f4c400", // Verkehrsgelb
  blau: "#1b50a3", // Verkehrsblau (Richtzeichen)
  gruen: "#1f7a44", // Verkehrsgrün
  weiss: "#ffffff",
  schwarz: "#101319",
};

// Interaktiver Akzent der App (Buttons, Fokus, aktive Zustände).
export const ACCENT = SIGNAL.orange;
export const ACCENT_DARK = "#b85e0c"; // für Text auf Weiß (Kontrast AA)

// Three.js-Materialfarben für die Detailansicht.
export const SCENE = {
  postMetal: "#9aa3ad", // Pfosten (verzinkter Stahl)
  signBack: "#8c9298", // Schildrückseite (grau)
  signEdge: "#5b6169",
  groundDark: "#0c0f14",
  groundLight: "#e9ecf1",
};

export const RADIUS = {
  sm: "8px",
  md: "14px",
  lg: "20px",
  pill: "999px",
};

export const SPACE = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "40px",
  xxl: "64px",
};

// Handschuhtaugliche Mindest-Touchgröße (Außeneinsatz).
export const TOUCH_MIN = "48px";

// Kategorie -> semantische Signalfarbe (CSS-Variablenname --kat-...).
export const KATEGORIE_FARBE = {
  Gefahrzeichen: SIGNAL.rot,
  Vorschriftzeichen: SIGNAL.rot,
  Richtzeichen: SIGNAL.blau,
  Zusatzzeichen: "#6b7480",
  Verkehrseinrichtungen: SIGNAL.orange,
  Sinnbilder: "#6b7480",
  Markierung: SIGNAL.gelb,
  Markierungen: SIGNAL.gelb,
  Lichtsignalanlagen: SIGNAL.gruen,
  RMS: SIGNAL.blau,
  Sonstige: "#6b7480",
};
