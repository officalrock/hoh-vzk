import { useState, useEffect, useCallback } from 'react';
import PackingList from '../lib/packing-list';
import zeichenData from '../data/zeichen.json';

/**
 * Aktives Projekt aufloesen: explizite ID > aktives Projekt (localStorage) > 'global'.
 */
function resolveProjectId(projectId) {
  if (projectId) return projectId;
  try {
    return localStorage.getItem('vzk-active-project') || 'global';
  } catch {
    return 'global';
  }
}

/**
 * usePackingList — React hook for packing list management.
 * Ohne projectId wird automatisch das aktive Projekt verwendet.
 */
export function usePackingList(projectId = null) {
  const resolvedId = resolveProjectId(projectId);
  const [list, setList] = useState(null);
  const allZeichen = zeichenData;

  useEffect(() => {
    setList(new PackingList(resolvedId));
    // Cross-Instanz-Sync: bei Änderung (anderes Komponenten) neu laden.
    const onChange = (e) => {
      if (!e.detail?.key || e.detail.key === 'vzk-packliste-' + resolvedId) {
        setList(new PackingList(resolvedId));
      }
    };
    window.addEventListener('packliste-changed', onChange);
    return () => window.removeEventListener('packliste-changed', onChange);
  }, [resolvedId]);

  const refresh = useCallback(() => setList(new PackingList(resolvedId)), [resolvedId]);

  const addSign = useCallback(
    (zeichennummer, bezeichnung = null, anzahl = 1) => {
      if (!list) return;
      const zeichen = allZeichen.find((z) => z.nummer === zeichennummer);
      const name = bezeichnung || zeichen?.name || zeichennummer;
      list.addSign(zeichennummer, name, anzahl, zeichen?.bild || '');
      refresh();
    },
    [list, allZeichen, refresh]
  );

  const removeSign = useCallback(
    (zeichennummer) => {
      if (!list) return;
      list.removeSign(zeichennummer);
      refresh();
    },
    [list, refresh]
  );

  const updateSignQuantity = useCallback(
    (zeichennummer, anzahl) => {
      if (!list) return;
      list.updateSignQuantity(zeichennummer, anzahl);
      refresh();
    },
    [list, refresh]
  );

  const addMaterial = useCallback(
    (name, einheit, anzahl = 1, aufstellort = 'innerorts', aufstellhoehe = 2.0) => {
      if (!list) return;
      list.addMaterial(name, einheit, anzahl, aufstellort, aufstellhoehe);
      refresh();
    },
    [list, refresh]
  );

  const removeMaterial = useCallback(
    (name) => {
      if (!list) return;
      list.removeMaterial(name);
      refresh();
    },
    [list, refresh]
  );

  const updateMaterialQuantity = useCallback(
    (name, anzahl) => {
      if (!list) return;
      list.updateMaterialQuantity(name, anzahl);
      refresh();
    },
    [list, refresh]
  );

  const setMaterialAufstellort = useCallback(
    (name, aufstellort) => {
      if (!list) return;
      list.setMaterialAufstellort(name, aufstellort);
      refresh();
    },
    [list, refresh]
  );

  const importRegelplan = useCallback(
    (regelplan) => {
      if (!list) return;
      list.importRegelplan(regelplan, allZeichen);
      refresh();
    },
    [list, allZeichen, refresh]
  );

  const toCSV = useCallback(() => {
    if (!list) return '';
    return list.toCSV();
  }, [list]);

  return {
    positionen: list?.positionen || [],
    addSign,
    removeSign,
    updateSignQuantity,
    addMaterial,
    removeMaterial,
    updateMaterialQuantity,
    setMaterialAufstellort,
    importRegelplan,
    toCSV,
  };
}

export default usePackingList;
