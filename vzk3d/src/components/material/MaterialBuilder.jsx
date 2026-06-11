import { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Trash, Printer, DownloadSimple } from "@phosphor-icons/react";
import { assetUrl } from "../../utils/assetPath.js";
import { Button } from "../ui/Button.jsx";
import { SignPicker } from "./SignPicker.jsx";
import * as W from "../../lib/windlast.js";
import { loadWunschtexte, isPlatzhalter } from "../../lib/wunschtexte.js";
import zeichen from "../../data/zeichen.json";
import "./material.css";

const ZMAP = new Map(zeichen.map((z) => [z.nummer, z]));

let idCounter = 0;
const uid = () => `r${++idCounter}`;

// Standard-Form/Größe je Kategorie (anpassbar je Zeile).
function defaultGroesse(z) {
  switch (z?.kategorie) {
    case "Gefahrzeichen":
      return { form: "dreieck_oben", breite: 900, hoehe: 800 };
    case "Vorschriftzeichen":
      return { form: "kreis", breite: 600, hoehe: 600 };
    case "Zusatzzeichen":
      return { form: "rechteck", breite: 600, hoehe: 330 };
    default:
      return { form: "rechteck", breite: 600, hoehe: 600 };
  }
}

// Häufiges Sperrmaterial (Schnellauswahl). fussplattenJe = K1-Fußplatten je Stück.
const SPERR_PRESETS = [
  { name: "Leitbake (Z 605)", einheit: "Stk.", fussplattenJe: 1 },
  { name: "Leitkegel (Z 610)", einheit: "Stk.", fussplattenJe: 0 },
  { name: "Absperrschranke (Z 600)", einheit: "Stk.", fussplattenJe: 2 },
  { name: "Fahrbare Absperrtafel", einheit: "Stk.", fussplattenJe: 0 },
  { name: "Warnleuchte", einheit: "Stk.", fussplattenJe: 0 },
];

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Baut den Anfangszustand aus dem Plan-Seed (Sperrmaterial aus Plantext +
// ggf. genannte Verkehrszeichen). Wird nur genutzt, wenn noch nichts
// gespeichert ist.
function ausSeed(seed, strassenart) {
  const basis = {
    ort: strassenart === "innerorts" ? "innerorts" : "ausserorts",
    aufstellhoehe: 2.0,
    signs: [],
    sperr: [],
  };
  if (!seed) return basis;
  basis.signs = (seed.zeichen || []).map((s) => {
    const z = ZMAP.get(s.nummer);
    const g = defaultGroesse(z);
    return {
      key: uid(),
      nummer: s.nummer,
      name: z?.name || `Zeichen ${s.nummer}`,
      bild: z?.bild || `zeichen/${s.nummer}.png`,
      anzahl: s.anzahl || 1,
      ...g,
    };
  });
  basis.sperr = (seed.sperr || []).map((r) => ({
    key: uid(),
    name: r.name || "",
    einheit: r.einheit || "Stk.",
    anzahl: r.anzahl ?? 1,
    fussplattenJe: r.fussplattenJe ?? 0,
  }));
  return basis;
}

export function MaterialBuilder({
  storageKey = "vzk-material-standalone",
  strassenart = "innerorts",
  kontext = "",
  seed = null,
}) {
  const [state, setState] = useState(() => load(storageKey) || ausSeed(seed, strassenart));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wunschtexte, setWunschtexte] = useState(loadWunschtexte);

  useEffect(() => {
    const sync = () => setWunschtexte(loadWunschtexte());
    window.addEventListener("wunschtexte-changed", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("wunschtexte-changed", sync); window.removeEventListener("storage", sync); };
  }, []);

  const wunschtextSigns = useMemo(() => {
    return Object.entries(wunschtexte).map(([nummer, text]) => {
      const z = ZMAP.get(nummer);
      if (!z) return null;
      const g = defaultGroesse(z);
      return { nummer, name: `${z.name} — „${text}"`, bild: z.bild || `zeichen/${nummer}.png`, anzahl: 1, ...g, wunschtext: text };
    }).filter(Boolean);
  }, [wunschtexte]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* localStorage evtl. nicht verfügbar */
    }
  }, [state, storageKey]);

  const q = W.STAUDRUCK[state.ort].q;
  const setField = (patch) => setState((s) => ({ ...s, ...patch }));

  // --- Schilder ---
  const addSign = (z) => {
    const g = defaultGroesse(z);
    setState((s) => ({
      ...s,
      signs: [...s.signs, { key: uid(), nummer: z.nummer, name: z.name, bild: z.bild, anzahl: 1, ...g }],
    }));
    setPickerOpen(false);
  };
  const updSign = (key, patch) =>
    setState((s) => ({ ...s, signs: s.signs.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const delSign = (key) => setState((s) => ({ ...s, signs: s.signs.filter((r) => r.key !== key) }));

  // --- Sperrmaterial ---
  const addSperr = (preset) =>
    setState((s) => ({
      ...s,
      sperr: [
        ...s.sperr,
        { key: uid(), name: preset?.name || "", einheit: preset?.einheit || "Stk.", anzahl: 1, fussplattenJe: preset?.fussplattenJe || 0 },
      ],
    }));
  const updSperr = (key, patch) =>
    setState((s) => ({ ...s, sperr: s.sperr.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const delSperr = (key) => setState((s) => ({ ...s, sperr: s.sperr.filter((r) => r.key !== key) }));

  // --- Berechnung ---
  const calcRow = useCallback((r) => {
    const erg = W.berechne({
      q,
      form: r.form,
      breiteMm: r.breite,
      hoeheMm: r.hoehe,
      aufstellhoeheM: parseFloat(state.aufstellhoehe) || 2.0,
    });
    return { ...r, erg, platten: erg.fussplatten * (parseInt(r.anzahl, 10) || 0) };
  }, [q, state.aufstellhoehe]);

  const signRows = useMemo(() => state.signs.map(calcRow), [state.signs, calcRow]);
  const wunschtextRows = useMemo(() => wunschtextSigns.map(calcRow), [wunschtextSigns, calcRow]);

  const sperrPlatten = state.sperr.reduce(
    (s, r) => s + (parseInt(r.fussplattenJe, 10) || 0) * (parseInt(r.anzahl, 10) || 0),
    0
  );
  const signPlatten = signRows.reduce((s, r) => s + r.platten, 0);
  const wunschtextPlatten = wunschtextRows.reduce((s, r) => s + r.platten, 0);
  const totalPlatten = signPlatten + wunschtextPlatten + sperrPlatten;

  // --- Export ---
  const exportCsv = () => {
    const z = [
      ["Materialliste", kontext],
      ["Aufstellort", W.STAUDRUCK[state.ort].label],
      ["Aufstellhoehe_m", String(state.aufstellhoehe)],
      [],
      ["Verkehrszeichen", "Form", "BxH_mm", "Anzahl", "Windlast_Nm", "Klasse", "Fussplatten_je", "Fussplatten_gesamt"],
      ...wunschtextRows.map((r) => [
        `${r.nummer} ${r.name}`,
        W.FORMEN[r.form].name,
        `${r.breite}x${r.hoehe}`,
        String(r.anzahl),
        r.erg.moment.toFixed(0),
        r.erg.klasse.text,
        String(r.erg.fussplatten),
        String(r.platten),
      ]),
      ...signRows.map((r) => [
        `${r.nummer} ${r.name}`,
        W.FORMEN[r.form].name,
        `${r.breite}x${r.hoehe}`,
        String(r.anzahl),
        r.erg.moment.toFixed(0),
        r.erg.klasse.text,
        String(r.erg.fussplatten),
        String(r.platten),
      ]),
      [],
      ["Sperrmaterial", "Einheit", "Anzahl", "Fussplatten_je", "Fussplatten_gesamt"],
      ...state.sperr.map((r) => [
        r.name,
        r.einheit,
        String(r.anzahl),
        String(r.fussplattenJe),
        String((parseInt(r.fussplattenJe, 10) || 0) * (parseInt(r.anzahl, 10) || 0)),
      ]),
      [],
      ["K1-Fussplatten gesamt", String(totalPlatten)],
    ];
    const csv = "﻿" + z.map((row) => row.map((f) => `"${(f ?? "").toString().replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Materialliste_${(kontext || "VZK").replace(/[^\w-]+/g, "_")}.csv`;
    document.body.append(a);
    a.click();
    a.remove();
  };

  return (
    <div className="mat">
      <div className="mat__params">
        <label className="mat__field">
          Aufstellort
          <select value={state.ort} onChange={(e) => setField({ ort: e.target.value })}>
            <option value="innerorts">Innerorts – 0,25 kN/m²</option>
            <option value="ausserorts">Außerorts – 0,42 kN/m²</option>
          </select>
        </label>
        <label className="mat__field">
          Aufstellhöhe (m)
          <input
            type="number"
            step="0.05"
            min="0.1"
            value={state.aufstellhoehe}
            onChange={(e) => setField({ aufstellhoehe: e.target.value })}
          />
        </label>
      </div>

      {/* Verkehrszeichen */}
      <div className="mat__group">
        <div className="mat__grouphead">
          <h3>Verkehrszeichen</h3>
          <span className="mat__plates">
            Σ <b>{signPlatten + wunschtextPlatten}</b> Fußpl.
          </span>
        </div>
        <div className="mat__rows">
          {wunschtextRows.length === 0 && signRows.length === 0 && <div className="mat__empty">Noch keine Zeichen. Über „Zeichen hinzufügen" erfassen.</div>}
          {wunschtextRows.map((r) => (
            <div className="mat__row mat__row--wunsch" key={`wt-${r.nummer}`}>
              <span className="mat__thumb">
                <img src={assetUrl(r.bild)} alt={`${r.nummer}`} />
              </span>
              <div className="mat__rowmain">
                <div className="mat__rowname">
                  <span className="mono">{r.nummer}</span>
                  {r.name}
                </div>
                <div className="mat__rowcalc">
                  Windlast {r.erg.moment.toFixed(0)} Nm → {r.erg.klasse.text} · {r.erg.fussplatten} Fußpl./Schild
                </div>
              </div>
              <div className="mat__rowctrl">
                <span className="mat__plates">
                  <b>{r.platten}</b> Fußpl.
                </span>
              </div>
            </div>
          ))}
          {signRows.map((r) => (
            <div className="mat__row" key={r.key}>
              <span className="mat__thumb">
                <img src={assetUrl(r.bild)} alt={`${r.nummer} ${r.name}`} />
              </span>
              <div className="mat__rowmain">
                <div className="mat__rowname">
                  <span className="mono">{r.nummer}</span>
                  {r.name}
                </div>
                <div className="mat__rowcalc">
                  Windlast {r.erg.moment.toFixed(0)} Nm → {r.erg.klasse.text} · {r.erg.fussplatten} Fußpl./Schild
                </div>
                <div className="mat__rowctrl" style={{ marginTop: 6 }}>
                  <select value={r.form} onChange={(e) => updSign(r.key, { form: e.target.value })} aria-label="Form">
                    {Object.entries(W.FORMEN).map(([k, f]) => (
                      <option key={k} value={k}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="mat__size"
                    type="number"
                    value={r.breite}
                    onChange={(e) => updSign(r.key, { breite: e.target.value })}
                    aria-label="Breite mm"
                    title="Breite/Ø (mm)"
                  />
                  <input
                    className="mat__size"
                    type="number"
                    value={r.hoehe}
                    onChange={(e) => updSign(r.key, { hoehe: e.target.value })}
                    aria-label="Höhe mm"
                    title="Höhe (mm)"
                  />
                </div>
              </div>
              <div className="mat__rowctrl">
                <input
                  className="mat__num"
                  type="number"
                  min="1"
                  value={r.anzahl}
                  onChange={(e) => updSign(r.key, { anzahl: e.target.value })}
                  aria-label="Anzahl"
                />
                <span className="mat__plates">
                  <b>{r.platten}</b> Fußpl.
                </span>
                <button className="mat__del" onClick={() => delSign(r.key)} aria-label="Entfernen">
                  <Trash size={18} weight="bold" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="mat__add" onClick={() => setPickerOpen(true)}>
          <Plus size={18} weight="bold" /> Zeichen hinzufügen
        </button>
      </div>

      {/* Sperrmaterial */}
      <div className="mat__group">
        <div className="mat__grouphead">
          <h3>Sperrmaterial</h3>
          <span className="mat__plates">
            Σ <b>{sperrPlatten}</b> Fußpl.
          </span>
        </div>
        <div className="mat__rows">
          {state.sperr.length === 0 && <div className="mat__empty">Leitbaken, Schranken, Leuchten … per Plus erfassen.</div>}
          {state.sperr.map((r) => (
            <div className="mat__row" key={r.key}>
              <span className="mat__thumb" aria-hidden style={{ fontSize: 18 }}>
                ⛟
              </span>
              <div className="mat__rowmain">
                <input
                  style={{ width: "100%" }}
                  value={r.name}
                  placeholder="Bezeichnung (z. B. Leitbake Z 605)"
                  onChange={(e) => updSperr(r.key, { name: e.target.value })}
                  aria-label="Bezeichnung"
                />
                <div className="mat__rowcalc" style={{ marginTop: 6 }}>
                  <label>
                    Fußplatten/Stück:{" "}
                    <input
                      className="mat__num"
                      type="number"
                      min="0"
                      value={r.fussplattenJe}
                      onChange={(e) => updSperr(r.key, { fussplattenJe: e.target.value })}
                      aria-label="Fußplatten je Stück"
                    />
                  </label>
                </div>
              </div>
              <div className="mat__rowctrl">
                <input
                  className="mat__num"
                  type="number"
                  min="0"
                  value={r.anzahl}
                  onChange={(e) => updSperr(r.key, { anzahl: e.target.value })}
                  aria-label="Anzahl"
                />
                <span className="mat__plates">
                  <b>{(parseInt(r.fussplattenJe, 10) || 0) * (parseInt(r.anzahl, 10) || 0)}</b> Fußpl.
                </span>
                <button className="mat__del" onClick={() => delSperr(r.key)} aria-label="Entfernen">
                  <Trash size={18} weight="bold" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 14px 12px" }}>
          {SPERR_PRESETS.map((p) => (
            <button key={p.name} className="mat__add" style={{ margin: 0 }} onClick={() => addSperr(p)}>
              <Plus size={16} weight="bold" /> {p.name}
            </button>
          ))}
          <button className="mat__add" style={{ margin: 0 }} onClick={() => addSperr(null)}>
            <Plus size={16} weight="bold" /> Eigenes
          </button>
        </div>
      </div>

      <div className="mat__total">
        <span>K1-Fußplatten gesamt</span>
        <span className="mat__totalval mono">{totalPlatten}</span>
      </div>

      <div className="mat__actions">
        <Button onClick={exportCsv}>
          <DownloadSimple size={18} weight="bold" /> CSV exportieren
        </Button>
        <Button onClick={() => window.print()}>
          <Printer size={18} weight="bold" /> Drucken
        </Button>
      </div>

      <SignPicker open={pickerOpen} onPick={addSign} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
