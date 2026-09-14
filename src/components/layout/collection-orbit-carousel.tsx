"use client";

/**
 * CollectionOrbitCarousel
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Premium luxury 3D coverflow carousel with elliptical orbit.
 *
 * Architecture:
 *  - GSAP ticker drives the continuous orbit (zero React re-renders).
 *  - DOM refs are mutated directly via gsap.set() for 60fps GPU-only
 *    transform3d updates.
 *  - Framer Motion handles hover lift / glow (declarative, correct
 *    React lifecycle, isolated from ticker).
 *  - Triple-buffered product list creates a seamless infinite loop.
 *  - All visual effects (particles, energy ring, spotlight) are pure
 *    CSS / inline SVG — no Three.js dependency.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useRef, useEffect, useCallback, useMemo, useState, memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ArrowRight, ShoppingBag, Star } from "lucide-react";
import { type Product } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/cart-context";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CollectionOrbitCarouselProps {
  products: Product[];
  /** Base angular velocity — degrees per second (default 18) */
  speed?: number;
  autoPlay?: boolean;
  pauseOnHover?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const RADIUS_X = 760; // horizontal orbit radius — wider spread so cards don't overlap
const RADIUS_Z = 300; // depth radius — more front-to-back separation
const CARD_W = 260;   // card base width (px)
const CARD_H = 420;   // card base height (px)
const PERSPECTIVE = 1400; // deeper perspective to accommodate wider radius

// Pre-compute per-slot visual weights (Gaussian bell — center = 1.0)
function computeSlotStyle(
  normZ: number // 0 = back, 1 = fully front
): { scale: number; opacity: number; rotateY: number; brightness: number } {
  const scale      = 0.45 + normZ * 0.55;      // 0.45 → 1.0
  const opacity    = 0.25 + normZ * 0.75;      // 0.25 → 1.0
  const rotateY    = (1 - normZ) * -60;        // 0 center, ±60° sides (sign flipped by x pos)
  const brightness = 0.45 + normZ * 0.55;      // CSS brightness filter
  return { scale, opacity, rotateY, brightness };
}

// ─── Floating Particle (memoised) ────────────────────────────────────────────

