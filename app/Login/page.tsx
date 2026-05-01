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
      title="Enter the pharmacy cockpit"
      description="Sign in to take over inventory, supplier flow, invoice control, cashouts, and the new multi-medicine selling experience."
      sideLabel="Live Ops"
      sideTitle="The back office no longer looks like the back office."
      sideCopy="This system is tuned for urgency, speed, and visibility. Managers see the danger zones instantly. Pharmacists move faster with a search-first sales workflow."
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
