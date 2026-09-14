"use client";

import { useState } from "react";
import { Preloader } from "./preloader";
import { CustomCursor } from "./custom-cursor";
import { ScrollProgress } from "./scroll-progress";

export function PreloaderManager({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {/* Cursor & scroll bar always outside any transformed container */}
      <CustomCursor />
      {!loading && <ScrollProgress />}

      {/*
        The website sits behind the overlay at all times.
        No entrance animation needed — the split-reveal IS the reveal.
        We only block pointer events while the intro plays.
      */}
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          pointerEvents: loading ? "none" : "auto",
          // Prevent scroll during intro
          overflow: loading ? "hidden" : "visible",
        }}
      >
        {children}
      </div>

      {/* Preloader overlay — sits on top via z-[9999] */}
      <Preloader onComplete={() => setLoading(false)} />
    </>
  );
}
