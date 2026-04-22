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
    getPublicSettings().then(setS).catch(() => {});
  }, []);

  const socials = [
    { key: "social_facebook", icon: <FacebookIcon />, url: s.social_facebook },
    { key: "social_instagram", icon: <span style={{ fontWeight: 700 }}>IG</span>, url: s.social_instagram },
    { key: "social_youtube", icon: <YouTubeIcon />, url: s.social_youtube },
    { key: "social_twitter", icon: <span style={{ fontWeight: 700 }}>X</span>, url: s.social_twitter },
  ].filter(x => x.url);

  return (
    <Box component="footer" sx={{
      bgcolor: brandColors.maroon, color: "rgba(255,255,255,0.8)",
      py: 4, px: { xs: 2, md: 4 },
    }}>
      <Box sx={{ maxWidth: 1100, mx: "auto", display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4, alignItems: { md: "flex-start" } }}>
        {/* Brand */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Image src="/spbsp-logo.png" alt={t("brand.name")} width={48} height={48} />
            <Typography sx={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: "1.1rem", color: "#fff", lineHeight: 1.2 }}>
              {t("brand.name")}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.7, maxWidth: 320 }}>
            Spiritual guidance by Shri Mayuresh Guruji Vispute
          </Typography>
        </Box>

        {/* Links */}
        <Box sx={{ display: "flex", gap: { xs: 2, md: 4 }, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.5, display: "block", mb: 1 }}>Quick Links</Typography>
            {[
              { href: "/", label: "Home" },
              { href: "/pitham", label: t("nav.pitham") },
              { href: "/about", label: t("nav.about") },
              { href: "/contact", label: t("nav.contact") },
              { href: "/register", label: t("common.register") },
            ].map(l => (
              <Box key={l.href} component={Link} href={l.href}
                sx={{ display: "block", color: "rgba(255,255,255,0.8)", mb: 0.5, fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>
                {l.label}
              </Box>
            ))}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.5, display: "block", mb: 1 }}>Legal</Typography>
            {[
              { href: "/terms", label: t("terms.title") },
              { href: "/privacy", label: t("privacy.title") },
            ].map(l => (
              <Box key={l.href} component={Link} href={l.href}
                sx={{ display: "block", color: "rgba(255,255,255,0.8)", mb: 0.5, fontSize: "0.85rem", "&:hover": { color: "#fff" } }}>
                {l.label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Social + Contact */}
        <Box>
          {socials.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, mb: 1 }}>
              {socials.map(s => (
                <IconButton key={s.key} component="a" href={s.url} target="_blank" rel="noreferrer"
                  sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "#fff" } }} size="small">
                  {s.icon}
                </IconButton>
              ))}
            </Box>
          )}
          {s.contact_email && (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>{s.contact_email}</Typography>
          )}
          {s.contact_phone && (
            <Typography variant="body2" sx={{ opacity: 0.7 }}>{s.contact_phone}</Typography>
          )}
        </Box>
      </Box>

      <Typography variant="caption" sx={{ display: "block", textAlign: "center", mt: 3, opacity: 0.4 }}>
        &copy; {new Date().getFullYear()} {t("brand.name")}. All rights reserved.
      </Typography>
    </Box>
  );
}
