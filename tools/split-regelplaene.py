# Splittet die RSA-Regelplan-Sammel-PDFs seitenweise. Jede Plan-Seite (Kopf
# oben rechts "Regelplan <Teil> <Abschnitt>/<Nr>") wird als eigene PDF mit
# entsprechendem Dateinamen im selben Verzeichnis gespeichert. Nicht-Plan-
# Seiten (Deckblatt, Inhalt, Rueckseite) werden uebersprungen.
import os, re, glob
import pdfplumber
from pypdf import PdfReader, PdfWriter

D = r"C:\Users\npetri\VZK App\assets\regelplaene"
PAT = re.compile(r"Regelplan\s+([BCD])\s*([IVX]{1,4})\s*/\s*(\d+)")

def plan_id(page):
    crop = page.within_bbox((page.width * 0.5, 0, page.width, page.height * 0.30))
    txt = (crop.extract_text() or "").replace("\n", " ")
    m = PAT.search(txt)
    if not m:
        return None
    teil, abschnitt, nr = m.group(1), m.group(2), m.group(3)
    return teil, abschnitt, nr

def split(pdf_path):
    name = os.path.basename(pdf_path)
    print(f"\n=== {name} ===")
    reader = PdfReader(pdf_path)
    out, skipped = [], []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            pid = plan_id(page)
            if not pid:
                skipped.append(i + 1)
                continue
            teil, ab, nr = pid
            fname = f"Regelplan {teil} {ab}-{nr}.pdf"
            dest = os.path.join(D, fname)
            w = PdfWriter()
            w.add_page(reader.pages[i])
            with open(dest, "wb") as fh:
                w.write(fh)
            out.append((i + 1, fname))
            print(f"  S{i+1:2d} -> {fname}")
    print(f"  {len(out)} Plaene gespeichert, uebersprungen: {skipped}")
    return out

total = 0
for f in sorted(glob.glob(os.path.join(D, "*.pdf"))):
    bn = os.path.basename(f)
    # nur die beiden Sammel-PDFs verarbeiten
    if not bn.lower().startswith("regelplaene_"):
        continue
    total += len(split(f))
print(f"\nGesamt: {total} Einzel-Plaene erzeugt.")
