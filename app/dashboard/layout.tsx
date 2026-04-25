// All /dashboard/* routes are auth-gated and per-user — same reasoning as
// app/admin/layout.tsx. Skip static prerender.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
