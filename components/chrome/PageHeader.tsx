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
        "glass panel-glow mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6",
        className,
      )}
    >
      <div className="space-y-1.5">
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
