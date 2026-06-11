/** Sucht/filtert die Zeichenliste nach Kategorie und Freitext (Nummer/Name). */

export function normalisieren(s) {
  return (s || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .trim();
}

export function filtereZeichen(daten, { kategorie = "alle", query = "" } = {}) {
  const woerter = normalisieren(query).split(/\s+/).filter(Boolean);
  return daten.filter((z) => {
    if (kategorie !== "alle" && z.kategorie !== kategorie) return false;
    if (!woerter.length) return true;
    const heu = normalisieren(`${z.nummer} ${z.name} ${z.kategorie} ${z.gruppe}`);
    return woerter.every((w) => heu.includes(w));
  });
}

/** Liefert sortierte Kategorien mit Anzahl. */
export function kategorienMitAnzahl(daten) {
  const map = new Map();
  for (const z of daten) map.set(z.kategorie, (map.get(z.kategorie) || 0) + 1);
  return [...map.entries()]
    .map(([name, anzahl]) => ({ name, anzahl }))
    .sort((a, b) => b.anzahl - a.anzahl);
}
