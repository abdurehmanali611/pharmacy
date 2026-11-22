import type { ReactNode } from "react";
import Image from "next/image";

import { APEX, PRODUCT } from "@/constants/branding";
import { cn } from "@/lib/utils";

/**
 * Shared auth styling tokens: neon-night glass surfaces with a saturated
 * gradient brand rail. Every export is a class string reused across auth screens.
 */
const SPECTRUM_RAIL =
  "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-1.5 before:opacity-90 before:bg-[linear-gradient(90deg,#fb7185,#fb923c,#fbbf24,#34d399,#22d3ee,#a855f7,#e879f9)]";

export const AUTH_CARD_CLASS = `auth-shimmer relative w-full max-w-[28rem] overflow-hidden rounded-[1.75rem] border border-fuchsia-400/32 bg-[linear-gradient(160deg,rgba(31,25,86,0.93),rgba(12,10,42,0.96))] shadow-[0_30px_80px_-34px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-xl ${SPECTRUM_RAIL}`;

export const AUTH_SIGNUP_CARD = `auth-shimmer relative mx-auto w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-fuchsia-400/32 bg-[linear-gradient(160deg,rgba(31,25,86,0.93),rgba(12,10,42,0.96))] shadow-[0_30px_80px_-34px_rgba(0,0,0,0.85)] ring-1 ring-white/10 backdrop-blur-xl ${SPECTRUM_RAIL} motion-safe:transition-shadow motion-safe:duration-500`;

export const AUTH_PANEL_WARM =
  "rounded-2xl border border-orange-300/32 bg-[linear-gradient(140deg,rgba(251,146,60,0.17),rgba(244,114,182,0.1)_60%,rgba(10,8,40,0.5))] p-4 shadow-[0_12px_26px_-23px_rgba(251,146,60,0.5)] ring-1 ring-white/5";

export const AUTH_PANEL_COOL =
  "rounded-2xl border border-cyan-300/32 bg-[linear-gradient(140deg,rgba(34,211,238,0.16),rgba(168,85,247,0.11)_60%,rgba(10,8,40,0.5))] p-4 shadow-[0_12px_26px_-23px_rgba(34,211,238,0.5)] ring-1 ring-white/5";

export const AUTH_BAND =
  "border-fuchsia-400/22 bg-[linear-gradient(90deg,rgba(168,85,247,0.22),rgba(34,211,238,0.11)_55%,rgba(244,114,182,0.15))]";

export const AUTH_EYEBROW =
  "text-[11px] font-bold tracking-[0.25em] text-fuchsia-300 uppercase";

export const AUTH_TITLE =
  "bg-[linear-gradient(90deg,#ffffff_0%,#f5d0fe_35%,#fda4af_70%,#fde68a_100%)] bg-clip-text font-display font-semibold tracking-tight text-transparent";

export const AUTH_SUBTITLE = "leading-relaxed text-pretty text-violet-100/78";

export const AUTH_MUTED = "text-violet-200/78";

export const AUTH_LABEL_WARM = "text-[13px] font-bold tracking-wide text-orange-200";

export const AUTH_LABEL_COOL = "text-[13px] font-bold tracking-wide text-cyan-200";

export const AUTH_LINK =
  "font-bold text-fuchsia-300 underline-offset-4 transition-colors hover:text-white hover:underline";

export const AUTH_BUTTON =
  "bg-[linear-gradient(120deg,#7439e0,#b82bd0_52%,#ea4466)] text-white shadow-[0_10px_24px_-13px_rgba(184,43,208,0.6)] hover:brightness-110";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "auth-mark-glow inline-flex items-center justify-center rounded-2xl border border-white/45 bg-white shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)]",
        compact ? "px-3 py-1.5" : "px-4 py-2",
      )}
    >
      <Image
        src={PRODUCT.logo}
        alt={`${PRODUCT.name} — ${PRODUCT.tagline}`}
        width={1000}
        height={322}
        sizes={compact ? "170px" : "230px"}
        className={cn("w-auto object-contain", compact ? "h-10" : "h-[3.4rem]")}
        priority
      />
    </div>
  );
}

/**
 * Split-screen auth layout: a saturated gradient brand rail on the left (lg+),
 * centred content on a neon-night canvas on the right.
 */
