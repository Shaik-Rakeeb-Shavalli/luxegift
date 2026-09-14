"use client";

import { useState, useMemo } from "react";
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Star } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Section, SectionHeading } from "@/components/layout/section";
import { ProductCard } from "@/components/commerce/product-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { products } from "@/lib/data";
import { motion, AnimatePresence } from "framer-motion";

const questions = [
  {
    id: "recipient",
    title: "Who is the luxury gift for?",
    options: [
      { value: "partner", label: "Partner & Spouse", desc: "Romantic, intimate curation" },
      { value: "family", label: "Family member", desc: "Warmth, heritage keepsakes" },
      { value: "friend", label: "Friend & Colleague", desc: "Celebratory, social gifts" },
      { value: "client", label: "Corporate Client", desc: "Prestige, professional tone" },
    ],
  },
  {
    id: "occasion",
    title: "What is the occasion?",
    options: [
      { value: "Anniversary", label: "Anniversary & Valentine's", desc: "Romantic celebrations" },
      { value: "Birthday", label: "Birthday", desc: "Personalized milestone sets" },
      { value: "Wedding", label: "Wedding & Baby Shower", desc: "Keepsakes, family milestones" },
      { value: "Corporate", label: "Corporate & Professional", desc: "Prestige branding, client relations" },
      { value: "Festive", label: "Festive (Diwali/Eid/Christmas)", desc: "Traditional hosts, florals" },
    ],
  },
  {
    id: "budget",
    title: "What is your target budget?",
    options: [
      { value: "low", label: "Under ₹10,000", desc: "Curated keepsakes & wellness" },
      { value: "mid", label: "₹10,000 - ₹15,000", desc: "Signature hampers & personalized box options" },
      { value: "high", label: "Over ₹15,000", desc: "Limited executive obsidian vaults & anniversary cases" },
    ],
  },
  {
    id: "interest",
    title: "Select their core interest & vibe",
    options: [
      { value: "wellness", label: "Wellness & Self-Care", desc: "Aromatherapy, candles, oils" },
      { value: "confectionery", label: "Artisanal Confectionery", desc: "Layered date sweets, fine tea" },
      { value: "keepsake", label: "Personalized Memory Keepsakes", desc: "Initials engraving, chests" },
      { value: "executive", label: "Premium Corporate Prestige", desc: "Fine leather, Obsidian pens, notebooks" },
    ],
  },
];

