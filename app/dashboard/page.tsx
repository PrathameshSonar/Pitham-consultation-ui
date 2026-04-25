"use client";

import Link from "next/link";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubble";
import { getProfile } from "@/services/api";
import { useAuthQuery } from "@/services/queryHooks";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";
import * as s from "./styles";

// Static — defined at module scope so it's not recreated on every render.
const TILES: { href: string; icon: React.ReactNode; labelKey: MessageKey; descKey: MessageKey }[] = [
  {
    href: "/dashboard/book-appointment",
    icon: <CalendarMonthIcon fontSize="large" color="primary" />,
    labelKey: "dash.tile.book",
    descKey: "dash.tile.book.desc",
  },
  {
    href: "/dashboard/history",
    icon: <HistoryIcon fontSize="large" color="primary" />,
    labelKey: "dash.tile.history",
    descKey: "dash.tile.history.desc",
  },
  {
    href: "/dashboard/documents",
    icon: <DescriptionIcon fontSize="large" color="primary" />,
    labelKey: "dash.tile.docs",
    descKey: "dash.tile.docs.desc",
  },
  {
    href: "/dashboard/queries",
    icon: <ChatBubbleOutlineIcon fontSize="large" color="primary" />,
    labelKey: "dash.tile.queries",
    descKey: "dash.tile.queries.desc",
  },
];

export default function Dashboard() {
  const { t } = useT();
  // Cached across navigation — second visit is instant
  const { data: profile, isLoading } = useAuthQuery(["profile"], getProfile);

  if (isLoading || !profile) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Paper elevation={0} sx={s.welcomeCard}>
          <Typography sx={s.welcomeLabel}>{t("dash.namaste")}</Typography>
          <Typography sx={s.welcomeName}>{profile.name}</Typography>
          <Box sx={s.infoGrid}>
            {[
              [t("common.email"), profile.email],
              [t("common.mobile"), profile.mobile],
              [t("users.city"), `${profile.city}, ${profile.state}`],
              [t("users.country"), profile.country],
            ].map(([k, v]) => (
              <Box key={k} sx={s.infoItem}>
                <span className="label">{k}</span>
                <span className="value">{v}</span>
              </Box>
            ))}
          </Box>
        </Paper>

        <Box sx={s.tilesGrid}>
          {TILES.map((tile) => (
            <Box key={tile.href} component={Link} href={tile.href} sx={s.tile}>
              <Box sx={s.tileIcon}>{tile.icon}</Box>
              <Box>
                <Typography variant="h6" sx={s.tileTitle}>
                  {t(tile.labelKey)}
                </Typography>
                <Typography sx={s.tileDesc}>{t(tile.descKey)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
