"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box, Paper, Typography, CircularProgress,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
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
import { adminGetAnalytics, getToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";
import type { MessageKey } from "@/i18n/messages";
import * as s from "./styles";

// Single dynamic import for all chart components (avoids Cell rendering issue)
const StatusPieChart = dynamic(() => import("@/components/AdminCharts").then(m => m.StatusPieChart), { ssr: false });
const MonthlyBarChart = dynamic(() => import("@/components/AdminCharts").then(m => m.MonthlyBarChart), { ssr: false });
const MonthlyLineChart = dynamic(() => import("@/components/AdminCharts").then(m => m.MonthlyLineChart), { ssr: false });

const TILES: { href: string; icon: React.ReactNode; labelKey: MessageKey; descKey: MessageKey }[] = [
  { href: "/admin/appointments", icon: <EventNoteIcon sx={s.tileIcon} />,     labelKey: "adm.tile.appts",   descKey: "adm.tile.appts.desc" },
  { href: "/admin/users",        icon: <GroupIcon sx={s.tileIcon} />,         labelKey: "adm.tile.users",   descKey: "adm.tile.users.desc" },
  { href: "/admin/user-lists",   icon: <PeopleIcon sx={s.tileIcon} />,        labelKey: "adm.tile.lists",   descKey: "adm.tile.lists.desc" },
  { href: "/admin/calendar",     icon: <CalendarMonthIcon sx={s.tileIcon} />, labelKey: "adm.tile.cal",     descKey: "adm.tile.cal.desc" },
  { href: "/admin/documents",    icon: <DescriptionIcon sx={s.tileIcon} />,   labelKey: "adm.tile.docs",    descKey: "adm.tile.docs.desc" },
  { href: "/admin/recordings",   icon: <VideocamIcon sx={s.tileIcon} />,      labelKey: "adm.tile.rec",     descKey: "adm.tile.rec.desc" },
  { href: "/admin/queries",      icon: <ChatBubbleIcon sx={s.tileIcon} />,    labelKey: "adm.tile.queries", descKey: "adm.tile.queries.desc" },
  { href: "/admin/settings",     icon: <SettingsIcon sx={s.tileIcon} />,      labelKey: "nav.settings",     descKey: "adm.tile.appts.desc" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { t } = useT();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    adminGetAnalytics(token)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Box sx={s.header}>
          <Typography variant="h4" sx={s.headerTitle}>{t("adm.dashboard.title")}</Typography>
          <Typography sx={s.headerSubtitle}>{t("adm.dashboard.subtitle")}</Typography>
        </Box>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>
        ) : data && (
          <>
            {/* ── Summary Cards ── */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
              gap: { xs: 1.5, md: 2.5 },
              mb: 4,
            }}>
              {[
                { label: t("adm.tile.users"), value: data.totals.users, icon: <GroupIcon />, color: brandColors.saffron },
                { label: t("adm.tile.appts"), value: data.totals.appointments, icon: <EventNoteIcon />, color: brandColors.maroon },
                { label: t("adm.tile.docs"), value: data.totals.documents, icon: <DescriptionIcon />, color: brandColors.gold },
                { label: t("adm.tile.queries"), value: data.totals.queries, icon: <ChatBubbleIcon />, color: brandColors.info },
              ].map((card, i) => (
                <Paper key={i} elevation={0} sx={{
                  p: { xs: 2, md: 3 }, borderRadius: 4, border: `1px solid ${brandColors.sand}`,
                  display: "flex", alignItems: "center", gap: 2,
                }}>
                  <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${card.color}18`, color: card.color }}>
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: card.color, lineHeight: 1 }}>
                      {card.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {card.label}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* ── 30-day highlights ── */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
              gap: { xs: 1.5, md: 2.5 },
              mb: 4,
            }}>
              {[
                { label: t("analytics.newUsers"), value: data.recent_30d.new_users, icon: <PersonAddIcon fontSize="small" /> },
                { label: t("analytics.newAppts"), value: data.recent_30d.new_appointments, icon: <TrendingUpIcon fontSize="small" /> },
                { label: t("analytics.completed"), value: data.recent_30d.completed, icon: <CheckCircleIcon fontSize="small" /> },
                { label: t("analytics.openQueries"), value: data.recent_30d.open_queries, icon: <QuestionMarkIcon fontSize="small" /> },
              ].map((card, i) => (
                <Paper key={i} elevation={0} sx={{
                  p: { xs: 1.5, md: 2.5 }, borderRadius: 3, border: `1px solid ${brandColors.sand}`,
                  textAlign: "center",
                }}>
                  <Box sx={{ color: brandColors.saffron, mb: 0.5 }}>{card.icon}</Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{card.value}</Typography>
                  <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                </Paper>
              ))}
            </Box>

            {/* ── Revenue Cards ── */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: { xs: 1.5, md: 2.5 },
              mb: 4,
            }}>
              <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, borderRadius: 4, border: `1px solid ${brandColors.sand}`,
                display: "flex", alignItems: "center", gap: 2,
              }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${brandColors.success}18`, color: brandColors.success }}>
                  <CurrencyRupeeIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.success, lineHeight: 1 }}>
                    &#8377;{(data.revenue.total || 0).toLocaleString("en-IN")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t("analytics.totalRevenue")}
                  </Typography>
                </Box>
              </Paper>
              <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, borderRadius: 4, border: `1px solid ${brandColors.sand}`,
                display: "flex", alignItems: "center", gap: 2,
              }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${brandColors.info}18`, color: brandColors.info }}>
                  <AccessTimeIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.info, lineHeight: 1 }}>
                    {data.revenue.total_hours}h
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t("analytics.totalHours")}
                  </Typography>
                </Box>
              </Paper>
              <Paper elevation={0} sx={{
                p: { xs: 2, md: 3 }, borderRadius: 4, border: `1px solid ${brandColors.sand}`,
                display: "flex", alignItems: "center", gap: 2,
              }}>
                <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${brandColors.gold}18`, color: brandColors.gold }}>
                  <CheckCircleIcon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.gold, lineHeight: 1 }}>
                    {data.revenue.total_completed}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t("analytics.totalCompleted")}
                  </Typography>
                </Box>
              </Paper>
            </Box>

            {/* ── Pie Charts ── */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3, mb: 4,
            }}>
              <StatusPieChart data={data.appointment_by_status} title={t("analytics.apptStatus")} />
              <StatusPieChart data={data.appointment_by_payment} title={t("analytics.paymentStatus")} />
            </Box>

            {/* ── Monthly Charts ── */}
            <Box sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3, mb: 4,
            }}>
              <MonthlyBarChart data={data.appointments_per_month} title={t("analytics.apptPerMonth")} />
              <MonthlyBarChart data={data.revenue_per_month.map((r: any) => ({ month: r.month, count: r.revenue }))} title={t("analytics.revenuePerMonth")} />
              <MonthlyLineChart data={data.users_per_month} title={t("analytics.usersPerMonth")} />
            </Box>
          </>
        )}

        {/* ── Quick navigation tiles ── */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
          {t("analytics.quickNav")}
        </Typography>
        <Box sx={s.tilesGrid}>
          {TILES.map(tile => (
            <Box key={tile.href} component={Link} href={tile.href} sx={s.tile}>
              {tile.icon}
              <Box>
                <Typography sx={s.tileTitle}>{t(tile.labelKey)}</Typography>
                <Typography sx={s.tileDesc}>{t(tile.descKey)}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
