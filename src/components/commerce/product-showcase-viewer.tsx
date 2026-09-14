"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, animate } from "framer-motion";
import { type Product } from "@/lib/data";

interface ProductShowcaseViewerProps {
  product: Product;
}

// Deterministic particle properties to avoid Next.js hydration mismatch
const PARTICLE_SEEDS = Array.from({ length: 12 }, (_, i) => {
  const x = (i * 37 + 13) % 100;
  const y = (i * 29 + 7) % 100;
  const size = 1.5 + (i % 3) * 1.2; // 1.5 to 3.9 px
  const dur = 8 + (i % 4) * 4;     // 8 to 20 s
  const delay = -(i * 1.2);
  return { x, y, size, dur, delay };
});

export function ProductShowcaseViewer({ product }: ProductShowcaseViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Mouse tilt tracking
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs for tilt
  const springConfig = { stiffness: 90, damping: 22 };
  const mouseX = useSpring(x, springConfig);
  const mouseY = useSpring(y, springConfig);

  // Map mouse coordinate ratios to rotation degrees
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-12, 12]);

  // Sync floating Y offset and shadow properties using a single timeline value [0 -> 1]
  const floatProgress = useMotionValue(0);
  
  useEffect(() => {
    setMounted(true);
    if (prefersReducedMotion) return;

    const controls = animate(floatProgress, [0, 1], {
      duration: 5,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    });

    return () => controls.stop();
  }, [floatProgress, prefersReducedMotion]);

  // Derived properties from the float loop
  // At progress = 0 (highest position): product floats up by -12px, shadow shrinks & fades
  // At progress = 1 (lowest position): product floats down by +12px, shadow grows & darkens
  const floatY = useTransform(floatProgress, [0, 1], [-12, 12]);
  const shadowScale = useTransform(floatProgress, [0, 1], [0.85, 1.12]);
  const shadowOpacity = useTransform(floatProgress, [0, 1], [0.35, 0.75]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // Normalize values from -0.5 to 0.5
    x.set((cx / width) - 0.5);
    y.set((cy / height) - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  // SSR/Hydration Guard
  if (!mounted) {
    return (
      <div className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-zinc-950 sm:h-[560px] select-none">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,0.13),rgba(212,175,55,0.01)_50%,transparent_75%)] opacity-72" />
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full blur-md w-52 h-[14px] bg-black/60 opacity-60" />
        <div className="relative flex items-center justify-center p-4 max-w-[95%] max-h-[90%]">
          <img
            src={product.image}
            alt={product.name}
            className="max-h-[340px] sm:max-h-[460px] w-auto object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.65)]"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-zinc-950 sm:h-[560px] select-none"
      style={{
        perspective: 1200,
        WebkitPerspective: 1200,
      }}
    >
      {/* 1. Spotlight background (glow increases on hover) */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.02) 50%, transparent 75%)",
          opacity: isHovered ? 1.0 : 0.72,
        }}
      />

      {/* 2. Floating Gold Particles */}
      {!prefersReducedMotion && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {PARTICLE_SEEDS.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-gold/40"
              animate={{
                y: [-15, 15],
                x: [-10, 10],
                opacity: [0.18, 0.45, 0.18],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                willChange: "transform",
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Outer Interactive Wrapper (Applies mouse tilts) */}
      <motion.div
        className="relative z-10 flex h-full w-full items-center justify-center flex-col"
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* 4. Shadow Layer (Moves and fades inversely with the float state) */}
        <motion.div
          aria-hidden="true"
          className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full blur-md"
          style={{
            width: "min(280px, 55%)",
            height: "14px",
            background: "radial-gradient(ellipse, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 80%)",
            scale: prefersReducedMotion ? 1 : shadowScale,
            opacity: prefersReducedMotion ? 0.6 : shadowOpacity,
            transformStyle: "flat",
            zIndex: 1,
          }}
        />

        {/* 5. Product Image Layer (Floats and scales up on hover) */}
        <motion.div
          className="relative flex items-center justify-center p-4 max-w-[95%] max-h-[90%]"
          style={{
            y: prefersReducedMotion ? 0 : floatY,
            transformStyle: "preserve-3d",
            zIndex: 2,
          }}
          animate={{
            scale: isHovered ? 1.08 : 1.0,
          }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 18,
          }}
        >
          {/* Subtle backplate lighting aura directly behind product image */}
          <motion.div
            className="absolute rounded-full bg-gold/10 blur-2xl pointer-events-none"
            animate={{
              scale: isHovered ? 1.25 : 0.95,
              opacity: isHovered ? 0.85 : 0.55,
            }}
            style={{
              width: "220px",
              height: "220px",
              transform: "translateZ(-10px)",
            }}
          />

          <img
            src={product.image}
            alt={product.name}
            className="max-h-[340px] sm:max-h-[460px] w-auto object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.65)]"
            style={{
              transform: "translateZ(30px)", // creates 3D popping effect against shadows
            }}
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
