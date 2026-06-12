# VZK Straßenklasse-API (Backend)

Ermittelt aus **Stadt + Straße** die Straßenklasse (Gemeindestraße / Kreisstraße /
Bundesstraße) über die OpenStreetMap **Overpass API**. Liest die `ref`- und
`highway`-Tags der Straße.

Das Frontend (`vzk3d`) ruft diesen Service transparent auf. Bei Fehler/Timeout
liefert er `klasse: null` → das Frontend bietet manuelle Auswahl an
(Offline-First-Fallback der App).

## Start

```bash
cd backend
npm install
npm start          # läuft auf http://localhost:8787
```

## Endpoints

```
GET  /health                 → { ok: true, klassen: [...] }
POST /api/street-class       Body: { "stadt": "...", "strasse": "..." }
                             → { klasse, quelle, ref?, highway? }
```

### Beispiel

```bash
curl -X POST http://localhost:8787/api/street-class \
  -H "Content-Type: application/json" \
  -d '{"stadt":"Köln","strasse":"Aachener Straße"}'
```

## Frontend-Anbindung

Im `vzk3d`-Build die Env setzen, damit `lib/street-class.js` den Endpoint nutzt:

```
# vzk3d/.env
VITE_STREET_CLASS_API=http://localhost:8787/api/street-class
```

Ohne diese Env nutzt das Frontend direkt den manuellen Fallback (kein Backend-Call).

## Konfiguration (Env)

| Var | Default | Zweck |
|-----|---------|-------|
| `PORT` | `8787` | Server-Port |
| `CORS_ORIGINS` | `http://localhost:5173` | Erlaubte Frontend-Origins (kommagetrennt) |
| `NOMINATIM_URL` | `https://nominatim.openstreetmap.org/search` | Geocoder-Endpoint |

## Mapping-Logik

| OSM-Signal | Klasse |
|-----------|--------|
| `ref` A…/B… · `type` motorway/trunk/primary | Bundesstraße |
| `ref` K…/L… · `type` secondary/tertiary | Kreisstraße |
| `type` residential/living_street/unclassified/service | Gemeindestraße |
| unbekannt | `null` → manueller Fallback im Frontend |

Bei mehreren Treffern gewinnt die **höchste** Klasse (sicherste Annahme; eine
Straße mit primary- und residential-Abschnitten wird als Bundesstraße geführt).

## Hinweise

- Datenquelle: Nominatim **free-form** `q=`-Suche (`category=highway`, `type`,
  `extratags.ref`). Die strukturierte `street=/city=`-API ist stärker gedrosselt.
- ⚠️ **Nominatim-Nutzungspolicy: max. 1 Anfrage/Sekunde.** Bei Burst → leere
  Treffer. Für Mehrnutzer-Produktion eigenen Nominatim-Server hosten oder
  Geocoding-Ergebnisse cachen.
- In-Memory Rate-Limit (eingehend): 30 Anfragen/Minute/IP.
- Kein Datenbank-Bedarf; zustandslos außer Rate-Limit-Zähler.
