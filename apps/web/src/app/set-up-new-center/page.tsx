/**
 * File:        apps/web/src/app/set-up-new-center/page.tsx
 * Module:      Web · Set Up New Center
 * Purpose:     The /set-up-new-center route. Previously this rendered the
 *              @spacejam/ui mock wizard whose "Create Center" button only
 *              fired an alert() — clients completed it and nothing was
 *              saved, so their floor maps stayed empty. It now runs the
 *              REAL SetUpCenterModal flow (createCenter → floors → seats)
 *              and drops the user on Inventory, where the new center and
 *              its floor map appear.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-25
 */
"use client";

import { useRouter } from "next/navigation";
import { SetUpCenterModal } from "@/components/ui/dashboard/set-up-center-modal";

export default function SetUpNewCenterPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FBF6F4]">
      <SetUpCenterModal
        isOpen={true}
        onClose={() => router.push("/dashboard/inventory")}
        onCreated={() => {
          // The modal created the center (+ floors/seats if the wizard was
          // completed); Inventory lists it and links to its floor map.
          router.push("/dashboard/inventory");
        }}
      />
    </div>
  );
}
