"use client";

import { Box, Paper, Typography } from "@mui/material";
import Image from "next/image";
import { useT } from "@/i18n/I18nProvider";

export default function About() {
  const { t } = useT();
  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-16 px-4 md:px-8">
      <Box className="max-w-[900px] mx-auto">
        <Box className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <Box className="relative w-[200px] md:w-[280px] h-[240px] md:h-[340px] shrink-0">
            <Image
              src="/guruji.png"
              alt="Shri Mayuresh Guruji Vispute"
              fill
              style={{ objectFit: "contain" }}
            />
          </Box>
          <Box>
            <Typography variant="h3" className="!font-bold !text-brand-maroon !mb-4">
              {t("about.title")}
            </Typography>
            <Typography className="!leading-[2] !text-brand-text-medium">
              {t("about.description")}
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          className="!p-6 md:!p-10 !rounded-3xl !border !border-brand-sand"
        >
          <Typography variant="h5" className="!font-bold !text-brand-maroon !mb-4">
            {t("about.servicesTitle")}
          </Typography>
          <Box
            component="ul"
            className="pl-6 [&_li]:mb-2 [&_li]:text-brand-text-medium"
          >
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
