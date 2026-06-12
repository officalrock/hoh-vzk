import { AppShell } from "./components/layout/AppShell.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Catalog } from "./pages/Catalog.jsx";
import { SignDetail } from "./pages/SignDetail.jsx";
import { Regelplaene } from "./pages/Regelplaene.jsx";
import { RegelplanDetail } from "./pages/RegelplanDetail.jsx";
import { ProjectSelector } from "./pages/ProjectSelector.jsx";
import { Auswertung } from "./pages/Auswertung.jsx";
import { StartGate } from "./pages/StartGate.jsx";
import { IntroSplash } from "./components/intro/IntroSplash.jsx";
import { useView } from "./app/ViewContext.jsx";
import { useState } from "react";

function entryDone() {
  try { return localStorage.getItem("vzk-entry-done") === "1"; } catch { return false; }
}

export default function App() {
  const { view } = useView();
  const [gateDone, setGateDone] = useState(entryDone);
  const [introDone, setIntroDone] = useState(() => !IntroSplash.shouldShow());

  // Splash-Animation beim App-Aufruf (einmal pro Session), dann weiter.
  if (!introDone) {
    return <IntroSplash onDone={() => setIntroDone(true)} />;
  }

  // Vorgeschaltete Startseite beim ersten Aufruf (Dashboard-Route, noch kein Eintritt).
  if (!gateDone && view.name === "dashboard") {
    return (
      <AppShell>
        <StartGate onDone={() => setGateDone(true)} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {view.name === "dashboard" && <Dashboard />}
      {view.name === "projekte" && <ProjectSelector />}
      {view.name === "auswertung" && <Auswertung />}
      {view.name === "katalog" && <Catalog />}
      {view.name === "detail" && <SignDetail nummer={view.nummer} />}
      {view.name === "regelplaene" && <Regelplaene />}
      {view.name === "regelplan" && <RegelplanDetail id={view.id} />}
    </AppShell>
  );
}
