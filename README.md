# VZK App – Verkehrszeichenkatalog & RSA 21

Web-App ohne Server und ohne Installation: einfach **`index.html` doppelklicken** (läuft in jedem modernen Browser).

## Funktionen

| Reiter | Funktion |
|---|---|
| **Katalog** | Alle Verkehrszeichen mit Suche (Nummer/Name) und Kategorie-Filter |
| **Regelpläne** | Regelplan-Bibliothek nach RSA 21, filterbar nach Teil B/C/D und Dauer |
| **Bewertung** | Verkehrssituation per Parameter-Abfrage bewerten → passende Regelpläne werden vorgeschlagen |
| **Materialliste** | Nach Angabe der Baustellenlänge wird die Materialliste berechnet (Druck & CSV-Export) |

## Projektstruktur

```
VZK App/
├── index.html                  ← App starten
├── css/style.css               ← Layout/Design
├── js/
│   ├── app.js                  ← Anwendungslogik
│   ├── data-zeichen.js         ← DATEN: Verkehrszeichenkatalog
│   └── data-regelplaene.js     ← DATEN: Regelpläne RSA 21
├── assets/
│   ├── zeichen/                ← eigene Zeichen-Grafiken (SVG/PNG)
│   └── regelplaene/            ← Regelplan-Zeichnungen (PDF/PNG)
└── tools/
    └── parse-zeichen.ps1       ← optionaler Generator für data-zeichen.js
```

## Inhalte einpflegen

### 1. Verkehrszeichen (`js/data-zeichen.js`)

Ein Eintrag pro Zeichen:

```js
{ "nummer": "274-30", "name": "Zulässige Höchstgeschwindigkeit 30 km/h",
  "kategorie": "Vorschriftzeichen", "gruppe": "Geschwindigkeitsbeschränkungen", "bild": "" },
```

**Bilder:** Grafiken in `assets/zeichen/` ablegen, Dateiname = Zeichennummer
(z. B. `274-30.svg` oder `274-30.png`). Die App sucht automatisch zuerst dort.
Aktuell ist ein Demo-Datenbestand (aus der Wikipedia-Bildtafel generiert) enthalten –
er kann komplett ersetzt werden.

### 2. Regelpläne (`js/data-regelplaene.js`)

Die Datei enthält ein ausführlich kommentiertes Schema und Beispiel-Einträge
(als PLATZHALTER gekennzeichnet). Je Regelplan werden gepflegt:

- **Stammdaten:** Nummer, Titel, Straßenart, Dauer, Lage, Verkehrsführung, zul. Geschwindigkeit, Mindest-Restbreite
- **Beschilderung:** Zeichen mit festen Stückzahlen
- **materialProLaenge:** längenabhängiges Material (z. B. Leitbaken alle 10 m)
- **materialFest:** sonstiges Material (LSA, Absperrtafeln, Warnleuchten …)

**Plan-Zeichnungen:** PDF/PNG in `assets/regelplaene/` ablegen
(Dateiname = `id` des Plans, z. B. `B-I-1.pdf`) und im Datensatz unter `datei` eintragen.

### 3. Bewertungslogik anpassen

Die vereinfachte RSA-Ableitung (Restbreite ≥ 5,50 m innerorts → Gegenverkehr möglich;
2,75–5,50 m → einstreifig mit LSA/Vorrang; < 2,75 m → Umleitung) steht in
`js/app.js`, Funktion `verkehrsfuehrungAbleiten()` und kann dort angepasst werden.

## Hinweis

Die enthaltenen Regelplan-Beispiele und Materialregeln sind **Platzhalter** und ersetzen
nicht die Prüfung anhand der offiziellen RSA 21 / des VzKat. Maßgeblich sind stets die
amtlichen Unterlagen und die verkehrsrechtliche Anordnung.
