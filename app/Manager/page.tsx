"use client";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import ManagerView from "@/components/manager/ManagerView";

export default function ManagerPage() {
  return (
    <ProjectBackdrop className="min-h-screen bg-[#090d15] text-white">
      <ManagerView />
    </ProjectBackdrop>
  );
}