const Particle = memo(function Particle({
  style,
}: {
  style: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute rounded-full bg-gold/50"
      style={style}
    />
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────

export function CollectionOrbitCarousel({
  products,
  speed = 18,
  autoPlay = true,
  pauseOnHover = true,
}: CollectionOrbitCarouselProps) {
  const { addToCart } = useCart();

  // Triple-buffer for seamless infinite loop
  const tripled = useMemo(() => [...products, ...products, ...products], [products]);
  const N = tripled.length;

  // DOM refs
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef     = useRef<HTMLDivElement>(null);
  const cardRefs     = useRef<(HTMLDivElement | null)[]>([]);

  // Animation state (mutable refs — never cause re-renders)
  const angleRef   = useRef<number>(0);          // current orbit angle (radians)
  const pausedRef  = useRef<boolean>(!autoPlay);
  const hoveredRef = useRef<number | null>(null); // index of hovered card

  // React state — only for spotlight tracking
  const [mousePos, setMousePos] = useState({ x: 0.35, y: 0.15 });

  // ── Particle definitions (stable across renders, fully deterministic for SSR/CSR) ──
  const particles = useMemo(() => {
    const arr: React.CSSProperties[] = [];
    for (let i = 0; i < 45; i++) {
      // Deterministic pseudo-random generation using modular arithmetic with prime numbers
      const size    = 1.5 + ((i * 17 + 11) % 35) / 10; // 1.5 to 4.9 px
      const dur     = 4 + ((i * 23 + 7) % 100) / 10;   // 4 to 13.9 s
      const delay   = -(((i * 29 + 13) % 120) / 10);   // -11.9 to 0 s
      const left    = (i * 37 + 19) % 100;             // 0 to 99 %
      const top     = (i * 41 + 29) % 100;             // 0 to 99 %
      const opacity = 0.12 + ((i * 43 + 31) % 45) / 100; // 0.12 to 0.56

      arr.push({
        width:     `${size}px`,
        height:    `${size}px`,
        left:      `${left}%`,
        top:       `${top}%`,
        opacity:   opacity,
        animation: `orbitFloat ${dur}s ${delay}s ease-in-out infinite alternate`,
        willChange: "transform",
      });
    }
    return arr;
  }, []);

  // ── Core orbit tick ────────────────────────────────────────────────────────
  const tick = useCallback(
    (_time: number, delta: number) => {
      if (pausedRef.current) return;

      // Advance angle (radians per ms → degrees/s * π/180 / 1000)
      angleRef.current += (speed * Math.PI) / 180 / (1000 / delta);

      const totalAngle = (Math.PI * 2) / N; // angular step per card

      cardRefs.current.forEach((el, i) => {
        if (!el) return;

        // Angle for this card slot
        const a = angleRef.current + i * totalAngle;

        const sinA = Math.sin(a);
        const cosA = Math.cos(a);

        // Orbit position
        const x = RADIUS_X * sinA;
        const z = RADIUS_Z * cosA;

        // Normalize Z to [0,1] for style weights
        const normZ = (z + RADIUS_Z) / (2 * RADIUS_Z);
        const { scale, opacity, rotateY, brightness } = computeSlotStyle(normZ);

        // Flip rotateY sign based on which side of orbit
        const ry = sinA > 0 ? -rotateY : rotateY;

        // Apply via GSAP set — no layout, no paint, compositor only
        gsap.set(el, {
          x,
          z,
          rotateY: ry,
          scale: hoveredRef.current === i ? Math.min(scale * 1.08, 1.12) : scale,
          opacity,
          filter: `brightness(${brightness})`,
          zIndex: Math.round(normZ * 100),
          force3D: true,
        });

        // Gold center spotlight glow on frontmost card
        const glowEl = el.querySelector<HTMLElement>("[data-card-glow]");
        if (glowEl) {
          gsap.set(glowEl, { opacity: normZ > 0.85 ? normZ * 0.9 : 0 });
        }
      });

      // Seamless infinite loop: when we've gone one full revolution of the
      // original set, reset angle by exactly one product-slot increment.
      const resetThreshold = (Math.PI * 2 * products.length) / N;
      if (angleRef.current >= resetThreshold) {
        angleRef.current -= resetThreshold;
      }
    },
    [N, speed, products.length]
  );

  // ── GSAP ticker lifecycle ─────────────────────────────────────────────────
  useEffect(() => {
    gsap.ticker.lagSmoothing(0); // prevent jumps after tab-blur
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [tick]);

  // ── Hover handlers ─────────────────────────────────────────────────────────
  const handleMouseEnter = useCallback(
    (i: number) => {
      hoveredRef.current = i;
      if (pauseOnHover) pausedRef.current = true;
    },
    [pauseOnHover]
  );

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    if (pauseOnHover && autoPlay) pausedRef.current = false;
  }, [pauseOnHover, autoPlay]);

  // ── Spotlight mouse tracking ───────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  // ── Initial card position pass ─────────────────────────────────────────────
  useEffect(() => {
    // Trigger one immediate tick so cards are positioned before first paint
    tick(0, 16);
  }, [tick]);

  return (
    <section
      aria-label="Handpicked gift collections"
      className="relative border-t border-white/6 bg-gradient-to-b from-[#0d0c09] to-[#0b0b0b] py-24 select-none"
      style={{ overflow: "hidden" }}
      onMouseMove={handleMouseMove}
    >
      {/* ── Keyframe injection ── */}
      <style>{`
        @keyframes orbitFloat {
          from { transform: translateY(0px) translateX(0px); }
          to   { transform: translateY(-24px) translateX(8px); }
        }
        @keyframes energyRing {
          from { stroke-dashoffset: 1200; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes energyRingReverse {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: 1200; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulsate {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.04); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        .card-glass {
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0.07) 0%,
            rgba(255,255,255,0.02) 40%,
            rgba(212,175,55,0.04) 100%
          );
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(16px) saturate(1.4);
          -webkit-backdrop-filter: blur(16px) saturate(1.4);
        }
        .card-glass:hover {
          border-color: rgba(212,175,55,0.42);
        }
        .card-reflection {
          background: linear-gradient(
            160deg,
            rgba(255,255,255,0.13) 0%,
            transparent 45%,
            rgba(212,175,55,0.06) 100%
          );
        }
      `}</style>

      {/* ── Dynamic spotlight ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 55% 45% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(212,175,55,0.12) 0%, transparent 70%)`,
          transition: "background 0.4s ease",
        }}
      />

      {/* ── Ambient gold base glow ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 65%, rgba(212,175,55,0.07) 0%, transparent 65%)",
        }}
      />

      {/* ── Floating particles ── */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((style, i) => (
          <Particle key={i} style={style} />
        ))}
      </div>

      {/* ── Top gold rule ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* ── Section header ── */}
      <div className="mx-auto mb-14 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="editorial-eyebrow mb-4">Full Collection</p>
        <h2
          className="text-balance leading-[1.05] text-white"
          style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 700,
            fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
            letterSpacing: "-0.01em",
          }}
        >
          Curated for every moment.
        </h2>
        <p
          className="mx-auto mt-3 max-w-md text-base italic text-white/40"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Gifts that speak before you do.
        </p>
      </div>

      {/* ── 3D Stage ── */}
      <div
        ref={containerRef}
        className="relative mx-auto"
        style={{
          height: `${CARD_H + 200}px`,
          perspective: `${PERSPECTIVE}px`,
          perspectiveOrigin: "50% 45%",
          maxWidth: "100vw",
          overflow: "visible",
        }}
      >
        {/* ── Energy ring SVG ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 0 }}
        >
          <svg
            width="1600"
            height="300"
            viewBox="0 0 1600 300"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              overflow: "visible",
            }}
          >
            {/* Outer glow ring — matches new RADIUS_X=760 */}
            <ellipse
              cx="800"
              cy="150"
              rx="762"
              ry="130"
              fill="none"
              stroke="rgba(212,175,55,0.10)"
              strokeWidth="2"
              style={{ animation: "pulsate 4s ease-in-out infinite" }}
            />
            {/* Animated energy ring 1 */}
            <ellipse
              cx="800"
              cy="150"
              rx="756"
              ry="124"
              fill="none"
              stroke="url(#energyGradient1)"
              strokeWidth="1.5"
              strokeDasharray="140 1440"
              style={{
                animation: "energyRing 7s linear infinite",
                strokeLinecap: "round",
              }}
            />
            {/* Animated energy ring 2 (reverse, offset) */}
            <ellipse
              cx="800"
              cy="150"
              rx="768"
              ry="136"
              fill="none"
              stroke="url(#energyGradient2)"
              strokeWidth="1"
              strokeDasharray="90 1500"
              style={{
                animation: "energyRingReverse 11s linear infinite",
                strokeLinecap: "round",
              }}
            />
            <defs>
              <linearGradient id="energyGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#d4af37" stopOpacity="0" />
                <stop offset="40%"  stopColor="#f0d978" stopOpacity="0.9" />
                <stop offset="60%"  stopColor="#d4af37" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="energyGradient2" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="#d4af37" stopOpacity="0" />
                <stop offset="50%"  stopColor="#fffbe6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Orbit stage — direct 3D container ── */}
        <div
          ref={stageRef}
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {tripled.map((product, i) => {
            // Assign the ref slot
            const setRef = (el: HTMLDivElement | null) => {
              cardRefs.current[i] = el;
            };

            return (
              <OrbitCard
                key={`${product.id}-${i}`}
                product={product}
                index={i}
                cardW={CARD_W}
                cardH={CARD_H}
                setRef={setRef}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
                onAddToCart={(p) =>
                  addToCart({
                    id: p.id,
                    slug: p.slug,
                    name: p.name,
                    price: p.price,
                    quantity: 1,
                    image: p.image,
                    category: p.category,
                  })
                }
              />
            );
          })}
        </div>
      </div>

      {/* ── "View all" CTA ── */}
      <div className="mx-auto mt-10 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 transition hover:text-gold"
          data-cursor-explore=""
        >
          View full collection <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

// ─── OrbitCard ────────────────────────────────────────────────────────────────

interface OrbitCardProps {
  product: Product;
  index: number;
  cardW: number;
  cardH: number;
  setRef: (el: HTMLDivElement | null) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAddToCart: (p: Product) => void;
}

const OrbitCard = memo(function OrbitCard({
  product,
  cardW,
  cardH,
  setRef,
  onMouseEnter,
  onMouseLeave,
  onAddToCart,
}: OrbitCardProps) {
  return (
    <div
      ref={setRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width:  `${cardW}px`,
        height: `${cardH}px`,
        marginTop:  `-${cardH / 2}px`,
        marginLeft: `-${cardW / 2}px`,
        willChange: "transform, opacity, filter",
        transformStyle: "preserve-3d",
        cursor: "pointer",
      }}
    >
      {/* Center card ambient glow */}
      <div
        data-card-glow=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "-20px",
          borderRadius: "24px",
          background:
            "radial-gradient(ellipse 85% 70% at 50% 50%, rgba(212,175,55,0.38) 0%, transparent 70%)",
          opacity: 0,
          pointerEvents: "none",
          animation: "glowPulse 3s ease-in-out infinite",
          willChange: "opacity",
        }}
      />

      {/* Card surface */}
      <motion.article
        whileHover={{
          boxShadow:
            "0 0 70px rgba(212,175,55,0.42), 0 8px 48px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)",
          borderColor: "rgba(212,175,55,0.5)",
          transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
        }}
        className="card-glass relative flex h-full flex-col overflow-hidden rounded-2xl"
        style={{
          boxShadow:
            "0 4px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07)",
        }}
      >
        {/* Glass reflection highlight */}
        <div
          aria-hidden="true"
          className="card-reflection pointer-events-none absolute inset-0 rounded-2xl"
          style={{ zIndex: 2 }}
        />

        {/* Gold top edge shimmer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(212,175,55,0.7) 50%, transparent)",
            zIndex: 3,
          }}
        />

        {/* ── Product image ── */}
        <Link
          href={`/products/${product.slug}`}
          className="block flex-shrink-0"
          data-cursor-explore=""
          tabIndex={-1}
        >
          <div
            className="relative overflow-hidden"
            style={{
              height: `${Math.round(cardH * 0.53)}px`,
              background: "#141210",
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              draggable={false}
            />
            {/* Vignette overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(10,10,8,0.75) 0%, transparent 45%)",
              }}
            />
            {/* Tag badge */}
            {product.tags[0] && (
              <span
                className="absolute left-3 top-3 rounded bg-black/65 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/85 backdrop-blur-md"
                style={{ fontFamily: "var(--font-body)", zIndex: 4 }}
              >
                {product.tags[0]}
              </span>
            )}
          </div>
        </Link>

        {/* ── Product info ── */}
        <div
          className="flex flex-1 flex-col justify-between p-4"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-[0.22em] text-gold"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {product.category}
            </p>
            <h3
              className="mt-1 text-[15px] font-semibold leading-snug text-white"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {product.name}
            </h3>
          </div>

          <div
            className="flex items-center justify-between border-t pt-3"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div>
              <p
                className="text-sm font-semibold text-white"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {formatPrice(product.price)}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[9px] text-white/40">
                <Star className="size-2.5 fill-gold text-gold" />
                {product.rating} ({product.reviews})
              </p>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => onAddToCart(product)}
                data-cursor-add=""
                aria-label={`Add ${product.name} to cart`}
                className="flex size-8 items-center justify-center rounded-lg border border-white/12 text-white/60 transition hover:border-gold hover:text-gold"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <ShoppingBag className="size-3.5" />
              </button>
              <Link
                href={`/products/${product.slug}`}
                data-cursor-explore=""
                aria-label={`View ${product.name}`}
                className="flex size-8 items-center justify-center rounded-lg border border-white/12 text-white/60 transition hover:border-gold hover:text-gold"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
});
