import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { SignBoard } from "./SignBoard.jsx";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";

/**
 * Interaktive 3D-Detailszene: Schild auf Pfosten, frei drehbar/zoombar.
 * Wird per React.lazy nur in der Detailansicht und nur auf 3D-fähigen
 * Geräten geladen (siehe SignDetail).
 */
export function SignScene({ src, lowPower = false, wunschtext = "" }) {
  const reduced = usePrefersReducedMotion();

  return (
    <Canvas
      camera={{ position: [0, 1.65, 3.0], fov: 38 }}
      dpr={lowPower ? [1, 1.4] : [1, 2]}
      shadows={!lowPower}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: "high-performance" }}
    >
      <hemisphereLight intensity={0.5} groundColor="#20242c" color="#dfe7f2" />
      <directionalLight
        position={[2.5, 4, 3]}
        intensity={1.5}
        castShadow={!lowPower}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} color="#9fc0ff" />

      <Suspense fallback={null}>
        <SignBoard src={src} lowPower={lowPower} wunschtext={wunschtext} />
        {/* Dezente Reflexionen ohne externe HDR-Datei (offline-tauglich) */}
        {!lowPower && <Environment resolution={64}>
          <mesh scale={20}>
            <sphereGeometry args={[1, 32, 16]} />
            <meshBasicMaterial color="#2a3340" side={2} />
          </mesh>
          <directionalLight position={[5, 5, 5]} intensity={2} />
        </Environment>}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.45}
          scale={4}
          blur={2.4}
          far={4}
          resolution={lowPower ? 256 : 512}
        />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={1.6}
        maxDistance={5}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, 1.5, 0]}
        autoRotate={!reduced}
        autoRotateSpeed={0.6}
        makeDefault
      />
    </Canvas>
  );
}

export default SignScene;
