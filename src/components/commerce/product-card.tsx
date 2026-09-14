"use client";

import Link from "next/link";
import { ArrowUpRight, Heart, Star, ShoppingBag } from "lucide-react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Product } from "@/lib/data";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { TiltCard } from "@/components/commerce/tilt-card";

export function ProductCard({ product }: { product: Product }) {
  const { toggleWishlist, isInWishlist, addToCart } = useCart();
  const isWished = isInWishlist(product.id);

  const heartScale = useSpring(1, { damping: 10, stiffness: 400 });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      category: product.category,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    // Spring burst animation on toggle
    heartScale.set(1.5);
    setTimeout(() => heartScale.set(1), 220);
    toggleWishlist(product.id);
  };

  return (
    <TiltCard maxTilt={7}>
      <article
        className={cn(
          "group flex flex-col justify-between overflow-hidden rounded-xl",
          "border border-white/10 bg-white/[0.04] backdrop-blur-sm",
          "shadow-[0_2px_24px_rgba(0,0,0,0.3)]",
          "transition-shadow duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.55)]"
        )}
      >
        <Link href={`/products/${product.slug}`} className="block" data-cursor-explore="">
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900">
            {product.image.startsWith("/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-106"
              />
            ) : (
              <div className="h-full w-full" style={{ background: product.image }} />
            )}

            {/* Cinematic overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

            {/* Gold edge shimmer on hover */}
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, transparent 50%, rgba(212,175,55,0.05) 100%)"
              }}
            />

            {/* Tags */}
            <div className="absolute left-3 top-3 flex gap-1.5">
              {product.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-black/65 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/80 backdrop-blur-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Link>

        <div className="flex flex-1 flex-col justify-between p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-gold">{product.category}</p>
                <h3 className="mt-1.5 text-base font-semibold leading-snug text-white transition-colors group-hover:text-gold-soft">
                  {product.name}
                </h3>
              </div>

              {/* Wishlist — spring burst heart */}
              <button
                onClick={handleWishlist}
                className={cn(
                  "rounded-md border border-white/12 p-2 text-white/60 transition-colors hover:border-gold hover:text-gold",
                  isWished && "border-gold bg-gold/10 text-gold"
                )}
                aria-label="Toggle wishlist"
              >
                <motion.div style={{ scale: heartScale }}>
                  <Heart className={cn("size-4", isWished && "fill-gold")} />
                </motion.div>
              </button>
            </div>
            <p className="line-clamp-2 text-xs leading-5 text-white/48">{product.description}</p>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/6 pt-4">
            <div>
              <p className="text-sm font-semibold text-white">{formatPrice(product.price)}</p>
              {product.compareAt && (
                <p className="text-[10px] text-white/30 line-through">{formatPrice(product.compareAt)}</p>
              )}
              <p className="mt-0.5 flex items-center gap-1 text-[9px] text-white/38">
                <Star className="size-2.5 fill-gold text-gold" /> {product.rating} ({product.reviews} reviews)
              </p>
            </div>
            <div className="flex gap-1.5">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="h-9 px-3"
                aria-label={`Add ${product.name} to cart`}
                data-cursor-add=""
              >
                <ShoppingBag className="size-3.5" />
              </Button>
              <Button asChild variant="outline" className="h-9 px-3">
                <Link href={`/products/${product.slug}`} aria-label={`View ${product.name}`} data-cursor-explore="">
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </TiltCard>
  );
}
