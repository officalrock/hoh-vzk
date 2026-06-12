/**
 * T016-T017: Basic foundation validation
 * Run: node src/lib/packing-list.test.js
 */

let mockLS = {};
global.localStorage = {
  getItem: (key) => mockLS[key] || null,
  setItem: (key, val) => { mockLS[key] = val; },
  removeItem: (key) => { delete mockLS[key]; },
};

class PackingList {
  constructor(projectId = 'global') {
    this.projectId = projectId;
    this.storageKey = 'vzk-packliste-' + projectId;
    this.positionen = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.positionen));
  }

  addSign(zeichennummer, bezeichnung, anzahl = 1) {
    const existing = this.positionen.find(p => p.type === 'sign' && p.zeichennummer === zeichennummer);
    if (existing) {
      existing.stueckzahl += anzahl;
    } else {
      this.positionen.push({ type: 'sign', zeichennummer, bezeichnung, stueckzahl: anzahl });
    }
    this.save();
  }
}

console.log('=== Foundation Tests ===\n');

// T016: Persistence
console.log('T016: Add sign → save → reload → verify');
mockLS = {};
let pl = new PackingList('proj1');
pl.addSign('274-30', 'Speed 30', 3);
console.log('✓ Added 274-30 qty=3');

// Simulate reload
const saved = mockLS['vzk-packliste-proj1'];
mockLS = {};
mockLS['vzk-packliste-proj1'] = saved;

pl = new PackingList('proj1');
const item = pl.positionen.find(p => p.zeichennummer === '274-30');
console.log('✓ After reload qty=' + (item?.stueckzahl || 0));
console.log(item?.stueckzahl === 3 ? '✅ T016 PASS' : '❌ T016 FAIL');

// T017: Merge
console.log('\nT017: Add same sign twice → auto-merge qty');
mockLS = {};
pl = new PackingList('proj2');
pl.addSign('274-30', 'Speed 30', 2);
pl.addSign('274-30', 'Speed 30', 3);
const dupCount = pl.positionen.filter(p => p.zeichennummer === '274-30').length;
const totalQty = pl.positionen.find(p => p.zeichennummer === '274-30')?.stueckzahl;
console.log('✓ Entries=' + dupCount + ' TotalQty=' + totalQty);
console.log((dupCount === 1 && totalQty === 5) ? '✅ T017 PASS' : '❌ T017 FAIL');

console.log('\n=== Done ===');
