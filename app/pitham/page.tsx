"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Box, Paper, Typography, Button, Stack, Chip, CircularProgress, Divider, IconButton,
  Dialog, DialogContent,
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
  getPublicEvents, getPublicSettings, getPithamCms, fileUrl,
  type EventItem, type PithamCmsBundle, type PithamMediaItem, type TestimonialItem,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

function formatEventDate(iso: string, lang: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "hi" ? "hi-IN" : lang === "mr" ? "mr-IN" : "en-IN", {
      weekday: "short", day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
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
    ]).then(([ev, st, c]) => {
      setEvents(ev as EventItem[]); setSettings(st); setCms(c as PithamCmsBundle | null);
    }).finally(() => setLoading(false));
  }, []);

  const featuredEvents = cms?.featured_events ?? [];
  const otherUpcoming = useMemo(
    () => (events ?? []).filter(e => !featuredEvents.some(f => f.id === e.id)),
    [events, featuredEvents],
  );
  const banners = cms?.banners ?? [];
  const testimonials = cms?.testimonials ?? [];
  const videos = cms?.videos ?? [];
  const instagram = cms?.instagram ?? [];
  const gallery = cms?.gallery ?? [];
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", bgcolor: "background.default" }}>
      <HeaderBand t={t} />
      <BannerCarousel banners={banners} />

      <Box sx={{ maxWidth: 1100, mx: "auto", py: { xs: 4, md: 6 }, px: { xs: 2, md: 4 } }}>
        {/* About + Deity */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 3, md: 5 }, mb: 6 }}>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
              {t("pitham.about.title")}
            </Typography>
            <Typography sx={{ lineHeight: 1.9, color: "text.secondary" }}>{t("pitham.about.body")}</Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
              {t("pitham.deity.title")}
            </Typography>
            <Typography sx={{ lineHeight: 1.9, color: "text.secondary" }}>{t("pitham.deity.body")}</Typography>
          </Paper>
        </Box>

        {/* Featured events */}
        {featuredEvents.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <StarIcon sx={{ color: brandColors.gold, fontSize: "2rem" }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: brandColors.maroon }}>
                {t("pitham.featured.title")}
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: featuredEvents.length === 1 ? "1fr" : "1fr 1fr" }, gap: 3 }}>
              {featuredEvents.map(ev => <FeaturedEventCard key={ev.id} ev={ev} lang={lang} t={t} />)}
            </Box>
          </Box>
        )}

        {/* Upcoming events */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <EventNoteIcon sx={{ color: brandColors.saffron, fontSize: "2rem" }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: brandColors.maroon }}>
              {t("pitham.events.title")}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
          ) : otherUpcoming.length > 0 ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
              {otherUpcoming.map(ev => <EventCard key={ev.id} ev={ev} lang={lang} t={t} />)}
            </Box>
          ) : featuredEvents.length === 0 ? (
            <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: `1px dashed ${brandColors.sand}`, textAlign: "center" }}>
              <EventNoteIcon sx={{ fontSize: 56, color: brandColors.sand, mb: 1 }} />
              <Typography color="text.secondary">{t("pitham.events.empty")}</Typography>
            </Paper>
          ) : null}
        </Box>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <FormatQuoteIcon sx={{ color: brandColors.maroon, fontSize: "2rem" }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: brandColors.maroon }}>
                {t("pitham.testimonials.title")}
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
              {testimonials.map(tst => <TestimonialCard key={tst.id} item={tst} />)}
            </Box>
          </Box>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <PlayCircleIcon sx={{ color: brandColors.saffron, fontSize: "2rem" }} />
              <Typography variant="h4" sx={{ fontWeight: 700, color: brandColors.maroon }}>
                {t("pitham.videos.title")}
              </Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
              {videos.map(v => <VideoCard key={v.id} item={v} watchLabel={t("pitham.watchOn")} />)}
            </Box>
          </Box>
        )}

        {/* Gallery — horizontal scrollable strip with arrow buttons */}
        {gallery.length > 0 && (
          <GallerySection items={gallery} onOpen={setLightboxIdx} t={t} />
        )}

        {/* Instagram */}
        {instagram.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 3 }}>
              {t("pitham.instagram.title")}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
              {instagram.map(ig => <InstagramCard key={ig.id} item={ig} />)}
            </Box>
          </Box>
        )}

        {/* Lightbox */}
        <Lightbox
          items={gallery}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx(i => i === null ? null : (i - 1 + gallery.length) % gallery.length)}
          onNext={() => setLightboxIdx(i => i === null ? null : (i + 1) % gallery.length)}
        />

        {/* Visit & Contact */}
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 3 }}>
            {t("pitham.contact.title")}
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
            <Stack spacing={2}>
              {settings.contact_address && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <LocationOnIcon sx={{ color: brandColors.saffron, mt: 0.4 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("contact.address")}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{settings.contact_address}</Typography>
                  </Box>
                </Box>
              )}
              {settings.contact_phone && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <PhoneIcon sx={{ color: brandColors.saffron }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("common.mobile")}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{settings.contact_phone}</Typography>
                  </Box>
                </Box>
              )}
              {settings.contact_email && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <EmailIcon sx={{ color: brandColors.saffron }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">{t("common.email")}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{settings.contact_email}</Typography>
                  </Box>
                </Box>
              )}
              {!settings.contact_address && !settings.contact_phone && !settings.contact_email && (
                <Typography color="text.secondary">{t("contact.noInfo")}</Typography>
              )}
              <Divider sx={{ my: 1 }} />
              <Button component={Link} href="/contact" variant="outlined" sx={{ alignSelf: "flex-start" }}>
                {t("nav.contact")}
              </Button>
            </Stack>

            {settings.contact_map_url ? (
              <Box sx={{ borderRadius: 3, overflow: "hidden", border: `1px solid ${brandColors.sand}`, minHeight: 280 }}>
                <iframe
                  src={settings.contact_map_url}
                  width="100%" height="100%"
                  style={{ border: 0, minHeight: 280 }}
                  allowFullScreen loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Pitham Location"
                />
              </Box>
            ) : (
              <Box sx={{
                p: 4, borderRadius: 3, border: `1px dashed ${brandColors.sand}`,
                display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200,
              }}>
                <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                  <LocationOnIcon sx={{ fontSize: 40, opacity: 0.3, display: "block", mx: "auto", mb: 1 }} />
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
    <Box sx={{
      background: `linear-gradient(135deg, ${brandColors.maroon} 0%, ${brandColors.saffronDark} 100%)`,
      color: "#fff",
      py: { xs: 3, md: 4 },
      px: { xs: 2, md: 4 },
    }}>
      <Box sx={{
        maxWidth: 1100, mx: "auto",
        display: "flex", alignItems: "center",
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 2, sm: 3 },
        textAlign: { xs: "center", sm: "left" },
      }}>
        <Image
          src="/spbsp-logo.png"
          alt={t("brand.name")}
          width={88} height={88} priority
          style={{ filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.3))", flexShrink: 0 }}
        />
        <Box sx={{ flex: 1 }}>
          <Typography
            sx={{
              fontFamily: "'Cinzel', serif", fontWeight: 700,
              fontSize: { xs: "1.4rem", md: "2rem" }, lineHeight: 1.2, mb: 0.5,
            }}
          >
            {t("pitham.title")}
          </Typography>
          <Box sx={{
            display: "flex", alignItems: "center", gap: 0.75,
            justifyContent: { xs: "center", sm: "flex-start" },
            opacity: 0.92,
          }}>
            <LocationOnIcon fontSize="small" />
            <Typography sx={{ fontSize: { xs: "0.9rem", md: "1rem" }, fontWeight: 500 }}>
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
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % banners.length), 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  if (banners.length === 0) return null;
  const current = banners[idx];

  return (
    <Box sx={{ position: "relative", bgcolor: "#000", overflow: "hidden" }}>
      <Box sx={{
        position: "relative",
        width: "100%",
        aspectRatio: { xs: "16/10", sm: "21/9" },
        maxHeight: { xs: 360, md: 560 },
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={fileUrl(current.image_path || "")}
          alt={current.title || ""}
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            display: "block", animation: "fadeIn 0.5s ease",
          }}
        />

        {current.title && (
          <Box sx={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
            color: "#fff",
            p: { xs: 2.5, md: 4 },
            pt: { xs: 6, md: 8 },
          }}>
            <Box sx={{ maxWidth: 1100, mx: "auto" }}>
              <Typography sx={{
                fontWeight: 700,
                fontSize: { xs: "1.1rem", md: "1.6rem" },
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                lineHeight: 1.3,
              }}>
                {current.title}
              </Typography>
            </Box>
          </Box>
        )}

        {banners.length > 1 && (
          <>
            <IconButton
              onClick={() => setIdx(i => (i - 1 + banners.length) % banners.length)}
              sx={{
                position: "absolute", left: { xs: 8, md: 20 }, top: "50%", transform: "translateY(-50%)",
                color: "#fff", bgcolor: "rgba(0,0,0,0.45)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              }}
              aria-label="Previous banner"
            ><ChevronLeftIcon /></IconButton>
            <IconButton
              onClick={() => setIdx(i => (i + 1) % banners.length)}
              sx={{
                position: "absolute", right: { xs: 8, md: 20 }, top: "50%", transform: "translateY(-50%)",
                color: "#fff", bgcolor: "rgba(0,0,0,0.45)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              }}
              aria-label="Next banner"
            ><ChevronRightIcon /></IconButton>

            <Stack direction="row" spacing={1} sx={{
              position: "absolute", bottom: 12, left: 0, right: 0,
              justifyContent: "center",
            }}>
              {banners.map((_, i) => (
                <Box key={i} onClick={() => setIdx(i)}
                  sx={{
                    width: i === idx ? 24 : 8, height: 8, borderRadius: 99,
                    bgcolor: i === idx ? "#fff" : "rgba(255,255,255,0.55)",
                    cursor: "pointer", transition: "all 0.25s",
                  }}
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
    <Paper elevation={0} sx={{
      borderRadius: 4, border: `1px solid ${brandColors.sand}`, overflow: "hidden",
      display: "flex", flexDirection: "column",
      transition: "all 0.2s ease",
      "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(123,30,30,0.1)" },
    }}>
      {img && (
        <Box sx={{ position: "relative", width: "100%", aspectRatio: "16/9", bgcolor: brandColors.sand }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </Box>
      )}
      <Box sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1 }}>{ev.title}</Typography>
        <Stack direction="row" useFlexGap spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
          <Chip size="small" icon={<CalendarMonthIcon />} label={formatEventDate(ev.event_date, lang)} variant="outlined" />
          {ev.event_time && <Chip size="small" icon={<AccessTimeIcon />} label={ev.event_time} variant="outlined" />}
        </Stack>
        {ev.description && (
          <Typography variant="body2" color="text.secondary" sx={{
            lineHeight: 1.6, mb: 2,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {ev.description}
          </Typography>
        )}
        <Box sx={{ mt: "auto", pt: 1 }}>
          <Button
            component={Link}
            href={`/pitham/events/${ev.id}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
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
    <Paper elevation={0} sx={{
      borderRadius: 4, overflow: "hidden",
      border: `2px solid ${brandColors.gold}`,
      background: `linear-gradient(135deg, ${brandColors.gold}10 0%, transparent 100%)`,
      display: "flex", flexDirection: { xs: "column", sm: "row" },
      position: "relative",
      boxShadow: `0 8px 28px ${brandColors.gold}25`,
    }}>
      <Chip
        icon={<StarIcon />}
        label="Featured"
        sx={{
          position: "absolute", top: 16, left: 16, zIndex: 2,
          bgcolor: brandColors.gold, color: "#fff", fontWeight: 700,
        }}
      />
      {img && (
        <Box sx={{ width: { xs: "100%", sm: 240 }, aspectRatio: { xs: "16/9", sm: "auto" }, height: { sm: "auto" }, flexShrink: 0, bgcolor: brandColors.sand }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </Box>
      )}
      <Box sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1.5, mt: { xs: 3, sm: 0 } }}>{ev.title}</Typography>
        <Stack direction="row" useFlexGap spacing={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
          <Chip size="small" icon={<CalendarMonthIcon />} label={formatEventDate(ev.event_date, lang)} color="primary" variant="outlined" />
          {ev.event_time && <Chip size="small" icon={<AccessTimeIcon />} label={ev.event_time} variant="outlined" />}
          {ev.location && <Chip size="small" icon={<LocationOnIcon />} label={ev.location} variant="outlined" />}
        </Stack>
        {ev.description && (
          <Typography variant="body2" color="text.secondary" sx={{
            lineHeight: 1.7, mb: 2,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {ev.description}
          </Typography>
        )}
        <Box sx={{ mt: "auto" }}>
          <Button
            component={Link}
            href={`/pitham/events/${ev.id}`}
            variant="contained"
            sx={{ bgcolor: brandColors.gold, color: "#fff", fontWeight: 700, "&:hover": { bgcolor: brandColors.goldDark || brandColors.gold } }}
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
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${brandColors.sand}`, position: "relative", height: "100%" }}>
      <FormatQuoteIcon sx={{ position: "absolute", top: 12, right: 12, fontSize: 40, color: `${brandColors.saffron}30` }} />
      <Typography sx={{ lineHeight: 1.8, color: "text.secondary", fontStyle: "italic", mb: 3 }}>
        &ldquo;{item.quote}&rdquo;
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pt: 2, borderTop: `1px solid ${brandColors.sand}` }}>
        {item.photo_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fileUrl(item.photo_path)} alt={item.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: brandColors.saffron, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
            {item.name.charAt(0).toUpperCase()}
          </Box>
        )}
        <Box>
          <Typography sx={{ fontWeight: 700, color: brandColors.maroon }}>{item.name}</Typography>
          {item.location && <Typography variant="caption" color="text.secondary">{item.location}</Typography>}
        </Box>
      </Box>
    </Paper>
  );
}

function VideoCard({ item, watchLabel }: { item: PithamMediaItem; watchLabel: string }) {
  const ytId = youtubeId(item.url);
  const thumb = item.image_path
    ? fileUrl(item.image_path)
    : ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
  return (
    <Paper
      component="a"
      href={item.url || "#"}
      target="_blank"
      rel="noreferrer"
      elevation={0}
      sx={{
        borderRadius: 4, border: `1px solid ${brandColors.sand}`, overflow: "hidden",
        textDecoration: "none", display: "flex", flexDirection: "column",
        transition: "all 0.2s ease",
        "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(123,30,30,0.1)" },
      }}
    >
      <Box sx={{ position: "relative", aspectRatio: "16/9", bgcolor: brandColors.sand }}>
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={item.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        <Box sx={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.25)", transition: "background 0.2s",
          "&:hover": { background: "rgba(0,0,0,0.45)" },
        }}>
          <PlayCircleIcon sx={{ fontSize: 64, color: "#fff", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }} />
        </Box>
      </Box>
      <Box sx={{ p: 2.5 }}>
        <Typography sx={{ fontWeight: 600, color: brandColors.maroon, lineHeight: 1.3 }}>
          {item.title || watchLabel}
        </Typography>
      </Box>
    </Paper>
  );
}

function GallerySection({ items, onOpen, t }: { items: PithamMediaItem[]; onOpen: (i: number) => void; t: (k: any) => string }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scrollBy(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.85), behavior: "smooth" });
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PhotoLibraryIcon sx={{ color: brandColors.saffron, fontSize: "2rem" }} />
          <Typography variant="h4" sx={{ fontWeight: 700, color: brandColors.maroon }}>
            {t("pitham.gallery.title")}
          </Typography>
        </Box>
        {items.length > 1 && (
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            <IconButton onClick={() => scrollBy(-1)} aria-label="Scroll left"
              sx={{ bgcolor: brandColors.sand, "&:hover": { bgcolor: brandColors.gold, color: "#fff" } }}>
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={() => scrollBy(1)} aria-label="Scroll right"
              sx={{ bgcolor: brandColors.sand, "&:hover": { bgcolor: brandColors.gold, color: "#fff" } }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      <Box sx={{ position: "relative" }}>
        <Box
          ref={scrollRef}
          sx={{
            display: "flex", gap: 2, overflowX: "auto", pb: 1.5,
            scrollSnapType: "x mandatory",
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": { height: 8 },
            "&::-webkit-scrollbar-thumb": { bgcolor: brandColors.sand, borderRadius: 4 },
          }}
        >
          {items.map((item, i) => (
            <Box
              key={item.id}
              onClick={() => onOpen(i)}
              sx={{
                flex: "0 0 auto",
                width: { xs: 220, sm: 280, md: 320 },
                aspectRatio: "4/3",
                borderRadius: 3,
                overflow: "hidden",
                cursor: "pointer",
                border: `1px solid ${brandColors.sand}`,
                scrollSnapAlign: "start",
                position: "relative",
                transition: "all 0.2s ease",
                "&:hover .gallery-caption": { opacity: 1 },
                "&:hover img": { transform: "scale(1.05)" },
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl(item.image_path || "")}
                alt={item.title || ""}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s ease" }}
              />
              {item.title && (
                <Box
                  className="gallery-caption"
                  sx={{
                    position: "absolute", inset: 0, display: "flex", alignItems: "flex-end",
                    background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 55%)",
                    opacity: { xs: 1, md: 0 }, transition: "opacity 0.25s ease", p: 1.5,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600, lineHeight: 1.3, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
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
  items, index, onClose, onPrev, onNext,
}: {
  items: PithamMediaItem[]; index: number | null;
  onClose: () => void; onPrev: () => void; onNext: () => void;
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
          sx: {
            bgcolor: "rgba(0,0,0,0.95)", color: "#fff",
            boxShadow: "none", m: { xs: 0, sm: 2 }, maxHeight: { xs: "100vh", sm: "95vh" },
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0, position: "relative", display: "flex", flexDirection: "column" }}>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 8, right: 8, color: "#fff", bgcolor: "rgba(0,0,0,0.5)", zIndex: 2, "&:hover": { bgcolor: "rgba(0,0,0,0.75)" } }}
          aria-label="Close"
        ><CloseIcon /></IconButton>

        {items.length > 1 && (
          <>
            <IconButton
              onClick={onPrev}
              sx={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#fff", bgcolor: "rgba(0,0,0,0.4)", zIndex: 2, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}
              aria-label="Previous"
            ><ChevronLeftIcon /></IconButton>
            <IconButton
              onClick={onNext}
              sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#fff", bgcolor: "rgba(0,0,0,0.4)", zIndex: 2, "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}
              aria-label="Next"
            ><ChevronRightIcon /></IconButton>
          </>
        )}

        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: { xs: 300, sm: 500 }, p: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fileUrl(item.image_path || "")}
            alt={item.title || ""}
            style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }}
          />
        </Box>

        {item.title && (
          <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.15)", bgcolor: "rgba(0,0,0,0.5)" }}>
            <Typography sx={{ fontWeight: 700, color: "#fff" }}>{item.title}</Typography>
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
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${brandColors.sand}`, textAlign: "center" }}>
        <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
          <a href={item.url || "#"} target="_blank" rel="noreferrer">{item.url}</a>
        </Typography>
      </Paper>
    );
  }
  return (
    <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${brandColors.sand}`, overflow: "hidden", bgcolor: "background.paper" }}>
      <Box sx={{ position: "relative", paddingTop: "125%" /* IG embed aspect */ }}>
        <iframe
          src={embed}
          loading="lazy"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
          allow="encrypted-media"
          title={item.title || "Instagram post"}
        />
      </Box>
      {item.title && (
        <Typography variant="caption" sx={{ display: "block", p: 1.5, color: "text.secondary" }}>
          {item.title}
        </Typography>
      )}
    </Paper>
  );
}
