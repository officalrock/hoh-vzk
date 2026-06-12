/**
 * Wunschtext-Canvas: rendert Basisbild + Beschriftungstext in ein Canvas.
 * Nutzbar als 2D-Vorschau (toDataURL) und als Three.js-Textur (CanvasTexture).
 * Fix fuer US4: Zusatzzeichen 1000-01..05 zeigten nur Platzhalter statt Text.
 */

/**
 * Bricht Text auf mehrere Zeilen um, sodass jede Zeile in maxWidth passt.
 */
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Zeichnet Basisbild + zentrierten Text auf ein Canvas.
 * @param {HTMLImageElement} img - geladenes Basisbild (Zusatzzeichen)
 * @param {string} text - Wunschtext
 * @returns {HTMLCanvasElement}
 */
export function renderWunschtextCanvas(img, text) {
  // Zielaufloesung: an Bild orientiert, Mindestbreite fuer Lesbarkeit
  const baseW = img.naturalWidth || img.width || 600;
  const baseH = img.naturalHeight || img.height || 600;
  const scale = Math.max(1, 600 / baseW);
  const W = Math.round(baseW * scale);
  const H = Math.round(baseH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Basisbild fuellend zeichnen
  ctx.drawImage(img, 0, 0, W, H);

  if (!text || !text.trim()) return canvas;

  // Platzhalter-Striche aus dem Originalbild ueberdecken: Innenflaeche weiss
  // fuellen, Rand (schwarze Umrandung des Zusatzzeichens) stehen lassen.
  const rand = Math.max(6, Math.round(W * 0.045));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(rand, rand, W - 2 * rand, H - 2 * rand);

  // Textbereich: zentriert, geringer Innenabstand → groessere Schrift.
  const padX = W * 0.06;
  const maxTextW = W - 2 * padX;
  const maxTextH = H - 2 * rand - H * 0.04;

  // Schriftgroesse iterativ verkleinern bis es passt (groesser starten).
  let fontSize = Math.round(H * 0.34);
  let lines = [];
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (; fontSize >= 12; fontSize -= 2) {
    ctx.font = `700 ${fontSize}px Arial, sans-serif`;
    lines = wrapLines(ctx, text.trim(), maxTextW);
    const totalH = lines.length * fontSize * 1.15;
    if (lines.length <= 5 && totalH <= maxTextH) break;
  }

  ctx.fillStyle = "#000000";
  const lineH = fontSize * 1.15;
  const startY = H / 2 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((ln, i) => {
    ctx.fillText(ln, W / 2, startY + i * lineH);
  });

  return canvas;
}

/**
 * Laedt ein Bild und gibt das fertige Canvas zurueck (Promise).
 */
export function loadWunschtextCanvas(src, text) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(renderWunschtextCanvas(img, text));
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 2D-Vorschau als DataURL.
 */
export async function wunschtextDataUrl(src, text) {
  const canvas = await loadWunschtextCanvas(src, text);
  return canvas.toDataURL("image/png");
}
