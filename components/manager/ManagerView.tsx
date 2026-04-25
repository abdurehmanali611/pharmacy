"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Calendar as CalendarIcon } from "lucide-react";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { ReportDataTable } from "@/components/report/ReportDataTable";
import { formatCurrency } from "@/lib/format";
import {
  createMedicine,
  CreateUser,
  deleteMedicine,
  deleteUser,
  EditMedicine,
  EditUser,
  fetchMedicine,
  fetchPurchase,
  fetchUser,
  ChangePassword,
  Logout,
} from "@/lib/actions";
import { addMedicine, changePasswordWithConfirm, login } from "@/lib/validations";
import type { MedicineData, PurchaseData, UserData } from "@/lib/actions";
import type { z } from "zod";

type StockLevel = "critical" | "low" | "ok";

function getStockLevel(quantity: number): StockLevel {
  if (quantity <= 5) return "critical";
  if (quantity <= 20) return "low";
  return "ok";
}

function getStockLabel(level: StockLevel) {
  // Stock urgency labels (expiry isn't tracked yet).
  switch (level) {
    case "critical":
      return "CRITICAL";
    case "low":
      return "LOW";
    default:
      return "OK";
  }
}

function getStockVariant(
  level: StockLevel,
): React.ComponentProps<typeof Badge>["variant"] {
  switch (level) {
    case "critical":
      return "destructive";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}

const purchaseColumns: ColumnDef<PurchaseData>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
  },
  {
    accessorKey: "medicine_name",
    header: "Medicine",
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "total_price",
    header: "Revenue",
    cell: ({ row }) => formatCurrency(row.original.total_price),
  },
  {
    accessorKey: "profit",
    header: "Profit",
    cell: ({ row }) => formatCurrency(row.original.profit),
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
];

