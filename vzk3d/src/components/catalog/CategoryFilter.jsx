import { KATEGORIE_FARBE } from "../../theme/tokens.js";
import "./catalog.css";

/** Horizontal scrollbare Kategorie-Chips inkl. „Alle". */
export function CategoryFilter({ kategorien, aktiv, onChange, gesamt }) {
  return (
    <div className="filter" role="tablist" aria-label="Kategorie filtern">
      <button
        role="tab"
        aria-selected={aktiv === "alle"}
        className={"chip" + (aktiv === "alle" ? " chip--active" : "")}
        onClick={() => onChange("alle")}
      >
        Alle <span className="chip__count">{gesamt}</span>
      </button>
      {kategorien.map((k) => (
        <button
          key={k.name}
          role="tab"
          aria-selected={aktiv === k.name}
          className={"chip" + (aktiv === k.name ? " chip--active" : "")}
          onClick={() => onChange(k.name)}
        >
          <span
            className="chip__swatch"
            style={{ background: KATEGORIE_FARBE[k.name] || KATEGORIE_FARBE.Sonstige }}
            aria-hidden
          />
          {k.name} <span className="chip__count">{k.anzahl}</span>
        </button>
      ))}
    </div>
  );
}
