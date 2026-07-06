"use client";

import { ProjectBackdrop } from "@/components/chrome/ProjectBackdrop";
import ManagerView from "@/components/manager/ManagerView";

export default function ManagerPage() {
  return (
    <ProjectBackdrop variant="cinematic">
      <ManagerView />
    </ProjectBackdrop>
  );
}
