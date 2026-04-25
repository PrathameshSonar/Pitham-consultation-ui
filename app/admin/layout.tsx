// All /admin/* routes are auth-gated and per-user — there's nothing to
// prerender ahead of time. Marking the segment dynamic skips static prerender
// at build time, which avoids "ReferenceError: localStorage is not defined" /
// "useSearchParams should be wrapped in Suspense" errors on Vercel.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
