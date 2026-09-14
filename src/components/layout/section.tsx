import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Section({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn("mx-auto max-w-7xl px-4 py-10 sm:py-16 lg:py-20 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export function SectionHeading({
  title,
  text,
  align = "left",
}: {
  title: string;
  text?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-6 sm:mb-10 max-w-3xl", align === "center" && "mx-auto text-center")}>
      <h2 className="text-balance text-3xl font-semibold leading-tight text-white sm:text-5xl">
        {title}
      </h2>
      {text ? <p className="mt-4 text-base leading-8 text-white/62 sm:text-lg">{text}</p> : null}
    </div>
  );
}
