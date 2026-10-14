import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

import { APEX, PRODUCT } from "@/constants/branding";
import { cn } from "@/lib/utils";

/**
 * Shared auth styling tokens.
 * Dark, Apex-navy palette — the pharmacy sibling of hotcol-user's `AuthPageShell`
 * and mediflow's `auth-shell`, kept in the Apex navy/orange identity.
 */
export const AUTH_CARD_CLASS =
  "auth-shimmer relative w-full max-w-[28rem] overflow-hidden rounded-2xl border border-apex-orange/10 bg-[linear-gradient(155deg,rgba(11,25,46,0.86),rgba(6,14,26,0.92))] shadow-[0_24px_80px_-28px_rgba(0,0,0,0.6),0_0_40px_-16px_rgba(232,149,30,0.14)] ring-1 ring-white/5 backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(232,149,30,0.45),transparent)]";

export const AUTH_SIGNUP_CARD =
  "auth-shimmer relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-apex-orange/10 bg-[linear-gradient(155deg,rgba(11,25,46,0.86),rgba(6,14,26,0.92))] shadow-[0_24px_80px_-28px_rgba(0,0,0,0.6),0_0_40px_-16px_rgba(232,149,30,0.14)] ring-1 ring-white/5 backdrop-blur-md before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(232,149,30,0.45),transparent)] motion-safe:transition-shadow motion-safe:duration-500";

export const AUTH_PANEL_WARM =
  "rounded-2xl border border-apex-orange/15 bg-[linear-gradient(140deg,rgba(232,149,30,0.08),rgba(6,14,26,0.45)_62%,rgba(232,149,30,0.03))] p-4 ring-1 ring-white/5";

export const AUTH_PANEL_COOL =
  "rounded-2xl border border-sky-400/15 bg-[linear-gradient(140deg,rgba(56,110,170,0.1),rgba(6,14,26,0.45)_62%,rgba(40,80,140,0.08))] p-4 ring-1 ring-white/5";

export const AUTH_BAND =
  "border-white/8 bg-[linear-gradient(90deg,rgba(232,149,30,0.08),rgba(6,14,26,0.4)_55%,rgba(56,110,170,0.07))]";

export const AUTH_EYEBROW =
  "text-[11px] font-medium tracking-[0.22em] text-apex-orange-light/85 uppercase";

export const AUTH_TITLE =
  "bg-[linear-gradient(90deg,#f7f7f5_10%,#eccf9d_55%,#e6b96f_100%)] bg-clip-text font-display font-semibold tracking-tight text-transparent";

export const AUTH_SUBTITLE = "leading-relaxed text-pretty text-white/55";

export const AUTH_MUTED = "text-white/40";

export const AUTH_LABEL_WARM = "text-[13px] font-medium tracking-wide text-apex-orange-light/85";

export const AUTH_LABEL_COOL = "text-[13px] font-medium tracking-wide text-sky-200/85";

export const AUTH_LINK =
  "font-medium text-apex-orange-light/90 underline-offset-4 transition-colors hover:text-white hover:underline";

export const AUTH_BUTTON =
  "bg-[linear-gradient(135deg,var(--apex-orange),#c9760f)] text-white shadow-[0_14px_34px_-20px_rgba(232,149,30,0.6)] hover:brightness-105";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3.5">
      <div
        className={cn(
          "auth-mark-glow relative flex items-center justify-center rounded-xl border border-apex-orange/30 bg-[#060e1a] ring-1 ring-apex-orange/20",
          compact ? "h-10 w-10" : "h-12 w-12",
        )}
      >
        <Image
          src={APEX.logo}
          alt={APEX.name}
          width={compact ? 44 : 52}
          height={compact ? 18 : 22}
          className={cn("w-auto object-contain", compact ? "h-4" : "h-5")}
          priority
        />
      </div>
      <div className="leading-tight">
        <p
          className={cn(
            "auth-brand-shine font-display font-extrabold tracking-[0.2em] text-white",
            compact ? "text-lg" : "text-[1.45rem]",
          )}
        >
          {PRODUCT.name.toUpperCase()}
        </p>
        <p
          className={cn(
            "mt-0.5 font-semibold tracking-[0.16em] text-apex-orange-light uppercase",
            compact ? "text-[9px]" : "text-[11px]",
          )}
        >
          Pharmacy operations
        </p>
      </div>
    </div>
  );
}

