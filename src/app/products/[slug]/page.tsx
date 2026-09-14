"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Section } from "@/components/layout/section";
import { ProductDetailClient } from "@/components/commerce/product-detail-client";
import { useProducts } from "@/context/products-context";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { products, isLoading } = useProducts();

  if (isLoading) {
    return (
      <SiteShell>
        <Section className="py-12">
          <div className="animate-pulse flex flex-col gap-8 md:flex-row">
            <div className="h-80 w-full md:w-1/2 rounded-xl bg-white/5" />
            <div className="flex flex-col gap-4 flex-1">
              <div className="h-4 bg-white/10 rounded w-1/3" />
              <div className="h-8 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-full" />
              <div className="h-3 bg-white/10 rounded w-5/6" />
              <div className="h-10 bg-gold/20 rounded w-1/2 mt-4" />
            </div>
          </div>
        </Section>
      </SiteShell>
    );
  }

  const product = products.find((p) => p.slug === slug || p.id === slug);
  if (!product) notFound();

  return (
    <SiteShell>
      <Section className="py-12">
        <ProductDetailClient product={product} />
      </Section>
    </SiteShell>
  );
}