export function AuthShell({
  children,
  className,
  compact = false,
  scrollMode = "auto",
}: {
  children?: ReactNode;
  className?: string;
  compact?: boolean;
  scrollMode?: "auto" | "disabled" | "hidden";
}) {
  return (
    <div
      data-auth-scroll-mode={scrollMode}
      className={cn(
        "dark auth-shell flex flex-col text-foreground lg:grid lg:h-dvh lg:grid-cols-[minmax(300px,40%)_1fr] lg:items-center lg:overflow-hidden",
        scrollMode === "auto" ? "min-h-dvh" : "h-dvh overflow-hidden",
      )}
    >
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#4a1fa0_0%,#6430c8_32%,#a02cb4_68%,#d63e5c_100%)] text-white lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        <div
          aria-hidden
          className="auth-orb-a pointer-events-none absolute -left-16 -top-10 h-96 w-96 rounded-full bg-orange-400/22 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-orb-b pointer-events-none absolute -bottom-16 right-[-20%] h-96 w-96 rounded-full bg-sky-400/22 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-grid-shift pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse 80% 70% at 20% 40%, black, transparent)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 20% 40%, black, transparent)",
          }}
        />

        <div className="auth-fade-right relative flex justify-center">
          <BrandMark />
        </div>

        <div className="relative mt-2 flex max-w-sm flex-col gap-7">
          <p className="auth-rise auth-delay-1 flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/16 px-3.5 py-1.5 text-xs font-bold text-white shadow-[0_8px_20px_-12px_rgba(30,27,75,0.6)] backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-200 opacity-80" />
              <span className="relative inline-flex size-2 rounded-full bg-amber-200" />
            </span>
            Staff portal
          </p>
          <p className="auth-rise auth-delay-1 text-balance font-display text-[2.15rem] font-bold leading-[1.1] tracking-tight text-white">
            Quiet, sharp control{" "}
            <span className="bg-[linear-gradient(90deg,#fde68a,#fbf7ff)] bg-clip-text text-transparent">
              for every pharmacy role
            </span>
            .
          </p>
          <p className="auth-rise auth-delay-2 text-sm leading-relaxed text-white/80">
            Inventory, suppliers, invoices, cashouts and selling — one focused workspace for the counter.
          </p>
          <div className="auth-rise auth-delay-3 flex flex-wrap gap-2">
            {["Inventory", "Sales", "Suppliers", "Finance"].map((label, i) => (
              <span
                key={label}
                className={cn(
                  "rounded-full border border-white/32 px-3 py-1 text-[11px] font-bold tracking-wide text-white backdrop-blur",
                  ["bg-amber-400/26", "bg-cyan-400/26", "bg-emerald-400/26", "bg-white/18"][i],
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <a
          href={APEX.website}
          target="_blank"
          rel="noopener noreferrer"
          className="auth-rise auth-delay-3 relative text-xs font-semibold tracking-[0.18em] text-white/75 uppercase transition-colors hover:text-white"
        >
          {APEX.name}
        </a>
      </aside>

      <div
        className={cn(
          "relative flex min-h-0 flex-col items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#0a0828_0%,#080620_55%,#06051a_100%)] px-4",
          scrollMode === "auto"
            ? compact
              ? "h-dvh"
              : "min-h-dvh lg:h-dvh"
            : "flex-1 lg:h-dvh",
        )}
      >
        <div
          aria-hidden
          className="auth-orb-c pointer-events-none absolute left-1/2 top-[-10%] h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/13 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-orb-a pointer-events-none absolute bottom-[-18%] right-[-8%] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-orb-b pointer-events-none absolute bottom-[-10%] left-[-10%] h-80 w-80 rounded-full bg-violet-500/13 blur-3xl"
        />

        <div
          className={cn(
            "relative z-10 flex min-h-0 w-full flex-1 flex-col items-center overscroll-contain",
            scrollMode === "disabled" ? "overflow-hidden" : "overflow-y-auto",
            scrollMode === "hidden" && "no-scrollbar",
            compact ? "px-1 py-4" : "px-1 py-8 lg:py-10",
            className,
          )}
        >
          <div className="my-auto flex w-full flex-col items-center">
            <div className={cn("relative lg:hidden", compact ? "mb-3" : "mb-8")}>
              <BrandMark compact />
            </div>

            <div className="auth-rise relative z-10 flex w-full flex-col items-center">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
