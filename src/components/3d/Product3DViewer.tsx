'use client';

import React, { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Model3dType } from '@/types';
import { RotateCw, Eye, RefreshCw, Sun, Box, ArrowLeft } from 'lucide-react';

interface Product3DViewerProps {
  modelType?: Model3dType;
  modelUrl?: string;
  productName: string;
  onCloseViewer?: () => void;
}

// GLB loader wrapper
function GLBModel({ url, wireframe }: { url: string; wireframe: boolean }) {
  const { scene } = useGLTF(url);
  const cloned = React.useMemo(() => scene.clone(), [scene]);

  React.useEffect(() => {
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m: any) => {
            if ('wireframe' in m) m.wireframe = wireframe;
          });
        } else if (mesh.material && 'wireframe' in mesh.material) {
          (mesh.material as any).wireframe = wireframe;
        }
      }
    });
  }, [cloned, wireframe]);

  return <primitive object={cloned} scale={1.5} position={[0, -0.5, 0]} />;
}

// 1. Procedural 3D Headphones
function HeadphonesModel({ wireframe }: { wireframe: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={group} scale={1.2}>
      {/* Headband arch */}
      <mesh>
        <torusGeometry args={[1, 0.12, 16, 64, Math.PI]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.4}
          metalness={0.2}
          wireframe={wireframe}
        />
      </mesh>
      {/* Headband Cushion */}
      <mesh position={[0, 0.95, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.9, 0.08, 16, 32, Math.PI * 0.6]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.9}
          wireframe={wireframe}
        />
      </mesh>
      {/* Left Outer Cup */}
      <mesh position={[-1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.25, 32]} />
        <meshStandardMaterial
          color="#2563eb"
          metalness={0.8}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>
      {/* Left Soft Ear Pad */}
      <mesh position={[-0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.35, 0.1, 16, 32]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.8}
          wireframe={wireframe}
        />
      </mesh>
      {/* Right Outer Cup */}
      <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.25, 32]} />
        <meshStandardMaterial
          color="#2563eb"
          metalness={0.8}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>
      {/* Right Soft Ear Pad */}
      <mesh position={[0.85, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.35, 0.1, 16, 32]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.8}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

// 2. Procedural 3D Laptop
function LaptopModel({ wireframe }: { wireframe: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={group} scale={1.1} position={[0, -0.3, 0]}>
      {/* Base Chassis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.2, 0.08, 1.5]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.8}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>
      {/* Keyboard Bed */}
      <mesh position={[0, 0.05, 0.1]}>
        <boxGeometry args={[1.9, 0.02, 0.8]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.5}
          wireframe={wireframe}
        />
      </mesh>
      {/* Trackpad */}
      <mesh position={[0, 0.05, 0.6]}>
        <boxGeometry args={[0.7, 0.01, 0.4]} />
        <meshStandardMaterial
          color="#64748b"
          metalness={0.5}
          roughness={0.3}
          wireframe={wireframe}
        />
      </mesh>
      {/* Open Screen Hinge at z = -0.75, tilted backward 110 deg */}
      <group position={[0, 0.04, -0.75]} rotation={[-Math.PI / 3, 0, 0]}>
        {/* Screen Bezel */}
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[2.2, 1.4, 0.06]} />
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.7}
            roughness={0.3}
            wireframe={wireframe}
          />
        </mesh>
        {/* Glowing Display */}
        <mesh position={[0, 0.75, 0.035]}>
          <planeGeometry args={[2.0, 1.2]} />
          <meshStandardMaterial
            color="#2563eb"
            emissive="#1d4ed8"
            emissiveIntensity={0.6}
            wireframe={wireframe}
          />
        </mesh>
      </group>
    </group>
  );
}

// 3. Procedural 3D Thermal Bottle
function BottleModel({ wireframe }: { wireframe: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group ref={group} scale={1.1} position={[0, -0.6, 0]}>
      {/* Main Cylinder Body */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 1.6, 32]} />
        <meshStandardMaterial
          color="#059669"
          metalness={0.7}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>
      {/* Shoulder Taper */}
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.25, 0.45, 0.25, 32]} />
        <meshStandardMaterial
          color="#047857"
          metalness={0.7}
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>
      {/* Metallic Cap */}
      <mesh position={[0, 1.95, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.3, 32]} />
        <meshStandardMaterial
          color="#f1f5f9"
          metalness={0.9}
          roughness={0.1}
          wireframe={wireframe}
        />
      </mesh>
      {/* Loop Ring Handle */}
      <mesh position={[0, 2.15, 0]}>
        <torusGeometry args={[0.15, 0.04, 16, 32]} />
        <meshStandardMaterial
          color="#047857"
          roughness={0.4}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

