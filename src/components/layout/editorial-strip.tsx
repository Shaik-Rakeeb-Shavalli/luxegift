"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * EditorialStrip
 * Placement: Between HeroSlider and InfiniteMarquee
 * Style: Luxury Editorial (#1) + Gold Collection eyebrow (#6)
 *
 * A full-width editorial statement strip — large Playfair Display
 * headline split into three staggered lines, flanked by thin gold rules,
 * with an animated gold-gradient eyebrow above and a body copy line below.
 */
export function EditorialStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-6% 0px" });

  const lines = ["CURATED FOR", "EXTRAORDINARY", "MOMENTS"];

  return (
    <section
      ref={ref}
      aria-label="Editorial brand statement"
      className="relative overflow-hidden border-b border-white/6 bg-[#0c0b08] py-24 text-center"
    >
      {/* Subtle radial gold glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(212,175,55,0.08),transparent_65%)]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Animated eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="editorial-eyebrow mb-8"
        >
          Signature Collection · Est. Since The Beginning
        </motion.p>

        {/* Gold rule — top */}
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="gold-rule mb-10 block origin-center"
        />

        {/* Main cinematic headline — 3 staggered lines */}
        <div aria-label="Curated for extraordinary moments">
          {lines.map((line, i) => (
            <div key={line} className="overflow-hidden">
              <motion.h2
                initial={{ y: "115%", opacity: 0 }}
                animate={inView ? { y: 0, opacity: 1 } : {}}
                transition={{
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.15 + i * 0.13,
                }}
                className="cinematic-display text-[clamp(3rem,9vw,8rem)] leading-[0.9] tracking-[0.18em] text-white"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {line}
              </motion.h2>
            </div>
          ))}
        </div>

        {/* Gold rule — bottom */}
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.55 }}
          className="gold-rule mt-10 mb-8 block origin-center"
        />

        {/* Subheadline in Inter */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.65 }}
          className="luxury-body mx-auto max-w-xl text-base"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Discover handcrafted gifts designed to leave a lasting impression.
          <br />
          <span className="mt-1 block text-white/35">
            Every detail chosen with intention.
          </span>
        </motion.p>

        {/* Decorative gold dot ornament */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.75 }}
          className="mx-auto mt-10 flex items-center justify-center gap-3"
          aria-hidden="true"
        >
          <span className="size-1 rounded-full bg-gold/40" />
          <span className="size-1.5 rounded-full bg-gold/70" />
          <span className="size-2 rounded-full bg-gold" />
          <span className="size-1.5 rounded-full bg-gold/70" />
          <span className="size-1 rounded-full bg-gold/40" />
        </motion.div>
      </div>
    </section>
  );
}
