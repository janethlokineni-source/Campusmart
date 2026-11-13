'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080808);
    scene.fog = new THREE.FogExp2(0x080808, 0.05);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Fiery Orange & Gold Gradient Lighting
    const ambientLight = new THREE.AmbientLight(0x2a0d04, 1.8);
    scene.add(ambientLight);

    const mainLight = new THREE.PointLight(0xff6a00, 4.0, 30);
    mainLight.position.set(6, 6, 8);
    scene.add(mainLight);

    const fillLight = new THREE.PointLight(0xff2d16, 3.5, 30);
    fillLight.position.set(-6, -4, 6);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffa040, 2.8, 25);
    rimLight.position.set(0, 8, -4);
    scene.add(rimLight);

    const softAmberLight = new THREE.PointLight(0xfbbf24, 1.2, 20);
    softAmberLight.position.set(-8, 5, 2);
    scene.add(softAmberLight);

    // 3. Flowing 3D Silk Ribbons (3 Layers for deep organic depth)
    const silkMaterialPrimary = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xff6a00),
      emissive: new THREE.Color(0x401402),
      emissiveIntensity: 0.35,
      roughness: 0.22,
      metalness: 0.15,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      transmission: 0.45,
      ior: 1.45,
      thickness: 1.5,
      specularIntensity: 2.0,
      specularColor: new THREE.Color(0xffedd5),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });

    const silkMaterialSecondary = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xff2d16),
      emissive: new THREE.Color(0x380500),
      emissiveIntensity: 0.25,
      roughness: 0.3,
      metalness: 0.2,
      clearcoat: 0.8,
      transmission: 0.55,
      ior: 1.4,
      thickness: 1.2,
      specularIntensity: 1.5,
      specularColor: new THREE.Color(0xfeb272),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.82,
    });

    // Mesh 1: Large sweeping diagonal liquid silk wave
    const geo1 = new THREE.PlaneGeometry(24, 16, 80, 80);
    const mesh1 = new THREE.Mesh(geo1, silkMaterialPrimary);
    mesh1.rotation.x = -Math.PI / 4;
    mesh1.rotation.z = Math.PI / 7;
    mesh1.position.set(-2, 0, -1);
    scene.add(mesh1);

    // Mesh 2: Upper right floating translucent ribbon
    const geo2 = new THREE.PlaneGeometry(20, 12, 60, 60);
    const mesh2 = new THREE.Mesh(geo2, silkMaterialSecondary);
    mesh2.rotation.x = -Math.PI / 3;
    mesh2.rotation.z = -Math.PI / 5;
    mesh2.position.set(4, 3, -4);
    scene.add(mesh2);

    // Mesh 3: Foreground liquid curve accent
    const geo3 = new THREE.PlaneGeometry(18, 10, 50, 50);
    const mesh3 = new THREE.Mesh(geo3, silkMaterialPrimary);
    mesh3.rotation.x = Math.PI / 5;
    mesh3.rotation.z = Math.PI / 4;
    mesh3.position.set(-3, -4, 2);
    scene.add(mesh3);

    // Store original positions for harmonic vertex displacement
    const originalPos1 = geo1.attributes.position.clone();
    const originalPos2 = geo2.attributes.position.clone();
    const originalPos3 = geo3.attributes.position.clone();

    // 4. Subtle Purple Luminous Particles
    const particleCount = 140;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 26;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 14;
      particleSpeeds[i] = 0.002 + Math.random() * 0.005;
    }

    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc084fc,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 5. Mouse Parallax Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (e.clientX - windowHalfX) / windowHalfX;
      mouseY = (e.clientY - windowHalfY) / windowHalfY;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 6. Responsive Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // 7. Animation Loop with Organic Multi-Octave Silk Dynamics
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const t = elapsedTime * 0.45;

      // Displace Mesh 1 vertices (Primary large wave)
      const pos1 = geo1.attributes.position;
      const orig1 = originalPos1;
      for (let i = 0; i < pos1.count; i++) {
        const u = orig1.getX(i);
        const v = orig1.getY(i);
        const z =
          Math.sin(u * 0.45 + t) * 1.35 +
          Math.cos(v * 0.35 + t * 0.8) * 1.1 +
          Math.sin((u + v) * 0.25 + t * 1.1) * 0.6;
        pos1.setZ(i, z);
      }
      pos1.needsUpdate = true;
      geo1.computeVertexNormals();

      // Displace Mesh 2 vertices (Upper secondary wave)
      const pos2 = geo2.attributes.position;
      const orig2 = originalPos2;
      for (let i = 0; i < pos2.count; i++) {
        const u = orig2.getX(i);
        const v = orig2.getY(i);
        const z =
          Math.cos(u * 0.4 - t * 0.9) * 1.1 +
          Math.sin(v * 0.5 + t * 0.7) * 0.95;
        pos2.setZ(i, z);
      }
      pos2.needsUpdate = true;
      geo2.computeVertexNormals();

      // Displace Mesh 3 vertices (Foreground accent curve)
      const pos3 = geo3.attributes.position;
      const orig3 = originalPos3;
      for (let i = 0; i < pos3.count; i++) {
        const u = orig3.getX(i);
        const v = orig3.getY(i);
        const z =
          Math.sin(u * 0.55 + t * 1.1) * 0.85 +
          Math.cos((u - v) * 0.4 + t * 0.75) * 0.7;
        pos3.setZ(i, z);
      }
      pos3.needsUpdate = true;
      geo3.computeVertexNormals();

      // Subtle slow continuous rotation of meshes
      mesh1.rotation.z = Math.PI / 7 + Math.sin(t * 0.25) * 0.05;
      mesh2.rotation.z = -Math.PI / 5 + Math.cos(t * 0.2) * 0.04;
      mesh3.rotation.z = Math.PI / 4 + Math.sin(t * 0.3) * 0.06;

      // Animate floating particles
      const pPositions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3 + 1] += particleSpeeds[i];
        if (pPositions[i * 3 + 1] > 9) {
          pPositions[i * 3 + 1] = -9;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // Smooth mouse parallax camera damping
      targetX = mouseX * 0.8;
      targetY = -mouseY * 0.6;
      camera.position.x += (targetX - camera.position.x) * 0.035;
      camera.position.y += (targetY - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);

      // Pulse main lights slightly for living silk highlights
      mainLight.intensity = 4.0 + Math.sin(t * 1.5) * 0.6;
      fillLight.intensity = 3.5 + Math.cos(t * 1.2) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      geo1.dispose();
      geo2.dispose();
      geo3.dispose();
      particleGeometry.dispose();
      silkMaterialPrimary.dispose();
      silkMaterialSecondary.dispose();
      particleMaterial.dispose();
      renderer.dispose();

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 bg-[#08000F]">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Atmospheric Soft Vignette and Neon Purple Edge Glow */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08000F] via-transparent to-[#08000F]/60 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#5200A5]/25 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-[#7C3AED]/20 rounded-full blur-[160px] pointer-events-none" />
    </div>
  );
}

