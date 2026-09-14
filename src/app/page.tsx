import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { HeroSlider } from "@/components/layout/hero-slider";
import { EditorialStrip } from "@/components/layout/editorial-strip";
import { InfiniteMarquee } from "@/components/layout/infinite-marquee";
import { BentoSection } from "@/components/layout/bento-section";
import { BrandStorySection } from "@/components/layout/brand-story-section";
import { CollectionOrbitCarousel } from "@/components/layout/collection-orbit-carousel";
import { CollectionsTypographySection } from "@/components/layout/collections-typography-section";
import { Section, SectionHeading } from "@/components/layout/section";
import { SplitText } from "@/components/layout/split-text";
import { MagneticButton } from "@/components/layout/magnetic-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { benefits, products } from "@/lib/data";
import { productJsonLd } from "@/lib/seo";
import { ScrollSequenceSection } from "@/components/layout/scroll-sequence-section";

export default function Home() {
  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd()) }} />

      {/* ── 0. Scrollytelling intro — cinematic frame sequence ── */}
      <ScrollSequenceSection />

      {/* ── 1. Full-viewport auto-sliding hero banners ── */}
      <HeroSlider />

      {/* ── 2. Luxury editorial brand statement strip ── */}
      <EditorialStrip />

      {/* ── 3. Infinite brand marquee ── */}
      <InfiniteMarquee />

      {/* ── 4. Trust bar ── */}
      <div className="border-b border-white/8 bg-white/[0.018] py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 sm:px-6 lg:px-8">
          {["3D Preview Before Checkout", "Guest Checkout", "Occasion Reminders", "White-Glove Packaging"].map(
            (item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-white/50">
                <CheckCircle2 className="size-3.5 text-gold" />
                {item}
              </div>
            )
          )}
        </div>
      </div>

      {/* ── 5. Benefits (scroll-triggered stagger) ── */}
      <Section className="pt-16 pb-0">
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.slice(0, 3).map((benefit) => (
            <Card key={benefit.title}>
              <benefit.icon className="size-6 text-gold" />
              <h2 className="mt-5 text-xl font-semibold">{benefit.title}</h2>
              <p className="mt-3 leading-7 text-white/58">{benefit.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── 6. Premium 3D revolving collection orbit carousel ── */}
      {/* 120px top spacing before the carousel (24px wrapper + 96px carousel padding) */}
      <div className="pt-[24px] relative">
        <CollectionOrbitCarousel
          products={products}
          speed={18}
          autoPlay
          pauseOnHover
        />
        {/* Subtle gold ambient glow at the bottom transitioning into the Bento grid */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.08),transparent_70%)]" />
      </div>

      {/* ── 7. Apple bento editorial grid ("The Atelier Experience") ── */}
      {/* 96px spacing between carousel bottom (pb-24) and Bento text (pt-0).
          Includes a complementary subtle top gold gradient overlay. */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.05),transparent_70%)]" />
        <BentoSection className="pt-0" />
      </div>

      {/* ── 8. Brand story — cinematic editorial full-width ── */}
      <BrandStorySection />

      {/* ── 9. Handpicked collections with premium typography ── */}
      <CollectionsTypographySection />

      {/* ── 10. Split-text headline section ── */}
      <Section className="border-t border-white/6">
        <div className="mb-12">
          <SplitText
            text="Crafted for high-converting luxury shopping."
            tag="h2"
            mode="words"
            serif
            className="max-w-3xl mx-auto text-center text-balance leading-[1.1] text-white text-3xl sm:text-4xl lg:text-5xl"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {benefits.slice(3).map((benefit) => (
            <Card key={benefit.title} className="text-center">
              <benefit.icon className="mx-auto size-6 text-gold" />
              <h2 className="mt-5 text-xl font-semibold">{benefit.title}</h2>
              <p className="mt-3 leading-7 text-white/58">{benefit.text}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ── 11. Editorial CTA strip ── */}
      <section className="relative overflow-hidden border-t border-white/8 bg-gradient-to-b from-[#0d0b00] to-[#0b0b0b] py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,175,55,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl px-4">
          <p className="editorial-eyebrow mb-4">
            Begin the Experience
          </p>
          {/* Gold rule above headline */}
          <div className="gold-rule mx-auto mb-8 max-w-xs" />
          <SplitText
            text={"Every gift tells a story.\nLet us help you tell yours."}
            tag="h2"
            mode="lines"
            serif
            delay={0.05}
            className="text-white text-4xl font-bold leading-[1.15] sm:text-5xl"
          />
          <p
            className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/50"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Build a bespoke box, explore our curated collection, or let the AI find the perfect match.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton>
              <Button asChild className="shadow-[0_0_32px_rgba(212,175,55,0.3)]" data-cursor-build="">
                <Link href="/gift-box-builder">Build a Gift Box</Link>
              </Button>
            </MagneticButton>
            <MagneticButton>
              <Button asChild variant="outline" data-cursor-explore="">
                <Link href="/shop">Explore Collection</Link>
              </Button>
            </MagneticButton>
          </div>
          {/* Decorative ornament */}
          <div className="mx-auto mt-12 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="size-1 rounded-full bg-gold/30" />
            <span className="size-1.5 rounded-full bg-gold/50" />
            <span className="size-2 rounded-full bg-gold/70" />
            <span className="size-1.5 rounded-full bg-gold/50" />
            <span className="size-1 rounded-full bg-gold/30" />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
