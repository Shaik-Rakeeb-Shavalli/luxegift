"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Gift } from "lucide-react";
import { occasions, slugify } from "@/lib/data";

/**
 * CollectionsTypographySection
 * Placement: After HorizontalGallery, before existing benefits Section
 * Style: #9 Premium Collection Section + #5 Luxury Serif + Sans Combination
 *
 * Playfair Display section heading "Handpicked Collections" with staggered
 * category cards — each showing a decorative numeral in Playfair,
 * the collection name in Inter semibold, and a hover gold reveal.
 */

const collections = [
  {
    num: "01",
    title: "Birthday Gifts",
    description: "Celebrate every year with something unforgettable.",
    href: `/occasions/${slugify("Birthday Gifts")}`,
    tag: "Most Gifted",
  },
  {
    num: "02",
    title: "Corporate Gifts",
    description: "Prestige gifts that make clients remember your name.",
    href: `/occasions/${slugify("Corporate Gifting")}`,
    tag: "Bulk Orders",
  },
  {
    num: "03",
    title: "Anniversary Gifts",
    description: "A statement of devotion, beautifully boxed.",
    href: `/occasions/${slugify("Anniversary Gifts")}`,
    tag: "Romantic",
  },
  {
    num: "04",
    title: "Luxury Hampers",
    description: "Curated collections of the finest artisanal goods.",
    href: "/shop",
    tag: "Signature",
  },
  {
    num: "05",
    title: "Festive Gifts",
    description: "Designed for life's most meaningful celebrations.",
    href: `/occasions/${slugify("Eid Gifts")}`,
    tag: "Trending",
  },
  {
    num: "06",
    title: "Wellness Rituals",
    description: "Gifted calm — for the ones who deserve it most.",
    href: "/shop",
    tag: "New Arrival",
  },
];

export function CollectionsTypographySection() {
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: "-8% 0px" });

  return (
    <section
      aria-label="Handpicked gift collections"
      className="relative overflow-hidden border-t border-white/6 bg-gradient-to-b from-[#0d0c09] to-[#0b0b0b] py-28"
    >
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div
        ref={headingRef}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {/* ── Section header ── */}
        <div className="mb-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-eyebrow mb-4"
            >
              Browse by Occasion
            </motion.p>

            {/* Main heading — Playfair Display */}
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "110%", opacity: 0 }}
                animate={inView ? { y: 0, opacity: 1 } : {}}
                transition={{
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.08,
                }}
                className="text-balance leading-[1.05] text-white"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontWeight: 700,
                  fontSize: "clamp(2.2rem, 5vw, 4rem)",
                  letterSpacing: "-0.01em",
                }}
              >
                Handpicked Collections
              </motion.h2>
            </div>

            {/* Italic serif subtext */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
              className="mt-3 text-lg italic text-white/40"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              Simple and elegant — for every occasion.
            </motion.p>
          </div>

          {/* Right — view all link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-white/40 transition hover:text-gold"
              style={{ fontFamily: "var(--font-body)" }}
            >
              View all gifts
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {/* ── Collection grid ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col, i) => (
            <motion.div
              key={col.num}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.65,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.12 + i * 0.07,
              }}
            >
              <Link
                href={col.href}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-white/8 bg-white/[0.025] p-7 backdrop-blur-sm transition-all duration-500 hover:border-gold/30 hover:bg-white/[0.04]"
              >
                {/* Gold top accent on hover */}
                <span className="absolute inset-x-0 top-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-gold/60 to-transparent transition-transform duration-500 group-hover:scale-x-100" />

                <div className="flex items-start justify-between">
                  {/* Decorative numeral — Playfair Display */}
                  <span
                    className="select-none text-5xl font-bold leading-none text-white/8 transition-colors duration-500 group-hover:text-gold/20"
                    style={{ fontFamily: "var(--font-serif)" }}
                    aria-hidden="true"
                  >
                    {col.num}
                  </span>

                  {/* Tag badge */}
                  <span
                    className="rounded-sm border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 transition-colors duration-300 group-hover:border-gold/30 group-hover:text-gold/60"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {col.tag}
                  </span>
                </div>

                {/* Gift icon */}
                <Gift className="mt-5 size-5 text-white/25 transition-colors duration-300 group-hover:text-gold/50" />

                {/* Collection name — Inter semibold */}
                <h3
                  className="mt-3 text-lg font-semibold text-white/80 transition-colors duration-300 group-hover:text-white"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {col.title}
                </h3>

                {/* Description */}
                <p
                  className="mt-2 text-sm leading-6 text-white/38 transition-colors duration-300 group-hover:text-white/55"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {col.description}
                </p>

                {/* CTA row */}
                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-gold/0 transition-all duration-500 group-hover:text-gold">
                  <span style={{ fontFamily: "var(--font-body)" }}>
                    Explore
                  </span>
                  <ArrowRight className="size-3 -translate-x-2 opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
