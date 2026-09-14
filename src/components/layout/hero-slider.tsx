"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSlide {
  id: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  imageSrc: string;
  accentColor: string;
  tag?: string;
}

const slides: HeroSlide[] = [
  {
    id: "slide-1",
    eyebrow: "Signature Collection",
    headline: "Midnight Atelier Box",
    subheadline:
      "A cinematic black lacquer gift box with artisanal sweets, handwritten card, and gold ribbon. The benchmark for luxury unboxing.",
    cta: { label: "Reserve Now", href: "/products/midnight-atelier-box" },
    secondaryCta: { label: "Build Your Own", href: "/gift-box-builder" },
    imageSrc: "/images/midnight-atelier-box.png",
    accentColor: "#D4AF37",
    tag: "Best Seller",
  },
  {
    id: "slide-2",
    eyebrow: "Wellness Rituals",
    headline: "Aura Wellness Ritual",
    subheadline:
      "An Aesop-inspired ritual set with candle, bath oil, linen spray, and a personalized brass nameplate. Gifted calm.",
    cta: { label: "Explore Set", href: "/products/aura-wellness-ritual" },
    secondaryCta: { label: "Shop All Wellness", href: "/shop" },
    imageSrc: "/images/aura-wellness-ritual.png",
    accentColor: "#f7f0df",
    tag: "New Arrival",
  },
  {
    id: "slide-3",
    eyebrow: "Corporate Prestige",
    headline: "Executive Obsidian Vault",
    subheadline:
      "Fine leather desk objects, gourmet coffee, and a concealed message card. The prestige gift your clients remember.",
    cta: { label: "Order for Your Team", href: "/products/executive-obsidian-vault" },
    secondaryCta: { label: "AI Gift Finder", href: "/gift-finder" },
    imageSrc: "/images/executive-obsidian-vault.png",
    accentColor: "#D4AF37",
    tag: "Limited Edition",
  },
  {
    id: "slide-4",
    eyebrow: "Romantic Occasions",
    headline: "Rose Gold Anniversary Case",
    subheadline:
      "Preserved florals, luxury fragrance, truffles, and a cinematic card reveal. A statement of devotion, boxed.",
    cta: { label: "Gift This", href: "/products/rose-gold-anniversary-case" },
    secondaryCta: { label: "View Occasions", href: "/occasions/anniversary-gifts" },
    imageSrc: "/images/rose-gold-anniversary-case.png",
    accentColor: "#e6b9a6",
    tag: "360° Preview",
  },
  {
    id: "slide-5",
    eyebrow: "Festive Collection",
    headline: "Imperial Date Confectionery",
    subheadline:
      "Layered date confections, gold-foil florals, and a sculptural keepsake tray. Designed for festive hosting excellence.",
    cta: { label: "Shop Festive Gifts", href: "/products/imperial-date-confectionery" },
    secondaryCta: { label: "View All Occasions", href: "/occasions/eid-gifts" },
    imageSrc: "/images/imperial-date-confectionery.png",
    accentColor: "#7a5a20",
    tag: "Trending",
  },
];

const AUTOPLAY_INTERVAL = 5000;

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrent(((index % slides.length) + slides.length) % slides.length);
    setProgress(0);
  }, []);

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Progress bar tick
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + 100 / (AUTOPLAY_INTERVAL / 50);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isPaused, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const slide = slides[current];

  return (
    <div
      className="relative h-[calc(100vh-4rem)] min-h-[560px] w-full overflow-hidden bg-[#0B0B0B]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured luxury gifts"
    >
      {/* ── Background image crossfade ── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id + "-bg"}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageSrc}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-center"
          />
          {/* Multi-layer cinematic overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          {/* Gold radial glow tied to slide accent */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at 60% 40%, ${slide.accentColor}55, transparent 55%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Floating gold particle dots ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-gold"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${5 + (i * 5.2) % 90}%`,
              top: `${10 + (i * 7.3) % 80}%`,
              opacity: 0.18 + (i % 4) * 0.06,
            }}
            animate={{ y: [0, -14, 0], opacity: [0.18, 0.45, 0.18] }}
            transition={{
              duration: 3.5 + (i % 5),
              delay: (i * 0.37) % 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* ── Slide content ── */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-24 sm:px-6 sm:justify-center sm:pb-0 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id + "-content"}
            className="max-w-2xl"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Tag badge */}
            {slide.tag && (
              <motion.span
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.45 }}
                className="mb-5 inline-flex items-center gap-2 rounded-sm border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-gold backdrop-blur-sm"
              >
                <span className="size-1.5 rounded-full bg-gold animate-pulse" />
                {slide.tag}
              </motion.span>
            )}

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="editorial-eyebrow"
            >
              {slide.eyebrow}
            </motion.p>

            {/* Headline — Playfair Display */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mt-3 text-balance leading-[0.94] text-white"
              style={{
                fontFamily: "var(--font-serif)",
                fontWeight: 700,
                fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                letterSpacing: "0.02em",
              }}
            >
              {slide.headline}
            </motion.h1>

            {/* Gold divider line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.45, duration: 0.55, ease: "easeOut" }}
              className="mt-6 h-[1px] w-20 origin-left bg-gradient-to-r from-gold to-transparent"
            />

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.55 }}
              className="mt-5 max-w-lg text-base leading-7 text-white/62"
            >
              {slide.subheadline}
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.5 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button asChild className="gap-2 shadow-[0_0_28px_rgba(212,175,55,0.35)]">
                <Link href={slide.cta.href}>
                  {slide.cta.label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {slide.secondaryCta && (
                <Button asChild variant="outline">
                  <Link href={slide.secondaryCta.href}>{slide.secondaryCta.label}</Link>
                </Button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Slide counter (top-right) ── */}
      <div className="absolute right-6 top-6 z-20 font-mono text-xs text-white/30">
        <span className="text-white/70 font-semibold">{String(current + 1).padStart(2, "0")}</span>
        <span className="mx-1">/</span>
        {String(slides.length).padStart(2, "0")}
      </div>

      {/* ── Prev / Next arrow controls ── */}
      <div className="absolute right-6 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        <button
          onClick={goPrev}
          aria-label="Previous slide"
          className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/60 backdrop-blur-md transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={goNext}
          aria-label="Next slide"
          className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/60 backdrop-blur-md transition hover:border-gold/40 hover:bg-gold/10 hover:text-gold"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* ── Bottom dot + progress indicators ── */}
      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-3">
        {/* Dot row */}
        <div className="flex items-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="group relative flex items-center justify-center"
            >
              <span
                className={`block rounded-full transition-all duration-500 ${
                  i === current
                    ? "w-7 h-2 bg-gold shadow-[0_0_8px_rgba(212,175,55,0.7)]"
                    : "w-2 h-2 bg-white/25 hover:bg-white/50"
                }`}
              />
              {/* Active progress fill */}
              {i === current && (
                <span
                  className="absolute left-0 top-0 h-full rounded-full bg-white/30"
                  style={{ width: `${progress}%`, transition: "width 50ms linear" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Thin full-width progress bar at very bottom */}
        <div className="h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gold transition-none"
            style={{ width: `${progress}%`, transition: "width 50ms linear" }}
          />
        </div>
      </div>

      {/* ── Vertical slide titles (desktop right rail) ── */}
      <div className="absolute bottom-10 right-6 z-20 hidden flex-col gap-4 lg:flex">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            className={`text-right text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${
              i === current ? "text-gold" : "text-white/25 hover:text-white/50"
            }`}
          >
            {s.eyebrow}
          </button>
        ))}
      </div>
    </div>
  );
}
