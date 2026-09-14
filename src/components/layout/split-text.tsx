"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  tag?: "h1" | "h2" | "h3" | "h4" | "p";
  /** Reveal mode: "words" (default), "chars", or "lines" */
  mode?: "words" | "chars" | "lines";
  /** Apply animated gold gradient to each revealed token */
  goldGradient?: boolean;
  /** Use Playfair Display serif font */
  serif?: boolean;
  /** Custom duration override */
  duration?: number;
  /** Viewport margin for trigger offset */
  margin?: string;
}

/** Cinematic cubic-bezier easing */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function Wrapper({
  tag,
  className,
  ariaLabel,
  children,
}: {
  tag: string;
  className?: string;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const Tag = tag as "h1";
  return (
    <Tag className={className} aria-label={ariaLabel}>
      {children}
    </Tag>
  );
}

export function SplitText({
  text,
  className,
  delay = 0,
  tag = "h2",
  mode = "words",
  goldGradient = false,
  serif = false,
  duration = 0.72,
  margin = "-10% 0px",
}: SplitTextProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sentinelRef, { once: true, margin: margin as never });

  const containerClass = cn(serif && "font-serif", className);

  // ── Words mode ──
  if (mode === "words") {
    const words = text.split(" ");
    return (
      <>
        <div ref={sentinelRef} aria-hidden="true" className="sr-only" />
        <Wrapper tag={tag} className={containerClass} ariaLabel={text}>
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden">
              <motion.span
                className={cn("inline-block", goldGradient && "gold-gradient-text")}
                initial={{ y: "115%", opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : { y: "115%", opacity: 0 }}
                transition={{
                  duration,
                  ease: EASE,
                  delay: delay + i * 0.06,
                }}
              >
                {word}&nbsp;
              </motion.span>
            </span>
          ))}
        </Wrapper>
      </>
    );
  }

  // ── Chars mode — letter-by-letter ──
  if (mode === "chars") {
    const chars = text.split("");
    return (
      <>
        <div ref={sentinelRef} aria-hidden="true" className="sr-only" />
        <Wrapper tag={tag} className={containerClass} ariaLabel={text}>
          {chars.map((char, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden"
              style={{ whiteSpace: char === " " ? "pre" : undefined }}
            >
              <motion.span
                className={cn("inline-block", goldGradient && "gold-gradient-text-static")}
                initial={{ y: "115%", opacity: 0, rotateX: -15 }}
                animate={
                  isInView
                    ? { y: 0, opacity: 1, rotateX: 0 }
                    : { y: "115%", opacity: 0, rotateX: -15 }
                }
                transition={{
                  duration: duration * 0.85,
                  ease: EASE,
                  delay: delay + i * 0.028,
                }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            </span>
          ))}
        </Wrapper>
      </>
    );
  }

  // ── Lines mode — line-by-line slide up ──
  const lines = text.split("\n");
  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="sr-only" />
      <Wrapper tag={tag} className={containerClass} ariaLabel={text}>
        {lines.map((line, i) => (
          <span key={i} className="block overflow-hidden">
            <motion.span
              className={cn("block", goldGradient && "gold-gradient-text")}
              initial={{ y: "115%", opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : { y: "115%", opacity: 0 }}
              transition={{
                duration,
                ease: EASE,
                delay: delay + i * 0.12,
              }}
            >
              {line}
            </motion.span>
          </span>
        ))}
      </Wrapper>
    </>
  );
}
