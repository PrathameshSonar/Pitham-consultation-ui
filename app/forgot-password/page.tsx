"use client";

import { useState } from "react";
import Link from "next/link";
import { Box, Paper, TextField, Button, Typography, Alert, Stack } from "@mui/material";
import { forgotPassword, resetPassword } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import PasswordField from "@/components/PasswordField";

export default function ForgotPassword() {
  const { t } = useT();
  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(t("common.required"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const isEmail = identifier.includes("@");
      const res = await forgotPassword(isEmail ? { email: identifier } : { mobile: identifier });
      // In dev mode, the token is returned; in prod it would be emailed
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setStep("reset");
    } catch (err: any) {
      setError(err?.detail || t("auth.forgot.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    const otp = resetToken.trim();
    if (!/^\d{6}$/.test(otp)) {
      setError(t("auth.forgot.enterToken"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("auth.forgot.minPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.forgot.mismatch"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword({ token: otp, new_password: newPassword });
      setStep("done");
    } catch (err: any) {
      setError(err?.detail || t("auth.forgot.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream flex items-center justify-center p-6">
      <Paper
        elevation={0}
        className="!w-full !max-w-[440px] !p-8 md:!p-10 !rounded-[2.5rem] !border !border-brand-sand !shadow-[0_20px_60px_rgba(123,30,30,0.12)]"
      >
        <Typography
          variant="h4"
          className="!text-center !text-brand-maroon !font-bold !mb-1"
        >
          {t("auth.forgot.title")}
        </Typography>

        {error && (
          <Alert severity="error" className="!mb-4 !mt-4">
            {error}
          </Alert>
        )}

        {step === "request" && (
          <>
            <Typography className="!text-center !text-brand-text-medium !mb-6">
              {t("auth.forgot.subtitle")}
            </Typography>
            <Box component="form" onSubmit={handleRequest}>
              <Stack spacing={2.5}>
                <TextField
                  label={t("auth.login.identifier")}
                  fullWidth
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t("auth.login.identifierHint")}
                  slotProps={{ htmlInput: { "aria-label": t("auth.login.identifier") } }}
                />
                <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                  {loading ? t("common.loading") : t("auth.forgot.sendLink")}
                </Button>
              </Stack>
            </Box>
          </>
        )}

        {step === "reset" && (
          <>
            <Typography className="!text-center !text-brand-text-medium !mb-6 !mt-2">
              {t("auth.forgot.resetSubtitle")}
            </Typography>
            <Box component="form" onSubmit={handleReset}>
              <Stack spacing={2.5}>
                <TextField
                  label={t("auth.forgot.resetToken")}
                  fullWidth
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  helperText={t("auth.forgot.tokenHelp")}
                  slotProps={{
                    htmlInput: {
                      "aria-label": t("auth.forgot.resetToken"),
                      inputMode: "numeric",
                      pattern: "\\d{6}",
                      maxLength: 6,
                      autoComplete: "one-time-code",
                      style: {
                        letterSpacing: "0.4em",
                        fontSize: "1.3rem",
                        textAlign: "center",
                        fontWeight: 700,
                      },
                    },
                  }}
                />
                <PasswordField
                  label={t("auth.forgot.newPassword")}
                  fullWidth
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  slotProps={{
                    htmlInput: {
                      minLength: 6,
                      autoComplete: "new-password",
                      "aria-label": t("auth.forgot.newPassword"),
                    },
                  }}
                />
                <PasswordField
                  label={t("auth.forgot.confirmPassword")}
                  fullWidth
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  slotProps={{
                    htmlInput: {
                      autoComplete: "new-password",
                      "aria-label": t("auth.forgot.confirmPassword"),
                    },
                  }}
                />
                <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                  {loading ? t("common.loading") : t("auth.forgot.resetBtn")}
                </Button>
              </Stack>
            </Box>
          </>
        )}

        {step === "done" && (
          <Alert severity="success" className="!mt-4">
            {t("auth.forgot.success")}
          </Alert>
        )}

        <Typography className="!mt-6 !text-center !text-brand-text-medium">
          <Box
            component={Link}
            href="/login"
            className="!text-brand-saffron !font-semibold hover:!underline"
          >
            {t("auth.forgot.backToLogin")}
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}
