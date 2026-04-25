"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** Single QueryClient per browser tab. Defaults tuned for a low-write admin app:
 *   - 30s stale time → no thrashing refetches when navigating between tabs
 *   - retry once on failure → 5xx blip during deploys doesn't blow up the UI
 *   - refetchOnWindowFocus disabled → avoids surprise refetches on alt-tab
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
