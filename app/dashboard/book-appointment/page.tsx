"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
  Stack,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BlockIcon from "@mui/icons-material/Block";
import GavelIcon from "@mui/icons-material/Gavel";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  bookAppointment,
  initiatePhonePePayment,
  getPublicSettings,
  getProfile,
  getToken,
} from "@/services/api";
import { useAuthQuery } from "@/services/queryHooks";
import { lettersOnly } from "@/lib/inputFilters";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

type BookingFor = "self" | "other";

const EMPTY_FORM = {
  name: "",
  email: "",
  mobile: "",
  birth_place: "",
  problem: "",
};

const WRAPPER_CLASS =
  "min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-12 px-2 sm:px-4";
const CARD_CLASS =
  "!max-w-[720px] !mx-auto !w-full !p-4 sm:!p-6 md:!p-10 !rounded-2xl md:!rounded-[2.5rem] !bg-brand-ivory !border !border-brand-sand !shadow-[0_12px_40px_rgba(123,30,30,0.08)]";
const TITLE_CLASS = "!text-brand-maroon !font-bold !mb-2";
const SUBTITLE_CLASS = "!text-brand-text-medium !mb-8";
const GRID_TWO_CLASS = "grid grid-cols-1 sm:grid-cols-2 gap-5";
const FILE_WRAP_CLASS =
  "flex items-start sm:items-center flex-col sm:flex-row gap-3 p-4 border-2 border-dashed border-brand-sand rounded-lg bg-brand-ivory";
const PAYMENT_NOTE_CLASS =
  "p-5 rounded-2xl bg-brand-ivory border border-brand-gold-light my-6";
const PAYMENT_NOTE_TITLE_CLASS = "!font-bold !text-brand-gold !mb-1";

