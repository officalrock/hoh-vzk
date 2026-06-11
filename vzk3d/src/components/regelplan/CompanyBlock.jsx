import { useEffect, useState } from "react";
import { PencilSimple, Check, Buildings } from "@phosphor-icons/react";
import "./regelplan.css";

const KEY = "vzk-firma";
const LEER = { firma: "", anschrift: "", bearbeiter: "", telefon: "" };

function load() {
  try {
    return { ...LEER, ...(JSON.parse(localStorage.getItem(KEY)) || {}) };
  } catch {
    return { ...LEER };
  }
}

/**
 * Platzhalter-Schriftfeld für die eigenen Aufsteller-/Planungsbüro-Daten.
 * Ersetzt das (entfernte) Fremdlogo. Daten lokal gespeichert, vom Nutzer
 * frei befüllbar – erscheinen auf der Materialliste/Plan.
 */
export function CompanyBlock() {
  const [data, setData] = useState(load);
  const [edit, setEdit] = useState(!load().firma);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));
  const leer = !data.firma && !data.anschrift && !data.bearbeiter;

  return (
    <div className="firma">
      <div className="firma__head">
        <span className="firma__label">
          <Buildings size={16} weight="fill" /> Aufsteller / Planungsbüro
        </span>
        <button className="firma__edit" onClick={() => setEdit((v) => !v)} aria-label={edit ? "Speichern" : "Bearbeiten"}>
          {edit ? <Check size={18} weight="bold" /> : <PencilSimple size={18} weight="bold" />}
        </button>
      </div>

      {edit ? (
        <div className="firma__form">
          <input value={data.firma} onChange={set("firma")} placeholder="Firma / Büro" aria-label="Firma" />
          <input value={data.anschrift} onChange={set("anschrift")} placeholder="Anschrift" aria-label="Anschrift" />
          <input value={data.bearbeiter} onChange={set("bearbeiter")} placeholder="Bearbeiter" aria-label="Bearbeiter" />
          <input value={data.telefon} onChange={set("telefon")} placeholder="Telefon" aria-label="Telefon" />
        </div>
      ) : leer ? (
        <p className="firma__placeholder">Eigene Aufsteller-/Firmendaten hinterlegen (Stift).</p>
      ) : (
        <div className="firma__view">
          {data.firma && <strong>{data.firma}</strong>}
          {data.anschrift && <span>{data.anschrift}</span>}
          {data.bearbeiter && <span>Bearb.: {data.bearbeiter}</span>}
          {data.telefon && <span>Tel.: {data.telefon}</span>}
        </div>
      )}
    </div>
  );
}
