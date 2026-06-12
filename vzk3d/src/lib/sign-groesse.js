/**
 * Standard-Form/Größe je Zeichen-Kategorie (für Windlastberechnung).
 * Aus MaterialBuilder extrahiert, damit Packliste + MaterialBuilder dieselbe
 * Logik nutzen (DRY).
 */
export function defaultGroesse(kategorie) {
  switch (kategorie) {
    case 'Gefahrzeichen':
      return { form: 'dreieck_oben', breite: 900, hoehe: 800 };
    case 'Vorschriftzeichen':
      return { form: 'kreis', breite: 600, hoehe: 600 };
    case 'Zusatzzeichen':
      return { form: 'rechteck', breite: 600, hoehe: 330 };
    default:
      return { form: 'rechteck', breite: 600, hoehe: 600 };
  }
}
