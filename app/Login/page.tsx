"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login } from "@/lib/validations";
import { Login } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import type { z } from "zod";

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
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/signin.jpg')" }}
    >
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/65 to-black/80" />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-3xl border-white/10 bg-card/85 shadow-2xl shadow-black/30 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
            <CardDescription>Sign in to manage stock, sales, and reporting.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
