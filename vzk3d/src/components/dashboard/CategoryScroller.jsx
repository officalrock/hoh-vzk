import { useEffect, useMemo, useRef } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { useView } from "../../app/ViewContext.jsx";
import { assetUrl } from "../../utils/assetPath.js";
import { KATEGORIE_FARBE } from "../../theme/tokens.js";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion.js";
import zeichen from "../../data/zeichen.json";
import "./category-scroller.css";

const REIHENFOLGE = [
  "Gefahrzeichen",
  "Vorschriftzeichen",
  "Richtzeichen",
  "Zusatzzeichen",
  "Verkehrseinrichtungen",
  "Sinnbilder",
  "Markierung",
  "Lichtsignalanlagen",
  "RMS",
  "Sonstige",
];

function baueKategorien() {
  const map = new Map();
  for (const z of zeichen) {
    if (!map.has(z.kategorie)) map.set(z.kategorie, []);
    map.get(z.kategorie).push(z);
  }
  const liste = [...map.entries()].map(([name, items]) => ({
    name,
    anzahl: items.length,
    proben: items.slice(0, 4),
    farbe: KATEGORIE_FARBE[name] || KATEGORIE_FARBE.Sonstige,
  }));
  liste.sort((a, b) => {
    const ia = REIHENFOLGE.indexOf(a.name);
    const ib = REIHENFOLGE.indexOf(b.name);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return liste;
}

export function CategoryScroller() {
  const { gotoKatalog } = useView();
  const reduced = usePrefersReducedMotion();
  const kategorien = useMemo(baueKategorien, []);
  const rail = useRef(null);

  // Scroll-Reveal per IntersectionObserver (kein Fremd-Lib, kein React-Konflikt).
  useEffect(() => {
    if (reduced || !rail.current) return;
    const panels = rail.current.querySelectorAll(".catpanel");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { root: rail.current, rootMargin: "0px 80px", threshold: 0.25 }
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [reduced]);

  return (
    <section className="catscroll" aria-label="Kategorien">
      <div className="catscroll__head">
        <h2 className="catscroll__title">Kategorien</h2>
        <p className="catscroll__sub">
          Nach Zeichenart gegliedert. Wischen oder scrollen, dann in den Katalog springen.
        </p>
      </div>

      <div
        className={"catscroll__rail" + (reduced ? "" : " catscroll__rail--reveal")}
        ref={rail}
        role="list"
      >
        {kategorien.map((k, i) => (
          <button
            key={k.name}
            role="listitem"
            className="catpanel"
            style={{ "--kat": k.farbe, "--i": i }}
            onClick={() => gotoKatalog(k.name)}
          >
            <span className="catpanel__index mono">{String(i + 1).padStart(2, "0")}</span>
            <div className="catpanel__proben">
              {k.proben.map((p) => (
                <span className="catpanel__probe" key={p.nummer}>
                  <img src={assetUrl(p.bild)} alt={`${p.nummer} ${p.name}`} loading="lazy" />
                </span>
              ))}
            </div>
            <div className="catpanel__foot">
              <div>
                <div className="catpanel__name">{k.name}</div>
                <div className="catpanel__count mono">{k.anzahl} Zeichen</div>
              </div>
              <span className="catpanel__go" aria-hidden>
                <ArrowRight size={20} weight="bold" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
