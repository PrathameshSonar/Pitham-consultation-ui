"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Box, Paper, Typography, Button, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { checkEventPaymentStatus, getToken } from "@/services/api";

function PaymentStatusInner() {
  const router = useRouter();
  const params = useSearchParams();
  const txn = params.get("txn") || "";

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"success" | "pending" | "failed">("pending");
  const [registrationId, setRegistrationId] = useState<number | null>(null);

  useEffect(() => {
    if (!txn) {
      router.push("/dashboard/events");
      return;
    }
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    checkEventPaymentStatus(txn, token)
      .then((res) => {
        setRegistrationId(res.registration_id);
        if (res.success) setStatus("success");
        else if (res.state === "PENDING") setStatus("pending");
        else setStatus("failed");
      })
      .catch(() => setStatus("failed"))
      .finally(() => setLoading(false));
  }, [txn, router]);

  if (loading) {
    return (
      <Box className="min-h-[80vh] flex items-center justify-center">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const icons = {
    success: <CheckCircleIcon className="!text-[64px] !text-brand-success" />,
    pending: <HourglassEmptyIcon className="!text-[64px] !text-brand-warning" />,
    failed:  <ErrorIcon className="!text-[64px] !text-brand-error" />,
  };
  const titles = {
    success: "Payment successful",
    pending: "Payment pending",
    failed:  "Payment failed",
  };
  const descs = {
    success: "Your registration is confirmed. Check your email for the confirmation.",
    pending: "Your payment is still being processed. We'll confirm by email once it clears.",
    failed:  "We couldn't confirm your payment. Try again or use a different method.",
  };

  return (
    <Box className="min-h-[80vh] flex items-center justify-center p-6">
      <Paper
        elevation={0}
        className="!p-10 !text-center !rounded-3xl !max-w-[480px] !border !border-brand-sand"
      >
        {icons[status]}
        <Typography variant="h5" className="!font-bold !mt-4 !mb-2">
          {titles[status]}
        </Typography>
        <Typography color="text.secondary" className="!mb-6">
          {descs[status]}
        </Typography>
        <Button
          component={Link}
          href={
            registrationId
              ? `/dashboard/events?registered=${registrationId}`
              : "/dashboard/events"
          }
          variant="contained"
        >
          My Events
        </Button>
      </Paper>
    </Box>
  );
}

export default function EventPaymentStatusPage() {
  return (
    <Suspense fallback={null}>
      <PaymentStatusInner />
    </Suspense>
  );
}
