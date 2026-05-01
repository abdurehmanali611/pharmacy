"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ManagerSectionKey } from "@/components/manager/types";

const sections: { key: ManagerSectionKey; label: string }[] = [
  { key: "Report", label: "Report" },
  { key: "medicines", label: "Medicines" },
  { key: "suppliers", label: "Suppliers" },
  { key: "invoices", label: "Invoices" },
  { key: "cashouts", label: "Cashouts" },
  { key: "credentials", label: "Credentials" },
];

export function ManagerHeader({
  pharmacy,
  logo,
  selected,
  onSelect,
  onLogout,
}: {
  pharmacy: string;
  logo: string;
  selected: ManagerSectionKey;
  onSelect: (section: ManagerSectionKey) => void;
  onLogout: () => void;
}) {
  return (
    <div className="glass panel-glow rounded-[2rem] border border-white/10 p-6 shadow-black/30">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-white/10">
            <AvatarImage src={logo || "/assets/pharmacy.jpg"} alt={pharmacy || "Pharmacy"} />
            <AvatarFallback>{pharmacy ? pharmacy[0] : "P"}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Badge variant="outline" className="border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.28em] text-amber-200">
              Manager deck
            </Badge>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-[-0.05em] text-white">
                {pharmacy || "Pharmacy"}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/62">
                Stock, suppliers, invoices, cashouts, and reporting arranged like a control chamber instead of a spreadsheet graveyard.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/6 p-1.5 backdrop-blur-sm">
            {sections.map((section) => (
              <Button
                key={section.key}
                type="button"
                variant={selected === section.key ? "default" : "ghost"}
                size="sm"
                aria-pressed={selected === section.key}
                className="rounded-full px-4 text-white data-[variant=ghost]:text-white/72"
                onClick={() => onSelect(section.key)}
              >
                {section.label}
              </Button>
            ))}
          </div>

          <Button variant="outline" className="border-white/12 bg-white/6 text-white hover:bg-white/10" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
