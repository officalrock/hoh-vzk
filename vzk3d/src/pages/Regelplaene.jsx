import { useMemo, useState } from "react";
import { FilePdf } from "@phosphor-icons/react";
import { useView } from "../app/ViewContext.jsx";
import { assetUrl } from "../utils/assetPath.js";
import plaene from "../data/regelplaene.json";
import "../components/regelplan/regelplan.css";

const TEILE = [
  { key: "alle", label: "Alle" },
  { key: "B", label: "Teil B · innerorts" },
  { key: "C", label: "Teil C · Landstraße" },
  { key: "D", label: "Teil D · Autobahn" },
];

export function Regelplaene() {
  const { view, gotoRegelplan } = useView();
  const [teil, setTeil] = useState(view.teil || "alle");

  const treffer = useMemo(
    () => (teil === "alle" ? plaene : plaene.filter((p) => p.teil === teil)),
    [teil]
  );

  return (
    <div className="container">
      <div className="rp-kopf">
        <h1>Regelpläne</h1>
        <p>Verkehrsführung an Arbeitsstellen nach RSA 21. {plaene.length} Pläne, mit Materialliste je Plan.</p>
      </div>

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

      {treffer.length === 0 ? (
        <div className="leer">Für diesen Teil ist noch kein PDF hinterlegt.</div>
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