/**
 * Split-screen auth layout: sticky brand rail on the left (lg+), centered content
 * on the right. Mirrors the hotcol/mediflow shells while staying on the Apex palette.
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
  const authTheme = {
    "--apex-navy": "#0b192e",
    "--apex-navy-deep": "#060e1a",
    "--apex-orange": "#e8951e",
    "--apex-orange-light": "#f5b042",
    "--background": "oklch(0.14 0.04 250)",
    "--card": "oklch(0.17 0.04 250)",
    "--popover": "oklch(0.16 0.04 250)",
    "--secondary": "oklch(0.22 0.04 250)",
    "--muted": "oklch(0.21 0.035 250)",
    "--accent": "oklch(0.28 0.06 250)",
    "--sidebar": "oklch(0.15 0.04 250)",
    "--sidebar-accent": "oklch(0.22 0.04 250)",
  } as CSSProperties & { [key: `--${string}`]: string };

  return (
    <div
      data-auth-scroll-mode={scrollMode}
      style={authTheme}
      className={cn(
        "dark auth-shell flex flex-col text-foreground lg:grid lg:h-dvh lg:grid-cols-[minmax(300px,38%)_1fr] lg:items-center lg:overflow-hidden",
        scrollMode === "auto" ? "min-h-dvh" : "h-dvh overflow-hidden",
      )}
    >
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(160deg,#0b192e_0%,#081326_45%,#060e1a_100%)] lg:flex lg:h-dvh lg:flex-col lg:justify-between lg:px-12 lg:py-14">
        <div
          aria-hidden
          className="auth-orb-a pointer-events-none absolute -left-16 -top-10 h-80 w-80 rounded-full bg-apex-orange/14 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-orb-b pointer-events-none absolute -bottom-16 right-[-20%] h-72 w-72 rounded-full bg-sky-500/12 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-grid-shift pointer-events-none absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 20% 40%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 20% 40%, black, transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-10 right-0 w-px bg-[linear-gradient(180deg,transparent,rgba(232,149,30,0.22),transparent)]"
        />

        <div className="auth-fade-right relative">
          <BrandMark />
        </div>

        <div className="relative mt-2 flex max-w-sm flex-col gap-7">
          <p className="auth-rise auth-delay-1 flex w-fit items-center gap-2 rounded-full border border-apex-orange/20 bg-apex-orange/8 px-3 py-1 text-xs font-medium text-apex-orange-light/90">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-apex-orange opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-apex-orange" />
            </span>
            Staff portal
          </p>
          <p className="auth-rise auth-delay-1 text-balance font-display text-[2.05rem] font-bold leading-[1.15] tracking-tight text-white">
            Quiet, sharp control{" "}
            <span className="gradient-text-apex">for every pharmacy role</span>.
          </p>
          <p className="auth-rise auth-delay-2 text-sm leading-relaxed text-white/50">
            Inventory, suppliers, invoices, cashouts, and multi-medicine selling
            — one precise workspace engineered for the counter, not a demo.
          </p>
        </div>

        <a
          href={APEX.website}
          target="_blank"
          rel="noopener noreferrer"
          className="auth-rise auth-delay-3 relative text-xs tracking-[0.18em] text-white/35 uppercase transition-colors hover:text-apex-orange-light"
        >
          {APEX.name}
        </a>
      </aside>

      <div
        className={cn(
          "relative flex min-h-0 flex-col items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#081326_0%,#060e1a_55%,#040a12_100%)] px-4",
          scrollMode === "auto"
            ? compact
              ? "h-dvh"
              : "min-h-dvh lg:h-dvh"
            : "flex-1 lg:h-dvh",
        )}
      >
        <div
          aria-hidden
          className="auth-orb-c pointer-events-none absolute left-1/2 top-[-10%] h-96 w-96 -translate-x-1/2 rounded-full bg-apex-orange/8 blur-3xl"
        />
        <div
          aria-hidden
          className="auth-orb-a pointer-events-none absolute bottom-[-18%] right-[-8%] h-80 w-80 rounded-full bg-sky-500/8 blur-3xl"
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
