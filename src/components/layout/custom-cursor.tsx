"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

export function CustomCursor() {
  const [isTouch, setIsTouch] = useState<boolean | null>(null);
  const [label, setLabel] = useState("");
  const [isHovering, setIsHovering] = useState(false);

  // Springs for outer ring (laggy)
  const outerX = useSpring(0, { damping: 28, stiffness: 280, mass: 0.5 });
  const outerY = useSpring(0, { damping: 28, stiffness: 280, mass: 0.5 });

  // Springs for inner dot (snappy)
  const dotX = useSpring(0, { damping: 50, stiffness: 800 });
  const dotY = useSpring(0, { damping: 50, stiffness: 800 });

  useEffect(() => {
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(isCoarse);
    if (isCoarse) return;

    const onMove = (e: MouseEvent) => {
      outerX.set(e.clientX);
      outerY.set(e.clientY);
      dotX.set(e.clientX);
      dotY.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      let foundLabel = "";
      if (target.dataset.cursorAdd !== undefined) foundLabel = "Add";
      else if (target.dataset.cursorBuild !== undefined) foundLabel = "Build";
      else if (target.dataset.cursorExplore !== undefined) foundLabel = "Explore";
      else if (target.closest("a")) foundLabel = "View";
      else if (target.closest("button")) foundLabel = "Select";

      if (
        foundLabel ||
        target.closest("a") ||
        target.closest("button")
      ) {
        setIsHovering(true);
        setLabel(foundLabel);
      }
    };

    const onOut = () => {
      setIsHovering(false);
      setLabel("");
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
    };
  }, [outerX, outerY, dotX, dotY]);

  // Don't render on touch or SSR (null = not yet determined)
  if (isTouch || isTouch === null) return null;

  return (
    <>
      {/* Hide default cursor */}
      <style>{`* { cursor: none !important; }`}</style>

      {/* Outer ring — laggy, expands on hover */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[99999]"
        style={{
          x: outerX,
          y: outerY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          width: isHovering ? 52 : 20,
          height: isHovering ? 52 : 20,
        }}
        transition={{ type: "spring", damping: 22, stiffness: 320 }}
      >
        <div className="relative flex h-full w-full items-center justify-center rounded-full border border-gold/60 bg-gold/6 backdrop-blur-sm">
          {label && (
            <span className="absolute whitespace-nowrap text-[7px] font-bold uppercase tracking-[0.2em] text-gold">
              {label}
            </span>
          )}
        </div>
      </motion.div>

      {/* Inner dot — snappy */}
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[99999] size-[5px] rounded-full bg-gold"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
