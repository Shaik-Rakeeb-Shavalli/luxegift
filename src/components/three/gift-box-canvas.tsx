"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, OrbitControls, Sparkles } from "@react-three/drei";
import { useRef, useSyncExternalStore } from "react";
import type { Group, Mesh } from "three";
import { Product } from "@/lib/data";
import { cn } from "@/lib/utils";

interface GiftBoxProps {
  open?: boolean;
  boxDesign?: string; // "obsidian" | "gold" | "velvet"
  wrappingStyle?: string; // "gold" | "crimson" | "midnight"
  items?: Product[];
  className?: string;
}

function GiftBox({ open = false, boxDesign = "obsidian", wrappingStyle = "gold", items = [] }: GiftBoxProps) {
  const boxGroupRef = useRef<Group>(null);
  const lidRef = useRef<Mesh>(null);

  // Materials & Colors based on custom configurations
  const boxColors = {
    obsidian: { color: "#0B0B0B", roughness: 0.15, metalness: 0.8 },
    gold: { color: "#D4AF37", roughness: 0.25, metalness: 0.7 },
    velvet: { color: "#F5F5F0", roughness: 0.75, metalness: 0.1 },
  };

  const ribbonColors = {
    gold: "#D4AF37",
    crimson: "#9B1C1C",
    midnight: "#1E293B",
  };

  const activeBox = boxColors[boxDesign as keyof typeof boxColors] || boxColors.obsidian;
  const activeRibbon = ribbonColors[wrappingStyle as keyof typeof ribbonColors] || ribbonColors.gold;

  useFrame((_, delta) => {
    // If closed, auto-rotate slowly to show off 3D box
    if (!open && boxGroupRef.current) {
      boxGroupRef.current.rotation.y += delta * 0.18;
    }

    // Animate Lid opening and sliding off
    if (lidRef.current) {
      const targetY = open ? 1.6 : 0.72;
      const targetX = open ? -0.6 : 0;
      const targetRotZ = open ? 0.35 : 0;

      lidRef.current.position.y += (targetY - lidRef.current.position.y) * 0.08;
      lidRef.current.position.x += (targetX - lidRef.current.position.x) * 0.08;
      lidRef.current.rotation.z += (targetRotZ - lidRef.current.rotation.z) * 0.08;
    }
  });

  return (
    <group ref={boxGroupRef}>
      {/* Box Base */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[2.4, 1.35, 2.4]} />
        <meshStandardMaterial
          color={activeBox.color}
          roughness={activeBox.roughness}
          metalness={activeBox.metalness}
        />
      </mesh>

      {/* Decorative Ribbon Wraps around the base */}
      <mesh position={[0, -0.24, 0]}>
        <boxGeometry args={[2.42, 1.37, 0.18]} />
        <meshStandardMaterial color={activeRibbon} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.24, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.42, 1.37, 0.18]} />
        <meshStandardMaterial color={activeRibbon} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Products rendering inside the box when open */}
      {open &&
        items.map((item, index) => {
          // Circular arrangement of custom items
          const angle = (index / items.length) * Math.PI * 2;
          const radius = items.length > 1 ? 0.58 : 0;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;

          return (
            <mesh key={item.id} position={[x, -0.05, z]} rotation={[0.1, angle, 0.05]}>
              {index % 3 === 0 ? (
                <cylinderGeometry args={[0.22, 0.22, 0.5, 16]} />
              ) : index % 3 === 1 ? (
                <boxGeometry args={[0.3, 0.45, 0.3]} />
              ) : (
                <sphereGeometry args={[0.25, 16, 16]} />
              )}
              <meshStandardMaterial
                color={item.color || "#D4AF37"}
                metalness={0.5}
                roughness={0.3}
              />
            </mesh>
          );
        })}

      {/* Lid (Slides off when open) */}
      <group ref={lidRef} position={[0, 0.72, 0]}>
        {/* Lid Top */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.55, 0.2, 2.55]} />
          <meshStandardMaterial
            color={activeBox.color}
            roughness={activeBox.roughness}
            metalness={activeBox.metalness}
          />
        </mesh>

        {/* Ribbon Wraps on Lid */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[2.57, 0.22, 0.2]} />
          <meshStandardMaterial color={activeRibbon} metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.01, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[2.57, 0.22, 0.2]} />
          <meshStandardMaterial color={activeRibbon} metalness={0.7} roughness={0.2} />
        </mesh>

        {/* Elegant Ribbon Bow Ribbon */}
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 4, 0, 0]}>
          <torusGeometry args={[0.26, 0.06, 8, 24]} />
          <meshStandardMaterial color={activeRibbon} metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 4, Math.PI / 2, 0]}>
          <torusGeometry args={[0.26, 0.06, 8, 24]} />
          <meshStandardMaterial color={activeRibbon} metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

export function GiftBoxCanvas({
  open = false,
  boxDesign = "obsidian",
  wrappingStyle = "gold",
  items = [],
  className,
}: GiftBoxProps) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <div className={cn("flex h-[420px] w-full items-center justify-center rounded-lg border border-white/10 bg-zinc-950 sm:h-[560px]", className)}>
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-3 text-xs text-white/54">Assembling 3D Atelier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative h-[420px] w-full overflow-hidden rounded-lg border border-white/10 bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.14),rgba(255,255,255,0.02)_50%,transparent)] sm:h-[560px]", className)}>
      <Canvas camera={{ position: [3.8, 2.8, 4.6], fov: 42 }} dpr={[1, 1.6]}>
        <ambientLight intensity={0.76} />
        <spotLight position={[5, 8, 4]} intensity={60} angle={0.3} penumbra={0.7} castShadow />
        <directionalLight position={[-4, 5, -2]} intensity={1.5} />
        <Float speed={open ? 0.4 : 1.2} rotationIntensity={open ? 0.08 : 0.4} floatIntensity={0.2}>
          <GiftBox open={open} boxDesign={boxDesign} wrappingStyle={wrappingStyle} items={items} />
        </Float>
        <Sparkles count={open ? 64 : 32} scale={4.5} color="#d4af37" size={2.5} speed={0.4} />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} enablePan={false} minDistance={3.5} maxDistance={6} />
      </Canvas>

      <div className="pointer-events-none absolute bottom-4 left-4 flex gap-2 rounded-md bg-black/60 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/60 backdrop-blur-md">
        <span>Click and drag to rotate</span>
      </div>
    </div>
  );
}
