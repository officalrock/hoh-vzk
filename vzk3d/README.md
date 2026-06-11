# VZK – Verkehrszeichenkatalog (3D-Frontend)

Modernes Frontend für Verkehrssicherer: vollständiger Katalog aller deutschen
Verkehrszeichen nach StVO/VzKat, mit durchsuchbarem Katalog und einer
3D-Detailansicht (Schild auf Pfosten, frei drehbar/zoombar).

Stack: **React 18 + Vite + react-three-fiber/drei (Three.js)**. Dark Mode ist
Standard. Mobile-first, handschuhtaugliche Touch-Ziele, sonnenlichttauglicher
Kontrast. 3D nur dort, wo es Nutzen bringt (Hero + Detail); auf schwachen
Geräten und bei `prefers-reduced-motion` automatischer Fallback auf Standbilder.

## Schnellstart

Voraussetzung: Node.js ≥ 18 (getestet mit Node 24, npm 11).

```bash
cd vzk3d
npm install        # Abhängigkeiten installieren
npm run dev        # Dev-Server auf http://localhost:5173
```

Weitere Befehle:

```bash
npm run build      # Produktions-Build nach dist/
npm run preview    # gebauten Stand lokal ausliefern
npm run gen-data   # src/data/zeichen.json neu aus ../js/data-zeichen.js erzeugen
```

`npm run dev` und `npm run build` rufen `gen-data` automatisch vorher auf.

## Assets

Die Zeichen-Grafiken, das Logo und die Icons liegen weiterhin im bestehenden
Projektordner `../assets` und werden **nicht dupliziert**: Vite serviert diesen
Ordner als statisches Verzeichnis (`publicDir` in `vite.config.js`). So ist z. B.
`../assets/zeichen/274-30.png` unter `/zeichen/274-30.png` erreichbar.

## Datenstruktur der Zeichen (JSON)

Erzeugt von `scripts/gen-data.mjs` nach `src/data/zeichen.json` (1743 Zeichen).
Ein Eintrag:

```json
{
  "nummer": "274-50",
  "name": "Zulässige Höchstgeschwindigkeit 50 km/h",
  "kategorie": "Vorschriftzeichen",
  "gruppe": "",
  "bild": "zeichen/274-50.png",
  "bedeutung": "Vorschriftzeichen ordnen Ge- oder Verbote an, die verbindlich zu befolgen sind.",
  "beschreibung": "",
  "anwendung": ""
}
```

| Feld          | Bedeutung |
|---------------|-----------|
| `nummer`      | VZ-Nummer (Suchschlüssel), z. B. `274-50` |
| `name`        | Bezeichnung |
| `kategorie`   | Gefahrzeichen, Vorschriftzeichen, Richtzeichen, Zusatzzeichen, Verkehrseinrichtungen … |
| `gruppe`      | optionale Untergruppe |
| `bild`        | Pfad zur Grafik relativ zu `/` (also `zeichen/<datei>.png`) |
| `bedeutung`   | kurzer, kategorieabhängiger Bedeutungstext |
| `beschreibung`| optionaler Detailtext je Zeichen (überschreibt `bedeutung` in der Anzeige) |
| `anwendung`   | optionale Hinweise zur Anwendung |

**Erweitern:** entweder `../js/data-zeichen.js` pflegen und `npm run gen-data`
ausführen, oder `beschreibung`/`anwendung` direkt je Zeichen ergänzen (die
Felder sind bereits angelegt).

## Komponentenstruktur

