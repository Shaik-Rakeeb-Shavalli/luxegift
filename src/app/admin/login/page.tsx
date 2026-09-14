"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowRight, Sparkles, KeyRound } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { loginAdmin } = useAuth();
  const router = useRouter();

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const success = loginAdmin(email, password);
    if (success) {
      toast.success("Welcome back, Master Curator.");
      router.push("/admin");
    } else {
      setError("Invalid admin credentials. Please use default admin login credentials.");
      toast.error("Access denied. Invalid admin credentials.");
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@luxegift.com");
    setPassword("admin123");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#08080a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(212,175,55,0.12),transparent_70%)] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#12100c] border border-gold/30 rounded-2xl p-8 sm:p-10 shadow-[0_0_60px_rgba(212,175,55,0.15)] backdrop-blur-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold/15 mb-4 shadow-[0_0_25px_rgba(212,175,55,0.3)]">
            <ShieldCheck className="size-7 text-gold" />
          </div>
          <p className="editorial-eyebrow mb-2">Internal Security Portal</p>
          <h1
            className="text-2xl sm:text-3xl font-bold text-white tracking-wide"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Admin Vault Portal
          </h1>
          <p className="mt-2 text-xs text-white/50">
            Sign in to access order curation, catalog management, and storefront analytics.
          </p>
        </div>

        {/* Demo Credentials Quick Fill Box */}
        <div className="mb-6 rounded-xl border border-gold/25 bg-gold/10 p-3.5 flex items-center justify-between">
          <div className="text-xs">
            <p className="font-semibold text-gold flex items-center gap-1.5">
              <KeyRound className="size-3.5" /> Demo Admin Access
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">admin@luxegift.com / admin123</p>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-[11px] font-bold uppercase tracking-wider text-gold hover:underline cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@luxegift.com"
              required
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-gold focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">
              Admin Vault Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-gold focus:outline-none transition"
            />
          </div>

          <Button type="submit" className="w-full py-6 mt-6 font-bold text-sm">
            Authenticate & Access Vault <ArrowRight className="size-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <Link href="/" className="text-xs text-white/40 hover:text-white transition">
            &larr; Return to Public Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
