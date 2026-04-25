import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,theme(colors.primary/0.20),transparent_55%),radial-gradient(circle_at_bottom,theme(colors.amber.400/0.14),transparent_45%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="text-center space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Pharmacy management • Sales register • Inventory</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Medicare — modern pharmacy operations, beautifully organized.
          </h1>
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Sign in to manage stock, register sales, and track profit in real time. Built with Next.js + Django.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="px-8">
            <Link href="/Login">Sign in</Link>
          </Button>
          {/* <Button asChild size="lg" variant="secondary" className="px-8">
            <Link href="/Register">Create pharmacy</Link>
          </Button> */}
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          <Card className="rounded-3xl border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-medium">Inventory</p>
            <p className="mt-2 text-sm text-muted-foreground">Track quantity, price, cost, and margin per medicine.</p>
          </Card>
          <Card className="rounded-3xl border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-medium">Sales register</p>
            <p className="mt-2 text-sm text-muted-foreground">Fast pharmacist flow with live totals and recent sales.</p>
          </Card>
          <Card className="rounded-3xl border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm font-medium">Reporting</p>
            <p className="mt-2 text-sm text-muted-foreground">Revenue, profit, and top-selling items at a glance.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}
