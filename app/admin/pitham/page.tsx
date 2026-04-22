"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box, Paper, Typography, TextField, Button, Stack, IconButton, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Alert, Snackbar, Chip, Switch, FormControlLabel, MenuItem,
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
  getToken, fileUrl, isSuperAdmin,
  adminGetEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent,
  adminListPithamMedia, adminCreatePithamMedia, adminUpdatePithamMedia, adminDeletePithamMedia,
  adminListTestimonials, adminCreateTestimonial, adminUpdateTestimonial, adminDeleteTestimonial,
  type EventItem, type PithamMediaItem, type PithamMediaKind, type TestimonialItem,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";
import * as s from "../styles";

type TabKey = "banners" | "events" | "gallery" | "testimonials" | "videos" | "instagram";

const TAB_ORDER: TabKey[] = ["banners", "events", "gallery", "testimonials", "videos", "instagram"];

function youtubeThumb(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&?\/\s]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export default function AdminPithamCms() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useT();

  const initialTab = (params.get("tab") as TabKey) || "banners";
  const [tab, setTab] = useState<TabKey>(TAB_ORDER.includes(initialTab) ? initialTab : "banners");

  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    if (!isSuperAdmin()) { setForbidden(true); }
  }, [router]);

  function changeTab(next: TabKey) {
    setTab(next);
    const sp = new URLSearchParams(params.toString());
    sp.set("tab", next);
    router.replace(`/admin/pitham?${sp.toString()}`);
  }

  if (forbidden) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Alert severity="warning" sx={{ maxWidth: 480 }}>
          Only super admins can manage the Pitham page. Moderators do not have access to this section.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={s.headerTitle}>{t("pcms.title")}</Typography>
          <Typography sx={s.headerSubtitle}>{t("pcms.subtitle")}</Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => changeTab(v as TabKey)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab value="banners"      label={t("pcms.tab.banners")} />
          <Tab value="events"       label={t("pcms.tab.events")} />
          <Tab value="gallery"      label={t("pcms.tab.gallery")} />
          <Tab value="testimonials" label={t("pcms.tab.testimonials")} />
          <Tab value="videos"       label={t("pcms.tab.videos")} />
          <Tab value="instagram"    label={t("pcms.tab.instagram")} />
        </Tabs>

        {tab === "banners"      && <ImageUploadPanel kind="banner"  notify={setSnack} />}
        {tab === "events"       && <EventsPanel notify={setSnack} />}
        {tab === "gallery"      && <ImageUploadPanel kind="gallery" notify={setSnack} />}
        {tab === "testimonials" && <TestimonialsPanel notify={setSnack} />}
        {tab === "videos"       && <MediaPanel kind="video" notify={setSnack} />}
        {tab === "instagram"    && <MediaPanel kind="instagram" notify={setSnack} />}
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}

type Notify = (n: { msg: string; severity: "success" | "error" } | null) => void;

// ─────────────────────────────────────────────────────────────────────────────
// Empty state + delete confirm helpers
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <Paper elevation={0} sx={{ p: 5, borderRadius: 4, border: `1px dashed ${brandColors.sand}`, textAlign: "center" }}>
      <Box sx={{ color: brandColors.sand, mb: 1, "& svg": { fontSize: 56 } }}>{icon}</Box>
      <Typography color="text.secondary">{label}</Typography>
    </Paper>
  );
}

