"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import type { Mesh } from "three";

function Blob() {
  const meshRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) {
      return;
    }

    meshRef.current.rotation.x = state.clock.elapsedTime * 0.11;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  return (
    <Float speed={0.82} rotationIntensity={0.8} floatIntensity={0.7}>
      <mesh ref={meshRef} scale={1.35}>
        <icosahedronGeometry args={[1, 12]} />
        <MeshDistortMaterial color="#ffb347" roughness={0.18} metalness={0.2} distort={0.28} speed={1.15} />
      </mesh>
    </Float>
  );
}

function ParticleRing() {
  const points = useMemo(() => {
    const coords: [number, number, number][] = [];

    for (let i = 0; i < 56; i += 1) {
      const radius = 1.95 + Math.random() * 0.45;
      const angle = (i / 56) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (Math.random() - 0.5) * 1.2;
      coords.push([x, y, z]);
    }

    return coords;
  }, []);

  return (
    <group>
      {points.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshStandardMaterial color="#9ff5ff" emissive="#4fd0e3" emissiveIntensity={0.18} />
        </mesh>
      ))}
    </group>
  );
}

export function ThreeConstellation() {
  return (
    <Canvas
      className="hero-canvas"
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%" }}
      camera={{ position: [0, 0, 4.5], fov: 48 }}
    >
      <ambientLight intensity={0.56} />
      <directionalLight position={[3, 3, 2]} intensity={0.95} color="#ffe0b6" />
      <pointLight position={[-3, -2, 2]} intensity={0.62} color="#78e0e5" />
      <Blob />
      <ParticleRing />
    </Canvas>
  );
}
