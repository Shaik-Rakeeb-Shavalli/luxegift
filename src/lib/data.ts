import { Gift, Heart, Sparkles, Star, Timer, Truck } from "lucide-react";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  occasion: string[];
  price: number;
  compareAt?: number;
  rating: number;
  reviews: number;
  tags: string[];
  color: string;
  image: string;
  description: string;
};

export const categories = [
  "Signature Hampers",
  "Personalized Keepsakes",
  "Corporate Prestige",
  "Celebration Florals",
  "Wellness Rituals",
];

export const occasions = [
  "Birthday Gifts",
  "Anniversary Gifts",
  "Wedding Gifts",
  "Baby Shower Gifts",
  "Corporate Gifts",
  "Eid Gifts",
  "Diwali Gifts",
  "Christmas Gifts",
  "Valentine's Gifts",
  "Personalized Gifts",
];

export const products: Product[] = [
  {
    id: "p1",
    slug: "midnight-atelier-box",
    name: "Midnight Atelier Box",
    category: "Signature Hampers",
    occasion: ["Anniversary Gifts", "Wedding Gifts", "Valentine's Gifts"],
    price: 12900,
    compareAt: 14900,
    rating: 4.9,
    reviews: 128,
    tags: ["Best Seller", "Customizable"],
    color: "#d4af37",
    image: "/images/midnight-atelier-box.png",
    description:
      "A cinematic black lacquer gift box with artisanal sweets, a handwritten card, and gold ribbon finishing.",
  },
  {
    id: "p2",
    slug: "aura-wellness-ritual",
    name: "Aura Wellness Ritual",
    category: "Wellness Rituals",
    occasion: ["Birthday Gifts", "Corporate Gifts", "Personalized Gifts"],
    price: 8600,
    rating: 4.8,
    reviews: 93,
    tags: ["New Arrival", "Calm"],
    color: "#f7f0df",
    image: "/images/aura-wellness-ritual.png",
    description:
      "An Aesop-inspired ritual set with candle, bath oil, linen spray, and a personalized brass nameplate.",
  },
  {
    id: "p3",
    slug: "imperial-date-confectionery",
    name: "Imperial Date Confectionery",
    category: "Celebration Florals",
    occasion: ["Eid Gifts", "Diwali Gifts", "Corporate Gifts"],
    price: 7400,
    rating: 4.7,
    reviews: 71,
    tags: ["Festive", "Trending"],
    color: "#7a5a20",
    image: "/images/imperial-date-confectionery.png",
    description:
      "Layered date confections, gold-foil florals, and a sculptural keepsake tray for festive hosting.",
  },
  {
    id: "p4",
    slug: "heritage-baby-memory-chest",
    name: "Heritage Baby Memory Chest",
    category: "Personalized Keepsakes",
    occasion: ["Baby Shower Gifts", "Personalized Gifts"],
    price: 11200,
    rating: 4.9,
    reviews: 54,
    tags: ["Personalized", "Keepsake"],
    color: "#ffffff",
    image: "/images/heritage-baby-memory-chest.png",
    description:
      "A white and gold memory chest with engraved initials, soft textile keepsakes, and photo-card inserts.",
  },
  {
    id: "p5",
    slug: "executive-obsidian-vault",
    name: "Executive Obsidian Vault",
    category: "Corporate Prestige",
    occasion: ["Corporate Gifts", "Christmas Gifts"],
    price: 18400,
    rating: 5,
    reviews: 42,
    tags: ["Premium", "Limited"],
    color: "#141414",
    image: "/images/executive-obsidian-vault.png",
    description:
      "A prestige client gift with fine leather desk objects, gourmet coffee, and a concealed message card.",
  },
  {
    id: "p6",
    slug: "rose-gold-anniversary-case",
    name: "Rose Gold Anniversary Case",
    category: "Signature Hampers",
    occasion: ["Anniversary Gifts", "Valentine's Gifts"],
    price: 15600,
    rating: 4.8,
    reviews: 86,
    tags: ["Romantic", "360 Preview"],
    color: "#e6b9a6",
    image: "/images/rose-gold-anniversary-case.png",
    description:
      "A rose-gold celebration case with preserved florals, fragrance, truffles, and a cinematic card reveal.",
  },
];

export const benefits = [
  { icon: Sparkles, title: "Cinematic Curation", text: "Editorial product journeys tuned for premium gifting." },
  { icon: Gift, title: "Live Gift Builder", text: "Build a bespoke box with real-time packaging preview." },
  { icon: Truck, title: "Scheduled Delivery", text: "Choose precise dates for birthdays, weddings, and festivals." },
  { icon: Heart, title: "Saved Occasions", text: "Remember moments and reorder with a single touch." },
  { icon: Timer, title: "Fast Checkout", text: "Guest checkout with coupons and payment-ready order flow." },
  { icon: Star, title: "White-Glove Finish", text: "Personal notes, wrapping styles, and premium unboxing." },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug || product.id === slug);
}

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
