import { ExternalLink, Mail, Phone } from "lucide-react";

import { ApexLogo } from "@/components/chrome/ApexLogo";
import { APEX, PRODUCT } from "@/constants/branding";
import { cn } from "@/lib/utils";

type ApexFooterProps = {
  className?: string;
};

export function ApexFooter({ className }: ApexFooterProps) {
  return (
    <footer className={cn("relative z-10 mt-4 lg:mt-8", className)}>
      <div className="glass-apex panel-glow overflow-hidden rounded-[2rem] border border-white/10">
        <div className="grid gap-10 p-8 sm:p-10 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12 lg:p-12">
          {/* Brand */}
          <div className="space-y-5">
            <ApexLogo size="md" />
            <p className="max-w-md text-pretty text-sm leading-7 text-white/55">
              {PRODUCT.name} is engineered by {APEX.name} — Ethiopia&apos;s AI-first
              technology company building intelligent pharmacy systems.
            </p>
            <p className="display-kicker text-apex-orange/90">Licensed deployment only</p>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <p className="display-kicker text-white/40">Contact</p>
            <div className="space-y-3">
              <a
                href={`tel:${APEX.contactPhone.replace(/\s/g, "")}`}
                className="group flex items-center gap-3 text-sm text-white/60 transition hover:text-white"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-apex-orange transition group-hover:border-apex-orange/25 group-hover:bg-apex-orange/10">
                  <Phone className="h-4 w-4" />
                </span>
                {APEX.contactPhone}
              </a>
              <a
                href={`mailto:${APEX.contactEmail}`}
                className="group flex items-center gap-3 text-sm text-white/60 transition hover:text-white"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-apex-orange transition group-hover:border-apex-orange/25 group-hover:bg-apex-orange/10">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="break-all">{APEX.contactEmail}</span>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4 lg:text-right">
            <p className="display-kicker text-white/40 lg:text-right">Apex Solution</p>
            <div className="flex flex-col gap-3 lg:items-end">
              <a
                href={APEX.website}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 font-display text-base font-semibold text-white transition hover:text-apex-orange-light"
              >
                Visit {APEX.name}
                <ExternalLink className="h-4 w-4 text-apex-orange opacity-80 transition group-hover:opacity-100" />
              </a>
              <a
                href={APEX.quoteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/50 transition hover:text-apex-orange-light"
              >
                Request a quote
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/8 bg-black/20 px-8 py-5 sm:flex-row sm:px-10 lg:px-12">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} {APEX.name}. All rights reserved.
          </p>
          <p className="display-kicker text-white/30">Built in Ethiopia 🇪🇹</p>
        </div>
      </div>
    </footer>
  );
}