// 4. Procedural 3D Backpack
function BackpackModel({ wireframe }: { wireframe: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={group} scale={1.1} position={[0, -0.5, 0]}>
      {/* Main compartment */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.2, 1.6, 0.7]} />
        <meshStandardMaterial
          color="#1e3a8a"
          roughness={0.8}
          wireframe={wireframe}
        />
      </mesh>
      {/* Front pocket */}
      <mesh position={[0, 0.5, 0.45]}>
        <boxGeometry args={[0.9, 0.8, 0.3]} />
        <meshStandardMaterial
          color="#f59e0b"
          roughness={0.6}
          wireframe={wireframe}
        />
      </mesh>
      {/* Top grab handle */}
      <mesh position={[0, 1.7, 0]}>
        <torusGeometry args={[0.25, 0.05, 16, 32, Math.PI]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.5}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

// 5. Procedural 3D Coffee Cup
function CupModel({ wireframe }: { wireframe: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={group} scale={1.3} position={[0, -0.4, 0]}>
      {/* Mug Body */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.4, 1.0, 32]} />
        <meshStandardMaterial
          color="#ea580c"
          roughness={0.2}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>
      {/* Hot Coffee Liquid inside */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.05, 32]} />
        <meshStandardMaterial
          color="#3e2723"
          roughness={0.1}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>
      {/* Mug Handle */}
      <mesh position={[0.55, 0.5, 0]}>
        <torusGeometry args={[0.3, 0.08, 16, 32]} />
        <meshStandardMaterial
          color="#ea580c"
          roughness={0.2}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

// 6. Procedural 3D Floating Jacket / Space Hoodie
function JacketModel({ wireframe }: { wireframe: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.25;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }
  });

  return (
    <group ref={group} scale={1.1} position={[0, -0.2, 0]}>
      {/* Torso Jacket Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.65, 1.3, 32]} />
        <meshStandardMaterial
          color="#1e1b4b"
          roughness={0.4}
          metalness={0.3}
          wireframe={wireframe}
        />
      </mesh>

      {/* Cyber Neon Accent Panel on Chest */}
      <mesh position={[0, 0.2, 0.53]}>
        <boxGeometry args={[0.35, 0.5, 0.05]} />
        <meshStandardMaterial
          color="#8b5cf6"
          roughness={0.2}
          metalness={0.6}
          emissive="#6d28d9"
          emissiveIntensity={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Center Cyber Zipper Line */}
      <mesh position={[0, 0, 0.58]}>
        <boxGeometry args={[0.04, 1.28, 0.03]} />
        <meshStandardMaterial
          color="#06b6d4"
          metalness={0.9}
          roughness={0.1}
          emissive="#0891b2"
          emissiveIntensity={0.3}
          wireframe={wireframe}
        />
      </mesh>

      {/* Hood / Padded Collar */}
      <mesh position={[0, 0.72, -0.05]} rotation={[Math.PI / 6, 0, 0]}>
        <torusGeometry args={[0.42, 0.16, 16, 32, Math.PI * 1.2]} />
        <meshStandardMaterial
          color="#312e81"
          roughness={0.5}
          metalness={0.2}
          wireframe={wireframe}
        />
      </mesh>

      {/* Left Sleeve */}
      <group position={[-0.75, 0.15, 0]} rotation={[0, 0, Math.PI / 6]}>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.22, 0.18, 0.9, 24]} />
          <meshStandardMaterial
            color="#1e1b4b"
            roughness={0.4}
            metalness={0.3}
            wireframe={wireframe}
          />
        </mesh>
        <mesh position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
          <meshStandardMaterial
            color="#06b6d4"
            roughness={0.3}
            metalness={0.5}
            wireframe={wireframe}
          />
        </mesh>
      </group>

      {/* Right Sleeve */}
      <group position={[0.75, 0.15, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.22, 0.18, 0.9, 24]} />
          <meshStandardMaterial
            color="#1e1b4b"
            roughness={0.4}
            metalness={0.3}
            wireframe={wireframe}
          />
        </mesh>
        <mesh position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.12, 24]} />
          <meshStandardMaterial
            color="#06b6d4"
            roughness={0.3}
            metalness={0.5}
            wireframe={wireframe}
          />
        </mesh>
      </group>

      {/* Floating Holographic Ring around Waist */}
      <mesh position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.03, 16, 64]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

