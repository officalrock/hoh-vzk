import { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * Minimaler, abhängigkeitsfreier Router über den Location-Hash.
 * Routen:
 *   #/                       -> Dashboard
 *   #/katalog                -> Katalog
 *   #/katalog?kat=...&q=...  -> Katalog mit Filter/Suche (deep-linkbar)
 *   #/zeichen/274-30         -> Detailansicht eines Zeichens
 */
const ViewContext = createContext(null);

function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  const params = new URLSearchParams(query);
  const segs = path.split("/").filter(Boolean);

  if (segs[0] === "zeichen" && segs[1]) {
    return { name: "detail", nummer: decodeURIComponent(segs[1]) };
  }
  if (segs[0] === "regelplan" && segs[1]) {
    return { name: "regelplan", id: decodeURIComponent(segs[1]) };
  }
  if (segs[0] === "regelplaene") {
    return { name: "regelplaene", teil: params.get("teil") || "alle" };
  }
  if (segs[0] === "katalog") {
    return { name: "katalog", kat: params.get("kat") || "alle", q: params.get("q") || "" };
  }
  return { name: "dashboard" };
}

export function ViewProvider({ children }) {
  const [view, setView] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setView(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((hash) => {
    if (window.location.hash === hash) setView(parseHash());
    else window.location.hash = hash;
    // Nach Navigation an den Seitenanfang
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const gotoDashboard = useCallback(() => navigate("#/"), [navigate]);
  const gotoKatalog = useCallback(
    (kat = "alle", q = "") => {
      const params = new URLSearchParams();
      if (kat && kat !== "alle") params.set("kat", kat);
      if (q) params.set("q", q);
      const qs = params.toString();
      navigate("#/katalog" + (qs ? "?" + qs : ""));
    },
    [navigate]
  );
  const gotoZeichen = useCallback((nummer) => navigate("#/zeichen/" + encodeURIComponent(nummer)), [
    navigate,
  ]);
  const gotoRegelplaene = useCallback(
    (teil = "alle") => navigate("#/regelplaene" + (teil && teil !== "alle" ? "?teil=" + teil : "")),
    [navigate]
  );
  const gotoRegelplan = useCallback(
    (id) => navigate("#/regelplan/" + encodeURIComponent(id)),
    [navigate]
  );

  return (
    <ViewContext.Provider
      value={{
        view,
        navigate,
        gotoDashboard,
        gotoKatalog,
        gotoZeichen,
        gotoRegelplaene,
        gotoRegelplan,
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView muss innerhalb von ViewProvider verwendet werden");
  return ctx;
}
