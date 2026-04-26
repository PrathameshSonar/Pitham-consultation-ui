"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Box, Paper, TextField, Button, Typography, Alert, Divider } from "@mui/material";
import { loginUser, googleLogin, saveToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import Captcha, { type CaptchaRef } from "@/components/Captcha";
import PasswordField from "@/components/PasswordField";

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
    setError("");
    setLoading(true);
    try {
      const res = await googleLogin(response.credential);
      saveToken(res.token, res.role, res.name, res.permissions || []);
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
      setError(t("auth.captchaRequired"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await loginUser({ email: identifier, password });
      saveToken(res.token, res.role, res.name, res.permissions || []);
      router.push(["admin", "moderator"].includes(res.role) ? "/admin/appointments" : "/dashboard");
    } catch (err: any) {
      setError(err?.detail || t("auth.login.error"));
      captchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream flex items-center justify-center p-3 sm:p-6">
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogle}
        />
      )}
      <Paper
        elevation={0}
        className="!w-full !max-w-[440px] !p-6 sm:!p-8 md:!p-10 !rounded-2xl md:!rounded-[2.5rem] !bg-brand-ivory !border !border-brand-sand !shadow-[0_20px_60px_rgba(123,30,30,0.12)]"
      >
        <Typography
          variant="h4"
          className="!text-center !text-brand-maroon !font-bold !mb-1"
        >
          {t("auth.login.title")}
        </Typography>
        <Typography className="!text-center !text-brand-text-medium !mb-8">
          {t("auth.login.subtitle")}
        </Typography>

        {error && (
          <Alert severity="error" className="!mb-4">
            {error}
          </Alert>
        )}

        {/* Google Sign-In button */}
        {GOOGLE_CLIENT_ID && (
          <>
            <Box ref={googleBtnRef} className="mb-4 flex justify-center" />
            <Divider className="!mb-4">
              <Typography variant="caption" color="text.secondary">
                {t("auth.orContinueWith")}
              </Typography>
            </Divider>
          </>
        )}

        <Box component="form" onSubmit={handleLogin} className="flex flex-col gap-5">
          <TextField
            label={t("auth.login.identifier")}
            fullWidth
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={t("auth.login.identifierHint")}
          />
          <PasswordField
            label={t("common.password")}
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{ htmlInput: { autoComplete: "current-password" } }}
          />
          <Captcha ref={captchaRef} />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? t("auth.login.signing") : t("common.login")}
          </Button>

          <Box className="text-right">
            <Box
              component={Link}
              href="/forgot-password"
              className="!text-brand-saffron !font-semibold hover:!underline"
            >
              <Typography variant="body2">{t("auth.forgot.link")}</Typography>
            </Box>
          </Box>
        </Box>

        <Typography className="!mt-6 !text-center !text-brand-text-medium">
          {t("auth.login.noAccount")}{" "}
          <Box
            component={Link}
            href="/register"
            className="!text-brand-saffron !font-semibold hover:!underline"
          >
            {t("common.register")}
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}
