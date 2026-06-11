import { KATEGORIE_FARBE } from "../../theme/tokens.js";
import "./ui.css";

/** Kleines farbcodiertes Kategorie-Label (semantische Signalfarbe). */
export function CategoryBadge({ kategorie, withDot = true }) {
  const farbe = KATEGORIE_FARBE[kategorie] || KATEGORIE_FARBE.Sonstige;
  return (
    <span className="badge" style={{ background: farbe }}>
      {withDot && <span className="badge__dot" style={{ background: "rgba(255,255,255,0.85)" }} />}
      {kategorie}
    </span>
  );
}
