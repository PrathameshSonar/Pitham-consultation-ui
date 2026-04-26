"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminSectionKey } from "@/lib/adminSections";
import { hasSection, isSuperAdminClient } from "@/lib/permissions";

type GateState = "checking" | "allowed" | "denied";

/**
 * Page-level guard hook for admin routes.
 *
 * - Returns "checking" on first render (server / pre-hydration), then resolves
 *   to "allowed" or "denied" once localStorage is readable.
 * - On "denied", navigates the user away (defaults to /dashboard) so the page
 *   contents never flash. Pages should render a small "checking" placeholder
 *   while in the "checking" state.
 *
 * Usage:
 *   const gate = useRequireSection("documents");
 *   if (gate !== "allowed") return <CircularProgress />;
 *
 * Pass `"super_admin"` to gate to super admin role only — used by /admin/settings.
 */
export function useRequireSection(
  section: AdminSectionKey | "super_admin",
  redirectTo: string = "/dashboard",
): GateState {
  const router = useRouter();
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    const allowed = section === "super_admin" ? isSuperAdminClient() : hasSection(section);
    if (allowed) {
      setState("allowed");
    } else {
      setState("denied");
      router.replace(redirectTo);
    }
  }, [section, redirectTo, router]);

  return state;
}
