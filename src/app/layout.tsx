import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import { ProductsProvider } from "@/context/products-context";
import { LenisProvider } from "@/components/layout/lenis-provider";
import { PreloaderManager } from "@/components/layout/preloader-manager";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "LuxeGift | Luxury Gift Experiences",
    template: "%s | LuxeGift",
  },
  description:
    "A premium luxury gift shopping experience with curated products, custom gift boxes, and cinematic 3D presentation.",
  openGraph: {
    title: "LuxeGift | Luxury Gift Experiences",
    description:
      "Curated luxury gifts, interactive gift-box building, and elegant checkout for memorable occasions.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <LenisProvider>
          <AuthProvider>
            <ProductsProvider>
              <CartProvider>
                {/* Global premium overlays and deferred layout mounting */}
                <PreloaderManager>{children}</PreloaderManager>
              </CartProvider>
            </ProductsProvider>
          </AuthProvider>
        </LenisProvider>
        <Toaster
          theme="dark"
          position="top-right"
          visibleToasts={1}
          duration={2500}
          toastOptions={{
            style: {
              background: "#141210",
              border: "1px solid rgba(212, 175, 55, 0.28)",
              color: "#ffffff",
              fontFamily: "var(--font-body, 'Inter', sans-serif)",
              fontSize: "13px",
              borderRadius: "8px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.08)",
              backdropFilter: "blur(18px)",
            },
            classNames: {
              toast: "luxury-toast",
              title: "luxury-toast-title",
              description: "luxury-toast-description",
              actionButton: "luxury-toast-action",
              cancelButton: "luxury-toast-cancel",
            },
          }}
        />
      </body>
    </html>
  );
}
