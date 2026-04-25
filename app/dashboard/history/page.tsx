"use client";

import { memo, useCallback, useState } from "react";
import Link from "next/link";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Rating,
  TextField,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import DescriptionIcon from "@mui/icons-material/Description";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PaymentIcon from "@mui/icons-material/Payment";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CancelIcon from "@mui/icons-material/Cancel";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyAppointments,
  getMyDocuments,
  initiatePhonePePayment,
  getPublicSettings,
  generateReceipt,
  generateInvoice,
  cancelAppointment,
  getMyFeedback,
  submitFeedback,
  getToken,
  fileUrl,
} from "@/services/api";
import { useAuthQuery, usePublicQuery } from "@/services/queryHooks";
import { statusChipColors } from "@/theme/sharedStyles";
import { formatAppointmentDateTime } from "@/lib/timeSlots";
import { useT } from "@/i18n/I18nProvider";

const WRAPPER_CLASS =
  "min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-12 px-2 sm:px-4";
const CONTAINER_CLASS = "max-w-[900px] mx-auto w-full";

interface Appointment {
  id: number;
  name: string;
  problem: string;
  status: string;
  payment_status: string;
  receipt_path?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  zoom_link?: string | null;
  analysis_path?: string | null;
  recording_link?: string | null;
  analysis_notes?: string | null;
  created_at: string;
}

interface Doc {
  id: number;
  title: string;
  file_path: string;
  batch_label?: string | null;
}

const STEPS = ["booked", "paid", "scheduled", "completed"] as const;

