/**
 * Regelplan-Finder / Auswertmodul (US9/US10).
 *
 * Prueft Regelplaene gegen die Rahmenbedingungen der Baustelle (Restbreite,
 * Laenge, Straßenklasse) anhand der anforderungen-Metadaten und schliesst
 * ungeeignete Plaene begruendet aus.
 *
 * WICHTIG (Constitution II): anforderungen-Werte in regelplaene.json sind
 * derzeit konservative Platzhalter und MUESSEN gegen RSA 21 geprueft werden.
 */

/**
 * Bewertet einen einzelnen Regelplan gegen die Eingaben.
 * @returns {{status:'ok'|'warn'|'fail', gruende:string[]}}
 */
export function bewerteRegelplan(plan, { restbreite, laenge, klasse }) {
  const a = plan.anforderungen;
  const gruende = [];

  if (!a) {
    return { status: 'warn', gruende: ['Keine Anforderungsdaten hinterlegt — manuell pruefen.'] };
  }

  // Restbreite
  if (restbreite != null && a.restbreite) {
    if (a.restbreite.min_m != null && restbreite < a.restbreite.min_m) {
      gruende.push(`Restbreite zu schmal: Plan erfordert ≥ ${a.restbreite.min_m} m, vorhanden ${restbreite} m.`);
    }
    if (a.restbreite.max_m != null && restbreite > a.restbreite.max_m) {
      gruende.push(`Restbreite zu groß: Plan gilt bis ${a.restbreite.max_m} m, vorhanden ${restbreite} m.`);
    }
  }

  // Laenge
  if (laenge != null && a.laenge) {
    if (a.laenge.min_m != null && laenge < a.laenge.min_m) {
      gruende.push(`Länge unter Mindestwert: Plan ab ${a.laenge.min_m} m, vorhanden ${laenge} m.`);
    }
    if (a.laenge.max_m != null && laenge > a.laenge.max_m) {
      gruende.push(`Länge über Höchstwert: Plan bis ${a.laenge.max_m} m, vorhanden ${laenge} m.`);
    }
  }

  // Straßenklasse
  if (klasse && a.strassenklassen?.length && !a.strassenklassen.includes(klasse)) {
    gruende.push(`Straßenklasse passt nicht: Plan gilt fuer ${a.strassenklassen.join(', ')}.`);
  }

  if (gruende.length === 0) return { status: 'ok', gruende: [] };
  return { status: 'fail', gruende };
}

/**
 * Wertet alle Plaene aus, sortiert geeignete nach oben.
 * @returns {Array<{plan, status, gruende}>}
 */
export function findeRegelplaene(plaene, eingaben) {
  const bewertet = plaene.map((plan) => ({ plan, ...bewerteRegelplan(plan, eingaben) }));
  const rang = { ok: 0, warn: 1, fail: 2 };
  return bewertet.sort((x, y) => rang[x.status] - rang[y.status]);
}
