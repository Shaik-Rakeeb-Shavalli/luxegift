"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ShoppingBag, Sparkles, Heart, User } from "lucide-react";
import { occasions, slugify } from "@/lib/data";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

const nav = [
  ["Shop Collection", "/shop"],
  ["3D Box Builder", "/gift-box-builder"],
  ["AI Finder Helper", "/gift-finder"],
  ["Occasions Guide", `/occasions/${slugify(occasions[0])}`],
];

/* ─── Premium Nav Link with animated gold underline ───────────── */
function NavLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  const [hovered, setHovered] = useState(false);
  const showBar = active || hovered;
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex flex-col items-center gap-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300",
        active ? "text-gold" : "text-white/55 hover:text-white/90"
      )}
    >
      <span>{label}</span>
      <motion.span
        className="absolute -bottom-[18px] left-0 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent"
        initial={false}
        animate={{ scaleX: showBar ? 1 : 0, opacity: showBar ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ transformOrigin: "center" }}
      />
    </Link>
  );
}

export function SiteHeader() {
  const { cart, wishlist } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      toast.error("Please sign in first to proceed to checkout.");
      router.push("/login");
    }
  };

  useEffect(() => { setMounted(true); }, []);

  /* Scroll detection */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartItemsCount = mounted ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const wishlistCount  = mounted ? wishlist.length : 0;

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b bg-[#080706]/88 backdrop-blur-2xl shadow-[0_8px_48px_rgba(0,0,0,0.6)]"
          : "bg-transparent"
      )}
      style={{
        borderColor: scrolled ? "rgba(212,175,55,0.12)" : "transparent",
      }}
    >
      {/* ── Top gold accent hairline (always visible) ── */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

        {/* ── LOGO ────────────────────────────────────── */}
        <Link href="/" className="group flex items-center gap-3" aria-label="LuxeGift home">
          {/* Icon badge with glowing ring on hover */}
          <span className="relative flex size-9 items-center justify-center">
            {/* Outer glow ring */}
            <span className="absolute inset-0 rounded-lg border border-gold/20 bg-gold/6 transition-all duration-400 group-hover:border-gold/50 group-hover:bg-gold/12 group-hover:shadow-[0_0_18px_rgba(212,175,55,0.2)]" />
            <Sparkles className="relative size-4 text-gold transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
          </span>

          {/* Wordmark */}
          <span className="flex flex-col leading-none">
            <span
              className="gold-gradient-text text-[17px] tracking-[0.22em] font-black"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              LUXEGIFT
            </span>
            <span className="text-[7px] tracking-[0.35em] uppercase text-white/28 font-medium mt-0.5">
              Curated Luxury
            </span>
          </span>
        </Link>

        {/* ── DESKTOP NAV ─────────────────────────────── */}
        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map(([label, href]) => (
            <NavLink
              key={href}
              label={label}
              href={href}
              active={pathname === href || pathname.startsWith(href + "/")}
            />
          ))}
        </nav>

        {/* ── RIGHT ACTIONS ────────────────────────────── */}
        <div className="flex items-center gap-1">

          {/* Separator */}
          <span className="hidden sm:block h-4 w-px bg-white/10 mx-1" />

          {/* Wishlist */}
          <Link
            href="/account?tab=wishlist"
            aria-label="Wishlist"
            className={cn(
              "group relative hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-250",
              wishlistCount > 0
                ? "border-gold/30 bg-gold/8 text-gold"
                : "border-transparent text-white/45 hover:border-white/15 hover:bg-white/[0.05] hover:text-white/80"
            )}
          >
            <Heart
              className={cn(
                "size-[17px] transition-transform duration-200 group-hover:scale-110",
                wishlistCount > 0 && "fill-gold"
              )}
            />
            <AnimatePresence>
              {wishlistCount > 0 && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -right-1 -top-1 flex size-[14px] items-center justify-center rounded-full bg-gold text-[7px] font-black text-black shadow-[0_0_8px_rgba(212,175,55,0.5)]"
                >
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Account */}
          <Link
            href="/account"
            aria-label="Account"
            className="group hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-white/45 transition-all duration-250 hover:border-white/15 hover:bg-white/[0.05] hover:text-white/80"
          >
            <User className="size-[17px] transition-transform duration-200 group-hover:scale-110" />
          </Link>

          <span className="hidden sm:block h-4 w-px bg-white/10 mx-1" />

          {/* ── Checkout CTA — shimmer sweep ── */}
          <Link
            href="/checkout"
            onClick={handleCheckoutClick}
            id="header-checkout-cta"
            aria-label="Go to checkout"
            className="group relative hidden sm:flex items-center gap-2 overflow-hidden rounded-lg px-4 h-9 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, #b8962e 0%, #d4af37 40%, #f0d978 65%, #d4af37 100%)",
              backgroundSize: "200% 100%",
              boxShadow: "0 2px 16px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            {/* Shimmer sweep overlay */}
            <span
              className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-500 group-hover:translate-x-[100%]"
            />
            <ShoppingBag className="relative size-3.5" />
            <span className="relative">Checkout</span>
            <AnimatePresence>
              {cartItemsCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="relative ml-0.5 rounded-full bg-black/25 px-1.5 py-0.5 text-[9px] font-black text-black/80"
                >
                  {cartItemsCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 text-white/60 transition hover:border-gold/30 hover:text-gold lg:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMobileMenuOpen ? (
                <motion.span key="x"
                  initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}
                >
                  <X className="size-4" />
                </motion.span>
              ) : (
                <motion.span key="menu"
                  initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}
                >
                  <Menu className="size-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* ── Bottom gold hairline — appears on scroll ── */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* ══ MOBILE DRAWER ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/8 bg-[#080706]/96 backdrop-blur-2xl lg:hidden"
          >
            {/* Gold top hairline inside drawer */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

            <div className="flex flex-col px-5 py-4 gap-0.5">
              {nav.map(([label, href], i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                >
                  <Link
                    href={href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] border-b border-white/5 transition-colors last:border-b-0",
                      pathname === href ? "text-gold" : "text-white/55 hover:text-gold"
                    )}
                  >
                    <span>{label}</span>
                    {pathname === href && (
                      <span className="size-1 rounded-full bg-gold" />
                    )}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile-only account & wishlist */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28 }}
                className="flex items-center gap-3 pt-4 sm:hidden"
              >
                <Link
                  href="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/12 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white/55 transition hover:border-gold/30 hover:text-gold"
                >
                  <User className="size-3.5" />
                  Account
                </Link>
                <Link
                  href="/account?tab=wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-[11px] font-semibold uppercase tracking-widest transition",
                    wishlistCount > 0
                      ? "border-gold/30 bg-gold/8 text-gold"
                      : "border-white/12 text-white/55 hover:border-gold/30 hover:text-gold"
                  )}
                >
                  <Heart className={cn("size-3.5", wishlistCount > 0 && "fill-gold")} />
                  Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </Link>
              </motion.div>

              {/* Mobile checkout button */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34 }}
                className="pt-2 pb-1"
              >
                <Link
                  href="/checkout"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    handleCheckoutClick(e);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black transition-all"
                  style={{
                    background: "linear-gradient(135deg, #b8962e, #d4af37 50%, #f0d978)",
                    boxShadow: "0 4px 20px rgba(212,175,55,0.25)",
                  }}
                >
                  <ShoppingBag className="size-3.5" />
                  Checkout{cartItemsCount > 0 && ` · ${cartItemsCount}`}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-12 text-xs text-white/58">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p
            className="gold-gradient-text-static text-base tracking-[0.16em]"
            style={{ fontFamily: "var(--font-serif)", fontWeight: 700 }}
          >
            LUXEGIFT
          </p>
          <p
            className="mt-4 max-w-md leading-6"
            style={{ fontFamily: "var(--font-body)", color: "rgba(255,255,255,0.45)" }}
          >
            Premium gift curation, bespoke packaging builder, and occasion-aware tracking logs for modern luxury customers.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-white uppercase tracking-widest text-[10px]">Explore Atelier</p>
          {nav.slice(0, 4).map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-gold transition">
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-semibold text-white uppercase tracking-widest text-[10px]">Access Portals</p>
          <Link href="/login" className="hover:text-gold transition">
            Client Account Sign In
          </Link>
          <Link href="/admin/login" className="hover:text-gold transition flex items-center gap-1.5 text-gold/80 font-semibold">
            <span>Admin Vault Portal</span>
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gold/10 border border-gold/30">Restricted</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="luxury-shell min-h-screen flex flex-col justify-between">
      <SiteHeader />
      <main className="flex-grow pt-[70px]">{children}</main>
      <SiteFooter />
    </div>
  );
}

