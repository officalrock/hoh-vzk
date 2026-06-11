import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Die Verkehrszeichen-, Logo- und Icon-Grafiken liegen im bestehenden
// Projektordner ../assets. Wir servieren ihn als statisches Verzeichnis,
// sodass z. B. assets/zeichen/274-30.png unter /zeichen/274-30.png erreichbar
// ist (siehe utils/assetPath.js). So werden die 1754 Zeichen-Grafiken NICHT
// dupliziert.
export default defineConfig({
  plugins: [react()],
  // Verhindert doppelte React-Kopien (z. B. über transitive Abhängigkeiten).
  resolve: { dedupe: ["react", "react-dom"] },
  publicDir: fileURLToPath(new URL("../assets", import.meta.url)),
  build: {
    outDir: "dist",
    // Three.js ist groß -> in eigenen Chunk auslagern, Katalog bleibt leicht.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
  },
});
