import {
  BarChart3,
  FileText,
  Pill,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import type { AppNavItem } from "@/components/chrome/AppShell";
import type { ManagerSectionKey } from "@/components/manager/types";

export const MANAGER_NAV: (AppNavItem & { key: ManagerSectionKey })[] = [
  {
    key: "Report",
    label: "Reports",
    icon: BarChart3,
    description: "Sales, stock, suppliers, invoices, and cashout intelligence.",
  },
  {
    key: "medicines",
    label: "Medicines",
    icon: Pill,
    description: "Manage inventory, batches, expiry, and stock levels.",
  },
  {
    key: "suppliers",
    label: "Suppliers",
    icon: Truck,
    description: "Track supplier contacts and linked medicines.",
  },
  {
    key: "invoices",
    label: "Invoices",
    icon: FileText,
    description: "Record purchases, payments, and invoice status.",
  },
  {
    key: "cashouts",
    label: "Cashouts",
    icon: Wallet,
    description: "Log withdrawals and monitor cash movement.",
  },
  {
    key: "credentials",
    label: "Team",
    icon: Users,
    description: "Create pharmacist accounts and manage access.",
  },
];

export function getManagerPageMeta(selected: ManagerSectionKey) {
  const item = MANAGER_NAV.find((nav) => nav.key === selected);
  return {
    title: item?.label ?? "Dashboard",
    description: item?.description,
  };
}
