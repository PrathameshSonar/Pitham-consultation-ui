"use client";

import { Box, Paper, Typography } from "@mui/material";
import Image from "next/image";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

export default function About() {
  const { t } = useT();
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: "background.default",
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: 4,
            mb: 6,
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: { xs: 200, md: 280 },
              height: { xs: 240, md: 340 },
              flexShrink: 0,
            }}
          >
            <Image
              src="/guruji.png"
              alt="Shri Mayuresh Guruji Vispute"
              fill
              style={{ objectFit: "contain" }}
            />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
              {t("about.title")}
            </Typography>
            <Typography sx={{ lineHeight: 2, color: "text.secondary" }}>{t("about.description")}</Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
            {t("about.servicesTitle")}
          </Typography>
          <Box component="ul" sx={{ pl: 3, "& li": { mb: 1, color: "text.secondary" } }}>
            <li>
              <strong>Kundali Reading</strong> — Detailed birth chart analysis
            </li>
            <li>
              <strong>Vastu Consultation</strong> — Home and office energy alignment
            </li>
            <li>
              <strong>Astrology Guidance</strong> — Career, health, relationships
            </li>
            <li>
              <strong>Meditation & Sadhna</strong> — Personalized spiritual practices
            </li>
            <li>
              <strong>Puja & Rituals</strong> — Sacred ceremonies and remedies
            </li>
            <li>
              <strong>Spiritual Counseling</strong> — Life guidance and clarity
            </li>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
