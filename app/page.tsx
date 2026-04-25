"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, Button, Typography, Paper } from "@mui/material";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import StarIcon from "@mui/icons-material/Star";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { useT } from "@/i18n/I18nProvider";
import { getToken, getRole } from "@/services/api";
import { brandColors } from "@/theme/colors";

const STATS = [
  { value: "27,693+", label: "landing.stat.kundli" },
  { value: "60+", label: "landing.stat.partners" },
  { value: "15+", label: "landing.stat.years" },
  { value: "10+", label: "landing.stat.countries" },
];

const SERVICE_ICON_CLASS = "!text-[48px] !text-brand-saffron";

const SERVICES = [
  { icon: <AutoStoriesIcon className={SERVICE_ICON_CLASS} />, key: "landing.svc.kundali" },
  { icon: <HomeWorkIcon className={SERVICE_ICON_CLASS} />, key: "landing.svc.vastu" },
  { icon: <StarIcon className={SERVICE_ICON_CLASS} />, key: "landing.svc.astro" },
  { icon: <SelfImprovementIcon className={SERVICE_ICON_CLASS} />, key: "landing.svc.meditation" },
  { icon: <VolunteerActivismIcon className={SERVICE_ICON_CLASS} />, key: "landing.svc.puja" },
  { icon: <PsychologyIcon className={SERVICE_ICON_CLASS} />, key: "landing.svc.counseling" },
];

export default function Home() {
  const { t } = useT();
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setLoggedIn(true);
      const role = getRole();
      setIsAdmin(role === "admin" || role === "moderator");
    }
  }, []);

  const FEATURES = [
    { icon: "🪔", title: t("landing.feat1.title"), desc: t("landing.feat1.desc") },
    { icon: "📜", title: t("landing.feat2.title"), desc: t("landing.feat2.desc") },
    { icon: "💬", title: t("landing.feat3.title"), desc: t("landing.feat3.desc") },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <Box className="md:min-h-[calc(100vh-64px)] bg-brand-cream flex items-center justify-center px-4 md:px-8 py-12 md:py-16">
        <Box className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 max-w-[1100px] mx-auto w-full">
          {/* Text side */}
          <Box className="flex-1 text-center md:text-left">
            <Typography
              variant="h1"
              className="!text-[1.6rem] sm:!text-[2rem] md:!text-[3.2rem] !text-brand-maroon !mb-6 !leading-[1.2] break-words"
            >
              {t("landing.hero.line1")}
              <Box component="span" className="block !text-brand-saffron">
                {t("landing.hero.line2")}
              </Box>
            </Typography>
            <Typography className="!text-brand-text-medium !text-[0.9rem] md:!text-[1.15rem] !mb-6 md:!mb-10 !leading-[1.8] !italic">
              {t("landing.hero.subtitle")}
            </Typography>
            <Box className="flex gap-4 flex-wrap justify-center md:justify-start">
              <Button
                component={Link}
                href={loggedIn ? "/dashboard/book-appointment" : "/register"}
                variant="contained"
                size="large"
                color="primary"
              >
                {t("landing.cta.book")}
              </Button>
              {loggedIn ? (
                <Button
                  component={Link}
                  href={isAdmin ? "/admin" : "/dashboard"}
                  variant="outlined"
                  size="large"
                  color="primary"
                >
                  {t("nav.dashboard")}
                </Button>
              ) : (
                <Button component={Link} href="/login" variant="outlined" size="large" color="primary">
                  {t("landing.cta.signIn")}
                </Button>
              )}
            </Box>
          </Box>

          {/* Guruji image */}
          <Box className="flex-none relative w-[220px] sm:w-[280px] md:w-[340px] h-[260px] sm:h-[330px] md:h-[400px]">
            <Box
              className="absolute inset-0 rounded-[50%_50%_50%_50%/60%_60%_40%_40%]"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${brandColors.saffronLight}30, ${brandColors.gold}20, transparent 70%)`,
              }}
            />
            <Image
              src="/guruji.png"
              alt="Shri Mayuresh Guruji Vispute"
              fill
              style={{ objectFit: "contain", objectPosition: "bottom" }}
              priority
            />
          </Box>
        </Box>
      </Box>

      {/* ── Stats counters ── */}
      <Box
        className="py-12 px-4"
        style={{
          background: `linear-gradient(135deg, ${brandColors.maroon} 0%, ${brandColors.saffronDark} 100%)`,
        }}
      >
        <Box className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-center">
          {STATS.map((stat) => (
            <Box key={stat.label}>
              <Typography className="!text-white !font-extrabold !mb-1 !text-[1.5rem] sm:!text-[2rem] md:!text-[2.5rem]">
                {stat.value}
              </Typography>
              <Typography className="!text-white/85 !font-medium !text-[0.8rem] md:!text-base">
                {t(stat.label as any)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Services ── */}
      <Box className="py-12 md:py-20 px-4 md:px-8 bg-brand-ivory border-t border-brand-sand">
        <Typography className="!text-center !text-brand-maroon !mb-2 !font-bold !text-[1.5rem] md:!text-[2.5rem]">
          {t("landing.services.title")}
        </Typography>
        <Typography className="!text-center !text-brand-text-medium !mb-6 md:!mb-12 !text-[0.85rem] md:!text-[1.1rem]">
          {t("landing.services.subtitle")}
        </Typography>
        <Box className="max-w-[1100px] mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-6">
          {SERVICES.map((svc) => (
            <Paper
              key={svc.key}
              elevation={0}
              className="!p-5 md:!p-8 !text-center !rounded-3xl !border !border-brand-sand !transition-all !duration-300 hover:!-translate-y-1 hover:!shadow-[0_12px_30px_rgba(230,81,0,0.12)]"
            >
              {svc.icon}
              <Typography variant="h6" className="!mt-4 !font-bold !text-brand-maroon">
                {t(svc.key as any)}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* ── Features ── */}
      <Box className="bg-brand-ivory py-12 md:py-20 px-4 md:px-8 border-t border-brand-sand">
        <Box className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {FEATURES.map((f) => (
            <Box
              key={f.title}
              className="p-6 md:p-8 text-center bg-brand-ivory border border-brand-sand rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(230,81,0,0.15)] hover:border-brand-saffron-light"
            >
              <Typography className="!text-[2.5rem] md:!text-[3rem] !mb-4">{f.icon}</Typography>
              <Typography
                variant="h5"
                className="!text-brand-maroon !mb-3 !font-bold !text-[1.1rem] md:!text-[1.25rem]"
              >
                {f.title}
              </Typography>
              <Typography className="!text-brand-text-medium !leading-[1.8] !text-[0.85rem] md:!text-[0.95rem]">
                {f.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── CTA Band ── */}
      <Box
        className="py-10 md:py-16 px-4 md:px-8 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${brandColors.saffronDark} 0%, ${brandColors.saffron} 100%)`,
        }}
      >
        <Typography variant="h4" className="!mb-4 !font-semibold !text-[1.4rem] md:!text-[2.125rem]">
          {t("landing.band.title")}
        </Typography>
        <Typography className="!mb-8 !opacity-95">{t("landing.band.desc")}</Typography>
        <Button
          component={Link}
          href={loggedIn ? "/dashboard/book-appointment" : "/register"}
          variant="contained"
          size="large"
          className="!bg-white !text-brand-saffron hover:!bg-brand-ivory"
        >
          {loggedIn ? t("landing.cta.book") : t("landing.band.cta")}
        </Button>
      </Box>
    </>
  );
}
