import { useMemo, useState } from "react";
import { CheckCircle, WarningCircle, XCircle, Package } from "@phosphor-icons/react";
import { useView } from "../app/ViewContext.jsx";
import { usePackingList } from "../hooks/usePackingList.js";
import { findeRegelplaene } from "../lib/rule-advisor.js";
import { STRASSENKLASSEN } from "../lib/street-class.js";
import plaene from "../data/regelplaene.json";
import "./auswertung.css";

const STATUS_META = {
  ok:   { icon: CheckCircle,   label: "Geeignet",        cls: "av-ok" },
  warn: { icon: WarningCircle, label: "Mit Vorbehalt",   cls: "av-warn" },
  fail: { icon: XCircle,       label: "Nicht geeignet",  cls: "av-fail" },
};

export function Auswertung() {
  const { gotoRegelplan } = useView();
  const { importRegelplan } = usePackingList();
  const [restbreite, setRestbreite] = useState("");
  const [laenge, setLaenge] = useState("");
  const [klasse, setKlasse] = useState("");
  const [warnPlan, setWarnPlan] = useState(null);

  const eingaben = {
    restbreite: restbreite === "" ? null : parseFloat(restbreite),
    laenge: laenge === "" ? null : parseFloat(laenge),
    klasse: klasse || null,
  };

  const ergebnis = useMemo(() => findeRegelplaene(plaene, eingaben), [restbreite, laenge, klasse]);
  const geeignet = ergebnis.filter((e) => e.status === "ok").length;

  const uebernehmen = (eintrag) => {
    if (eintrag.status === "fail") { setWarnPlan(eintrag); return; }
    importRegelplan(eintrag.plan);
  };

  return (
    <div className="container">
      <div className="av-kopf">
        <h1>Regelplan-Finder</h1>
        <p>Rahmenbedingungen der Baustelle eingeben — die App prüft nach RSA 21, welche Regelpläne in Frage kommen.</p>
      </div>

      <div className="av-warnung">
        ⚠️ Die Eignungsprüfung beruht auf <strong>heuristisch abgeleiteten, NICHT amtlich
        verifizierten</strong> Anforderungswerten. Jeder Plan ist vor Verwendung gegen die
        amtliche RSA 21 zu prüfen. Maßgeblich ist stets die verkehrsrechtliche Anordnung.
      </div>

      <div className="av-eingabe">
        <div className="av-feld">
          <label>Restfahrbahnbreite (m)</label>
          <input type="number" step="0.1" min="0" value={restbreite}
            onChange={(e) => setRestbreite(e.target.value)} placeholder="z. B. 3.0" />
        </div>
        <div className="av-feld">
          <label>Länge Baubereich (m)</label>
          <input type="number" step="1" min="0" value={laenge}
            onChange={(e) => setLaenge(e.target.value)} placeholder="z. B. 80" />
        </div>
        <div className="av-feld">
          <label>Straßenklasse</label>
          <select value={klasse} onChange={(e) => setKlasse(e.target.value)}>
            <option value="">– beliebig –</option>
            {STRASSENKLASSEN.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      <p className="av-info">{geeignet} von {plaene.length} Plänen geeignet</p>

      <div className="av-liste">
        {ergebnis.map((e) => {
          const m = STATUS_META[e.status];
          const Icon = m.icon;
          return (
            <div key={e.plan.id} className={`av-card ${m.cls}`}>
              <div className="av-card__status"><Icon size={22} weight="fill" /> {m.label}</div>
              <button className="av-card__titel" onClick={() => gotoRegelplan(e.plan.id)}>
                <span className="mono">{e.plan.nr}</span> {e.plan.titel}
              </button>
              {e.gruende.length > 0 && (
                <ul className="av-card__gruende">
                  {e.gruende.map((g, i) => <li key={i}>{g}</li>)}
                </ul>
              )}
              <button
                className="av-card__pack"
                disabled={e.status === "fail"}
                onClick={() => uebernehmen(e)}
                title={e.status === "fail" ? "Nicht geeignet" : "In Packliste übernehmen"}
              >
                <Package size={16} weight="bold" /> Übernehmen
              </button>
            </div>
          );
        })}
      </div>

      {/* US10: Warn-Modal bei ungeeignetem Plan */}
      {warnPlan && (
        <div className="av-modal-overlay" onClick={() => setWarnPlan(null)}>
          <div className="av-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Regelplan nicht geeignet</h3>
            <p>{warnPlan.plan.nr} erfüllt Ihre Rahmenbedingungen nicht:</p>
            <ul>{warnPlan.gruende.map((g, i) => <li key={i}>{g}</li>)}</ul>
            <div className="av-modal__btns">
              <button className="btn btn-secondary" onClick={() => setWarnPlan(null)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={() => { importRegelplan(warnPlan.plan); setWarnPlan(null); }}>
                Trotzdem übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auswertung;
