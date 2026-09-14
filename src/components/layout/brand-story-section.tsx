"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * BrandStorySection
 * Placement: Between BentoSection and HorizontalGallery
 * Style: #3 High-End Fashion Brand + #4 Cinematic Large Typography
 *
 * Full-width dark editorial block with parallax background glow,
 * Playfair Display headline, Inter body, and a staggered line reveal.
 */
export function BrandStorySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: "-8% 0px" });

  // Parallax: gold radial glow shifts up slightly on scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  const headlineLines = ["THE ART", "OF GIFTING"];
  const secondBlock = ["MORE THAN A GIFT —", "A Memory Worth Keeping."];

  return (
    <section
      ref={sectionRef}
      aria-label="Brand story — the art of gifting"
      className="relative overflow-hidden bg-[#08080a] py-32"
    >
      {/* ── Parallax radial gold glow ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ y: glowY }}
      >
        <div className="absolute left-1/2 top-1/2 h-[70vw] max-h-[600px] w-[70vw] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(212,175,55,0.12)_0%,transparent_70%)]" />
      </motion.div>

      {/* ── Thin horizontal rule — top ── */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="gold-rule mb-20 origin-left"
        />
      </div>

      {/* ── Main content ── */}
      <div
        ref={headingRef}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:gap-24">

          {/* Left — display headline */}
          <div>
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-eyebrow mb-6"
            >
              Our Philosophy
            </motion.p>

            {/* Cinematic headline — line by line reveal */}
            <div aria-label="The art of gifting">
              {headlineLines.map((line, i) => (
                <div key={line} className="overflow-hidden">
                  <motion.h2
                    initial={{ y: "115%", opacity: 0 }}
                    animate={inView ? { y: 0, opacity: 1 } : {}}
                    transition={{
                      duration: 1,
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.1 + i * 0.14,
                    }}
                    className="block leading-[0.9] text-white"
                    style={{
                      fontFamily: "var(--font-serif)",
                      fontWeight: 700,
                      fontSize: "clamp(3.5rem, 9vw, 7.5rem)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {line}
                  </motion.h2>
                </div>
              ))}
            </div>

            {/* Gold accent line */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={inView ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.38 }}
              className="mt-8 h-[2px] w-24 origin-left bg-gradient-to-r from-gold via-gold-soft to-transparent"
            />

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
              className="mt-6 text-xl italic text-white/50"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Where elegance meets emotion.
            </motion.p>
          </div>

          {/* Right — cinematic secondary text + stat + CTA */}
          <div className="flex flex-col justify-center">
            {/* Secondary headline — two-line cinematic */}
            <div aria-label="More than a gift — a memory worth keeping">
              {secondBlock.map((line, i) => (
                <div key={line} className="overflow-hidden">
                  <motion.p
                    initial={{ y: "115%", opacity: 0 }}
                    animate={inView ? { y: 0, opacity: 1 } : {}}
                    transition={{
                      duration: 0.85,
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.28 + i * 0.16,
                    }}
                    className={
                      i === 0
                        ? "text-[11px] font-bold uppercase tracking-[0.3em] text-gold/70"
                        : "mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl"
                    }
                    style={
                      i === 1
                        ? { fontFamily: "var(--font-serif)", fontWeight: 600 }
                        : { fontFamily: "var(--font-body)" }
                    }
                  >
                    {line}
                  </motion.p>
                </div>
              ))}
            </div>

            {/* Body copy */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
              className="mt-6 max-w-sm text-base leading-7 text-white/50"
              style={{ fontFamily: "var(--font-body)" }}
            >
              We believe every gift carries the weight of a moment. Our curators
              hand-select every piece — not for its price, but for the story it
              tells and the memory it creates.
            </motion.p>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.72 }}
              className="mt-8 grid grid-cols-3 gap-4 border-t border-white/8 pt-8"
            >
              {[
                { num: "12k+", label: "Gifts Gifted" },
                { num: "4.9★", label: "Avg. Rating" },
                { num: "98%", label: "Repeat Gifters" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <p
                    className="text-2xl font-bold text-white sm:text-3xl"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {num}
                  </p>
                  <p
                    className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/35"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* CTA link */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.84 }}
              className="mt-8"
            >
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-gold transition-all hover:gap-3"
                style={{ fontFamily: "var(--font-body)" }}
              >
                Explore the Collection
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Thin horizontal rule — bottom ── */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="gold-rule mt-20 origin-right"
        />
      </div>
    </section>
  );
}
