// Schrumpft js/data-zeichen.js auf die echten Verkehrszeichen.
// Behalten: Gefahrzeichen, Vorschriftzeichen, Richtzeichen, Zusatzzeichen.
// Raus: Sonstige, RMS, Lichtsignalanlagen (Ampel), Markierung(en), Sinnbilder.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(here, "..", "js", "data-zeichen.js");

const KEEP = new Set(["Gefahrzeichen", "Vorschriftzeichen", "Richtzeichen", "Zusatzzeichen"]);

const text = readFileSync(FILE, "utf8");
// eslint-disable-next-line no-new-func
const VZ_DATA = Function(`${text}; return VZ_DATA;`)();
const before = VZ_DATA.length;
const kept = VZ_DATA.filter((z) => KEEP.has(z.kategorie));

const sb = [];
sb.push("// Echte Verkehrszeichen (Gefahr-, Vorschrift-, Richt-, Zusatzzeichen).");
sb.push("// Ampeln, Fahrbahnmarkierungen, Linien etc. entfernt (filter-katalog.mjs).");
sb.push("// Bilder: assets/zeichen/<nummer>.png");
sb.push("const VZ_DATA = [");
for (const z of kept) sb.push(JSON.stringify(z) + ",");
sb.push("];");
writeFileSync(FILE, "﻿" + sb.join("\r\n") + "\r\n", "utf8");

console.log(`data-zeichen.js: ${before} -> ${kept.length} Zeichen (${before - kept.length} entfernt)`);
