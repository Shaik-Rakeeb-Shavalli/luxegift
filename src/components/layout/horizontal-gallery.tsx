"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Star } from "lucide-react";
import { products } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { TiltCard } from "@/components/commerce/tilt-card";

export function HorizontalGallery() {
  const stripRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const inView = useInView(headingRef, { once: true, margin: "-8% 0px" });
  const { addToCart } = useCart();

  const scroll = (dir: "left" | "right") => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 340 : -340, behavior: "smooth" });
  };

  return (
    <section className="py-20" aria-label="Featured products gallery">
      {/* Heading row */}
      <div
        ref={headingRef}
        className="mx-auto mb-10 flex max-w-7xl items-end justify-between px-4 sm:px-6 lg:px-8"
      >
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0 }}
            className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gold"
          >
            Full Collection
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl font-semibold text-white sm:text-4xl"
          >
            Curated for every moment.
          </motion.h2>
        </div>

        {/* Arrow controls */}
        <div className="hidden items-center gap-2 sm:flex">
          <button
            onClick={() => scroll("left")}
            aria-label="Scroll gallery left"
            className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            aria-label="Scroll gallery right"
            className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 transition hover:border-gold/40 hover:text-gold"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll strip */}
      <div
        ref={stripRef}
        className="flex gap-5 overflow-x-auto px-4 pb-6 sm:px-6 lg:px-8"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            style={{ scrollSnapAlign: "start", flexShrink: 0 }}
            className="w-72"
          >
            <TiltCard maxTilt={6}>
              <article className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm">
                {/* Image */}
                <Link href={`/products/${product.slug}`} className="block" data-cursor-explore="">
                  <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {/* Tags */}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      {product.tags.slice(0, 1).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>

                {/* Info */}
                <div className="flex flex-col gap-3 p-5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gold">{product.category}</p>
                    <h3 className="mt-1 text-base font-semibold leading-snug text-white">{product.name}</h3>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/8 pt-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{formatPrice(product.price)}</p>
                      <p className="flex items-center gap-1 text-[9px] text-white/40">
                        <Star className="size-2.5 fill-gold text-gold" />
                        {product.rating} ({product.reviews})
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          addToCart({
                            id: product.id,
                            slug: product.slug,
                            name: product.name,
                            price: product.price,
                            quantity: 1,
                            image: product.image,
                            category: product.category,
                          })
                        }
                        data-cursor-add=""
                        aria-label={`Add ${product.name} to cart`}
                        className="flex size-8 items-center justify-center rounded-md border border-white/12 text-white/60 transition hover:border-gold hover:text-gold"
                      >
                        <ShoppingBag className="size-3.5" />
                      </button>
                      <Link
                        href={`/products/${product.slug}`}
                        data-cursor-explore=""
                        aria-label={`View ${product.name}`}
                        className="flex size-8 items-center justify-center rounded-md border border-white/12 text-white/60 transition hover:border-gold hover:text-gold"
                      >
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </TiltCard>
          </motion.div>
        ))}
      </div>

      {/* "View all" CTA */}
      <div className="mx-auto mt-8 max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 transition hover:text-gold"
          data-cursor-explore=""
        >
          View full collection <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
