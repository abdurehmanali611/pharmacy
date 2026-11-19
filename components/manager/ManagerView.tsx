"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseISO } from "date-fns";
import { AlertTriangle, BadgeDollarSign, ClipboardCheck, HandCoins, Hourglass, Package, TimerOff, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { AppShell } from "@/components/chrome/AppShell";
import type { HeaderStat } from "@/components/chrome/AppShell";
import type { AppNotification } from "@/components/chrome/HeaderActions";
import { formatCurrency } from "@/lib/format";
import { creditDue, daysToExpiry, toNumber } from "@/lib/inventory";
import { getManagerPageMeta, MANAGER_NAV } from "@/components/manager/navigation";
import { CashoutManagementSection } from "@/components/manager/sections/CashoutManagementSection";
import { DiscountRulesSection } from "@/components/manager/sections/DiscountRulesSection";
import { CredentialManagementSection } from "@/components/manager/sections/CredentialManagementSection";
import { InvoiceManagementSection } from "@/components/manager/sections/InvoiceManagementSection";
import { SalesAgentReportsSection } from "@/components/manager/sections/SalesAgentReportsSection";
import { InventoryPaymentSection } from "@/components/manager/sections/InventoryPaymentSection";
import { ManagerReportSection } from "@/components/manager/sections/ManagerReportSection";
import { MedicineManagementSection } from "@/components/manager/sections/MedicineManagementSection";
import { PendingApprovalsSection } from "@/components/manager/sections/PendingApprovalsSection";
import { SalesRulesSection } from "@/components/manager/sections/SalesRulesSection";
import { SupplierManagementSection } from "@/components/manager/sections/SupplierManagementSection";
import type { ManagerSectionKey } from "@/components/manager/types";
import {
  ChangePassword,
  createCashoutRecord,
  deleteCashoutRecord,
  createInvoiceRecord,
  createMedicine,
  createSupplierRecord,
  deleteInvoiceRecord,
  deleteMedicine,
  deleteSupplierRecord,
  deleteUser,
  editCashoutRecord,
  editInvoiceRecord,
  EditMedicine,
  editSupplierRecord,
  fetchApprovalRequiredMedicines,
  fetchCashouts,
  fetchDiscountRules,
  fetchMedicine,
  fetchInvoices,
  fetchMedicinePage,
  fetchPendingSales,
  fetchPurchase,
  fetchStockLosses,
  fetchQuantitySaleRules,
  fetchSuppliers,
  fetchUser,
  importMedicinesExcel,
  Logout,
  type ApprovalRequiredMedicineData,
  type CashoutData,
  type DiscountRuleData,
  type InvoiceData,
  type MedicineData,
  type PendingSaleData,
  type PurchaseData,
  type StockLossData,
  type QuantitySaleRuleData,
  type SupplierData,
  type UserData,
} from "@/lib/actions";
import {
  addCashout,
  addInvoice,
  addMedicine,
  addSupplier,
  changePasswordWithConfirm,
} from "@/lib/validations";

export default function ManagerView() {
  const [pharmacy, setPharmacy] = useState("");
  const [logo, setLogo] = useState("");
  const [username, setUsername] = useState("");
  const [selected, setSelected] = useState<ManagerSectionKey>("Report");
  const [medicines, setMedicines] = useState<MedicineData[]>([]);
  const [allMedicines, setAllMedicines] = useState<MedicineData[]>([]);
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [cashouts, setCashouts] = useState<CashoutData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [medicineToEdit, setMedicineToEdit] = useState<MedicineData | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<SupplierData | null>(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState<InvoiceData | null>(null);
  const [cashoutToEdit, setCashoutToEdit] = useState<CashoutData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importingMedicines, setImportingMedicines] = useState(false);
  const [medicineCount, setMedicineCount] = useState(0);
  const [medicinePage, setMedicinePage] = useState(1);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineCreatedDate, setMedicineCreatedDate] = useState("");
  const [quantityRules, setQuantityRules] = useState<QuantitySaleRuleData[]>([]);
  const [approvalRequired, setApprovalRequired] = useState<ApprovalRequiredMedicineData[]>([]);
  const [pendingSales, setPendingSales] = useState<PendingSaleData[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRuleData[]>([]);
  const [stockLosses, setStockLosses] = useState<StockLossData[]>([]);

  const medicineFormDefaults: z.infer<typeof addMedicine> = useMemo(
    () => ({
      name: "",
      category: "",
      price: 0,
      cost: 0,
      quantity: 1,
      batch_number: "",
      expiry_date: null,
      description: "",
      supplier_id: "",
      image_url: "",
    }),
    [],
  );

  const supplierFormDefaults: z.infer<typeof addSupplier> = useMemo(
    () => ({
      supplier_name: "",
      supplier_phone: "",
      supplier_email: "",
    }),
    [],
  );

  const invoiceFormDefaults: z.infer<typeof addInvoice> = useMemo(
    () => ({
      supplier_id: "",
      invoice_number: "",
      invoice_date: new Date(),
      invoice_amount: 0,
      invoice_status: "unpaid",
      invoice_type: "purchase",
      invoice_payment_method: "Cash",
      invoice_image: "",
    }),
    [],
  );

  const medicineForm = useForm<z.infer<typeof addMedicine>>({
    resolver: zodResolver(addMedicine),
    defaultValues: medicineFormDefaults,
  });

  const supplierForm = useForm<z.infer<typeof addSupplier>>({
    resolver: zodResolver(addSupplier),
    defaultValues: supplierFormDefaults,
  });

  const invoiceForm = useForm<z.infer<typeof addInvoice>>({
    resolver: zodResolver(addInvoice),
    defaultValues: invoiceFormDefaults,
  });

  const cashoutForm = useForm<z.infer<typeof addCashout>>({
    resolver: zodResolver(addCashout),
    defaultValues: {
      amount: 0,
      reason: "",
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

  const medicineRequestRef = useRef(0);

  const loadMedicinesPage = async (opts?: {
    page?: number;
    search?: string;
    createdDate?: string;
  }) => {
    const page = opts?.page ?? medicinePage;
    const search = opts?.search ?? medicineSearch;
    const createdDate = opts?.createdDate ?? medicineCreatedDate;

    const requestId = ++medicineRequestRef.current;
    const response = await fetchMedicinePage({
      page,
      pageSize: 4,
      search: search.trim() || undefined,
      createdDate: createdDate || undefined,
      ordering: "-created_at",
    });

    // A slower, older request must never overwrite a newer one.
    if (requestId !== medicineRequestRef.current) return;
    setMedicines(response?.results ?? []);
    setMedicineCount(response?.count ?? 0);
    if (response?.adjusted_page) setMedicinePage(response.adjusted_page);
  };

  const loadAll = async () => {
    const [
      purchaseData,
      cashoutData,
      userData,
      supplierData,
      invoiceData,
      medicineData,
      quantityRuleData,
      approvalRequiredData,
      pendingSaleData,
      discountRuleData,
      stockLossData,
    ] = await Promise.all([
      fetchPurchase(),
      fetchCashouts(),
      fetchUser(),
      fetchSuppliers(),
      fetchInvoices(),
      fetchMedicine(),
      fetchQuantitySaleRules(),
      fetchApprovalRequiredMedicines(),
      fetchPendingSales(),
      fetchDiscountRules(),
      fetchStockLosses(),
    ]);

    setPurchases(purchaseData ?? []);
    setCashouts(cashoutData ?? []);
    setUsers(userData ?? []);
    setSuppliers(supplierData ?? []);
    setInvoices(invoiceData ?? []);
    setAllMedicines(medicineData ?? []);
    setQuantityRules(quantityRuleData ?? []);
    setApprovalRequired(approvalRequiredData ?? []);
    setPendingSales(pendingSaleData ?? []);
    setDiscountRules(discountRuleData ?? []);
    setStockLosses(stockLossData ?? []);
    await loadMedicinesPage({ page: 1 });
    setMedicinePage(1);
  };

  useEffect(() => {
    setPharmacy(localStorage.getItem("Pharmacy") ?? "");
    setLogo(localStorage.getItem("Logo") ?? "");
    setUsername(localStorage.getItem("FullName") || localStorage.getItem("Username") || "");
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wait for typing to pause before searching; page, search and date all funnel through here.
  useEffect(() => {
    const handle = setTimeout(() => {
      void loadMedicinesPage({ page: medicinePage, search: medicineSearch, createdDate: medicineCreatedDate });
    }, medicineSearch ? 300 : 0);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicinePage, medicineSearch, medicineCreatedDate]);

  const handleSaveMedicine = async (data: z.infer<typeof addMedicine>) => {
    setLoading(true);
    try {
      if (medicineToEdit) {
        await EditMedicine({ ...data, id: medicineToEdit.id }, setLoading);
        setMedicineToEdit(null);
      } else {
        await createMedicine(data, setLoading);
      }
      await loadMedicinesPage({ page: medicinePage });
      await Promise.all([
        fetchMedicine().then((result) => setAllMedicines(result ?? [])),
        fetchSuppliers().then((result) => setSuppliers(result ?? [])),
        fetchInvoices().then((result) => setInvoices(result ?? [])),
      ]);
      medicineForm.reset(medicineFormDefaults);
    } finally {
      setLoading(false);
    }
  };

  const handleEditMedicine = (medicine: MedicineData) => {
    setMedicineToEdit(medicine);
    medicineForm.reset({
      name: medicine.name,
      category: medicine.category ?? "",
      price: Number(medicine.price),
      cost: Number(medicine.cost),
      quantity: Number(medicine.quantity),
      paid_amount: Number(medicine.paid_amount ?? Number(medicine.quantity) * Number(medicine.cost)),
      batch_number: medicine.batch_number ?? "",
      expiry_date: medicine.expiry_date ? parseISO(medicine.expiry_date) : null,
      description: medicine.description,
      supplier_id: medicine.selected_supplier_id ? String(medicine.selected_supplier_id) : "",
      image_url: medicine.image_url ?? "",
    });
    setSelected("medicines");
  };

  const handleDeleteMedicine = async (id: string) => {
    setLoading(true);
    try {
      await deleteMedicine(Number(id), setLoading);
      await loadMedicinesPage({ page: medicinePage });
      const medicineData = await fetchMedicine();
      setAllMedicines(medicineData ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcelMedicines = async (file: File) => {
    setImportingMedicines(true);
    try {
      await importMedicinesExcel(file, setImportingMedicines);
      await loadAll();
    } finally {
      setImportingMedicines(false);
    }
  };

  const handleSaveSupplier = async (data: z.infer<typeof addSupplier>) => {
    setLoading(true);
    try {
      if (supplierToEdit) {
        await editSupplierRecord({ ...data, id: supplierToEdit.id }, setLoading);
        setSupplierToEdit(null);
      } else {
        await createSupplierRecord(data, setLoading);
      }
      await loadAll();
      supplierForm.reset(supplierFormDefaults);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSupplier = (supplier: SupplierData) => {
    setSupplierToEdit(supplier);
    supplierForm.reset({
      supplier_name: supplier.supplier_name,
      supplier_phone: supplier.supplier_phone,
      supplier_email: supplier.supplier_email ?? "",
    });
    setSelected("suppliers");
  };

  const handleDeleteSupplier = async (id: string) => {
    setLoading(true);
    try {
      await deleteSupplierRecord(Number(id), setLoading);
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInvoice = async (data: z.infer<typeof addInvoice>) => {
    setLoading(true);
    try {
      if (invoiceToEdit) {
        await editInvoiceRecord({ ...data, id: invoiceToEdit.id }, setLoading);
        setInvoiceToEdit(null);
      } else {
        await createInvoiceRecord(data, setLoading);
      }
      await loadAll();
      invoiceForm.reset(invoiceFormDefaults);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInvoice = (invoice: InvoiceData) => {
    setInvoiceToEdit(invoice);
    invoiceForm.reset({
      supplier_id: invoice.selected_supplier_id ? String(invoice.selected_supplier_id) : "",
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date ? parseISO(invoice.invoice_date) : new Date(),
      invoice_amount: Number(invoice.invoice_amount),
      invoice_status: invoice.invoice_status,
      invoice_type: invoice.invoice_type,
      invoice_payment_method: invoice.invoice_payment_method,
      invoice_image: invoice.invoice_image ?? "",
    });
    setSelected("invoices");
  };

  const handleDeleteInvoice = async (id: string) => {
    setLoading(true);
    try {
      await deleteInvoiceRecord(Number(id), setLoading);
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCashout = async (data: z.infer<typeof addCashout>) => {
    setLoading(true);
    try {
      if (cashoutToEdit) {
        await editCashoutRecord({ ...data, id: cashoutToEdit.id }, setLoading);
        setCashoutToEdit(null);
      } else {
        await createCashoutRecord(data, setLoading);
      }
      const cashoutData = await fetchCashouts();
      setCashouts(cashoutData ?? []);
      cashoutForm.reset({ amount: 0, reason: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCashout = async (id: string) => {
    setLoading(true);
    try {
      await deleteCashoutRecord(Number(id), setLoading);
      const cashoutData = await fetchCashouts();
      setCashouts(cashoutData ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    setLoading(true);
    try {
      await deleteUser(Number(id), setLoading);
      await loadAll();
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (data: z.infer<typeof changePasswordWithConfirm>) => {
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

  const pageMeta = getManagerPageMeta(selected);

  const headerStats: HeaderStat[] = (() => {
    const todayKey = new Date().toDateString();
    const today = purchases.filter((p) => new Date(p.created_at).toDateString() === todayKey);
    const revenue = today.reduce((s, p) => s + toNumber(p.total_price), 0);
    const profit = today.reduce((s, p) => s + toNumber(p.profit), 0);
    const units = today.reduce((s, p) => s + toNumber(p.quantity), 0);
    return [
      { label: "Sales today", value: formatCurrency(revenue), icon: BadgeDollarSign, tint: "violet" },
      { label: "Profit today", value: formatCurrency(profit), icon: TrendingUp, tint: "emerald" },
      { label: "Units sold", value: units.toLocaleString(), icon: Package, tint: "cyan" },
    ];
  })();

  const notifications: AppNotification[] = (() => {
    const list: AppNotification[] = [];
    const awaiting = pendingSales.filter((sale) => sale.status === "awaiting_manager").length;
    if (awaiting) {
      list.push({ id: `approvals-${awaiting}`, title: `${awaiting} sale${awaiting === 1 ? "" : "s"} waiting for approval`, description: "Held pharmacist sales need your decision.", tone: "amber", icon: ClipboardCheck, target: "approvals" });
    }
    const stocked = allMedicines.filter((m) => toNumber(m.quantity) > 0);
    const expired = stocked.filter((m) => (daysToExpiry(m.expiry_date) ?? 1) < 0).length;
    if (expired) {
      list.push({ id: `expired-${expired}`, title: `${expired} expired item${expired === 1 ? "" : "s"} on the shelf`, description: "Remove or write off expired stock.", tone: "rose", icon: TimerOff, target: "Report" });
    }
    const soon = stocked.filter((m) => {
      const days = daysToExpiry(m.expiry_date);
      return days !== null && days >= 0 && days <= 30;
    }).length;
    if (soon) {
      list.push({ id: `soon-${soon}`, title: `${soon} item${soon === 1 ? "" : "s"} expire within a month`, description: "Check the expiry watch in Reports.", tone: "amber", icon: Hourglass, target: "Report" });
    }
    const low = allMedicines.filter((m) => toNumber(m.quantity) <= 5).length;
    if (low) {
      list.push({ id: `low-${low}`, title: `${low} item${low === 1 ? "" : "s"} low or out of stock`, description: "Reorder soon to avoid missed sales.", tone: "cyan", icon: AlertTriangle, target: "medicines" });
    }
    const credit = allMedicines.filter((m) => creditDue(m) > 0.01);
    if (credit.length) {
      const total = credit.reduce((sum, m) => sum + creditDue(m), 0);
      list.push({ id: `credit-${credit.length}-${Math.round(total)}`, title: `${formatCurrency(total)} owed on credit`, description: `${credit.length} stock line${credit.length === 1 ? "" : "s"} still to be paid, oldest first.`, tone: "violet", icon: HandCoins, target: "inventory_credit" });
    }
    return list;
  })();

  return (
    <AppShell
      pharmacy={pharmacy}
      logo={logo}
      roleLabel="Manager"
      navItems={MANAGER_NAV}
      selected={selected}
      onSelect={(key) => setSelected(key as typeof selected)}
      onLogout={Logout}
      pageTitle={pageMeta.title}
      userName={username}
      userSubtitle="Pharmacy manager"
      notifications={notifications}
      headerStats={headerStats}
      onRefresh={loadAll}
    >
      <div className="relative mx-auto max-w-352 space-y-5">
      {selected === "Report" ? (
        <ManagerReportSection
          medicines={allMedicines}
          purchases={purchases}
          suppliers={suppliers}
          invoices={invoices}
          cashouts={cashouts}
          stockLosses={stockLosses}
          pendingSales={pendingSales}
          ruleCounts={{ quantity: quantityRules.length, approval: approvalRequired.length, discount: discountRules.length }}
        />
      ) : null}

      {selected === "agents" ? (
        <SalesAgentReportsSection pharmacists={pharmacists} purchases={purchases} pendingSales={pendingSales} />
      ) : null}

      {selected === "inventory_all" || selected === "inventory_credit" || selected === "inventory_paid" ? (
        <InventoryPaymentSection
          mode={selected === "inventory_credit" ? "credit" : selected === "inventory_paid" ? "paid" : "all"}
          medicines={allMedicines}
          purchases={purchases}
          stockLosses={stockLosses}
          suppliers={suppliers}
        />
      ) : null}

      {selected === "medicines" ? (
        <MedicineManagementSection
          form={medicineForm}
          loading={loading}
          importing={importingMedicines}
          medicineToEdit={medicineToEdit}
          medicines={medicines}
          medicineCount={medicineCount}
          medicinePage={medicinePage}
          medicineSearch={medicineSearch}
          medicineCreatedDate={medicineCreatedDate}
          suppliers={suppliers}
          onSearchChange={(value) => {
            setMedicineSearch(value);
            setMedicinePage(1);
          }}
          onCreatedDateChange={(value) => {
            setMedicineCreatedDate(value);
            setMedicinePage(1);
          }}
          onSubmit={handleSaveMedicine}
          onRefresh={loadAll}
          onCancelEdit={() => {
            setMedicineToEdit(null);
            medicineForm.reset(medicineFormDefaults);
          }}
          onDelete={handleDeleteMedicine}
          onEdit={handleEditMedicine}
          onImport={handleImportExcelMedicines}
          onPageChange={setMedicinePage}
        />
      ) : null}

      {selected === "suppliers" ? (
        <SupplierManagementSection
          form={supplierForm}
          loading={loading}
          supplierToEdit={supplierToEdit}
          suppliers={suppliers}
          medicines={allMedicines}
          invoices={invoices}
          onSubmit={handleSaveSupplier}
          onRefresh={loadAll}
          onCancelEdit={() => {
            setSupplierToEdit(null);
            supplierForm.reset(supplierFormDefaults);
          }}
          onEdit={handleEditSupplier}
          onDelete={handleDeleteSupplier}
        />
      ) : null}

      {selected === "invoices" ? (
        <InvoiceManagementSection
          form={invoiceForm}
          loading={loading}
          invoiceToEdit={invoiceToEdit}
          invoices={invoices}
          suppliers={suppliers}
          onSubmit={handleSaveInvoice}
          onRefresh={loadAll}
          onCancelEdit={() => {
            setInvoiceToEdit(null);
            invoiceForm.reset(invoiceFormDefaults);
          }}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
        />
      ) : null}

      {selected === "credentials" ? (
        <CredentialManagementSection
          passwordForm={passwordForm}
          pharmacists={pharmacists}
          loading={loading}
          onDeleteUser={handleDeleteCredential}
          onChangePassword={handleChangePassword}
          onRefresh={loadAll}
        />
      ) : null}

      {selected === "cashouts" ? (
        <CashoutManagementSection
          form={cashoutForm}
          loading={loading}
          cashouts={cashouts}
          cashoutToEdit={cashoutToEdit}
          onSubmit={handleSaveCashout}
          onRefresh={loadAll}
          onEdit={(cashout) => {
            setCashoutToEdit(cashout);
            cashoutForm.reset({
              amount: Number(cashout.amount),
              reason: cashout.reason,
            });
          }}
          onDelete={handleDeleteCashout}
          onCancelEdit={() => {
            setCashoutToEdit(null);
            cashoutForm.reset({ amount: 0, reason: "" });
          }}
        />
      ) : null}

      {selected === "sales_rules" ? (
        <SalesRulesSection
          medicines={allMedicines}
          quantityRules={quantityRules}
          approvalRequired={approvalRequired}
          loading={loading}
          onRefresh={loadAll}
        />
      ) : null}

      {selected === "discounts" ? (
        <DiscountRulesSection
          medicines={allMedicines}
          discountRules={discountRules}
          loading={loading}
          onRefresh={loadAll}
        />
      ) : null}

      {selected === "approvals" ? (
        <PendingApprovalsSection
          pendingSales={pendingSales}
          medicines={allMedicines}
          quantityRules={quantityRules}
          approvalRequired={approvalRequired}
          loading={loading}
          onRefresh={loadAll}
        />
      ) : null}
      </div>
    </AppShell>
  );
}
