"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ImageIcon from "@mui/icons-material/Image";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import VideocamIcon from "@mui/icons-material/Videocam";
import InstagramIcon from "@mui/icons-material/Instagram";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import {
  getToken,
  fileUrl,
  isSuperAdmin,
  adminGetEvents,
  adminCreateEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  adminListPithamMedia,
  adminCreatePithamMedia,
  adminUpdatePithamMedia,
  adminDeletePithamMedia,
  adminListTestimonials,
  adminCreateTestimonial,
  adminUpdateTestimonial,
  adminDeleteTestimonial,
  type EventItem,
  type PithamMediaItem,
  type PithamMediaKind,
  type TestimonialItem,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";
import { useRequireSection } from "@/lib/useRequireSection";

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4";
const CONTAINER_CLASS = "max-w-[1200px] mx-auto";

type TabKey = "banners" | "events" | "gallery" | "testimonials" | "videos" | "instagram";

const TAB_ORDER: TabKey[] = ["banners", "events", "gallery", "testimonials", "videos", "instagram"];

function youtubeThumb(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&?\/\s]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

function instagramEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[^/?#]+)/);
  if (!m) return null;
  return `${m[1].replace(/\/$/, "")}/embed`;
}

export default function AdminPithamCms() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();
  const gate = useRequireSection("pitham_cms");

  const initialTab = (params.get("tab") as TabKey) || "banners";
  const [tab, setTab] = useState<TabKey>(TAB_ORDER.includes(initialTab) ? initialTab : "banners");

  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    if (!isSuperAdmin()) {
      setForbidden(true);
    }
  }, [router]);

  function changeTab(next: TabKey) {
    setTab(next);
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", next);
    router.replace(`/admin/pitham?${sp.toString()}`);
  }

  if (gate !== "allowed") {
    return (
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <CircularProgress />
      </Box>
    );
  }
  // forbidden flag is now redundant — useRequireSection handles redirect when
  // the user lacks access. Kept the variable to preserve any future UX hooks.
  void forbidden;

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Box className="mb-6">
          <Typography variant="h4" className="!text-brand-maroon !font-bold !mb-1">
            {t("pcms.title")}
          </Typography>
          <Typography className="!text-brand-text-medium">{t("pcms.subtitle")}</Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => changeTab(v as TabKey)}
          variant="scrollable"
          scrollButtons="auto"
          className="!mb-6 !border-b !border-[#E8D9BF]"
        >
          <Tab value="banners" label={t("pcms.tab.banners")} />
          <Tab value="events" label={t("pcms.tab.events")} />
          <Tab value="gallery" label={t("pcms.tab.gallery")} />
          <Tab value="testimonials" label={t("pcms.tab.testimonials")} />
          <Tab value="videos" label={t("pcms.tab.videos")} />
          <Tab value="instagram" label={t("pcms.tab.instagram")} />
        </Tabs>

        {tab === "banners" && <ImageUploadPanel kind="banner" notify={setSnack} />}
        {tab === "events" && <EventsPanel notify={setSnack} />}
        {tab === "gallery" && <ImageUploadPanel kind="gallery" notify={setSnack} />}
        {tab === "testimonials" && <TestimonialsPanel notify={setSnack} />}
        {tab === "videos" && <MediaPanel kind="video" notify={setSnack} />}
        {tab === "instagram" && <MediaPanel kind="instagram" notify={setSnack} />}
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} className="!w-full">
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

type Notify = (n: { msg: string; severity: "success" | "error" } | null) => void;

function EmptyState({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Paper
      elevation={0}
      className="!p-10 !rounded-3xl !border !border-dashed !border-brand-sand !text-center"
    >
      <Box className="text-brand-sand mb-2 [&_svg]:!text-[56px]">{icon}</Box>
      <Typography color="text.secondary">{label}</Typography>
    </Paper>
  );
}

