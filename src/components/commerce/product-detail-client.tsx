"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Edit3, Gift, Heart, HelpCircle, Truck } from "lucide-react";
import { ProductShowcaseViewer } from "./product-showcase-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Product } from "@/lib/data";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { motion, AnimatePresence } from "framer-motion";

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isWished = mounted ? isInWishlist(product.id) : false;

  // Customization States
  const [hasPersonalization, setHasPersonalization] = useState(false);
  const [wrapping, setWrapping] = useState<"gold" | "crimson" | "midnight">("gold");
  const [engraving, setEngraving] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = (buyNow = false) => {
    const cartItem = {
      id: hasPersonalization ? `${product.id}-${Date.now()}` : product.id, // Group identical non-customized items
      slug: product.slug,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      category: product.category,
      wrappingStyle: hasPersonalization ? wrapping : undefined,
      engravingText: (hasPersonalization && engraving.trim()) ? engraving.trim() : undefined,
      giftMessage: (hasPersonalization && message.trim()) ? message.trim() : undefined,
      deliveryDate: (hasPersonalization && deliveryDate) ? deliveryDate : undefined,
    };

    const ok = addToCart(cartItem);

    if (buyNow && ok) {
      router.push("/checkout");
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Product Showcase Island */}
      <div className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
        <ProductShowcaseViewer product={product} />
        <div className="flex justify-between items-center px-2">
          <p className="text-xs text-white/50">Hover and move mouse to inspect in 3D</p>
        </div>
      </div>

      {/* Details & Customizations */}
      <div className="flex flex-col gap-8">
        <div>
          <span className="text-xs uppercase tracking-[0.22em] text-gold font-semibold">
            {product.category}
          </span>
          <h1 className="mt-3 text-balance text-4xl font-semibold leading-tight sm:text-5xl text-white">
            {product.name}
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/60">{product.description}</p>
          
          <div className="mt-6 flex items-end gap-3">
            <span className="text-3xl font-semibold text-white">{formatPrice(product.price)}</span>
            {product.compareAt && (
              <span className="text-sm text-white/40 line-through pb-1">
                {formatPrice(product.compareAt)}
              </span>
            )}
          </div>
        </div>

        {/* Customization Atelier Form */}
        <Card className="flex flex-col gap-6 border-gold/20">
          <div className="flex items-center justify-between border-b border-white/8 pb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Personalization Atelier
              </h2>
              <p className="text-xs text-white/40 mt-0.5">Custom ribbon, engraving, and handwritten card (Optional)</p>
            </div>
            {/* Toggle switch */}
            <button
              role="switch"
              aria-checked={hasPersonalization}
              onClick={() => setHasPersonalization(!hasPersonalization)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black",
                hasPersonalization ? "bg-gold shadow-[0_0_10px_rgba(212,175,55,0.3)]" : "bg-white/10"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out",
                  hasPersonalization ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {hasPersonalization && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden flex flex-col gap-6"
              >
                {/* 1. Ribbon Styling */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
                    Ribbon Styling
                  </label>
                  <div className="flex gap-3">
                    {[
                      { key: "gold" as const, label: "Champagne Gold", hex: "#D4AF37" },
                      { key: "crimson" as const, label: "Crimson Satin", hex: "#9B1C1C" },
                      { key: "midnight" as const, label: "Midnight Velvet", hex: "#1E293B" },
                    ].map((style) => (
                      <button
                        key={style.key}
                        onClick={() => setWrapping(style.key)}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-2 rounded-md border py-2.5 text-xs font-semibold transition cursor-pointer",
                          wrapping === style.key
                            ? "border-gold bg-gold/10 text-gold shadow-[0_0_10px_rgba(212,175,55,0.1)]"
                            : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white"
                        )}
                      >
                        <span
                          className="size-3 rounded-full border border-white/10"
                          style={{ backgroundColor: style.hex }}
                        />
                        <span>{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Initials Engraving */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                      <Edit3 className="size-3.5 text-gold" />
                      Monogram Initials Engraving
                    </label>
                    <span className="text-[10px] text-white/40">Optional • Max 3 letters</span>
                  </div>
                  <input
                    type="text"
                    maxLength={3}
                    value={engraving}
                    onChange={(e) => setEngraving(e.target.value.toUpperCase())}
                    className="h-11 rounded-md border border-white/12 bg-black/40 px-3 text-sm text-white outline-none focus:border-gold placeholder:text-white/20"
                    placeholder="e.g. SRV"
                  />
                </div>

                {/* 3. Gift Card Message */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                      <Gift className="size-3.5 text-gold" />
                      Handwritten Gift Message
                    </label>
                    <span className="text-[10px] text-white/40">Optional • Placed inside envelope</span>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-20 rounded-md border border-white/12 bg-black/40 p-3 text-sm text-white outline-none focus:border-gold placeholder:text-white/20 resize-none"
                    placeholder="Write a warm note for the recipient..."
                  />
                </div>

                {/* 4. Scheduled Delivery */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-gold" />
                      Scheduled Delivery Date
                    </label>
                    <span className="text-[10px] text-white/40">Optional</span>
                  </div>
                  <DatePicker
                    value={deliveryDate}
                    onChange={setDeliveryDate}
                    min={new Date().toISOString().split("T")[0]}
                    placeholder="Select delivery date"
                    className="h-11 text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Quantity and Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-md border border-white/12 bg-white/[0.03] h-11">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 text-white/60 hover:text-white font-semibold cursor-pointer h-full"
              >
                -
              </button>
              <span className="px-2 text-sm font-semibold text-white w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 text-white/60 hover:text-white font-semibold cursor-pointer h-full"
              >
                +
              </button>
            </div>

            <button
              onClick={handleWishlist}
              className={cn(
                "flex h-11 items-center justify-center rounded-md border border-white/12 px-4 transition cursor-pointer",
                isWished ? "border-gold bg-gold/10 text-gold" : "text-white/60 hover:border-gold hover:text-gold"
              )}
            >
              <Heart className={cn("size-4 mr-2", isWished && "fill-gold")} />
              <span>{isWished ? "Saved" : "Save to Collection"}</span>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={() => handleAddToCart(false)} variant="outline" className="w-full">
              Add to Basket
            </Button>
            <Button onClick={() => handleAddToCart(true)} className="w-full">
              Reserve & Buy Now
            </Button>
          </div>
        </div>

        {/* White Glove Banner */}
        <div className="grid gap-3 sm:grid-cols-3 border-t border-white/8 pt-6">
          {[
            { icon: Truck, label: "Secure Shipping", text: "Insured courier network" },
            { icon: Gift, label: "Satin ribbon wrap", text: "Unboxing design standard" },
            { icon: HelpCircle, label: "White-Glove Help", text: "24/7 client concierge" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <item.icon className="size-4 text-gold" />
              <p className="text-xs font-semibold text-white">{item.label}</p>
              <p className="text-[10px] text-white/40 leading-snug">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
