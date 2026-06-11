import "./traffic-css.css";

/**
 * Reiner CSS-Ampel-Fallback (kein WebGL). Wird gezeigt, wenn 3D deaktiviert
 * ist (reduzierte Bewegung / schwaches Gerät). Animiert den Phasenzyklus per
 * CSS; unter prefers-reduced-motion bleibt sie statisch auf „Grün".
 */
export function TrafficLightCSS() {
  return (
    <div className="ampelcss" aria-hidden>
      <div className="ampelcss__mast" />
      <div className="ampelcss__head glass">
        <span className="ampelcss__lampe ampelcss__lampe--rot" />
        <span className="ampelcss__lampe ampelcss__lampe--gelb" />
        <span className="ampelcss__lampe ampelcss__lampe--gruen" />
      </div>
    </div>
  );
}
