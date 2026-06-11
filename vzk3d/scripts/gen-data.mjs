// Generiert src/data/zeichen.json aus dem bestehenden Datenbestand
// ../../js/data-zeichen.js (VZ_DATA, 1743 Einträge aus dem PVerkehr-Katalog).
// So bleibt der Katalog leicht erweiterbar: einfach data-zeichen.js pflegen
// und `npm run gen-data` ausführen.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, "..", "..", "js", "data-zeichen.js");
const OUT_DIR = resolve(here, "..", "src", "data");
const OUT = resolve(OUT_DIR, "zeichen.json");

// data-zeichen.js deklariert `const VZ_DATA = [...]`. Wir lesen den Text und
// werten das Array in einer Sandbox aus (kein Browser-Kontext nötig).
const text = readFileSync(SRC, "utf8");
// eslint-disable-next-line no-new-func
const VZ_DATA = Function(`${text}; return VZ_DATA;`)();

// Kurze, kategorieabhängige Bedeutungstexte (erweiterbar). Bewusst neutral
// gehalten – fachliche Detailtexte können je Zeichen ergänzt werden.
const KAT_BEDEUTUNG = {
  Gefahrzeichen:
    "Gefahrzeichen warnen vor Gefahrstellen und mahnen zu erhöhter Aufmerksamkeit und Bremsbereitschaft.",
  Vorschriftzeichen:
    "Vorschriftzeichen ordnen Ge- oder Verbote an, die verbindlich zu befolgen sind.",
  Richtzeichen:
    "Richtzeichen geben besondere Hinweise zur Erleichterung des Verkehrs oder zur Orientierung.",
  Zusatzzeichen:
    "Zusatzzeichen stehen unter einem Verkehrszeichen und schränken dessen Bedeutung ein oder erweitern sie.",
  Verkehrseinrichtungen:
    "Verkehrseinrichtungen sichern und leiten den Verkehr, etwa an Arbeits- und Unfallstellen.",
  Sinnbilder:
    "Sinnbilder kennzeichnen Verkehrsarten und Fahrzeuggruppen auf Verkehrszeichen.",
  Markierung:
    "Markierungen regeln und leiten den Verkehr auf der Fahrbahn.",
  Markierungen:
    "Markierungen regeln und leiten den Verkehr auf der Fahrbahn.",
  Lichtsignalanlagen:
    "Lichtsignale regeln den Verkehrsablauf an Knotenpunkten und Übergängen.",
  RMS: "Verkehrszeichen und Symbole der Richtlinien für die Markierung von Straßen.",
  Sonstige: "Weiteres Verkehrszeichen aus dem Verkehrszeichenkatalog.",
};

const records = VZ_DATA.map((z) => {
  const kategorie = z.kategorie || "Sonstige";
  return {
    nummer: z.nummer,
    name: z.name || `Zeichen ${z.nummer}`,
    kategorie,
    gruppe: z.gruppe || "",
    bild: `zeichen/${z.bild}`,
    bedeutung: KAT_BEDEUTUNG[kategorie] || KAT_BEDEUTUNG.Sonstige,
    // Platz für fachliche Detailtexte je Zeichen (erweiterbar):
    beschreibung: "",
    anwendung: "",
  };
});

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(records, null, 0), "utf8");
console.log(`zeichen.json geschrieben: ${records.length} Zeichen -> ${OUT}`);
