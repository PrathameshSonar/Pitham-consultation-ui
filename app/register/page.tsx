"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import { registerUser, googleLogin, saveToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import Captcha, { type CaptchaRef } from "@/components/Captcha";
import * as s from "./styles";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const COUNTRIES = ["India", "USA", "UK", "Canada", "Australia", "Other"];

export default function Register() {
  const router = useRouter();
  const { t } = useT();
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    birth_place: "",
    city: "",
    state: "",
    country: "India",
    password: "",
  });
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [tob, setTob] = useState<Dayjs | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const captchaRef = useRef<CaptchaRef>(null);

  function initGoogle() {
    if (!GOOGLE_CLIENT_ID || !(window as any).google) return;
    (window as any).google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });
    if (googleBtnRef.current) {
      (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: googleBtnRef.current.offsetWidth,
        text: "signup_with",
      });
    }
  }

  async function handleGoogleResponse(response: any) {
    setError("");
    setLoading(true);
    try {
      const res = await googleLogin(response.credential);
      saveToken(res.token, res.role, res.name);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.detail || "Google sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if ((window as any).google) initGoogle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    if (!dob || !tob) {
      setError(t("auth.dobError"));
      return;
    }
    if (!termsAccepted) {
      setError(t("auth.terms.error"));
      return;
    }
    if (captchaRef.current && !captchaRef.current.getToken()) {
      setError(t("auth.captchaRequired"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        dob: dob.format("YYYY-MM-DD"),
        tob: tob.format("HH:mm:ss"),
      };
      const res = await registerUser(payload);
      saveToken(res.token, res.role, res.name);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.detail || t("auth.failed"));
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={s.wrapper}>
      <Paper elevation={0} sx={s.card}>
        <Typography variant="h4" sx={s.title}>
          {t("auth.register.title")}
        </Typography>
        <Typography sx={s.subtitle}>{t("auth.register.subtitle")}</Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Google Sign-Up button */}
        {GOOGLE_CLIENT_ID && (
          <>
            <Script
              src="https://accounts.google.com/gsi/client"
              strategy="afterInteractive"
              onLoad={initGoogle}
            />
            <Box ref={googleBtnRef} sx={{ mb: 2, display: "flex", justifyContent: "center" }} />
            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {t("auth.orContinueWith")}
              </Typography>
            </Divider>
          </>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={s.gridTwo}>
            <TextField
              label={t("auth.register.fullName")}
              required
              fullWidth
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <TextField
              label={`${t("common.email")} (${t("common.optional")})`}
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <TextField
              label={t("common.mobile")}
              required
              fullWidth
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              placeholder="+91 XXXXXXXXXX"
            />
            <TextField
              label={t("auth.register.birthPlace")}
              required
              fullWidth
              value={form.birth_place}
              onChange={(e) => set("birth_place", e.target.value)}
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
            <TextField
              label={t("auth.register.city")}
              required
              fullWidth
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
            <TextField
              label={t("auth.register.state")}
              required
              fullWidth
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
            />
            <TextField
              select
              label={t("auth.register.country")}
              required
              fullWidth
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t("common.password")}
              type="password"
              required
              fullWidth
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
            />
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
              <Typography variant="body2">
                <Box component={Link} href="/terms" sx={s.link} target="_blank">
                  {t("auth.register.acceptTerms")}
                </Box>
              </Typography>
            }
          />

          <Captcha ref={captchaRef} />

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 2 }}>
            {loading ? t("auth.register.creating") : t("auth.register.cta")}
          </Button>
        </Box>

        <Typography sx={s.footerRow}>
          {t("auth.register.have")}{" "}
          <Box component={Link} href="/login" sx={s.link}>
            {t("common.login")}
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}
