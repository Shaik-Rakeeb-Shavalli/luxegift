"use client";

const WORDS = [
  "Crafted with Precision",
  "Bespoke Packaging",
  "Occasion-Aware Delivery",
  "White-Glove Gifting",
  "Live 3D Preview",
  "Gold-Standard Curation",
  "Personalized Notes",
  "Cinematic Unboxing",
  "Premium Experiences",
  "Artisanal Selection",
];

function MarqueeTrack() {
  return (
    <div className="flex shrink-0 items-center gap-0" aria-hidden="true">
      {WORDS.map((word, i) => (
        <span key={i} className="flex items-center gap-0">
          <span className="whitespace-nowrap px-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/38">
            {word}
          </span>
          <span className="size-1 rounded-full bg-gold/40" />
        </span>
      ))}
    </div>
  );
}

export function InfiniteMarquee() {
  return (
    <div
      className="relative w-full overflow-hidden border-y border-white/8 bg-white/[0.018] py-4"
      aria-label="Brand values"
    >
      {/* Left + right fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0b0b0b] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0b0b0b] to-transparent" />

      <div
        className="flex"
        style={{
          animation: "marquee 38s linear infinite",
          willChange: "transform",
        }}
      >
        <MarqueeTrack />
        <MarqueeTrack />
        <MarqueeTrack />
      </div>
    </div>
  );
}
