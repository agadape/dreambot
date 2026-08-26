"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function AnimatedMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[4, 1.2, 256, 64]} />
        <MeshDistortMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={0.5}
          wireframe={true}
          roughness={0.2}
          metalness={0.8}
          distort={0.4}
          speed={3}
          transparent={true}
          opacity={0.8}
        />
      </mesh>
    </Float>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 z-0 flex items-center justify-center">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <ambientLight intensity={2} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <AnimatedMesh />
      </Canvas>
    </div>
  );
}

