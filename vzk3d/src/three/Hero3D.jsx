import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { assetUrl } from "../utils/assetPath.js";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion.js";

// Markante, sicher vorhandene Zeichen – als schwebende Tafeln in der Tiefe.
// Komposition nach rechts gewichtet, damit links Platz für Headline/CTA bleibt.
const HERO_SIGNS = [
  { bild: "zeichen/123.png", pos: [0.7, 1.15, -0.6], size: 1.1, speed: 0.65 },
  { bild: "zeichen/206.png", pos: [2.1, 0.75, -1.4], size: 1.35, speed: 0.55 },
  { bild: "zeichen/274-50.png", pos: [0.5, 0.15, -0.4], size: 1.05, speed: 0.7 },
  { bild: "zeichen/267.png", pos: [1.5, -0.9, 0.2], size: 1.0, speed: 0.85 },
  { bild: "zeichen/306.png", pos: [2.6, -0.4, -0.6], size: 1.0, speed: 0.8 },
  { bild: "zeichen/101.png", pos: [3.0, 1.2, -1.8], size: 1.25, speed: 0.5 },
];

function FloatingSign({ bild, pos, size, speed, reduced }) {
  const ref = useRef();
  const tex = useTexture(assetUrl(bild));
  tex.colorSpace = THREE.SRGBColorSpace;

  const { w, h } = useMemo(() => {
    const img = tex.image;
    const r = img && img.width && img.height ? img.width / img.height : 1;
    return r >= 1 ? { w: size, h: size / r } : { w: size * r, h: size };
  }, [tex, size]);

  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!ref.current || reduced) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = pos[1] + Math.sin(t * speed + phase) * 0.12;
    ref.current.rotation.z = Math.sin(t * speed * 0.5 + phase) * 0.04;
  });

  return (
    <mesh ref={ref} position={pos}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} transparent alphaTest={0.5} roughness={0.5} metalness={0} />
    </mesh>
  );
}

function ParallaxRig({ children, reduced }) {
  const group = useRef();
  const { pointer } = useThree();
  useFrame(() => {
    if (!group.current || reduced) return;
    // sanfte Annäherung an die Zeigerposition (kein useState → 60 fps)
    group.current.rotation.y += (pointer.x * 0.25 - group.current.rotation.y) * 0.05;
    group.current.rotation.x += (-pointer.y * 0.18 - group.current.rotation.x) * 0.05;
  });
  return <group ref={group}>{children}</group>;
}

export function Hero3D() {
  const reduced = usePrefersReducedMotion();
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <hemisphereLight intensity={0.7} groundColor="#1a1f27" color="#e8eefb" />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-4, -2, 2]} intensity={0.3} color="#ffb066" />
      <Suspense fallback={null}>
        <ParallaxRig reduced={reduced}>
          {HERO_SIGNS.map((s) => (
            <FloatingSign key={s.bild} {...s} reduced={reduced} />
          ))}
        </ParallaxRig>
      </Suspense>
    </Canvas>
  );
}

export default Hero3D;
