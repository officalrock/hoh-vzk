# Rendert die Einzel-Plan-PDFs zu PNG (assets/regelplaene/png/<id>.png) UND
# erzeugt vzk3d/src/data/regelplaene.json mit Titel, Bild und einem
# Material-SEED (Sperrmaterial aus dem Plantext + ggf. im Text genannte
# Verkehrszeichen). Die übrigen Schilder ergänzt der Nutzer per Plus-Button.
import os, re, glob, json
import pdfplumber
import pypdfium2 as pdfium

D = r"C:\Users\npetri\VZK App\assets\regelplaene"
PNG_DIR = os.path.join(D, "png")
OUT = r"C:\Users\npetri\VZK App\vzk3d\src\data\regelplaene.json"
ZEICHEN = r"C:\Users\npetri\VZK App\vzk3d\src\data\zeichen.json"

ART = {"B": "innerorts", "C": "landstrasse", "D": "autobahn"}
ROEM = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5, "VI": 6}
FNAME = re.compile(r"^Regelplan ([BCD]) ([IVX]{1,4})-(\d+)\.pdf$", re.I)
HEAD = re.compile(r"Regelplan\s+[BCD]\s*[IVX]{1,4}\s*/\s*\d+")

SIGNS_MAP = r"C:\Users\npetri\VZK App\tools\plan-signs.json"

os.makedirs(PNG_DIR, exist_ok=True)
with open(ZEICHEN, encoding="utf-8") as fh:
    zmap = {z["nummer"]: z for z in json.load(fh)}

# Manuell/per Bildanalyse gepflegte Zeichenliste je Plan (id -> [{nummer,anzahl}]).
plan_signs = {}
if os.path.exists(SIGNS_MAP):
    with open(SIGNS_MAP, encoding="utf-8") as fh:
        plan_signs = json.load(fh)


def render_png(pdf_path, png_path, scale=2.0):
    pdf = pdfium.PdfDocument(pdf_path)
    page = pdf[0]
    bmp = page.render(scale=scale)
    img = bmp.to_pil()
    img.save(png_path)
    pdf.close()
    return img.size


def plan_text(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        pg = pdf.pages[0]
        full = pg.extract_text() or ""
        crop = pg.within_bbox((pg.width * 0.5, 0, pg.width, pg.height * 0.32))
        head = crop.extract_text() or ""
    return full, head


def titel(head):
    t = HEAD.sub("", head, count=1)
    t = t.replace("-\n", "").replace("\n", " ")
    t = re.sub(r"\s+", " ", t).strip(" .[]")
    if len(t) > 130:
        t = t[:130].rsplit(" ", 1)[0] + " …"
    return t


# RSA21-Regelabstände (m) je Straßenart – Defaults, in der App editierbar.
LEITBAKE_ABSTAND = {"innerorts": 9, "landstrasse": 12, "autobahn": 20}
LEITKEGEL_ABSTAND = {"innerorts": 5, "landstrasse": 9, "autobahn": 10}


def material_seed(text, strassenart="innerorts"):
    low = text.lower()
    sperr = []
    if "leitbak" in low:
        m = re.search(r"abstand\s*max\.?\s*(\d+)\s*m", low)
        abstand = int(m.group(1)) if m else LEITBAKE_ABSTAND.get(strassenart, 9)
        seiten = 2 if "doppelseitig" in low else 1
        sperr.append({"name": "Leitbake (Z 605)", "einheit": "Stk.", "fussplattenJe": 1,
                      "modus": "laenge", "abstand": abstand, "seiten": seiten})
    if "leitkegel" in low:
        sperr.append({"name": "Leitkegel (Z 610)", "einheit": "Stk.", "fussplattenJe": 0,
                      "modus": "laenge", "abstand": LEITKEGEL_ABSTAND.get(strassenart, 5), "seiten": 1})
    if "absperrschranke" in low or "schrankengitter" in low:
        sperr.append({"name": "Absperrschrankengitter (Z 600)", "einheit": "Stk.", "fussplattenJe": 2,
                      "modus": "fix", "anzahl": 1})
    if "warnleucht" in low:
        m = re.search(r"mindestens\s*(\d+)\s*[\w\s]*warnleucht", low)
        sperr.append({"name": "Warnleuchte gelb", "einheit": "Stk.", "fussplattenJe": 0,
                      "modus": "fix", "anzahl": int(m.group(1)) if m else 3})
    if "absperrtafel" in low or "blinkpfeil" in low:
        sperr.append({"name": "Fahrbare Absperrtafel (Z 616)", "einheit": "Stk.", "fussplattenJe": 0,
                      "modus": "fix", "anzahl": 1})

    # Verkehrszeichen sind im Plan mit "Z <Nr>" beschriftet – teils 180°
    # gedreht. Daher jede Zeile in beiden Leserichtungen nach "Z ###" prüfen.
    ZRE = re.compile(r"Z\s*(\d{3}(?:[-.]\d+)?)")
    counts = {}
    for line in text.splitlines():
        gefunden = set()
        for variant in (line, line[::-1]):
            for nr in ZRE.findall(variant):
                nr = nr.replace(".", "-")
                if nr in zmap:
                    gefunden.add(nr)
        for nr in gefunden:
            counts[nr] = counts.get(nr, 0) + 1
    zeichen = [{"nummer": nr, "anzahl": n} for nr, n in counts.items()]
    return {"zeichen": zeichen, "sperr": sperr}


plaene = []
for f in glob.glob(os.path.join(D, "Regelplan *.pdf")):
    bn = os.path.basename(f)
    m = FNAME.match(bn)
    if not m:
        continue
    teil, ab, nr = m.group(1).upper(), m.group(2).upper(), int(m.group(3))
    pid = f"{teil}{ab}-{nr}"
    png_name = f"{pid}.png"
    try:
        render_png(f, os.path.join(PNG_DIR, png_name))
        bild = f"regelplaene/png/{png_name}"
    except Exception as e:
        print("PNG-Fehler", bn, e)
        bild = None
    full, head = plan_text(f)
    seed = material_seed(full, ART.get(teil, "innerorts"))
    # Bildanalyse-Zeichen einmischen (überschreiben/ergänzen Text-Funde, dedupe)
    if pid in plan_signs:
        vorhanden = {z["nummer"]: z for z in seed["zeichen"]}
        for s in plan_signs[pid]:
            if s.get("nummer") in zmap:
                vorhanden[s["nummer"]] = {"nummer": s["nummer"], "anzahl": s.get("anzahl", 1)}
        seed["zeichen"] = list(vorhanden.values())
    plaene.append({
        "id": pid,
        "nr": f"{teil} {ab} / {nr}",
        "teil": teil,
        "abschnitt": ab,
        "nrNum": nr,
        "strassenart": ART.get(teil, "innerorts"),
        "titel": titel(head) or f"Regelplan {teil} {ab}/{nr}",
        "bild": bild,
        "pdf": f"regelplaene/{bn}",
        "material": seed,
    })

plaene.sort(key=lambda p: (p["teil"], ROEM.get(p["abschnitt"], 9), p["nrNum"]))
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(plaene, fh, ensure_ascii=False)

mitbild = sum(1 for p in plaene if p["bild"])
print(f"regelplaene.json: {len(plaene)} Plaene, {mitbild} mit PNG -> {OUT}")
for p in plaene[:3]:
    print(f"  {p['nr']}: sperr={len(p['material']['sperr'])} zeichen={len(p['material']['zeichen'])}")
