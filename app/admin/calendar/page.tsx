"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Paper, Typography, IconButton, Button } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import { adminGetAppointments, getToken } from "@/services/api";
import { formatTime12h } from "@/lib/timeSlots";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function daysInMonth(y: number, m: number)    { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

export default function AdminCalendar() {
  const router = useRouter();
  const { t } = useT();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDay, setSelectedDay]   = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    adminGetAppointments(token)
      .then(data => {
        // Only keep non-completed, non-cancelled appointments with a scheduled date >= today
        const filtered = data.filter((a: any) =>
          a.scheduled_date &&
          a.status !== "completed" &&
          a.status !== "cancelled" &&
          a.scheduled_date >= todayStr
        );
        setAppointments(filtered);
      })
      .catch(() => router.push("/login"));
  }, [router, todayStr]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const days     = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const cells    = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function apptCount(day: number) {
    return appointments.filter(a => a.scheduled_date === dateStr(day)).length;
  }

  // Sort all upcoming by date+time ascending
  const upcoming = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const d = a.scheduled_date.localeCompare(b.scheduled_date);
      if (d !== 0) return d;
      return (a.scheduled_time || "").localeCompare(b.scheduled_time || "");
    });
  }, [appointments]);

  const displayed = selectedDay
    ? upcoming.filter(a => a.scheduled_date === selectedDay)
    : upcoming;

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Typography variant="h4" sx={s.title}>{t("cal.title")}</Typography>

        <Box sx={s.gridLayout}>
          {/* ── Side panel: list of upcoming appointments ─────── */}
          <Box sx={s.sidePanel}>
            <Typography sx={s.sideHeader}>
              {selectedDay
                ? t("cal.onDay", { date: selectedDay })
                : t("cal.allScheduled")}
              {" "}({displayed.length})
            </Typography>
            {selectedDay && (
              <Button size="small" onClick={() => setSelectedDay(null)}>
                {t("common.all")}
              </Button>
            )}

            {displayed.length === 0 ? (
              <Paper elevation={0} sx={s.emptyPanel}>
                <Typography color="text.secondary">{t("cal.noToday")}</Typography>
              </Paper>
            ) : (
              displayed.map((a: any) => (
                <Paper key={a.id} elevation={0} sx={s.apptItem}>
                  <Box sx={s.dateChip}>
                    {a.scheduled_date === todayStr ? t("cal.today") : a.scheduled_date}
                    {" · "}{formatTime12h(a.scheduled_time)}
                  </Box>
                  <Typography sx={{ fontWeight: 700, wordBreak: "break-word" }}>{a.name}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                    {a.email}
                  </Typography>
                  {a.zoom_link && (
                    <Box sx={{ mt: 1 }}>
                      <Button
                        component="a"
                        href={a.zoom_link}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        startIcon={<VideoCallIcon />}
                      >
                        {t("cal.zoom")}
                      </Button>
                    </Box>
                  )}
                </Paper>
              ))
            )}
          </Box>

          {/* ── Calendar grid ─────────────────────────────── */}
          <Paper elevation={0} sx={s.calCard}>
            <Box sx={s.monthNav}>
              <IconButton onClick={prevMonth}><ChevronLeftIcon /></IconButton>
              <Typography sx={s.monthLabel}>
                {MONTH_NAMES[month]} {year}
              </Typography>
              <IconButton onClick={nextMonth}><ChevronRightIcon /></IconButton>
            </Box>

            <Box sx={s.weekRow}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <span key={d}>{d}</span>)}
            </Box>

            <Box sx={s.daysGrid}>
              {cells.map((day, idx) => {
                if (!day) return <Box key={`e-${idx}`} />;
                const ds = dateStr(day);
                const isPast     = ds < todayStr;
                const isToday    = ds === todayStr;
                const isSelected = ds === selectedDay;
                const count      = apptCount(day);

                return (
                  <Box
                    key={ds}
                    sx={{
                      ...s.dayCell(isSelected, isToday, count > 0),
                      opacity: isPast ? 0.35 : 1,
                      pointerEvents: isPast ? "none" : "auto",
                    }}
                    onClick={() => setSelectedDay(isSelected ? null : ds)}
                  >
                    {day}
                    {count > 0 && <Box component="span" sx={s.badge(isSelected)}>{count}</Box>}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
