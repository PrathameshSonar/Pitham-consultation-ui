"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearToken, getToken } from "@/services/api";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity

export default function SessionTimeout() {
  const router = useRouter();
  const pathname = usePathname();
  const timer = useRef<NodeJS.Timeout | null>(null);

  function resetTimer() {
    if (timer.current) clearTimeout(timer.current);
    const token = getToken();
    if (!token) return;
    timer.current = setTimeout(() => {
      clearToken();
      router.push("/login");
    }, TIMEOUT_MS);
  }

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
