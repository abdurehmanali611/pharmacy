import Image from "next/image";
import Link from "next/link";

import { APEX } from "@/constants/branding";
import { cn } from "@/lib/utils";

type ApexLogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  showLink?: boolean;
};

const sizes = {
  sm: { width: 120, height: 36, className: "h-8 w-auto" },
  md: { width: 160, height: 48, className: "h-10 w-auto" },
  lg: { width: 220, height: 66, className: "h-14 w-auto sm:h-16" },
};

export function ApexLogo({
  className,
  href = APEX.website,
  size = "md",
  showLink = true,
}: ApexLogoProps) {
  const image = (
    <Image
      src={APEX.logo}
      alt={APEX.name}
      width={sizes[size].width}
      height={sizes[size].height}
      className={cn(sizes[size].className, "object-contain", className)}
      priority
    />
  );

  if (!showLink) return image;

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 transition-opacity hover:opacity-90"
      aria-label={`${APEX.name} — visit website`}
    >
      {image}
    </Link>
  );
}
