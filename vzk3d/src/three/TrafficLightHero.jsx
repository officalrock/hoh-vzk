import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { TrafficLight } from "./TrafficLight.jsx";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";

function CameraRig({ reduced }) {
  const { camera, pointer } = useThree();
  const base = useRef({ x: 0.4, y: 0.4, z: 6.2 });
  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    const tx = base.current.x + Math.sin(t * 0.18) * 0.5 + pointer.x * 0.6;
    const ty = base.current.y + Math.cos(t * 0.14) * 0.25 - pointer.y * 0.35;
    camera.position.x += (tx - camera.position.x) * 0.04;
    camera.position.y += (ty - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function Ground() {
  // Leichter, „nasser" Asphalt: dunkles, metallisches Material. Die farbigen
  // Ampel-Spotlights erzeugen darauf den reflektierenden Schein – ohne den
  // teuren Echtzeit-Spiegel (Performance).
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#0a0d12" metalness={0.9} roughness={0.45} />
    </mesh>
  );
}

export function TrafficLightHero({ hudRef, lowPower = false }) {
  const reduced = usePrefersReducedMotion();
  const setPhase = (label) => {
    if (hudRef?.current) hudRef.current.textContent = label;
  };

  return (
    <Canvas
      camera={{ position: [0.4, 0.4, 6.2], fov: 40 }}
      dpr={lowPower ? [1, 1.3] : [1, 2]}
      gl={{ alpha: true, antialias: !lowPower, powerPreference: "high-performance" }}
      shadows={!lowPower}
    >
      <color attach="background" args={["#0a0d13"]} />
      <fog attach="fog" args={["#0a0d13", 7, 16]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 4]} intensity={0.5} color="#9fb4d6" />

      <Suspense fallback={null}>
        <CameraRig reduced={reduced} />

        {/* Hauptampel */}
        <group position={[0, 0.3, 0]}>
          <TrafficLight onPhase={setPhase} reduced={reduced} />
        </group>
        {/* Ampeln in der Tiefe, zeitversetzt – Skyline-Effekt */}
        <group position={[-2.8, 0.0, -3.2]} scale={0.8} rotation={[0, 0.5, 0]}>
          <TrafficLight phaseOffset={2.3} reduced={reduced} />
        </group>
        <group position={[3.0, -0.1, -4.0]} scale={0.7} rotation={[0, -0.6, 0]}>
          <TrafficLight phaseOffset={5.1} reduced={reduced} />
        </group>

        <Ground />
      </Suspense>

      <EffectComposer disableNormalPass>
        <Bloom
          intensity={lowPower ? 0.9 : 1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.7}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}

export default TrafficLightHero;
