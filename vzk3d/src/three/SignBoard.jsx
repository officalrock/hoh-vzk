import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { SCENE } from "../theme/tokens.js";

/**
 * Das Verkehrszeichen als 3D-Objekt: die Asset-Grafik als Textur auf der
 * Schildfläche (mit Alpha → echte Schildsilhouette), graue Rückseite in
 * gleicher Form, leicht retroreflektierender Look. Montiert auf einem
 * verzinkten Pfosten.
 */
export function SignBoard({ src, lowPower = false }) {
  const tex = useTexture(src);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = lowPower ? 1 : 8;

  // Seitenverhältnis aus der geladenen Grafik → Schildgröße.
  const { w, h } = useMemo(() => {
    const img = tex.image;
    const ratio = img && img.width && img.height ? img.width / img.height : 1;
    const maxKante = 1.0;
    return ratio >= 1 ? { w: maxKante, h: maxKante / ratio } : { w: maxKante * ratio, h: maxKante };
  }, [tex]);

  const schildMitte = 1.7; // Höhe der Schildmitte über Grund
  const unterkante = schildMitte - h / 2;

  return (
    <group>
      {/* Pfosten (verzinkter Stahl) */}
      <mesh position={[0, unterkante / 2, -0.01]} castShadow>
        <cylinderGeometry args={[0.028, 0.032, unterkante, 16]} />
        <meshStandardMaterial color={SCENE.postMetal} metalness={0.85} roughness={0.35} />
      </mesh>
      {/* Pfostenkappe */}
      <mesh position={[0, unterkante, -0.01]} castShadow>
        <cylinderGeometry args={[0.034, 0.034, 0.02, 16]} />
        <meshStandardMaterial color={SCENE.postMetal} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* Schild-Vorderseite: Textur mit Alpha (echte Silhouette) */}
      <mesh position={[0, schildMitte, 0.006]} castShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={tex}
          transparent
          alphaTest={0.5}
          side={THREE.FrontSide}
          metalness={0.0}
          roughness={0.42}
          envMapIntensity={1.1}
        />
      </mesh>

      {/* Schild-Rückseite: grau, gleiche Silhouette über alphaMap */}
      <mesh position={[0, schildMitte, -0.006]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          color={SCENE.signBack}
          alphaMap={tex}
          transparent
          alphaTest={0.5}
          side={THREE.FrontSide}
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}
