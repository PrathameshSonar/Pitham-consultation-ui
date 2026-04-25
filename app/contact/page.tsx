"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Button, Stack, IconButton } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { getPublicSettings } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";
import { normalizeMapUrl } from "@/lib/mapUrl";

export default function Contact() {
  const { t } = useT();
  const [s, setS] = useState<any>({});

  useEffect(() => {
    getPublicSettings()
      .then(setS)
      .catch(() => {});
  }, []);

  const contactItems = [
    { icon: <EmailIcon />, label: t("common.email"), value: s.contact_email },
    { icon: <PhoneIcon />, label: t("common.mobile"), value: s.contact_phone },
    { icon: <LocationOnIcon />, label: t("contact.address"), value: s.contact_address },
  ].filter((i) => i.value);

  const socials = [
    { icon: <FacebookIcon />, label: "Facebook", url: s.social_facebook },
    {
      icon: <span style={{ fontWeight: 700, fontSize: "1.2rem" }}>IG</span>,
      label: "Instagram",
      url: s.social_instagram,
    },
    { icon: <YouTubeIcon />, label: "YouTube", url: s.social_youtube },
    {
      icon: <span style={{ fontWeight: 700, fontSize: "1.2rem" }}>X</span>,
      label: "Twitter / X",
      url: s.social_twitter,
    },
  ].filter((x) => x.url);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: "background.default",
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1, textAlign: "center" }}
        >
          {t("contact.title")}
        </Typography>
        <Typography sx={{ textAlign: "center", color: "text.secondary", mb: 4 }}>
          {t("contact.subtitle")}
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
          {/* Contact Info */}
          <Paper
            elevation={0}
            sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}
          >
            {contactItems.length === 0 ? (
              <Typography color="text.secondary">{t("contact.noInfo")}</Typography>
            ) : (
              <Stack spacing={3}>
                {contactItems.map((item, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        color: brandColors.saffron,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: `${brandColors.saffron}15`,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>{item.value}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}

            {/* WhatsApp CTA */}
            {s.social_whatsapp && (
              <Button
                component="a"
                href={`https://wa.me/${s.social_whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                variant="contained"
                color="success"
                fullWidth
                sx={{ mt: 3 }}
              >
                {t("contact.whatsapp")}
              </Button>
            )}

            {/* Social Links */}
            {socials.length > 0 && (
              <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  {t("settings.socialLinks")}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {socials.map((social, i) => (
                    <Button
                      key={i}
                      component="a"
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={social.icon}
                    >
                      {social.label}
                    </Button>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          {/* Google Map */}
          {(() => {
            const norm = normalizeMapUrl(s.contact_map_url);
            return norm.embeddable;
          })() ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                border: `1px solid ${brandColors.sand}`,
                minHeight: 300,
              }}
            >
              <iframe
                src={normalizeMapUrl(s.contact_map_url).url}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 400 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location"
              />
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                border: `1px solid ${brandColors.sand}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                <LocationOnIcon sx={{ fontSize: 48, opacity: 0.3, display: "block", mx: "auto", mb: 1 }} />
                {t("contact.mapPlaceholder")}
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
