/**
 * Straßenklasse-Ermittlung (US7).
 *
 * Ruft eine Backend-API auf, die aus Stadt+Straße die Straßenklasse bestimmt
 * (Gemeindestraße / Kreisstraße / Bundesstraße). Endpoint + Datenquelle liegen
 * serverseitig und sind fuer den Nutzer nicht erreichbar.
 *
 * Offline-First-Fallback (Constitution): Bei fehlendem Backend, Timeout oder
 * Fehler gibt die Funktion null zurueck → UI bietet manuelle Auswahl an.
 */

// Endpoint aus Build-Env, sonst leer (→ Fallback). Nutzer sieht nichts davon.
const API_ENDPOINT = import.meta.env.VITE_STREET_CLASS_API || '';
const TIMEOUT_MS = 3000;

export const STRASSENKLASSEN = ['Gemeindestraße', 'Kreisstraße', 'Bundesstraße'];

/**
 * @param {string} stadt
 * @param {string} strasse
 * @returns {Promise<{klasse: string|null, quelle: 'api'|'fallback', error?: string}>}
 */
export async function ermittleStrassenklasse(stadt, strasse) {
  if (!API_ENDPOINT || !stadt?.trim() || !strasse?.trim()) {
    return { klasse: null, quelle: 'fallback' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stadt: stadt.trim(), strasse: strasse.trim() }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return { klasse: null, quelle: 'fallback', error: `HTTP ${res.status}` };

    const data = await res.json();
    const klasse = STRASSENKLASSEN.includes(data?.klasse) ? data.klasse : null;
    return { klasse, quelle: 'api' };
  } catch (err) {
    clearTimeout(timer);
    return { klasse: null, quelle: 'fallback', error: String(err?.name || err) };
  }
}

/**
 * Mappt Straßenklasse → RSA-21-Teil(e) fuer Regelplan-Vorfilterung.
 * Teil B = innerorts/Gemeinde, Teil C = Land/Kreis+Bundes, Teil D = Autobahn/Bundes.
 */
export function teileFuerKlasse(klasse) {
  switch (klasse) {
    case 'Gemeindestraße':
      return ['B'];
    case 'Kreisstraße':
      return ['B', 'C'];
    case 'Bundesstraße':
      return ['C', 'D'];
    default:
      return ['B', 'C', 'D'];
  }
}
