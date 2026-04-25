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
      className={`!p-6 !rounded-3xl !relative !transition-all !duration-150 !border ${
        b.is_read ? "!border-brand-sand !bg-brand-ivory" : "!border-brand-saffron !bg-brand-saffron/5"
      }`}
      onClick={() => !b.is_read && onMarkRead(b.id)}
    >
      {!b.is_read && (
        <Box className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-brand-saffron" />
      )}
      <Box className="flex gap-4 items-start">
        {b.image_path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl(b.image_path)}
            alt=""
            loading="lazy"
            style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
          />
        )}
        <Box className={`flex-1 min-w-0 ${b.is_read ? "" : "pr-6"}`}>
          <Typography variant="h6" className="!font-bold !text-brand-maroon !mb-1">
            {b.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            className="!block !mb-2"
          >
            {new Date(b.created_at).toLocaleString()}
            {b.sent_by_name ? ` · ${b.sent_by_name}` : ""}
          </Typography>
          <Typography className="!whitespace-pre-wrap !leading-[1.7] !text-brand-text-medium">
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
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-10 px-4 md:px-8">
      <Box className="max-w-[800px] mx-auto">
        <Box className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <Box className="flex items-center gap-3">
            <NotificationsIcon className="!text-brand-maroon !text-[2rem]" />
            <Typography variant="h4" className="!font-bold !text-brand-maroon">
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
          <Box className="text-center py-12">
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Paper
            elevation={0}
            className="!p-10 !rounded-3xl !border !border-dashed !border-brand-sand !text-center"
          >
            <NotificationsIcon className="!text-[64px] !text-brand-sand !mb-2" />
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
