import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { ApexLogo } from "@/components/chrome/ApexLogo";
import { APEX } from "@/constants/branding";
import { cn } from "@/lib/utils";

type ApexMarkProps = {
  className?: string;
  variant?: "compact" | "sidebar";
};

/** Compact "Powered by Apex Solution" strip for sidebars and auth panels. */
export function ApexMark({ className, variant = "compact" }: ApexMarkProps) {
  if (variant === "sidebar") {
    return (
      <Link
        href={APEX.website}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${APEX.name} — visit website`}
        className={cn(
          "group relative block overflow-hidden rounded-2xl border border-apex-orange/20",
          "bg-[linear-gradient(145deg,rgba(232,149,30,0.12),rgba(11,25,46,0.4)_55%,rgba(6,14,26,0.85))]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_32px_-20px_rgba(232,149,30,0.35)]",
          "transition-all duration-300 hover:border-apex-orange/35 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_16px_40px_-18px_rgba(232,149,30,0.45)]",
          className,
        )}
      >
        <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-apex-orange/20 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(232,149,30,0.55),transparent)]" />

        <div className="relative flex items-start gap-3 p-3.5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-apex-orange/25 blur-md" />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-apex-orange/30 bg-[#060e1a] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Image
                src={APEX.logo}
                alt={APEX.name}
                width={72}
                height={28}
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[0.56rem] font-black uppercase tracking-[0.28em] text-apex-orange-light/75">
              Powered by
            </p>
            <p className="mt-0.5 truncate font-display text-sm font-semibold text-white transition group-hover:text-white">
              {APEX.name}
            </p>
            <p className="mt-0.5 truncate text-[0.68rem] leading-snug text-white/45">
              {APEX.tagline}
            </p>
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/8 bg-black/15 px-3.5 py-2">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-white/30">
            Licensed partner
          </span>
          <span className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-apex-orange-light/80 transition group-hover:text-apex-orange-light">
            Visit
            <ExternalLink className="h-3 w-3 opacity-70 transition group-hover:opacity-100" />
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={APEX.website}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 transition hover:border-apex-orange/25 hover:bg-white/5",
        className,
      )}
    >
      <ApexLogo size="sm" showLink={false} className="h-7" />
      <div className="min-w-0">
        <p className="text-[0.58rem] font-black uppercase tracking-[0.26em] text-white/35">
          Powered by
        </p>
        <p className="truncate text-xs font-semibold text-white/75 transition group-hover:text-white">
          {APEX.name}
        </p>
      </div>
    </Link>
  );
}

/** Icon-only Apex mark for collapsed sidebar — use inside a tooltip trigger. */
export function ApexMarkIcon({ className }: { className?: string }) {
  return (
    <Link
      href={APEX.website}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${APEX.name} — visit website`}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl border border-apex-orange/25",
        "bg-[linear-gradient(145deg,rgba(232,149,30,0.16),rgba(6,14,26,0.9))]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-apex-orange/40 hover:bg-apex-orange/12",
        className,
      )}
    >
      <Image
        src={APEX.logo}
        alt={APEX.name}
        width={56}
        height={20}
        className="h-4 w-auto object-contain"
      />
    </Link>
  );
}
