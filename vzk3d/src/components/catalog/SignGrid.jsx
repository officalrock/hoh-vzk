import { useEffect, useMemo, useRef, useState } from "react";
import { SignCard } from "./SignCard.jsx";
import "./catalog.css";

const SEITE = 48; // Karten pro Nachladeschritt – Grid bleibt schnell.

/**
 * Rendert die gefilterte Zeichenliste inkrementell: zunächst SEITE Karten,
 * weitere beim Scrollen (IntersectionObserver). So bleibt der Katalog auch
 * bei 1700+ Zeichen flüssig.
 */
export function SignGrid({ zeichen, onOpen, onAddToPacking }) {
  const [anzahl, setAnzahl] = useState(SEITE);
  const sentinel = useRef(null);

  // Bei geänderter Filterung zurücksetzen.
  useEffect(() => setAnzahl(SEITE), [zeichen]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnzahl((n) => Math.min(n + SEITE, zeichen.length));
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [zeichen.length]);

  const sichtbar = useMemo(() => zeichen.slice(0, anzahl), [zeichen, anzahl]);

  if (!zeichen.length) {
    return (
      <div className="leer">
        <b>Keine Treffer</b>
        Andere Kategorie wählen oder Suchbegriff anpassen.
      </div>
    );
  }

  return (
    <>
      <div className="grid">
        {sichtbar.map((z) => (
          <SignCard key={z.nummer} zeichen={z} onOpen={onOpen} onAddToPacking={onAddToPacking} />
        ))}
      </div>
      {anzahl < zeichen.length && <div ref={sentinel} className="sentinel" aria-hidden />}
    </>
  );
}
