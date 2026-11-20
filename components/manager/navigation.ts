import {
  BadgePercent,
  BarChart3,
  CreditCard,
  HandCoins,
  ClipboardCheck,
  Trophy,
  FileText,
  Pill,
  Scale,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import type { AppNavItem } from "@/components/chrome/AppShell";
import type { ManagerSectionKey } from "@/components/manager/types";

export const MANAGER_NAV: (AppNavItem & { key: ManagerSectionKey })[] = [
  { key: "Report", label: "Reports", icon: BarChart3 },
  { key: "agents", label: "Agent reports", icon: Trophy },
  { key: "medicines", label: "Medicines", icon: Pill },
  { key: "suppliers", label: "Suppliers", icon: Truck },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "cashouts", label: "Cashouts", icon: Wallet },
  { key: "sales_rules", label: "Sales rules", icon: Scale },
  { key: "discounts", label: "Discounts", icon: BadgePercent },
  { key: "approvals", label: "Approvals", icon: ClipboardCheck },
  { key: "credentials", label: "Team", icon: Users },
  { key: "credit_management", label: "Credit management", icon: HandCoins },
  {
    key: "inventory_all",
    label: "Inventory payment",
    icon: CreditCard,
    children: [
      { key: "inventory_all", label: "All lines" },
      { key: "inventory_credit", label: "Credit items" },
      { key: "inventory_paid", label: "Fully paid" },
    ],
  },
];

export function getManagerPageMeta(selected: ManagerSectionKey) {
  const item = MANAGER_NAV.find((nav) => nav.key === selected);
  const group = MANAGER_NAV.find((nav) => nav.children?.some((child) => child.key === selected));
  const child = group?.children?.find((c) => c.key === selected);
  return {
    title: child && group ? `${group.label} · ${child.label}` : (item?.label ?? "Dashboard"),
  };
}
