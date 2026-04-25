"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import StarIcon from "@mui/icons-material/Star";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  getPublicEvents,
  getPublicSettings,
  getPithamCms,
  fileUrl,
  type EventItem,
  type PithamCmsBundle,
  type PithamMediaItem,
  type TestimonialItem,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";
import { normalizeMapUrl } from "@/lib/mapUrl";

function formatEventDate(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&?\/\s]+)/);
  return m ? m[1] : null;
}

function instagramEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  // Strip query/fragment, ensure trailing slash, append /embed
  const m = url.match(/(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[^/?#]+)/);
  if (!m) return null;
  return `${m[1]}/embed`;
}

export default function PithamPage() {
  const { t, lang } = useT();
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [settings, setSettings] = useState<any>({});
  const [cms, setCms] = useState<PithamCmsBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPublicEvents("upcoming", 12).catch(() => []),
      getPublicSettings().catch(() => ({})),
      getPithamCms().catch(() => null),
    ])
      .then(([ev, st, c]) => {
        setEvents(ev as EventItem[]);
        setSettings(st);
        setCms(c as PithamCmsBundle | null);
      })
      .finally(() => setLoading(false));
  }, []);

  const featuredEvents = cms?.featured_events ?? [];
  const otherUpcoming = useMemo(
    () => (events ?? []).filter((e) => !featuredEvents.some((f) => f.id === e.id)),
    [events, featuredEvents],
  );
  const banners = cms?.banners ?? [];
  const testimonials = cms?.testimonials ?? [];
  const videos = cms?.videos ?? [];
  const instagram = cms?.instagram ?? [];
  const gallery = cms?.gallery ?? [];
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream">
      <HeaderBand t={t} />
      <BannerCarousel banners={banners} />

      <Box className="max-w-[1100px] mx-auto py-8 md:py-12 px-4 md:px-8">
        {/* About + Deity */}
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-12">
          <Paper
            elevation={0}
            className="!p-6 md:!p-8 !rounded-3xl !border !border-brand-sand"
          >
            <Typography variant="h5" className="!font-bold !text-brand-maroon !mb-4">
              {t("pitham.about.title")}
            </Typography>
            <Typography className="!leading-[1.9] !text-brand-text-medium">
              {t("pitham.about.body")}
            </Typography>
          </Paper>
          <Paper
            elevation={0}
            className="!p-6 md:!p-8 !rounded-3xl !border !border-brand-sand"
          >
            <Typography variant="h5" className="!font-bold !text-brand-maroon !mb-4">
              {t("pitham.deity.title")}
            </Typography>
            <Typography className="!leading-[1.9] !text-brand-text-medium">
              {t("pitham.deity.body")}
            </Typography>
          </Paper>
        </Box>

        {/* Featured events */}
        {featuredEvents.length > 0 && (
          <Box className="mb-12">
            <Box className="flex items-center gap-3 mb-6">
              <StarIcon className="!text-brand-gold !text-[2rem]" />
              <Typography variant="h4" className="!font-bold !text-brand-maroon">
                {t("pitham.featured.title")}
              </Typography>
            </Box>
            <Box
              className={`grid grid-cols-1 ${featuredEvents.length === 1 ? "md:grid-cols-1" : "md:grid-cols-2"} gap-6`}
            >
              {featuredEvents.map((ev) => (
                <FeaturedEventCard key={ev.id} ev={ev} lang={lang} t={t} />
              ))}
            </Box>
          </Box>
        )}

        {/* Upcoming events */}
        <Box className="mb-12">
          <Box className="flex items-center gap-3 mb-6">
            <EventNoteIcon className="!text-brand-saffron !text-[2rem]" />
            <Typography variant="h4" className="!font-bold !text-brand-maroon">
              {t("pitham.events.title")}
            </Typography>
          </Box>

          {loading ? (
            <Box className="text-center py-12">
              <CircularProgress />
            </Box>
          ) : otherUpcoming.length > 0 ? (
            <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otherUpcoming.map((ev) => (
                <EventCard key={ev.id} ev={ev} lang={lang} t={t} />
              ))}
            </Box>
          ) : featuredEvents.length === 0 ? (
            <Paper
              elevation={0}
              className="!p-10 !rounded-3xl !border !border-dashed !border-brand-sand !text-center"
            >
              <EventNoteIcon className="!text-[56px] !text-brand-sand !mb-2" />
              <Typography color="text.secondary">{t("pitham.events.empty")}</Typography>
            </Paper>
          ) : null}
        </Box>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <Box className="mb-12">
            <Box className="flex items-center gap-3 mb-6">
              <FormatQuoteIcon className="!text-brand-maroon !text-[2rem]" />
              <Typography variant="h4" className="!font-bold !text-brand-maroon">
                {t("pitham.testimonials.title")}
              </Typography>
            </Box>
            <Box className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((tst) => (
                <TestimonialCard key={tst.id} item={tst} />
              ))}
            </Box>
          </Box>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <Box className="mb-12">
            <Box className="flex items-center gap-3 mb-6">
              <PlayCircleIcon className="!text-brand-saffron !text-[2rem]" />
              <Typography variant="h4" className="!font-bold !text-brand-maroon">
                {t("pitham.videos.title")}
              </Typography>
            </Box>
            <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {videos.map((v) => (
                <VideoCard key={v.id} item={v} watchLabel={t("pitham.watchOn")} />
              ))}
            </Box>
          </Box>
        )}

        {/* Gallery — horizontal scrollable strip with arrow buttons */}
        {gallery.length > 0 && <GallerySection items={gallery} onOpen={setLightboxIdx} t={t} />}

        {/* Instagram */}
        {instagram.length > 0 && (
          <Box className="mb-12">
            <Typography variant="h4" className="!font-bold !text-brand-maroon !mb-6">
              {t("pitham.instagram.title")}
            </Typography>
            <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {instagram.map((ig) => (
                <InstagramCard key={ig.id} item={ig} />
              ))}
            </Box>
          </Box>
        )}

        {/* Lightbox */}
        <Lightbox
          items={gallery}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() =>
            setLightboxIdx((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length))
          }
          onNext={() => setLightboxIdx((i) => (i === null ? null : (i + 1) % gallery.length))}
        />

        {/* Visit & Contact */}
        <Paper
          elevation={0}
          className="!p-6 md:!p-8 !rounded-3xl !border !border-brand-sand"
        >
          <Typography variant="h5" className="!font-bold !text-brand-maroon !mb-6">
            {t("pitham.contact.title")}
          </Typography>
          <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Stack spacing={2}>
              {settings.contact_address && (
                <Box className="flex items-start gap-4">
                  <LocationOnIcon className="!text-brand-saffron !mt-1" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("contact.address")}
                    </Typography>
                    <Typography className="!font-semibold">{settings.contact_address}</Typography>
                  </Box>
                </Box>
              )}
              {settings.contact_phone && (
                <Box className="flex items-center gap-4">
                  <PhoneIcon className="!text-brand-saffron" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("common.mobile")}
                    </Typography>
                    <Typography className="!font-semibold">{settings.contact_phone}</Typography>
                  </Box>
                </Box>
              )}
              {settings.contact_email && (
                <Box className="flex items-center gap-4">
                  <EmailIcon className="!text-brand-saffron" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("common.email")}
                    </Typography>
                    <Typography className="!font-semibold">{settings.contact_email}</Typography>
                  </Box>
                </Box>
              )}
              {!settings.contact_address && !settings.contact_phone && !settings.contact_email && (
                <Typography color="text.secondary">{t("contact.noInfo")}</Typography>
              )}
              <Divider className="!my-2" />
              <Button
                component={Link}
                href="/contact"
                variant="outlined"
                className="!self-start"
              >
                {t("nav.contact")}
              </Button>
            </Stack>

            {(() => {
              const norm = normalizeMapUrl(settings.contact_map_url);
              return norm.embeddable;
            })() ? (
              <Box className="rounded-2xl overflow-hidden border border-brand-sand min-h-[280px]">
                <iframe
                  src={normalizeMapUrl(settings.contact_map_url).url}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 280 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Pitham Location"
                />
              </Box>
            ) : (
              <Box className="p-8 rounded-2xl border border-dashed border-brand-sand flex items-center justify-center min-h-[200px]">
                <Typography color="text.secondary" className="!text-center">
                  <LocationOnIcon className="!text-[40px] !opacity-30 !block !mx-auto !mb-2" />
                  {t("contact.mapPlaceholder")}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Header band — name + address at top (clean, readable, always-visible)
// ─────────────────────────────────────────────────────────────────────────────

function HeaderBand({ t }: { t: (k: any) => string }) {
  return (
    <Box
      className="text-white py-6 md:py-8 px-4 md:px-8"
      style={{
        background: `linear-gradient(135deg, ${brandColors.maroon} 0%, ${brandColors.saffronDark} 100%)`,
      }}
    >
      <Box className="max-w-[1100px] mx-auto flex items-center flex-col sm:flex-row gap-4 sm:gap-6 text-center sm:text-left">
        <Image
          src="/spbsp-logo.png"
          alt={t("brand.name")}
          width={88}
          height={88}
          priority
          style={{ filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.3))", flexShrink: 0 }}
        />
        <Box className="flex-1">
          <Typography className="!font-[Cinzel,serif] !font-bold !text-[1.4rem] md:!text-[2rem] !leading-[1.2] !mb-1">
            {t("pitham.title")}
          </Typography>
          <Box className="flex items-center gap-1.5 justify-center sm:justify-start opacity-90">
            <LocationOnIcon fontSize="small" />
            <Typography className="!text-[0.9rem] md:!text-base !font-medium">
              {t("pitham.location")}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Banner carousel — full-width images with caption + arrow controls
// ─────────────────────────────────────────────────────────────────────────────

function BannerCarousel({ banners }: { banners: PithamMediaItem[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => setIdx((i) => (i + 1) % banners.length), 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length]);

  if (banners.length === 0) return null;
  const current = banners[idx];

  return (
    <Box className="relative bg-black overflow-hidden">
      <Box className="relative w-full aspect-[16/10] sm:aspect-[21/9] max-h-[360px] md:max-h-[560px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={fileUrl(current.image_path || "")}
          alt={current.title || ""}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            animation: "fadeIn 0.5s ease",
          }}
        />

        {current.title && (
          <Box className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent text-white p-5 md:p-8 pt-12 md:pt-16">
            <Box className="max-w-[1100px] mx-auto">
              <Typography
                className="!font-bold !text-[1.1rem] md:!text-[1.6rem] !leading-tight"
                style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
              >
                {current.title}
              </Typography>
            </Box>
          </Box>
        )}

        {banners.length > 1 && (
          <>
            <IconButton
              onClick={() => setIdx((i) => (i - 1 + banners.length) % banners.length)}
              className="!absolute !left-2 md:!left-5 !top-1/2 !-translate-y-1/2 !text-white !bg-black/45 hover:!bg-black/70"
              aria-label="Previous banner"
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={() => setIdx((i) => (i + 1) % banners.length)}
              className="!absolute !right-2 md:!right-5 !top-1/2 !-translate-y-1/2 !text-white !bg-black/45 hover:!bg-black/70"
              aria-label="Next banner"
            >
              <ChevronRightIcon />
            </IconButton>

            <Stack
              direction="row"
              spacing={1}
              className="!absolute !bottom-3 !inset-x-0 !justify-center"
            >
              {banners.map((_, i) => (
                <Box
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`${
                    i === idx ? "w-6 bg-white" : "w-2 bg-white/55"
                  } h-2 rounded-full cursor-pointer transition-all duration-[250ms]`}
                />
              ))}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cards
// ─────────────────────────────────────────────────────────────────────────────

function EventCard({ ev, lang, t }: { ev: EventItem; lang: string; t: (k: any) => string }) {
  const img = ev.image_url ? (ev.image_url.startsWith("http") ? ev.image_url : fileUrl(ev.image_url)) : null;
  return (
    <Paper
      elevation={0}
      className="!rounded-3xl !border !border-brand-sand !overflow-hidden !flex !flex-col !transition-all !duration-200 hover:!-translate-y-[3px] hover:!shadow-[0_8px_24px_rgba(123,30,30,0.1)]"
    >
      {img && (
        <Box className="relative w-full aspect-video bg-brand-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={ev.title}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Box>
      )}
      <Box className="p-5 flex-1 flex flex-col">
        <Typography variant="h6" className="!font-bold !text-brand-maroon !mb-2">
          {ev.title}
        </Typography>
        <Stack direction="row" useFlexGap spacing={1} className="!mb-3 !flex-wrap">
          <Chip
            size="small"
            icon={<CalendarMonthIcon />}
            label={formatEventDate(ev.event_date, lang)}
            variant="outlined"
          />
          {ev.event_time && (
            <Chip size="small" icon={<AccessTimeIcon />} label={ev.event_time} variant="outlined" />
          )}
        </Stack>
        {ev.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            className="!leading-relaxed !mb-4 !line-clamp-2"
          >
            {ev.description}
          </Typography>
        )}
        <Box className="mt-auto pt-2">
          <Button
            component={Link}
            href={`/pitham/events/${ev.id}`}
            size="small"
            variant="outlined"
            className="!font-semibold"
          >
            {t("pitham.knowMore")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

function FeaturedEventCard({ ev, lang, t }: { ev: EventItem; lang: string; t: (k: any) => string }) {
  const img = ev.image_url ? (ev.image_url.startsWith("http") ? ev.image_url : fileUrl(ev.image_url)) : null;
  return (
    <Paper
      elevation={0}
      className="!rounded-3xl !overflow-hidden !border-2 !border-brand-gold !flex !flex-col sm:!flex-row !relative !shadow-[0_8px_28px_rgba(201,154,46,0.15)]"
      style={{
        background: `linear-gradient(135deg, ${brandColors.gold}10 0%, transparent 100%)`,
      }}
    >
      <Chip
        icon={<StarIcon />}
        label="Featured"
        className="!absolute !top-4 !left-4 !z-[2] !bg-brand-gold !text-white !font-bold"
      />
      {img && (
        <Box className="w-full sm:w-60 aspect-video sm:aspect-auto sm:h-auto shrink-0 bg-brand-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={ev.title}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Box>
      )}
      <Box className="p-6 flex-1 flex flex-col">
        <Typography
          variant="h5"
          className="!font-bold !text-brand-maroon !mb-3 !mt-6 sm:!mt-0"
        >
          {ev.title}
        </Typography>
        <Stack direction="row" useFlexGap spacing={1} className="!mb-3 !flex-wrap">
          <Chip
            size="small"
            icon={<CalendarMonthIcon />}
            label={formatEventDate(ev.event_date, lang)}
            color="primary"
            variant="outlined"
          />
          {ev.event_time && (
            <Chip size="small" icon={<AccessTimeIcon />} label={ev.event_time} variant="outlined" />
          )}
          {ev.location &&
            (ev.location_map_url ? (
              <Chip
                component="a"
                href={ev.location_map_url}
                target="_blank"
                rel="noreferrer"
                clickable
                size="small"
                icon={<LocationOnIcon />}
                label={ev.location}
                variant="outlined"
              />
            ) : (
              <Chip size="small" icon={<LocationOnIcon />} label={ev.location} variant="outlined" />
            ))}
        </Stack>
        {ev.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            className="!leading-[1.7] !mb-4 !line-clamp-2"
          >
            {ev.description}
          </Typography>
        )}
        <Box className="mt-auto">
          <Button
            component={Link}
            href={`/pitham/events/${ev.id}`}
            variant="contained"
            className="!bg-brand-gold !text-white !font-bold hover:!bg-brand-gold-dark"
          >
            {t("pitham.knowMore")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <Paper
      elevation={0}
      className="!p-6 !rounded-3xl !border !border-brand-sand !relative !h-full"
    >
      <FormatQuoteIcon className="!absolute !top-3 !right-3 !text-[40px] !text-brand-saffron/20" />
      <Typography className="!leading-[1.8] !text-brand-text-medium !italic !mb-6">
        &ldquo;{item.quote}&rdquo;
      </Typography>
      <Box className="flex items-center gap-3 pt-4 border-t border-brand-sand">
        {item.photo_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl(item.photo_path)}
            alt={item.name}
            loading="lazy"
            decoding="async"
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <Box className="w-12 h-12 rounded-full bg-brand-saffron text-white flex items-center justify-center font-bold">
            {item.name.charAt(0).toUpperCase()}
          </Box>
        )}
        <Box>
          <Typography className="!font-bold !text-brand-maroon">{item.name}</Typography>
          {item.location && (
            <Typography variant="caption" color="text.secondary">
              {item.location}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

function VideoCard({ item, watchLabel }: { item: PithamMediaItem; watchLabel: string }) {
  const ytId = youtubeId(item.url);
  const thumb = item.image_path
    ? fileUrl(item.image_path)
    : ytId
      ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
      : null;
  return (
    <Paper
      component="a"
      href={item.url || "#"}
      target="_blank"
      rel="noreferrer"
      elevation={0}
      className="!rounded-3xl !border !border-brand-sand !overflow-hidden !no-underline !flex !flex-col !transition-all !duration-200 hover:!-translate-y-[3px] hover:!shadow-[0_8px_24px_rgba(123,30,30,0.1)]"
    >
      <Box className="relative aspect-video bg-brand-sand group">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={item.title || ""}
            loading="lazy"
            decoding="async"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        <Box className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors duration-200 group-hover:bg-black/45">
          <PlayCircleIcon
            className="!text-[64px] !text-white"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}
          />
        </Box>
      </Box>
      <Box className="p-5">
        <Typography className="!font-semibold !text-brand-maroon !leading-tight">
          {item.title || watchLabel}
        </Typography>
      </Box>
    </Paper>
  );
}

function GallerySection({
  items,
  onOpen,
  t,
}: {
  items: PithamMediaItem[];
  onOpen: (i: number) => void;
  t: (k: any) => string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <Box className="mb-12">
      <Box className="flex items-center justify-between gap-3 mb-6">
        <Box className="flex items-center gap-3">
          <PhotoLibraryIcon className="!text-brand-saffron !text-[2rem]" />
          <Typography variant="h4" className="!font-bold !text-brand-maroon">
            {t("pitham.gallery.title")}
          </Typography>
        </Box>
        {items.length > 1 && (
          <Box className="hidden sm:flex gap-2">
            <IconButton
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="!bg-brand-sand hover:!bg-brand-gold hover:!text-white"
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="!bg-brand-sand hover:!bg-brand-gold hover:!text-white"
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      <Box className="relative">
        <Box
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-brand-sand [&::-webkit-scrollbar-thumb]:rounded"
        >
          {items.map((item, i) => (
            <Box
              key={item.id}
              onClick={() => onOpen(i)}
              className="group flex-none w-[220px] sm:w-[280px] md:w-[320px] aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-brand-sand snap-start relative transition-all duration-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl(item.image_path || "")}
                alt={item.title || ""}
                loading="lazy"
                className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-105"
              />
              {item.title && (
                <Box className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/0 via-55% to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-[250ms] p-3">
                  <Typography
                    variant="caption"
                    className="!text-white !font-semibold !leading-tight"
                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
                  >
                    {item.title}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: PithamMediaItem[];
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = index !== null ? items[index] : null;

  useEffect(() => {
    if (index === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, onClose, onPrev, onNext]);

  if (!item) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          className:
            "!bg-black/95 !text-white !shadow-none !m-0 sm:!m-4 !max-h-screen sm:!max-h-[95vh]",
        },
      }}
    >
      <DialogContent className="!p-0 !relative !flex !flex-col">
        <IconButton
          onClick={onClose}
          className="!absolute !top-2 !right-2 !text-white !bg-black/50 !z-[2] hover:!bg-black/75"
          aria-label="Close"
        >
          <CloseIcon />
        </IconButton>

        {items.length > 1 && (
          <>
            <IconButton
              onClick={onPrev}
              className="!absolute !left-2 !top-1/2 !-translate-y-1/2 !text-white !bg-black/40 !z-[2] hover:!bg-black/70"
              aria-label="Previous"
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={onNext}
              className="!absolute !right-2 !top-1/2 !-translate-y-1/2 !text-white !bg-black/40 !z-[2] hover:!bg-black/70"
              aria-label="Next"
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}

        <Box className="flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[500px] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl(item.image_path || "")}
            alt={item.title || ""}
            style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }}
          />
        </Box>

        {item.title && (
          <Box className="p-4 border-t border-white/15 bg-black/50">
            <Typography className="!font-bold !text-white">{item.title}</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InstagramCard({ item }: { item: PithamMediaItem }) {
  const embed = instagramEmbedUrl(item.url);
  if (!embed) {
    return (
      <Paper
        elevation={0}
        className="!p-6 !rounded-3xl !border !border-brand-sand !text-center"
      >
        <Typography variant="body2" className="!break-all">
          <a href={item.url || "#"} target="_blank" rel="noreferrer">
            {item.url}
          </a>
        </Typography>
      </Paper>
    );
  }
  return (
    <Paper
      elevation={0}
      className="!rounded-3xl !border !border-brand-sand !overflow-hidden !bg-brand-ivory"
    >
      <Box className="relative pt-[125%]">
        <iframe
          src={embed}
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          allow="encrypted-media"
          title={item.title || "Instagram post"}
        />
      </Box>
      {item.title && (
        <Typography variant="caption" className="!block !p-3 !text-brand-text-medium">
          {item.title}
        </Typography>
      )}
    </Paper>
  );
}
