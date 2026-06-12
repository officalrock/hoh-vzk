import { AppShell } from "./components/layout/AppShell.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Catalog } from "./pages/Catalog.jsx";
import { SignDetail } from "./pages/SignDetail.jsx";
import { Regelplaene } from "./pages/Regelplaene.jsx";
import { RegelplanDetail } from "./pages/RegelplanDetail.jsx";
import { ProjectSelector } from "./pages/ProjectSelector.jsx";
import { Auswertung } from "./pages/Auswertung.jsx";
import { useView } from "./app/ViewContext.jsx";

export default function App() {
  const { view } = useView();

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
