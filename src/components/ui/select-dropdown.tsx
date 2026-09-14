"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption<T = string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SelectDropdownProps<T = string | number> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  panelClassName?: string;
  id?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SelectDropdown<T = string | number>({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  panelClassName = "",
  id,
  disabled = false,
  size = "md",
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sizeClasses = {
    sm: "h-8 px-2.5 text-xs gap-1.5",
    md: "h-10 px-3.5 text-xs gap-2",
    lg: "h-12 px-4 text-sm gap-2.5",
  }[size];

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-md border transition-all duration-200 cursor-pointer select-none ${sizeClasses} ${
          isOpen
            ? "border-gold/60 bg-gold/10 text-gold shadow-[0_0_20px_rgba(212,175,55,0.12)]"
            : "border-white/12 bg-black/40 text-white/90 hover:border-gold/40 hover:text-gold hover:bg-gold/5"
        } ${className}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="text-gold shrink-0 leading-none">{selectedOption.icon}</span>
          )}
          <span className="truncate text-left font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 text-white/50"
        >
          <ChevronDown className="size-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={`absolute left-0 right-0 top-[calc(100%+6px)] z-50 min-w-[180px] overflow-hidden rounded-xl border border-white/10 bg-[#111009]/95 shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.1)] backdrop-blur-2xl ${panelClassName}`}
            style={{
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Top gold accent line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

            <div className="p-1.5 max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((option, i) => {
                const isActive = option.value === value;
                return (
                  <motion.button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.12 }}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`group relative flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-gold/15 text-gold font-semibold"
                        : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-gold" />
                    )}

                    <div className="flex items-center gap-2.5 truncate">
                      {option.icon && (
                        <span
                          className={`shrink-0 text-xs leading-none ${
                            isActive ? "text-gold" : "text-white/40 group-hover:text-white/70"
                          }`}
                        >
                          {option.icon}
                        </span>
                      )}
                      <span className="truncate text-left tracking-wide">{option.label}</span>
                    </div>

                    {/* Check icon for active */}
                    {isActive && <Check className="size-3.5 text-gold opacity-90 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
