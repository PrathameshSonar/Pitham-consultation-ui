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
import * as s from "./styles";

const STATS = [
  { value: "27,693+", label: "landing.stat.kundli" },
  { value: "60+", label: "landing.stat.partners" },
  { value: "15+", label: "landing.stat.years" },
  { value: "10+", label: "landing.stat.countries" },
];

const SERVICES = [
  { icon: <AutoStoriesIcon sx={{ fontSize: 48, color: brandColors.saffron }} />, key: "landing.svc.kundali" },
  { icon: <HomeWorkIcon sx={{ fontSize: 48, color: brandColors.saffron }} />, key: "landing.svc.vastu" },
  { icon: <StarIcon sx={{ fontSize: 48, color: brandColors.saffron }} />, key: "landing.svc.astro" },
  { icon: <SelfImprovementIcon sx={{ fontSize: 48, color: brandColors.saffron }} />, key: "landing.svc.meditation" },
  { icon: <VolunteerActivismIcon sx={{ fontSize: 48, color: brandColors.saffron }} />, key: "landing.svc.puja" },
  { icon: <PsychologyIcon sx={{ fontSize: 48, color: brandColors.saffron }} />, key: "landing.svc.counseling" },
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
      <Box sx={s.heroWrap}>
        <Box sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 4, md: 6 },
          maxWidth: 1100,
          mx: "auto",
          width: "100%",
        }}>
          {/* Text side */}
          <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
            <Typography variant="h1" sx={s.heroTitle}>
              {t("landing.hero.line1")}
              <Box component="span" sx={{ display: "block", color: "primary.main" }}>
                {t("landing.hero.line2")}
              </Box>
            </Typography>
            <Typography sx={s.heroSubtitle}>
              {t("landing.hero.subtitle")}
            </Typography>
            <Box sx={{ ...s.ctaRow, justifyContent: { xs: "center", md: "flex-start" } }}>
              <Button component={Link}
                href={loggedIn ? "/dashboard/book-appointment" : "/register"}
                variant="contained" size="large" color="primary">
                {t("landing.cta.book")}
              </Button>
              {loggedIn ? (
                <Button component={Link}
                  href={isAdmin ? "/admin" : "/dashboard"}
                  variant="outlined" size="large" color="primary">
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
          <Box sx={{
            flex: "0 0 auto",
            position: "relative",
            width: { xs: 220, sm: 280, md: 340 },
            height: { xs: 260, sm: 330, md: 400 },
          }}>
            <Box sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              background: `radial-gradient(circle at 50% 40%, ${brandColors.saffronLight}30, ${brandColors.gold}20, transparent 70%)`,
            }} />
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
      <Box sx={{
        py: 6, px: 2,
        background: `linear-gradient(135deg, ${brandColors.maroon} 0%, ${brandColors.saffronDark} 100%)`,
      }}>
        <Box sx={{
          maxWidth: 1100, mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: { xs: 2, md: 4 }, textAlign: "center",
        }}>
          {STATS.map(s => (
            <Box key={s.label}>
              <Typography sx={{ color: "#fff", fontWeight: 800, mb: 0.5, fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" } }}>
                {s.value}
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 500, fontSize: { xs: "0.8rem", md: "1rem" } }}>
                {t(s.label as any)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Services ── */}
      <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 4 }, bgcolor: "background.paper", borderTop: `1px solid ${brandColors.sand}` }}>
        <Typography sx={{ textAlign: "center", color: brandColors.maroon, mb: 1, fontWeight: 700, fontSize: { xs: "1.5rem", md: "2.5rem" } }}>
          {t("landing.services.title")}
        </Typography>
        <Typography sx={{ textAlign: "center", color: brandColors.textMedium, mb: { xs: 3, md: 6 }, fontSize: { xs: "0.85rem", md: "1.1rem" } }}>
          {t("landing.services.subtitle")}
        </Typography>
        <Box sx={{
          maxWidth: 1100, mx: "auto",
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
          gap: { xs: 1.5, md: 3 },
        }}>
          {SERVICES.map(svc => (
            <Paper key={svc.key} elevation={0} sx={{
              p: { xs: 2.5, md: 4 }, textAlign: "center", borderRadius: 4,
              border: `1px solid ${brandColors.sand}`,
              transition: "all 0.3s",
              "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 30px rgba(230,81,0,0.12)" },
            }}>
              {svc.icon}
              <Typography variant="h6" sx={{ mt: 2, fontWeight: 700, color: brandColors.maroon }}>
                {t(svc.key as any)}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* ── Features ── */}
      <Box sx={s.featuresWrap}>
        <Box sx={s.featuresGrid}>
          {FEATURES.map(f => (
            <Box key={f.title} sx={s.featureCard}>
              <Typography sx={s.featureIcon}>{f.icon}</Typography>
              <Typography variant="h5" sx={s.featureTitle}>{f.title}</Typography>
              <Typography sx={s.featureDesc}>{f.desc}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── CTA Band ── */}
      <Box sx={s.ctaBand}>
        <Typography variant="h4" sx={s.ctaBandTitle}>{t("landing.band.title")}</Typography>
        <Typography sx={{ mb: 4, opacity: 0.95 }}>
          {t("landing.band.desc")}
        </Typography>
        <Button
          component={Link}
          href={loggedIn ? "/dashboard/book-appointment" : "/register"}
          variant="contained"
          size="large"
          sx={{ bgcolor: "#fff", color: "primary.main", "&:hover": { bgcolor: "background.paper" } }}
        >
          {loggedIn ? t("landing.cta.book") : t("landing.band.cta")}
        </Button>
      </Box>

    </>
  );
}
