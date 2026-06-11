import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * Deutsche Ampel als 3D-Objekt mit realistischem Phasenzyklus:
 *   Rot → Rot-Gelb → Grün → Gelb → (Rot …)
 * Die aktive Linse glüht (hohe Emission → Bloom) und wirft farbiges Licht.
 * `phaseOffset` verschiebt den Zyklus (für mehrere Ampeln in der Tiefe).
 * `onPhase(label)` wird nur bei Phasenwechsel aufgerufen (imperativ, kein Re-Render).
 */

const FARBE = {
  rot: new THREE.Color("#ff2a1f"),
  gelb: new THREE.Color("#ffc01e"),
  gruen: new THREE.Color("#1fe06e"),
};

const PHASEN = [
  { lichter: ["rot"], dauer: 3.2, label: "HALT · Rot" },
  { lichter: ["rot", "gelb"], dauer: 1.1, label: "Achtung · Rot-Gelb" },
  { lichter: ["gruen"], dauer: 3.6, label: "FREI · Grün" },
  { lichter: ["gelb"], dauer: 1.3, label: "Achtung · Gelb" },
];
const GESAMT = PHASEN.reduce((s, p) => s + p.dauer, 0);

function aktivePhase(t) {
  let x = ((t % GESAMT) + GESAMT) % GESAMT;
  for (const p of PHASEN) {
    if (x < p.dauer) return p;
    x -= p.dauer;
  }
  return PHASEN[0];
}

function Linse({ farbe, y, matRef, lightRef }) {
  return (
    <group position={[0, y, 0.16]}>
      {/* Hutze/Visor über der Linse (technisches Detail) */}
      <mesh position={[0, 0.16, 0.02]} rotation={[-0.5, 0, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.12, 24, 1, true]} />
        <meshStandardMaterial color="#171b22" metalness={0.6} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Linsenglas */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.06, 32]} />
        <meshStandardMaterial
          ref={matRef}
          color={farbe}
          emissive={farbe}
          emissiveIntensity={0.05}
          metalness={0.1}
          roughness={0.25}
          transparent
          opacity={0.96}
        />
      </mesh>
      {/* farbiges Licht der aktiven Linse */}
      <pointLight ref={lightRef} color={farbe} intensity={0} distance={3.5} position={[0, 0, 0.4]} />
    </group>
  );
}

export function TrafficLight({ phaseOffset = 0, onPhase, reduced = false }) {
  const rot = useRef();
  const gelb = useRef();
  const gruen = useRef();
  const lRot = useRef();
  const lGelb = useRef();
  const lGruen = useRef();
  const letzteLabel = useRef("");

  const refs = useMemo(
    () => ({
      rot: { mat: rot, light: lRot },
      gelb: { mat: gelb, light: lGelb },
      gruen: { mat: gruen, light: lGruen },
    }),
    []
  );

  useFrame((state) => {
    // Bei reduzierter Bewegung: dauerhaft „Grün" (kein Flackern).
    const t = reduced ? 5.0 : state.clock.elapsedTime + phaseOffset;
    const phase = aktivePhase(t);
    const puls = reduced ? 1 : 0.85 + Math.sin(state.clock.elapsedTime * 3) * 0.15;

    for (const key of ["rot", "gelb", "gruen"]) {
      const an = phase.lichter.includes(key);
      const r = refs[key];
      if (r.mat.current) r.mat.current.emissiveIntensity = an ? 2.4 * puls : 0.05;
      if (r.light.current) r.light.current.intensity = an ? 1.6 * puls : 0;
    }

    if (onPhase && phase.label !== letzteLabel.current) {
      letzteLabel.current = phase.label;
      onPhase(phase.label);
    }
  });

  return (
    <group>
      {/* Mast */}
      <mesh position={[0, -1.55, -0.05]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 2.4, 20]} />
        <meshStandardMaterial color="#2a3038" metalness={0.85} roughness={0.4} />
      </mesh>
      {/* Gehäuse */}
      <RoundedBox args={[0.62, 1.5, 0.34]} radius={0.1} smoothness={4} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#14181f" metalness={0.5} roughness={0.55} />
      </RoundedBox>
      {/* Frontblende */}
      <RoundedBox args={[0.52, 1.4, 0.04]} radius={0.08} smoothness={3} position={[0, 0, 0.16]}>
        <meshStandardMaterial color="#0c0f14" metalness={0.4} roughness={0.6} />
      </RoundedBox>

      <Linse farbe={FARBE.rot} y={0.45} matRef={rot} lightRef={lRot} />
      <Linse farbe={FARBE.gelb} y={0.0} matRef={gelb} lightRef={lGelb} />
      <Linse farbe={FARBE.gruen} y={-0.45} matRef={gruen} lightRef={lGruen} />
    </group>
  );
}
