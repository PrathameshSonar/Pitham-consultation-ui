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
  adminLookupUsers,
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
import { useRequireSection } from "@/lib/useRequireSection";

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-12 px-2 sm:px-4";
const CONTAINER_CLASS = "max-w-[1200px] mx-auto w-full";

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
  const gate = useRequireSection("appointments");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
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

  const [detailAppt, setDetailAppt] = useState<any>(null);
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [recordingLink, setRecordingLink] = useState("");
  const [completing, setCompleting] = useState(false);

  const [galleryDocs, setGalleryDocs] = useState<any[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);

  const [usersMap, setUsersMap] = useState<Record<number, any>>({});
  const [assignedDocs, setAssignedDocs] = useState<any[]>([]);

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
    Promise.all([reload(), adminLookupUsers(token, { limit: 200 })])
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
    adminGetGallery(token)
      .then(setGalleryDocs)
      .catch(() => {});
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = appointments.filter((a) => {
      if (tab === 1) return a.status === "completed";
      if (tab === 2) return a.status === "cancelled";
      return a.status !== "completed" && a.status !== "cancelled";
    });
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

  if (gate !== "allowed" || loading) {
    return (
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
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
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Typography
          variant="h4"
          className="!text-brand-maroon !font-bold !mb-4 md:!mb-8 !text-[1.5rem] md:!text-[2.125rem]"
        >
          {t("appts.title")}
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} className="!mb-6">
          <Tab label={t("appts.tab.upcoming")} />
          <Tab label={t("appts.tab.completed")} />
          <Tab label={t("appts.tab.cancelled")} />
        </Tabs>

        <Box className="grid gap-3 md:gap-4 mb-6 items-center grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr] [&_.MuiFormControl-root]:!w-full">
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
          />
          <DatePicker
            label={t("appts.filterDate")}
            value={filterDate}
            onChange={(v) => setFilterDate(v)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: { size: "small" },
              field: { clearable: true },
            }}
          />
          <TextField
            select
            size="small"
            label={t("table.sortBy")}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <MenuItem value="newest">{t("sort.newest")}</MenuItem>
            <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
            <MenuItem value="name">{t("sort.name")}</MenuItem>
          </TextField>
        </Box>

        {filtered.length === 0 ? (
          <Paper elevation={0} className="!p-12 !text-center !rounded-3xl">
            <Typography color="text.secondary">{t("appts.empty")}</Typography>
          </Paper>
        ) : (
          <>
            {paged.map((a: any) => {
              const c = statusChipColors[a.status] || statusChipColors.pending;
              const pc = statusChipColors[a.payment_status] || statusChipColors.pending;
              return (
                <Paper
                  key={a.id}
                  elevation={0}
                  className="!p-4 md:!p-6 !mb-4 !rounded-3xl !border !border-brand-sand !overflow-hidden"
                >
                  <Box className="flex justify-between items-start flex-wrap gap-3">
                    <Box className="min-w-0 flex-1">
                      <Typography className="!font-bold">{a.name}</Typography>
                      {usersMap[a.user_id] && usersMap[a.user_id].name !== a.name && (
                        <Typography variant="caption" color="info.main" className="!font-semibold">
                          {t("appts.bookedBy")}: {usersMap[a.user_id].name}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary" className="!break-words">
                        {a.email} · {a.mobile}
                      </Typography>
                      <Typography variant="body2" className="!mt-2">
                        {a.problem.length > 130 ? a.problem.slice(0, 130) + "…" : a.problem}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        className="!mt-1 !block"
                      >
                        {t("users.dob")}: {a.dob} · {t("users.tob")}: {formatTime12h(a.tob)} ·{" "}
                        {a.birth_place}
                        {" · "}
                        {t("appts.bookedOn")}: {new Date(a.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box className="flex flex-col gap-1.5 items-start sm:items-end shrink-0 w-full sm:w-auto mt-2 sm:mt-0 [&_.MuiChip-root]:!text-[0.7rem] sm:[&_.MuiChip-root]:!text-[0.75rem] [&_.MuiChip-root]:!h-[22px] sm:[&_.MuiChip-root]:!h-6">
                      <Chip
                        label={a.status.replace("_", " ")}
                        size="small"
                        className="!font-semibold !capitalize"
                        style={{ backgroundColor: c.bg, color: c.fg }}
                      />
                      <Chip
                        label={a.payment_status.replace("_", " ")}
                        size="small"
                        className="!font-medium !capitalize"
                        style={{ backgroundColor: pc.bg, color: pc.fg }}
                      />
                    </Box>
                  </Box>

                  {(a.scheduled_date || (a.status !== "completed" && a.zoom_link) || a.recording_link) && (
                    <Box className="mt-4 pt-4 border-t border-dashed border-brand-sand flex gap-3 md:gap-6 flex-wrap items-center">
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
                          className="!p-0 hover:!bg-transparent"
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
                          className="!p-0 hover:!bg-transparent"
                        >
                          {t("appts.watchRecording")}
                        </Button>
                      )}
                    </Box>
                  )}

                  <Box className="mt-4 flex gap-2 flex-wrap">
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
        <DialogTitle className="!font-bold !text-brand-saffron-dark">{modalTitle}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" className="!mb-4">
              {error}
            </Alert>
          )}
          <Stack spacing={2.5} className="!mt-2">
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

                <Box className="flex gap-2 flex-wrap">
                  <TextField
                    label={t("appts.zoomLink")}
                    fullWidth
                    placeholder="https://zoom.us/j/..."
                    value={form.zoom_link}
                    onChange={(e) => set("zoom_link", e.target.value)}
                    className="!flex-1 !min-w-[200px]"
                  />
                  <Button
                    variant="outlined"
                    startIcon={<VideocamIcon />}
                    onClick={handleGenerateZoom}
                    disabled={generatingZoom || !form.scheduled_date || !form.scheduled_time}
                    className="!whitespace-nowrap"
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
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={closeModal}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? t("common.saving") : t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!detailAppt} onClose={closeDetails} fullWidth maxWidth="md">
        <DialogTitle className="!font-bold !text-brand-saffron-dark !flex !items-center !justify-between">
          {t("appts.details")}
          <IconButton onClick={closeDetails} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailAppt && (
            <Stack spacing={2.5}>
              <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("common.name")}
                  </Typography>
                  <Typography className="!font-semibold">{detailAppt.name}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("common.email")}
                  </Typography>
                  <Typography className="!break-words">{detailAppt.email}</Typography>
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

              {usersMap[detailAppt.user_id] && usersMap[detailAppt.user_id].name !== detailAppt.name && (
                <Alert severity="info" className="!py-1">
                  {t("appts.bookedBy")}: <strong>{usersMap[detailAppt.user_id].name}</strong> (
                  {usersMap[detailAppt.user_id].email})
                </Alert>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t("appts.problem")}
                </Typography>
                <Typography className="!whitespace-pre-wrap">{detailAppt.problem}</Typography>
              </Box>

              {detailAppt.selfie_path && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    className="!block !mb-2"
                  >
                    {t("appts.selfie")}
                  </Typography>
                  <Box
                    component="img"
                    src={fileUrl(detailAppt.selfie_path)}
                    alt="selfie"
                    className="!max-w-[260px] !max-h-[260px] !rounded-lg !border !border-[#E8D9BF]"
                  />
                </Box>
              )}

              {detailAppt.scheduled_date && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t("history.dateTime")}
                  </Typography>
                  <Typography className="!font-semibold">
                    {detailAppt.scheduled_date} · {formatTime12h(detailAppt.scheduled_time)}
                  </Typography>
                </Box>
              )}

              <Box className="flex gap-3 flex-wrap">
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

              <Box className="border-t border-dashed border-[#E8D9BF] pt-4">
                <Typography
                  variant="subtitle1"
                  className="!font-bold !mb-3 !text-brand-saffron-dark"
                >
                  {t("appts.analysis")}
                </Typography>

                {detailAppt.analysis_path && (
                  <Box className="mb-4">
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
                      className="!self-start"
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
                    <Typography className="!whitespace-pre-wrap">{detailAppt.analysis_notes}</Typography>
                  </Box>
                )}
              </Box>

              <Box className="border-t border-dashed border-[#E8D9BF] pt-4">
                <Typography
                  variant="subtitle1"
                  className="!font-bold !mb-3 !text-brand-saffron-dark"
                >
                  <PlayCircleIcon className="!align-middle !mr-1" />
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

              <Box className="border-t border-dashed border-[#E8D9BF] pt-4">
                <Typography
                  variant="subtitle1"
                  className="!font-bold !mb-3 !text-brand-saffron-dark"
                >
                  <DescriptionIcon className="!align-middle !mr-1" />
                  {t("appts.sadhnaDocuments")}
                </Typography>

                {detailAppt.status !== "completed" ? (
                  galleryDocs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t("docs.empty.gallery")}
                    </Typography>
                  ) : (
                    <Box className="max-h-[240px] overflow-auto border border-[#E8D9BF] rounded-lg p-2">
                      {galleryDocs.map((doc: any) => (
                        <FormControlLabel
                          key={doc.id}
                          className="!flex !mr-0 !mb-1"
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
                            <Box className="min-w-0">
                              <Typography variant="body2" className="!font-semibold">
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
                  <Box className="flex gap-2 flex-wrap">
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
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={closeDetails}>{t("common.cancel")}</Button>
          {detailAppt && detailAppt.status !== "completed" && detailAppt.status !== "cancelled" && (
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
          <Alert severity={snack.severity} onClose={() => setSnack(null)} className="!w-full">
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
