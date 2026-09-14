"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogOut, Sparkles, Lock, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-gold text-sm font-semibold">
        <Sparkles className="size-5 animate-spin mr-2" />
        Verifying Admin Credentials...
      </div>
    );
  }

  // Security Lock: If not logged in as Admin, block access and show login gate
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#08080a] flex flex-col items-center justify-center p-4 text-center">
        <div className="size-16 rounded-full border border-gold/30 bg-gold/10 flex items-center justify-center mb-6">
          <Lock className="size-8 text-gold" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-serif)" }}>
          Admin Portal Access Restricted
        </h1>
        <p className="text-sm text-white/55 max-w-md mb-8">
          The Admin Atelier Workspace is reserved exclusively for authorized administrators. Please sign in with your admin credentials.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild className="px-6 font-semibold">
            <Link href="/admin/login">Admin Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="px-6 border-white/20 text-white">
            <Link href="/">Return to Public Storefront</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col">
      {/* ── Admin Top Navigation Header ── */}
      <header className="sticky top-0 z-50 border-b border-gold/20 bg-[#0d0c09]/95 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-md border border-gold/50 bg-gold/20">
                <ShieldCheck className="size-4 text-gold" />
              </span>
              <span
                className="gold-gradient-text-static text-lg tracking-[0.16em]"
                style={{ fontFamily: "var(--font-serif)", fontWeight: 700 }}
              >
                LUXEGIFT ADMIN
              </span>
            </Link>
            <span className="hidden sm:inline-block rounded bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold border border-gold/30">
              Prestige Vault Mode
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-white/60 hover:text-gold transition"
            >
              <ExternalLink className="size-3.5" />
              <span>View Live Storefront</span>
            </Link>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <p className="text-[10px] text-gold/70">{user.email}</p>
            </div>

            <Button
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              variant="outline"
              className="h-9 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs gap-1.5"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Admin Content ── */}
      <main className="flex-grow">{children}</main>

      {/* ── Dedicated Admin Footer ── */}
      <footer className="border-t border-white/8 bg-[#050507] py-6 px-4 text-center text-xs text-white/40">
        <p>LuxeGift Administrative Control Panel &copy; {new Date().getFullYear()} — Restricted Access</p>
      </footer>
    </div>
  );
}
