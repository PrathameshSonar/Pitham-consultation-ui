"use client";

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

const TILES: { href: string; icon: React.ReactNode; labelKey: MessageKey; descKey: MessageKey }[] = [
  {
    href: "/admin/appointments",
    icon: <EventNoteIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.appts",
    descKey: "adm.tile.appts.desc",
  },
  {
    href: "/admin/users",
    icon: <GroupIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.users",
    descKey: "adm.tile.users.desc",
  },
  {
    href: "/admin/user-lists",
    icon: <PeopleIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.lists",
    descKey: "adm.tile.lists.desc",
  },
  {
    href: "/admin/calendar",
    icon: <CalendarMonthIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.cal",
    descKey: "adm.tile.cal.desc",
  },
  {
    href: "/admin/documents",
    icon: <DescriptionIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.docs",
    descKey: "adm.tile.docs.desc",
  },
  {
    href: "/admin/recordings",
    icon: <VideocamIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.rec",
    descKey: "adm.tile.rec.desc",
  },
  {
    href: "/admin/queries",
    icon: <ChatBubbleIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.queries",
    descKey: "adm.tile.queries.desc",
  },
  {
    href: "/admin/broadcasts",
    icon: <CampaignIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.broadcast",
    descKey: "adm.tile.broadcast.desc",
  },
  {
    href: "/admin/pitham",
    icon: <EventAvailableIcon className={TILE_ICON_CLASS} />,
    labelKey: "adm.tile.pcms",
    descKey: "adm.tile.pcms.desc",
  },
  {
    href: "/admin/settings",
    icon: <SettingsIcon className={TILE_ICON_CLASS} />,
    labelKey: "nav.settings",
    descKey: "adm.tile.appts.desc",
  },
];

export default function AdminDashboard() {
  const { t } = useT();
  const { data, isLoading: loading } = useAuthQuery<any>(["admin-analytics"], adminGetAnalytics);
  const { data: fbSummary } = useAuthQuery<any>(["admin-feedback-summary"], adminFeedbackSummary);

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
              <Box className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5 mb-8">
                {[
                  {
                    label: t("adm.tile.users"),
                    value: data.totals.users,
                    icon: <GroupIcon />,
                    color: brandColors.saffron,
                  },
                  {
                    label: t("adm.tile.appts"),
                    value: data.totals.appointments,
                    icon: <EventNoteIcon />,
                    color: brandColors.maroon,
                  },
                  {
                    label: t("adm.tile.docs"),
                    value: data.totals.documents,
                    icon: <DescriptionIcon />,
                    color: brandColors.gold,
                  },
                  {
                    label: t("adm.tile.queries"),
                    value: data.totals.queries,
                    icon: <ChatBubbleIcon />,
                    color: brandColors.info,
                  },
                ].map((card, i) => (
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

              {/* ── 30-day highlights ── */}
              <Box className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5 mb-8">
                {[
                  {
                    label: t("analytics.newUsers"),
                    value: data.recent_30d.new_users,
                    icon: <PersonAddIcon fontSize="small" />,
                  },
                  {
                    label: t("analytics.newAppts"),
                    value: data.recent_30d.new_appointments,
                    icon: <TrendingUpIcon fontSize="small" />,
                  },
                  {
                    label: t("analytics.completed"),
                    value: data.recent_30d.completed,
                    icon: <CheckCircleIcon fontSize="small" />,
                  },
                  {
                    label: t("analytics.openQueries"),
                    value: data.recent_30d.open_queries,
                    icon: <QuestionMarkIcon fontSize="small" />,
                  },
                ].map((card, i) => (
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

              {/* ── Revenue Cards ── */}
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

              {/* ── Pie Charts ── */}
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <StatusPieChart data={data.appointment_by_status} title={t("analytics.apptStatus")} />
                <StatusPieChart data={data.appointment_by_payment} title={t("analytics.paymentStatus")} />
              </Box>

              {/* ── Monthly Charts ── */}
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <MonthlyBarChart data={data.appointments_per_month} title={t("analytics.apptPerMonth")} />
                <MonthlyBarChart
                  data={data.revenue_per_month.map((r: any) => ({ month: r.month, count: r.revenue }))}
                  title={t("analytics.revenuePerMonth")}
                />
                <MonthlyLineChart data={data.users_per_month} title={t("analytics.usersPerMonth")} />
              </Box>

              {/* ── Feedback summary ── */}
              {fbSummary && fbSummary.total > 0 && (
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

        {/* ── Quick navigation tiles ── */}
        <Typography variant="h6" className="!font-bold !text-brand-maroon !mb-4">
          {t("analytics.quickNav")}
        </Typography>
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {TILES.map((tile) => (
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
      </Box>
    </Box>
  );
}
