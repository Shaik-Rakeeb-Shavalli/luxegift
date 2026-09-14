"use client";

import { FileCheck, Banknote, Boxes, Truck, PackageCheck, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  status: string;
  orderNumber: string;
  date?: string;
}

export type TimelineStep = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof FileCheck;
};

export const TIMELINE_STEPS: TimelineStep[] = [
  {
    id: "confirmed",
    title: "order confirmed",
    subtitle: "Order placed & verified in LuxeGift system",
    icon: FileCheck,
  },
  {
    id: "payment",
    title: "payment accepted",
    subtitle: "Payment authorized via Razorpay Gateway",
    icon: Banknote,
  },
  {
    id: "prepared",
    title: "order is being prepared",
    subtitle: "White-glove curation & luxury packaging at atelier",
    icon: Boxes,
  },
  {
    id: "shipped",
    title: "order has been shipped",
    subtitle: "Handed over to express courier logistics",
    icon: Truck,
  },
  {
    id: "delivered",
    title: "order successfully delivered",
    subtitle: "Hand-delivered to recipient address",
    icon: PackageCheck,
  },
];

/**
 * Returns active step index based on order status string
 */
export function getActiveStepIndex(status: string): number {
  const norm = (status || "").toUpperCase();
  if (norm === "DELIVERED") return 4;
  if (norm === "FULFILLED" || norm === "SHIPPED") return 3;
  if (norm === "PAID") return 2; // Order is being prepared
  if (norm === "PAYMENT_PENDING") return 0; // Order confirmed, payment pending
  return 2; // Default for active orders
}

export function OrderTimeline({ status, orderNumber, date }: OrderTimelineProps) {
  const activeStepIdx = getActiveStepIndex(status);
  const normStatus = (status || "").toUpperCase();
  const isFailedOrCancelled = normStatus === "CANCELLED" || normStatus === "PAYMENT_FAILED" || normStatus === "FAILED";

  return (
    <div className="w-full bg-black/40 border border-gold/20 rounded-xl p-5 sm:p-7 shadow-2xl backdrop-blur-md transition-all duration-300">
      <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold text-gold">Real-time Order Tracking</h4>
          <p className="text-sm font-semibold text-white mt-0.5">Reference: <span className="font-mono text-gold">{orderNumber}</span></p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase border",
            isFailedOrCancelled && "bg-red-500/10 text-red-400 border-red-500/20",
            (status === "DELIVERED" || status === "FULFILLED") && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            status === "PAID" && "bg-amber-500/10 text-gold border-gold/30",
            status === "PAYMENT_PENDING" && "bg-amber-500/10 text-amber-400 border-amber-500/20"
          )}
        >
          {status}
        </span>
      </div>

      {isFailedOrCancelled ? (
        <div className="py-8 text-center text-red-400 text-xs">
          {normStatus.includes("FAILED")
            ? "Payment for this order attempt failed or was declined by the bank. You can retry checkout with another payment method."
            : "This order was cancelled. Please contact concierge support if you have questions."}
        </div>
      ) : (
        <div className="flex flex-col gap-6 relative px-2 sm:px-4">
          {TIMELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= activeStepIdx;
            const isCurrent = idx === activeStepIdx;
            const isLast = idx === TIMELINE_STEPS.length - 1;

            return (
              <div key={step.id} className="grid grid-cols-[56px_36px_1fr] sm:grid-cols-[64px_44px_1fr] items-center gap-2 sm:gap-4 relative group">
                
                {/* 1. Left Icon illustration */}
                <div className="flex justify-center items-center">
                  <div
                    className={cn(
                      "size-11 sm:size-12 rounded-xl flex items-center justify-center border transition-all duration-300",
                      isCompleted
                        ? "border-gold/40 bg-gold/10 text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                        : "border-white/10 bg-white/[0.02] text-white/30"
                    )}
                  >
                    <Icon className={cn("size-6 sm:size-7 stroke-[1.5]", isCompleted ? "text-gold" : "text-white/30")} />
                  </div>
                </div>

                {/* 2. Middle Line & Node Dot */}
                <div className="relative flex flex-col items-center justify-center h-full">
                  {/* Connecting Line */}
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute top-1/2 left-1/2 -translate-x-1/2 w-0.5 h-[calc(100%+24px)] transition-colors duration-500",
                        idx < activeStepIdx ? "bg-gold" : "bg-white/15"
                      )}
                    />
                  )}

                  {/* Node Dot */}
                  <div
                    className={cn(
                      "size-6 sm:size-7 rounded-full flex items-center justify-center z-10 transition-all duration-500",
                      isCompleted
                        ? "bg-gold text-black shadow-[0_0_12px_rgba(212,175,55,0.6)] font-bold scale-100"
                        : "border-2 border-white/20 bg-zinc-900 text-transparent scale-90"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-3.5 stroke-[3] text-black" />
                    ) : (
                      <div className="size-2 rounded-full bg-white/20" />
                    )}
                  </div>
                </div>

                {/* 3. Right Title & Subtext */}
                <div className="flex flex-col py-1 pl-1 sm:pl-2">
                  <span
                    className={cn(
                      "text-sm sm:text-base font-semibold lowercase tracking-tight transition-colors duration-300",
                      isCompleted ? "text-white font-medium" : "text-white/40",
                      isCurrent && "text-gold font-bold"
                    )}
                  >
                    {step.title}
                  </span>
                  <span className={cn("text-[10px] sm:text-xs mt-0.5", isCompleted ? "text-white/60" : "text-white/25")}>
                    {step.subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