export default function BookAppointment() {
  const router = useRouter();
  const { t } = useT();

  const [step, setStep] = useState<"terms" | "form">("terms");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [bookingFor, setBookingFor] = useState<BookingFor>("self");

  const [form, setForm] = useState(EMPTY_FORM);
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [tob, setTob] = useState<Dayjs | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: profile } = useAuthQuery<any>(["profile"], getProfile);

  useEffect(() => {
    if (bookingFor === "self" && profile) {
      setForm({
        name: profile.name || "",
        email: profile.email || "",
        mobile: profile.mobile || "",
        birth_place: profile.birth_place || "",
        problem: "",
      });
      if (profile.dob) setDob(dayjs(profile.dob));
      else setDob(null);
      if (profile.tob) {
        const parts = (profile.tob || "").split(":");
        if (parts.length >= 2) {
          const [h, m, sec] = parts;
          setTob(
            dayjs()
              .hour(parseInt(h))
              .minute(parseInt(m))
              .second(parseInt(sec || "0")),
          );
        }
      } else setTob(null);
    } else if (bookingFor === "other") {
      setForm(EMPTY_FORM);
      setDob(null);
      setTob(null);
    }
    setSelfie(null);
  }, [bookingFor, profile]);

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
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    if (!dob || !tob) {
      setError(t("auth.dobError"));
      return;
    }
    if (form.name.trim().length < 2) {
      setError(t("common.required"));
      return;
    }
    if (form.problem.trim().length < 5) {
      setError(t("book.problem.help"));
      return;
    }
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
      fd.append("dob", dob.format("YYYY-MM-DD"));
      fd.append("tob", tob.format("HH:mm:ss"));
      if (selfie) fd.append("selfie", selfie);
      const appt = await bookAppointment(fd, token);

      try {
        const payment = await initiatePhonePePayment({ appointment_id: appt.id, amount: fee }, token);
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
      <Box className="min-h-[60vh] flex items-center justify-center">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!bookingEnabled) {
    return (
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <Paper
          elevation={0}
          className="!p-12 !text-center !rounded-3xl !max-w-[520px]"
        >
          <BlockIcon className="!text-[64px] !text-brand-warning !mb-4" />
          <Typography variant="h5" className="!font-bold !text-brand-maroon !mb-2">
            {t("book.onHold")}
          </Typography>
          <Typography color="text.secondary" className="!mb-4">
            {holdMessage || t("book.onHold.default")}
          </Typography>
          {resumeDate && (
            <Typography className="!font-semibold">
              {t("book.onHold.resume")}: {resumeDate}
            </Typography>
          )}
          <Button component={Link} href="/dashboard" variant="outlined" className="!mt-6">
            {t("common.back")}
          </Button>
        </Paper>
      </Box>
    );
  }

  if (step === "terms") {
    return (
      <Box className={WRAPPER_CLASS}>
        <Paper elevation={0} className={`${CARD_CLASS} !max-w-[750px]`}>
          <Box className="flex items-center gap-2 mb-4">
            <GavelIcon color="primary" />
            <Typography variant="h5" className="!font-bold !text-brand-maroon">
              {t("book.termsTitle")}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" className="!mb-6">
            {t("book.termsSubtitle")}
          </Typography>

          <Paper
            variant="outlined"
            className="!p-6 !mb-6 !max-h-[400px] !overflow-auto !bg-brand-ivory !rounded-2xl [&_h1]:!text-brand-maroon [&_h2]:!text-brand-maroon [&_h3]:!text-brand-maroon [&_h1]:!mt-4 [&_h2]:!mt-4 [&_h3]:!mt-4 [&_h1]:!mb-2 [&_h2]:!mb-2 [&_h3]:!mb-2 [&_ol]:!pl-6 [&_ul]:!pl-6 [&_li]:!mb-1 [&_strong]:!text-brand-text-dark"
          >
            {consultationTerms ? (
              <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(consultationTerms) }} />
            ) : (
              <Typography color="text.secondary">{t("book.noTerms")}</Typography>
            )}
          </Paper>

          <Box className="flex items-center gap-2 mb-4">
            <Typography variant="body2" className="!font-semibold">
              {t("book.payment")}: <span style={{ color: brandColors.saffron }}>&#8377;{fee}</span>
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" className="!font-medium">
                {t("book.termsAccept")}
              </Typography>
            }
          />

          <Box className="mt-6 flex gap-4">
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              disabled={!termsAccepted}
              onClick={() => setStep("form")}
            >
              {t("book.proceedToBook")}
            </Button>
            <Button variant="outlined" size="large" component={Link} href="/dashboard">
              {t("common.back")}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className={WRAPPER_CLASS}>
      <Paper elevation={0} className={CARD_CLASS}>
        <Typography variant="h4" className={TITLE_CLASS}>
          {t("book.title")}
        </Typography>
        <Typography className={SUBTITLE_CLASS}>{t("book.subtitle")}</Typography>

        {error && (
          <Alert severity="error" className="!mb-4">
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={3}>
            <FormControl>
              <FormLabel className="!font-semibold !text-brand-text-dark !mb-2">
                {t("book.bookingFor")}
              </FormLabel>
              <RadioGroup
                row
                value={bookingFor}
                onChange={(e) => setBookingFor(e.target.value as BookingFor)}
              >
                <FormControlLabel
                  value="self"
                  control={<Radio />}
                  label={t("book.bookingForSelf")}
                />
                <FormControlLabel
                  value="other"
                  control={<Radio />}
                  label={t("book.bookingForOther")}
                />
              </RadioGroup>
            </FormControl>

            <Box className={GRID_TWO_CLASS}>
              <TextField
                label={t("auth.register.fullName")}
                required
                fullWidth
                value={form.name}
                onChange={(e) => set("name", lettersOnly(e.target.value))}
                slotProps={{ htmlInput: { maxLength: 150, "aria-label": t("auth.register.fullName") } }}
              />
              <TextField
                label={t("common.email")}
                type="email"
                fullWidth
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                slotProps={{ htmlInput: { maxLength: 150, "aria-label": t("common.email") } }}
              />
              <TextField
                label={t("common.mobile")}
                required
                fullWidth
                value={form.mobile}
                onChange={(e) => set("mobile", e.target.value)}
                slotProps={{ htmlInput: { maxLength: 20, "aria-label": t("common.mobile") } }}
              />
              <TextField
                label={t("auth.register.birthPlace")}
                required
                fullWidth
                value={form.birth_place}
                onChange={(e) => set("birth_place", lettersOnly(e.target.value))}
                slotProps={{ htmlInput: { maxLength: 150, "aria-label": t("auth.register.birthPlace") } }}
              />
              <DatePicker
                label={t("auth.register.dob")}
                value={dob}
                onChange={setDob}
                format="DD/MM/YYYY"
                maxDate={dayjs()}
                slotProps={{ textField: { required: true, fullWidth: true } }}
              />
              <TimePicker
                label={t("auth.register.tob")}
                value={tob}
                onChange={setTob}
                ampm
                views={["hours", "minutes", "seconds"]}
                format="hh:mm:ss A"
                timeSteps={{ minutes: 1, seconds: 1 }}
                slotProps={{ textField: { required: true, fullWidth: true } }}
              />
            </Box>

            <TextField
              label={t("book.problem")}
              required
              fullWidth
              multiline
              rows={4}
              value={form.problem}
              onChange={(e) => set("problem", e.target.value)}
              placeholder={t("book.problem.help")}
              slotProps={{ htmlInput: { maxLength: 2000, "aria-label": t("book.problem") } }}
            />

            <Box className={FILE_WRAP_CLASS}>
              <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                {selfie ? t("book.changeFile") : t("book.uploadSelfie")}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                  aria-label={t("book.uploadSelfie")}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                {selfie ? selfie.name : t("book.selfie.help")}
              </Typography>
            </Box>

            <Box className={PAYMENT_NOTE_CLASS}>
              <Typography className={PAYMENT_NOTE_TITLE_CLASS}>
                {t("book.payment")}: &#8377;{fee}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("book.payment.desc")}
              </Typography>
            </Box>

            <Box className="flex gap-4">
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
