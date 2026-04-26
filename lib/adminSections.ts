/**
 * Single source of truth for the admin panel's section-based authorization.
 *
 * Adding a new admin area is a one-touch change: append an entry here, then
 *   1. add the matching key to `backend/utils/permissions.ADMIN_SECTIONS`,
 *   2. apply `require_section("...")` on the new router,
 *   3. add `useRequireSection("...")` at the top of the new page.
 *
 * The navbar, the page guards, and the super-admin permission matrix all read
 * from this list — no other place needs to know about sections.
 */

export const ADMIN_SECTIONS = [
  {
    key: "appointments",
    label: "Appointments",
    description: "View, schedule, reschedule, complete and cancel consultations. Includes calendar.",
    paths: ["/admin/appointments", "/admin/calendar"],
  },
  {
    key: "users",
    label: "Users",
    description: "Browse user accounts and view their consultation/document history.",
    paths: ["/admin/users"],
  },
  {
    key: "user_lists",
    label: "User Lists",
    description: "Group users into lists for bulk operations (broadcasts, recordings, documents).",
    paths: ["/admin/user-lists"],
  },
  {
    key: "documents",
    label: "Sadhna Documents",
    description: "Upload reusable documents and assign them to users individually or in bulk.",
    paths: ["/admin/documents"],
  },
  {
    key: "recordings",
    label: "Recordings",
    description: "Share session recordings with users or user lists.",
    paths: ["/admin/recordings"],
  },
  {
    key: "queries",
    label: "Queries",
    description: "Reply to user queries.",
    paths: ["/admin/queries"],
  },
  {
    key: "broadcasts",
    label: "Broadcasts",
    description: "Send notifications to all users or a specific list.",
    paths: ["/admin/broadcasts"],
  },
  {
    key: "pitham_cms",
    label: "Pitham CMS",
    description: "Manage the public Pitham page — banners, events, gallery, testimonials, videos, Instagram.",
    paths: ["/admin/pitham"],
  },
] as const;

export type AdminSectionKey = (typeof ADMIN_SECTIONS)[number]["key"];

export const ALL_SECTION_KEYS: readonly AdminSectionKey[] = ADMIN_SECTIONS.map((s) => s.key);

/** Map a pathname (or any prefix of one) to the section that governs it.
 * Returns null for pages outside the section system (e.g. /admin home, /admin/settings). */
export function sectionForPath(pathname: string): AdminSectionKey | null {
  for (const s of ADMIN_SECTIONS) {
    if (s.paths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return s.key;
    }
  }
  return null;
}
