import React, { useState } from 'react';
import { X, Plus } from '@phosphor-icons/react';
import { usePackingList } from '../../hooks/usePackingList';
import { useProject } from '../../hooks/useProject';
import { generatePackingListPDF, downloadPDF } from '../../lib/pdf-export';
import { packlisteFussplatten } from '../../lib/packing-windlast';
import PackingListItemRow from './PackingListItemRow';
import './packing-list-drawer.css';

const SETTINGS_KEY = 'vzk-packliste-settings';

// Häufiges Sperrmaterial als Schnellauswahl (fussplattenJe = K1-Fußplatten je Stück).
const MATERIAL_PRESETS = [
  { name: 'Leitbake (Z 605)', einheit: 'Stk.', fussplattenJe: 1 },
  { name: 'Leitkegel (Z 610)', einheit: 'Stk.', fussplattenJe: 0 },
  { name: 'Absperrschranke (Z 600)', einheit: 'Stk.', fussplattenJe: 2 },
  { name: 'Fahrbare Absperrtafel', einheit: 'Stk.', fussplattenJe: 0 },
  { name: 'Warnleuchte', einheit: 'Stk.', fussplattenJe: 0 },
];

function ladeSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { aufstellort: 'innerorts', aufstellhoehe: 2.0 };
  } catch {
    return { aufstellort: 'innerorts', aufstellhoehe: 2.0 };
  }
}

/**
 * Packliste Drawer mit globalem Aufstellort/-höhe (US8: Schild-Windlast).
 */
export default function PackingListDrawer({ isOpen, onClose, projectId = null }) {
  const {
    positionen,
    removeSign,
    addMaterial,
    removeMaterial,
    updateSignQuantity,
    updateMaterialQuantity,
    setMaterialAufstellort,
    toCSV,
  } = usePackingList(projectId);
  const { activeProject } = useProject();
  const [settings, setSettings] = useState(ladeSettings);
  const [addOpen, setAddOpen] = useState(false);
  const [eigenName, setEigenName] = useState('');

  const ergaenze = (preset) => {
    addMaterial(
      preset.name,
      preset.einheit || 'Stk.',
      1,
      settings.aufstellort,
      settings.aufstellhoehe,
      preset.fussplattenJe || 0
    );
  };

  const ergaenzeEigen = () => {
    const name = eigenName.trim();
    if (!name) return;
    ergaenze({ name, einheit: 'Stk.', fussplattenJe: 0 });
    setEigenName('');
  };

  const updateSettings = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const gesamtFussplatten = packlisteFussplatten(positionen, settings.aufstellort, settings.aufstellhoehe);

  const handleExportPDF = () => {
    const doc = generatePackingListPDF(positionen, activeProject || null, settings);
    const name = activeProject ? `packliste-${activeProject.name}` : 'packliste';
    downloadPDF(doc, `${name}.pdf`);
  };

  const handleExportCSV = () => {
    const csv = toCSV(settings);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packliste-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="packing-list-drawer">
      <div className="packing-list-header">
        <h2>Packliste ({positionen.length})</h2>
        <div className="packing-list-header__actions">
          <button
            className={'btn-add' + (addOpen ? ' btn-add--active' : '')}
            onClick={() => setAddOpen((v) => !v)}
            aria-label="Material ergänzen"
            aria-expanded={addOpen}
            title="Material ergänzen"
          >
            <Plus size={22} weight="bold" />
          </button>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
        </div>
      </div>

      {addOpen && (
        <div className="packing-list-add">
          <div className="packing-list-add__chips">
            {MATERIAL_PRESETS.map((p) => (
              <button key={p.name} className="add-chip" onClick={() => ergaenze(p)}>
                <Plus size={14} weight="bold" /> {p.name}
              </button>
            ))}
          </div>
          <div className="packing-list-add__eigen">
            <input
              value={eigenName}
              placeholder="Eigenes Material …"
              onChange={(e) => setEigenName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ergaenzeEigen()}
              aria-label="Eigenes Material"
            />
            <button className="btn btn-primary" onClick={ergaenzeEigen}>Hinzufügen</button>
          </div>
        </div>
      )}

      {positionen.length === 0 ? (
        <div className="packing-list-empty">
          <p>Packliste ist leer</p>
          <small>Suchen Sie im Katalog oder importieren Sie einen Regelplan</small>
        </div>
      ) : (
        <>
          {/* US8: globale Windlast-Parameter */}
          <div className="packing-list-settings">
            <label>
              Aufstellort
              <select
                value={settings.aufstellort}
                onChange={(e) => updateSettings({ aufstellort: e.target.value })}
              >
                <option value="innerorts">innerorts (0,25 kN/m²)</option>
                <option value="ausserorts">außerorts (0,42 kN/m²)</option>
              </select>
            </label>
            <label>
              Aufstellhöhe (m)
              <input
                type="number"
                step="0.05"
                min="0.1"
                value={settings.aufstellhoehe}
                onChange={(e) => updateSettings({ aufstellhoehe: parseFloat(e.target.value) || 2.0 })}
              />
            </label>
          </div>

          <div className="packing-list-content">
            {positionen.map((pos, idx) => (
              <PackingListItemRow
                key={idx}
                position={pos}
                aufstellort={settings.aufstellort}
                aufstellhoehe={settings.aufstellhoehe}
                onRemove={() => {
                  if (pos.type === 'sign') {
                    removeSign(pos.zeichennummer, pos.wunschtext);
                  } else {
                    removeMaterial(pos.name);
                  }
                }}
                onQuantityChange={(_id, anzahl) => {
                  if (pos.type === 'sign') {
                    updateSignQuantity(pos.zeichennummer, anzahl, pos.wunschtext);
                  } else {
                    updateMaterialQuantity(pos.name, anzahl);
                  }
                }}
                onAufstellort={setMaterialAufstellort}
              />
            ))}
          </div>

          <div className="packing-list-total">
            K1-Fußplatten gesamt <strong>{gesamtFussplatten}</strong>
          </div>

          <div className="packing-list-footer">
            <button className="btn btn-primary" onClick={handleExportPDF}>PDF</button>
            <button className="btn btn-secondary" onClick={handleExportCSV}>CSV</button>
            <button className="btn btn-secondary" onClick={() => window.print()}>Drucken</button>
          </div>
        </>
      )}
    </div>
  );
}
