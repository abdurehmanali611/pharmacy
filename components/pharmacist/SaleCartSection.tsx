"use client";

import type { UseFieldArrayRemove, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { workspacePanelClass } from "@/components/manager/workspace";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { saleCart } from "@/lib/validations";
import type { MedicineData } from "@/lib/actions";

export function SaleCartSection({
  form,
  fields,
  loading,
  medicines,
  remove,
  onSubmit,
}: {
  form: UseFormReturn<z.input<typeof saleCart>, unknown, z.output<typeof saleCart>>;
  fields: Array<{ id: string }>;
  loading: boolean;
  medicines: MedicineData[];
  remove: UseFieldArrayRemove;
  onSubmit: (data: z.infer<typeof saleCart>) => void | Promise<void>;
}) {
  const items = form.watch("items");

  const grandTotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0,
  );

  const adjustQuantity = (index: number, delta: number, max: number) => {
    const current = Number(items[index]?.quantity || 0);
    const next = Math.min(Math.max(1, current + delta), Math.max(1, max));
    if (next === current) return;
    form.setValue(`items.${index}.quantity`, next, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <Card className={`${workspacePanelClass} p-6`}>
      <CardHeader className="border-b border-apex-orange/12 bg-[linear-gradient(100deg,rgba(232,149,30,0.08),transparent)] px-0 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="display-kicker text-apex-orange-light/85">Counter</p>
            <CardTitle className="mt-2 font-display text-2xl">Sale cart</CardTitle>
            <CardDescription>
              Review the items you picked and adjust quantity or price before recording the sale.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0 border-white/10 bg-white/8 text-white/75">
            {fields.length} item{fields.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {fields.length ? (
            fields.map((field, index) => {
              const currentItem = items[index];
              const medicine = medicines.find((item) => item.name === currentItem?.medicine_name);
              const requestedQuantity = Number(currentItem?.quantity || 0);
              const availableStock = Number(medicine?.quantity ?? 0);
              const maxQuantity = Math.max(1, availableStock);
              const lineTotal = Number(currentItem?.quantity || 0) * Number(currentItem?.price || 0);
              const insufficientStock = requestedQuantity > availableStock;

              return (
                <div key={field.id} className="rounded-2xl border border-apex-orange/12 bg-[#081422]/70 p-4">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white/90">{currentItem?.medicine_name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={insufficientStock ? "destructive" : "outline"}>
                          Stock: {availableStock}
                        </Badge>
                        <Badge variant="secondary" className="border-white/10 bg-white/8 text-white/75">
                          Line total: {formatCurrency(lineTotal)}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-300 hover:bg-red-500/12 hover:text-red-200"
                      aria-label={`Remove ${currentItem?.medicine_name}`}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white/80">Quantity</p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="border-white/12 bg-white/5"
                          disabled={requestedQuantity <= 1}
                          onClick={() => adjustQuantity(index, -1, maxQuantity)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          readOnly
                          value={requestedQuantity}
                          aria-label="Quantity"
                          className="h-10 w-16 text-center tabular-nums"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="border-white/12 bg-white/5"
                          disabled={requestedQuantity >= maxQuantity}
                          onClick={() => adjustQuantity(index, 1, maxQuantity)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <CustomFormField
                      name={`items.${index}.price` as const}
                      control={form.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Sale price"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>

                  {insufficientStock ? (
                    <p className="mt-3 text-sm font-semibold text-red-300">
                      Requested quantity is higher than available stock.
                    </p>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/3 p-8 text-center">
              <ShoppingCart className="mb-3 h-9 w-9 text-white/25" />
              <p className="text-sm font-medium text-white/70">Your cart is empty</p>
              <p className="mt-1 max-w-xs text-sm text-white/40">
                Order a medicine from the catalog, or batch-select several to build one sale.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl border border-apex-orange/20 bg-[linear-gradient(120deg,rgba(232,149,30,0.12),rgba(8,20,34,0.8))] p-4">
            <p className="text-sm text-white/55">Grand total</p>
            <p className="font-display text-3xl font-semibold text-apex-orange-light">
              {formatCurrency(grandTotal)}
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !fields.length}
          >
            {loading ? "Recording…" : `Record sale · ${formatCurrency(grandTotal)}`}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="border-t border-white/8 pt-4">
        <p className="text-xs text-white/40">
          Quantities are capped at available stock. Edit the sale price for discounts before recording.
        </p>
      </CardFooter>
    </Card>
  );
}
