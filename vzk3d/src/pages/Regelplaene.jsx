import { useMemo, useState, useEffect } from "react";
import { FilePdf, MapPin } from "@phosphor-icons/react";
import { useView } from "../app/ViewContext.jsx";
import { useProject } from "../hooks/useProject.js";
import { assetUrl } from "../utils/assetPath.js";
import { ermittleStrassenklasse, teileFuerKlasse, STRASSENKLASSEN } from "../lib/street-class.js";
import plaene from "../data/regelplaene.json";
import "../components/regelplan/regelplan.css";
import "./regelplaene-extra.css";

const TEILE = [
  { key: "alle", label: "Alle" },
  { key: "B", label: "Teil B · innerorts" },
  { key: "C", label: "Teil C · Landstraße" },
  { key: "D", label: "Teil D · Autobahn" },
];

export function Regelplaene() {
  const { view, gotoRegelplan } = useView();
  const { activeProject, update } = useProject();
  const [teil, setTeil] = useState(view.teil || "alle");
  const [empfohlen, setEmpfohlen] = useState(false);
  const [klasse, setKlasse] = useState(activeProject?.strassenklasse || null);
  const [lädt, setLädt] = useState(false);
  const [fallback, setFallback] = useState(false);

  // US7: bei aktivem Projekt mit Standort Straßenklasse ermitteln.
  useEffect(() => {
    if (!activeProject?.stadt || !activeProject?.strasse) return;
    if (activeProject.strassenklasse) { setKlasse(activeProject.strassenklasse); return; }
    let abbruch = false;
    setLädt(true);
    ermittleStrassenklasse(activeProject.stadt, activeProject.strasse).then((r) => {
      if (abbruch) return;
      setLädt(false);
      if (r.klasse) {
        setKlasse(r.klasse);
        update(activeProject.id, { strassenklasse: r.klasse });
      } else {
        setFallback(true); // API nicht verfuegbar → manuelle Auswahl
      }
    });
    return () => { abbruch = true; };
  }, [activeProject]);

  const setKlasseManuell = (k) => {
    setKlasse(k);
    setFallback(false);
    if (activeProject) update(activeProject.id, { strassenklasse: k });
  };

  const treffer = useMemo(() => {
    let list = plaene;
    if (empfohlen && klasse) {
      const teile = teileFuerKlasse(klasse);
      list = list.filter((p) => {
        const ks = p.anforderungen?.strassenklassen;
        if (ks && ks.length) return ks.includes(klasse);
        return teile.includes(p.teil); // Fallback ueber Teil-Mapping
      });
    } else if (teil !== "alle") {
      list = list.filter((p) => p.teil === teil);
    }
    return list;
  }, [teil, empfohlen, klasse]);

  return (
    <div className="container">
      <div className="rp-kopf">
        <h1>Regelpläne</h1>
        <p>Verkehrsführung an Arbeitsstellen nach RSA 21. {plaene.length} Pläne, mit Materialliste je Plan.</p>
      </div>

      {/* US7: Empfehlung nach Straßenklasse */}
      {activeProject && (
        <div className="rp-empfehlung">
          <MapPin size={18} weight="fill" />
          {lädt ? (
            <span>Straßenklasse wird ermittelt…</span>
          ) : klasse ? (
            <>
              <span>Straße: <strong>{klasse}</strong></span>
              <button
                className={"chip" + (empfohlen ? " chip--active" : "")}
                onClick={() => setEmpfohlen((v) => !v)}
              >
                {empfohlen ? "✓ Empfohlene Pläne" : "Empfohlene Pläne zeigen"}
              </button>
            </>
          ) : fallback ? (
            <span className="rp-fallback">
              Straßenklasse manuell wählen:
              {STRASSENKLASSEN.map((k) => (
                <button key={k} className="chip" onClick={() => setKlasseManuell(k)}>{k}</button>
              ))}
            </span>
          ) : null}
        </div>
      )}

      {!empfohlen && (
        <div className="rp-filter">
          {TEILE.map((t) => (
            <button
              key={t.key}
              className={"chip" + (teil === t.key ? " chip--active" : "")}
              onClick={() => setTeil(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {treffer.length === 0 ? (
        <div className="leer">Keine passenden Regelpläne gefunden.</div>
      ) : (
        <div className="rp-grid">
          {treffer.map((p) => (
            <button key={p.id} className="rp-card" onClick={() => gotoRegelplan(p.id)}>
              <div className="rp-card__bild">
                {p.bild ? (
                  <img src={assetUrl(p.bild)} alt={`Regelplan ${p.nr}`} loading="lazy" />
                ) : (
                  <FilePdf size={48} weight="thin" color="var(--signal-rot)" />
                )}
              </div>
              <div className="rp-card__body">
                <div className="rp-card__nr mono">{p.nr}</div>
                <div className="rp-card__titel">{p.titel}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
