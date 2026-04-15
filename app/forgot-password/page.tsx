"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Box, Paper, TextField, Button, Typography, Alert, Stack,
} from "@mui/material";
import { forgotPassword, resetPassword } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

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
    if (!identifier.trim()) { setError(t("common.required")); return; }
    setError(""); setLoading(true);
    try {
      const isEmail = identifier.includes("@");
      const res = await forgotPassword(
        isEmail ? { email: identifier } : { mobile: identifier }
      );
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
    if (newPassword.length < 6) { setError(t("auth.forgot.minPassword")); return; }
    if (newPassword !== confirmPassword) { setError(t("auth.forgot.mismatch")); return; }
    if (!resetToken.trim()) { setError(t("auth.forgot.enterToken")); return; }
    setError(""); setLoading(true);
    try {
      await resetPassword({ token: resetToken, new_password: newPassword });
      setStep("done");
    } catch (err: any) {
      setError(err?.detail || t("auth.forgot.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: "calc(100vh - 64px)",
      bgcolor: "background.default",
      display: "flex", alignItems: "center", justifyContent: "center", p: 3,
    }}>
      <Paper elevation={0} sx={{
        width: "100%", maxWidth: 440, p: { xs: 4, md: 5 }, borderRadius: 5,
        border: `1px solid ${brandColors.sand}`,
        boxShadow: "0 20px 60px rgba(123, 30, 30, 0.12)",
      }}>
        <Typography variant="h4" sx={{ textAlign: "center", color: brandColors.maroon, fontWeight: 700, mb: 0.5 }}>
          {t("auth.forgot.title")}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, mt: 2 }}>{error}</Alert>}

        {step === "request" && (
          <>
            <Typography sx={{ textAlign: "center", color: brandColors.textMedium, mb: 3 }}>
              {t("auth.forgot.subtitle")}
            </Typography>
            <Box component="form" onSubmit={handleRequest}>
              <Stack spacing={2.5}>
                <TextField
                  label={t("auth.login.identifier")}
                  fullWidth required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
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
            <Typography sx={{ textAlign: "center", color: brandColors.textMedium, mb: 3, mt: 1 }}>
              {t("auth.forgot.resetSubtitle")}
            </Typography>
            <Box component="form" onSubmit={handleReset}>
              <Stack spacing={2.5}>
                <TextField
                  label={t("auth.forgot.resetToken")}
                  fullWidth required
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                  helperText={t("auth.forgot.tokenHelp")}
                  slotProps={{ htmlInput: { "aria-label": t("auth.forgot.resetToken") } }}
                />
                <TextField
                  label={t("auth.forgot.newPassword")}
                  type="password"
                  fullWidth required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  slotProps={{ htmlInput: { minLength: 6, "aria-label": t("auth.forgot.newPassword") } }}
                />
                <TextField
                  label={t("auth.forgot.confirmPassword")}
                  type="password"
                  fullWidth required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  slotProps={{ htmlInput: { "aria-label": t("auth.forgot.confirmPassword") } }}
                />
                <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
                  {loading ? t("common.loading") : t("auth.forgot.resetBtn")}
                </Button>
              </Stack>
            </Box>
          </>
        )}

        {step === "done" && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t("auth.forgot.success")}
          </Alert>
        )}

        <Typography sx={{ mt: 3, textAlign: "center", color: brandColors.textMedium }}>
          <Box component={Link} href="/login"
            sx={{ color: brandColors.saffron, fontWeight: 600, "&:hover": { textDecoration: "underline" } }}>
            {t("auth.forgot.backToLogin")}
          </Box>
        </Typography>
      </Paper>
    </Box>
  );
}
