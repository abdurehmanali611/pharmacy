"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
  hint?: string;
  /** Extra text matched by search but never rendered. */
  keywords?: string;
  icon?: React.ReactNode;
  /** Optional count badge rendered on the right of the option. */
  count?: number;
};

/**
 * Searchable single-select combobox built on the shadcn Popover + Command
 * primitives. Same interaction pattern used across the hotcol-user app.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Select…",
  emptyText = "No matches.",
  searchPlaceholder = "Search…",
  disabled = false,
  className,
  contentClassName,
  id,
  align = "start",
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  id?: string;
  align?: "start" | "center" | "end";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((option) => {
      const haystack =
        `${option.label} ${option.hint ?? ""} ${option.keywords ?? ""} ${option.value}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [options, query]);

  const selected = options.find((option) => option.value === value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between gap-2 border-white/12 bg-[#060e1a]/80 font-normal text-white transition-colors hover:border-apex-orange/45 hover:bg-[#14263b] hover:text-white aria-expanded:border-apex-orange/50 aria-expanded:bg-[#14263b] aria-expanded:text-white",
            className,
          )}
        >
          <span
            className={cn(
              "flex min-w-0 items-center gap-2 truncate text-left",
              !selected && "text-white/40",
            )}
          >
            {selected?.icon}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-white/40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "w-(--radix-popover-trigger-width) border-apex-orange/20 bg-[#0c1828] p-1.5",
          contentClassName,
        )}
      >
        <Command shouldFilter={false} className="bg-transparent text-white">
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.value}-${option.label}`}
                      className="rounded-lg px-3 py-2.5 text-white/75 transition-colors hover:bg-apex-orange/10 hover:text-white data-[selected=true]:bg-apex-orange/18 data-[selected=true]:text-white"
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                        setSearch("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
                        {option.icon}
                        <span className="truncate">{option.label}</span>
                        {option.hint ? (
                          <span className="text-muted-foreground">
                            · {option.hint}
                          </span>
                        ) : null}
                      </span>
                      {typeof option.count === "number" ? (
                        <span className="ml-2 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {option.count}
                        </span>
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
