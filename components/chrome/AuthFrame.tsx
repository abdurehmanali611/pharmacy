"use client";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AuthFrame({
  eyebrow,
  title,
  description,
  sideLabel,
  sideTitle,
  sideCopy,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sideLabel: string;
  sideTitle: string;
  sideCopy: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <ProjectBackdrop className={cn("min-h-screen bg-[#0a0d14] text-white", className)}>
      <div className="relative mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-8">
        <section className="relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(245,109,40,0.15),rgba(11,14,22,0.88)_32%,rgba(11,14,22,0.96)),radial-gradient(circle_at_top,rgba(255,226,116,0.16),transparent_26%)] p-6 shadow-[0_30px_120px_-48px_rgba(0,0,0,0.85)] lg:p-10">
          <div className="space-y-5">
            <Badge variant="outline" className="border-white/15 bg-white/6 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.28em] text-white/85">
              {sideLabel}
            </Badge>
            <div className="max-w-xl space-y-4">
              <h1 className="max-w-2xl text-balance font-[family-name:var(--font-display)] text-4xl leading-[0.9] tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
                {sideTitle}
              </h1>
              <p className="max-w-lg text-pretty text-sm leading-7 text-white/68 sm:text-base">
                {sideCopy}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Live inventory", "See low stock, urgent expiry, and category mix in one glance."],
              ["Fast checkout", "Multi-medicine selling built for crowded counters and real rush."],
              ["Sharp reporting", "Suppliers, invoices, cashouts, and profit stitched together."],
            ].map(([label, copy]) => (
              <div key={label} className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-200">{label}</p>
                <p className="mt-2 text-sm leading-6 text-white/65">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-[1px] shadow-[0_40px_120px_-50px_rgba(0,0,0,0.9)]">
            <div className="rounded-[calc(2rem-1px)] bg-[linear-gradient(180deg,rgba(9,12,20,0.97),rgba(12,16,26,0.92))] p-6 lg:p-8">
              <div className="mb-8 space-y-3">
                <Badge variant="outline" className="border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.28em] text-white/72">
                  {eyebrow}
                </Badge>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-[-0.04em] text-white lg:text-4xl">
                    {title}
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-7 text-white/60">
                    {description}
                  </p>
                </div>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </ProjectBackdrop>
  );
}
