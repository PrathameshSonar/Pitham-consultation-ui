"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import { getPublicEvent, fileUrl, type EventItem } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";

function formatEventDate(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
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
      <Box className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box className="min-h-[calc(100vh-64px)] py-16 px-4 flex items-center justify-center">
        <Paper
          elevation={0}
          className="!p-8 !rounded-3xl !max-w-[480px] !text-center !border !border-brand-sand"
        >
          <Alert severity="warning" className="!mb-6">
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
    ? event.image_url.startsWith("http")
      ? event.image_url
      : fileUrl(event.image_url)
    : null;

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream">
      {/* Back nav */}
      <Box className="max-w-[1100px] mx-auto px-4 md:px-8 pt-4 md:pt-6">
        <Button
          component={Link}
          href="/pitham"
          startIcon={<ArrowBackIcon />}
          className="!text-brand-maroon !font-semibold"
        >
          {t("pitham.event.back")}
        </Button>
      </Box>

      {/* Hero image */}
      {img && (
        <Box className="max-w-[1100px] mx-auto px-4 md:px-8 mt-4 md:mt-6">
          <Box className="rounded-3xl overflow-hidden aspect-[16/10] md:aspect-[21/9] max-h-[460px] relative border border-brand-sand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={event.title}
              decoding="async"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {event.is_featured && (
              <Chip
                icon={<StarIcon />}
                label={t("events.featuredBadge")}
                className="!absolute !top-4 !left-4 !bg-brand-gold !text-white !font-bold"
              />
            )}
          </Box>
        </Box>
      )}

      {/* Content */}
      <Box className="max-w-[900px] mx-auto py-8 md:py-12 px-4 md:px-8">
        <Paper
          elevation={0}
          className="!p-6 md:!p-10 !rounded-3xl !border !border-brand-sand"
        >
          <Typography
            variant="h3"
            className="!font-['Cinzel',serif] !font-bold !text-brand-maroon !text-[1.6rem] md:!text-[2.2rem] !leading-[1.25] !mb-5"
          >
            {event.title}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap className="!flex-wrap !mb-6">
            <Chip
              icon={<CalendarMonthIcon />}
              label={formatEventDate(event.event_date, lang)}
              color="primary"
              className="!font-semibold !py-5"
            />
            {event.event_time && (
              <Chip
                icon={<AccessTimeIcon />}
                label={event.event_time}
                variant="outlined"
                className="!py-5"
              />
            )}
            {event.location &&
              (event.location_map_url ? (
                <Chip
                  component="a"
                  href={event.location_map_url}
                  target="_blank"
                  rel="noreferrer"
                  clickable
                  icon={<LocationOnIcon />}
                  label={event.location}
                  variant="outlined"
                  className="!py-5"
                />
              ) : (
                <Chip
                  icon={<LocationOnIcon />}
                  label={event.location}
                  variant="outlined"
                  className="!py-5"
                />
              ))}
          </Stack>

          {event.description && (
            <Typography className="!text-brand-text-medium !leading-[1.9] !text-[1.05rem] !whitespace-pre-wrap !mb-8">
              {event.description}
            </Typography>
          )}

          <Box className="mt-8 pt-6 border-t border-brand-sand flex flex-wrap gap-4">
            <Button
              variant="contained"
              size="large"
              startIcon={<HowToRegIcon />}
              onClick={() => setSnack(t("pitham.event.regSoon"))}
              className="!bg-brand-gold !text-white !font-bold !px-8 hover:!bg-brand-maroon"
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
          <Alert severity="info" onClose={() => setSnack(null)} className="!w-full">
            {snack}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
