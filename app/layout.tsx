import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { APEX, PRODUCT } from "@/constants/branding";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${PRODUCT.name} — ${PRODUCT.tagline} | ${APEX.name}`,
  description: PRODUCT.description,
  keywords: [
    "pharmacy management",
    "inventory system",
    "Apex Solution",
    "Ethiopia",
    "Medicare",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full dark",
        "antialiased",
        manrope.variable,
        bricolage.variable,
        "font-sans",
      )}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
