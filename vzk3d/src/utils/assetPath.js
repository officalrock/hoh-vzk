/**
 * Baut den URL-Pfad zu einer Grafik im ../assets-Ordner.
 * In der Datenstruktur ist `bild` z. B. "zeichen/274-30.png" – diese liegt
 * (über vite publicDir) unter /zeichen/274-30.png.
 */
const BASE = import.meta.env.BASE_URL || "/";

export function assetUrl(relPath) {
  if (!relPath) return "";
  const clean = relPath.replace(/^\/+/, "");
  // encodeURI erhält '/', kodiert aber Leerzeichen u. Ä. (z. B. in PDF-Namen)
  return BASE + encodeURI(clean);
}

export function brandingUrl(file) {
  return assetUrl("branding/" + file);
}
