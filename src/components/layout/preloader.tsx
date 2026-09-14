"use client";

/**
 * LuxeGift — Cinematic Brand Reveal Preloader
 * ─────────────────────────────────────────────
 * Phase flow:
 *   1. "typing"  → characters appear one by one, elegant & deliberate
 *   2. "hold"    → completed brand name pauses 500 ms
 *   3. "split"   → "LUXE" exits left, "GIFT" exits right (gift-box open)
 *   4. "done"    → overlay removed, page fully interactive
 *
 * No video. No cursor blink. No blur. Pure luxury motion.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";



// ─── Timing constants ─────────────────────────────────────────────────────────
const CHAR_SPEED_MS     = 110; // ms per character
const WORD_GAP_MS       = 420; // gap between "LUXE" and "GIFT"
const HOLD_MS           = 550; // pause after full brand name appears
const SPLIT_DURATION    = 1.4; // seconds for split animation

// ─── Easing ───────────────────────────────────────────────────────────────────
const LUXURY_EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "idle" | "typing" | "hold" | "split" | "done";

// ─── Tiny seeded particle positions (stable SSR/CSR) ─────────────────────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x:    ((i * 47 + 13) % 100),  // 0-100 %
  y:    ((i * 31 + 7)  % 100),
  size: 1.5 + (i % 3) * 1.2,
  dur:  3.5 + (i % 5),
  del:  -(i * 0.55),
}));

// ─── Component ────────────────────────────────────────────────────────────────
export function Preloader({ onComplete }: { onComplete?: () => void }) {
  const [phase,    setPhase]    = useState<Phase>("idle");
  const [luxeText, setLuxeText] = useState("");  // typed "LUXE"
  const [giftText, setGiftText] = useState("");  // typed "GIFT"
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // ── Determine whether to run on mount ─────────────────────────────────────
  useEffect(() => {
    setPhase("typing");
  }, []);

  // ── Typing sequence ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "typing") return;
    let cancelled = false;

    const typeWord = (
      word: string,
      setter: (s: string) => void,
      delay: number,
    ): Promise<void> =>
      new Promise(resolve =>
        setTimeout(() => {
          if (cancelled) { resolve(); return; }
          let i = 0;
          const tick = setInterval(() => {
            if (cancelled) { clearInterval(tick); resolve(); return; }
            i++;
            setter(word.slice(0, i));
            if (i === word.length) { clearInterval(tick); resolve(); }
          }, CHAR_SPEED_MS);
        }, delay),
      );

    (async () => {
      await typeWord("LUXE", setLuxeText, 0);
      await typeWord("GIFT", setGiftText, WORD_GAP_MS);
      if (!cancelled) setPhase("hold");
    })();

    return () => { cancelled = true; };
  }, [phase]);

  // ── Hold → split ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "hold") return;
    const t = setTimeout(() => setPhase("split"), HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // ── After split exits → done ───────────────────────────────────────────────
  const handleSplitComplete = useCallback(() => {
    setPhase("done");
    onCompleteRef.current?.();
  }, []);

  if (phase === "idle" || phase === "done") return null;

  const isSplitting = phase === "split";
  const textVisible = phase === "typing" || phase === "hold";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isSplitting ? 0 : 1 }}
      transition={
        isSplitting
          ? { duration: 0.55, delay: SPLIT_DURATION * 0.75, ease: "easeOut" }
          : { duration: 0 }
      }
      onAnimationComplete={() => { if (isSplitting) handleSplitComplete(); }}
      className="fixed inset-0 z-[9999] overflow-hidden select-none"
      style={{ background: "#050505" }}
    >
      {/* ── Gold radial ambient ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Particles — drift outward during split ── */}
      <AnimatePresence>
        {isSplitting && (
          <motion.div
            key="particles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            {PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.55, 0],
                  scale:   [0, 1, 0.4],
                  x: (p.x < 50 ? -1 : 1) * (30 + (i % 4) * 20),
                  y: (p.y < 50 ? -1 : 1) * (20 + (i % 3) * 14),
                }}
                transition={{ duration: SPLIT_DURATION * 0.9, ease: "easeOut", delay: 0.08 }}
                style={{
                  position: "absolute",
                  left: `${p.x}%`,
                  top:  `${p.y}%`,
                  width:  `${p.size}px`,
                  height: `${p.size}px`,
                  borderRadius: "50%",
                  background: "#d4af37",
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Center gold glow — expands during split ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.55) 0%, rgba(212,175,55,0.12) 40%, transparent 70%)",
        }}
        animate={
          isSplitting
            ? { width: "38vw", height: "38vw", opacity: [0, 0.85, 0] }
            : { width: "0px", height: "0px", opacity: 0 }
        }
        transition={
          isSplitting
            ? { duration: SPLIT_DURATION * 0.85, ease: "easeOut" }
            : { duration: 0 }
        }
      />

      {/* ── Brand name — typed, then splits ── */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-4"
        aria-label="LUXE GIFT"
      >
        {/* Gold ornament above */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={
            luxeText.length > 0
              ? { scaleX: 1, opacity: 1 }
              : { scaleX: 0, opacity: 0 }
          }
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          style={{
            height: "1px",
            width: "72px",
            background:
              "linear-gradient(90deg, transparent, rgba(212,175,55,0.7), transparent)",
            transformOrigin: "center",
          }}
        />

        {/* LUXE — exits LEFT */}
        <motion.div
          animate={
            isSplitting
              ? { x: "-120vw", opacity: 0.9 }
              : { x: 0, opacity: 1 }
          }
          transition={
            isSplitting
              ? { duration: SPLIT_DURATION, ease: LUXURY_EASE }
              : { duration: 0 }
          }
          style={{ display: "flex", gap: "0.22em", willChange: "transform" }}
        >
          {"LUXE".split("").map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={luxeText[i] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.38, ease: "easeOut" }}
              style={{
                fontFamily: "var(--font-serif,'Playfair Display',serif)",
                fontSize: "clamp(3.2rem,9.5vw,7.5rem)",
                fontWeight: 300,
                lineHeight: 1,
                color: "#F5F5F5",
                letterSpacing: "0.22em",
              }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>

        {/* GIFT — exits RIGHT */}
        <motion.div
          animate={
            isSplitting
              ? { x: "120vw", opacity: 0.9 }
              : { x: 0, opacity: 1 }
          }
          transition={
            isSplitting
              ? { duration: SPLIT_DURATION, ease: LUXURY_EASE }
              : { duration: 0 }
          }
          style={{ display: "flex", gap: "0.22em", willChange: "transform" }}
        >
          {"GIFT".split("").map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={giftText[i] ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.38, ease: "easeOut" }}
              style={{
                fontFamily: "var(--font-serif,'Playfair Display',serif)",
                fontSize: "clamp(1.6rem,4.8vw,3.8rem)",
                fontWeight: 200,
                lineHeight: 1,
                color: "#d4af37",
                letterSpacing: "0.52em",
              }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>

        {/* Gold ornament below */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={
            giftText === "GIFT"
              ? { scaleX: 1, opacity: 1 }
              : { scaleX: 0, opacity: 0 }
          }
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            height: "1px",
            width: "72px",
            background:
              "linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)",
            transformOrigin: "center",
          }}
        />

        {/* Tagline — fades in after GIFT completes */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={giftText === "GIFT" && !isSplitting ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          style={{
            fontFamily: "var(--font-body,'Inter',sans-serif)",
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.38em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.45)",
            marginTop: "4px",
          }}
        >
          Curated Luxury Gifting
        </motion.p>
      </div>
    </motion.div>
  );
}
