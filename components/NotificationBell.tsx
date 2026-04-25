"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconButton, Badge } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useQuery } from "@tanstack/react-query";
import { getUnreadBroadcastCount, getToken } from "@/services/api";

/** Tiny self-contained component that polls /broadcasts/unread-count every 60s.
 *  Renders nothing for non-authenticated users (no token). */
export default function NotificationBell({ ariaLabel = "Notifications" }: { ariaLabel?: string }) {
  // Hydration-safe: don't read localStorage on the server pass
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setToken(getToken() || null);
  }, []);

  const { data } = useQuery({
    queryKey: ["broadcasts", "unread"],
    queryFn: () => getUnreadBroadcastCount(token!),
    enabled: !!token,
    refetchInterval: 60_000, // poll once a minute
    refetchOnWindowFocus: true, // refresh when user comes back to tab
    staleTime: 30_000,
  });

  if (!token) return null;
  const count = data?.count ?? 0;

  return (
    <IconButton
      component={Link}
      href="/dashboard/notifications"
      sx={{ color: "#fff" }}
      aria-label={ariaLabel}
    >
      <Badge badgeContent={count} color="error" max={99}>
        <NotificationsIcon fontSize="small" />
      </Badge>
    </IconButton>
  );
}
