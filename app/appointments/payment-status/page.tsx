"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box, Paper, Typography, Button, CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import PaymentIcon from "@mui/icons-material/Payment";
import { checkPhonePeStatus, initiatePhonePePayment, getPublicSettings, getToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";

export default function PaymentStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useT();
  const txn = searchParams.get("txn") || "";

  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [status, setStatus] = useState<"success" | "pending" | "failed">("pending");
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [fee, setFee] = useState(500);

  useEffect(() => {
    if (!txn) { router.push("/dashboard/history"); return; }
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    // Extract appointment ID from txn format: PITHAM_{id}_{hex}
    const parts = txn.split("_");
    if (parts.length >= 2) setAppointmentId(parseInt(parts[1], 10) || null);

    // Load fee + check status in parallel
    getPublicSettings()
      .then((s: any) => setFee(s.consultation_fee || 500))
      .catch(() => {});

    checkPhonePeStatus(txn, token)
      .then((res) => {
        if (res.success) setStatus("success");
        else if (res.state === "PENDING") setStatus("pending");
        else setStatus("failed");
      })
      .catch(() => setStatus("failed"))
      .finally(() => setLoading(false));
  }, [txn, router]);

  async function handleRetryPayment() {
    if (!appointmentId) return;
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    setRetrying(true);
    try {
      const payment = await initiatePhonePePayment(
        { appointment_id: appointmentId, amount: fee },
        token
      );
      if (payment.redirect_url) {
        window.location.href = payment.redirect_url;
        return;
      }
    } catch {
      setStatus("failed");
    } finally {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const icons = {
    success: <CheckCircleIcon sx={{ fontSize: 64, color: "success.main" }} />,
    pending: <HourglassEmptyIcon sx={{ fontSize: 64, color: "warning.main" }} />,
    failed: <ErrorIcon sx={{ fontSize: 64, color: "error.main" }} />,
  };

  const titles = {
    success: t("payment.success"),
    pending: t("payment.pending"),
    failed: t("payment.failed"),
  };

  const descs = {
    success: t("payment.success.desc"),
    pending: t("payment.pending.desc"),
    failed: t("payment.failed.desc"),
  };

  return (
    <Box sx={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
      <Paper elevation={0} sx={{ p: 5, textAlign: "center", borderRadius: 4, maxWidth: 480 }}>
        {icons[status]}
        <Typography variant="h5" sx={{ fontWeight: 700, mt: 2, mb: 1 }}>
          {titles[status]}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {descs[status]}
        </Typography>
        {status === "failed" && appointmentId && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PaymentIcon />}
            onClick={handleRetryPayment}
            disabled={retrying}
            sx={{ mb: 2 }}
          >
            {retrying ? t("common.loading") : t("payment.retry")}
          </Button>
        )}
        <Button component={Link} href="/dashboard/history" variant={status === "failed" ? "outlined" : "contained"}>
          {t("payment.goToHistory")}
        </Button>
      </Paper>
    </Box>
  );
}