```
vzk3d/
├─ index.html                 # Einstieg, Theme-Default (dark), Favicons
├─ vite.config.js             # publicDir -> ../assets, three in eigenem Chunk
├─ scripts/gen-data.mjs       # erzeugt src/data/zeichen.json
└─ src/
   ├─ main.jsx                # Mount + Theme-/View-Provider
   ├─ App.jsx                 # Ansichts-Switch (Dashboard | Katalog | Detail)
   ├─ theme/
   │  └─ tokens.js            # zentrale Design-Tokens (Farben, Radien, Abstände)
   ├─ styles/global.css       # CSS-Variablen, Dark/Light, Reset, Fokus
   ├─ app/
   │  ├─ ThemeContext.jsx     # Dark/Light, Persistenz, Toggle
   │  └─ ViewContext.jsx      # Hash-Router (#/ , #/katalog , #/zeichen/<nr>)
   ├─ hooks/
   │  ├─ usePrefersReducedMotion.js
   │  └─ usePerformanceTier.js   # entscheidet 3D vs. statisch
   ├─ utils/
   │  ├─ assetPath.js         # URL-Aufbau zu ../assets
   │  └─ search.js            # Filter/Suche + Kategorien
   ├─ components/
   │  ├─ ui/
   │  │  ├─ Button.jsx
   │  │  ├─ CategoryBadge.jsx
   │  │  └─ ui.css
   │  ├─ layout/
   │  │  ├─ AppShell.jsx
   │  │  ├─ TopBar.jsx
   │  │  ├─ ThemeToggle.jsx
   │  │  └─ layout.css
   │  └─ catalog/
   │     ├─ SearchBar.jsx
   │     ├─ CategoryFilter.jsx
   │     ├─ SignCard.jsx
   │     ├─ SignGrid.jsx      # inkrementelles Laden (IntersectionObserver)
   │     └─ catalog.css
   ├─ pages/
   │  ├─ Dashboard.jsx        # 3D-Hero + Modul-Kacheln
   │  ├─ Catalog.jsx          # Suche, Filter, Grid
   │  ├─ SignDetail.jsx       # 3D-Highlight + Infopanel
   │  ├─ dashboard.css / catalog ../components / detail.css
   └─ three/
      ├─ Hero3D.jsx           # schwebende Zeichen, Parallax (lazy)
      ├─ SignScene.jsx        # Canvas + Licht + OrbitControls (lazy)
      ├─ SignBoard.jsx        # Schild auf Pfosten, Textur + graue Rückseite
      └─ Canvas3DBoundary.jsx # Fehlergrenze -> statischer Fallback
```

### Ansichten

- **Dashboard** (`#/`): 3D-Hero mit schwebenden Zeichen (Parallax), Einstieg in
  den Katalog, Kacheln für weitere Module (Regelpläne, Checklisten, Windlast –
  als erweiterbare Platzhalter angelegt).
- **Katalog** (`#/katalog`): Suche nach VZ-Nummer/Bezeichnung, Kategorie-Filter,
  Karten-Grid. Bewusst nüchtern und schnell (inkrementelles Nachladen, Lazy
  Images). Such-/Filterzustand ist über die URL deep-linkbar.
- **Detailansicht** (`#/zeichen/<nummer>`): das Zeichen als 3D-Objekt auf einem
  Pfosten (Grafik als Textur, graue Rückseite, retroreflektierender Look),
  frei drehbar/zoombar; daneben Nummer, Bezeichnung, Kategorie, Bedeutung und
  Stammdaten. Umschalter 3D ↔ Standbild.

## Barrierefreiheit & Performance

- Tastaturbedienung (alle Karten/Buttons fokussierbar), kräftiger Fokusring,
  `aria`-Rollen für Tabs/Status, Alt-Texte mit VZ-Nummer + Bezeichnung.
- Dark/Light mit ausreichendem Kontrast; Signalfarben semantisch als
  Kategorie-Codierung.
- `prefers-reduced-motion` und schwache Geräte → statt 3D statische Darstellung.
- Three.js liegt in einem eigenen Chunk und wird nur für 3D-Ansichten geladen
  (Code-Splitting via `React.lazy`).

## Technisches Design-Layer (Stand 2026-06-11)

- **Landingpage-Animation – 3D-Ampel:** `three/TrafficLight.jsx` + `three/TrafficLightHero.jsx`.
  Deutsche Signalphase (Rot → Rot-Gelb → Grün → Gelb) mit glühenden Linsen
  (Bloom via `@react-three/postprocessing`), farbigen Spotlights, Tiefen-Ampeln
  und Parallax-Kamera. Live-Phasenanzeige im Liquid-Glass-HUD.
  Fallback: `components/dashboard/TrafficLightCSS.jsx` (reines CSS) bei
  reduzierter Bewegung / schwachem Gerät.
- **Liquid Glass:** `styles/glass.css` (`.glass`, `.glass-control`) – geschichtete
  Ränder + Highlight + `backdrop-filter`, mit soliden Fallbacks für
  `prefers-reduced-transparency` und fehlende `backdrop-filter`-Unterstützung.
  Angewandt auf Toolbar, Theme-Schalter, HUD und sekundäre Buttons.
- **Scroll-Kategorien:** `components/dashboard/CategoryScroller.jsx` – horizontale
  Scroll-Snap-Galerie, je Kategorie farbcodiert mit Beispiel-Zeichen; Reveal
  per IntersectionObserver (ohne Fremd-Lib). Klick filtert den Katalog.

## Hinweis

Die `bedeutung` ist derzeit kategorieabhängig (neutral). Fachliche Detailtexte
je Zeichen lassen sich über die Felder `beschreibung`/`anwendung` ergänzen,
ohne die Struktur zu ändern.
