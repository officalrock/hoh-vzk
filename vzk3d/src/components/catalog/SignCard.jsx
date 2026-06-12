import { memo, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { assetUrl } from "../../utils/assetPath.js";
import { CategoryBadge } from "../ui/CategoryBadge.jsx";
import "./catalog.css";
import "./signcard-add.css";

/** Eine Zeichen-Karte im Katalog-Grid. Mit + Button zum Packliste-Hinzufügen (T021) */
function SignCardBase({ zeichen, onOpen, onAddToPacking }) {
  const [inPacking, setInPacking] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToPacking?.(zeichen.nummer, zeichen.name);
    setInPacking(true);
    setTimeout(() => setInPacking(false), 1500);
  };

  return (
    <div className="signcard-wrapper">
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
      <button
        className={`signcard__add ${inPacking ? 'signcard__add--active' : ''}`}
        onClick={handleAdd}
        aria-label="Zur Packliste hinzufügen"
        title="Zur Packliste hinzufügen"
      >
        <Plus size={20} weight="bold" />
      </button>
    </div>
  );
}

export const SignCard = memo(SignCardBase);
