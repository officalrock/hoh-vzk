import { memo } from "react";
import { assetUrl } from "../../utils/assetPath.js";
import { CategoryBadge } from "../ui/CategoryBadge.jsx";
import "./catalog.css";

/** Eine Zeichen-Karte im Katalog-Grid. Als Button (Tastatur-/Touch-bedienbar). */
function SignCardBase({ zeichen, onOpen }) {
  return (
    <button className="signcard" onClick={() => onOpen(zeichen.nummer)}>
      <div className="signcard__bildbox">
        <img
          src={assetUrl(zeichen.bild)}
          alt={`Zeichen ${zeichen.nummer} – ${zeichen.name}`}
          loading="lazy"
          decoding="async"
          width={96}
          height={96}
        />
      </div>
      <div className="signcard__nr mono">{zeichen.nummer}</div>
      <div className="signcard__name">{zeichen.name}</div>
      <div className="signcard__kat">
        <CategoryBadge kategorie={zeichen.kategorie} withDot={false} />
      </div>
    </button>
  );
}

export const SignCard = memo(SignCardBase);
