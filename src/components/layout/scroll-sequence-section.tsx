"use client";

/**
 * ScrollSequenceSection — Awwwards-level luxury scrollytelling
 *
 * PERFORMANCE ARCHITECTURE:
 *  ─ No useSpring: 1-to-1 scroll → frame mapping, zero interpolation lag
 *  ─ Dedicated RAF loop: reads getBoundingClientRect() every frame at 60 fps
 *    instead of listening to scroll events (eliminates event-dispatch overhead)
 *  ─ All 180 frames pre-fetched in parallel the moment the component mounts;
 *    the browser's HTTP/2 connection pool handles concurrency automatically
 *  ─ Canvas context cached in a ref; DPR resize only happens on actual changes
 *  ─ React state for text overlays is written on a separate low-frequency path
 *    so it never stalls the canvas draw
 *  ─ ImageBitmap is GPU-decoded at load time → drawImage is zero-copy
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_FRAMES     = 180;
const FRAME_BASE       = "/scroll-frames/ezgif-frame-";
const SCROLL_HEIGHT_PX = 6000;   // total scroll travel in px

// ─── Scene definitions ────────────────────────────────────────────────────────

interface Scene {
  id:          string;
  frameStart:  number;            // 1-based, inclusive
  frameEnd:    number;
  label:       string;
  headline:    string;
  subheadline: string;
  cta?:        { label: string; href: string };
  position:    "center" | "left" | "right";
}

const SCENES: Scene[] = [
  {
    // ── Scene 1: Opening — frames 1–45 ──────────────────────────────────────
    id: "scene-1", frameStart: 1, frameEnd: 45,
    label: "LUXEGIFT",
    headline: "Every Gift Tells A Story",
    subheadline: "Curated with intention.\nDelivered with elegance.",
    position: "center",
  },
  {
    // ── Scene 2: Mid — frames 76–115 (gap before/after lets image breathe) ──
    id: "scene-2", frameStart: 76, frameEnd: 115,
    label: "THE ART OF GIFTING",
    headline: "More Than A Gift",
    subheadline: "Thoughtfully selected.\nBeautifully presented.",
    position: "left",
  },
  {
    // ── Scene 3: Finale — frames 146–180 with CTA ────────────────────────────
    id: "scene-3", frameStart: 146, frameEnd: 180,
    label: "BEGIN THE EXPERIENCE",
    headline: "The Perfect Gift Awaits",
    subheadline: "Discover curated gifts designed to leave\na lasting impression.",
    cta: { label: "Explore Collections", href: "/shop" },
    position: "center",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function frameSrc(n: number) {
  return `${FRAME_BASE}${String(n).padStart(3, "0")}.jpg`;
}

function getActiveScene(frame0: number): Scene | null {
  const f = frame0 + 1;
  return SCENES.find(s => f >= s.frameStart && f <= s.frameEnd) ?? null;
}

function positionClass(pos: Scene["position"]) {
  if (pos === "left")  return "items-center text-center sm:items-start sm:text-left px-4 sm:pl-16 lg:pl-24";
  if (pos === "right") return "items-center text-center sm:items-end sm:text-right px-4 sm:pr-16 lg:pr-24";
  return "items-center text-center px-4";
}

// ─── Image preloader — all frames in parallel ─────────────────────────────────

function useFrameImages() {
  const bitmaps       = useRef<(ImageBitmap | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const [readyCount, setReadyCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let loaded  = 0;

    // Fire every request simultaneously — HTTP/2 multiplexes them efficiently
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const idx = i;
      fetch(frameSrc(idx + 1))
        .then(r => r.blob())
        .then(b => createImageBitmap(b, { imageOrientation: "none", premultiplyAlpha: "none", colorSpaceConversion: "none" }))
        .then(bmp => {
          if (!mounted) return;
          bitmaps.current[idx] = bmp;
          loaded++;
          // Notify React every 10 frames so the loading bar updates
          if (loaded % 10 === 0 || loaded === TOTAL_FRAMES) {
            setReadyCount(loaded);
          }
        })
        .catch(() => {
          if (!mounted) return;
          loaded++;
          if (loaded === TOTAL_FRAMES) setReadyCount(loaded);
        });
    }

    return () => { mounted = false; };
  }, []);

  return { bitmaps, readyCount };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScrollSequenceSection() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const ctxRef        = useRef<CanvasRenderingContext2D | null>(null);
  const lastFrameRef  = useRef(-1);
  const lastDprW      = useRef(0);
  const lastDprH      = useRef(0);

  const { bitmaps, readyCount } = useFrameImages();

  // React state only for UI overlays — never touched in the draw hot-path
  const [uiFrame,    setUiFrame]    = useState(0);
  const [uiProgress, setUiProgress] = useState(0);

  // ── Low-overhead canvas draw ─────────────────────────────────────────────
  const drawBitmap = useCallback((idx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const bmp = bitmaps.current[Math.min(idx, TOTAL_FRAMES - 1)];
    if (!bmp) return false;

    // Lazy-init context
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d", { alpha: false }) ?? null;
    }
    const ctx = ctxRef.current;
    if (!ctx) return false;

    // Only resize when dimensions genuinely change
    const dpr = window.devicePixelRatio || 1;
    const W   = canvas.clientWidth;
    const H   = canvas.clientHeight;
    const tw  = Math.round(W * dpr);
    const th  = Math.round(H * dpr);

    if (lastDprW.current !== tw || lastDprH.current !== th) {
      canvas.width  = tw;
      canvas.height = th;
      ctx.scale(dpr, dpr);
      lastDprW.current = tw;
      lastDprH.current = th;
    }

    // Cover-scale: fill canvas, centre image
    const scale = Math.max(W / bmp.width, H / bmp.height);
    const sw    = bmp.width  * scale;
    const sh    = bmp.height * scale;
    const sx    = (W - sw) * 0.5;
    const sy    = (H - sh) * 0.5;

    ctx.drawImage(bmp, sx, sy, sw, sh);
    return true;
  }, [bitmaps]);

  // ── RAF loop — the ONLY place we read scroll ─────────────────────────────
  useEffect(() => {
    let rafId: number;
    let uiThrottle = 0;           // only update React state every N frames

    function tick() {
      const el = containerRef.current;
      if (el) {
        const rect     = el.getBoundingClientRect();
        const totalH   = el.offsetHeight - window.innerHeight;
        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / totalH));
        const frameIdx = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * TOTAL_FRAMES));

        // Canvas: draw every time the frame index changes
        if (frameIdx !== lastFrameRef.current) {
          if (drawBitmap(frameIdx)) {
            lastFrameRef.current = frameIdx;
          }
        }

        // React state: throttle to ~20 fps to keep the main thread free
        uiThrottle++;
        if (uiThrottle >= 3) {
          uiThrottle = 0;
          setUiFrame(frameIdx);
          setUiProgress(progress);
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    const handleResize = () => {
      lastFrameRef.current = -1;
    };
    window.addEventListener("resize", handleResize);

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [drawBitmap]);

  // ── Derived UI values (computed from React state, not the hot path) ──────
  const activeScene   = getActiveScene(uiFrame);
  const isVisible     = readyCount >= 20;           // show once 20 frames ready
  const scrollHint    = uiProgress < 0.06 ? 1 - uiProgress / 0.06 : 0;
  const bottomFade    = uiProgress > 0.90 ? (uiProgress - 0.90) / 0.10 : 0;

  return (
    <section
      ref={containerRef}
      className="relative w-full"
      style={{ height: SCROLL_HEIGHT_PX }}
      aria-label="LUXEGIFT brand introduction"
    >
      {/* ── Sticky fullscreen panel ── */}
      <div
        className="sticky top-0 left-0 w-full overflow-hidden"
        style={{ height: "100dvh", background: "#050505" }}
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: isVisible ? 1 : 0, transition: "opacity 0.5s ease" }}
          aria-hidden="true"
        />

        {/* Loading overlay */}
        {!isVisible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[#050505]">
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full"
                  style={{ border: "1px solid rgba(212,175,55,0.12)" }} />
                <div className="absolute inset-0 rounded-full"
                  style={{ border: "1px solid transparent", borderTopColor: "#d4af37",
                           animation: "lgSpin 1s linear infinite" }} />
                <div className="absolute inset-[6px] rounded-full"
                  style={{ border: "1px solid transparent", borderTopColor: "rgba(212,175,55,0.35)",
                           animation: "lgSpin 1.8s linear infinite reverse" }} />
              </div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "9px", fontWeight: 700,
                          letterSpacing: "0.35em", textTransform: "uppercase",
                          color: "rgba(212,175,55,0.55)" }}>
                Preparing Experience
              </p>
              <div className="w-28 h-px overflow-hidden rounded-full"
                style={{ background: "rgba(212,175,55,0.10)" }}>
                <div className="h-full rounded-full"
                  style={{ width: `${(readyCount / TOTAL_FRAMES) * 100}%`,
                           background: "linear-gradient(90deg,#b8962e,#d4af37,#f0d978)",
                           transition: "width 0.15s ease" }} />
              </div>
            </div>
          </div>
        )}

        {/* Vignette */}
        {isVisible && (
          <>
            <div className="pointer-events-none absolute inset-0" style={{
              background: [
                "radial-gradient(ellipse at center, transparent 38%, rgba(5,5,5,0.52) 100%)",
                "linear-gradient(to bottom, rgba(5,5,5,0.25) 0%, transparent 18%, transparent 78%, rgba(5,5,5,0.6) 100%)",
              ].join(","),
            }} />
            {activeScene?.position === "left" && (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[55%]"
                style={{ background: "linear-gradient(to right,rgba(5,5,5,0.68) 0%,transparent 100%)" }} />
            )}
            {activeScene?.position === "right" && (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%]"
                style={{ background: "linear-gradient(to left,rgba(5,5,5,0.68) 0%,transparent 100%)" }} />
            )}
          </>
        )}

        {/* Scene text overlays */}
        {isVisible && (
          <div className={`absolute inset-0 flex flex-col justify-center pointer-events-none z-10 ${
            activeScene ? positionClass(activeScene.position) : "items-center text-center"
          }`}>
            <AnimatePresence mode="wait">
              {activeScene && (
                <motion.div
                  key={activeScene.id}
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.85, ease: [0.25, 0.1, 0.25, 1] }}
                  className="max-w-xl px-4"
                >
                  {/* Eyebrow */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.9, delay: 0.05 }}
                    style={{
                      fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700,
                      letterSpacing: "0.32em", textTransform: "uppercase",
                      color: "rgba(212,175,55,0.82)", marginBottom: "1rem",
                    }}
                  >
                    {activeScene.label}
                  </motion.p>

                  {/* Gold rule */}
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.75, ease: "easeOut", delay: 0.08 }}
                    style={{
                      height: "1px", width: "3rem", marginBottom: "1.2rem",
                      background: "linear-gradient(90deg,transparent,#d4af37,transparent)",
                      transformOrigin: activeScene.position === "right" ? "right" : "left",
                      marginLeft: activeScene.position === "right" ? "auto" : undefined,
                    }}
                  />

                  {/* Headline */}
                  <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 }}
                    style={{
                      fontFamily: "var(--font-serif)", fontWeight: 700,
                      fontSize: "clamp(2rem, 4.8vw, 4.2rem)",
                      lineHeight: 1.06, letterSpacing: "0.02em",
                      color: "rgba(255,255,255,0.93)", marginBottom: "1.2rem",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {activeScene.headline}
                  </motion.h2>

                  {/* Sub */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1], delay: 0.18 }}
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "clamp(0.82rem, 1.4vw, 1.05rem)",
                      lineHeight: 1.82, color: "rgba(255,255,255,0.56)",
                      whiteSpace: "pre-line",
                      marginBottom: activeScene.cta ? "2rem" : 0,
                    }}
                  >
                    {activeScene.subheadline}
                  </motion.p>

                  {/* CTA */}
                  {activeScene.cta && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.28 }}
                      className="pointer-events-auto"
                    >
                      <Link
                        href={activeScene.cta.href}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.55rem",
                          padding: "0.72rem 1.9rem",
                          background: "linear-gradient(135deg,#b8962e 0%,#d4af37 50%,#b8962e 100%)",
                          backgroundSize: "200% auto",
                          color: "#0b0b0b", fontFamily: "var(--font-body)",
                          fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em",
                          textTransform: "uppercase", borderRadius: "2px",
                          boxShadow: "0 0 28px rgba(212,175,55,0.35),0 4px 16px rgba(0,0,0,0.4)",
                          textDecoration: "none",
                          animation: "gold-shine 3s linear infinite",
                        }}
                        onMouseEnter={e =>
                          ((e.currentTarget as HTMLElement).style.boxShadow =
                            "0 0 44px rgba(212,175,55,0.6),0 8px 24px rgba(0,0,0,0.5)")
                        }
                        onMouseLeave={e =>
                          ((e.currentTarget as HTMLElement).style.boxShadow =
                            "0 0 28px rgba(212,175,55,0.35),0 4px 16px rgba(0,0,0,0.4)")
                        }
                      >
                        {activeScene.cta.label}
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2 7h10M8 3l4 4-4 4" stroke="#0b0b0b" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Frame counter + progress bar — top right */}
        {isVisible && (
          <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "9px", fontWeight: 600,
              letterSpacing: "0.2em", color: "rgba(212,175,55,0.4)", textTransform: "uppercase",
            }}>
              {String(uiFrame + 1).padStart(3, "0")} / {TOTAL_FRAMES}
            </p>
            <div style={{
              width: "1px", height: "56px", position: "relative",
              background: "rgba(212,175,55,0.10)", overflow: "hidden", borderRadius: "1px",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                background: "linear-gradient(to bottom,#d4af37,rgba(212,175,55,0.25))",
                height: `${uiProgress * 100}%`,
              }} />
            </div>
          </div>
        )}

        {/* "Scroll to Explore" hint */}
        {isVisible && (
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
            style={{ opacity: scrollHint, transition: "opacity 0.4s ease", pointerEvents: "none" }}
            aria-hidden="true"
          >
            <p style={{
              fontFamily: "var(--font-body)", fontSize: "9px", fontWeight: 600,
              letterSpacing: "0.35em", textTransform: "uppercase",
              color: "rgba(212,175,55,0.5)",
            }}>
              Scroll to Explore
            </p>
            <div className="flex flex-col items-center gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: "1px", height: "5px",
                  background: `rgba(212,175,55,${0.18 + i * 0.18})`,
                  animation: `lgPulse 1.8s ease-in-out ${i * 0.18}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Bottom melt gradient */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0"
          style={{
            height: "160px",
            background: "linear-gradient(to bottom,transparent 0%,rgba(11,11,11,0.75) 70%,#0b0b0b 100%)",
            opacity: Math.min(1, bottomFade * 3 + 0.12),
          }}
        />

        {/* Keyframes */}
        <style>{`
          @keyframes lgSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes lgPulse {
            0%,100% { transform:translateY(0);   opacity:0.3; }
            50%      { transform:translateY(4px); opacity:1;   }
          }
        `}</style>
      </div>

      {/* Handoff gradient — feeds into HeroSlider */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 inset-x-0 h-32"
        style={{ background: "linear-gradient(to bottom,transparent 0%,#0b0b0b 100%)", zIndex: 1 }}
      />
    </section>
  );
}
