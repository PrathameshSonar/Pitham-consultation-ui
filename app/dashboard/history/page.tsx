"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, Button, Chip, CircularProgress,
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
import { getMyAppointments, getMyDocuments, initiatePhonePePayment, getPublicSettings, generateReceipt, generateInvoice, cancelAppointment, getToken, fileUrl } from "@/services/api";
import { statusChipColors } from "@/theme/sharedStyles";
import { formatTime12h } from "@/lib/timeSlots";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

export default function History() {
  const router = useRouter();
  const { t } = useT();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fee, setFee] = useState(500);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    Promise.all([
      getMyAppointments(token),
      getMyDocuments(token),
      getPublicSettings(),
    ])
      .then(([appts, docs, settings]) => {
        setAppointments(appts);
        setDocuments(docs);
        setFee(settings.consultation_fee || 500);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // Match docs assigned during a consultation (batch_label = "Consultation #<id>")
  function getConsultationDocs(apptId: number) {
    return documents.filter((d: any) => d.batch_label === `Consultation #${apptId}`);
  }

  if (loading) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Box sx={s.headerRow}>
          <Typography variant="h4" sx={s.title}>{t("history.title")}</Typography>
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
          <Paper elevation={0} sx={s.emptyCard}>
            <Typography variant="h1" sx={{ fontSize: "3rem", mb: 1 }}>📅</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>{t("history.empty")}</Typography>
            <Button component={Link} href="/dashboard/book-appointment" variant="outlined">
              {t("history.empty.cta")}
            </Button>
          </Paper>
        ) : (
          appointments.map((a: any) => {
            const c = statusChipColors[a.status] || statusChipColors.pending;
            return (
              <Paper key={a.id} elevation={0} sx={s.apptCard}>
                <Box sx={s.apptTopRow}>
                  <Box>
                    <Typography sx={s.apptName}>{a.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {a.problem.length > 120 ? a.problem.slice(0, 120) + "…" : a.problem}
                    </Typography>
                  </Box>
                  <Chip
                    label={a.status.replace("_", " ")}
                    size="small"
                    sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600, textTransform: "capitalize" }}
                  />
                </Box>

                {/* Timeline */}
                <Box sx={{ display: "flex", gap: 0.5, mt: 1.5, flexWrap: "wrap" }}>
                  {["booked", "paid", "scheduled", "completed"].map((step) => {
                    const done =
                      step === "booked" ? true :
                      step === "paid" ? a.payment_status === "paid" :
                      step === "scheduled" ? ["scheduled", "rescheduled", "completed"].includes(a.status) :
                      a.status === "completed";
                    return (
                      <Chip
                        key={step}
                        label={step}
                        size="small"
                        variant={done ? "filled" : "outlined"}
                        color={done ? "success" : "default"}
                        sx={{ textTransform: "capitalize", fontSize: "0.7rem" }}
                      />
                    );
                  })}
                </Box>

                {a.payment_status !== "paid" && a.status !== "completed" && (
                  <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      size="small"
                      color="warning"
                      startIcon={<PaymentIcon />}
                      onClick={async () => {
                        const token = getToken();
                        if (!token) return;
                        try {
                          const payment = await initiatePhonePePayment(
                            { appointment_id: a.id, amount: fee },
                            token
                          );
                          if (payment.redirect_url) window.location.href = payment.redirect_url;
                        } catch { /* PhonePe not configured */ }
                      }}
                    >
                      {t("payment.completePayment")}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={async () => {
                        if (!confirm(t("appts.cancelConfirm"))) return;
                        const token = getToken();
                        if (!token) return;
                        try {
                          await cancelAppointment(a.id, token);
                          setAppointments(prev => prev.filter(x => x.id !== a.id));
                        } catch { alert(t("appts.cancelFailed")); }
                      }}
                    >
                      {t("appts.cancel")}
                    </Button>
                  </Box>
                )}

                {a.payment_status === "paid" && (
                  <Box sx={{ mt: 1.5 }}>
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
                        onClick={async () => {
                          const token = getToken();
                          if (!token) return;
                          try {
                            await generateReceipt(a.id, token);
                            // Reload appointments to get receipt_path
                            const appts = await getMyAppointments(token);
                            setAppointments(appts);
                          } catch { alert("Receipt generation failed. Please try again."); }
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
                          const res = await generateInvoice(a.id, token);
                          if (res.invoice_path) {
                            window.open(fileUrl(res.invoice_path), "_blank");
                          }
                        } catch { alert("Invoice generation failed. Please try again."); }
                      }}
                    >
                      {t("appts.downloadInvoice")}
                    </Button>
                  </Box>
                )}

                {(a.scheduled_date || a.zoom_link) && (
                  <Box sx={s.scheduledBox}>
                    {a.scheduled_date && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t("history.dateTime")}</Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {a.scheduled_date} · {formatTime12h(a.scheduled_time)}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<CalendarMonthIcon />}
                            sx={{ ml: 1 }}
                            onClick={() => {
                              const dtStart = `${a.scheduled_date.replace(/-/g, "")}T${(a.scheduled_time || "00:00").replace(/:/g, "")}00`;
                              const ics = [
                                "BEGIN:VCALENDAR",
                                "VERSION:2.0",
                                "PRODID:-//SPBSP//Consultation//EN",
                                "BEGIN:VEVENT",
                                `DTSTART:${dtStart}`,
                                "DURATION:PT45M",
                                `SUMMARY:SPBSP, Ahilyanagar — Consultation`,
                                `DESCRIPTION:${(a.problem || "").slice(0, 200).replace(/\n/g, "\\n")}`,
                                `LOCATION:${a.zoom_link || "Zoom"}`,
                                a.zoom_link ? `URL:${a.zoom_link}` : "",
                                "END:VEVENT",
                                "END:VCALENDAR",
                              ].filter(Boolean).join("\r\n");
                              const blob = new Blob([ics], { type: "text/calendar" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.download = `consultation_${a.id}.ics`;
                              link.click();
                              URL.revokeObjectURL(url);
                            }}
                          >
                            {t("history.addToCalendar")}
                          </Button>
                        </Box>
                      </Box>
                    )}
                    {a.zoom_link && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t("history.meeting")}</Typography>
                        <Button
                          component="a"
                          href={a.zoom_link}
                          target="_blank"
                          rel="noreferrer"
                          startIcon={<VideoCallIcon />}
                          size="small"
                          color="primary"
                          sx={{ justifyContent: "flex-start", p: 0, "&:hover": { bgcolor: "transparent" } }}
                        >
                          {t("history.zoom")}
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {(a.analysis_path || a.recording_link) && (
                  <Box sx={{ mt: 1.5, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
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
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }} color="text.secondary">
                    {a.analysis_notes}
                  </Typography>
                )}

                {(() => {
                  const docs = getConsultationDocs(a.id);
                  if (docs.length === 0) return null;
                  return (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed", borderColor: "divider" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                        {t("appts.sadhnaDocuments")}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {docs.map((doc: any) => (
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
                  );
                })()}

                <Typography variant="caption" color="text.disabled" sx={{ mt: 1.5, display: "block" }}>
                  {t("history.bookedOn")} {new Date(a.created_at).toLocaleDateString()}
                </Typography>
              </Paper>
            );
          })
        )}
      </Box>
    </Box>
  );
}