export default function Product3DViewer({
  modelType = 'procedural-headphones',
  modelUrl,
  productName,
  onCloseViewer,
}: Product3DViewerProps) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'dramatic' | 'warm'>('studio');
  const controlsRef = useRef<any>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const renderActiveModel = () => {
    if (modelUrl && modelUrl.endsWith('.glb')) {
      return <GLBModel url={modelUrl} wireframe={wireframe} />;
    }

    switch (modelType) {
      case 'procedural-laptop':
        return <LaptopModel wireframe={wireframe} />;
      case 'procedural-bottle':
        return <BottleModel wireframe={wireframe} />;
      case 'procedural-backpack':
        return <BackpackModel wireframe={wireframe} />;
      case 'procedural-cup':
        return <CupModel wireframe={wireframe} />;
      case 'procedural-jacket':
        return <JacketModel wireframe={wireframe} />;
      case 'procedural-headphones':
      default:
        return <HeadphonesModel wireframe={wireframe} />;
    }
  };

  return (
    <div className="relative w-full h-[380px] md:h-[460px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl flex flex-col">
      {/* Top Overlay Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {onCloseViewer && (
            <button
              onClick={onCloseViewer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-md border border-white/10 transition shadow-sm"
              title="Return to image photos"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Photos</span>
            </button>
          )}
          <span className="px-2.5 py-1 rounded-md bg-blue-600/80 text-white text-[11px] font-semibold tracking-wide backdrop-blur-md">
            Interactive 3D View
          </span>
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg text-xs backdrop-blur-md border transition ${
              autoRotate
                ? 'bg-blue-600 text-white border-blue-400'
                : 'bg-black/60 text-gray-300 border-white/10 hover:bg-black/80'
            }`}
            title="Toggle 360 Auto-Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-2 rounded-lg text-xs backdrop-blur-md border transition ${
              wireframe
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-black/60 text-gray-300 border-white/10 hover:bg-black/80'
            }`}
            title="Toggle Wireframe Mesh"
          >
            <Box className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              setLightingPreset(
                lightingPreset === 'studio' ? 'warm' : lightingPreset === 'warm' ? 'dramatic' : 'studio'
              )
            }
            className="p-2 rounded-lg text-xs bg-black/60 text-gray-300 border border-white/10 hover:bg-black/80 backdrop-blur-md transition"
            title={`Lighting: ${lightingPreset}`}
          >
            <Sun className="w-4 h-4" />
          </button>
          <button
            onClick={resetCamera}
            className="p-2 rounded-lg text-xs bg-black/60 text-gray-300 border border-white/10 hover:bg-black/80 backdrop-blur-md transition"
            title="Reset Camera View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full flex-1 cursor-grab active:cursor-grabbing">
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 3.5], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Lights based on preset */}
          {lightingPreset === 'studio' && (
            <>
              <ambientLight intensity={0.9} />
              <directionalLight position={[5, 8, 5]} intensity={1.5} />
              <directionalLight position={[-5, -4, -3]} intensity={0.5} />
            </>
          )}
          {lightingPreset === 'warm' && (
            <>
              <ambientLight intensity={0.6} />
              <pointLight position={[4, 5, 4]} color="#fbbf24" intensity={2.5} />
              <pointLight position={[-4, 2, -3]} color="#f97316" intensity={1.8} />
            </>
          )}
          {lightingPreset === 'dramatic' && (
            <>
              <ambientLight intensity={0.2} />
              <spotLight position={[0, 6, 4]} intensity={3} angle={0.5} penumbra={1} color="#38bdf8" />
              <pointLight position={[-4, -2, -2]} color="#818cf8" intensity={1.5} />
            </>
          )}

          <Suspense fallback={null}>
            {renderActiveModel()}
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            enableZoom={true}
            minDistance={1.8}
            maxDistance={6.0}
            maxPolarAngle={Math.PI / 1.7}
          />
        </Canvas>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-gray-400 pointer-events-none px-1">
        <span>Click and drag to rotate &bull; Scroll to zoom</span>
        <span className="hidden sm:inline">{productName}</span>
      </div>
    </div>
  );
}
