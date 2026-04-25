"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, Typography, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useT } from "@/i18n/I18nProvider";
import { getPublicSettings } from "@/services/api";
import { brandColors } from "@/theme/colors";

export default function Footer() {
  const { t } = useT();
  const [s, setS] = useState<any>({});

  useEffect(() => {
    getPublicSettings()
      .then(setS)
      .catch(() => {});
  }, []);

  const socials = [
    { key: "social_facebook", icon: <FacebookIcon />, url: s.social_facebook },
    { key: "social_instagram", icon: <span style={{ fontWeight: 700 }}>IG</span>, url: s.social_instagram },
    { key: "social_youtube", icon: <YouTubeIcon />, url: s.social_youtube },
    { key: "social_twitter", icon: <span style={{ fontWeight: 700 }}>X</span>, url: s.social_twitter },
  ].filter((x) => x.url);

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/pitham", label: t("nav.pitham") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/faq", label: t("nav.faq") },
    { href: "/register", label: t("common.register") },
  ];

  const legalLinks = [
    { href: "/terms", label: t("terms.title") },
    { href: "/privacy", label: t("privacy.title") },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: brandColors.maroon,
        color: "rgba(255,255,255,0.8)",
        // Tighter padding on mobile so the footer doesn't take half the screen
        py: { xs: 2.5, md: 4 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 2, md: 4 },
          alignItems: { md: "flex-start" },
        }}
      >
        {/* Brand */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 0.5, md: 1 } }}>
            <Image
              src="/spbsp-logo.png"
              alt={t("brand.name")}
              width={40}
              height={40}
              style={{ width: "auto", height: "auto", maxHeight: 48 }}
            />
            <Typography
              sx={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: { xs: "0.95rem", md: "1.1rem" },
                color: "#fff",
                lineHeight: 1.2,
              }}
            >
              {t("brand.name")}
            </Typography>
          </Box>
          {/* Tagline only on desktop — wastes vertical space on phones */}
          <Typography
            variant="body2"
            sx={{ opacity: 0.7, maxWidth: 320, display: { xs: "none", md: "block" } }}
          >
            Spiritual guidance by Shri Mayuresh Guruji Vispute
          </Typography>
        </Box>

        {/* Links — inline row on mobile, two stacked columns on desktop */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "row", md: "row" },
            flexWrap: "wrap",
            gap: { xs: 1.25, md: 4 },
            rowGap: { xs: 0.5, md: 1 },
          }}
        >
          {/* Quick Links — render as a single inline row on mobile, vertical column on desktop */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="caption" sx={{ opacity: 0.5, display: "block", mb: 1 }}>
              Quick Links
            </Typography>
            {quickLinks.map((l) => (
              <Box
                key={l.href}
                component={Link}
                href={l.href}
                sx={{
                  display: "block",
                  color: "rgba(255,255,255,0.8)",
                  mb: 0.5,
                  fontSize: "0.85rem",
                  "&:hover": { color: "#fff" },
                }}
              >
                {l.label}
              </Box>
            ))}
          </Box>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Typography variant="caption" sx={{ opacity: 0.5, display: "block", mb: 1 }}>
              Legal
            </Typography>
            {legalLinks.map((l) => (
              <Box
                key={l.href}
                component={Link}
                href={l.href}
                sx={{
                  display: "block",
                  color: "rgba(255,255,255,0.8)",
                  mb: 0.5,
                  fontSize: "0.85rem",
                  "&:hover": { color: "#fff" },
                }}
              >
                {l.label}
              </Box>
            ))}
          </Box>

          {/* Mobile-only condensed link strip — single wrapping row, dot separators */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              flexWrap: "wrap",
              alignItems: "center",
              columnGap: 1.25,
              rowGap: 0.5,
              fontSize: "0.8rem",
            }}
          >
            {[...quickLinks, ...legalLinks].map((l, i, arr) => (
              <Box key={l.href} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                <Box
                  component={Link}
                  href={l.href}
                  sx={{
                    color: "rgba(255,255,255,0.85)",
                    "&:hover": { color: "#fff" },
                  }}
                >
                  {l.label}
                </Box>
                {i < arr.length - 1 && (
                  <Box sx={{ opacity: 0.4 }}>·</Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Social + Contact */}
        <Box>
          {socials.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, mt: { xs: 0.5, md: 0 } }}>
              {socials.map((s) => (
                <IconButton
                  key={s.key}
                  component="a"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" }, p: { xs: 0.5, md: 1 } }}
                  size="small"
                >
                  {s.icon}
                </IconButton>
              ))}
            </Box>
          )}
          {/* Contact details only on desktop — already covered by Contact page link on mobile */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            {s.contact_email && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {s.contact_email}
              </Typography>
            )}
            {s.contact_phone && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {s.contact_phone}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Compact copyright on mobile, full text on desktop */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          mt: { xs: 1.5, md: 3 },
          opacity: 0.4,
          fontSize: { xs: "0.7rem", md: "0.75rem" },
        }}
      >
        &copy; {new Date().getFullYear()} {t("brand.name")}
      </Typography>
    </Box>
  );
}
