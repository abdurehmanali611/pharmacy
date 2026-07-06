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
  { key: "Report", label: "Reports", icon: BarChart3 },
  { key: "medicines", label: "Medicines", icon: Pill },
  { key: "suppliers", label: "Suppliers", icon: Truck },
  { key: "invoices", label: "Invoices", icon: FileText },
  { key: "cashouts", label: "Cashouts", icon: Wallet },
  { key: "credentials", label: "Team", icon: Users },
];

export function getManagerPageMeta(selected: ManagerSectionKey) {
  const item = MANAGER_NAV.find((nav) => nav.key === selected);
  return {
    title: item?.label ?? "Dashboard",
  };
}
