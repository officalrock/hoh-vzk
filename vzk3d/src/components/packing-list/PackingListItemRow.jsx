import React, { useState, useMemo } from 'react';
import { Trash, Minus, Plus } from '@phosphor-icons/react';
import { assetUrl } from '../../utils/assetPath.js';
import { fussplattenGesamt } from '../../lib/packing-list.js';
import zeichenData from '../../data/zeichen.json';

// Lookup nummer → bild-Pfad (richtige Endung .svg/.png aus den Daten).
const BILD_MAP = new Map(zeichenData.map((z) => [z.nummer, z.bild]));

/**
 * T019/US8: Single packing list item row (sign or material).
 * Material-Zeilen: Aufstellort-Umschalter + Fußplattenbedarf.
 */
export default function PackingListItemRow({ position, onRemove, onQuantityChange, onAufstellort }) {
  const [qty, setQty] = useState(position.stueckzahl);

  const handleQtyChange = (newQty) => {
    setQty(newQty);
    onQuantityChange?.(position.zeichennummer || position.name, newQty);
  };

  const isMaterial = position.type === 'material';
  const fussplatten = isMaterial ? fussplattenGesamt(position) : 0;
  const bild = useMemo(
    () => (position.bild || BILD_MAP.get(position.zeichennummer) || ''),
    [position.bild, position.zeichennummer]
  );

  return (
    <div className="packing-list-item">
      {/* Image preview for signs */}
      {!isMaterial && (
        <div className="item-image">
          {bild ? (
            <img
              src={assetUrl(bild)}
              alt={position.bezeichnung}
              loading="lazy"
              onError={(e) => { e.target.style.visibility = 'hidden'; }}
            />
          ) : null}
        </div>
      )}

      {/* Item details */}
      <div className="item-details">
        <h4>{position.bezeichnung || position.name}</h4>
        {position.zeichennummer && <span className="item-nr mono">{position.zeichennummer}</span>}
        {position.wunschtext && <small className="wunschtext">Text: {position.wunschtext}</small>}
        {isMaterial && <small>{position.einheit}</small>}
        {isMaterial && position.fussplattenJe > 0 && (
          <div className="item-windlast">
            <select
              value={position.aufstellort || 'innerorts'}
              onChange={(e) => onAufstellort?.(position.name, e.target.value)}
              aria-label="Aufstellort"
            >
              <option value="innerorts">innerorts</option>
              <option value="ausserorts">außerorts</option>
            </select>
            <span className="item-fussplatten">{fussplatten} Fußplatten</span>
          </div>
        )}
      </div>

      {/* Quantity controls */}
      <div className="item-quantity">
        <button onClick={() => handleQtyChange(Math.max(0, qty - 1))} className="btn-sm">
          <Minus size={16} />
        </button>
        <input
          type="number"
          min="0"
          value={qty}
          onChange={(e) => handleQtyChange(parseInt(e.target.value) || 0)}
          className="qty-input"
        />
        <button onClick={() => handleQtyChange(qty + 1)} className="btn-sm">
          <Plus size={16} />
        </button>
      </div>

      {/* Remove button */}
      <button onClick={onRemove} className="btn-remove" aria-label="Entfernen">
        <Trash size={18} />
      </button>
    </div>
  );
}
