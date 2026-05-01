"use client";

import type { UseFieldArrayRemove, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <Card className="rounded-3xl p-6">
      <CardHeader>
        <CardTitle>Sale cart</CardTitle>
        <CardDescription>Sell multiple medicines in one checkout and adjust quantity or price before saving.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {fields.length ? (
            fields.map((field, index) => {
              const currentItem = items[index];
              const medicine = medicines.find((item) => item.name === currentItem?.medicine_name);
              const requestedQuantity = Number(currentItem?.quantity || 0);
              const availableStock = Number(medicine?.quantity ?? 0);
              const lineTotal = Number(currentItem?.quantity || 0) * Number(currentItem?.price || 0);
              const insufficientStock = requestedQuantity > availableStock;

              return (
                <div key={field.id} className="rounded-3xl border border-white/10 bg-muted/30 p-4">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold">{currentItem?.medicine_name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={insufficientStock ? "destructive" : "outline"}>
                          Stock: {availableStock}
                        </Badge>
                        <Badge variant="secondary">
                          Line total: {formatCurrency(lineTotal)}
                        </Badge>
                      </div>
                    </div>
                    <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                      Remove
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <CustomFormField
                      name={`items.${index}.quantity` as const}
                      control={form.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Quantity"
                      placeholder="Enter quantity"
                      type="number"
                    />
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
                    <p className="mt-3 text-sm font-semibold text-destructive">
                      Requested quantity is higher than available stock.
                    </p>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              Search medicines on the left and add them here to build one sale with multiple items.
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-muted p-4">
            <p className="text-sm text-muted-foreground">Grand total</p>
            <p className="mt-2 text-3xl font-semibold">{formatCurrency(grandTotal)}</p>
          </div>

          <Button type="submit" className="w-full" disabled={loading || !fields.length}>
            {loading ? "Recording..." : "Record sale"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
