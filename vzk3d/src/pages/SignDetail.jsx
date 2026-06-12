import { lazy, Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowsOutCardinal, CubeTransparent, Image as ImageIcon, PencilSimple, Check, Plus } from "@phosphor-icons/react";
import { useView } from "../app/ViewContext.jsx";
import { usePackingList } from "../hooks/usePackingList.js";
import { usePerformanceTier } from "../hooks/usePerformanceTier.js";
import { CategoryBadge } from "../components/ui/CategoryBadge.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Canvas3DBoundary } from "../three/Canvas3DBoundary.jsx";
import { assetUrl } from "../utils/assetPath.js";
import { WUNSCHTEXT_KEY, isPlatzhalter, loadWunschtexte, saveWunschtext, removeWunschtext } from "../lib/wunschtexte.js";
import { wunschtextDataUrl } from "../lib/wunschtext-canvas.js";
import zeichen from "../data/zeichen.json";
import "./detail.css";

const SignScene = lazy(() => import("../three/SignScene.jsx"));

export function SignDetail({ nummer }) {
  const { gotoKatalog } = useView();
  const { addSign } = usePackingList();
  const tier = usePerformanceTier();
  const [show3d, setShow3d] = useState(tier.allow3d);
  const [added, setAdded] = useState(false);

  const z = zeichen.find((x) => x.nummer === nummer);
  const platzhalter = z && isPlatzhalter(z.nummer);
  const [wunschtext, setWunschtext] = useState(() => platzhalter ? (loadWunschtexte()[nummer] || "") : "");
  const [saved, setSaved] = useState(!!wunschtext);

  // US4: 2D-Vorschau mit Wunschtext (DataURL aus Canvas). Nur fuer Platzhalter.
  const [previewUrl, setPreviewUrl] = useState(null);
  useEffect(() => {
    if (!platzhalter || !z) { setPreviewUrl(null); return; }
    const aktiv = saved ? wunschtext : (loadWunschtexte()[nummer] || "");
    if (!aktiv || !aktiv.trim()) { setPreviewUrl(null); return; }
    let abbruch = false;
    wunschtextDataUrl(assetUrl(z.bild), aktiv)
      .then((url) => { if (!abbruch) setPreviewUrl(url); })
      .catch(() => { if (!abbruch) setPreviewUrl(null); });
    return () => { abbruch = true; };
  }, [platzhalter, z, nummer, wunschtext, saved]);

  if (!z) {
    return (
      <div className="container">
        <button className="detail__back" onClick={() => gotoKatalog()}>
          <ArrowLeft size={20} weight="bold" /> Zurück zum Katalog
        </button>
        <div className="leer">
          <b>Zeichen nicht gefunden</b>
          Die Nummer „{nummer}" ist im Katalog nicht enthalten.
        </div>
      </div>
    );
  }

  const bildUrl = assetUrl(z.bild);
  // US4: bei gesetztem Wunschtext die Canvas-Vorschau zeigen.
  const vorschauUrl = previewUrl || bildUrl;

  return (
    <div className="container">
      <button className="detail__back" onClick={() => gotoKatalog()}>
        <ArrowLeft size={20} weight="bold" /> Zurück zum Katalog
      </button>

      <div className="detail">
        <div className="detail__stage glass">
          <div className="detail__stage-toggle">
            <Button
              variant="ghost"
              className="btn--icon glass-control"
              onClick={() => setShow3d((v) => !v)}
              aria-pressed={show3d}
              aria-label={show3d ? "Als Standbild anzeigen" : "Als 3D-Modell anzeigen"}
              title={show3d ? "Standbild" : "3D-Modell"}
            >
              {show3d ? <ImageIcon size={22} weight="bold" /> : <CubeTransparent size={22} weight="bold" />}
            </Button>
          </div>

          {show3d ? (
            <div className="detail__canvas">
              <Canvas3DBoundary
                fallback={
                  <div className="detail__static">
                    <img src={bildUrl} alt={`Zeichen ${z.nummer} – ${z.name}`} />
                  </div>
                }
              >
                <Suspense
                  fallback={
                    <div className="detail__static">
                      <img src={vorschauUrl} alt={`Zeichen ${z.nummer} – ${z.name}`} />
                    </div>
                  }
                >
                  <SignScene src={bildUrl} lowPower={tier.lowPower} wunschtext={platzhalter ? wunschtext : ""} />
                </Suspense>
              </Canvas3DBoundary>
              <span className="detail__stage-hint glass-control">
                <ArrowsOutCardinal size={15} weight="bold" /> Ziehen zum Drehen · Scrollen zum Zoomen
              </span>
            </div>
          ) : (
            <div className="detail__static">
              <img src={vorschauUrl} alt={`Zeichen ${z.nummer} – ${z.name}`} />
            </div>
          )}
        </div>

        <div className="detail__info glass">
          <div className="detail__nr mono">Zeichen {z.nummer}</div>
          <h1>{z.name}</h1>
          <div className="detail__badges">
            <CategoryBadge kategorie={z.kategorie} />
            {z.gruppe && <span className="badge" style={{ background: "#3a4250" }}>{z.gruppe}</span>}
          </div>

          <button
            className="detail__add"
            onClick={() => {
              addSign(z.nummer, z.name, 1, platzhalter && wunschtext.trim() ? wunschtext.trim() : null);
              setAdded(true);
              setTimeout(() => setAdded(false), 1600);
            }}
          >
            {added ? <Check size={18} weight="bold" /> : <Plus size={18} weight="bold" />}
            {added ? "Zur Packliste hinzugefügt" : "Zur Packliste hinzufügen"}
          </button>

          <div className="detail__block">
            <h2>Bedeutung</h2>
            <p>{z.beschreibung || z.bedeutung}</p>
          </div>

          {platzhalter && (
            <div className="detail__block">
              <h2>Wunschtext</h2>
              <p style={{ marginBottom: 10, color: "var(--text-leise)", fontSize: "0.88rem" }}>
                Text eingeben — Zeichen wird automatisch auf die Materialliste gesetzt.
              </p>
              <div className="detail__wunschtext">
                <input
                  className="detail__wunschtext-input"
                  type="text"
                  value={wunschtext}
                  onChange={(e) => { setWunschtext(e.target.value); setSaved(false); }}
                  placeholder="z. B. Zufahrt Baustellenverkehr frei"
                  aria-label="Wunschtext für Zusatzzeichen"
                />
                <Button
                  onClick={() => {
                    saveWunschtext(nummer, wunschtext);
                    setSaved(true);
                  }}
                  disabled={saved && wunschtext === (loadWunschtexte()[nummer] || "")}
                >
                  {saved ? <Check size={18} weight="bold" /> : <PencilSimple size={18} weight="bold" />}
                  {saved ? "Gespeichert" : "Speichern"}
                </Button>
              </div>
              {saved && wunschtext && (
                <p style={{ marginTop: 8, color: "var(--accent-text)", fontSize: "0.85rem" }}>
                  Zeichen {z.nummer} mit Text „{wunschtext}" ist auf der Materialliste.
                </p>
              )}
            </div>
          )}

          {z.anwendung && (
            <div className="detail__block">
              <h2>Hinweise zur Anwendung</h2>
              <p>{z.anwendung}</p>
            </div>
          )}

          <div className="detail__block">
            <h2>Stammdaten</h2>
            <dl className="detail__meta">
              <dt>VZ-Nummer</dt>
              <dd className="mono">{z.nummer}</dd>
              <dt>Kategorie</dt>
              <dd>{z.kategorie}</dd>
              {z.gruppe && (
                <>
                  <dt>Gruppe</dt>
                  <dd>{z.gruppe}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
