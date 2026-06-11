import { ArrowLeft, FilePdf } from "@phosphor-icons/react";
import { useView } from "../app/ViewContext.jsx";
import { assetUrl } from "../utils/assetPath.js";
import { CompanyBlock } from "../components/regelplan/CompanyBlock.jsx";
import { MaterialBuilder } from "../components/material/MaterialBuilder.jsx";
import plaene from "../data/regelplaene.json";
import "../components/regelplan/regelplan.css";
import "../pages/detail.css";

const ART_LABEL = { innerorts: "innerorts", landstrasse: "Landstraße", autobahn: "Autobahn" };

export function RegelplanDetail({ id }) {
  const { gotoRegelplaene } = useView();
  const p = plaene.find((x) => x.id === id);

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
          <div style={{ marginTop: 16 }}>
            <CompanyBlock />
          </div>
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
