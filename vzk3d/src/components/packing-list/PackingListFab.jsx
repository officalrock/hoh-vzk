import React, { useState, useEffect } from 'react';
import { Package } from '@phosphor-icons/react';
import PackingListDrawer from './PackingListDrawer';
import { usePackingList } from '../../hooks/usePackingList';
import './packing-list-drawer.css';

/**
 * Schwebender Packliste-Button (unten rechts) mit Positions-Zähler.
 * Öffnet den PackingListDrawer. Global in AppShell gemountet.
 */
export default function PackingListFab() {
  const [open, setOpen] = useState(false);
  const { positionen } = usePackingList();

  // Gesamtmenge (Summe aller Stückzahlen)
  const total = positionen.reduce((sum, p) => sum + (p.stueckzahl || 0), 0);

  // Schließen bei Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        className="packing-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Packliste öffnen"
        title="Packliste"
      >
        <Package size={24} weight="fill" />
        {total > 0 && <span className="packing-fab__badge">{total}</span>}
      </button>
      <PackingListDrawer isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
