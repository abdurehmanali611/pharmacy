"use client";

import { useEffect, useMemo, useState } from "react";
import { parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { ManagerHeader } from "@/components/manager/ManagerHeader";
import { CashoutManagementSection } from "@/components/manager/sections/CashoutManagementSection";
import { CredentialManagementSection } from "@/components/manager/sections/CredentialManagementSection";
import { InvoiceManagementSection } from "@/components/manager/sections/InvoiceManagementSection";
import { ManagerReportSection } from "@/components/manager/sections/ManagerReportSection";
import { MedicineManagementSection } from "@/components/manager/sections/MedicineManagementSection";
import { SupplierManagementSection } from "@/components/manager/sections/SupplierManagementSection";
import type { ManagerSectionKey } from "@/components/manager/types";
import {
  ChangePassword,
  createCashoutRecord,
  CreateUser,
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
  EditUser,
  fetchCashouts,
  fetchMedicine,
  fetchInvoices,
  fetchMedicinePage,
  fetchPurchase,
  fetchSuppliers,
  fetchUser,
  importMedicinesExcel,
  Logout,
  type CashoutData,
  type InvoiceData,
  type MedicineData,
  type PurchaseData,
  type SupplierData,
  type UserData,
} from "@/lib/actions";
import {
  addCashout,
  addInvoice,
  addMedicine,
  addSupplier,
  changePasswordWithConfirm,
  login,
} from "@/lib/validations";

export default function ManagerView() {
  const [pharmacy, setPharmacy] = useState("");
  const [logo, setLogo] = useState("");
  const [pharmacyTin, setPharmacyTin] = useState("");
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
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [importingMedicines, setImportingMedicines] = useState(false);
  const [medicineCount, setMedicineCount] = useState(0);
  const [medicinePage, setMedicinePage] = useState(1);
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineCreatedDate, setMedicineCreatedDate] = useState("");

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

  const loadMedicinesPage = async (opts?: {
    page?: number;
    search?: string;
    createdDate?: string;
  }) => {
    const page = opts?.page ?? medicinePage;
    const search = opts?.search ?? medicineSearch;
    const createdDate = opts?.createdDate ?? medicineCreatedDate;

    const response = await fetchMedicinePage({
      page,
      pageSize: 10,
      search: search || undefined,
      createdDate: createdDate || undefined,
      ordering: "-created_at",
    });

    setMedicines(response?.results ?? []);
    setMedicineCount(response?.count ?? 0);
  };

  const loadAll = async () => {
    const [purchaseData, cashoutData, userData, supplierData, invoiceData, medicineData] = await Promise.all([
      fetchPurchase(),
      fetchCashouts(),
      fetchUser(),
      fetchSuppliers(),
      fetchInvoices(),
      fetchMedicine(),
    ]);

    setPurchases(purchaseData ?? []);
    setCashouts(cashoutData ?? []);
    setUsers(userData ?? []);
    setSuppliers(supplierData ?? []);
    setInvoices(invoiceData ?? []);
    setAllMedicines(medicineData ?? []);
    await loadMedicinesPage({ page: 1 });
    setMedicinePage(1);
  };

  useEffect(() => {
    setPharmacy(localStorage.getItem("Pharmacy") ?? "");
    setLogo(localStorage.getItem("Logo") ?? "");
    setPharmacyTin(localStorage.getItem("PharmacyTin") ?? "");
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadMedicinesPage({ page: medicinePage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicinePage]);

  useEffect(() => {
    if (selected !== "credentials") return;
    if (!userToEdit && pharmacists.length === 1) {
      const existing = pharmacists[0];
      setUserToEdit(existing);
      credentialForm.reset({ username: existing.username, password: "" });
    }
  }, [credentialForm, pharmacists, selected, userToEdit]);

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
      batch_number: medicine.batch_number ?? "",
      expiry_date: medicine.expiry_date ? parseISO(medicine.expiry_date) : null,
      description: medicine.description,
      supplier_id: medicine.selected_supplier_id ? String(medicine.selected_supplier_id) : "",
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

  const handleSaveCredential = async (data: z.infer<typeof login>) => {
    setLoading(true);
    try {
      if (userToEdit) {
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
      } else {
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
      }
      await loadAll();
      credentialForm.reset();
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
      if (userToEdit?.id === id) {
        setUserToEdit(null);
        credentialForm.reset();
      }
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-6">
      <ManagerHeader
        pharmacy={pharmacy}
        logo={logo}
        selected={selected}
        onSelect={setSelected}
        onLogout={Logout}
      />

      {selected === "Report" ? (
        <ManagerReportSection
          medicines={allMedicines}
          purchases={purchases}
          suppliers={suppliers}
          invoices={invoices}
          cashouts={cashouts}
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
            void loadMedicinesPage({ page: 1, search: value });
          }}
          onCreatedDateChange={(value) => {
            setMedicineCreatedDate(value);
            setMedicinePage(1);
            void loadMedicinesPage({ page: 1, createdDate: value });
          }}
          onSubmit={handleSaveMedicine}
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
          credentialForm={credentialForm}
          passwordForm={passwordForm}
          pharmacists={pharmacists}
          loading={loading}
          userToEdit={userToEdit}
          onSubmitCredential={handleSaveCredential}
          onEditUser={(user) => {
            setUserToEdit(user);
            credentialForm.reset({ username: user.username, password: "" });
          }}
          onDeleteUser={handleDeleteCredential}
          onCancelEdit={() => {
            setUserToEdit(null);
            credentialForm.reset();
          }}
          onChangePassword={handleChangePassword}
        />
      ) : null}

      {selected === "cashouts" ? (
        <CashoutManagementSection
          form={cashoutForm}
          loading={loading}
          cashouts={cashouts}
          cashoutToEdit={cashoutToEdit}
          onSubmit={handleSaveCashout}
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
    </div>
  );
}
