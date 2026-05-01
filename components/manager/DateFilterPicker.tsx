"use client";

import { format, parseISO } from "date-fns";
import { CalendarIcon, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateFilterPicker({
  value,
  onChange,
  placeholder,
  granularity = "day",
  allowClear = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  granularity?: "day" | "month";
  allowClear?: boolean;
}) {
  const selectedDate = value
    ? granularity === "month"
      ? parseISO(`${value}-01`)
      : parseISO(value)
    : undefined;

  const label = value
    ? granularity === "month"
      ? format(parseISO(`${value}-01`), "MMMM yyyy")
      : format(parseISO(value), "PPP")
    : placeholder;

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="justify-between gap-3">
            <span>{label}</span>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(granularity === "month" ? format(date, "yyyy-MM") : format(date, "yyyy-MM-dd"));
            }}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      {allowClear && value ? (
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange("")}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
