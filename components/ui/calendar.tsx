"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "dropdown",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  startMonth,
  endMonth,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();
  const currentYear = new Date().getFullYear();
  const resolvedStartMonth = startMonth ?? new Date(currentYear - 30, 0);
  const resolvedEndMonth = endMonth ?? new Date(currentYear + 25, 11);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar isolate select-none rounded-[0.7rem] border border-white/12 bg-[#0c1422] p-3.5 text-white shadow-xl [--cell-size:2.25rem]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      startMonth={resolvedStartMonth}
      endMonth={resolvedEndMonth}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code ?? "default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-3", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          "flex size-8 items-center justify-center rounded-[0.7rem] border border-teal-500/40 bg-teal-950/40 text-teal-300 transition-colors hover:bg-teal-900/60 hover:text-teal-100 disabled:pointer-events-none disabled:opacity-40",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          "flex size-8 items-center justify-center rounded-[0.7rem] border border-white/12 bg-white/[0.04] text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-9",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-2 text-sm font-semibold",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative flex h-8 items-center rounded-[0.7rem] border border-white/15 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/10 has-focus:border-teal-500 has-focus:ring-2 has-focus:ring-teal-500/30",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn(
          "absolute inset-0 z-10 cursor-pointer bg-transparent opacity-0 text-foreground [&>option]:bg-[#0c1422] [&>option]:text-white",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "flex select-none items-center gap-1.5 font-medium text-white/90",
          captionLayout === "label"
            ? "text-sm"
            : "text-xs font-semibold [&>svg]:size-3.5 [&>svg]:text-white/60",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex justify-between pb-1", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-center text-[0.8rem] font-medium text-stone-300/80 select-none",
          defaultClassNames.weekday,
        ),
        week: cn("mt-1.5 flex w-full justify-between gap-1", defaultClassNames.week),
        week_number_header: cn(
          "w-8 select-none text-[0.8rem] text-muted-foreground",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-8 w-8 rounded-[0.7rem] p-0 text-center select-none",
          defaultClassNames.day,
        ),
        range_start: cn(
          "rounded-l-[0.7rem] bg-teal-600 text-white",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none bg-teal-950/40 text-teal-200", defaultClassNames.range_middle),
        range_end: cn("rounded-r-[0.7rem] bg-teal-600 text-white", defaultClassNames.range_end),
        today: cn(
          "font-bold text-teal-300 ring-1 ring-teal-500/40 data-[selected=true]:ring-0",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-stone-500 opacity-40 aria-selected:text-muted-foreground aria-selected:opacity-60",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-stone-600 opacity-30 cursor-not-allowed",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4", className)} {...props} />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-3.5", className)} {...props} />
          );
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} buttonVariant={buttonVariant} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-8 items-center justify-center text-center text-xs text-stone-400">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  buttonVariant,
  ...props
}: React.ComponentProps<typeof DayButton> & {
  locale?: Partial<Locale>;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant={buttonVariant ?? "ghost"}
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative flex h-8 w-8 items-center justify-center rounded-[0.7rem] border-0 text-xs font-medium leading-none text-white/90 transition-all select-none hover:bg-white/10 hover:text-white",
        "data-[selected-single=true]:bg-teal-600 data-[selected-single=true]:text-white data-[selected-single=true]:font-bold data-[selected-single=true]:shadow-sm data-[selected-single=true]:hover:bg-teal-500",
        "data-[range-start=true]:bg-teal-600 data-[range-start=true]:text-white data-[range-start=true]:rounded-l-lg",
        "data-[range-middle=true]:bg-teal-950/50 data-[range-middle=true]:text-teal-200 data-[range-middle=true]:rounded-none",
        "data-[range-end=true]:bg-teal-600 data-[range-end=true]:text-white data-[range-end=true]:rounded-r-lg",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
