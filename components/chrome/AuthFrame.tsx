"use client";

import { ApexLogo } from "@/components/chrome/ApexLogo";
import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import { AuthShowcase } from "@/components/marketing/AuthShowcase";
import { Badge } from "@/components/ui/badge";
import { APEX, PRODUCT } from "@/constants/branding";
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
    <ProjectBackdrop variant="cinematic" className={cn("min-h-svh", className)}>
      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col px-4 py-6 lg:px-8 lg:py-8">
        <header className="relative z-20 mb-8 flex shrink-0 items-center justify-between">
          <ApexLogo size="md" />
          <Badge
            variant="outline"
            className="border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.26em] text-white/50"
          >
            {PRODUCT.name}
          </Badge>
        </header>

        {/* Always side-by-side from lg — never stack on desktop */}
        <div className="relative z-10 grid flex-1 gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <AuthShowcase sideLabel={sideLabel} sideTitle={sideTitle} sideCopy={sideCopy} />

          <section className="flex items-center justify-center lg:justify-end">
            <div className="gradient-border-apex w-full max-w-xl overflow-hidden rounded-[2rem] shadow-[0_40px_120px_-50px_rgba(0,0,0,0.95)]">
              <div className="rounded-[calc(2rem-1px)] bg-[linear-gradient(180deg,rgba(11,25,46,0.98),rgba(6,14,26,0.98))] p-6 lg:p-8">
                <div className="mb-8 space-y-3">
                  <Badge
                    variant="outline"
                    className="border-white/10 bg-white/5 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.28em] text-white/55"
                  >
                    {eyebrow}
                  </Badge>
                  <div>
                    <h2 className="font-display text-3xl font-bold tracking-[-0.03em] text-white lg:text-4xl">
                      {title}
                    </h2>
                    <p className="mt-3 max-w-lg text-base leading-8 text-white/55">{description}</p>
                  </div>
                </div>
                {children}
                <p className="mt-8 text-center text-sm leading-6 text-white/35">
                  Secured by {APEX.name} ·{" "}
                  <a
                    href={APEX.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-apex-orange/90 transition hover:text-apex-orange-light"
                  >
                    {APEX.website.replace("https://", "")}
                  </a>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ProjectBackdrop>
  );
}
