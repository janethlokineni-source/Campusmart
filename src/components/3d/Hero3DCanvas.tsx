'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// 3D Shopping Box with Ribbon
function ShoppingBox({ position, color, scale = 1, rotationSpeed = 0.5 }: { position: [number, number, number]; color: string; scale?: number; rotationSpeed?: number }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * rotationSpeed;
      meshRef.current.rotation.x += delta * 0.2 * rotationSpeed;
    }
  });

  return (
    <group ref={meshRef} position={position} scale={scale}>
      {/* Box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.3}
          envMapIntensity={1}
        />
      </mesh>
      {/* Ribbon Horizontal */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.22, 0.25, 1.22]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Ribbon Vertical */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.25, 1.22, 1.22]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Bow */}
      <mesh position={[0, 0.65, 0]}>
        <torusGeometry args={[0.22, 0.08, 16, 32]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

// 3D Campus Floating Bag
function CampusShoppingBag({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Bag Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.8, 0.7]} />
        <meshStandardMaterial
          color="#2563eb"
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 1.1, 0]}>
        <torusGeometry args={[0.4, 0.06, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
      </mesh>
      {/* Campus Star Emblem */}
      <mesh position={[0, 0.2, 0.36]}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 32]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

// 3D Floating Campus Headphones
function CampusHeadphones({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.z += delta * 0.15;
    }
  });

  return (
    <group ref={meshRef} position={position} scale={scale}>
      {/* Headband arch */}
      <mesh>
        <torusGeometry args={[0.8, 0.08, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Left Ear cup */}
      <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.2} />
      </mesh>
      {/* Right Ear cup */}
      <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

// 3D Floating Coins / Campus Stars
function FloatingCoin({ position, scale = 0.5 }: { position: [number, number, number]; scale?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
      <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

// Scene Root with mouse parallax
function SceneContent() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ mouse }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouse.x * 0.3, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouse.y * 0.2, 0.05);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Ambient and Key Lights */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
      <pointLight position={[-4, 3, -2]} color="#38bdf8" intensity={2} />
      <pointLight position={[4, -2, 2]} color="#f59e0b" intensity={2} />

      {/* Floating Elements */}
      <Float speed={2} rotationIntensity={0.8} floatIntensity={1.2}>
        <CampusShoppingBag position={[-1.6, 0.3, 0]} scale={1.1} />
      </Float>

      <Float speed={2.5} rotationIntensity={1} floatIntensity={1.5}>
        <ShoppingBox position={[1.8, 0.8, -0.5]} color="#10b981" scale={0.9} rotationSpeed={0.6} />
      </Float>

      <Float speed={1.8} rotationIntensity={0.7} floatIntensity={1.1}>
        <CampusHeadphones position={[0.6, -1.2, 0.5]} scale={0.9} />
      </Float>

      <Float speed={3} rotationIntensity={1.2} floatIntensity={1.8}>
        <ShoppingBox position={[-2.2, -1.3, -0.8]} color="#f19e63ff" scale={0.65} rotationSpeed={0.4} />
      </Float>

      <Float speed={2.2} rotationIntensity={1.5} floatIntensity={1}>
        <FloatingCoin position={[2.4, -0.5, 0.5]} scale={0.4} />
      </Float>

      <Float speed={2.8} rotationIntensity={1.5} floatIntensity={1.3}>
        <FloatingCoin position={[-0.8, 1.8, -0.2]} scale={0.35} />
      </Float>
    </group>
  );
}

export default function Hero3DCanvas() {
  const [hasMounted, setHasMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  if (!hasMounted) {
    return (
      <div className="w-full h-full min-h-[380px] lg:min-h-[460px] flex items-center justify-center bg-gradient-to-tr from-blue-900/20 to-indigo-900/10 rounded-2xl animate-pulse">
        <div className="w-20 h-20 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  // 2D Fallback for reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="w-full h-full min-h-[380px] lg:min-h-[460px] flex items-center justify-center bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-amber-500/10 rounded-2xl relative overflow-hidden p-8 border border-blue-500/20">
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-blue-600/20 text-blue-500">
            <svg className="w-16 h-16 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Campus Express Marketplace</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm">Everyday hostel essentials, tech gear, electronics, and books delivered to your room.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[380px] lg:min-h-[460px] relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/20 to-slate-900/40 backdrop-blur-md border border-white/10">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        className="w-full h-full"
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <SceneContent />
      </Canvas>

      {/* Floating 3D Badge */}
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-xs text-white/90 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Interactive 3D Stage &bull; Move mouse</span>
      </div>
    </div>
  );
}

