
"use client";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import PharmacistView from "@/components/pharmacist/PharmacistView";

export default function PharmacistPage() {
  return (
    <ProjectBackdrop className="min-h-screen bg-[#090d15] text-white">
      <PharmacistView />
    </ProjectBackdrop>
  );
}
