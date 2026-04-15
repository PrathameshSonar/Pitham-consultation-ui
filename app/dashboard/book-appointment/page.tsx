"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  Box, Paper, TextField, Button, Typography, Alert,
  FormControlLabel, Checkbox, Stack, CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BlockIcon from "@mui/icons-material/Block";
import GavelIcon from "@mui/icons-material/Gavel";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { bookAppointment, initiatePhonePePayment, getPublicSettings, getToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";
import * as s from "./styles";

export default function BookAppointment() {
  const router = useRouter();
  const { t } = useT();

  // Step: "terms" or "form"
  const [step, setStep] = useState<"terms" | "form">("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", mobile: "", birth_place: "", problem: "",
  });
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [tob, setTob] = useState<Dayjs | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Settings
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [holdMessage, setHoldMessage] = useState("");
  const [resumeDate, setResumeDate] = useState("");
  const [fee, setFee] = useState(500);
  const [consultationTerms, setConsultationTerms] = useState("");

  useEffect(() => {
    getPublicSettings()
      .then((s: any) => {
        setBookingEnabled(s.booking_enabled);
        setHoldMessage(s.booking_hold_message || "");
        setResumeDate(s.booking_resume_date || "");
        setFee(s.consultation_fee || 500);
        setConsultationTerms(s.consultation_terms || "");
      })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, []);

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    if (!dob || !tob) { setError(t("auth.dobError")); return; }
    if (form.name.trim().length < 2) { setError(t("common.required")); return; }
    if (form.problem.trim().length < 5) { setError(t("book.problem.help")); return; }
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
      fd.append("dob", dob.format("YYYY-MM-DD"));
      fd.append("tob", tob.format("HH:mm:ss"));
      if (selfie) fd.append("selfie", selfie);
      const appt = await bookAppointment(fd, token);

      try {
        const payment = await initiatePhonePePayment(
          { appointment_id: appt.id, amount: fee },
          token
        );
        if (payment.redirect_url) {
          window.location.href = payment.redirect_url;
          return;
        }
      } catch {
        // PhonePe not configured
      }

      router.push("/dashboard/history");
    } catch (err: any) {
      setError(err?.detail || t("book.failed"));
    } finally {
      setLoading(false);
    }
  }

  if (settingsLoading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Booking on hold
  if (!bookingEnabled) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 4, maxWidth: 520 }}>
          <BlockIcon sx={{ fontSize: 64, color: "warning.main", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1 }}>
            {t("book.onHold")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {holdMessage || t("book.onHold.default")}
          </Typography>
          {resumeDate && (
            <Typography sx={{ fontWeight: 600 }}>
              {t("book.onHold.resume")}: {resumeDate}
            </Typography>
          )}
          <Button component={Link} href="/dashboard" variant="outlined" sx={{ mt: 3 }}>
            {t("common.back")}
          </Button>
        </Paper>
      </Box>
    );
  }

  // ── Step 1: Terms & Conditions acceptance ──
  if (step === "terms") {
    return (
      <Box sx={s.wrapper}>
        <Paper elevation={0} sx={{ ...s.card, maxWidth: 750 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <GavelIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon }}>
              {t("book.termsTitle")}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t("book.termsSubtitle")}
          </Typography>

          {/* Render the admin-editable HTML T&C */}
          <Paper variant="outlined" sx={{
            p: 3, mb: 3, maxHeight: 400, overflow: "auto",
            bgcolor: "background.paper", borderRadius: 3,
            "& h1, & h2, & h3": { color: brandColors.maroon, mt: 2, mb: 1 },
            "& ol, & ul": { pl: 3 },
            "& li": { mb: 0.5 },
            "& strong": { color: brandColors.textDark },
          }}>
            {consultationTerms ? (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(consultationTerms) }} />
            ) : (
              <Typography color="text.secondary">{t("book.noTerms")}</Typography>
            )}
          </Paper>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("book.payment")}: <span style={{ color: brandColors.saffron }}>&#8377;{fee}</span>
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {t("book.termsAccept")}
              </Typography>
            }
          />

          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              disabled={!termsAccepted}
              onClick={() => setStep("form")}
            >
              {t("book.proceedToBook")}
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              href="/dashboard"
            >
              {t("common.back")}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // ── Step 2: Booking form ──
  return (
    <Box sx={s.wrapper}>
      <Paper elevation={0} sx={s.card}>
        <Typography variant="h4" sx={s.title}>{t("book.title")}</Typography>
        <Typography sx={s.subtitle}>{t("book.subtitle")}</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            <Box sx={s.gridTwo}>
              <TextField label={t("auth.register.fullName")} required fullWidth value={form.name}
                onChange={e => set("name", e.target.value)}
                slotProps={{ htmlInput: { maxLength: 150, "aria-label": t("auth.register.fullName") } }} />
              <TextField label={t("common.email")} type="email" fullWidth value={form.email}
                onChange={e => set("email", e.target.value)}
                slotProps={{ htmlInput: { maxLength: 150, "aria-label": t("common.email") } }} />
              <TextField label={t("common.mobile")} required fullWidth value={form.mobile}
                onChange={e => set("mobile", e.target.value)}
                slotProps={{ htmlInput: { maxLength: 20, "aria-label": t("common.mobile") } }} />
              <TextField label={t("auth.register.birthPlace")} required fullWidth value={form.birth_place}
                onChange={e => set("birth_place", e.target.value)}
                slotProps={{ htmlInput: { maxLength: 150, "aria-label": t("auth.register.birthPlace") } }} />
              <DatePicker
                label={t("auth.register.dob")}
                value={dob}
                onChange={setDob}
                format="DD/MM/YYYY"
                maxDate={dayjs()}
                slotProps={{ textField: { required: true, fullWidth: true, inputProps: { "aria-label": t("auth.register.dob") } } }}
              />
              <TimePicker
                label={t("auth.register.tob")}
                value={tob}
                onChange={setTob}
                ampm
                views={["hours", "minutes", "seconds"]}
                format="hh:mm:ss A"
                timeSteps={{ minutes: 1, seconds: 1 }}
                slotProps={{ textField: { required: true, fullWidth: true, inputProps: { "aria-label": t("auth.register.tob") } } }}
              />
            </Box>

            <TextField
              label={t("book.problem")}
              required fullWidth multiline rows={4}
              value={form.problem}
              onChange={e => set("problem", e.target.value)}
              placeholder={t("book.problem.help")}
              slotProps={{ htmlInput: { maxLength: 2000, "aria-label": t("book.problem") } }}
            />

            <Box sx={s.fileWrap}>
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                {selfie ? t("book.changeFile") : t("book.uploadSelfie")}
                <input type="file" hidden accept="image/*"
                  onChange={e => setSelfie(e.target.files?.[0] || null)}
                  aria-label={t("book.uploadSelfie")} />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {selfie ? selfie.name : t("book.selfie.help")}
              </Typography>
            </Box>

            <Box sx={s.paymentNote}>
              <Typography sx={s.paymentNoteTitle}>{t("book.payment")}: &#8377;{fee}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("book.payment.desc")}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" size="large" onClick={() => setStep("terms")}>
                {t("common.back")}
              </Button>
              <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? t("book.submitting") : t("book.submit")}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
