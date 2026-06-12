/**
 * Packing List (Packliste) — core material management
 * Handles: add/remove signs, import Regelplan material, auto-summation, localStorage persistence
 */

const STORAGE_KEY_TEMPLATE = 'vzk-packliste-';

// Außerorts erhöht den Staudruck (RSA 21: 0,42 vs 0,25 kN/m²) → mehr Fußplatten.
const AUSSERORTS_FAKTOR = 420 / 250;

/**
 * Gesamt-Fußplattenbedarf eines Sperrmaterials (US8).
 * Basis: Stückzahl × Fußplatten je Stück; außerorts aufgerundet mit Staudruckfaktor.
 */
export function fussplattenGesamt(pos) {
  const je = pos.fussplattenJe || 0;
  if (!je) return 0;
  const basis = pos.stueckzahl * je;
  return pos.aufstellort === 'ausserorts' ? Math.ceil(basis * AUSSERORTS_FAKTOR) : basis;
}

export class PackingList {
  constructor(projectId = 'global') {
    this.projectId = projectId;
    this.storageKey = STORAGE_KEY_TEMPLATE + projectId;
    this.positionen = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load packing list:', e);
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.positionen));
      // Alle usePackingList-Instanzen (FAB, Drawer, Seiten) synchronisieren.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('packliste-changed', { detail: { key: this.storageKey } }));
      }
    } catch (e) {
      console.error('Failed to save packing list:', e);
    }
  }

  /**
   * Add sign to packing list. If already exists, increment quantity
   */
  addSign(zeichennummer, bezeichnung, anzahl = 1, bild = '') {
    const existing = this.positionen.find(
      (p) => p.type === 'sign' && p.zeichennummer === zeichennummer
    );
    if (existing) {
      existing.stueckzahl += anzahl;
      if (bild && !existing.bild) existing.bild = bild;
    } else {
      this.positionen.push({
        type: 'sign',
        zeichennummer,
        bezeichnung,
        stueckzahl: anzahl,
        bild,
        wunschtext: null,
        quelle: 'katalog',
      });
    }
    this.save();
  }

  /**
   * Remove sign from packing list
   */
  removeSign(zeichennummer) {
    this.positionen = this.positionen.filter(
      (p) => !(p.type === 'sign' && p.zeichennummer === zeichennummer)
    );
    this.save();
  }

  /**
   * Update quantity of sign
   */
  updateSignQuantity(zeichennummer, anzahl) {
    const pos = this.positionen.find(
      (p) => p.type === 'sign' && p.zeichennummer === zeichennummer
    );
    if (pos) {
      if (anzahl <= 0) {
        this.removeSign(zeichennummer);
      } else {
        pos.stueckzahl = anzahl;
        this.save();
      }
    }
  }

  /**
   * Add barrier material (Sperrmaterial) to packing list. If exists, increment
   */
  addMaterial(name, einheit, anzahl = 1, aufstellort = 'innerorts', aufstellhoehe = 2.0, fussplattenJe = 0) {
    const existing = this.positionen.find((p) => p.type === 'material' && p.name === name);
    if (existing) {
      existing.stueckzahl += anzahl;
    } else {
      this.positionen.push({
        type: 'material',
        name,
        einheit,
        stueckzahl: anzahl,
        aufstellort,
        aufstellhoehe,
        fussplattenJe,
        quelle: 'katalog',
      });
    }
    this.save();
  }

  /**
   * Aufstellort eines Materials setzen (innerorts/ausserorts) — US8.
   */
  setMaterialAufstellort(name, aufstellort) {
    const pos = this.positionen.find((p) => p.type === 'material' && p.name === name);
    if (pos) { pos.aufstellort = aufstellort; this.save(); }
  }

  /**
   * Remove material from packing list
   */
  removeMaterial(name) {
    this.positionen = this.positionen.filter((p) => !(p.type === 'material' && p.name === name));
    this.save();
  }

  /**
   * Update material quantity
   */
  updateMaterialQuantity(name, anzahl) {
    const pos = this.positionen.find((p) => p.type === 'material' && p.name === name);
    if (pos) {
      if (anzahl <= 0) {
        this.removeMaterial(name);
      } else {
        pos.stueckzahl = anzahl;
        this.save();
      }
    }
  }

  /**
   * Import entire Regelplan material (zeichen + sperrmaterial). Auto-sum duplicates
   */
  importRegelplan(regelplan, allZeichen, windlastFn = null) {
    // Import zeichen
    if (regelplan.material?.zeichen) {
      regelplan.material.zeichen.forEach((item) => {
        const zeichen = allZeichen.find((z) => z.nummer === item.nummer);
        if (zeichen) {
          this.addSign(item.nummer, zeichen.name, item.anzahl, zeichen.bild || '');
        }
      });
    }

    // Import sperrmaterial (mit Fussplatten-Faktor fuer Windlast US8)
    if (regelplan.material?.sperr) {
      regelplan.material.sperr.forEach((item) => {
        this.addMaterial(item.name, item.einheit, item.anzahl, 'innerorts', 2.0, item.fussplattenJe || 0);
      });
    }

    this.save();
  }

  /**
   * Export packing list as CSV
   */
  toCSV() {
    const headers = ['Zeichennummer', 'Bezeichnung', 'Einheit', 'Menge', 'Aufstellort', 'Fussplatten', 'Wunschtext'];
    const rows = this.positionen.map((p) => {
      if (p.type === 'sign') {
        return [p.zeichennummer, p.bezeichnung, 'Stk.', p.stueckzahl, '', '', p.wunschtext || ''];
      } else {
        return ['', p.name, p.einheit, p.stueckzahl, p.aufstellort || '', fussplattenGesamt(p), ''];
      }
    });
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(';')).join('\n');
    return csv;
  }

  /**
   * Get all positionen (signs + material)
   */
  getAll() {
    return this.positionen;
  }

  /**
   * Clear packing list
   */
  clear() {
    this.positionen = [];
    this.save();
  }
}

export default PackingList;
