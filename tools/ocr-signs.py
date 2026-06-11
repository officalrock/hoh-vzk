# OCR-Erkennung der Verkehrszeichen je Regelplan. Die Schilder sind im Plan
# mit "Z <Nr>" beschriftet (teils gedreht, teils vektorisiert -> kein PDF-Text).
# Daher: PDF rendern, in 4 Drehungen OCR, "Z ###" gegen den Zeichenkatalog
# validieren (Sperrmaterial wie 600/605/610 ist nicht im Katalog -> fällt raus),
# Vorkommen zählen. Ergebnis -> tools/plan-signs.json (vom Generator gemergt).
import os, re, glob, json
import pypdfium2 as pdfium
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

D = r"C:\Users\npetri\VZK App\assets\regelplaene"
ZEICHEN = r"C:\Users\npetri\VZK App\vzk3d\src\data\zeichen.json"
OUT = r"C:\Users\npetri\VZK App\tools\plan-signs.json"

FNAME = re.compile(r"^Regelplan ([BCD]) ([IVX]{1,4})-(\d+)\.pdf$", re.I)
ZRE = re.compile(r"Z\s*[-—]?\s*(\d{3}(?:[-.]\d+)?)")

with open(ZEICHEN, encoding="utf-8") as fh:
    zset = {z["nummer"] for z in json.load(fh)}


def signs_for(pdf_path):
    img = pdfium.PdfDocument(pdf_path)[0].render(scale=4).to_pil().convert("L")
    counts = {}
    for ang in (0, 180, 90, 270):
        pg = img.rotate(ang, expand=True) if ang else img
        txt = pytesseract.image_to_string(pg, config="--psm 11")
        seen = {}
        for nr in ZRE.findall(txt):
            nr = nr.replace(".", "-")
            # auch verkürzte Hauptnummer prüfen (z. B. 274 falls 274-70 nicht im Katalog)
            cand = nr if nr in zset else nr.split("-")[0]
            if cand in zset:
                seen[cand] = seen.get(cand, 0) + 1
        for nr, n in seen.items():
            counts[nr] = max(counts.get(nr, 0), n)  # je Drehung Max, nicht summieren
    return [{"nummer": nr, "anzahl": n} for nr, n in sorted(counts.items())]


result = {}
files = sorted(glob.glob(os.path.join(D, "Regelplan *.pdf")))
for i, f in enumerate(files, 1):
    m = FNAME.match(os.path.basename(f))
    if not m:
        continue
    pid = f"{m.group(1).upper()}{m.group(2).upper()}-{int(m.group(3))}"
    result[pid] = signs_for(f)
    zs = ",".join(f'{z["nummer"]}x{z["anzahl"]}' for z in result[pid])
    print(f"[{i}/{len(files)}] {pid:8s} {zs}")

with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(result, fh, ensure_ascii=False, indent=1)
mit = sum(1 for v in result.values() if v)
print(f"\nplan-signs.json: {len(result)} Plaene, {mit} mit Zeichen -> {OUT}")
