import { lazy, Suspense, useRef } from "react";
import { Signpost, ListChecks, MapTrifold, Wind, ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { useView } from "../app/ViewContext.jsx";
import { usePerformanceTier } from "../hooks/usePerformanceTier.js";
import { Button } from "../components/ui/Button.jsx";
import { Canvas3DBoundary } from "../three/Canvas3DBoundary.jsx";
import { TrafficLightCSS } from "../components/dashboard/TrafficLightCSS.jsx";
import { CategoryScroller } from "../components/dashboard/CategoryScroller.jsx";
import zeichen from "../data/zeichen.json";
import "./dashboard.css";

const TrafficLightHero = lazy(() => import("../three/TrafficLightHero.jsx"));

const MODULE = [
  {
    key: "katalog",
    titel: "Verkehrszeichenkatalog",
    desc: "Alle Zeichen nach StVO/VzKat – durchsuchbar, mit 3D-Detailansicht.",
    icon: Signpost,
    farbe: "#e2231a",
    bereit: true,
  },
  {
    key: "regelplaene",
    titel: "Regelpläne",
    desc: "RSA 21 als PDF, mit Materialliste & Windlast je Plan.",
    icon: MapTrifold,
    farbe: "#1b50a3",
    bereit: true,
  },
  {
    key: "checklisten",
    titel: "Checklisten",
    desc: "Kontrollgänge und Abnahmen strukturiert dokumentieren.",
    icon: ListChecks,
    farbe: "#1f7a44",
    bereit: false,
  },
  {
    key: "windlast",
    titel: "Windlast",
    desc: "Standsicherheit und K1-Fußplatten berechnen.",
    icon: Wind,
    farbe: "#ef7f1a",
    bereit: false,
  },
];

export function Dashboard() {
  const { gotoKatalog, gotoRegelplaene } = useView();
  const { allow3d, lowPower } = usePerformanceTier();
  const hudRef = useRef(null);
  const tileAction = (key) => (key === "regelplaene" ? gotoRegelplaene() : gotoKatalog());

  return (
    <div className="container">
      <section className="dash__hero" aria-label="VZK – Verkehrszeichenkatalog">
        <div className="dash__hero-stage" aria-hidden>
          {allow3d ? (
            <Canvas3DBoundary fallback={<div className="dash__hero-fallback"><TrafficLightCSS /></div>}>
              <Suspense
                fallback={
                  <div className="dash__hero-loading">
                    <CircleNotch size={26} className="spin" />
                  </div>
                }
              >
                <TrafficLightHero hudRef={hudRef} lowPower={lowPower} />
              </Suspense>
            </Canvas3DBoundary>
          ) : (
            <div className="dash__hero-fallback">
              <TrafficLightCSS />
            </div>
          )}
        </div>

        {/* Technischer Live-Status (Liquid Glass) */}
        <div className="dash__hud glass-control" role="status" aria-live="off">
          <span className="dash__hud-dot" />
          <span className="dash__hud-label">Signalphase</span>
          <strong className="dash__hud-value mono" ref={hudRef}>
            {allow3d ? "Initialisiere …" : "FREI · Grün"}
          </strong>
        </div>

        <div className="dash__hero-copy">
          <span className="dash__eyebrow">
            <Signpost size={16} weight="fill" /> Verkehrssicherung · technisch
          </span>
          <h1 className="dash__title">
            Verkehrs&shy;sicherung,<br />im Griff.
          </h1>
          <p className="dash__lead">
            Der vollständige Katalog aller deutschen Verkehrszeichen nach StVO und VzKat – mit
            3D-Detailansicht und Werkzeugen für die Baustelle.
          </p>
          <div className="dash__actions">
            <Button variant="primary" size="lg" onClick={() => gotoKatalog()}>
              Katalog öffnen <ArrowRight size={20} weight="bold" />
            </Button>
            <Button size="lg" className="glass-control" onClick={() => gotoKatalog("Gefahrzeichen")}>
              Gefahrzeichen
            </Button>
          </div>
        </div>
      </section>

      <CategoryScroller />

      <h2 className="dash__section-title">Anwendungen</h2>
      <div className="tiles">
        {MODULE.map((m) => {
          const Icon = m.icon;
          if (m.bereit) {
            return (
              <button key={m.key} className="tile" onClick={() => tileAction(m.key)}>
                <span className="tile__icon" style={{ background: m.farbe }}>
                  <Icon size={24} weight="fill" />
                </span>
                <span className="tile__title">{m.titel}</span>
                <span className="tile__desc">{m.desc}</span>
                {m.key === "katalog" && <span className="tile__count mono">{zeichen.length} Zeichen</span>}
              </button>
            );
          }
          return (
            <div key={m.key} className="tile tile--soon" aria-disabled="true">
              <span className="tile__icon" style={{ background: m.farbe }}>
                <Icon size={24} weight="fill" />
              </span>
              <span className="tile__title">{m.titel}</span>
              <span className="tile__desc">{m.desc}</span>
              <span className="tile__soon">In Vorbereitung</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
