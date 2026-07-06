"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { AuthFrame } from "@/components/chrome/AuthFrame";
import { Button } from "@/components/ui/button";
import { APEX } from "@/constants/branding";

/** Internal provisioning route — not linked from public UI. */
export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthFrame
      eyebrow="Provisioning"
      title="Pharmacy onboarding is handled by Apex"
      description="New pharmacies are deployed by the Apex Solution team after consultation and payment. If you need access, contact us — do not self-register."
      sideLabel="Licensed deployment"
      sideTitle="Accounts are created for you."
      sideCopy="Once your pharmacy is onboarded, Apex provisions your manager credentials and branded workspace. Sign in only after you receive access."
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-apex-orange/20 bg-apex-orange/8 p-4 text-sm leading-7 text-white/70">
          Self-registration is disabled. This protects your investment and ensures every deployment
          is configured correctly by {APEX.name}.
        </div>
        <Button asChild className="w-full" size="lg">
          <a href={APEX.quoteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
            Contact Apex for deployment
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="outline" className="w-full" size="lg" onClick={() => router.push("/Login")}>
          Back to sign in
        </Button>
      </div>
    </AuthFrame>
  );
}
