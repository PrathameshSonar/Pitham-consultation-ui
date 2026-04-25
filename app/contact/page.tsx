"use client";

import { useEffect, useState } from "react";
import { Box, Paper, Typography, Button, Stack } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FacebookIcon from "@mui/icons-material/Facebook";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { getPublicSettings } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
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
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-16 px-4 md:px-8">
      <Box className="max-w-[800px] mx-auto">
        <Typography
          variant="h3"
          className="!font-bold !text-brand-maroon !mb-2 !text-center"
        >
          {t("contact.title")}
        </Typography>
        <Typography className="!text-center !text-brand-text-medium !mb-8">
          {t("contact.subtitle")}
        </Typography>

        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <Paper
            elevation={0}
            className="!p-6 md:!p-8 !rounded-3xl !border !border-brand-sand"
          >
            {contactItems.length === 0 ? (
              <Typography color="text.secondary">{t("contact.noInfo")}</Typography>
            ) : (
              <Stack spacing={3}>
                {contactItems.map((item, i) => (
                  <Box key={i} className="flex items-center gap-4">
                    <Box className="text-brand-saffron p-3 rounded-2xl bg-brand-saffron/10">
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography className="!font-semibold">{item.value}</Typography>
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
                className="!mt-6"
              >
                {t("contact.whatsapp")}
              </Button>
            )}

            {/* Social Links */}
            {socials.length > 0 && (
              <Box className="mt-6 pt-4 border-t border-[#E8D9BF]">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="!block !mb-2"
                >
                  {t("settings.socialLinks")}
                </Typography>
                <Box className="flex gap-2">
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
              className="!rounded-3xl !overflow-hidden !border !border-brand-sand !min-h-[300px]"
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
              className="!p-8 !rounded-3xl !border !border-brand-sand !flex !items-center !justify-center"
            >
              <Typography color="text.secondary" className="!text-center">
                <LocationOnIcon className="!text-[48px] !opacity-30 !block !mx-auto !mb-2" />
                {t("contact.mapPlaceholder")}
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
