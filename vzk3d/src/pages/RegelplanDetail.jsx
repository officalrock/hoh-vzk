import { useState } from "react";
import { ArrowLeft, FilePdf, Package, Check, DownloadSimple, Spinner } from "@phosphor-icons/react";
import { useView } from "../app/ViewContext.jsx";
import { usePackingList } from "../hooks/usePackingList.js";
import { useProject } from "../hooks/useProject.js";
import { assetUrl } from "../utils/assetPath.js";
import { CompanyBlock } from "../components/regelplan/CompanyBlock.jsx";
import { MaterialBuilder } from "../components/material/MaterialBuilder.jsx";
import { stampRegelplanPDF, downloadBytes } from "../lib/pdf-stamp.js";
import plaene from "../data/regelplaene.json";
import "../components/regelplan/regelplan.css";
import "../pages/detail.css";

const ART_LABEL = { innerorts: "innerorts", landstrasse: "Landstraße", autobahn: "Autobahn" };

function ladeFirma() {
  try { return JSON.parse(localStorage.getItem("vzk-firma")) || {}; } catch { return {}; }
}
function ladeKunde(id) {
  try { return localStorage.getItem(`vzk-kunde-${id}`) || ""; } catch { return ""; }
}

export function RegelplanDetail({ id }) {
  const { gotoRegelplaene } = useView();
  const { importRegelplan } = usePackingList();
  const { activeProject } = useProject();
  const [imported, setImported] = useState(false);
  const [kundentext, setKundentext] = useState(() => ladeKunde(id));
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const p = plaene.find((x) => x.id === id);

  const setKunde = (e) => {
    const v = e.target.value;
    setKundentext(v);
    try { localStorage.setItem(`vzk-kunde-${id}`, v); } catch { /* ignore */ }
  };

  const handleStampPDF = async () => {
    if (!p?.pdf) return;
    setPdfBusy(true);
    setPdfError("");
    try {
      const bytes = await stampRegelplanPDF({
        pdfPath: p.pdf,
        firma: ladeFirma(),
        projekt: activeProject,
        kundentext,
        nr: p.nr,
      });
      const safeNr = String(p.nr || p.id).replace(/[^\w-]+/g, "_");
      downloadBytes(bytes, `Regelplan_${safeNr}_HOH.pdf`);
    } catch (err) {
      setPdfError(err?.message || "PDF konnte nicht erstellt werden.");
    } finally {
      setPdfBusy(false);
    }
  };

  if (!p) {
    return (
      <div className="container">
        <button className="detail__back" onClick={() => gotoRegelplaene()}>
          <ArrowLeft size={20} weight="bold" /> Zurück zu den Regelplänen
        </button>
        <div className="leer">Regelplan „{id}" nicht gefunden.</div>
      </div>
    );
  }

  return (
    <div className="container">
      <button className="detail__back" onClick={() => gotoRegelplaene()}>
        <ArrowLeft size={20} weight="bold" /> Zurück zu den Regelplänen
      </button>

      <div className="rp-detail">
        <div className="rp-stage">
          {p.bild ? (
            <img src={assetUrl(p.bild)} alt={`Regelplan ${p.nr}`} />
          ) : (
            <div className="rp-stage__ph">
              <b>Plan-Bild folgt</b>
              PNG aus PDF erzeugen: <span className="mono">python vzk3d/scripts/gen-regelplaene.py</span>
            </div>
          )}
        </div>

        <div className="rp-info">
          <div className="rp-info__nr mono">Regelplan {p.nr} · RSA 21</div>
          <h1>{p.titel}</h1>
          <p className="rp-info__desc">Teil {p.teil} · {ART_LABEL[p.strassenart] || p.strassenart}</p>
          {p.pdf && (
            <a className="rp-pdf__open" href={assetUrl(p.pdf)} target="_blank" rel="noreferrer">
              <FilePdf size={18} weight="bold" /> Original-PDF öffnen
            </a>
          )}
          <button
            className="rp-pack-btn"
            onClick={() => {
              importRegelplan(p);
              setImported(true);
              setTimeout(() => setImported(false), 2000);
            }}
            style={{ marginTop: 12 }}
          >
            {imported ? <Check size={18} weight="bold" /> : <Package size={18} weight="bold" />}
            {imported ? "In Packliste übernommen" : "Material in Packliste übernehmen"}
          </button>
          <div style={{ marginTop: 16 }}>
            <CompanyBlock />
          </div>

          <div className="rp-kunde">
            <label className="rp-kunde__label" htmlFor="rp-kunde-text">Anmerkung Kunde (erscheint im PDF)</label>
            <textarea
              id="rp-kunde-text"
              className="rp-kunde__input"
              rows={2}
              value={kundentext}
              onChange={setKunde}
              placeholder="z. B. Sonderwunsch, Ansprechpartner, Hinweis …"
            />
          </div>

          {p.pdf && (
            <button className="rp-pdf-stamp" onClick={handleStampPDF} disabled={pdfBusy}>
              {pdfBusy ? <Spinner size={18} weight="bold" className="rp-spin" /> : <DownloadSimple size={18} weight="bold" />}
              {pdfBusy ? "Erstelle PDF …" : "Plan-PDF mit Firmenkopf"}
            </button>
          )}
          {pdfError && <p className="rp-pdf-error">{pdfError}</p>}
        </div>
      </div>

      <h2 className="rp-section-title">Materialliste</h2>
      <MaterialBuilder
        storageKey={`vzk-material-${p.id}`}
        strassenart={p.strassenart}
        kontext={`Regelplan ${p.nr}`}
        seed={p.material}
      />
    </div>
  );
}