function downloadIcs(a: Appointment) {
  if (!a.scheduled_date) return;
  const dtStart = `${a.scheduled_date.replace(/-/g, "")}T${(a.scheduled_time || "00:00").replace(/:/g, "")}00`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SPBSP//Consultation//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    "DURATION:PT45M",
    "SUMMARY:SPBSP, Ahilyanagar — Consultation",
    `DESCRIPTION:${(a.problem || "").slice(0, 200).replace(/\n/g, "\\n")}`,
    `LOCATION:${a.zoom_link || "Zoom"}`,
    a.zoom_link ? `URL:${a.zoom_link}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `consultation_${a.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

interface RowProps {
  a: Appointment;
  consultationDocs: Doc[];
  fee: number;
  t: (k: any) => string;
}

const AppointmentRow = memo(function AppointmentRow({ a, consultationDocs, fee, t }: RowProps) {
  const qc = useQueryClient();
  const c = statusChipColors[a.status] || statusChipColors.pending;

  const payMutation = useMutation({
    mutationFn: () => initiatePhonePePayment({ appointment_id: a.id, amount: fee }, getToken()),
    onSuccess: (payment) => {
      if (payment.redirect_url) window.location.href = payment.redirect_url;
    },
    onError: () => {},
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelAppointment(a.id, getToken()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-appointments"] }),
    onError: () => alert(t("appts.cancelFailed")),
  });

  const generateReceiptMutation = useMutation({
    mutationFn: () => generateReceipt(a.id, getToken()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-appointments"] }),
    onError: () => alert("Receipt generation failed. Please try again."),
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => generateInvoice(a.id, getToken()),
    onSuccess: (res: any) => {
      if (res?.invoice_path) window.open(fileUrl(res.invoice_path), "_blank");
    },
    onError: () => alert("Invoice generation failed. Please try again."),
  });

  const onCancel = useCallback(() => {
    if (confirm(t("appts.cancelConfirm"))) cancelMutation.mutate();
  }, [cancelMutation, t]);

  const onIcs = useCallback(() => downloadIcs(a), [a]);

  return (
    <Paper
      elevation={0}
      className="!p-4 md:!p-6 !mb-4 !rounded-3xl !border !border-brand-sand !transition-all !duration-200 !overflow-hidden hover:!shadow-[0_8px_25px_rgba(230,81,0,0.08)]"
    >
      <Box className="flex justify-between items-start flex-wrap gap-2">
        <Box>
          <Typography className="!font-bold !text-brand-maroon !break-words">{a.name}</Typography>
          <Typography variant="body2" color="text.secondary" className="!mt-1">
            {a.problem.length > 120 ? a.problem.slice(0, 120) + "…" : a.problem}
          </Typography>
        </Box>
        <Chip
          label={a.status.replace("_", " ")}
          size="small"
          className="!font-semibold !capitalize"
          style={{ backgroundColor: c.bg, color: c.fg }}
        />
      </Box>

      <Box className="flex gap-1 mt-3 flex-wrap">
        {STEPS.map((step) => {
          const done =
            step === "booked"
              ? true
              : step === "paid"
                ? a.payment_status === "paid"
                : step === "scheduled"
                  ? ["scheduled", "rescheduled", "completed"].includes(a.status)
                  : a.status === "completed";
          return (
            <Chip
              key={step}
              label={step}
              size="small"
              variant={done ? "filled" : "outlined"}
              color={done ? "success" : "default"}
              className="!capitalize !text-[0.7rem]"
            />
          );
        })}
      </Box>

      {a.payment_status !== "paid" && a.status !== "completed" && a.status !== "cancelled" && (
        <Box className="mt-3 flex gap-2 flex-wrap">
          <Button
            variant="contained"
            size="small"
            color="warning"
            startIcon={<PaymentIcon />}
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending}
          >
            {t("payment.completePayment")}
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<CancelIcon />}
            onClick={onCancel}
            disabled={cancelMutation.isPending}
          >
            {t("appts.cancel")}
          </Button>
        </Box>
      )}

      {a.status === "cancelled" && (
        <Box className="mt-3 p-3 rounded-lg bg-[rgba(198,40,40,0.06)] border border-[#ef9a9a] flex items-center gap-2">
          <CancelIcon fontSize="small" color="error" />
          <Typography variant="body2" className="!font-semibold !text-brand-error">
            {t("appts.cancelledNotice")}
          </Typography>
        </Box>
      )}

      {a.payment_status === "paid" && (
        <Box className="mt-3">
          {a.receipt_path ? (
            <Button
              component="a"
              href={fileUrl(a.receipt_path)}
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
              onClick={() => generateReceiptMutation.mutate()}
              disabled={generateReceiptMutation.isPending}
            >
              {t("appts.generateReceipt")}
            </Button>
          )}
          <Button
            variant="outlined"
            size="small"
            color="secondary"
            startIcon={<ReceiptLongIcon />}
            onClick={() => generateInvoiceMutation.mutate()}
            disabled={generateInvoiceMutation.isPending}
          >
            {t("appts.downloadInvoice")}
          </Button>
        </Box>
      )}

      {(a.scheduled_date || a.zoom_link) && (
        <Box className="mt-4 pt-4 border-t border-dashed border-brand-sand grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-3">
          {a.scheduled_date && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("history.dateTime")}
              </Typography>
              <Box className="flex items-center gap-2 flex-wrap">
                <Typography variant="body2" className="!font-semibold">
                  {formatAppointmentDateTime(a.scheduled_date, a.scheduled_time)}
                </Typography>
                <Button
                  size="small"
                  startIcon={<CalendarMonthIcon />}
                  className="!ml-2"
                  onClick={onIcs}
                >
                  {t("history.addToCalendar")}
                </Button>
              </Box>
            </Box>
          )}
          {a.zoom_link && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("history.meeting")}
              </Typography>
              <Button
                component="a"
                href={a.zoom_link}
                target="_blank"
                rel="noreferrer"
                startIcon={<VideoCallIcon />}
                size="small"
                color="primary"
                className="!justify-start !p-0 hover:!bg-transparent"
              >
                {t("history.zoom")}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {(a.analysis_path || a.recording_link) && (
        <Box className="mt-3 flex gap-3 flex-wrap">
          {a.analysis_path && (
            <Button
              component="a"
              href={fileUrl(a.analysis_path)}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              size="small"
              startIcon={<DescriptionIcon />}
            >
              {t("appts.viewAnalysis")}
            </Button>
          )}
          {a.recording_link && (
            <Button
              component="a"
              href={a.recording_link}
              target="_blank"
              rel="noreferrer"
              variant="outlined"
              size="small"
              startIcon={<PlayCircleIcon />}
            >
              {t("appts.watchRecording")}
            </Button>
          )}
        </Box>
      )}

      {a.analysis_notes && (
        <Typography variant="body2" className="!mt-2 !whitespace-pre-wrap" color="text.secondary">
          {a.analysis_notes}
        </Typography>
      )}

      {consultationDocs.length > 0 && (
        <Box className="mt-4 pt-3 border-t border-dashed border-[#E8D9BF]">
          <Typography
            variant="caption"
            color="text.secondary"
            className="!block !mb-2 !font-semibold"
          >
            {t("appts.sadhnaDocuments")}
          </Typography>
          <Box className="flex gap-2 flex-wrap">
            {consultationDocs.map((doc) => (
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
        </Box>
      )}

      {a.status === "completed" && <FeedbackPanel apptId={a.id} />}

      <Typography
        variant="caption"
        color="text.disabled"
        className="!mt-3 !block"
      >
        {t("history.bookedOn")} {new Date(a.created_at).toLocaleDateString()}
      </Typography>
    </Paper>
  );
});

const FeedbackPanel = memo(function FeedbackPanel({ apptId }: { apptId: number }) {
  const { t } = useT();
  const qc = useQueryClient();
  const { data: existing, isLoading } = useAuthQuery<{ rating: number; comment?: string } | null>(
    ["feedback", apptId],
    (token) => getMyFeedback(apptId, token),
  );
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);

  const m = useMutation({
    mutationFn: () => submitFeedback(apptId, { rating: rating || 5, comment }, getToken()),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["feedback", apptId] });
    },
  });

  if (isLoading) return null;

  if (existing && !editing) {
    return (
      <Box className="mt-4 p-4 rounded-lg bg-[rgba(46,125,50,0.06)] border border-[#a5d6a7]">
        <Typography
          variant="caption"
          color="text.secondary"
          className="!block !mb-1"
        >
          {t("feedback.yourRating")}
        </Typography>
        <Box className="flex items-center gap-2">
          <Rating value={existing.rating} readOnly size="small" />
          <Button
            size="small"
            onClick={() => {
              setRating(existing.rating);
              setComment(existing.comment || "");
              setEditing(true);
            }}
          >
            {t("common.edit")}
          </Button>
        </Box>
        {existing.comment && (
          <Typography variant="body2" className="!mt-2 !italic">
            “{existing.comment}”
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box className="mt-4 p-4 rounded-lg bg-[rgba(230,81,0,0.05)] border border-[#E8D9BF]">
      <Typography variant="subtitle2" className="!font-bold !mb-2">
        {t("feedback.prompt")}
      </Typography>
      <Rating
        value={rating ?? existing?.rating ?? 0}
        onChange={(_, v) => setRating(v)}
        size="large"
      />
      <TextField
        multiline
        fullWidth
        minRows={2}
        size="small"
        placeholder={t("feedback.commentPlace")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="!mt-2"
      />
      {m.isError && (
        <Alert severity="error" className="!mt-2">
          {(m.error as any)?.detail || t("feedback.submitFailed")}
        </Alert>
      )}
      <Box className="mt-3 flex gap-2">
        <Button
          variant="contained"
          size="small"
          disabled={!rating || m.isPending}
          onClick={() => m.mutate()}
        >
          {m.isPending ? t("common.saving") : t("feedback.submit")}
        </Button>
        {editing && (
          <Button size="small" onClick={() => setEditing(false)}>
            {t("common.cancel")}
          </Button>
        )}
      </Box>
    </Box>
  );
});

export default function History() {
  const { t } = useT();

  const { data: appointments = [], isLoading: la } = useAuthQuery<Appointment[]>(
    ["my-appointments"],
    getMyAppointments,
  );
  const { data: documents = [], isLoading: ld } = useAuthQuery<Doc[]>(["my-documents"], getMyDocuments);
  const { data: settings, isLoading: ls } = usePublicQuery(["public-settings"], getPublicSettings);
  const fee = settings?.consultation_fee || 500;

  if (la || ld || ls) {
    return (
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Box className="flex items-center justify-between mb-4 md:mb-8 flex-wrap gap-3">
          <Typography
            variant="h4"
            className="!text-brand-maroon !font-bold !text-[1.4rem] md:!text-[2.125rem]"
          >
            {t("history.title")}
          </Typography>
          <Button
            component={Link}
            href="/dashboard/book-appointment"
            variant="contained"
            startIcon={<AddIcon />}
          >
            {t("history.bookNew")}
          </Button>
        </Box>

        {appointments.length === 0 ? (
          <Paper
            elevation={0}
            className="!p-8 md:!p-12 !text-center !rounded-3xl !border !border-dashed !border-brand-sand"
          >
            <Typography variant="h1" className="!text-[3rem] !mb-2">
              📅
            </Typography>
            <Typography color="text.secondary" className="!mb-4">
              {t("history.empty")}
            </Typography>
            <Button component={Link} href="/dashboard/book-appointment" variant="outlined">
              {t("history.empty.cta")}
            </Button>
          </Paper>
        ) : (
          appointments.map((a) => (
            <AppointmentRow
              key={a.id}
              a={a}
              consultationDocs={documents.filter((d) => d.batch_label === `Consultation #${a.id}`)}
              fee={fee}
              t={t}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
