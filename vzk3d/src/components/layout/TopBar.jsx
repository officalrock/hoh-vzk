import { useView } from "../../app/ViewContext.jsx";
import { brandingUrl } from "../../utils/assetPath.js";
import "./layout.css";

export function TopBar() {
  const { view, gotoDashboard, gotoKatalog, gotoRegelplaene, gotoProjekte, gotoAuswertung } = useView();
  const aktiv = view.name;

  return (
    <header className="topbar">
      <div className="container topbar__inner glass">
        <button className="topbar__brand" onClick={gotoDashboard} aria-label="Zur Startseite">
          <img className="topbar__logo" src={brandingUrl("HOH_Logo.png")} alt="HOH Verkehrstechnik" />
          <span className="topbar__title">
            <b>VZK</b>
            <span>Verkehrszeichenkatalog</span>
          </span>
        </button>

        <nav className="topbar__nav" aria-label="Hauptnavigation">
          <button
            className={"navlink" + (aktiv === "dashboard" ? " navlink--active" : "")}
            aria-current={aktiv === "dashboard" ? "page" : undefined}
            onClick={gotoDashboard}
          >
            Start
          </button>
          <button
            className={"navlink" + (aktiv === "katalog" || aktiv === "detail" ? " navlink--active" : "")}
            aria-current={aktiv === "katalog" ? "page" : undefined}
            onClick={() => gotoKatalog()}
          >
            Katalog
          </button>
          <button
            className={"navlink" + (aktiv === "regelplaene" || aktiv === "regelplan" ? " navlink--active" : "")}
            aria-current={aktiv === "regelplaene" ? "page" : undefined}
            onClick={() => gotoRegelplaene()}
          >
            Regelpläne
          </button>
          <button
            className={"navlink" + (aktiv === "auswertung" ? " navlink--active" : "")}
            aria-current={aktiv === "auswertung" ? "page" : undefined}
            onClick={gotoAuswertung}
          >
            Finder
          </button>
          <button
            className={"navlink" + (aktiv === "projekte" ? " navlink--active" : "")}
            aria-current={aktiv === "projekte" ? "page" : undefined}
            onClick={gotoProjekte}
          >
            Projekte
          </button>
        </nav>
      </div>
    </header>
  );
}
