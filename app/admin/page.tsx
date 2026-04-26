"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Paper, Typography, CircularProgress, Rating } from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CampaignIcon from "@mui/icons-material/Campaign";
import GroupIcon from "@mui/icons-material/Group";
import PeopleIcon from "@mui/icons-material/People";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DescriptionIcon from "@mui/icons-material/Description";
import VideocamIcon from "@mui/icons-material/Videocam";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import SettingsIcon from "@mui/icons-material/Settings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import dynamic from "next/dynamic";
import { adminGetAnalytics, adminFeedbackSummary } from "@/services/api";
import { useAuthQuery } from "@/services/queryHooks";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";
import type { MessageKey } from "@/i18n/messages";
import type { AdminSectionKey } from "@/lib/adminSections";
import { hasSection, isSuperAdminClient } from "@/lib/permissions";

const StatusPieChart = dynamic(() => import("@/components/AdminCharts").then((m) => m.StatusPieChart), {
  ssr: false,
});
const MonthlyBarChart = dynamic(() => import("@/components/AdminCharts").then((m) => m.MonthlyBarChart), {
  ssr: false,
});
const MonthlyLineChart = dynamic(() => import("@/components/AdminCharts").then((m) => m.MonthlyLineChart), {
  ssr: false,
});

const TILE_ICON_CLASS = "!text-[2.4rem] !text-brand-saffron";

// Each tile is tagged with the section it belongs to. "super_admin" means the
// tile is visible only to super admin (settings + nothing else for now). The
// dashboard filters this list before rendering, mirroring the navbar.
type TileGuard = AdminSectionKey | "super_admin";
type Tile = {
  href: string;
  icon: React.ReactNode;
  labelKey: MessageKey;
  descKey: MessageKey;
  section: TileGuard;
};

const TILES: Tile[] = [
  {
    href: "/admin/appointments",
    icon: <EventNoteIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.appts",
    descKey: "adm.tile.appts.desc",
    section: "appointments",
  },
  {
    href: "/admin/users",
    icon: <GroupIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.users",
    descKey: "adm.tile.users.desc",
    section: "users",
  },
  {
    href: "/admin/user-lists",
    icon: <PeopleIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.lists",
    descKey: "adm.tile.lists.desc",
    section: "user_lists",
  },
  {
    href: "/admin/calendar",
    icon: <CalendarMonthIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.cal",
    descKey: "adm.tile.cal.desc",
    section: "appointments",   // calendar reads appointment data
  },
  {
    href: "/admin/documents",
    icon: <DescriptionIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.docs",
    descKey: "adm.tile.docs.desc",
    section: "documents",
  },
  {
    href: "/admin/recordings",
    icon: <VideocamIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.rec",
    descKey: "adm.tile.rec.desc",
    section: "recordings",
  },
  {
    href: "/admin/queries",
    icon: <ChatBubbleIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.queries",
    descKey: "adm.tile.queries.desc",
    section: "queries",
  },
  {
    href: "/admin/broadcasts",
    icon: <CampaignIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.broadcast",
    descKey: "adm.tile.broadcast.desc",
    section: "broadcasts",
  },
  {
    href: "/admin/pitham",
    icon: <EventAvailableIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.pcms",
    descKey: "adm.tile.pcms.desc",
    section: "pitham_cms",
  },
  {
    href: "/admin/settings",
    icon: <SettingsIcon className={TILE_ICON_CLASS} />,
    labelKey: "nav.settings",
    descKey: "adm.tile.appts.desc",
    section: "super_admin",
  },
];

