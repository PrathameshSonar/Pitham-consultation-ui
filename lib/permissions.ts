/**
 * Client-side permission helpers.
 *
 * Storage strategy: permissions are kept in localStorage alongside `role` so
 * the navbar can render synchronously on every page (no auth context needed).
 * The backend remains the source of truth — these helpers are only for hiding
 * UI; every gated request also gets a 403 server-side if the client lies.
 */

import type { AdminSectionKey } from "@/lib/adminSections";
import { ALL_SECTION_KEYS } from "@/lib/adminSections";

const STORAGE_KEY = "permissions";

const isBrowser = (): boolean => typeof window !== "undefined";

export function savePermissions(perms: readonly string[]): void {
  if (!isBrowser()) return;
  // Defensive: drop unknown keys client-side too. A stale build with an old
  // section list shouldn't crash on a permissions value it doesn't recognise.
  const known = perms.filter((p): p is AdminSectionKey =>
    (ALL_SECTION_KEYS as readonly string[]).includes(p),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(known));
}

export function getPermissions(): AdminSectionKey[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is AdminSectionKey =>
      (ALL_SECTION_KEYS as readonly string[]).includes(p),
    );
  } catch {
    return [];
  }
}

export function clearPermissions(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

/** True if the current user can access the given admin section.
 * Super admin bypasses all checks (can hit anything). */
export function hasSection(section: AdminSectionKey): boolean {
  if (!isBrowser()) return false;
  if (localStorage.getItem("role") === "admin") return true;
  return getPermissions().includes(section);
}

/** True if the current user is a super admin. */
export function isSuperAdminClient(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem("role") === "admin";
}

/** Returns the list of sections the user can access (super admin gets all). */
export function getAccessibleSections(): AdminSectionKey[] {
  if (!isBrowser()) return [];
  if (localStorage.getItem("role") === "admin") return [...ALL_SECTION_KEYS];
  return getPermissions();
}
