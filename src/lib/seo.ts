import { products, slugify, occasions } from "@/lib/data";

export function productJsonLd() {
  return products.map((product) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
  }));
}

export function siteRoutes() {
  return [
    "",
    "shop",
    "gift-box-builder",
    "gift-finder",
    "checkout",
    "account",
    "admin",
    ...products.map((product) => `products/${product.slug}`),
    ...occasions.map((occasion) => `occasions/${slugify(occasion)}`),
  ];
}
