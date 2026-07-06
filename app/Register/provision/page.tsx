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

/** Apex-only provisioning — not linked from public marketing UI. */
export default function ProvisionPharmacyPage() {
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
      eyebrow="Apex provisioning"
      title="Create pharmacy workspace"
      description="Internal use only — provision a paid pharmacy after onboarding is complete."
      sideLabel="Apex internal"
      sideTitle="Deploy a new pharmacy tenant."
      sideCopy="Set up the manager account, attach pharmacy identity, and hand credentials to the client after payment is confirmed."
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
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthFrame>
  );
}
