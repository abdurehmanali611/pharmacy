"use client";

import { ApexMark } from "@/components/chrome/ApexMark";
import { Badge } from "@/components/ui/badge";

const highlights = [
  ["Live inventory", "Low stock and expiry urgency surfaced instantly."],
  ["Fast checkout", "Multi-medicine selling built for real rush hours."],
  ["Sharp reporting", "Suppliers, invoices, cashouts — one story."],
] as const;

export function AuthShowcase({
  sideLabel,
  sideTitle,
  sideCopy,
}: {
  sideLabel: string;
  sideTitle: string;
  sideCopy: string;
}) {
  return (
    <section className="apex-hero-card relative flex min-h-[520px] flex-col justify-between overflow-hidden p-6 lg:min-h-[580px] lg:p-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-apex-orange/15 blur-3xl" />

      <div className="relative space-y-5">
        <Badge className="w-fit border-apex-orange/25 bg-apex-orange/10 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.28em] text-apex-orange-light hover:bg-apex-orange/10">
          {sideLabel}
        </Badge>
        <div className="max-w-xl space-y-4">
          <h1 className="max-w-2xl text-balance font-display text-4xl font-bold leading-[0.92] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[0.92]">
            {sideTitle}
          </h1>
          <p className="max-w-lg text-pretty text-base leading-8 text-white/55">{sideCopy}</p>
        </div>
      </div>

      <div className="relative mt-10 grid grid-cols-3 gap-3">
        {highlights.map(([label, copy]) => (
          <div
            key={label}
            className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-apex-orange-light">
              {label}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/50">{copy}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-8">
        <ApexMark />
      </div>
    </section>
  );
}
