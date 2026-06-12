import React, { useState } from 'react';
import { Buildings, MapPin, Info } from '@phosphor-icons/react';
import { useProject } from '../hooks/useProject';
import { useView } from '../app/ViewContext';
import './project-selector.css';
import './start-gate.css';

const FIRMA_KEY = 'vzk-firma';
const ENTRY_KEY = 'vzk-entry-done';

function ladeFirma() {
  try {
    return JSON.parse(localStorage.getItem(FIRMA_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * Vorgeschaltete Startseite: Firmendaten + Projektdaten → Projekt anlegen.
 * Alternativ "Nur Auskunft" → ohne Projekt weiter.
 */
export function StartGate({ onDone }) {
  const { create } = useProject();
  const { gotoDashboard } = useView();
  const firmaInit = ladeFirma();

  const [firma, setFirma] = useState({
    firma: firmaInit.firma || '',
    anschrift: firmaInit.anschrift || '',
    bearbeiter: firmaInit.bearbeiter || '',
    telefon: firmaInit.telefon || '',
  });
  const [projekt, setProjekt] = useState({ name: '', stadt: '', strasse: '', von: '', bis: '' });

  const setF = (k) => (e) => setFirma((d) => ({ ...d, [k]: e.target.value }));
  const setP = (k) => (e) => setProjekt((d) => ({ ...d, [k]: e.target.value }));

  const speichereFirma = () => {
    try { localStorage.setItem(FIRMA_KEY, JSON.stringify(firma)); } catch { /* ignore */ }
  };

  const erledigt = () => {
    try { localStorage.setItem(ENTRY_KEY, '1'); } catch { /* ignore */ }
    onDone?.();
    gotoDashboard();
  };

  const handleProjekt = (e) => {
    e.preventDefault();
    if (!projekt.name.trim()) return;
    speichereFirma();
    create(projekt.name.trim(), projekt.stadt.trim(), projekt.strasse.trim(), {
      von: projekt.von.trim(),
      bis: projekt.bis.trim(),
    });
    erledigt();
  };

  const handleAuskunft = () => {
    speichereFirma();
    try { localStorage.setItem('vzk-active-project', 'global'); } catch { /* ignore */ }
    erledigt();
  };

  return (
    <div className="start-gate">
      <div className="start-gate__head">
        <h1>Verkehrssicherung, im Griff.</h1>
        <p>Projekt anlegen oder direkt zur allgemeinen Auskunft.</p>
      </div>

      <form className="start-gate__card" onSubmit={handleProjekt}>
        <fieldset className="form-fieldset">
          <legend><Buildings size={15} weight="fill" /> Firmendaten</legend>
          <div className="form-group">
            <label>Firma / Büro</label>
            <input value={firma.firma} onChange={setF('firma')} placeholder="HOH Verkehrstechnik" />
          </div>
          <div className="form-group">
            <label>Anschrift</label>
            <input value={firma.anschrift} onChange={setF('anschrift')} placeholder="Straße, PLZ Ort" />
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Bearbeiter</label>
              <input value={firma.bearbeiter} onChange={setF('bearbeiter')} placeholder="Name" />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input value={firma.telefon} onChange={setF('telefon')} placeholder="0123 456789" />
            </div>
          </div>
        </fieldset>

        <fieldset className="form-fieldset">
          <legend><MapPin size={15} weight="fill" /> Projektdaten</legend>
          <div className="form-group">
            <label>Projektname *</label>
            <input value={projekt.name} onChange={setP('name')} placeholder="z. B. Bauvorhaben München" required />
          </div>
          <div className="form-group">
            <label>Stadt</label>
            <input value={projekt.stadt} onChange={setP('stadt')} placeholder="München" />
          </div>
          <div className="form-group">
            <label>Straße</label>
            <input value={projekt.strasse} onChange={setP('strasse')} placeholder="Leopoldstraße" />
          </div>
          <div className="form-group-row">
            <div className="form-group">
              <label>Hausnr. von</label>
              <input value={projekt.von} onChange={setP('von')} placeholder="1" />
            </div>
            <div className="form-group">
              <label>bis</label>
              <input value={projekt.bis} onChange={setP('bis')} placeholder="50" />
            </div>
          </div>
        </fieldset>

        <div className="start-gate__actions">
          <button type="submit" className="btn btn-primary btn-lg">Projekt erstellen & starten</button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={handleAuskunft}>
            <Info size={18} weight="bold" /> Nur Auskunft
          </button>
        </div>
      </form>
    </div>
  );
}

export default StartGate;
