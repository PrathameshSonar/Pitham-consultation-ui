"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box, Paper, Typography, Button, Stack, Chip, CircularProgress, Alert, Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { getPublicEvent, fileUrl, type EventItem } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

function formatEventDate(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return iso; }
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useT();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    getPublicEvent(id)
      .then(setEvent)
      .catch((err) => setError(err?.detail || t("pitham.event.notFound")))
      .finally(() => setLoading(false));
  }, [params?.id, t]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box sx={{ minHeight: "calc(100vh - 64px)", py: 8, px: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, maxWidth: 480, textAlign: "center", border: `1px solid ${brandColors.sand}` }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error || t("pitham.event.notFound")}
          </Alert>
          <Button component={Link} href="/pitham" startIcon={<ArrowBackIcon />} variant="outlined">
            {t("pitham.event.back")}
          </Button>
        </Paper>
      </Box>
    );
  }

  const img = event.image_url
    ? (event.image_url.startsWith("http") ? event.image_url : fileUrl(event.image_url))
    : null;

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", bgcolor: "background.default" }}>
      {/* Back nav */}
      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, pt: { xs: 2, md: 3 } }}>
        <Button
          component={Link}
          href="/pitham"
          startIcon={<ArrowBackIcon />}
          sx={{ color: brandColors.maroon, fontWeight: 600 }}
        >
          {t("pitham.event.back")}
        </Button>
      </Box>

      {/* Hero image */}
      {img && (
        <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 4 }, mt: { xs: 2, md: 3 } }}>
          <Box sx={{
            borderRadius: 4, overflow: "hidden",
            aspectRatio: { xs: "16/10", md: "21/9" },
            maxHeight: 460,
            position: "relative",
            border: `1px solid ${brandColors.sand}`,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {event.is_featured && (
              <Chip
                icon={<StarIcon />}
                label={t("events.featuredBadge")}
                sx={{
                  position: "absolute", top: 16, left: 16,
                  bgcolor: brandColors.gold, color: "#fff", fontWeight: 700,
                }}
              />
            )}
          </Box>
        </Box>
      )}

      {/* Content */}
      <Box sx={{ maxWidth: 900, mx: "auto", py: { xs: 4, md: 6 }, px: { xs: 2, md: 4 } }}>
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              color: brandColors.maroon,
              fontSize: { xs: "1.6rem", md: "2.2rem" },
              lineHeight: 1.25,
              mb: 2.5,
            }}
          >
            {event.title}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 3 }}>
            <Chip
              icon={<CalendarMonthIcon />}
              label={formatEventDate(event.event_date, lang)}
              color="primary"
              sx={{ fontWeight: 600, py: 2.5 }}
            />
            {event.event_time && (
              <Chip icon={<AccessTimeIcon />} label={event.event_time} variant="outlined" sx={{ py: 2.5 }} />
            )}
            {event.location && (
              <Chip icon={<LocationOnIcon />} label={event.location} variant="outlined" sx={{ py: 2.5 }} />
            )}
          </Stack>

          {event.description && (
            <Typography sx={{
              color: "text.secondary",
              lineHeight: 1.9,
              fontSize: "1.05rem",
              whiteSpace: "pre-wrap",
              mb: 4,
            }}>
              {event.description}
            </Typography>
          )}

          <Box sx={{
            mt: 4, pt: 3, borderTop: `1px solid ${brandColors.sand}`,
            display: "flex", flexWrap: "wrap", gap: 2,
          }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<HowToRegIcon />}
              onClick={() => setSnack(t("pitham.event.regSoon"))}
              sx={{
                bgcolor: brandColors.gold,
                color: "#fff",
                fontWeight: 700,
                px: 4,
                "&:hover": { bgcolor: brandColors.maroon },
              }}
            >
              {t("pitham.event.register")}
            </Button>
            <Button
              component={Link}
              href="/pitham"
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
            >
              {t("pitham.event.back")}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity="info" onClose={() => setSnack(null)} sx={{ width: "100%" }}>
            {snack}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