export default function GiftFinderPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (questionId: string, value: string) => {
    setSelections((prev) => ({ ...prev, [questionId]: value }));
    
    // Automatically advance steps for fluid UX, except on the last step
    if (currentStep < questions.length - 1) {
      setTimeout(() => {
        setCurrentStep((c) => c + 1);
      }, 350);
    }
  };

  const handleNext = () => {
    if (currentStep === questions.length - 1) {
      setShowResults(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setSelections({});
    setCurrentStep(0);
    setShowResults(false);
  };

  // Algorithm to calculate matches
  const recommendedProducts = useMemo(() => {
    if (!showResults) return [];

    return products
      .map((product) => {
        let score = 0;

        // Occasion match
        const chosenOccasion = selections.occasion;
        if (chosenOccasion === "Anniversary" && product.occasion.some(o => o.includes("Anniversary") || o.includes("Valentine"))) {
          score += 40;
        } else if (chosenOccasion === "Birthday" && product.occasion.some(o => o.includes("Birthday"))) {
          score += 40;
        } else if (chosenOccasion === "Wedding" && product.occasion.some(o => o.includes("Wedding") || o.includes("Baby"))) {
          score += 40;
        } else if (chosenOccasion === "Corporate" && product.occasion.some(o => o.includes("Corporate") || o.includes("Christmas"))) {
          score += 40;
        } else if (chosenOccasion === "Festive" && product.occasion.some(o => o.includes("Eid") || o.includes("Diwali") || o.includes("Christmas"))) {
          score += 40;
        }

        // Budget match
        const chosenBudget = selections.budget;
        if (chosenBudget === "low" && product.price <= 10000) score += 30;
        else if (chosenBudget === "mid" && product.price > 10000 && product.price <= 15000) score += 30;
        else if (chosenBudget === "high" && product.price > 15000) score += 30;
        else score += 10; // Partial match

        // Interest / Vibe match
        const chosenInterest = selections.interest;
        if (chosenInterest === "wellness" && product.category === "Wellness Rituals") score += 30;
        else if (chosenInterest === "confectionery" && product.category === "Celebration Florals") score += 30;
        else if (chosenInterest === "keepsake" && product.category === "Personalized Keepsakes") score += 30;
        else if (chosenInterest === "executive" && product.category === "Corporate Prestige") score += 30;
        else if (product.category === "Signature Hampers") score += 15; // Universal fallback

        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Return top 3 matches
      .map(item => item.product);
  }, [showResults, selections]);

  const activeQuestion = questions[currentStep];
  const progressPercent = ((currentStep + 1) / questions.length) * 100;

  return (
    <SiteShell>
      <Section className="py-12">
        <SectionHeading
          title="AI Gift Finder."
          text="An editorial curation assistant that captures recipient details, budget boundaries, and interests to present bespoke selections."
          align="center"
        />

        <div className="mx-auto max-w-4xl mt-8">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="questionnaire"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {/* Progress bar */}
                <div className="mb-8 w-full bg-white/8 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-gold h-full transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <Card className="border-gold/10 p-6 sm:p-10">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-semibold tracking-widest text-gold uppercase">
                      Question {currentStep + 1} of {questions.length}
                    </span>
                    <Sparkles className="size-5 text-gold animate-pulse" />
                  </div>

                  <h2 className="text-xl sm:text-3xl font-semibold text-white leading-tight mb-8">
                    {activeQuestion.title}
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {activeQuestion.options.map((option) => {
                      const isSelected = selections[activeQuestion.id] === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleSelect(activeQuestion.id, option.value)}
                          className={`rounded-lg border p-5 text-left transition cursor-pointer flex flex-col gap-2 ${
                            isSelected 
                              ? "border-gold bg-gold/10 shadow-[0_0_15px_rgba(212,175,55,0.1)]" 
                              : "border-white/8 bg-white/[0.02] hover:border-white/20"
                          }`}
                        >
                          <span className="text-sm font-semibold text-white">{option.label}</span>
                          <span className="text-xs text-white/50 leading-relaxed">{option.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation Footer */}
                  <div className="mt-10 flex justify-between border-t border-white/8 pt-6">
                    <button
                      onClick={handleBack}
                      disabled={currentStep === 0}
                      className="flex items-center gap-2 text-xs font-semibold text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                    >
                      <ArrowLeft className="size-4" /> Back
                    </button>

                    <Button
                      onClick={handleNext}
                      disabled={!selections[activeQuestion.id]}
                    >
                      {currentStep === questions.length - 1 ? "Get Matches" : "Next Question"}
                      <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-8"
              >
                <div className="text-center">
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-gold/10 text-gold mb-4 border border-gold/20 shadow-md">
                    <Sparkles className="size-6" />
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-semibold text-white">Your Curated Recommendations</h2>
                  <p className="mt-3 text-sm text-white/60 max-w-xl mx-auto leading-relaxed">
                    Based on your requirements, our matching system has filtered and selected these three premium gift arrangements.
                  </p>
                </div>

                {/* Recommendations Grid */}
                <div className="grid gap-6 sm:grid-cols-3">
                  {recommendedProducts.map((product, index) => (
                    <div key={product.id} className="relative">
                      {index === 0 && (
                        <div className="absolute -top-3 left-4 z-10 flex items-center gap-1 rounded bg-gold px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-black shadow-lg">
                          <Star className="size-3 fill-black" />
                          Top Match
                        </div>
                      )}
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-4 mt-6 border-t border-white/8 pt-8">
                  <Button variant="outline" onClick={handleReset} className="cursor-pointer">
                    <RefreshCw className="size-4 mr-2" /> Start Over
                  </Button>
                  <Button asChild>
                    <a href="/shop">Explore Complete Shop</a>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Section>
    </SiteShell>
  );
}
