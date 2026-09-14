"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Bot, CalendarClock, Gift, Sparkles, Truck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MagneticButton } from "@/components/layout/magnetic-button";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.09 },
  }),
};

export interface BentoSectionProps {
  className?: string;
}

export function BentoSection({ className }: BentoSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      ref={ref}
      className={cn("mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8", className)}
      aria-label="Key features"
    >
      {/* Section label */}
      <motion.p
        custom={0}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={fadeUp}
        className="mb-3 editorial-eyebrow"
      >
        The Atelier Experience
      </motion.p>
      <motion.h2
        custom={1}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={fadeUp}
        className="mb-12 max-w-2xl leading-[1.05] text-white"
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 700,
          fontSize: "clamp(2rem, 4.5vw, 3.5rem)",
          letterSpacing: "-0.01em",
        }}
      >
        Every feature designed for the person who gives beautifully.
      </motion.h2>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2 lg:grid-cols-6">

        {/* 1 — 3D Box Builder (large, 3 cols) */}
        <motion.div
          custom={2}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeUp}
          className="group relative col-span-1 overflow-hidden rounded-xl border border-gold/25 bg-gradient-to-br from-[#1a1500] to-[#0d0d0d] p-7 md:col-span-3"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(212,175,55,0.14),transparent_60%)]" />
          <Gift className="size-8 text-gold" />
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.25em] text-gold/60">Signature Feature</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">Live 3D Gift Box Builder</h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
            Customize color, ribbon, and finish in real-time. Watch your gift take shape before a single click to checkout.
          </p>
          <MagneticButton className="mt-7">
            <Button asChild data-cursor-build="">
              <Link href="/gift-box-builder" className="flex items-center gap-2">
                Try the Builder <ArrowRight className="size-4" />
              </Link>
            </Button>
          </MagneticButton>
          {/* Decorative box art */}
          <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 translate-x-6 translate-y-6 rounded-full border border-gold/15 opacity-60 transition-transform duration-700 group-hover:-translate-x-2 group-hover:-translate-y-2" />
          <div className="pointer-events-none absolute bottom-8 right-8 h-20 w-20 rounded-full border border-gold/20 opacity-40" />
        </motion.div>

        {/* 2 — AI Finder (2 cols) */}
        <motion.div
          custom={3}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeUp}
          className="col-span-1 flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-7 backdrop-blur-sm md:col-span-2"
        >
          <Bot className="size-7 text-white/60" />
          <div>
            <h3 className="mt-4 text-xl font-semibold text-white">AI Gift Finder</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Answer 4 questions. Get 3 perfectly matched gifts, ranked by personality and occasion.
            </p>
            <Link
              href="/gift-finder"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-gold transition hover:gap-3"
              data-cursor-explore=""
            >
              Try the Finder <ArrowRight className="size-3" />
            </Link>
          </div>
        </motion.div>

        {/* 3 — Social proof stat (1 col) */}
        <motion.div
          custom={4}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeUp}
          className="col-span-1 flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.035] p-7"
        >
          <Users className="size-7 text-white/60" />
          <div>
            <p className="text-5xl font-bold text-white">12k+</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/40">
              Gifts Delivered
            </p>
          </div>
        </motion.div>

        {/* 4 — Occasion Reminders (2 cols) */}
        <motion.div
          custom={5}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeUp}
          className="col-span-1 flex flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-white/[0.035] p-7 md:col-span-2"
        >
          <CalendarClock className="size-7 text-white/60" />
          <div>
            <h3 className="mt-4 text-xl font-semibold text-white">Occasion Reminders</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Save birthdays, anniversaries, and festivals. Get notified before it&apos;s too late — never miss a moment.
            </p>
            <Link
              href="/account"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-gold transition hover:gap-3"
            >
              Set a Reminder <ArrowRight className="size-3" />
            </Link>
          </div>
        </motion.div>

        {/* 5 — White-glove delivery (2 cols) */}
        <motion.div
          custom={6}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeUp}
          className="col-span-1 flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.035] p-7 md:col-span-2"
        >
          <Truck className="size-7 text-white/60" />
          <div>
            <h3 className="mt-4 text-xl font-semibold text-white">White-Glove Delivery</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Scheduled precision delivery with premium wrapping and a personal handwritten note sealed inside.
            </p>
          </div>
        </motion.div>

        {/* 6 — Curation stat (2 cols) */}
        <motion.div
          custom={7}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={fadeUp}
          className="col-span-1 flex flex-col justify-between overflow-hidden rounded-xl border border-gold/20 bg-gold p-7 text-black md:col-span-2"
        >
          <Sparkles className="size-7" />
          <div>
            <p className="text-5xl font-bold">4.9★</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-black/50">
              Average Rating — 474 Reviews
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
