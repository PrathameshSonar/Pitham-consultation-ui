"use client";

import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box, Paper, Typography, Button, Stack, CircularProgress, Chip } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import {
  getMyBroadcasts,
  markBroadcastRead,
  markAllBroadcastsRead,
  getToken,
  fileUrl,
  type Broadcast,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

/** Memoized list row — re-renders only when the broadcast or its read state changes. */
const NotificationRow = memo(function NotificationRow({
  b,
  onMarkRead,
}: {
  b: Broadcast;
  onMarkRead: (id: number) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        position: "relative",
        border: `1px solid ${b.is_read ? brandColors.sand : brandColors.saffron}`,
        bgcolor: b.is_read ? "background.paper" : `${brandColors.saffron}08`,
        transition: "all 0.15s ease",
      }}
      onClick={() => !b.is_read && onMarkRead(b.id)}
    >
      {!b.is_read && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: brandColors.saffron,
          }}
        />
      )}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        {b.image_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl(b.image_path)}
            alt=""
            loading="lazy"
            style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0, pr: !b.is_read ? 3 : 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 0.5 }}>
            {b.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            {new Date(b.created_at).toLocaleString()}
            {b.sent_by_name ? ` · ${b.sent_by_name}` : ""}
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "text.secondary" }}>
            {b.message}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
});

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useT();
  const qc = useQueryClient();
  const token = getToken();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["broadcasts", "mine"],
    queryFn: () => getMyBroadcasts(token),
    enabled: !!token,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markBroadcastRead(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broadcasts", "mine"] });
      qc.invalidateQueries({ queryKey: ["broadcasts", "unread"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllBroadcastsRead(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broadcasts", "mine"] });
      qc.invalidateQueries({ queryKey: ["broadcasts", "unread"] });
    },
  });

  const handleMarkRead = useCallback((id: number) => markReadMutation.mutate(id), [markReadMutation]);

  if (!token) {
    router.push("/login");
    return null;
  }

  const unreadCount = items.filter((b: Broadcast) => !b.is_read).length;

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: "background.default",
        py: { xs: 3, md: 5 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <NotificationsIcon sx={{ color: brandColors.maroon, fontSize: "2rem" }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: brandColors.maroon }}>
              {t("notif.title")}
            </Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} ${t("notif.unread")}`} color="warning" size="small" />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              {t("notif.markAllRead")}
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Paper
            elevation={0}
            sx={{ p: 5, borderRadius: 4, border: `1px dashed ${brandColors.sand}`, textAlign: "center" }}
          >
            <NotificationsIcon sx={{ fontSize: 64, color: brandColors.sand, mb: 1 }} />
            <Typography color="text.secondary">{t("notif.empty")}</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {items.map((b: Broadcast) => (
              <NotificationRow key={b.id} b={b} onMarkRead={handleMarkRead} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