export default function AdminDashboard() {
  const { t } = useT();
  const { data, isLoading: loading } = useAuthQuery<any>(["admin-analytics"], adminGetAnalytics);
  const { data: fbSummary } = useAuthQuery<any>(["admin-feedback-summary"], adminFeedbackSummary);

  // Permission flags. Read once on mount — localStorage isn't readable during
  // SSR, and we want predictable rendering. The state hydrates after mount.
  const [perms, setPerms] = useState<{ super: boolean; sections: Record<AdminSectionKey, boolean> }>({
    super: false,
    sections: {
      appointments: false,
      users: false,
      user_lists: false,
      documents: false,
      recordings: false,
      queries: false,
      broadcasts: false,
      pitham_cms: false,
    },
  });

  useEffect(() => {
    const isSuper = isSuperAdminClient();
    setPerms({
      super: isSuper,
      sections: {
        appointments: isSuper || hasSection("appointments"),
        users: isSuper || hasSection("users"),
        user_lists: isSuper || hasSection("user_lists"),
        documents: isSuper || hasSection("documents"),
        recordings: isSuper || hasSection("recordings"),
        queries: isSuper || hasSection("queries"),
        broadcasts: isSuper || hasSection("broadcasts"),
        pitham_cms: isSuper || hasSection("pitham_cms"),
      },
    });
  }, []);

  // Tile filter mirrors the navbar — only show what the user can reach.
  const visibleTiles = TILES.filter((tile) => {
    if (tile.section === "super_admin") return perms.super;
    return perms.sections[tile.section];
  });

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4">
      <Box className="max-w-[1200px] mx-auto">
        <Box className="mb-8">
          <Typography variant="h4" className="!text-brand-maroon !font-bold !mb-1">
            {t("adm.dashboard.title")}
          </Typography>
          <Typography className="!text-brand-text-medium">
            {t("adm.dashboard.subtitle")}
          </Typography>
        </Box>

        {loading ? (
          <Box className="text-center py-8">
            <CircularProgress />
          </Box>
        ) : (
          data && (
            <>
              {/* ── Summary Cards ── */}
              {(() => {
                const cards = [
                  {
                    label: t("adm.tile.users"),
                    value: data.totals.users,
                    icon: <GroupIcon />,
                    color: brandColors.saffron,
                    section: "users" as AdminSectionKey,
                  },
                  {
                    label: t("adm.tile.appts"),
                    value: data.totals.appointments,
                    icon: <EventNoteIcon />,
                    color: brandColors.maroon,
                    section: "appointments" as AdminSectionKey,
                  },
                  {
                    label: t("adm.tile.docs"),
                    value: data.totals.documents,
                    icon: <DescriptionIcon />,
                    color: brandColors.gold,
                    section: "documents" as AdminSectionKey,
                  },
                  {
                    label: t("adm.tile.queries"),
                    value: data.totals.queries,
                    icon: <ChatBubbleIcon />,
                    color: brandColors.info,
                    section: "queries" as AdminSectionKey,
                  },
                ].filter((c) => perms.sections[c.section]);
                if (cards.length === 0) return null;
                return (
              <Box className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5 mb-8">
                {cards.map((card, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    className="!p-4 md:!p-6 !rounded-3xl !border !border-brand-sand !flex !items-center !gap-4"
                  >
                    <Box
                      className="p-3 rounded-2xl"
                      style={{ backgroundColor: `${card.color}18`, color: card.color }}
                    >
                      {card.icon}
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        className="!font-extrabold !leading-none"
                        style={{ color: card.color }}
                      >
                        {card.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" className="!font-semibold">
                        {card.label}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
                );
              })()}

              {/* ── 30-day highlights ── */}
              {(() => {
                const cards = [
                  {
                    label: t("analytics.newUsers"),
                    value: data.recent_30d.new_users,
                    icon: <PersonAddIcon fontSize="small" />,
                    section: "users" as AdminSectionKey,
                  },
                  {
                    label: t("analytics.newAppts"),
                    value: data.recent_30d.new_appointments,
                    icon: <TrendingUpIcon fontSize="small" />,
                    section: "appointments" as AdminSectionKey,
                  },
                  {
                    label: t("analytics.completed"),
                    value: data.recent_30d.completed,
                    icon: <CheckCircleIcon fontSize="small" />,
                    section: "appointments" as AdminSectionKey,
                  },
                  {
                    label: t("analytics.openQueries"),
                    value: data.recent_30d.open_queries,
                    icon: <QuestionMarkIcon fontSize="small" />,
                    section: "queries" as AdminSectionKey,
                  },
                ].filter((c) => perms.sections[c.section]);
                if (cards.length === 0) return null;
                return (
              <Box className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5 mb-8">
                {cards.map((card, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    className="!p-3 md:!p-5 !rounded-2xl !border !border-brand-sand !text-center"
                  >
                    <Box className="text-brand-saffron mb-1">{card.icon}</Box>
                    <Typography variant="h5" className="!font-extrabold">
                      {card.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                  </Paper>
                ))}
              </Box>
                );
              })()}

              {/* ── Revenue Cards — super admin only (financial data) ── */}
              {perms.super && (
              <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 mb-8">
                <Paper
                  elevation={0}
                  className="!p-4 md:!p-6 !rounded-3xl !border !border-brand-sand !flex !items-center !gap-4"
                >
                  <Box
                    className="p-3 rounded-2xl"
                    style={{ backgroundColor: `${brandColors.success}18`, color: brandColors.success }}
                  >
                    <CurrencyRupeeIcon />
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      className="!font-extrabold !text-brand-success !leading-none"
                    >
                      &#8377;{(data.revenue.total || 0).toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" className="!font-semibold">
                      {t("analytics.totalRevenue")}
                    </Typography>
                  </Box>
                </Paper>
                <Paper
                  elevation={0}
                  className="!p-4 md:!p-6 !rounded-3xl !border !border-brand-sand !flex !items-center !gap-4"
                >
                  <Box
                    className="p-3 rounded-2xl"
                    style={{ backgroundColor: `${brandColors.info}18`, color: brandColors.info }}
                  >
                    <AccessTimeIcon />
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      className="!font-extrabold !text-brand-info !leading-none"
                    >
                      {data.revenue.total_hours}h
                    </Typography>
                    <Typography variant="caption" color="text.secondary" className="!font-semibold">
                      {t("analytics.totalHours")}
                    </Typography>
                  </Box>
                </Paper>
                <Paper
                  elevation={0}
                  className="!p-4 md:!p-6 !rounded-3xl !border !border-brand-sand !flex !items-center !gap-4"
                >
                  <Box
                    className="p-3 rounded-2xl"
                    style={{ backgroundColor: `${brandColors.gold}18`, color: brandColors.gold }}
                  >
                    <CheckCircleIcon />
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      className="!font-extrabold !text-brand-gold !leading-none"
                    >
                      {data.revenue.total_completed}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" className="!font-semibold">
                      {t("analytics.totalCompleted")}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
              )}

              {/* ── Pie Charts — both visualise appointment data ── */}
              {perms.sections.appointments && (
                <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <StatusPieChart data={data.appointment_by_status} title={t("analytics.apptStatus")} />
                  <StatusPieChart data={data.appointment_by_payment} title={t("analytics.paymentStatus")} />
                </Box>
              )}

              {/* ── Monthly Charts — appointments + users gated by section,
                    revenue gated by super admin ── */}
              {(perms.sections.appointments || perms.sections.users || perms.super) && (
                <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {perms.sections.appointments && (
                    <MonthlyBarChart data={data.appointments_per_month} title={t("analytics.apptPerMonth")} />
                  )}
                  {perms.super && (
                    <MonthlyBarChart
                      data={data.revenue_per_month.map((r: any) => ({ month: r.month, count: r.revenue }))}
                      title={t("analytics.revenuePerMonth")}
                    />
                  )}
                  {perms.sections.users && (
                    <MonthlyLineChart data={data.users_per_month} title={t("analytics.usersPerMonth")} />
                  )}
                </Box>
              )}

              {/* ── Feedback summary — super admin only ── */}
              {perms.super && fbSummary && fbSummary.total > 0 && (
                <Paper
                  elevation={0}
                  className="!p-4 md:!p-6 !rounded-3xl !border !border-brand-sand !mb-8 !flex !items-center !gap-6 !flex-wrap"
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("analytics.feedbackTitle")}
                    </Typography>
                    <Box className="flex items-center gap-2 mt-1">
                      <Typography variant="h4" className="!font-extrabold !text-brand-gold">
                        {fbSummary.average ?? "—"}
                      </Typography>
                      <Rating value={fbSummary.average || 0} precision={0.1} readOnly />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("analytics.feedbackTotal", { count: fbSummary.total })}
                    </Typography>
                  </Box>
                </Paper>
              )}
            </>
          )
        )}

        {/* ── Quick navigation tiles — only what the user can reach ── */}
        {visibleTiles.length > 0 && (
          <>
        <Typography variant="h6" className="!font-bold !text-brand-maroon !mb-4">
          {t("analytics.quickNav")}
        </Typography>
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {visibleTiles.map((tile) => (
            <Box
              key={tile.href}
              component={Link}
              href={tile.href}
              className="p-6 rounded-3xl bg-brand-ivory border border-brand-sand flex items-center gap-5 cursor-pointer no-underline transition-all duration-[250ms] hover:-translate-y-[3px] hover:shadow-[0_12px_30px_rgba(123,30,30,0.12)] hover:border-brand-gold"
            >
              {tile.icon}
              <Box>
                <Typography className="!font-bold !text-brand-maroon">
                  {t(tile.labelKey)}
                </Typography>
                <Typography className="!text-brand-text-medium !text-[0.85rem]">
                  {t(tile.descKey)}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
