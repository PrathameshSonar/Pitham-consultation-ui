// /appointments/payment-status uses useSearchParams + reads localStorage —
// not safe to prerender. Skip static rendering for the whole segment.
export const dynamic = "force-dynamic";

export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
