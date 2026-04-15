"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppointmentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/history");
  }, [router]);
  return null;
}
