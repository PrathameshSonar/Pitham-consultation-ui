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
import { brandColors } from "@/theme/colors";
import { useRequireSection } from "@/lib/useRequireSection";
import { CircularProgress } from "@mui/material";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

function dayCellStyle(isSelected: boolean, isToday: boolean, hasCount: boolean): React.CSSProperties {
  return {
    backgroundColor: isSelected
      ? brandColors.saffron
      : isToday
        ? brandColors.ivory
        : "transparent",
    color: isSelected ? "#fff" : isToday ? brandColors.saffronDark : brandColors.textDark,
    border: isSelected
      ? "none"
      : `1px solid ${hasCount ? brandColors.goldLight : "transparent"}`,
  };
}

export default function AdminCalendar() {
  const router = useRouter();
  const { t } = useT();
  const gate = useRequireSection("appointments");
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    adminGetAppointments(token)
      .then((data) => {
        const filtered = data.filter(
          (a: any) =>
            a.scheduled_date &&
            a.status !== "completed" &&
            a.status !== "cancelled" &&
            a.scheduled_date >= todayStr,
        );
        setAppointments(filtered);
      })
      .catch(() => router.push("/login"));
  }, [router, todayStr]);

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  }

  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function apptCount(day: number) {
    return appointments.filter((a) => a.scheduled_date === dateStr(day)).length;
  }

  const upcoming = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const d = a.scheduled_date.localeCompare(b.scheduled_date);
      if (d !== 0) return d;
      return (a.scheduled_time || "").localeCompare(b.scheduled_time || "");
    });
  }, [appointments]);

  const displayed = selectedDay ? upcoming.filter((a) => a.scheduled_date === selectedDay) : upcoming;

  if (gate !== "allowed") {
    return (
      <Box className="min-h-[calc(100vh-64px)] bg-brand-cream flex items-center justify-center">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-10 px-4">
      <Box className="max-w-[1200px] mx-auto">
        <Typography variant="h4" className="!text-brand-maroon !font-bold !mb-6">
          {t("cal.title")}
        </Typography>

        <Box className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
          {/* ── Side panel: list of upcoming appointments ─────── */}
          <Box className="order-2 md:order-1 flex flex-col gap-4 md:max-h-[calc(100vh-150px)] md:overflow-auto md:pr-2">
            <Typography className="!font-bold !text-brand-maroon !mb-2">
              {selectedDay ? t("cal.onDay", { date: selectedDay }) : t("cal.allScheduled")} (
              {displayed.length})
            </Typography>
            {selectedDay && (
              <Button size="small" onClick={() => setSelectedDay(null)}>
                {t("common.all")}
              </Button>
            )}

            {displayed.length === 0 ? (
              <Paper
                elevation={0}
                className="!p-6 !text-center !rounded-2xl !border !border-dashed !border-brand-sand"
              >
                <Typography color="text.secondary">{t("cal.noToday")}</Typography>
              </Paper>
            ) : (
              displayed.map((a: any) => (
                <Paper
                  key={a.id}
                  elevation={0}
                  className="!p-4 !rounded-2xl !border !border-brand-sand !transition-colors !duration-150 hover:!border-brand-gold-light"
                >
                  <Box className="inline-block px-2 py-0.5 rounded bg-brand-ivory text-brand-saffron-dark text-[0.7rem] font-bold mb-1">
                    {a.scheduled_date === todayStr ? t("cal.today") : a.scheduled_date}
                    {" · "}
                    {formatTime12h(a.scheduled_time)}
                  </Box>
                  <Typography className="!font-bold !break-words">{a.name}</Typography>
                  <Typography variant="caption" color="text.secondary" className="!break-words">
                    {a.email}
                  </Typography>
                  {a.zoom_link && (
                    <Box className="mt-2">
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
          <Paper
            elevation={0}
            className="order-1 md:order-2 !p-4 md:!p-6 !rounded-3xl !border !border-brand-sand !h-fit"
          >
            <Box className="flex items-center justify-between mb-4">
              <IconButton onClick={prevMonth}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography className="!font-bold !text-brand-maroon !text-base md:!text-[1.15rem]">
                {MONTH_NAMES[month]} {year}
              </Typography>
              <IconButton onClick={nextMonth}>
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <Box className="grid grid-cols-7 mb-2 [&>span]:text-center [&>span]:text-[0.65rem] md:[&>span]:text-[0.75rem] [&>span]:font-bold [&>span]:text-brand-text-medium [&>span]:uppercase">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </Box>

            <Box className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) return <Box key={`e-${idx}`} />;
                const ds = dateStr(day);
                const isPast = ds < todayStr;
                const isToday = ds === todayStr;
                const isSelected = ds === selectedDay;
                const count = apptCount(day);

                return (
                  <Box
                    key={ds}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer text-[0.8rem] md:text-[0.9rem] transition-all duration-150 ${
                      isSelected || isToday ? "font-bold" : "font-medium"
                    } ${isPast ? "opacity-35 pointer-events-none" : "opacity-100"} ${
                      isSelected ? "hover:bg-brand-saffron-dark" : "hover:bg-brand-cream"
                    }`}
                    style={dayCellStyle(isSelected, isToday, count > 0)}
                    onClick={() => setSelectedDay(isSelected ? null : ds)}
                  >
                    {day}
                    {count > 0 && (
                      <Box
                        component="span"
                        className={`mt-[3px] inline-block min-w-4 h-4 px-1 leading-4 text-[0.6rem] font-bold rounded-full ${
                          isSelected
                            ? "bg-white text-brand-saffron-dark"
                            : "bg-brand-gold-light text-brand-maroon"
                        }`}
                      >
                        {count}
                      </Box>
                    )}
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
