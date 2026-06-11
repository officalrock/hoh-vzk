import { MagnifyingGlass, X } from "@phosphor-icons/react";
import "./catalog.css";

export function SearchBar({ value, onChange }) {
  return (
    <div className="searchbar">
      <div className="searchbar__field glass">
        <MagnifyingGlass size={22} weight="bold" aria-hidden />
        <input
          type="search"
          inputMode="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="VZ-Nummer oder Bezeichnung, z. B. 274-30 oder Gefahrstelle"
          aria-label="Verkehrszeichen suchen"
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button className="searchbar__clear" onClick={() => onChange("")} aria-label="Suche löschen">
            <X size={20} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
