"use client";

import { useMemo } from "react";
import { Pill, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DRUG_CATEGORIES } from "@/constants";
import { formatCurrency } from "@/lib/format";
import type { MedicineData } from "@/lib/actions";

function getStockTone(quantity: number) {
  if (quantity <= 5) return "destructive";
  if (quantity <= 20) return "secondary";
  return "outline";
}

export function MedicineCatalog({
  medicines,
  selectedCategory,
  onSelectCategory,
  onAddMedicine,
}: {
  medicines: MedicineData[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onAddMedicine: (medicine: MedicineData) => void;
}) {
  const categoryOptions = useMemo(
    () => [{ label: "All categories", value: "all" }, ...DRUG_CATEGORIES.map((item) => ({ label: item.name, value: item.value }))],
    [],
  );

  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) => {
      if (Number(medicine.quantity) <= 0) return false;
      if (selectedCategory === "all") return true;
      return medicine.category === selectedCategory;
    });
  }, [medicines, selectedCategory]);

  return (
    <Card className="rounded-3xl p-6">
      <CardHeader>
        <CardTitle>Medicine catalog</CardTitle>
        <CardDescription>
          Search quickly, filter by category, then tap a medicine to add it to the sale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={selectedCategory === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectCategory(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Command className="rounded-3xl border border-white/10 bg-muted/30">
          <div className="border-b border-white/10 px-3 py-3">
            <div className="group flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all focus-within:border-amber-300/35 focus-within:bg-white/10 focus-within:shadow-[0_0_0_3px_rgba(255,179,71,0.12)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300/12 text-amber-200">
                <Search className="h-4 w-4" />
              </div>
              <CommandInput
                placeholder="Search by medicine, supplier, batch, or category..."
                className="h-11 bg-transparent text-[0.95rem] text-foreground placeholder:text-muted-foreground/70"
              />
            </div>
          </div>
          <CommandList className="max-h-[420px] p-2">
            <CommandEmpty>No medicines match this search.</CommandEmpty>
            <CommandGroup heading="Available medicines">
              {filteredMedicines.map((medicine) => (
                <CommandItem
                  key={medicine.id}
                  value={[
                    medicine.name,
                    medicine.supplier_name,
                    medicine.batch_number,
                    medicine.category ?? "",
                  ].join(" ")}
                  onSelect={() => onAddMedicine(medicine)}
                  className="mb-2 rounded-2xl border border-white/10 bg-background/75 px-4 py-4"
                >
                  <div className="flex w-full items-start justify-between gap-3">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{medicine.name}</p>
                        <Badge variant={getStockTone(Number(medicine.quantity))}>
                          {medicine.quantity} in stock
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Pill className="h-3.5 w-3.5" />
                          {DRUG_CATEGORIES.find((item) => item.value === medicine.category)?.name ?? "Uncategorized"}
                        </span>
                        <span>Supplier: {medicine.supplier_name}</span>
                        <span>Batch: {medicine.batch_number || "N/A"}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold">{formatCurrency(medicine.price)}</p>
                      <p className="text-xs text-muted-foreground">Tap to add</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CardContent>
    </Card>
  );
}
