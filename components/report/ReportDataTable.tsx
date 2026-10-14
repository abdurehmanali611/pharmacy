"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search, Settings2 } from "lucide-react";

import { workspaceInnerPanelClass } from "@/components/manager/workspace";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ReportDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumnId?: string;
}

export function ReportDataTable<TData, TValue>({
  columns,
  data,
  searchColumnId,
}: ReportDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [search, setSearch] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  React.useEffect(() => {
    if (searchColumnId) {
      table.getColumn(searchColumnId)?.setFilterValue(search);
    }
  }, [search, searchColumnId, table]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-apex-orange-light/70" />
          <Input
            placeholder="Search records..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 border-white/10 bg-white/[0.035] pl-9 text-white placeholder:text-white/50 focus-visible:border-apex-orange/40 focus-visible:ring-apex-orange/20"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto flex h-10 items-center gap-2 border-white/12 bg-white/[0.045] text-white/85 hover:bg-white/[0.08]"
            >
              <Settings2 className="h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={cn(workspaceInnerPanelClass, "overflow-hidden")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-white/60">
                    {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-white/8 hover:bg-white/[0.045]">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-sm text-white/85">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/35">
                      <Search className="size-4" />
                    </div>
                    <span className="font-medium text-white/75">
                      {search && searchColumnId ? "No matching records" : "No records yet"}
                    </span>
                    <span className="text-xs text-white/45">
                      {search && searchColumnId
                        ? "Try adjusting your search."
                        : "Records will appear here when available."}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
        <p className="text-xs text-white/55">
          Showing{" "}
          <span className="font-medium tabular-nums text-white/80">
            {table.getRowModel().rows.length
              ? `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getRowModel().rows.length}`
              : "0"}
          </span>{" "}
          of <span className="font-medium tabular-nums text-white/80">{table.getFilteredRowModel().rows.length}</span> records
        </p>
        <div className="flex items-center gap-2">
          <span className="min-w-16 text-center text-xs font-medium tabular-nums text-white/55">
            {table.getState().pagination.pageIndex + 1} / {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-white/12 bg-white/[0.045] text-white/85 hover:bg-white/[0.08]"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/12 bg-white/[0.045] text-white/85 hover:bg-white/[0.08]"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