function DeleteDialog({
  open,
  target,
  busy,
  onCancel,
  onConfirm,
  t: tFn,
}: {
  open: boolean;
  target: { label: string } | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  t: (k: any) => string;
}) {
  return (
    <Dialog open={open} onClose={() => !busy && onCancel()} maxWidth="xs" fullWidth>
      <DialogTitle className="!font-bold !text-brand-error">{tFn("common.delete")}</DialogTitle>
      <DialogContent>
        <Typography>{tFn("pcms.deleteConfirm")}</Typography>
        {target && (
          <Paper
            elevation={0}
            className="!mt-4 !p-4 !border !border-[#E8D9BF] !rounded-lg"
          >
            <Typography className="!font-semibold">{target.label}</Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions className="!px-6 !pb-4">
        <Button onClick={onCancel} disabled={busy}>
          {tFn("common.cancel")}
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={busy}>
          {busy ? tFn("common.saving") : tFn("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ImageUploadPanel({ kind, notify }: { kind: "banner" | "gallery"; notify: Notify }) {
  const { t } = useT();
  const [items, setItems] = useState<PithamMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PithamMediaItem | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<PithamMediaItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  const isBanner = kind === "banner";
  const addLabel = isBanner ? t("pcms.banner.add") : t("pcms.gallery.add");
  const editLabel = isBanner ? t("pcms.banner.edit") : t("pcms.gallery.edit");
  const emptyIcon = isBanner ? <ImageIcon /> : <PhotoLibraryIcon />;

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      setItems(await adminListPithamMedia(kind, token));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    setTitle("");
    setSortOrder(0);
    setIsActive(true);
    setFile(null);
    setErr("");
    setOpen(true);
  }
  function openEdit(item: PithamMediaItem) {
    setEditing(item);
    setTitle(item.title || "");
    setSortOrder(item.sort_order);
    setIsActive(item.is_active);
    setFile(null);
    setErr("");
    setOpen(true);
  }

  async function save() {
    const token = getToken();
    if (!token) return;
    if (!editing && !file) {
      setErr(t("pcms.banner.imgRequired"));
      return;
    }
    setErr("");
    setBusy(true);
    try {
      if (editing) {
        await adminUpdatePithamMedia(
          editing.id,
          { title, sort_order: sortOrder, is_active: isActive, image: file },
          token,
        );
      } else {
        await adminCreatePithamMedia(
          { kind, title, sort_order: sortOrder, is_active: isActive, image: file },
          token,
        );
      }
      notify({ msg: t("pcms.saved"), severity: "success" });
      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.detail || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!del) return;
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await adminDeletePithamMedia(del.id, token);
      notify({ msg: t("pcms.deleted"), severity: "success" });
      setDel(null);
      await load();
    } catch (e: any) {
      notify({ msg: e?.detail || "Delete failed", severity: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <Box className="text-center py-8">
        <CircularProgress />
      </Box>
    );

  return (
    <>
      <Box className="flex justify-end mb-4">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {addLabel}
        </Button>
      </Box>

      {items.length === 0 ? (
        <EmptyState icon={emptyIcon} label={t("pcms.empty")} />
      ) : (
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {items.map((item) => (
            <Paper
              key={item.id}
              elevation={0}
              className={`!rounded-3xl !border !border-brand-sand !overflow-hidden ${
                item.is_active ? "!opacity-100" : "!opacity-55"
              }`}
            >
              {item.image_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrl(item.image_path)}
                  alt={item.title || kind}
                  style={{
                    width: "100%",
                    aspectRatio: isBanner ? "16/9" : "4/3",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              )}
              <Box className="p-4">
                <Box className="flex justify-between items-start gap-2 mb-1">
                  <Typography className="!font-semibold !leading-tight !flex-1">
                    {item.title || "—"}
                  </Typography>
                  <Box className="flex gap-1">
                    <IconButton size="small" onClick={() => openEdit(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => setDel(item)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip
                    size="small"
                    label={item.is_active ? t("pcms.active") : t("pcms.inactive")}
                    color={item.is_active ? "success" : "default"}
                    variant="outlined"
                  />
                  <Chip size="small" label={`#${item.sort_order}`} variant="outlined" />
                </Stack>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle className="!font-bold !text-brand-maroon">
          {editing ? editLabel : addLabel}
        </DialogTitle>
        <DialogContent>
          {err && (
            <Alert severity="error" className="!mb-4">
              {err}
            </Alert>
          )}
          <Stack spacing={2.5} className="!mt-2">
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              className="!self-start"
            >
              {file ? file.name : editing ? t("events.replaceImage") : t("events.uploadImage")}
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Button>
            {editing?.image_path && !file && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl(editing.image_path)}
                alt="current"
                style={{ maxWidth: 320, borderRadius: 8 }}
              />
            )}
            <TextField
              label={t("pcms.caption")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label={t("pcms.sortOrder")}
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              helperText={t("pcms.sortHelp")}
            />
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
              label={t("pcms.active")}
            />
          </Stack>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setOpen(false)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={save} disabled={busy}>
            {busy ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={!!del}
        target={del ? { label: del.title || `(untitled ${kind})` } : null}
        busy={busy}
        onCancel={() => setDel(null)}
        onConfirm={confirmDelete}
        t={t}
      />
    </>
  );
}

function EventsPanel({ notify }: { notify: Notify }) {
  const { t } = useT();
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<EventItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    location_map_url: "",
    image_url: "",
    is_featured: false,
  });
  const [imgFile, setImgFile] = useState<File | null>(null);

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      setItems(await adminGetEvents(token));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      event_date: "",
      event_time: "",
      location: "",
      location_map_url: "",
      image_url: "",
      is_featured: false,
    });
    setImgFile(null);
    setErr("");
    setOpen(true);
  }
  function openEdit(item: EventItem) {
    setEditing(item);
    setForm({
      title: item.title,
      description: item.description || "",
      event_date: item.event_date,
      event_time: item.event_time || "",
      location: item.location || "",
      location_map_url: item.location_map_url || "",
      image_url: item.image_url && !item.image_url.startsWith("uploads/") ? item.image_url : "",
      is_featured: !!item.is_featured,
    });
    setImgFile(null);
    setErr("");
    setOpen(true);
  }

  async function save() {
    const token = getToken();
    if (!token) return;
    if (!form.title.trim()) {
      setErr(t("events.titleRequired"));
      return;
    }
    if (!form.event_date) {
      setErr(t("events.dateRequired"));
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const payload = { ...form, image: imgFile };
      if (editing) await adminUpdateEvent(editing.id, payload, token);
      else await adminCreateEvent(payload, token);
      notify({ msg: t("pcms.saved"), severity: "success" });
      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.detail || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!del) return;
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await adminDeleteEvent(del.id, token);
      notify({ msg: t("pcms.deleted"), severity: "success" });
      setDel(null);
      await load();
    } catch (e: any) {
      notify({ msg: e?.detail || "Delete failed", severity: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function toggleFeatured(item: EventItem) {
    const token = getToken();
    if (!token) return;
    try {
      await adminUpdateEvent(item.id, { is_featured: !item.is_featured }, token);
      await load();
    } catch (e: any) {
      notify({ msg: e?.detail || "Update failed", severity: "error" });
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(
    () =>
      items
        .filter((e) => e.event_date >= today)
        .sort(
          (a, b) => Number(b.is_featured) - Number(a.is_featured) || a.event_date.localeCompare(b.event_date),
        ),
    [items, today],
  );
  const past = useMemo(
    () => items.filter((e) => e.event_date < today).sort((a, b) => b.event_date.localeCompare(a.event_date)),
    [items, today],
  );
  const visible = tab === 0 ? upcoming : past;

  if (loading)
    return (
      <Box className="text-center py-8">
        <CircularProgress />
      </Box>
    );

  return (
    <>
      <Box className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mb-4">
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`${t("events.upcoming")} (${upcoming.length})`} />
          <Tab label={`${t("events.past")} (${past.length})`} />
        </Tabs>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          className="!w-full sm:!w-auto"
        >
          {t("events.create")}
        </Button>
      </Box>

      {visible.length === 0 ? (
        <EmptyState icon={<EventNoteIcon />} label={t("events.empty")} />
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visible.map((ev) => (
            <Paper
              key={ev.id}
              elevation={0}
              className={`!p-4 md:!p-5 !rounded-3xl !flex !flex-col sm:!flex-row !gap-3 sm:!gap-4 !items-stretch sm:!items-start ${
                ev.is_featured
                  ? "!border-2 !border-brand-gold !bg-brand-gold/5"
                  : "!border !border-brand-sand !bg-brand-ivory"
              }`}
            >
              {ev.image_url && (
                <Box className="w-full sm:w-24 h-[180px] sm:h-24 shrink-0 rounded-lg overflow-hidden bg-brand-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ev.image_url.startsWith("http") ? ev.image_url : fileUrl(ev.image_url)}
                    alt={ev.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </Box>
              )}
              <Box className="flex-1 min-w-0">
                <Box className="flex items-start justify-between gap-2 mb-2">
                  <Typography className="!font-bold !text-brand-maroon !leading-tight !break-words">
                    {ev.title}
                  </Typography>
                  {ev.is_featured && (
                    <Chip
                      icon={<StarIcon />}
                      label={t("events.featuredBadge")}
                      size="small"
                      className="!bg-brand-gold !text-white !font-bold !shrink-0"
                    />
                  )}
                </Box>
                <Stack direction="row" spacing={1} useFlexGap className="!flex-wrap !mb-2">
                  <Chip icon={<CalendarMonthIcon />} label={ev.event_date} size="small" variant="outlined" />
                  {ev.event_time && (
                    <Chip icon={<AccessTimeIcon />} label={ev.event_time} size="small" variant="outlined" />
                  )}
                  {ev.location && (
                    <Chip icon={<LocationOnIcon />} label={ev.location} size="small" variant="outlined" />
                  )}
                </Stack>
                {ev.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="!leading-relaxed !mb-2 !break-words"
                  >
                    {ev.description}
                  </Typography>
                )}
                <Box className="flex gap-1 mt-2">
                  <IconButton size="small" onClick={() => toggleFeatured(ev)} title={t("events.featured")}>
                    {ev.is_featured ? (
                      <StarIcon fontSize="small" className="!text-brand-gold" />
                    ) : (
                      <StarBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                  <IconButton size="small" onClick={() => openEdit(ev)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDel(ev)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle className="!font-bold !text-brand-maroon">
          {editing ? t("events.edit") : t("events.create")}
        </DialogTitle>
        <DialogContent>
          {err && (
            <Alert severity="error" className="!mb-4">
              {err}
            </Alert>
          )}
          <Stack spacing={2.5} className="!mt-2">
            <TextField
              label={t("events.eventTitle")}
              required
              fullWidth
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label={t("events.eventDate")}
                type="date"
                required
                fullWidth
                value={form.event_date}
                onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label={t("events.eventTime")}
                type="time"
                fullWidth
                value={form.event_time}
                onChange={(e) => setForm((f) => ({ ...f, event_time: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
            <TextField
              label={t("events.location")}
              fullWidth
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
            <TextField
              label="Map link (optional)"
              fullWidth
              value={form.location_map_url}
              onChange={(e) => setForm((f) => ({ ...f, location_map_url: e.target.value }))}
              placeholder="https://maps.google.com/?q=..."
              helperText="Paste a Google Maps URL. Visitors will see the location as a clickable link."
            />
            <TextField
              label={t("events.description")}
              multiline
              rows={4}
              fullWidth
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                className="!block !mb-2"
              >
                {t("events.image")}
              </Typography>
              <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                className="!items-center !flex-wrap"
              >
                <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                  {imgFile ? imgFile.name : t("events.uploadImage")}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                  />
                </Button>
                {editing?.image_url && !imgFile && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      editing.image_url.startsWith("http") ? editing.image_url : fileUrl(editing.image_url)
                    }
                    alt="current"
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }}
                  />
                )}
              </Stack>
              <TextField
                label={t("events.imageUrl")}
                fullWidth
                size="small"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                className="!mt-3"
                helperText={t("events.imageOrUrl")}
              />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                />
              }
              label={t("events.featured")}
            />
          </Stack>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setOpen(false)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={save} disabled={busy}>
            {busy ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={!!del}
        target={del ? { label: `${del.title} (${del.event_date})` } : null}
        busy={busy}
        onCancel={() => setDel(null)}
        onConfirm={confirmDelete}
        t={t}
      />
    </>
  );
}

function TestimonialsPanel({ notify }: { notify: Notify }) {
  const { t } = useT();
  const [items, setItems] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TestimonialItem | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<TestimonialItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({ name: "", location: "", quote: "", sort_order: 0, is_active: true });
  const [photo, setPhoto] = useState<File | null>(null);

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      setItems(await adminListTestimonials(token));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    setForm({ name: "", location: "", quote: "", sort_order: 0, is_active: true });
    setPhoto(null);
    setErr("");
    setOpen(true);
  }
  function openEdit(item: TestimonialItem) {
    setEditing(item);
    setForm({
      name: item.name,
      location: item.location || "",
      quote: item.quote,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setPhoto(null);
    setErr("");
    setOpen(true);
  }

  async function save() {
    const token = getToken();
    if (!token) return;
    if (!form.name.trim() || !form.quote.trim()) {
      setErr(t("pcms.test.required"));
      return;
    }
    setErr("");
    setBusy(true);
    try {
      if (editing) await adminUpdateTestimonial(editing.id, { ...form, photo }, token);
      else await adminCreateTestimonial({ ...form, photo }, token);
      notify({ msg: t("pcms.saved"), severity: "success" });
      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.detail || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!del) return;
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await adminDeleteTestimonial(del.id, token);
      notify({ msg: t("pcms.deleted"), severity: "success" });
      setDel(null);
      await load();
    } catch (e: any) {
      notify({ msg: e?.detail || "Delete failed", severity: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <Box className="text-center py-8">
        <CircularProgress />
      </Box>
    );

  return (
    <>
      <Box className="flex justify-end mb-4">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {t("pcms.test.add")}
        </Button>
      </Box>

      {items.length === 0 ? (
        <EmptyState icon={<FormatQuoteIcon />} label={t("pcms.empty")} />
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((item) => (
            <Paper
              key={item.id}
              elevation={0}
              className={`!p-5 !rounded-3xl !border !border-brand-sand ${
                item.is_active ? "!opacity-100" : "!opacity-55"
              }`}
            >
              <Box className="flex gap-4">
                {item.photo_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl(item.photo_path)}
                    alt={item.name}
                    style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%", flexShrink: 0 }}
                  />
                ) : (
                  <Box
                    className="w-16 h-16 rounded-full bg-brand-sand flex items-center justify-center text-brand-maroon font-bold text-[1.5rem] shrink-0"
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </Box>
                )}
                <Box className="flex-1 min-w-0">
                  <Box className="flex justify-between items-start gap-2">
                    <Box>
                      <Typography className="!font-bold">{item.name}</Typography>
                      {item.location && (
                        <Typography variant="caption" color="text.secondary">
                          {item.location}
                        </Typography>
                      )}
                    </Box>
                    <Box className="flex gap-1">
                      <IconButton size="small" onClick={() => openEdit(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDel(item)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    className="!mt-2 !leading-relaxed !italic"
                  >
                    "{item.quote}"
                  </Typography>
                  <Stack direction="row" spacing={1} className="!mt-3">
                    <Chip
                      size="small"
                      label={item.is_active ? t("pcms.active") : t("pcms.inactive")}
                      color={item.is_active ? "success" : "default"}
                      variant="outlined"
                    />
                    <Chip size="small" label={`#${item.sort_order}`} variant="outlined" />
                  </Stack>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle className="!font-bold !text-brand-maroon">
          {editing ? t("pcms.test.edit") : t("pcms.test.add")}
        </DialogTitle>
        <DialogContent>
          {err && (
            <Alert severity="error" className="!mb-4">
              {err}
            </Alert>
          )}
          <Stack spacing={2.5} className="!mt-2">
            <TextField
              label={t("pcms.test.name")}
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label={t("pcms.test.location")}
              fullWidth
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            />
            <TextField
              label={t("pcms.test.quote")}
              required
              multiline
              rows={4}
              fullWidth
              value={form.quote}
              onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            />
            <Stack
              direction="row"
              spacing={1.5}
              useFlexGap
              className="!items-center !flex-wrap"
            >
              <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                {photo ? photo.name : t("pcms.test.photo")}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
              </Button>
              {editing?.photo_path && !photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fileUrl(editing.photo_path)}
                  alt="current"
                  style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "50%" }}
                />
              )}
            </Stack>
            <TextField
              label={t("pcms.sortOrder")}
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
              helperText={t("pcms.sortHelp")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
              }
              label={t("pcms.active")}
            />
          </Stack>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setOpen(false)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={save} disabled={busy}>
            {busy ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={!!del}
        target={del ? { label: del.name } : null}
        busy={busy}
        onCancel={() => setDel(null)}
        onConfirm={confirmDelete}
        t={t}
      />
    </>
  );
}

function MediaPanel({ kind, notify }: { kind: PithamMediaKind; notify: Notify }) {
  const { t } = useT();
  const [items, setItems] = useState<PithamMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PithamMediaItem | null>(null);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<PithamMediaItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({ title: "", url: "", sort_order: 0, is_active: true });
  const [thumb, setThumb] = useState<File | null>(null);

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      setItems(await adminListPithamMedia(kind, token));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    setForm({ title: "", url: "", sort_order: 0, is_active: true });
    setThumb(null);
    setErr("");
    setOpen(true);
  }
  function openEdit(item: PithamMediaItem) {
    setEditing(item);
    setForm({
      title: item.title || "",
      url: item.url || "",
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setThumb(null);
    setErr("");
    setOpen(true);
  }

  async function save() {
    const token = getToken();
    if (!token) return;
    if (!form.url.trim()) {
      setErr(t("pcms.urlRequired"));
      return;
    }
    setErr("");
    setBusy(true);
    try {
      if (editing) {
        await adminUpdatePithamMedia(editing.id, { ...form, image: thumb }, token);
      } else {
        await adminCreatePithamMedia({ kind, ...form, image: thumb }, token);
      }
      notify({ msg: t("pcms.saved"), severity: "success" });
      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.detail || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!del) return;
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await adminDeletePithamMedia(del.id, token);
      notify({ msg: t("pcms.deleted"), severity: "success" });
      setDel(null);
      await load();
    } catch (e: any) {
      notify({ msg: e?.detail || "Delete failed", severity: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <Box className="text-center py-8">
        <CircularProgress />
      </Box>
    );

  const isVideo = kind === "video";
  const addLabel = isVideo ? t("pcms.video.add") : t("pcms.ig.add");
  const editLabel = isVideo ? t("pcms.video.edit") : t("pcms.ig.edit");

  return (
    <>
      <Box className="flex justify-end mb-4">
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          {addLabel}
        </Button>
      </Box>

      {items.length === 0 ? (
        <EmptyState icon={isVideo ? <VideocamIcon /> : <InstagramIcon />} label={t("pcms.empty")} />
      ) : (
        <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {items.map((item) => {
            const yt = isVideo ? youtubeThumb(item.url) : null;
            const igEmbed = !isVideo ? instagramEmbedUrl(item.url) : null;
            const thumbSrc = item.image_path ? fileUrl(item.image_path) : yt;
            return (
              <Paper
                key={item.id}
                elevation={0}
                className={`!rounded-3xl !border !border-brand-sand !overflow-hidden ${
                  item.is_active ? "!opacity-100" : "!opacity-55"
                }`}
              >
                {igEmbed ? (
                  <Box className="relative pt-[125%]">
                    <iframe
                      src={igEmbed}
                      loading="lazy"
                      title={item.title || "Instagram post"}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                      allow="encrypted-media"
                    />
                  </Box>
                ) : thumbSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbSrc}
                    alt={item.title || ""}
                    style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <Box
                    className="aspect-video bg-brand-sand flex items-center justify-center text-brand-maroon"
                  >
                    {isVideo ? (
                      <VideocamIcon className="!text-[48px]" />
                    ) : (
                      <InstagramIcon className="!text-[48px]" />
                    )}
                  </Box>
                )}
                <Box className="p-4">
                  <Box className="flex justify-between items-start gap-2 mb-1">
                    <Typography className="!font-semibold !leading-tight !flex-1">
                      {item.title || "—"}
                    </Typography>
                    <Box className="flex gap-1">
                      <IconButton size="small" onClick={() => openEdit(item)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDel(item)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {item.url && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      className="!block !mb-2 !break-all"
                    >
                      {item.url}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1}>
                    <Chip
                      size="small"
                      label={item.is_active ? t("pcms.active") : t("pcms.inactive")}
                      color={item.is_active ? "success" : "default"}
                      variant="outlined"
                    />
                    <Chip size="small" label={`#${item.sort_order}`} variant="outlined" />
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle className="!font-bold !text-brand-maroon">
          {editing ? editLabel : addLabel}
        </DialogTitle>
        <DialogContent>
          {err && (
            <Alert severity="error" className="!mb-4">
              {err}
            </Alert>
          )}
          <Stack spacing={2.5} className="!mt-2">
            {isVideo && (
              <TextField
                label={t("pcms.video.title")}
                fullWidth
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            )}
            <TextField
              label={isVideo ? t("pcms.video.url") : t("pcms.ig.url")}
              required
              fullWidth
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              helperText={isVideo ? t("pcms.video.urlHelp") : t("pcms.ig.urlHelp")}
            />
            {!isVideo && (
              <TextField
                label={t("pcms.caption")}
                fullWidth
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            )}
            {!isVideo && (() => {
              const preview = instagramEmbedUrl(form.url);
              if (!preview) return null;
              return (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    className="!block !mb-2"
                  >
                    {t("pcms.ig.preview")}
                  </Typography>
                  <Box className="relative pt-[125%] rounded-lg overflow-hidden border border-brand-sand">
                    <iframe
                      src={preview}
                      loading="lazy"
                      title="Instagram preview"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                      allow="encrypted-media"
                    />
                  </Box>
                </Box>
              );
            })()}
            {isVideo && (
              <Box>
                <Stack
                  direction="row"
                  spacing={1.5}
                  useFlexGap
                  className="!items-center !flex-wrap"
                >
                  <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                    {thumb ? thumb.name : t("pcms.video.thumb")}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => setThumb(e.target.files?.[0] || null)}
                    />
                  </Button>
                  {editing?.image_path && !thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileUrl(editing.image_path)}
                      alt="current"
                      style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }}
                    />
                  )}
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  className="!block !mt-1"
                >
                  {t("pcms.video.thumbHelp")}
                </Typography>
              </Box>
            )}
            <TextField
              label={t("pcms.sortOrder")}
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
              helperText={t("pcms.sortHelp")}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
              }
              label={t("pcms.active")}
            />
          </Stack>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setOpen(false)} disabled={busy}>
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={save} disabled={busy}>
            {busy ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={!!del}
        target={del ? { label: del.title || del.url || "" } : null}
        busy={busy}
        onCancel={() => setDel(null)}
        onConfirm={confirmDelete}
        t={t}
      />
    </>
  );
}
