import { BellRing, History, ShoppingCart } from "lucide-react";

import type { AppNavItem } from "@/components/chrome/AppShell";

export type PharmacistSectionKey = "register" | "sales" | "approvals";

export const PHARMACIST_NAV: (AppNavItem & { key: PharmacistSectionKey })[] = [
  { key: "register", label: "Register", icon: ShoppingCart },
  { key: "sales", label: "Sales", icon: History },
  { key: "approvals", label: "Approvals", icon: BellRing },
];

export function getPharmacistPageMeta(selected: PharmacistSectionKey) {
  const item = PHARMACIST_NAV.find((nav) => nav.key === selected);
  return {
    title: item?.label ?? "Register",
  };
}
