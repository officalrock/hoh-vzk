import React from 'react';
import { X } from '@phosphor-icons/react';
import { usePackingList } from '../../hooks/usePackingList';
import { useProject } from '../../hooks/useProject';
import { generatePackingListPDF, downloadPDF } from '../../lib/pdf-export';
import PackingListItemRow from './PackingListItemRow';
import './packing-list-drawer.css';

/**
 * T018: Packing List sidebar/modal drawer
 * Shows all positionen (signs + materials) with edit/delete controls
 * Accessible via hamburger or sidebar toggle in Catalog/Regelplaene pages
 */
export default function PackingListDrawer({ isOpen, onClose, projectId = 'global' }) {
  const {
    positionen,
    removeSign,
    removeMaterial,
    updateSignQuantity,
    updateMaterialQuantity,
    setMaterialAufstellort,
    toCSV,
  } = usePackingList(projectId);
  const { activeProject } = useProject();

  const handleExportPDF = () => {
    const doc = generatePackingListPDF(positionen, activeProject || null);
    const name = activeProject ? `packliste-${activeProject.name}` : 'packliste';
    downloadPDF(doc, `${name}.pdf`);
  };

  if (!isOpen) return null;

  const handleExportCSV = () => {
    const csv = toCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packliste-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="packing-list-drawer">
      <div className="packing-list-header">
        <h2>Packliste ({positionen.length})</h2>
        <button className="btn-close" onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
      </div>

      {positionen.length === 0 ? (
        <div className="packing-list-empty">
          <p>Packliste ist leer</p>
          <small>Suchen Sie im Katalog oder importieren Sie einen Regelplan</small>
        </div>
      ) : (
        <>
          <div className="packing-list-content">
            {positionen.map((pos, idx) => (
              <PackingListItemRow
                key={idx}
                position={pos}
                onRemove={() => {
                  if (pos.type === 'sign') {
                    removeSign(pos.zeichennummer);
                  } else {
                    removeMaterial(pos.name);
                  }
                }}
                onQuantityChange={(_id, anzahl) => {
                  if (pos.type === 'sign') {
                    updateSignQuantity(pos.zeichennummer, anzahl);
                  } else {
                    updateMaterialQuantity(pos.name, anzahl);
                  }
                }}
                onAufstellort={setMaterialAufstellort}
              />
            ))}
          </div>

          <div className="packing-list-footer">
            <button className="btn btn-primary" onClick={handleExportPDF}>
              PDF
            </button>
            <button className="btn btn-secondary" onClick={handleExportCSV}>
              CSV
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              Drucken
            </button>
          </div>
        </>
      )}
    </div>
  );
}
