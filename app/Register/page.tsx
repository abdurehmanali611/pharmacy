"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registration } from "@/lib/validations";
import { UserCreation } from "@/lib/actions";
import { useRouter } from "next/navigation";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { z } from "zod";

export default function Register() {
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
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/signup.jpg')" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/65 to-black/80" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-2xl rounded-3xl border-white/10 bg-card/85 shadow-2xl shadow-black/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Register your pharmacy</CardTitle>
            <CardDescription>Create a manager account and launch your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={form.handleSubmit(async (data) => {
                await onSubmit(data);
                form.reset();
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-2">
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
            </form>
          </CardContent>
          <CardFooter className="justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Already registered?</span>
            <Link href="/Login" className="text-primary hover:underline">
              Sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