function DeleteDialog({
  open, target, busy, onCancel, onConfirm, t: tFn,
}: { open: boolean; target: { label: string } | null; busy: boolean; onCancel: () => void; onConfirm: () => void; t: (k: any) => string }) {
  return (
    <Dialog open={open} onClose={() => !busy && onCancel()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>{tFn("common.delete")}</DialogTitle>
      <DialogContent>
        <Typography>{tFn("pcms.deleteConfirm")}</Typography>
        {target && (
          <Paper elevation={0} sx={{ mt: 2, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Typography sx={{ fontWeight: 600 }}>{target.label}</Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={busy}>{tFn("common.cancel")}</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={busy}>
          {busy ? tFn("common.saving") : tFn("common.delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Image upload panel — reused for banners and gallery (kind prop)
// ─────────────────────────────────────────────────────────────────────────────

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
    try { setItems(await adminListPithamMedia(kind, token)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null); setTitle(""); setSortOrder(0); setIsActive(true); setFile(null); setErr(""); setOpen(true);
  }
  function openEdit(item: PithamMediaItem) {
    setEditing(item); setTitle(item.title || ""); setSortOrder(item.sort_order); setIsActive(item.is_active); setFile(null); setErr(""); setOpen(true);
  }

  async function save() {
    const token = getToken();
    if (!token) return;
    if (!editing && !file) { setErr(t("pcms.banner.imgRequired")); return; }
    setErr(""); setBusy(true);
    try {
      if (editing) {
        await adminUpdatePithamMedia(editing.id, { title, sort_order: sortOrder, is_active: isActive, image: file }, token);
      } else {
        await adminCreatePithamMedia({ kind, title, sort_order: sortOrder, is_active: isActive, image: file }, token);
      }
      notify({ msg: t("pcms.saved"), severity: "success" });
      setOpen(false);
      await load();
    } catch (e: any) {
      setErr(e?.detail || "Save failed");
    } finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!del) return;
    const token = getToken(); if (!token) return;
    setBusy(true);
    try {
      await adminDeletePithamMedia(del.id, token);
      notify({ msg: t("pcms.deleted"), severity: "success" });
      setDel(null); await load();
    } catch (e: any) { notify({ msg: e?.detail || "Delete failed", severity: "error" }); }
    finally { setBusy(false); }
  }

  if (loading) return <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{addLabel}</Button>
      </Box>

      {items.length === 0 ? (
        <EmptyState icon={emptyIcon} label={t("pcms.empty")} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {items.map(item => (
            <Paper key={item.id} elevation={0} sx={{ borderRadius: 4, border: `1px solid ${brandColors.sand}`, overflow: "hidden", opacity: item.is_active ? 1 : 0.55 }}>
              {item.image_path && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(item.image_path)} alt={item.title || kind} style={{ width: "100%", aspectRatio: isBanner ? "16/9" : "4/3", objectFit: "cover", display: "block" }} />
              )}
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{item.title || "—"}</Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton size="small" onClick={() => openEdit(item)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDel(item)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip size="small" label={item.is_active ? t("pcms.active") : t("pcms.inactive")} color={item.is_active ? "success" : "default"} variant="outlined" />
                  <Chip size="small" label={`#${item.sort_order}`} variant="outlined" />
                </Stack>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: brandColors.maroon }}>
          {editing ? editLabel : addLabel}
        </DialogTitle>
        <DialogContent>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ alignSelf: "flex-start" }}>
              {file ? file.name : (editing ? t("events.replaceImage") : t("events.uploadImage"))}
              <input hidden type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
            </Button>
            {editing?.image_path && !file && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(editing.image_path)} alt="current" style={{ maxWidth: 320, borderRadius: 8 }} />
            )}
            <TextField label={t("pcms.caption")} value={title} onChange={e => setTitle(e.target.value)} fullWidth />
            <TextField label={t("pcms.sortOrder")} type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value) || 0)} helperText={t("pcms.sortHelp")} />
            <FormControlLabel control={<Switch checked={isActive} onChange={e => setIsActive(e.target.checked)} />} label={t("pcms.active")} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={busy}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={save} disabled={busy}>{busy ? t("common.saving") : t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog open={!!del} target={del ? { label: del.title || `(untitled ${kind})` } : null} busy={busy} onCancel={() => setDel(null)} onConfirm={confirmDelete} t={t} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Events panel (CRUD with image upload + featured flag)
// ─────────────────────────────────────────────────────────────────────────────

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
    title: "", description: "", event_date: "", event_time: "", location: "", image_url: "", is_featured: false,
  });
  const [imgFile, setImgFile] = useState<File | null>(null);

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try { setItems(await adminGetEvents(token)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", event_date: "", event_time: "", location: "", image_url: "", is_featured: false });
    setImgFile(null); setErr(""); setOpen(true);
  }
  function openEdit(item: EventItem) {
    setEditing(item);
    setForm({
      title: item.title, description: item.description || "", event_date: item.event_date,
      event_time: item.event_time || "", location: item.location || "",
      image_url: item.image_url && !item.image_url.startsWith("uploads/") ? item.image_url : "",
      is_featured: !!item.is_featured,
    });
    setImgFile(null); setErr(""); setOpen(true);
  }

  async function save() {
    const token = getToken(); if (!token) return;
    if (!form.title.trim()) { setErr(t("events.titleRequired")); return; }
    if (!form.event_date) { setErr(t("events.dateRequired")); return; }
    setErr(""); setBusy(true);
    try {
      const payload = { ...form, image: imgFile };
      if (editing) await adminUpdateEvent(editing.id, payload, token);
      else await adminCreateEvent(payload, token);
      notify({ msg: t("pcms.saved"), severity: "success" });
      setOpen(false); await load();
    } catch (e: any) { setErr(e?.detail || "Save failed"); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!del) return;
    const token = getToken(); if (!token) return;
    setBusy(true);
    try {
      await adminDeleteEvent(del.id, token);
      notify({ msg: t("pcms.deleted"), severity: "success" });
      setDel(null); await load();
    } catch (e: any) { notify({ msg: e?.detail || "Delete failed", severity: "error" }); }
    finally { setBusy(false); }
  }

  async function toggleFeatured(item: EventItem) {
    const token = getToken(); if (!token) return;
    try {
      await adminUpdateEvent(item.id, { is_featured: !item.is_featured }, token);
      await load();
    } catch (e: any) { notify({ msg: e?.detail || "Update failed", severity: "error" }); }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = useMemo(() => items.filter(e => e.event_date >= today).sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.event_date.localeCompare(b.event_date)), [items, today]);
  const past = useMemo(() => items.filter(e => e.event_date < today).sort((a, b) => b.event_date.localeCompare(a.event_date)), [items, today]);
  const visible = tab === 0 ? upcoming : past;

  if (loading) return <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`${t("events.upcoming")} (${upcoming.length})`} />
          <Tab label={`${t("events.past")} (${past.length})`} />
        </Tabs>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t("events.create")}</Button>
      </Box>

      {visible.length === 0 ? (
        <EmptyState icon={<EventNoteIcon />} label={t("events.empty")} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
          {visible.map(ev => (
            <Paper key={ev.id} elevation={0} sx={{
              p: 2.5, borderRadius: 4, display: "flex", gap: 2, alignItems: "flex-start",
              border: ev.is_featured ? `2px solid ${brandColors.gold}` : `1px solid ${brandColors.sand}`,
              bgcolor: ev.is_featured ? `${brandColors.gold}08` : "background.paper",
              position: "relative",
            }}>
              {ev.is_featured && (
                <Chip
                  icon={<StarIcon />}
                  label={t("events.featuredBadge")}
                  size="small"
                  sx={{ position: "absolute", top: 12, right: 12, bgcolor: brandColors.gold, color: "#fff", fontWeight: 700 }}
                />
              )}
              {ev.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ev.image_url.startsWith("http") ? ev.image_url : fileUrl(ev.image_url)} alt={ev.title}
                  style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, flexShrink: 0 }} />
              )}
              <Box sx={{ flex: 1, minWidth: 0, pr: ev.is_featured ? 9 : 0 }}>
                <Typography sx={{ fontWeight: 700, color: brandColors.maroon, lineHeight: 1.3, mb: 1 }}>{ev.title}</Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 1 }}>
                  <Chip icon={<CalendarMonthIcon />} label={ev.event_date} size="small" variant="outlined" />
                  {ev.event_time && <Chip icon={<AccessTimeIcon />} label={ev.event_time} size="small" variant="outlined" />}
                  {ev.location && <Chip icon={<LocationOnIcon />} label={ev.location} size="small" variant="outlined" />}
                </Stack>
                {ev.description && <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 1 }}>{ev.description}</Typography>}
                <Box sx={{ display: "flex", gap: 0.5, mt: 1 }}>
                  <IconButton size="small" onClick={() => toggleFeatured(ev)} title={t("events.featured")}>
                    {ev.is_featured ? <StarIcon fontSize="small" sx={{ color: brandColors.gold }} /> : <StarBorderIcon fontSize="small" />}
                  </IconButton>
                  <IconButton size="small" onClick={() => openEdit(ev)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => setDel(ev)}><DeleteIcon fontSize="small" /></IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: brandColors.maroon }}>{editing ? t("events.edit") : t("events.create")}</DialogTitle>
        <DialogContent>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label={t("events.eventTitle")} required fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField label={t("events.eventDate")} type="date" required fullWidth value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label={t("events.eventTime")} type="time" fullWidth value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
            </Box>
            <TextField label={t("events.location")} fullWidth value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <TextField label={t("events.description")} multiline rows={4} fullWidth value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{t("events.image")}</Typography>
              <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                  {imgFile ? imgFile.name : t("events.uploadImage")}
                  <input hidden type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] || null)} />
                </Button>
                {editing?.image_url && !imgFile && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.image_url.startsWith("http") ? editing.image_url : fileUrl(editing.image_url)} alt="current" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                )}
              </Stack>
              <TextField label={t("events.imageUrl")} fullWidth size="small" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} sx={{ mt: 1.5 }} helperText={t("events.imageOrUrl")} />
            </Box>
            <FormControlLabel control={<Switch checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />} label={t("events.featured")} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={busy}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={save} disabled={busy}>{busy ? t("common.saving") : t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog open={!!del} target={del ? { label: `${del.title} (${del.event_date})` } : null} busy={busy} onCancel={() => setDel(null)} onConfirm={confirmDelete} t={t} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Testimonials panel
// ─────────────────────────────────────────────────────────────────────────────

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
    const token = getToken(); if (!token) return;
    setLoading(true);
    try { setItems(await adminListTestimonials(token)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null); setForm({ name: "", location: "", quote: "", sort_order: 0, is_active: true });
    setPhoto(null); setErr(""); setOpen(true);
  }
  function openEdit(item: TestimonialItem) {
    setEditing(item);
    setForm({ name: item.name, location: item.location || "", quote: item.quote, sort_order: item.sort_order, is_active: item.is_active });
    setPhoto(null); setErr(""); setOpen(true);
  }

  async function save() {
    const token = getToken(); if (!token) return;
    if (!form.name.trim() || !form.quote.trim()) { setErr(t("pcms.test.required")); return; }
    setErr(""); setBusy(true);
    try {
      if (editing) await adminUpdateTestimonial(editing.id, { ...form, photo }, token);
      else await adminCreateTestimonial({ ...form, photo }, token);
      notify({ msg: t("pcms.saved"), severity: "success" });
      setOpen(false); await load();
    } catch (e: any) { setErr(e?.detail || "Save failed"); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!del) return;
    const token = getToken(); if (!token) return;
    setBusy(true);
    try {
      await adminDeleteTestimonial(del.id, token);
      notify({ msg: t("pcms.deleted"), severity: "success" });
      setDel(null); await load();
    } catch (e: any) { notify({ msg: e?.detail || "Delete failed", severity: "error" }); }
    finally { setBusy(false); }
  }

  if (loading) return <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>;

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{t("pcms.test.add")}</Button>
      </Box>

      {items.length === 0 ? (
        <EmptyState icon={<FormatQuoteIcon />} label={t("pcms.empty")} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
          {items.map(item => (
            <Paper key={item.id} elevation={0} sx={{ p: 2.5, borderRadius: 4, border: `1px solid ${brandColors.sand}`, opacity: item.is_active ? 1 : 0.55 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                {item.photo_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl(item.photo_path)} alt={item.name} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%", flexShrink: 0 }} />
                ) : (
                  <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: brandColors.sand, display: "flex", alignItems: "center", justifyContent: "center", color: brandColors.maroon, fontWeight: 700, fontSize: "1.5rem", flexShrink: 0 }}>
                    {item.name.charAt(0).toUpperCase()}
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                      {item.location && <Typography variant="caption" color="text.secondary">{item.location}</Typography>}
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(item)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDel(item)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6, fontStyle: "italic" }}>"{item.quote}"</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Chip size="small" label={item.is_active ? t("pcms.active") : t("pcms.inactive")} color={item.is_active ? "success" : "default"} variant="outlined" />
                    <Chip size="small" label={`#${item.sort_order}`} variant="outlined" />
                  </Stack>
                </Box>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: brandColors.maroon }}>{editing ? t("pcms.test.edit") : t("pcms.test.add")}</DialogTitle>
        <DialogContent>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label={t("pcms.test.name")} required fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label={t("pcms.test.location")} fullWidth value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <TextField label={t("pcms.test.quote")} required multiline rows={4} fullWidth value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                {photo ? photo.name : t("pcms.test.photo")}
                <input hidden type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
              </Button>
              {editing?.photo_path && !photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(editing.photo_path)} alt="current" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "50%" }} />
              )}
            </Stack>
            <TextField label={t("pcms.sortOrder")} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) || 0 }))} helperText={t("pcms.sortHelp")} />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />} label={t("pcms.active")} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={busy}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={save} disabled={busy}>{busy ? t("common.saving") : t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog open={!!del} target={del ? { label: del.name } : null} busy={busy} onCancel={() => setDel(null)} onConfirm={confirmDelete} t={t} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generic media panel (videos / instagram)
// ─────────────────────────────────────────────────────────────────────────────

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
    const token = getToken(); if (!token) return;
    setLoading(true);
    try { setItems(await adminListPithamMedia(kind, token)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setEditing(null); setForm({ title: "", url: "", sort_order: 0, is_active: true }); setThumb(null); setErr(""); setOpen(true);
  }
  function openEdit(item: PithamMediaItem) {
    setEditing(item); setForm({ title: item.title || "", url: item.url || "", sort_order: item.sort_order, is_active: item.is_active });
    setThumb(null); setErr(""); setOpen(true);
  }

  async function save() {
    const token = getToken(); if (!token) return;
    if (!form.url.trim()) { setErr(t("pcms.urlRequired")); return; }
    setErr(""); setBusy(true);
    try {
      if (editing) {
        await adminUpdatePithamMedia(editing.id, { ...form, image: thumb }, token);
      } else {
        await adminCreatePithamMedia({ kind, ...form, image: thumb }, token);
      }
      notify({ msg: t("pcms.saved"), severity: "success" });
      setOpen(false); await load();
    } catch (e: any) { setErr(e?.detail || "Save failed"); }
    finally { setBusy(false); }
  }

  async function confirmDelete() {
    if (!del) return;
    const token = getToken(); if (!token) return;
    setBusy(true);
    try {
      await adminDeletePithamMedia(del.id, token);
      notify({ msg: t("pcms.deleted"), severity: "success" });
      setDel(null); await load();
    } catch (e: any) { notify({ msg: e?.detail || "Delete failed", severity: "error" }); }
    finally { setBusy(false); }
  }

  if (loading) return <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress /></Box>;

  const isVideo = kind === "video";
  const addLabel = isVideo ? t("pcms.video.add") : t("pcms.ig.add");
  const editLabel = isVideo ? t("pcms.video.edit") : t("pcms.ig.edit");

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>{addLabel}</Button>
      </Box>

      {items.length === 0 ? (
        <EmptyState icon={isVideo ? <VideocamIcon /> : <InstagramIcon />} label={t("pcms.empty")} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {items.map(item => {
            const yt = isVideo ? youtubeThumb(item.url) : null;
            const thumbSrc = item.image_path ? fileUrl(item.image_path) : yt;
            return (
              <Paper key={item.id} elevation={0} sx={{ borderRadius: 4, border: `1px solid ${brandColors.sand}`, overflow: "hidden", opacity: item.is_active ? 1 : 0.55 }}>
                {thumbSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbSrc} alt={item.title || ""} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                ) : (
                  <Box sx={{ aspectRatio: "16/9", bgcolor: brandColors.sand, display: "flex", alignItems: "center", justifyContent: "center", color: brandColors.maroon }}>
                    {isVideo ? <VideocamIcon sx={{ fontSize: 48 }} /> : <InstagramIcon sx={{ fontSize: 48 }} />}
                  </Box>
                )}
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{item.title || "—"}</Typography>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(item)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => setDel(item)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  {item.url && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, wordBreak: "break-all" }}>{item.url}</Typography>
                  )}
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={item.is_active ? t("pcms.active") : t("pcms.inactive")} color={item.is_active ? "success" : "default"} variant="outlined" />
                    <Chip size="small" label={`#${item.sort_order}`} variant="outlined" />
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: brandColors.maroon }}>{editing ? editLabel : addLabel}</DialogTitle>
        <DialogContent>
          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {isVideo && (
              <TextField label={t("pcms.video.title")} fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            )}
            <TextField
              label={isVideo ? t("pcms.video.url") : t("pcms.ig.url")}
              required fullWidth
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              helperText={isVideo ? t("pcms.video.urlHelp") : t("pcms.ig.urlHelp")}
            />
            {!isVideo && (
              <TextField label={t("pcms.caption")} fullWidth value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            )}
            {isVideo && (
              <Box>
                <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Button component="label" size="small" variant="outlined" startIcon={<CloudUploadIcon />}>
                    {thumb ? thumb.name : t("pcms.video.thumb")}
                    <input hidden type="file" accept="image/*" onChange={e => setThumb(e.target.files?.[0] || null)} />
                  </Button>
                  {editing?.image_path && !thumb && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={fileUrl(editing.image_path)} alt="current" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{t("pcms.video.thumbHelp")}</Typography>
              </Box>
            )}
            <TextField label={t("pcms.sortOrder")} type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) || 0 }))} helperText={t("pcms.sortHelp")} />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />} label={t("pcms.active")} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} disabled={busy}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={save} disabled={busy}>{busy ? t("common.saving") : t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog open={!!del} target={del ? { label: del.title || del.url || "" } : null} busy={busy} onCancel={() => setDel(null)} onConfirm={confirmDelete} t={t} />
    </>
  );
}
