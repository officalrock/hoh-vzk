/**
 * Windlastberechnung für Packlisten-Positionen (US8 voll).
 *
 * Schilder (Verkehrszeichen): volle Moment-Rechnung via windlast.js
 *   (Form + Maße aus Kategorie, Staudruck aus Aufstellort, Schwerpunkt aus Höhe).
 * Sperrmaterial: feste Fußplatten je Stück (fussplattenJe), wie MaterialBuilder.
 */

import * as W from './windlast.js';
import { defaultGroesse } from './sign-groesse.js';
import zeichenData from '../data/zeichen.json';

const ZMAP = new Map(zeichenData.map((z) => [z.nummer, z]));

const STAUDRUCK = { innerorts: 'innerorts', ausserorts: 'ausserorts' };

/**
 * Volle Windlast eines Schildes.
 * @returns {{momentNm:number, klasseText:string, fussplattenJeSchild:number, fussplattenGesamt:number}}
 */
export function signWindlast(zeichennummer, anzahl, ort = 'innerorts', aufstellhoehe = 2.0) {
  const z = ZMAP.get(zeichennummer);
  const g = defaultGroesse(z?.kategorie);
  const q = W.STAUDRUCK[STAUDRUCK[ort] || 'innerorts'].q;
  const erg = W.berechne({
    q,
    form: g.form,
    breiteMm: g.breite,
    hoeheMm: g.hoehe,
    aufstellhoeheM: parseFloat(aufstellhoehe) || 2.0,
  });
  const stk = parseInt(anzahl, 10) || 0;
  return {
    momentNm: Math.round(erg.moment),
    klasseText: erg.klasse.text,
    fussplattenJeSchild: erg.fussplatten,
    fussplattenGesamt: erg.fussplatten * stk,
  };
}

/**
 * Gesamt-K1-Fußplatten der Packliste (Schilder voll gerechnet + Sperrmaterial).
 */
export function packlisteFussplatten(positionen, ort = 'innerorts', aufstellhoehe = 2.0) {
  let summe = 0;
  for (const p of positionen) {
    if (p.type === 'sign') {
      summe += signWindlast(p.zeichennummer, p.stueckzahl, ort, aufstellhoehe).fussplattenGesamt;
    } else if (p.type === 'material') {
      const je = parseInt(p.fussplattenJe, 10) || 0;
      const stk = parseInt(p.stueckzahl, 10) || 0;
      const faktor = p.aufstellort === 'ausserorts' ? W.STAUDRUCK.ausserorts.q / W.STAUDRUCK.innerorts.q : 1;
      summe += je ? (p.aufstellort === 'ausserorts' ? Math.ceil(je * stk * faktor) : je * stk) : 0;
    }
  }
  return summe;
}
