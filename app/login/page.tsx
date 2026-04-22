"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Box, Paper, TextField, Button, Typography, Alert, Divider } from "@mui/material";
import { loginUser, googleLogin, saveToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import Captcha, { type CaptchaRef } from "@/components/Captcha";
import * as s from "./styles";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function Login() {
  const router = useRouter();
  const { t } = useT();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const captchaRef = useRef<CaptchaRef>(null);

  // Initialize Google Sign-In after script loads
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
        text: "signin_with",
      });
    }
  }

  async function handleGoogleResponse(response: any) {
    setError(""); setLoading(true);
    try {
      const res = await googleLogin(response.credential);
      saveToken(res.token, res.role, res.name);
      router.push(["admin", "moderator"].includes(res.role) ? "/admin/appointments" : "/dashboard");
    } catch (err: any) {
      setError(err?.detail || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // If script already loaded (e.g. navigated back)
    if ((window as any).google) initGoogle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLogin(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    if (captchaRef.current && !captchaRef.current.getToken()) {
      setError(t("auth.captchaRequired")); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await loginUser({ email: identifier, password });
      saveToken(res.token, res.role, res.name);
      router.push(["admin", "moderator"].includes(res.role) ? "/admin/appointments" : "/dashboard");
    } catch (err: any) {
      setError(err?.detail || t("auth.login.error"));
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={s.wrapper}>
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogle}
        />
      )}
      <Paper elevation={0} sx={s.card}>
        <Typography variant="h4" sx={s.title}>{t("auth.login.title")}</Typography>
        <Typography sx={s.subtitle}>{t("auth.login.subtitle")}</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Google Sign-In button */}
        {GOOGLE_CLIENT_ID && (
          <>
            <Box ref={googleBtnRef} sx={{ mb: 2, display: "flex", justifyContent: "center" }} />
            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">{t("auth.orContinueWith")}</Typography>
            </Divider>
          </>
        )}

        <Box component="form" onSubmit={handleLogin} sx={s.formStack}>
          <TextField
            label={t("auth.login.identifier")}
            fullWidth
            required
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder={t("auth.login.identifierHint")}
          />
          <TextField
            label={t("common.password")}
            type="password"
            fullWidth
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Captcha ref={captchaRef} />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? t("auth.login.signing") : t("common.login")}
          </Button>

          <Box sx={{ textAlign: "right" }}>
            <Box component={Link} href="/forgot-password" sx={s.link}>
              <Typography variant="body2">{t("auth.forgot.link")}</Typography>
            </Box>
          </Box>
        </Box>

        <Typography sx={s.footerRow}>
          {t("auth.login.noAccount")}{" "}
          <Box component={Link} href="/register" sx={s.link}>{t("common.register")}</Box>
        </Typography>
      </Paper>
    </Box>
  );
}
