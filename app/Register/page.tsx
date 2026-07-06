"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { AuthFrame } from "@/components/chrome/AuthFrame";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Button } from "@/components/ui/button";
import { UserCreation } from "@/lib/actions";
import { registration } from "@/lib/validations";

/** Direct URL only — not linked from public marketing or auth UI. */
export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof registration>>({
    resolver: zodResolver(registration),
    defaultValues: {
      username: "",
      password: "",
      pharmacy_name: "",
      role: "Manager",
      logoUrl: "",
      pharmacy_tin: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof registration>) => {
    await UserCreation(data, setLoading, router);
  };

  return (
    <AuthFrame
      eyebrow="New pharmacy"
      title="Register your pharmacy"
      description="Create a manager account and launch your Medicare workspace — inventory, sales, suppliers, and reporting in one place."
      sideLabel="Get started"
      sideTitle="Deploy your pharmacy command center."
      sideCopy="Set up your manager account, attach your pharmacy identity, and start managing medicines, invoices, and team access from day one."
    >
      <form
        className="grid gap-5"
        onSubmit={form.handleSubmit(async (data) => {
          await onSubmit(data);
          form.reset();
        })}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <CustomFormField
            name="pharmacy_name"
            control={form.control}
            fieldType={formFieldTypes.INPUT}
            label="Pharmacy Name"
            placeholder="Enter pharmacy name"
          />
          <CustomFormField
            name="pharmacy_tin"
            control={form.control}
            fieldType={formFieldTypes.INPUT}
            label="Pharmacy TIN"
            placeholder="Enter pharmacy TIN"
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <CustomFormField
            name="username"
            control={form.control}
            fieldType={formFieldTypes.INPUT}
            label="Manager Username"
            placeholder="Enter username"
          />
          <CustomFormField
            name="password"
            control={form.control}
            fieldType={formFieldTypes.INPUT}
            label="Password"
            placeholder="Enter password"
            type="password"
          />
        </div>
        <CustomFormField
          name="logoUrl"
          control={form.control}
          fieldType={formFieldTypes.IMAGE_UPLOADER}
          label="Pharmacy Logo"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create pharmacy"}
        </Button>
        <p className="text-center text-sm text-white/55">
          <Link href="/Login" className="font-semibold text-apex-orange-light transition hover:text-white">
            Already have an account? Sign in
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
