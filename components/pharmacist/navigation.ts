import { History, ShoppingCart } from "lucide-react";

import type { AppNavItem } from "@/components/chrome/AppShell";

export type PharmacistSectionKey = "register" | "sales";

export const PHARMACIST_NAV: (AppNavItem & { key: PharmacistSectionKey })[] = [
  { key: "register", label: "Register", icon: ShoppingCart },
  { key: "sales", label: "Sales", icon: History },
];

export function getPharmacistPageMeta(selected: PharmacistSectionKey) {
  const item = PHARMACIST_NAV.find((nav) => nav.key === selected);
  return {
    title: item?.label ?? "Register",
  };
}
