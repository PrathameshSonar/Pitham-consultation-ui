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
import { brandColors } from "@/theme/colors";

const WRAPPER_CLASS =
  "min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-12 px-3 sm:px-4";

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
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className="max-w-[1000px] mx-auto w-full">
        <Paper
          elevation={0}
          className="!text-white !p-6 md:!p-8 !rounded-[2.5rem] !mb-8 !relative !overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${brandColors.saffronDark} 0%, ${brandColors.saffron} 100%)`,
          }}
        >
          <Typography className="!opacity-85 !text-[0.85rem] !uppercase !tracking-[0.15em] !mb-1">
            {t("dash.namaste")}
          </Typography>
          <Typography className="!font-[Cinzel,serif] !font-bold !text-[1.4rem] sm:!text-[1.8rem] md:!text-[2.2rem] !mb-4 !break-words">
            {profile.name}
          </Typography>
          <Box className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-[1]">
            {[
              [t("common.email"), profile.email],
              [t("common.mobile"), profile.mobile],
              [t("users.city"), `${profile.city}, ${profile.state}`],
              [t("users.country"), profile.country],
            ].map(([k, v]) => (
              <Box key={k}>
                <span className="block text-xs opacity-75 uppercase tracking-[0.1em]">{k}</span>
                <span className="text-[0.95rem] font-medium">{v}</span>
              </Box>
            ))}
          </Box>
        </Paper>

        <Box className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {TILES.map((tile) => (
            <Box
              key={tile.href}
              component={Link}
              href={tile.href}
              className="p-6 rounded-3xl bg-brand-ivory border border-brand-sand flex items-center gap-6 cursor-pointer no-underline transition-all duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_12px_30px_rgba(230,81,0,0.14)] hover:border-brand-saffron-light"
            >
              <Box className="text-[2.5rem] leading-none">{tile.icon}</Box>
              <Box>
                <Typography variant="h6" className="!text-brand-maroon !font-bold !mb-1">
                  {t(tile.labelKey)}
                </Typography>
                <Typography className="!text-brand-text-medium !text-[0.88rem]">
                  {t(tile.descKey)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
