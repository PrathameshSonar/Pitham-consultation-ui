"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  MenuItem,
  Tabs,
  Tab,
  TablePagination,
  InputAdornment,
  Snackbar,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import VideocamIcon from "@mui/icons-material/Videocam";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import DescriptionIcon from "@mui/icons-material/Description";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import {
  adminGetAppointments,
  adminVerifyPayment,
  adminAssignSlot,
  adminReschedule,
  adminCreateZoomMeeting,
  adminMarkCompleted,
  adminGetGallery,
  adminGetUsers,
  adminGetUserDocuments,
  adminGenerateReceipt,
  adminGenerateInvoice,
  adminCancelAppointment,
  getToken,
  fileUrl,
} from "@/services/api";
import { statusChipColors } from "@/theme/sharedStyles";
import { TIME_SLOTS, formatTime12h } from "@/lib/timeSlots";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

type ModalMode = "verify" | "slot" | "reschedule" | null;
type SortKey = "newest" | "oldest" | "name";

interface SlotForm {
  payment_reference: string;
  scheduled_date: Dayjs | null;
  scheduled_time: string;
  zoom_link: string;
  notes: string;
  reason: string;
}

const EMPTY_FORM: SlotForm = {
  payment_reference: "",
  scheduled_date: null,
  scheduled_time: "",
  zoom_link: "",
  notes: "",
  reason: "",
};

