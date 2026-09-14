"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Section, SectionHeading } from "@/components/layout/section";
import { ProductCard } from "@/components/commerce/product-card";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { useProducts } from "@/context/products-context";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  { value: "featured",   label: "Featured",          icon: "✦" },
  { value: "price-asc",  label: "Price: Low to High", icon: "↑" },
  { value: "price-desc", label: "Price: High to Low", icon: "↓" },
  { value: "rating",     label: "Top Rated",          icon: "★" },
];

export default function ShopPage() {
  const { products, isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(20000);

  // Derive categories from live products
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))).sort(),
    [products]
  );

  // Filter and sort products dynamically
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.description.toLowerCase().includes(search.toLowerCase()) ||
          product.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
        
        const matchesCategory =
          selectedCategory === "All" || product.category === selectedCategory;

        const matchesPrice = product.price <= maxPrice;

        return matchesSearch && matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return a.price - b.price;
        if (sortBy === "price-desc") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return b.reviews - a.reviews;
      });
  }, [products, search, selectedCategory, sortBy, maxPrice]);

  return (
    <SiteShell>
      <Section>
        <SectionHeading
          title="Shop Curated Luxury Gifts."
          text="Search, filter, and compare premium gifts designed for memorable unboxing moments."
        />

        {/* Loading skeleton while Firestore snapshot arrives */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden animate-pulse">
                <div className="h-56 bg-white/5" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                  <div className="h-4 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <label className="flex h-12 items-center gap-3 rounded-md border border-white/12 bg-white/[0.04] px-4 text-white/58 focus-within:border-gold transition-colors">
            <Search className="size-4 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-white outline-none placeholder:text-white/30 text-sm"
              placeholder="Search hampers, keepsakes, corporate gifts, keywords..."
            />
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex h-12 items-center gap-2 rounded-md border px-4 text-sm transition font-semibold cursor-pointer ${
                showFilters 
                  ? "border-gold bg-gold/10 text-gold" 
                  : "border-white/12 bg-white/[0.04] text-white hover:border-gold hover:text-gold"
              }`}
            >
              <SlidersHorizontal className="size-4" />
              <span>Filters</span>
            </button>

            {/* ── Premium Custom Sort Dropdown ── */}
            <div className="w-[180px]">
              <SelectDropdown
                id="sort-trigger"
                options={SORT_OPTIONS}
                value={sortBy}
                onChange={(val) => setSortBy(val as string)}
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Collapsible Price Range Filter */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-lg border border-white/12 bg-white/[0.02] p-5">
                <div className="max-w-md">
                  <div className="flex justify-between text-sm font-semibold text-white/80 mb-2">
                    <span>Maximum Price</span>
                    <span className="text-gold">
                      {maxPrice === 20000 ? "Any Price" : `Under ₹${maxPrice.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="20000"
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
                    <span>₹5,000</span>
                    <span>₹12,500</span>
                    <span>₹20,000+</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Filter Pills */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {["All", ...categories].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap rounded-md border px-4 py-2 text-xs font-semibold tracking-wider uppercase transition cursor-pointer ${
                selectedCategory === category
                  ? "border-gold bg-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.25)]"
                  : "border-white/12 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Dynamic Products Grid */}
        {filteredProducts.length > 0 ? (
          <motion.div 
            layout
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-white/6 bg-white/[0.01]">
            <p className="text-lg text-white/60">No luxury gifts match your filters.</p>
            <button 
              onClick={() => { setSearch(""); setSelectedCategory("All"); setMaxPrice(20000); }} 
              className="mt-4 text-sm font-semibold text-gold hover:text-gold-soft underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </Section>
    </SiteShell>
  );
}
