import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Section, SectionHeading } from "@/components/layout/section";
import { ProductCard } from "@/components/commerce/product-card";
import { occasions, products, slugify } from "@/lib/data";

export function generateStaticParams() {
  return occasions.map((occasion) => ({ slug: slugify(occasion) }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const occasion = occasions.find((item) => slugify(item) === slug);
  return { title: occasion ?? "Occasion Gifts" };
}

export default async function OccasionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const occasion = occasions.find((item) => slugify(item) === slug);
  if (!occasion) notFound();
  const matching = products.filter((product) => product.occasion.includes(occasion));

  return (
    <SiteShell>
      <Section>
        <SectionHeading
          title={occasion}
          text="SEO-friendly occasion collection pages with curated product matching, rich metadata, and conversion-focused product paths."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(matching.length ? matching : products.slice(0, 3)).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
