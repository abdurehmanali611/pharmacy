"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { exportExcel, exportPdf, type ExportDocument } from "@/lib/export";

/**
 * "Export" button with Excel and PDF choices.
 * `build` runs only when a format is picked, so large tables are not prepared until needed.
 */
export function ExportMenu({
  build,
  excel = true,
  pdf = true,
  disabled = false,
  label = "Export",
}: {
  build: () => ExportDocument;
  excel?: boolean;
  pdf?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"excel" | "pdf" | null>(null);

  const run = async (kind: "excel" | "pdf") => {
    setBusy(kind);
    try {
      const doc = build();
      if (!doc.sections.some((section) => section.rows.length)) {
        toast.error("Nothing to export for the current view");
        return;
      }
      if (kind === "excel") await exportExcel(doc);
      else await exportPdf(doc);
      toast.success(`${kind === "excel" ? "Excel" : "PDF"} file downloaded`);
      setOpen(false);
    } catch {
      toast.error("Could not create the file");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled} className="gap-1.5">
          <Download className="size-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 space-y-1 p-2">
        {excel ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("excel")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-60"
          >
            {busy === "excel" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4 text-emerald-300" />}
            Excel (.xlsx)
          </button>
        ) : null}
        {pdf ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("pdf")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-60"
          >
            {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4 text-rose-300" />}
            PDF document
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
