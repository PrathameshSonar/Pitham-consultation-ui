"use client";

/**
 * Shared TanStack Query helpers.
 *
 * Cuts the boilerplate of `useState + useEffect + getToken + fetch + setLoading`
 * to a single line per query, gives every page free cross-navigation caching,
 * automatic background refetch, and unified loading/error state.
 *
 *   const { data, isLoading } = useAuthQuery(["profile"], getProfile);
 *
 * Auth handling: if the token isn't present after hydration the user is
 * redirected to /login automatically — pages no longer need to write that
 * boilerplate themselves.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { getToken } from "./api";

/** Hydration-safe token reader.
 *  Returns { token: "", ready: false } during SSR and the first client render,
 *  then { token, ready: true } once mounted on the client. */
export function useToken(): { token: string; ready: boolean } {
  const [state, setState] = useState({ token: "", ready: false });
  useEffect(() => {
    setState({ token: getToken(), ready: true });
  }, []);
  return state;
}

interface AuthQueryOptions<T> extends Omit<UseQueryOptions<T>, "queryKey" | "queryFn" | "enabled"> {
  /** When false, skips redirect-to-login on missing auth. Useful for "optional" queries. */
  redirectOnMissing?: boolean;
  /** Defer execution until additional condition is met (e.g. a route param has loaded). */
  enabled?: boolean;
}

/** Authenticated useQuery — passes the token to the queryFn and redirects to /login
 *  if there's no token after hydration. */
export function useAuthQuery<T>(
  key: QueryKey,
  fn: (token: string) => Promise<T>,
  options: AuthQueryOptions<T> = {},
) {
  const router = useRouter();
  const { token, ready } = useToken();
  const { redirectOnMissing = true, enabled = true, ...rest } = options;

  useEffect(() => {
    if (!ready) return;
    if (redirectOnMissing && !token) router.push("/login");
  }, [ready, token, router, redirectOnMissing]);

  return useQuery<T>({
    queryKey: key,
    queryFn: () => fn(token),
    enabled: ready && !!token && enabled,
    ...rest,
  });
}

/** Public (unauthenticated) query — for the public Pitham page, settings, etc. */
export function usePublicQuery<T>(
  key: QueryKey,
  fn: () => Promise<T>,
  options: Omit<UseQueryOptions<T>, "queryKey" | "queryFn"> = {},
) {
  return useQuery<T>({
    queryKey: key,
    queryFn: fn,
    ...options,
  });
}
