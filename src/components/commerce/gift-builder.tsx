"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GiftBoxCanvas } from "@/components/three/gift-box-canvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { products } from "@/lib/data";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { Check, Image as ImageIcon, AlertCircle } from "lucide-react";

const steps = ["Packaging", "Products", "Handwritten Message", "Photo Memories", "Wrapping style", "Concierge Delivery"];
type BoxDesign = "obsidian" | "gold" | "velvet";
type BoxSize = "petite" | "signature" | "grande";
type WrappingStyle = "gold" | "crimson" | "midnight";

export function GiftBuilder() {
  const router = useRouter();
  const { addToCart } = useCart();

  // Builder States
  const [currentStep, setCurrentStep] = useState(0);
  const [boxDesign, setBoxDesign] = useState<BoxDesign>("obsidian");
  const [boxSize, setBoxSize] = useState<BoxSize>("signature");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [message, setMessage] = useState("For the moments that deserve to be remembered.");
  const [fontStyle, setFontStyle] = useState("serif");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [wrapping, setWrapping] = useState<WrappingStyle>("gold");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  // Box size configurations
  const sizeConfig = {
    petite: { label: "Petite Box", max: 2, price: 1200, desc: "Fits up to 2 premium products" },
    signature: { label: "Signature Box", max: 5, price: 1800, desc: "Fits up to 5 premium products" },
    grande: { label: "Grande Chest", max: 8, price: 2500, desc: "Fits up to 8 premium products" },
  };

  const activeSize = sizeConfig[boxSize];

  // Resolve selected products
  const selectedProducts = useMemo(() => {
    return products.filter((p) => selectedProductIds.includes(p.id));
  }, [selectedProductIds]);

  // Calculate pricing
  const boxPrice = activeSize.price;
  const productsPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const totalPrice = boxPrice + productsPrice;

  // Handle product selection toggle with limits
  const toggleProduct = (productId: string) => {
    const isSelected = selectedProductIds.includes(productId);
    if (isSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
      return;
    }

    if (selectedProductIds.length >= activeSize.max) {
      toast.warning(
        `Your ${activeSize.label} is at capacity. Upgrade to a larger size to add more items.`,
        { position: "bottom-center" }
      );
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (product) {
      toast.success(`Placed ${product.name} inside the box`);
    }
    setSelectedProductIds((prev) => [...prev, productId]);
  };

  const handlePhotoUpload = () => {
    // Simulate photo uploads
    if (photoUrls.length >= 3) {
      toast.info("A maximum of 3 prints can be added.");
      return;
    }
    const simulatedPhotos = [
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&q=80",
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80",
      "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&q=80"
    ];
    const newPhoto = simulatedPhotos[photoUrls.length];
    setPhotoUrls((prev) => [...prev, newPhoto]);
    toast.success("Memory photo card added to arrangement");
  };

  // Add custom built box to cart
  const handleAddToBasket = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Please add at least 1 product to your gift box.");
      setCurrentStep(1);
      return;
    }

    const boxItem = {
      id: `custom-box-${Date.now()}`,
      isCustomBox: true,
      name: `${activeSize.label} (${boxDesign.toUpperCase()})`,
      price: totalPrice,
      quantity: 1,
      image: `/images/midnight-atelier-box.png`, // Default luxury asset
      category: "Bespoke Gift Box",
      boxDesign,
      wrappingStyle: wrapping,
      giftMessage: message.trim() || undefined,
      photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      deliveryDate: deliveryDate || undefined,
      boxItems: selectedProducts.map(p => ({ product: p, quantity: 1 })),
    };

    const ok = addToCart(boxItem);
    if (ok) {
      router.push("/checkout");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      {/* Left Column: Floating 3D Preview */}
      <div className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
        <GiftBoxCanvas 
          open={currentStep >= 2} 
          boxDesign={boxDesign}
          wrappingStyle={wrapping}
          items={selectedProducts}
          className="h-[280px] sm:h-[420px] lg:h-[500px] xl:h-[560px]"
        />
        
        <Card className="border-gold/15 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Bespoke Arrangement Total</p>
              <p className="text-2xl font-semibold text-white mt-1">{formatPrice(totalPrice)}</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {activeSize.label} ({formatPrice(boxPrice)}) + {selectedProducts.length} Products ({formatPrice(productsPrice)})
              </p>
            </div>
            <Button onClick={handleAddToBasket} className="w-full sm:w-auto">Reserve Box</Button>
          </div>
        </Card>
      </div>

      {/* Right Column: Step-by-Step Configurator */}
      <div className="flex flex-col gap-6">
        {/* Stepper Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 hide-scrollbar">
          {steps.map((label, index) => (
            <button
              key={label}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "rounded-md border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition cursor-pointer flex items-center gap-1.5",
                currentStep === index 
                  ? "border-gold bg-gold text-black shadow-[0_0_10px_rgba(212,175,55,0.15)]" 
                  : "border-white/8 bg-white/[0.02] text-white/50 hover:text-white"
              )}
            >
              <span className="size-4 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">
                {index + 1}
              </span>
              <span>{label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Action Panel */}
        <Card className="flex flex-col gap-6">
          <div>
            <span className="text-[10px] font-semibold text-gold tracking-widest uppercase">
              Step {currentStep + 1} of {steps.length}
            </span>
            <h2 className="text-2xl font-semibold text-white mt-1">{steps[currentStep]}</h2>
          </div>

          {/* STEP 1: PACKAGING SELECT */}
          {currentStep === 0 && (
            <div className="flex flex-col gap-5">
              {/* Box Colors */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-white/80">Select Box Color & Material</p>
                <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { key: "obsidian" as const, label: "Classic Obsidian", desc: "Black lacquer", hex: "#0B0B0B" },
                    { key: "gold" as const, label: "Champagne Gold", desc: "Metallic foil", hex: "#D4AF37" },
                    { key: "velvet" as const, label: "Snowy Velvet", desc: "Linen finish", hex: "#F5F5F0" },
                  ].map((style) => (
                    <button
                      key={style.key}
                      onClick={() => setBoxDesign(style.key)}
                      className={cn(
                        "rounded-md border p-3 text-left transition cursor-pointer flex items-center sm:flex-col sm:items-start gap-3 sm:gap-2 w-full",
                        boxDesign === style.key 
                          ? "border-gold bg-gold/5" 
                          : "border-white/8 bg-white/[0.01] hover:border-white/20"
                      )}
                    >
                      <span className="size-4 rounded-full border border-white/25 flex-shrink-0" style={{ backgroundColor: style.hex }} />
                      <div>
                        <p className="text-xs font-semibold text-white">{style.label}</p>
                        <p className="text-[9px] text-white/40 mt-0.5">{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Box Sizes */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-white/80">Select Box Arrangement Capacity</p>
                <div className="flex flex-col gap-2">
                  {(Object.entries(sizeConfig) as [BoxSize, (typeof sizeConfig)[BoxSize]][]).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setBoxSize(key);
                        setSelectedProductIds([]); // Clear selection to prevent overflow
                      }}
                      className={cn(
                        "rounded-md border p-4 text-left transition cursor-pointer flex items-center justify-between",
                        boxSize === key ? "border-gold bg-gold/5" : "border-white/8 bg-white/[0.01] hover:border-white/20"
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{config.label}</p>
                        <p className="text-xs text-white/40 mt-1">{config.desc}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gold">{formatPrice(config.price)}</p>
                        <p className="text-[9px] text-white/30 mt-0.5">Packaging cost</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCTS SELECT */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gold/20 bg-gold/5 px-4 py-3 text-xs text-gold">
                <span className="flex items-center gap-2">
                  <AlertCircle className="size-4" />
                  Capacity: {selectedProductIds.length} of {activeSize.max} items added
                </span>
                <span>{activeSize.label}</span>
              </div>

              <div className="grid gap-3 max-h-[360px] overflow-y-auto pr-1">
                {products.map((product) => {
                  const isChecked = selectedProductIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={cn(
                        "rounded-md border p-3 flex items-center gap-4 cursor-pointer transition",
                        isChecked ? "border-gold bg-gold/5" : "border-white/8 bg-white/[0.01] hover:border-white/18"
                      )}
                    >
                      {/* Checkbox circle */}
                      <span className={cn(
                        "size-4 rounded-full border flex items-center justify-center transition",
                        isChecked ? "border-gold bg-gold text-black" : "border-white/20"
                      )}>
                        {isChecked && <Check className="size-2.5 stroke-[3]" />}
                      </span>

                      {/* Product details */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} className="size-12 rounded object-cover border border-white/8 bg-zinc-950" alt="" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">{product.name}</p>
                        <p className="text-[10px] text-gold mt-0.5 font-medium">{formatPrice(product.price)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: MESSAGE SELECT */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/80">Card handwritten style</label>
                <div className="flex gap-2">
                  {["serif", "sans", "cursive"].map((font) => (
                    <button
                      key={font}
                      onClick={() => setFontStyle(font)}
                      className={cn(
                        "flex-1 py-2 rounded-md border text-xs capitalize transition cursor-pointer font-semibold",
                        fontStyle === font ? "border-gold bg-gold/10 text-gold" : "border-white/8 bg-white/[0.01]"
                      )}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/80">Handwritten Greeting Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={cn(
                    "min-h-32 w-full rounded-md border border-white/12 bg-black/40 p-4 text-white outline-none focus:border-gold placeholder:text-white/20 resize-none leading-relaxed",
                    fontStyle === "cursive" && "font-serif italic tracking-wide text-lg",
                    fontStyle === "serif" && "font-serif",
                    fontStyle === "sans" && "font-sans"
                  )}
                  placeholder="Type your bespoke gift card message..."
                />
              </div>
            </div>
          )}

          {/* STEP 4: PHOTO MEMORIES */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-5">
              <p className="text-xs text-white/60 leading-relaxed">
                Add photo prints of cherished memories to be tucked inside the unboxing envelope for a highly personalized finish.
              </p>

              <div className="flex flex-wrap gap-3">
                {/* Upload Trigger */}
                <button
                  onClick={handlePhotoUpload}
                  className="flex size-24 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-white/20 bg-white/[0.01] hover:border-gold hover:bg-white/[0.03] transition cursor-pointer"
                >
                  <ImageIcon className="size-5 text-white/40" />
                  <span className="text-[10px] font-semibold text-white/60">Add photo</span>
                </button>

                {/* Simulated prints */}
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative size-24 rounded-md overflow-hidden border border-white/12 bg-zinc-900 group shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} className="w-full h-full object-cover" alt="" />
                    <button
                      onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-red-400 font-semibold opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/40">Supported formats: JPG, PNG • Max 3 photo prints</p>
            </div>
          )}

          {/* STEP 5: RIBBON WRAPPING */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-white/60">Choose the satin wrapping style and color scheme of the final ribbon closure.</p>
              <div className="flex flex-col gap-3">
                {[
                  { key: "gold" as const, label: "Champagne Gold Silk", desc: "Traditional luxury ribbon wrap", hex: "#D4AF37" },
                  { key: "crimson" as const, label: "Crimson Velvet Satin", desc: "Striking romantic wrap", hex: "#9B1C1C" },
                  { key: "midnight" as const, label: "Midnight Blue Satin", desc: "Corporate and elegant finish", hex: "#1E293B" },
                ].map((style) => (
                  <button
                    key={style.key}
                    onClick={() => setWrapping(style.key)}
                    className={cn(
                      "rounded-md border p-4 text-left transition cursor-pointer flex items-center gap-4",
                      wrapping === style.key ? "border-gold bg-gold/5" : "border-white/8 bg-white/[0.01] hover:border-white/20"
                    )}
                  >
                    <span className="size-5 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: style.hex }} />
                    <div>
                      <p className="text-xs font-semibold text-white">{style.label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{style.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: DELIVERY OPTIONS */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/80">Scheduled Delivery Date</label>
                <DatePicker
                  value={deliveryDate}
                  onChange={setDeliveryDate}
                  min={new Date().toISOString().split("T")[0]}
                  placeholder="Select delivery date"
                  className="h-11 text-sm"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-white/80">Special Delivery Instructions</label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="min-h-20 rounded-md border border-white/12 bg-black/45 p-3 text-sm text-white outline-none focus:border-gold placeholder:text-white/20 resize-none"
                  placeholder="e.g. Ring bell, deliver in morning, or call before delivery..."
                />
              </div>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="mt-4 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between border-t border-white/8 pt-5">
            <Button
              variant="outline"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)} className="w-full sm:w-auto">
                Continue
              </Button>
            ) : (
              <Button onClick={handleAddToBasket} className="w-full sm:w-auto">
                Add to Basket & Checkout
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
