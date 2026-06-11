import { Component } from "react";

/**
 * Fängt Fehler aus der 3D-Szene (WebGL-Kontextverlust, fehlende Textur …)
 * und zeigt stattdessen den übergebenen `fallback` (statische Darstellung).
 */
export class Canvas3DBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.warn("3D-Szene deaktiviert (Fallback aktiv):", error?.message || error);
  }
  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