export default function AdminAppointments() {
  const router = useRouter();
  const { t } = useT();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0=upcoming, 1=completed
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  const [selected, setSelected] = useState<any>(null);
  const [mode, setMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<SlotForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatingZoom, setGeneratingZoom] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  // Details dialog (view + complete)
  const [detailAppt, setDetailAppt] = useState<any>(null);
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [completing, setCompleting] = useState(false);

  // Gallery docs for sadhna assignment
  const [galleryDocs, setGalleryDocs] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  // Users map for showing account owner name
  const [usersMap, setUsersMap] = useState<Record<number, any>>({});
  // Assigned docs for completed appointment
  const [assignedDocs, setAssignedDocs] = useState<any[]>([]);

  // Date filter
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);

  function set<K extends keyof SlotForm>(k: K, v: SlotForm[K]) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function reload() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    const data = await adminGetAppointments(token);
    setAppointments(data);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([reload(), adminGetUsers(token)])
      .then(([, users]) => {
        const map: Record<number, any> = {};
        users.forEach((u: any) => {
          map[u.id] = u;
        });
        setUsersMap(map);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openModal(appt: any, m: ModalMode) {
    setSelected(appt);
    setMode(m);
    setForm(EMPTY_FORM);
    setError("");
  }
  function closeModal() {
    setSelected(null);
    setMode(null);
  }

  async function handleGenerateZoom() {
    if (!selected || !form.scheduled_date || !form.scheduled_time) {
      setError("Please pick date & time first");
      return;
    }
    const token = getToken();
    if (!token) return;
    setError("");
    setGeneratingZoom(true);
    try {
      const meeting = await adminCreateZoomMeeting(
        {
          topic: `SPBSP, Ahilyanagar — ${selected.name}`,
          scheduled_date: form.scheduled_date.format("YYYY-MM-DD"),
          scheduled_time: form.scheduled_time,
          duration: 45,
        },
        token,
      );
      set("zoom_link", meeting.join_url);
    } catch (err: any) {
      setError(err?.detail || "Failed to generate Zoom meeting");
    } finally {
      setGeneratingZoom(false);
    }
  }

  async function handleSave() {
    const token = getToken();
    if (!token || !selected) return;
    setError("");
    setSaving(true);
    try {
      if (mode === "verify") {
        await adminVerifyPayment(selected.id, form.payment_reference, token);
      } else if (mode === "slot" || mode === "reschedule") {
        if (!form.scheduled_date || !form.scheduled_time) {
          setError("Please pick date & time");
          setSaving(false);
          return;
        }
        const base = {
          scheduled_date: form.scheduled_date.format("YYYY-MM-DD"),
          scheduled_time: form.scheduled_time,
          zoom_link: form.zoom_link,
        };
        if (mode === "slot") {
          await adminAssignSlot(selected.id, { ...base, notes: form.notes }, token);
        } else {
          await adminReschedule(selected.id, { ...base, reason: form.reason }, token);
        }
      }
      await reload();
      closeModal();
      setSnack({ msg: "Saved successfully", severity: "success" });
    } catch (err: any) {
      setError(err?.detail || "Action failed");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenDetails(appt: any) {
    setDetailAppt(appt);
    setAnalysisFile(null);
    setAnalysisNotes(appt.analysis_notes || "");
    setRecordingLink(appt.recording_link || "");
    setSelectedDocIds([]);
    setAssignedDocs([]);
    setError("");
    const token = getToken();
    if (!token) return;
    // Load gallery docs for sadhna picker
    adminGetGallery(token)
      .then(setGalleryDocs)
      .catch(() => {});
    // Load docs assigned to this user for this consultation
    if (appt.status === "completed") {
      adminGetUserDocuments(appt.user_id, token)
        .then((docs: any[]) => {
          setAssignedDocs(docs.filter((d: any) => d.batch_label === `Consultation #${appt.id}`));
        })
        .catch(() => {});
    }
  }

  function closeDetails() {
    setDetailAppt(null);
    setAnalysisFile(null);
    setAnalysisNotes("");
    setRecordingLink("");
    setSelectedDocIds([]);
  }

  async function handleComplete() {
    const token = getToken();
    if (!token || !detailAppt) return;
    setCompleting(true);
    try {
      await adminMarkCompleted(
        detailAppt.id,
        {
          analysis_notes: analysisNotes,
          analysis_file: analysisFile,
          recording_link: recordingLink,
          gallery_doc_ids: selectedDocIds,
        },
        token,
      );
      await reload();
      closeDetails();
      setSnack({ msg: "Appointment marked as completed", severity: "success" });
    } catch (err: any) {
      setSnack({ msg: err?.detail || "Failed", severity: "error" });
    } finally {
      setCompleting(false);
    }
  }

  // ── Filter/sort/paginate ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const isCompleted = tab === 1;
    let list = appointments.filter((a) =>
      isCompleted ? a.status === "completed" : a.status !== "completed",
    );
    if (q) {
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.mobile || "").includes(q),
      );
    }
    if (filterDate) {
      const fd = filterDate.format("YYYY-MM-DD");
      list = list.filter((a) => a.scheduled_date === fd || a.created_at?.startsWith(fd));
    }
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const ad = new Date(a.created_at).getTime();
      const bd = new Date(b.created_at).getTime();
      return sort === "oldest" ? ad - bd : bd - ad;
    });
    return list;
  }, [appointments, tab, search, sort, filterDate]);

  const paged = filtered.slice(page * rpp, page * rpp + rpp);

  useEffect(() => {
    setPage(0);
  }, [tab, search, sort, filterDate]);

  if (loading) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const modalTitle =
    mode === "verify"
      ? t("appts.modal.verify")
      : mode === "slot"
        ? t("appts.modal.slot")
        : mode === "reschedule"
          ? t("appts.modal.reschedule")
          : "";

  const showSlotFields = mode === "slot" || mode === "reschedule";

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Typography variant="h4" sx={s.title}>
          {t("appts.title")}
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label={t("appts.tab.upcoming")} />
          <Tab label={t("appts.tab.completed")} />
        </Tabs>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            size="small"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <DatePicker
            label={t("appts.filterDate")}
            value={filterDate}
            onChange={(v) => setFilterDate(v)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: { size: "small", sx: { minWidth: 170 } },
              field: { clearable: true },
            }}
          />
          <TextField
            select
            size="small"
            label={t("table.sortBy")}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="newest">{t("sort.newest")}</MenuItem>
            <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
            <MenuItem value="name">{t("sort.name")}</MenuItem>
          </TextField>
        </Box>

        {filtered.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 4 }}>
            <Typography color="text.secondary">{t("appts.empty")}</Typography>
          </Paper>
        ) : (
          <>
            {paged.map((a: any) => {
              const c = statusChipColors[a.status] || statusChipColors.pending;
              const pc = statusChipColors[a.payment_status] || statusChipColors.pending;
              return (
                <Paper key={a.id} elevation={0} sx={s.apptCard}>
                  <Box sx={s.topRow}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 700 }}>{a.name}</Typography>
                      {usersMap[a.user_id] && usersMap[a.user_id].name !== a.name && (
                        <Typography variant="caption" color="info.main" sx={{ fontWeight: 600 }}>
                          {t("appts.bookedBy")}: {usersMap[a.user_id].name}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                        {a.email} · {a.mobile}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {a.problem.length > 130 ? a.problem.slice(0, 130) + "…" : a.problem}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                        {t("users.dob")}: {a.dob} · {t("users.tob")}: {formatTime12h(a.tob)} · {a.birth_place}
                        {" · "}
                        {t("appts.bookedOn")}: {new Date(a.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={s.chipCol}>
                      <Chip
                        label={a.status.replace("_", " ")}
                        size="small"
                        sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600, textTransform: "capitalize" }}
                      />
                      <Chip
                        label={a.payment_status.replace("_", " ")}
                        size="small"
                        sx={{ bgcolor: pc.bg, color: pc.fg, fontWeight: 500, textTransform: "capitalize" }}
                      />
                    </Box>
                  </Box>

                  {(a.scheduled_date || (a.status !== "completed" && a.zoom_link) || a.recording_link) && (
                    <Box sx={s.scheduledBox}>
                      {a.scheduled_date && (
                        <Typography variant="body2">
                          {a.scheduled_date} · {formatTime12h(a.scheduled_time)}
                        </Typography>
                      )}
                      {a.status !== "completed" && a.zoom_link && (
                        <Button
                          component="a"
                          href={a.zoom_link}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          startIcon={<VideoCallIcon />}
                          sx={{ p: 0, "&:hover": { bgcolor: "transparent" } }}
                        >
                          {t("appts.zoomLink")}
                        </Button>
                      )}
                      {a.status === "completed" && a.recording_link && (
                        <Button
                          component="a"
                          href={a.recording_link}
                          target="_blank"
                          rel="noreferrer"
                          size="small"
                          startIcon={<PlayCircleIcon />}
                          sx={{ p: 0, "&:hover": { bgcolor: "transparent" } }}
                        >
                          {t("appts.watchRecording")}
                        </Button>
                      )}
                    </Box>
                  )}

                  <Box sx={s.actions}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleOpenDetails(a)}
                    >
                      {t("appts.viewDetails")}
                    </Button>
                    {a.payment_status === "paid" &&
                      !["completed", "scheduled", "rescheduled", "cancelled"].includes(a.status) && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          onClick={() => openModal(a, "slot")}
                        >
                          {t("appts.assignSlot")}
                        </Button>
                      )}
                    {(a.status === "scheduled" || a.status === "rescheduled") && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() => openModal(a, "reschedule")}
                      >
                        {t("appts.reschedule")}
                      </Button>
                    )}
                  </Box>
                </Paper>
              );
            })}
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rpp}
              onRowsPerPageChange={(e) => {
                setRpp(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage={t("table.rowsPerPage")}
            />
          </>
        )}
      </Box>

      <Dialog open={!!mode} onClose={closeModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: "primary.dark" }}>{modalTitle}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {mode === "verify" && (
              <TextField
                label={t("appts.paymentRef")}
                fullWidth
                placeholder="UTR / Transaction ID"
                value={form.payment_reference}
                onChange={(e) => set("payment_reference", e.target.value)}
              />
            )}

            {showSlotFields && (
              <>
                <DatePicker
                  label={t("common.date")}
                  value={form.scheduled_date}
                  onChange={(v) => set("scheduled_date", v)}
                  format="DD/MM/YYYY"
                  minDate={dayjs()}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <TextField
                  select
                  label={t("appts.timeSlot")}
                  value={form.scheduled_time}
                  onChange={(e) => set("scheduled_time", e.target.value)}
                  fullWidth
                >
                  <MenuItem value="">{t("appts.selectSlot")}</MenuItem>
                  {TIME_SLOTS.map((slot) => (
                    <MenuItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </MenuItem>
                  ))}
                </TextField>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <TextField
                    label={t("appts.zoomLink")}
                    fullWidth
                    placeholder="https://zoom.us/j/..."
                    value={form.zoom_link}
                    onChange={(e) => set("zoom_link", e.target.value)}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<VideocamIcon />}
                    onClick={handleGenerateZoom}
                    disabled={generatingZoom || !form.scheduled_date || !form.scheduled_time}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {generatingZoom ? t("common.saving") : t("appts.zoomGenerate")}
                  </Button>
                </Box>

                {mode === "slot" && (
                  <TextField
                    label={t("appts.notes")}
                    fullWidth
                    multiline
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                  />
                )}
                {mode === "reschedule" && (
                  <TextField
                    label={t("appts.reason")}
                    fullWidth
                    value={form.reason}
                    onChange={(e) => set("reason", e.target.value)}
                  />
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving") : t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detailAppt} onClose={closeDetails} fullWidth maxWidth="md">
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "primary.dark",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {t("appts.details")}
          <IconButton onClick={closeDetails} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailAppt && (
            <Stack spacing={2.5}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("common.name")}
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>{detailAppt.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("common.email")}
                  </Typography>
                  <Typography sx={{ wordBreak: "break-word" }}>{detailAppt.email}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("common.mobile")}
                  </Typography>
                  <Typography>{detailAppt.mobile}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("users.dob")}
                  </Typography>
                  <Typography>{detailAppt.dob}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("users.tob")}
                  </Typography>
                  <Typography>{formatTime12h(detailAppt.tob)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("users.birthPlace")}
                  </Typography>
                  <Typography>{detailAppt.birth_place}</Typography>
                </Box>
              </Box>

              {/* Show account owner if different from appointment name */}
              {usersMap[detailAppt.user_id] && usersMap[detailAppt.user_id].name !== detailAppt.name && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  {t("appts.bookedBy")}: <strong>{usersMap[detailAppt.user_id].name}</strong> (
                  {usersMap[detailAppt.user_id].email})
                </Alert>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("appts.problem")}
                </Typography>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{detailAppt.problem}</Typography>
              </Box>

              {detailAppt.selfie_path && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    {t("appts.selfie")}
                  </Typography>
                  <Box
                    component="img"
                    src={fileUrl(detailAppt.selfie_path)}
                    alt="selfie"
                    sx={{
                      maxWidth: 260,
                      maxHeight: 260,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                </Box>
              )}

              {detailAppt.scheduled_date && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("history.dateTime")}
                  </Typography>
                  <Typography sx={{ fontWeight: 600 }}>
                    {detailAppt.scheduled_date} · {formatTime12h(detailAppt.scheduled_time)}
                  </Typography>
                </Box>
              )}

              {/* ── Receipt PDF ── */}
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {detailAppt.receipt_path ? (
                  <Button
                    component="a"
                    href={fileUrl(detailAppt.receipt_path)}
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                    size="small"
                    startIcon={<PictureAsPdfIcon />}
                  >
                    {t("appts.downloadReceipt")}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={async () => {
                      const token = getToken();
                      if (!token) return;
                      try {
                        await adminGenerateReceipt(detailAppt.id, token);
                        await reload();
                        // Refresh detailAppt
                        const updated = appointments.find((a: any) => a.id === detailAppt.id);
                        if (updated) setDetailAppt(updated);
                        setSnack({ msg: t("appts.receiptGenerated"), severity: "success" });
                      } catch (err: any) {
                        setSnack({ msg: err?.detail || "Failed", severity: "error" });
                      }
                    }}
                  >
                    {t("appts.generateReceipt")}
                  </Button>
                )}

                {/* CA Invoice / Bill Receipt */}
                <Button
                  variant="outlined"
                  size="small"
                  color="secondary"
                  startIcon={<ReceiptLongIcon />}
                  onClick={async () => {
                    const token = getToken();
                    if (!token) return;
                    try {
                      const res = await adminGenerateInvoice(detailAppt.id, token);
                      if (res.invoice_path) {
                        window.open(fileUrl(res.invoice_path), "_blank");
                      }
                      setSnack({ msg: t("appts.invoiceGenerated"), severity: "success" });
                    } catch (err: any) {
                      setSnack({ msg: err?.detail || "Failed", severity: "error" });
                    }
                  }}
                >
                  {t("appts.downloadInvoice")}
                </Button>
              </Box>

              {/* ── Analysis Section ── */}
              <Box sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "primary.dark" }}>
                  {t("appts.analysis")}
                </Typography>

                {detailAppt.analysis_path && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      component="a"
                      href={fileUrl(detailAppt.analysis_path)}
                      target="_blank"
                      rel="noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                    >
                      {t("appts.viewAnalysis")}
                    </Button>
                  </Box>
                )}

                {detailAppt.status !== "completed" && (
                  <Stack spacing={2}>
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {analysisFile ? analysisFile.name : t("appts.analysisUpload")}
                      <input
                        type="file"
                        hidden
                        accept="image/*,application/pdf"
                        onChange={(e) => setAnalysisFile(e.target.files?.[0] || null)}
                      />
                    </Button>
                    <TextField
                      label={t("appts.analysisNotes")}
                      fullWidth
                      multiline
                      rows={3}
                      value={analysisNotes}
                      onChange={(e) => setAnalysisNotes(e.target.value)}
                    />
                  </Stack>
                )}

                {detailAppt.status === "completed" && detailAppt.analysis_notes && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t("appts.analysisNotes")}
                    </Typography>
                    <Typography sx={{ whiteSpace: "pre-wrap" }}>{detailAppt.analysis_notes}</Typography>
                  </Box>
                )}
              </Box>

              {/* ── Recording Link Section ── */}
              <Box sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "primary.dark" }}>
                  <PlayCircleIcon sx={{ verticalAlign: "middle", mr: 0.5 }} />
                  {t("appts.recording")}
                </Typography>

                {detailAppt.recording_link && detailAppt.status === "completed" ? (
                  <Button
                    component="a"
                    href={detailAppt.recording_link}
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                    size="small"
                    startIcon={<PlayCircleIcon />}
                  >
                    {t("appts.watchRecording")}
                  </Button>
                ) : detailAppt.status !== "completed" ? (
                  <TextField
                    label={t("appts.recordingLink")}
                    fullWidth
                    placeholder="https://zoom.us/rec/..."
                    value={recordingLink}
                    onChange={(e) => setRecordingLink(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                ) : null}
              </Box>

              {/* ── Sadhna Documents Section ── */}
              <Box sx={{ borderTop: "1px dashed", borderColor: "divider", pt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: "primary.dark" }}>
                  <DescriptionIcon sx={{ verticalAlign: "middle", mr: 0.5 }} />
                  {t("appts.sadhnaDocuments")}
                </Typography>

                {detailAppt.status !== "completed" ? (
                  galleryDocs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t("docs.empty.gallery")}
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        maxHeight: 240,
                        overflow: "auto",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 1,
                      }}
                    >
                      {galleryDocs.map((doc: any) => (
                        <FormControlLabel
                          key={doc.id}
                          sx={{ display: "flex", mr: 0, mb: 0.5 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={selectedDocIds.includes(doc.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocIds((prev) => [...prev, doc.id]);
                                } else {
                                  setSelectedDocIds((prev) => prev.filter((id) => id !== doc.id));
                                }
                              }}
                            />
                          }
                          label={
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {doc.title}
                              </Typography>
                              {doc.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {doc.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      ))}
                    </Box>
                  )
                ) : assignedDocs.length > 0 ? (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {assignedDocs.map((doc: any) => (
                      <Button
                        key={doc.id}
                        component="a"
                        href={fileUrl(doc.file_path)}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        size="small"
                        startIcon={<DescriptionIcon />}
                      >
                        {doc.title}
                      </Button>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("appts.noDocsAssigned")}
                  </Typography>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDetails}>{t("common.cancel")}</Button>
          {detailAppt && detailAppt.status !== "completed" && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={handleComplete}
              disabled={completing}
            >
              {completing ? t("common.saving") : t("appts.markCompleted")}
            </Button>
          )}
          {detailAppt && detailAppt.status !== "completed" && detailAppt.status !== "cancelled" && (
            <Button
              variant="outlined"
              color="error"
              onClick={async () => {
                if (!confirm(t("appts.adminCancelConfirm"))) return;
                const token = getToken();
                if (!token) return;
                try {
                  await adminCancelAppointment(detailAppt.id, token);
                  await reload();
                  closeDetails();
                  setSnack({ msg: t("appts.adminCancelled"), severity: "success" });
                } catch (err: any) {
                  setSnack({ msg: err?.detail || "Failed", severity: "error" });
                }
              }}
            >
              {t("appts.adminCancel")}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
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
