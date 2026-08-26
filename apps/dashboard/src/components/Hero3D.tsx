"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function AnimatedMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[10, 3, 256, 64]} />
        <MeshDistortMaterial
          color="#10b981"
          wireframe={true}
          roughness={0.1}
          metalness={1}
          distort={0.4}
          speed={2}
          transparent={true}
          opacity={0.15}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none opacity-80 h-[400px] w-full flex items-center justify-center translate-y-[-50px]">
      <Canvas camera={{ position: [0, 0, 30], fov: 45 }}>
        <ambientLight intensity={1} />
        <AnimatedMesh />
      </Canvas>
    </div>
  );
}

