/**
 * Straßenklasse-Ermittlung via OpenStreetMap Nominatim.
 *
 * Mapping (deutsche Straßenverwaltung):
 *   ref "A …"/"B …" | type motorway/trunk/primary → Bundesstraße
 *   ref "K …"/"L …" | type secondary/tertiary     → Kreisstraße
 *   type residential/unclassified/living_street   → Gemeindestraße
 *
 * Nominatim liefert pro Treffer `type` (= highway-Wert) und in `extratags.ref`
 * die amtliche Widmung (z. B. "B 55"). Zuverlaessiger als Overpass-Area-Querys.
 */

const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = 8000;

export const STRASSENKLASSEN = ['Gemeindestraße', 'Kreisstraße', 'Bundesstraße'];

/**
 * Mappt OSM ref/highway → Straßenklasse.
 */
export function mapToKlasse(tags = {}) {
  const ref = (tags.ref || '').toUpperCase().trim();
  const hw = (tags.highway || '').toLowerCase();

  // ref-Prefix hat Vorrang (amtliche Widmung)
  if (/^A[\s-]?\d/.test(ref)) return 'Bundesstraße'; // Autobahn → hoechste verfuegbare Klasse
  if (/^B[\s-]?\d/.test(ref)) return 'Bundesstraße';
  if (/^[KL][\s-]?\d/.test(ref)) return 'Kreisstraße'; // Kreis- + Landesstraße

  // Fallback ueber highway-Typ
  if (hw === 'motorway' || hw === 'trunk' || hw === 'primary') return 'Bundesstraße';
  if (hw === 'secondary' || hw === 'tertiary') return 'Kreisstraße';
  if (
    hw === 'residential' ||
    hw === 'living_street' ||
    hw === 'unclassified' ||
    hw === 'service'
  ) {
    return 'Gemeindestraße';
  }
  return null; // unbekannt → Aufrufer faellt auf manuelle Auswahl zurueck
}

/**
 * Hauptfunktion: stadt+strasse → { klasse, quelle, ref?, highway? }.
 */
export async function ermittleStrassenklasse(stadt, strasse) {
  if (!stadt?.trim() || !strasse?.trim()) {
    return { klasse: null, quelle: 'fehler', error: 'stadt und strasse erforderlich' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Free-form q= (structured street=/city= ist bei Nominatim staerker gedrosselt).
  const q = `${strasse.trim()}, ${stadt.trim()}`;
  const url =
    `${NOMINATIM_URL}?q=${encodeURIComponent(q)}` +
    `&countrycodes=de&format=jsonv2&extratags=1&limit=10`;

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim verlangt aussagekraeftigen User-Agent (sonst 403/429).
        'User-Agent': 'VZK-App-StreetClass/1.0 (Baustellenabsicherung; kontakt@hoh-verkehrstechnik.de)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return { klasse: null, quelle: 'fehler', error: `Nominatim HTTP ${res.status}` };

    const treffer = await res.json();
    if (!Array.isArray(treffer) || !treffer.length) {
      return { klasse: null, quelle: 'osm', error: 'Straße nicht gefunden' };
    }

    // Hoechste gefundene Klassifizierung gewinnt (sicherste Annahme).
    const rang = { Gemeindestraße: 0, Kreisstraße: 1, Bundesstraße: 2 };
    let beste = null, refTag = null, hwTag = null;
    for (const t of treffer) {
      // nur Straßen-Objekte beruecksichtigen (jsonv2: category; sonst addresstype)
      const istStrasse = t.category === 'highway' || t.addresstype === 'road' || t.class === 'highway';
      if (!istStrasse) continue;
      const tags = { ref: t.extratags?.ref, highway: t.type };
      const k = mapToKlasse(tags);
      if (k && (!beste || rang[k] > rang[beste])) {
        beste = k;
        refTag = tags.ref || null;
        hwTag = tags.highway || null;
      }
    }

    if (!beste) return { klasse: null, quelle: 'osm', error: 'keine Klassifizierung moeglich' };
    return { klasse: beste, quelle: 'osm', ref: refTag, highway: hwTag };
  } catch (err) {
    clearTimeout(timer);
    return { klasse: null, quelle: 'fehler', error: String(err?.name || err) };
  }
}
