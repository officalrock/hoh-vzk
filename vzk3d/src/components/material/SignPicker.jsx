import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { assetUrl } from "../../utils/assetPath.js";
import { filtereZeichen } from "../../utils/search.js";
import zeichen from "../../data/zeichen.json";
import "./material.css";

/** Modal-Dialog zum Auswählen eines Verkehrszeichens aus dem Katalog. */
export function SignPicker({ open, onPick, onClose }) {
  const ref = useRef(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  const treffer = useMemo(() => filtereZeichen(zeichen, { query: q }).slice(0, 60), [q]);

  return (
    <dialog ref={ref} className="picker" onClose={onClose}>
      <div className="picker__head">
        <MagnifyingGlass size={22} weight="bold" style={{ alignSelf: "center" }} aria-hidden />
        <input
          type="search"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zeichen suchen: Nummer oder Bezeichnung"
          aria-label="Zeichen suchen"
        />
        <button className="mat__del" onClick={onClose} aria-label="Schließen">
          <X size={22} weight="bold" />
        </button>
      </div>
      <div className="picker__grid">
        {treffer.map((z) => (
          <button key={z.nummer} className="picker__item" onClick={() => onPick(z)}>
            <span className="picker__item-img">
              <img src={assetUrl(z.bild)} alt={`${z.nummer} ${z.name}`} loading="lazy" />
            </span>
            <span className="picker__item-nr mono">{z.nummer}</span>
          </button>
        ))}
      </div>
    </dialog>
  );
}