export default function ManagerView() {
  const [pharmacy, setPharmacy] = useState("");
  const [logo, setLogo] = useState("");
  const [pharmacyTin, setPharmacyTin] = useState("");
  const [selected, setSelected] = useState<"Report" | "medicines" | "credentials">("Report");
  const [medicines, setMedicines] = useState<MedicineData[]>([]);
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [medicineToEdit, setMedicineToEdit] = useState<MedicineData | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportMode, setReportMode] = useState<"daily" | "monthly">("daily");
  const [reportDay, setReportDay] = useState(() => new Date().toISOString().slice(0, 10)); // yyyy-mm-dd
  const [reportMonth, setReportMonth] = useState(() => new Date().toISOString().slice(0, 7)); // yyyy-mm

  const medicineForm = useForm<z.infer<typeof addMedicine>>({
    resolver: zodResolver(addMedicine) as any,
    defaultValues: {
      name: "",
      price: 0,
      cost: 0,
      quantity: 0,
      description: "",
      supplier_name: "",
      supplier_phone: "",
      supplier_email: "",
    },
  });

  const credentialForm = useForm<z.infer<typeof login>>({
    resolver: zodResolver(login),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof changePasswordWithConfirm>>({
    resolver: zodResolver(changePasswordWithConfirm),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_new_password: "",
    },
  });

  const pharmacists = users.filter((user) => user.role.toLowerCase() === "pharmacist");

  useEffect(() => {
    if (selected !== "credentials") {
      return;
    }

    // Single-pharmacist UX: if one exists, default to updating it (unless manager explicitly clicked Edit).
    if (!userToEdit && pharmacists.length === 1) {
      const existing = pharmacists[0];
      setUserToEdit(existing);
      credentialForm.reset({ username: existing.username, password: "" });
    }
  }, [selected, pharmacists, userToEdit, credentialForm]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const date = new Date(item.created_at);
      if (Number.isNaN(date.getTime())) {
        return false;
      }

      if (reportMode === "daily") {
        const key = date.toISOString().slice(0, 10);
        return key === reportDay;
      }

      const key = date.toISOString().slice(0, 7);
      return key === reportMonth;
    });
  }, [purchases, reportDay, reportMonth, reportMode]);

  const report = useMemo(() => {
    const totalSales = filteredPurchases.reduce((sum, item) => sum + Number(item.total_price), 0);
    const totalQuantity = filteredPurchases.reduce((sum, item) => sum + item.quantity, 0);
    const totalProfit = filteredPurchases.reduce((sum, item) => sum + Number(item.profit), 0);
    const byMedicine = filteredPurchases.reduce<Record<string, { quantity: number; revenue: number; profit: number }>>((acc, item) => {
      const existing = acc[item.medicine_name] ?? { quantity: 0, revenue: 0, profit: 0 };
      acc[item.medicine_name] = {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + Number(item.total_price),
        profit: existing.profit + Number(item.profit),
      };
      return acc;
    }, {});

    return {
      totalSales,
      totalQuantity,
      totalProfit,
      byMedicine: Object.entries(byMedicine).map(([medicine_name, stats]) => ({
        medicine_name,
        ...stats,
      })),
    };
  }, [filteredPurchases]);

  const loadAll = async () => {
    const [medicineData, purchaseData, userData] = await Promise.all([fetchMedicine(), fetchPurchase(), fetchUser()]);
    setMedicines(medicineData ?? []);
    setPurchases(purchaseData ?? []);
    setUsers(userData ?? []);
  };

  useEffect(() => {
    setPharmacy(localStorage.getItem("Pharmacy") ?? "");
    setLogo(localStorage.getItem("Logo") ?? "");
    setPharmacyTin(localStorage.getItem("PharmacyTin") ?? "");
    void (async () => {
      await loadAll();
    })();
  }, []);

  const handleSaveMedicine = async (data: z.infer<typeof addMedicine>) => {
    setLoading(true);
    try {
      if (medicineToEdit) {
        await EditMedicine({ ...data, id: medicineToEdit.id }, setLoading);
        setMedicineToEdit(null);
      } else {
        await createMedicine(data, setLoading);
      }
      await loadAll();
      medicineForm.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditMedicine = (medicine: MedicineData) => {
    setMedicineToEdit(medicine);
    medicineForm.reset({
      name: medicine.name,
      price: medicine.price,
      cost: medicine.cost,
      quantity: medicine.quantity,
      description: medicine.description,
      supplier_name: medicine.supplier_name,
      supplier_phone: medicine.supplier_phone,
      supplier_email: medicine.supplier_email ?? "",
    });
    setSelected("medicines");
  };

  const handleRemoveMedicine = async (id: string) => {
    setLoading(true);
    try {
      await deleteMedicine(Number(id), setLoading);
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredential = async (data: z.infer<typeof login>) => {
    setLoading(true);
    try {
      if (pharmacists.length > 0) {
        return;
      }
      await CreateUser(
        {
          username: data.username,
          password: data.password,
          pharmacy_name: pharmacy,
          role: "Pharmacist",
          logoUrl: logo,
          pharmacy_tin: pharmacyTin,
        },
        setLoading,
      );
      await loadAll();
      credentialForm.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleEditCredential = (user: UserData) => {
    setUserToEdit(user);
    credentialForm.reset({ username: user.username, password: "" });
    setSelected("credentials");
  };

  const handleSaveEditedUser = async (data: z.infer<typeof login>) => {
    if (!userToEdit) {
      return;
    }
    setLoading(true);
    try {
      await EditUser(
        {
          id: userToEdit.id,
          username: data.username,
          password: data.password,
          pharmacy_name: pharmacy,
          role: "Pharmacist",
          logoUrl: logo,
          pharmacy_tin: pharmacyTin,
        },
        setLoading,
      );
      setUserToEdit(null);
      await loadAll();
      credentialForm.reset();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCredential = async (id: string) => {
    setLoading(true);
    try {
      await deleteUser(Number(id), setLoading);
      await loadAll();
      if (userToEdit?.id === id) {
        setUserToEdit(null);
        credentialForm.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (data: z.infer<typeof changePasswordWithConfirm>) => {
    setLoading(true);
    try {
      await ChangePassword(
        { old_password: data.old_password, new_password: data.new_password },
        setLoading,
      );
      passwordForm.reset();
    } finally {
      setLoading(false);
    }
  };

  const credentialActionLabel =
    userToEdit || pharmacists.length ? "Update Pharmacist" : "Create Pharmacist";

  return (
    <div className="p-4 space-y-6">
      <div className="rounded-3xl bg-secondary p-6 shadow-lg shadow-black/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={logo || "/assets/pharmacy.jpg"} alt={pharmacy || "Pharmacy"} />
              <AvatarFallback>{pharmacy ? pharmacy[0] : "P"}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-semibold">{pharmacy || "Pharmacy"}</h1>
              <p className="text-sm text-muted-foreground">Manager dashboard with live sales, stock, and credential controls.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-muted/40 p-1">
              <Button
                type="button"
                variant={selected === "Report" ? "default" : "ghost"}
                size="sm"
                aria-pressed={selected === "Report"}
                className="rounded-full px-4"
                onClick={() => setSelected("Report")}
              >
                Report
              </Button>
              <Button
                type="button"
                variant={selected === "medicines" ? "default" : "ghost"}
                size="sm"
                aria-pressed={selected === "medicines"}
                className="rounded-full px-4"
                onClick={() => setSelected("medicines")}
              >
                Medicines
              </Button>
              <Button
                type="button"
                variant={selected === "credentials" ? "default" : "ghost"}
                size="sm"
                aria-pressed={selected === "credentials"}
                className="rounded-full px-4"
                onClick={() => setSelected("credentials")}
              >
                Credentials
              </Button>
            </div>

            <Button variant="ghost" onClick={Logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {selected === "Report" && (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <Card className="space-y-4 p-6">
                <CardHeader>
                  <CardTitle>Sales Snapshot</CardTitle>
                  <CardDescription>
                    Monitor total revenue, units sold, and profit by item.
                  </CardDescription>
                </CardHeader>
                <div className="flex flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-muted/40 p-1">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full px-4"
                      variant={reportMode === "daily" ? "default" : "ghost"}
                      aria-pressed={reportMode === "daily"}
                      onClick={() => setReportMode("daily")}
                    >
                      Daily
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full px-4"
                      variant={reportMode === "monthly" ? "default" : "ghost"}
                      aria-pressed={reportMode === "monthly"}
                      onClick={() => setReportMode("monthly")}
                    >
                      Monthly
                    </Button>
                  </div>

                  {reportMode === "daily" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Date</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-[190px] justify-between rounded-xl"
                          >
                            <span className={reportDay ? "text-foreground" : "text-muted-foreground"}>
                              {reportDay ? format(parseISO(reportDay), "PPP") : "Pick a date"}
                            </span>
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={reportDay ? parseISO(reportDay) : undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              setReportDay(format(date, "yyyy-MM-dd"));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Month</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-[190px] justify-between rounded-xl"
                          >
                            <span className={reportMonth ? "text-foreground" : "text-muted-foreground"}>
                              {reportMonth
                                ? format(parseISO(`${reportMonth}-01`), "MMMM yyyy")
                                : "Pick a month"}
                            </span>
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                            mode="single"
                            selected={reportMonth ? parseISO(`${reportMonth}-01`) : undefined}
                            onSelect={(date) => {
                              if (!date) return;
                              setReportMonth(format(date, "yyyy-MM"));
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-3xl border border-white/10 bg-muted p-4">
                    <p className="text-sm uppercase text-muted-foreground">Total revenue</p>
                    <p className="mt-2 text-3xl font-semibold">{formatCurrency(report.totalSales)}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-muted p-4">
                    <p className="text-sm uppercase text-muted-foreground">Items sold</p>
                    <p className="mt-2 text-3xl font-semibold">{report.totalQuantity}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-muted p-4">
                    <p className="text-sm uppercase text-muted-foreground">Profit</p>
                    <p className="mt-2 text-3xl font-semibold">{formatCurrency(report.totalProfit)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="space-y-4 p-6">
                <CardHeader>
                  <CardTitle>Top-selling items</CardTitle>
                  <CardDescription>Revenue and profit by medicine.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.byMedicine.length ? (
                    <div className="space-y-4">
                      {report.byMedicine.map((item) => (
                        <div key={item.medicine_name} className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold">{item.medicine_name}</p>
                            <p className="text-sm text-muted-foreground">{item.quantity} sold</p>
                          </div>
                          <div className="flex items-center gap-4 text-right">
                            <span className="text-sm">Revenue {formatCurrency(item.revenue)}</span>
                            <span className="text-sm text-emerald-400">Profit {formatCurrency(item.profit)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden rounded-3xl bg-secondary p-6">
              <CardHeader>
                <CardTitle>Recent sales</CardTitle>
                <CardDescription>Latest register entries made by staff.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReportDataTable columns={purchaseColumns} data={filteredPurchases} searchColumnId="medicine_name" />
              </CardContent>
            </Card>
          </>
        )}

        {selected === "medicines" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="space-y-4 rounded-3xl p-6">
              <CardHeader>
                <CardTitle>{medicineToEdit ? "Edit Medicine" : "Add New Medicine"}</CardTitle>
                <CardDescription>Keep stock, pricing, and supplier details up to date.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={medicineForm.handleSubmit(handleSaveMedicine)}>
                  <CustomFormField
                    name="name"
                    control={medicineForm.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Medicine Name"
                    placeholder="Enter medicine name"
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <CustomFormField
                      name="price"
                      control={medicineForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Sale Price"
                      placeholder="0.00"
                      type="number"
                    />
                    <CustomFormField
                      name="cost"
                      control={medicineForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Cost Price"
                      placeholder="0.00"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <CustomFormField
                      name="quantity"
                      control={medicineForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Quantity"
                      placeholder="0"
                      type="number"
                    />
                    <CustomFormField
                      name="supplier_name"
                      control={medicineForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Supplier Name"
                      placeholder="Supplier name"
                    />
                  </div>
                  <CustomFormField
                    name="supplier_phone"
                    control={medicineForm.control}
                    fieldType={formFieldTypes.PHONE_INPUT}
                    label="Supplier Phone"
                    placeholder="Enter phone number"
                  />
                  <CustomFormField
                    name="supplier_email"
                    control={medicineForm.control}
                    fieldType={formFieldTypes.INPUT}
                    label="Supplier Email"
                    placeholder="Optional email"
                    type="email"
                  />
                  <CustomFormField
                    name="description"
                    control={medicineForm.control}
                    fieldType={formFieldTypes.TEXTAREA}
                    label="Description"
                    placeholder="Short performance or usage note"
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : medicineToEdit ? "Update medicine" : "Add medicine"}
                  </Button>
                  {medicineToEdit ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setMedicineToEdit(null);
                        medicineForm.reset();
                      }}
                    >
                      Cancel edit
                    </Button>
                  ) : null}
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-3xl p-6">
              <CardHeader>
                <CardTitle>Medicine Inventory</CardTitle>
                <CardDescription>Review stock, price, and cost for every item.</CardDescription>
              </CardHeader>
              <CardContent>
                <TooltipProvider>
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Margin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.length ? (
                      medicines.map((item) => (
                        <TableRow
                          key={item.id}
                          className={
                            getStockLevel(Number(item.quantity)) === "critical"
                              ? "hover:bg-destructive/10"
                              : getStockLevel(Number(item.quantity)) === "low"
                                ? "hover:bg-amber-500/10"
                                : "hover:bg-muted/50"
                          }
                        >
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>{formatCurrency(item.cost)}</TableCell>
                          <TableCell>
                            {(() => {
                              const qty = Number(item.quantity);
                              const level = getStockLevel(qty);
                              return (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex items-center gap-2">
                                      <Badge variant={getStockVariant(level)}>
                                        {getStockLabel(level)}
                                      </Badge>
                                      <span className="tabular-nums">{qty}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent sideOffset={6}>
                                    <span className="font-medium">
                                      {level === "critical"
                                        ? "Critical stock"
                                        : level === "low"
                                          ? "Low stock"
                                          : "Stock OK"}
                                    </span>
                                    <span className="opacity-80"> — {qty} units available</span>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })()}
                          </TableCell>
                          <TableCell>{formatCurrency(item.price - item.cost)}</TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleStartEditMedicine(item)}>
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete medicine?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove <span className="font-medium">{item.name}</span> from your inventory.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveMedicine(item.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No medicines added yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  </Table>
                </TooltipProvider>

                <div className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-muted/40 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Stock level guide</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="inline-flex items-center gap-2">
                      <Badge variant="destructive">CRITICAL</Badge>
                      <span>\(\le 5\) units</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Badge variant="secondary">LOW</Badge>
                      <span>6–20 units</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <Badge variant="outline">OK</Badge>
                      <span>\(\gt 20\) units</span>
                    </div>
                  </div>
                  <p className="text-xs">
                    Tip: hover the badge in the Qty column to see the exact level text and available units.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selected === "credentials" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="space-y-6">
              <Card className="rounded-3xl p-6">
                <CardHeader>
                  <CardTitle>Pharmacist Credentials</CardTitle>
                  <CardDescription>Create or manage pharmacist users for your pharmacy.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-4"
                    onSubmit={credentialForm.handleSubmit(
                      userToEdit || pharmacists.length ? handleSaveEditedUser : handleSaveCredential,
                    )}
                  >
                    <CustomFormField
                      name="username"
                      control={credentialForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Username"
                      placeholder="Enter username"
                    />
                    <CustomFormField
                      name="password"
                      control={credentialForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Password"
                      placeholder={
                        userToEdit || pharmacists.length
                          ? "Enter new password"
                          : "Enter password"
                      }
                      type="password"
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Saving..." : credentialActionLabel}
                    </Button>
                    {userToEdit ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setUserToEdit(null);
                          credentialForm.reset();
                        }}
                      >
                        Cancel edit
                      </Button>
                    ) : null}
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-3xl p-6">
                <CardHeader>
                  <CardTitle>Change your password</CardTitle>
                  <CardDescription>Update your manager login password securely.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-4" onSubmit={passwordForm.handleSubmit(handlePasswordChange)}>
                    <CustomFormField
                      name="old_password"
                      control={passwordForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Current Password"
                      placeholder="Enter current password"
                      type="password"
                    />
                    <CustomFormField
                      name="new_password"
                      control={passwordForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="New Password"
                      placeholder="Enter new password"
                      type="password"
                    />
                    <CustomFormField
                      name="confirm_new_password"
                      control={passwordForm.control}
                      fieldType={formFieldTypes.INPUT}
                      label="Confirm Password"
                      placeholder="Confirm new password"
                      type="password"
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Updating..." : "Update password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl p-6">
              <CardHeader>
                <CardTitle>Pharmacist roster</CardTitle>
                <CardDescription>List of active pharmacist accounts in your pharmacy.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pharmacists.length ? (
                      pharmacists.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditCredential(user)}>
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete pharmacist account?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove <span className="font-medium">{user.username}</span>. You can create a new pharmacist after deletion.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveCredential(user.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No pharmacist accounts found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
