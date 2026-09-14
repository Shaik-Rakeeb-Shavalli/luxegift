"use client";

import { useScroll, useSpring, motion } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed left-0 top-0 z-[9998] h-[2px] w-full origin-left bg-gradient-to-r from-gold via-gold-soft to-gold"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
}
