import { TopBar } from "./TopBar.jsx";
import "./layout.css";

export function AppShell({ children }) {
  return (
    <div className="appshell">
      <TopBar />
      <main className="appmain">{children}</main>
      <footer className="appfooter">
        <div className="container">
          VZK – Verkehrszeichenkatalog nach StVO/VzKat. Zeichen-Grafiken aus dem Projektbestand.
          Angaben ohne Gewähr; maßgeblich sind die amtlichen Vorschriften.
        </div>
      </footer>
    </div>
  );
}
