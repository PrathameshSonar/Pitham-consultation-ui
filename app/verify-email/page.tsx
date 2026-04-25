"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Paper, Typography, Button, CircularProgress, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/Error";
import { verifyEmailToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";

function VerifyEmailInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useT();
  const token = params.get("token") || "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage(t("verifyEmail.noToken"));
      return;
    }
    verifyEmailToken(token)
      .then(() => setState("ok"))
      .catch((err) => {
        setState("error");
        setMessage(err?.detail || t("verifyEmail.failed"));
      });
  }, [token, t]);

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream flex items-center justify-center px-4">
      <Paper
        elevation={0}
        className="!p-6 md:!p-10 !rounded-3xl !border !border-brand-sand !max-w-[480px] !w-full !text-center"
      >
        {state === "loading" && (
          <>
            <CircularProgress className="!mb-4" />
            <Typography>{t("verifyEmail.checking")}</Typography>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircleIcon className="!text-[64px] !text-brand-success !mb-2" />
            <Typography
              variant="h5"
              className="!font-bold !text-brand-maroon !mb-2"
            >
              {t("verifyEmail.successTitle")}
            </Typography>
            <Typography color="text.secondary" className="!mb-6">
              {t("verifyEmail.successDesc")}
            </Typography>
            <Button variant="contained" onClick={() => router.push("/dashboard")}>
              {t("verifyEmail.toDashboard")}
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <ErrorOutlineIcon className="!text-[64px] !text-brand-error !mb-2" />
            <Typography
              variant="h5"
              className="!font-bold !text-brand-maroon !mb-2"
            >
              {t("verifyEmail.errorTitle")}
            </Typography>
            <Alert severity="error" className="!mb-6 !text-left">
              {message}
            </Alert>
            <Button variant="outlined" onClick={() => router.push("/dashboard/profile")}>
              {t("verifyEmail.toProfile")}
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
