"use client";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-apex-orange/18 bg-[linear-gradient(120deg,rgba(232,149,30,0.12),rgba(11,25,46,0.82)_48%,rgba(15,42,88,0.55))] p-5 shadow-[inset_0_1px_0_rgba(255,214,160,0.1),0_18px_44px_-32px_rgba(0,0,0,0.7)] sm:flex-row sm:items-center sm:justify-between lg:p-6",
        className,
      )}
    >
      <div className="space-y-1.5">
        <p className="display-kicker text-apex-orange-light/85">Medicare</p>
        <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-white/58">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
