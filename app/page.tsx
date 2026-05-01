import Link from "next/link";
import { ArrowRight, ReceiptText, ShieldPlus, Sparkles, Stethoscope } from "lucide-react";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <ProjectBackdrop className="min-h-screen bg-[#090d15] text-white">
      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid flex-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-between rounded-[2.25rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,107,53,0.16),rgba(8,11,19,0.92)_32%,rgba(8,11,19,0.98))] p-6 shadow-[0_40px_120px_-50px_rgba(0,0,0,0.95)] lg:p-10">
            <div className="space-y-7">
              <Badge variant="outline" className="border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.3em] text-amber-200">
                Pharmacy Command Center
              </Badge>
              <div className="space-y-5">
                <h1 className="max-w-4xl text-balance font-display text-5xl leading-[0.88] tracking-[-0.06em] text-white sm:text-6xl lg:text-8xl">
                  A pharmacy system that looks like it escaped from a sci-fi control room.
                </h1>
                <p className="max-w-2xl text-pretty text-base leading-8 text-white/70 lg:text-lg">
                  Medicare turns stock, selling, suppliers, invoices, and cashouts into one dramatic operating surface.
                  Fast enough for a crowded counter. Sharp enough for an investor demo.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="min-w-44">
                  <Link href="/Login" className="inline-flex items-center gap-2">
                    Enter the system
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: ShieldPlus,
                  title: "Inventory with attitude",
                  copy: "Low stock and expiry alerts feel urgent instead of getting buried in bland tables.",
                },
                {
                  icon: Stethoscope,
                  title: "Counter speed",
                  copy: "Pharmacists search, filter, and check out multiple medicines in one motion.",
                },
                {
                  icon: ReceiptText,
                  title: "Money intelligence",
                  copy: "Invoices, cashouts, sales, and profit read like one financial story.",
                },
              ].map((item) => (
                <Card key={item.title} className="bg-white/7 text-white">
                  <div className="p-6">
                    <item.icon className="h-5 w-5 text-amber-300" />
                    <p className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-white/88">
                      {item.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/62">{item.copy}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] text-white">
              <div className="p-6 lg:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="display-kicker text-white/52">Signal</p>
                    <h2 className="mt-2 font-display text-3xl tracking-[-0.04em]">
                      What makes this thing wild
                    </h2>
                  </div>
                  <Sparkles className="h-6 w-6 text-cyan-300" />
                </div>

                <div className="mt-8 space-y-4">
                  {[
                    "A cinematic visual layer across auth, dashboard, reporting, and forms.",
                    "Custom urgency treatment for stock and expiry, designed to grab attention instantly.",
                    "Search-heavy pharmacist workflow that feels closer to a command palette than a form.",
                    "Unified supplier, invoice, medicine, and cashout records across the product.",
                  ].map((line) => (
                    <div key={line} className="rounded-[1.35rem] border border-white/8 bg-black/20 px-4 py-4 text-sm leading-7 text-white/72">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="bg-[linear-gradient(145deg,rgba(54,255,210,0.12),rgba(255,255,255,0.04))] text-white">
              <div className="p-6 lg:p-8">
                <p className="display-kicker text-cyan-200">Ready to pilot</p>
                <p className="mt-3 text-pretty font-display text-3xl tracking-[-0.04em]">
                  Built for the moment somebody opens it and says, “what the heck is that?”
                </p>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </ProjectBackdrop>
  );
}
