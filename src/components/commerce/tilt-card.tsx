"use client";

import { useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Max tilt angle in degrees (default: 8) */
  maxTilt?: number;
  /** Show gold shine sweep on hover (default: true) */
  shine?: boolean;
}

export function TiltCard({ children, className, maxTilt = 8, shine = true }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 });

  const rawRotateX = useSpring(0, { damping: 20, stiffness: 200 });
  const rawRotateY = useSpring(0, { damping: 20, stiffness: 200 });
  const scale = useSpring(1, { damping: 20, stiffness: 250 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 → 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    rawRotateY.set(nx * maxTilt * 2);
    rawRotateX.set(-ny * maxTilt * 2);
    // Shine position as percentage
    setShinePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseEnter = () => {
    setHovering(true);
    scale.set(1.025);
  };

  const handleMouseLeave = () => {
    setHovering(false);
    rawRotateX.set(0);
    rawRotateY.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rawRotateX,
        rotateY: rawRotateY,
        scale,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
      }}
    >
      {children}

      {/* Gold shine sweep overlay */}
      {shine && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-500"
          style={{
            opacity: hovering ? 1 : 0,
            background: `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, rgba(212,175,55,0.13) 0%, transparent 55%)`,
          }}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
}
