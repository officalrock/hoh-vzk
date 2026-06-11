import { useEffect, useMemo, useState } from "react";
import { useView } from "../app/ViewContext.jsx";
import { SearchBar } from "../components/catalog/SearchBar.jsx";
import { CategoryFilter } from "../components/catalog/CategoryFilter.jsx";
import { SignGrid } from "../components/catalog/SignGrid.jsx";
import { filtereZeichen, kategorienMitAnzahl } from "../utils/search.js";
import zeichen from "../data/zeichen.json";
import "../components/catalog/catalog.css";

export function Catalog() {
  const { view, gotoKatalog, gotoZeichen } = useView();

  // Initialzustand aus der Route (deep-linkbar), danach lokal gehalten.
  const [query, setQuery] = useState(view.q || "");
  const [kategorie, setKategorie] = useState(view.kat || "alle");

  // Route-Änderungen (z. B. Klick auf „Gefahrzeichen" im Dashboard) übernehmen.
  useEffect(() => {
    if (view.name === "katalog") {
      setQuery(view.q || "");
      setKategorie(view.kat || "alle");
    }
  }, [view.name, view.q, view.kat]);

  // Suchbegriff/Kategorie in die URL spiegeln (entprellt).
  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams();
      if (kategorie !== "alle") params.set("kat", kategorie);
      if (query) params.set("q", query);
      const qs = params.toString();
      const ziel = "#/katalog" + (qs ? "?" + qs : "");
      if (window.location.hash !== ziel) window.history.replaceState(null, "", ziel);
    }, 250);
    return () => clearTimeout(id);
  }, [query, kategorie]);

  const kategorien = useMemo(() => kategorienMitAnzahl(zeichen), []);
  const treffer = useMemo(() => filtereZeichen(zeichen, { kategorie, query }), [kategorie, query]);

  return (
    <div className="container">
      <div className="katalog__kopf">
        <h1 className="katalog__titel">Katalog</h1>
        <p className="katalog__sub">
          Alle Verkehrszeichen nach StVO/VzKat. Nach Nummer oder Bezeichnung suchen, nach Kategorie
          filtern.
        </p>
      </div>

      <SearchBar value={query} onChange={setQuery} />
      <CategoryFilter
        kategorien={kategorien}
        aktiv={kategorie}
        onChange={setKategorie}
        gesamt={zeichen.length}
      />

      <p className="trefferinfo" role="status" aria-live="polite">
        {treffer.length} {treffer.length === 1 ? "Zeichen" : "Zeichen"} gefunden
      </p>

      <SignGrid zeichen={treffer} onOpen={gotoZeichen} />
    </div>
  );
}
