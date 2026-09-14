"use client";

import { Slot } from "@radix-ui/react-slot";
import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "gold" | "ghost" | "outline";
  children?: ReactNode;
};

export function Button({
  asChild,
  className,
  variant = "gold",
  children,
  style,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  if (variant === "gold") {
    return (
      <Comp
        className={cn(
          // Base layout & typography
          "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold text-black",
          // Interaction
          "cursor-pointer select-none",
          // Focus ring
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-all duration-300",
          // Shimmer sweep via CSS pseudo-element class (compatible with Radix Slot / asChild)
          "btn-gold-shimmer",
          className,
        )}
        style={{
          background:
            "linear-gradient(135deg, #b8962e 0%, #d4af37 40%, #f0d978 65%, #d4af37 100%)",
          boxShadow:
            "0 2px 20px rgba(212,175,55,0.28), inset 0 1px 0 rgba(255,255,255,0.18)",
          ...style,
        }}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition duration-300",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "outline" &&
          "border border-white/18 bg-white/[0.03] text-white hover:border-gold hover:text-gold",
        variant === "ghost" &&
          "text-white/78 hover:bg-white/8 hover:text-white",
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </Comp>
  );
}
