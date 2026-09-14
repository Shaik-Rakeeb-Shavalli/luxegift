"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, ArrowRight, CheckCircle2, Phone, Mail, Lock, UserCircle2 } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";

export default function CustomerLoginPage() {
  const [tab, setTab] = useState<"signin" | "register">("signin");

  // Sign In fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const { user, loginCustomer, registerCustomer, logout } = useAuth();
  const router = useRouter();

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;
    setIsLoading(true);
    const ok = await loginCustomer(signInEmail, signInPassword);
    setIsLoading(false);
    if (ok) {
      toast.success(`Welcome back to LuxeGift!`);
      router.push("/");
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail || !regMobile.trim() || !regPassword) return;

    // Basic mobile validation
    const mobileClean = regMobile.replace(/\s/g, "");
    if (mobileClean.length < 10) {
      toast.error("Please enter a valid mobile number.");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    const ok = await registerCustomer(regName.trim(), regEmail, regPassword, regMobile.trim());
    setIsLoading(false);
    if (ok) {
      toast.success(`Welcome to LuxeGift, ${regName.trim()}!`);
      router.push("/");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-gold focus:outline-none transition";
  const labelClass =
    "block text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2";

  return (
    <SiteShell>
      <Section className="py-16 sm:py-24">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex size-12 items-center justify-center rounded-xl border border-gold/40 bg-gold/12 mb-3">
              <User className="size-6 text-gold" />
            </div>
            <p className="editorial-eyebrow mb-2">Private Client Access</p>
            <h1
              className="text-3xl font-bold text-white tracking-tight"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              The Atelier Client Member
            </h1>
            <p className="mt-2 text-sm text-white/55">
              Access your personalized occasion reminders, curated wishlists, and order tracking logs.
            </p>
          </div>

          {/* Already logged in */}
          {user && user.role === "customer" ? (
            <div className="rounded-2xl border border-gold/30 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
              <CheckCircle2 className="mx-auto size-10 text-gold mb-3" />
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-serif)" }}>
                Signed in as {user.name}
              </h2>
              <p className="text-xs text-white/50 mt-1">{user.email}</p>
              <div className="mt-6 flex flex-col gap-3">
                <Button asChild className="w-full font-semibold">
                  <Link href="/">Return to Home Page</Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-white/20 text-white">
                  <Link href="/account">My Account &amp; Order History</Link>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    toast.info("Signed out successfully.");
                  }}
                  className="mt-2 text-xs text-red-400 hover:underline cursor-pointer"
                >
                  Sign Out of Account
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl">
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-6">
                <button
                  type="button"
                  id="tab-signin"
                  onClick={() => setTab("signin")}
                  className={`py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    tab === "signin"
                      ? "bg-gold text-black font-bold shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="tab-register"
                  onClick={() => setTab("register")}
                  className={`py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    tab === "register"
                      ? "bg-gold text-black font-bold shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Sign In Form */}
              {tab === "signin" ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="signin-email" className={labelClass}>
                      <Mail className="inline size-3 mr-1 mb-0.5" />
                      Email Address
                    </label>
                    <input
                      id="signin-email"
                      type="email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="client@example.com"
                      required
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="signin-password" className={labelClass}>
                      <Lock className="inline size-3 mr-1 mb-0.5" />
                      Password
                    </label>
                    <input
                      id="signin-password"
                      type="password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                      className={inputClass}
                    />
                  </div>

                  <Button
                    type="submit"
                    id="btn-signin"
                    disabled={isLoading}
                    className="w-full py-6 mt-4 font-bold text-sm disabled:opacity-60"
                  >
                    {isLoading ? "Signing In..." : (
                      <>Sign In to Atelier Account <ArrowRight className="size-4 ml-1.5" /></>
                    )}
                  </Button>

                  <p className="text-center text-xs text-white/40 mt-2">
                    New here?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("register")}
                      className="text-gold hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </p>
                </form>
              ) : (
                /* Create Account Form */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label htmlFor="reg-name" className={labelClass}>
                      <UserCircle2 className="inline size-3 mr-1 mb-0.5" />
                      Full Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Your full name"
                      required
                      autoComplete="name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-email" className={labelClass}>
                      <Mail className="inline size-3 mr-1 mb-0.5" />
                      Email Address
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="client@example.com"
                      required
                      autoComplete="email"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-mobile" className={labelClass}>
                      <Phone className="inline size-3 mr-1 mb-0.5" />
                      Mobile Number
                    </label>
                    <input
                      id="reg-mobile"
                      type="tel"
                      value={regMobile}
                      onChange={(e) => setRegMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      autoComplete="tel"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-password" className={labelClass}>
                      <Lock className="inline size-3 mr-1 mb-0.5" />
                      Create Password
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className={inputClass}
                    />
                  </div>

                  <Button
                    type="submit"
                    id="btn-register"
                    disabled={isLoading}
                    className="w-full py-6 mt-4 font-bold text-sm disabled:opacity-60"
                  >
                    {isLoading ? "Creating Account..." : (
                      <>Create Atelier Account <ArrowRight className="size-4 ml-1.5" /></>
                    )}
                  </Button>

                  <p className="text-center text-xs text-white/40 mt-2">
                    Already a member?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("signin")}
                      className="text-gold hover:underline cursor-pointer"
                    >
                      Sign in here
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </Section>
    </SiteShell>
  );
}
