"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Mail, Phone } from "lucide-react";

import { ApexFooter } from "@/components/chrome/ApexFooter";
import { ApexLogo } from "@/components/chrome/ApexLogo";
import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import { DashboardShowcase } from "@/components/marketing/DashboardShowcase";
import { FeatureBento } from "@/components/marketing/FeatureBento";
import { HeroVisualization } from "@/components/marketing/HeroVisualization";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APEX, PRODUCT } from "@/constants/branding";

export function LandingExperience() {
  return (
    <ProjectBackdrop variant="cinematic">
      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        {/* Nav */}
        <header className="relative z-20 flex items-center justify-between py-6 lg:py-8">
          <ApexLogo size="lg" />
          <nav className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden text-base text-white/60 hover:bg-white/8 hover:text-white sm:inline-flex"
            >
              <a href={APEX.website} target="_blank" rel="noopener noreferrer">
                {APEX.name}
                <ExternalLink className="ml-1.5 h-4 w-4 opacity-60" />
              </a>
            </Button>
            <Button asChild size="lg" className="h-11 px-6 text-sm sm:h-12 sm:px-8 sm:text-base">
              <Link href="/Login">Sign in to {PRODUCT.name}</Link>
            </Button>
          </nav>
        </header>

        <main className="relative z-10 flex flex-1 flex-col gap-20 pb-12 lg:gap-24 lg:pb-16">
          {/* Hero — text left, visual right on lg+ */}
          <section className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
            {/* Ambient hero wash — warm left, cool right for balance */}
            <div className="pointer-events-none absolute -inset-x-4 -inset-y-8 rounded-[2.5rem] bg-[radial-gradient(ellipse_55%_60%_at_15%_40%,rgba(232,149,30,0.09),transparent_55%),radial-gradient(ellipse_50%_55%_at_85%_45%,rgba(45,90,150,0.12),transparent_55%)] lg:-inset-x-8" />

            <div className="relative space-y-7">
              <div className="animate-fade-up flex flex-wrap items-center gap-2.5">
                <Badge className="border-apex-orange/35 bg-apex-orange/15 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.3em] text-apex-orange-light shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-apex-orange/15">
                  {APEX.tagline}
                </Badge>
                <Badge variant="outline" className="border-white/14 bg-white/8 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.26em] text-white/65">
                  {PRODUCT.tagline}
                </Badge>
              </div>

              <div className="animate-fade-up space-y-5 [animation-delay:80ms]">
                <h1 className="max-w-xl text-balance font-display text-4xl font-bold leading-[0.95] tracking-[-0.03em] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.02]">
                  <span className="text-white">Pharmacy operations,</span>
                  <br />
                  <span className="gradient-text-apex">engineered to impress.</span>
                </h1>
                <p className="max-w-lg text-pretty text-sm leading-7 text-white/65 sm:text-base sm:leading-8">
                  {PRODUCT.name} is the intelligent command center for inventory, sales,
                  suppliers, and finance — built by{" "}
                  <a
                    href={APEX.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-apex-orange-light underline-offset-4 transition hover:text-white hover:underline"
                  >
                    {APEX.name}
                  </a>
                  . Deployed for your pharmacy after onboarding.
                </p>
              </div>

              <div className="animate-fade-up flex flex-row flex-wrap items-center gap-3 [animation-delay:160ms]">
                <Button asChild size="lg" className="h-10 min-w-40 px-6 text-sm sm:h-11">
                  <Link href="/Login" className="inline-flex items-center gap-2">
                    Sign in
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-10 min-w-40 border-white/18 bg-white/8 text-sm text-white/90 hover:border-apex-orange/35 hover:bg-apex-orange/10 sm:h-11"
                >
                  <a href={APEX.quoteUrl} target="_blank" rel="noopener noreferrer">
                    Get a quote
                  </a>
                </Button>
              </div>

              <div className="animate-fade-up flex flex-row flex-wrap gap-6 border-t border-white/12 pt-6 [animation-delay:220ms]">
                <a
                  href={`tel:${APEX.contactPhone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/6 text-apex-orange">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  {APEX.contactPhone}
                </a>
                <a
                  href={`mailto:${APEX.contactEmail}`}
                  className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/12 bg-white/6 text-apex-orange">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  {APEX.contactEmail}
                </a>
              </div>
            </div>

            <div className="relative pb-12 lg:pb-0">
              <HeroVisualization />
            </div>
          </section>

          <DashboardShowcase />
          <FeatureBento />

          {/* CTA */}
          <section className="glass-apex panel-glow relative overflow-hidden rounded-[2rem] border border-white/10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-apex-orange/20 blur-3xl" />
            <div className="relative grid gap-8 p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12 lg:p-12">
              <div className="space-y-4">
                <p className="display-kicker text-apex-orange">Licensed deployment</p>
                <h2 className="max-w-xl font-display text-2xl font-bold tracking-[-0.03em] text-white sm:text-3xl">
                  Want {PRODUCT.name} for your pharmacy?
                </h2>
                <p className="max-w-lg text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
                  Accounts are provisioned by {APEX.name} after consultation and payment.
                  Contact our team to deploy a fully configured workspace.
                </p>
              </div>
              <div className="flex flex-row flex-wrap gap-3 lg:flex-col lg:items-stretch">
                <Button asChild size="lg" className="h-10 min-w-48 px-6 text-sm sm:h-11">
                  <a href={APEX.quoteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                    Request deployment
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-10 min-w-48 border-white/15 bg-white/5 text-sm text-white hover:bg-white/10 sm:h-11"
                >
                  <Link href="/Login">Already have access? Sign in</Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <ApexFooter />
      </div>
    </ProjectBackdrop>
  );
}
