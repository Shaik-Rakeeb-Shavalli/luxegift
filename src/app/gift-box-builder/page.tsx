import { SiteShell } from "@/components/layout/site-shell";
import { Section, SectionHeading } from "@/components/layout/section";
import { GiftBuilder } from "@/components/commerce/gift-builder";

export const metadata = { title: "Build Your Own Gift Box" };

export default function GiftBoxBuilderPage() {
  return (
    <SiteShell>
      <Section>
        <SectionHeading
          title="Build your own gift box."
          text="Select packaging, products, message, photos, wrapping, and delivery date while the luxury box updates in 3D."
        />
        <GiftBuilder />
      </Section>
    </SiteShell>
  );
}
