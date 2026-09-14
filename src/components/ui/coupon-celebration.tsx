"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Tag, Gift, PartyPopper, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface CouponCelebrationProps {
  couponCode: string;
  discount: number;
  onRemove: () => void;
  triggerBurst?: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  color: string;
  type: "ribbon" | "sparkle" | "star" | "dot";
  speedX: number;
  speedY: number;
}

const GOLD_PALETTE = [
  "#D4AF37", // Gold
  "#F5D061", // Bright Gold
  "#FFF8DC", // Cornsilk White-Gold
  "#FFD700", // Yellow Gold
  "#DAA520", // Goldenrod
  "#FFFFFF", // Pure White
];

export function CouponCelebration({
  couponCode,
  discount,
  onRemove,
  triggerBurst = false,
}: CouponCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isCelebrated, setIsCelebrated] = useState(false);

  // Trigger particle burst animation on apply or when triggerBurst changes
  useEffect(() => {
    setIsCelebrated(true);

    const newParticles: Particle[] = Array.from({ length: 36 }).map((_, i) => {
      const angle = (i / 36) * Math.PI * 2;
      const speed = Math.random() * 80 + 40;
      return {
        id: i,
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 20,
        size: Math.random() * 10 + 6,
        rotation: Math.random() * 360,
        color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
        type: i % 4 === 0 ? "ribbon" : i % 3 === 0 ? "star" : i % 2 === 0 ? "sparkle" : "dot",
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed - 50,
      };
    });

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
    }, 3200);

    return () => clearTimeout(timer);
  }, [couponCode, triggerBurst]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gold/40 bg-gradient-to-r from-[#1b170c] via-[#241e10] to-[#1b170c] p-3.5 shadow-[0_0_30px_rgba(212,175,55,0.25)] transition-all duration-300">
      {/* Top Hairline Shimmer Line */}
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />

      {/* Floating Sparkles & Gold Ribbons Canvas Explosion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                opacity: 1,
                x: `calc(50% + ${p.x}px)`,
                y: `calc(50% + ${p.y}px)`,
                scale: 0.2,
                rotate: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                x: `calc(50% + ${p.x + p.speedX}px)`,
                y: `calc(50% + ${p.y + p.speedY}px)`,
                scale: [0.4, 1.2, 0.8],
                rotate: p.rotation + 360,
              }}
              transition={{ duration: 2.8, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              {p.type === "ribbon" ? (
                // Ribbon strip particle
                <svg
                  width={p.size * 1.5}
                  height={p.size * 0.6}
                  viewBox="0 0 24 10"
                  fill={p.color}
                  className="drop-shadow-[0_0_6px_rgba(212,175,55,0.8)]"
                >
                  <path d="M0 2 C 6 0, 12 10, 18 2 L 24 6 C 18 10, 12 2, 6 8 Z" />
                </svg>
              ) : p.type === "star" ? (
                // Star particle
                <span style={{ color: p.color, fontSize: `${p.size}px` }} className="leading-none drop-shadow-[0_0_8px_rgba(212,175,55,0.9)]">
                  ✦
                </span>
              ) : p.type === "sparkle" ? (
                <Sparkles style={{ color: p.color, width: `${p.size}px`, height: `${p.size}px` }} className="drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]" />
              ) : (
                // Gold dot
                <span
                  style={{
                    backgroundColor: p.color,
                    width: `${p.size * 0.7}px`,
                    height: `${p.size * 0.7}px`,
                  }}
                  className="block rounded-full shadow-[0_0_6px_rgba(212,175,55,0.8)]"
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Banner Content */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.6, repeat: isCelebrated ? 1 : 0 }}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/40 shadow-[0_0_12px_rgba(212,175,55,0.4)]"
          >
            <PartyPopper className="size-4 text-gold" />
          </motion.div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                <Tag className="size-3 text-gold" />
                {couponCode} APPLIED
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-black text-gold border border-gold/30">
                <CheckCircle2 className="size-2.5" /> 10% OFF
              </span>
            </div>
            <p className="text-[11px] font-semibold text-white/90 mt-0.5 flex items-center gap-1">
              You Saved: <span className="text-gold font-extrabold text-xs tracking-wide">-{formatPrice(discount)}</span>
              <Sparkles className="size-3 text-gold inline animate-pulse" />
            </p>
          </div>
        </div>

        {/* Remove Coupon Action */}
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-2 py-1 text-[11px] font-semibold text-white/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition cursor-pointer"
        >
          Remove
        </button>
      </div>

      {/* Celebration Saved Pill Banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-2.5 flex items-center justify-center gap-2 rounded-lg bg-gold/15 py-1.5 px-3 border border-gold/30 text-[11px] font-bold text-gold tracking-wider uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
      >
        <Sparkles className="size-3.5 text-gold animate-spin" style={{ animationDuration: "6s" }} />
        <span>🎉 Instant Savings Applied: -{formatPrice(discount)}</span>
        <Gift className="size-3.5 text-gold" />
      </motion.div>
    </div>
  );
}
