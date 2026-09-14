"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  className?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  position?: "auto" | "top" | "bottom";
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date (dd/mm/yyyy)",
  min,
  max,
  className = "",
  id,
  required = false,
  disabled = false,
  position = "auto",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropUp, setIsDropUp] = useState(position === "top");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected value or default to today's date for month viewing
  const parsedSelectedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const today = useMemo(() => new Date(), []);

  // View state for navigating calendar months
  const [viewDate, setViewDate] = useState<Date>(() => {
    return parsedSelectedDate || today;
  });

  // Keep viewDate in sync when value changes externally
  useEffect(() => {
    if (parsedSelectedDate) {
      setViewDate(parsedSelectedDate);
    }
  }, [parsedSelectedDate]);

  // Determine drop direction (up vs down) based on position prop & viewport space
  useEffect(() => {
    if (position === "top") {
      setIsDropUp(true);
      return;
    }
    if (position === "bottom") {
      setIsDropUp(false);
      return;
    }
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 350px below the input, drop UP!
      setIsDropUp(spaceBelow < 350);
    }
  }, [isOpen, position]);

  // Click outside to close
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

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Generate matrix of days for the month view
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Prev month padding days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const dateStr = formatDateToYYYYMMDD(prevDate);
      days.push({
        dateString: dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isDisabled: checkIsDisabled(dateStr, min, max),
        isToday: isSameDay(prevDate, today),
        isSelected: value === dateStr,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const currDate = new Date(viewYear, viewMonth, dayNum);
      const dateStr = formatDateToYYYYMMDD(currDate);
      days.push({
        dateString: dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isDisabled: checkIsDisabled(dateStr, min, max),
        isToday: isSameDay(currDate, today),
        isSelected: value === dateStr,
      });
    }

    // Next month padding days to fill grid
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const nextDate = new Date(viewYear, viewMonth + 1, dayNum);
      const dateStr = formatDateToYYYYMMDD(nextDate);
      days.push({
        dateString: dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isDisabled: checkIsDisabled(dateStr, min, max),
        isToday: isSameDay(nextDate, today),
        isSelected: value === dateStr,
      });
    }

    return days;
  }, [viewYear, viewMonth, min, max, today, value]);

  // Display formatting (e.g. "13 Sep 2026")
  const formattedDisplay = useMemo(() => {
    if (!parsedSelectedDate) return "";
    return parsedSelectedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [parsedSelectedDate]);

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${isOpen ? "z-40" : ""} ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Trigger Field */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-10 w-full items-center justify-between rounded-md border text-xs font-semibold transition-all duration-200 cursor-pointer select-none px-3 py-2 ${
          isOpen
            ? "border-gold/60 bg-gold/10 text-gold shadow-[0_0_20px_rgba(212,175,55,0.12)]"
            : "border-white/12 bg-black/40 text-white hover:border-gold/40 hover:text-gold hover:bg-gold/5"
        } ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon className={`size-4 shrink-0 transition-colors ${value ? "text-gold" : "text-white/40"}`} />
          <span className={`truncate text-left ${value ? "text-white font-medium" : "text-white/40"}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>
        <span className="text-[10px] text-white/40 uppercase tracking-widest group-hover:text-gold/80">
          {isOpen ? "Close" : "Change"}
        </span>
      </button>

      {/* Required Hidden Input for standard form validation */}
      {required && (
        <input
          type="text"
          required={required}
          value={value || ""}
          onChange={() => {}}
          className="sr-only opacity-0 absolute size-0 pointer-events-none"
          tabIndex={-1}
        />
      )}

      {/* Luxury Calendar Popover — Drop Up or Drop Down */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label="Choose date"
            initial={{ opacity: 0, y: isDropUp ? 8 : -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isDropUp ? 8 : -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute left-0 z-[100] w-72 sm:w-80 overflow-hidden rounded-2xl border border-white/15 bg-[#111009]/98 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_0_1px_rgba(212,175,55,0.2)] backdrop-blur-2xl ${
              isDropUp ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
            }`}
            style={{
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(212,175,55,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Gold accent line */}
            <div
              className={`h-px w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent absolute left-0 ${
                isDropUp ? "bottom-0" : "top-0"
              }`}
            />

            {/* Header: Month Year + Prev/Next Controls */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/8">
              <span className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-gold" />
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:border-gold/40 hover:bg-gold/10 hover:text-gold transition cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:border-gold/40 hover:bg-gold/10 hover:text-gold transition cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAY_NAMES.map((day) => (
                <span key={day} className="text-[10px] font-bold text-white/40 uppercase tracking-widest py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, index) => {
                return (
                  <button
                    key={`${item.dateString}-${index}`}
                    type="button"
                    disabled={item.isDisabled}
                    onClick={() => {
                      onChange(item.dateString);
                      setIsOpen(false);
                    }}
                    className={`relative flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                      item.isSelected
                        ? "bg-gold text-black font-black shadow-[0_0_14px_rgba(212,175,55,0.45)] scale-105"
                        : item.isDisabled
                        ? "text-white/20 pointer-events-none line-through decoration-white/20"
                        : !item.isCurrentMonth
                        ? "text-white/25 hover:bg-white/[0.06] hover:text-white/70"
                        : "text-white/85 hover:bg-gold/20 hover:text-gold"
                    } ${
                      item.isToday && !item.isSelected
                        ? "border border-gold/50 text-gold font-bold bg-gold/5"
                        : ""
                    }`}
                  >
                    {item.dayNumber}
                  </button>
                );
              })}
            </div>

            {/* Footer Bar: Today / Clear */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/8 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="text-white/40 hover:text-white/80 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const todayStr = formatDateToYYYYMMDD(new Date());
                  if (!checkIsDisabled(todayStr, min, max)) {
                    onChange(todayStr);
                    setViewDate(new Date());
                    setIsOpen(false);
                  }
                }}
                className="text-gold font-semibold hover:underline transition cursor-pointer"
              >
                Select Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helpers
function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function checkIsDisabled(dateStr: string, min?: string, max?: string): boolean {
  if (min && dateStr < min) return true;
  if (max && dateStr > max) return true;
  return false;
}
