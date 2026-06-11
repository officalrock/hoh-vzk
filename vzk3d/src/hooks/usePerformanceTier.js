import { useMemo } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";

/**
 * Schätzt, ob 3D-Effekte sinnvoll laufen. Auf schwachen Geräten oder bei
 * reduzierter Bewegung wird statt 3D eine statische Darstellung gezeigt.
 * Liefert: { allow3d, reason }.
 */
export function usePerformanceTier() {
  const reducedMotion = usePrefersReducedMotion();

  return useMemo(() => {
    if (typeof window === "undefined") return { allow3d: false, reason: "ssr" };
    if (reducedMotion) return { allow3d: false, reason: "reduced-motion" };

    // WebGL-Verfügbarkeit prüfen
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    if (!webgl) return { allow3d: false, reason: "no-webgl" };

    const cores = navigator.hardwareConcurrency || 4;
    const mem = navigator.deviceMemory || 4; // GB, nur Chromium
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    // Sehr schwache Geräte: lieber statisch.
    if (cores <= 2 || mem <= 1) return { allow3d: false, reason: "low-end" };
    // Schwächere Touch-Geräte: 3D erlaubt, aber Aufrufer kann Qualität senken.
    return { allow3d: true, reason: "ok", lowPower: coarse && (cores <= 4 || mem <= 2) };
  }, [reducedMotion]);
}
