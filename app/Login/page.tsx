"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import {
  AUTH_BAND,
  AUTH_BUTTON,
  AUTH_CARD_CLASS,
  AUTH_EYEBROW,
  AUTH_LABEL_COOL,
  AUTH_LABEL_WARM,
  AUTH_LINK,
  AUTH_MUTED,
  AUTH_PANEL_COOL,
  AUTH_PANEL_WARM,
  AUTH_SUBTITLE,
  AUTH_TITLE,
  AuthShell,
} from "@/components/chrome/AuthShell";
import CustomFormField, { formFieldTypes } from "@/components/customFormField";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Login } from "@/lib/actions";
import { login } from "@/lib/validations";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<z.infer<typeof login>>({
    resolver: zodResolver(login),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof login>) => {
    setError(null);
    await Login(data, setLoading, router, setError);
  };

  return (
    <AuthShell>
      <Card className={cn("gap-0 py-0", AUTH_CARD_CLASS)}>
        <CardHeader className={cn("space-y-1.5 px-8 pt-6 pb-2 text-center", AUTH_BAND)}>
          <p className={AUTH_EYEBROW}>Staff access</p>
          <CardTitle className={cn("text-[1.65rem]", AUTH_TITLE)}>
            Welcome back
          </CardTitle>
          <CardDescription className={cn("text-[15px]", AUTH_SUBTITLE)}>
            Sign in with your pharmacy username and password to reach inventory,
            suppliers, invoices, and the selling counter.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pt-4 pb-5">
          <form
            className="flex flex-col gap-3.5"
            onSubmit={form.handleSubmit(async (data) => {
              await onSubmit(data);
              form.reset();
            })}
          >
            <div className={AUTH_PANEL_WARM}>
              <CustomFormField
                name="username"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                label="Username"
                placeholder="Enter your username"
                labelClassName={AUTH_LABEL_WARM}
                inputClassName="auth-field h-11 w-full"
              />
            </div>

            <div className={AUTH_PANEL_COOL}>
              <CustomFormField
                name="password"
                control={form.control}
                fieldType={formFieldTypes.INPUT}
                type="password"
                label="Password"
                placeholder="Enter your password"
                labelClassName={AUTH_LABEL_COOL}
                inputClassName="auth-field h-11 w-full"
              />
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-400/35 bg-red-500/10 p-3 text-sm leading-relaxed text-red-200"
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-white/8 text-sm font-semibold tracking-wide text-white transition disabled:pointer-events-none disabled:opacity-60",
                AUTH_BUTTON,
              )}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </CardContent>

        <CardFooter className={cn("justify-center border-t px-8 py-4", AUTH_BAND)}>
          <p className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm", AUTH_MUTED)}>
            <span>New to Medicare?</span>
            <Link href="/Register" className={AUTH_LINK}>
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
