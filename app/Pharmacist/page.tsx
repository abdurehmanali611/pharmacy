
"use client";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import PharmacistView from "@/components/pharmacist/PharmacistView";

export default function PharmacistPage() {
  return (
    <ProjectBackdrop variant="cinematic">
      <PharmacistView />
    </ProjectBackdrop>
  );
}
