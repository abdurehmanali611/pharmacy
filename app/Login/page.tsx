"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { AuthFrame } from "@/components/chrome/AuthFrame";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Button } from "@/components/ui/button";
import { Login } from "@/lib/actions";
import { login } from "@/lib/validations";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof login>>({
    resolver: zodResolver(login),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof login>) => {
    await Login(data, setLoading, router);
  };

  return (
    <AuthFrame
      eyebrow="Secure Access"
      title="Enter your pharmacy workspace"
      description="Sign in to manage inventory, suppliers, invoices, cashouts, and the intelligent multi-medicine selling experience — powered by Apex Solution."
      sideLabel="Live Operations"
      sideTitle="Your pharmacy command center awaits."
      sideCopy="Managers see danger zones instantly. Pharmacists move faster with search-first workflows. Every screen engineered by Apex Solution for speed, clarity, and scale."
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={form.handleSubmit(async (data) => {
          await onSubmit(data);
          form.reset();
        })}
      >
        <CustomFormField
          name="username"
          control={form.control}
          fieldType={formFieldTypes.INPUT}
          label="Username"
          placeholder="Enter your username"
        />
        <CustomFormField
          name="password"
          control={form.control}
          fieldType={formFieldTypes.INPUT}
          label="Password"
          placeholder="Enter your password"
          type="password"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthFrame>
  );
}
