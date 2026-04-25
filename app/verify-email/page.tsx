"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Paper, Typography, Button, CircularProgress, Alert } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/Error";
import { verifyEmailToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

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
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          border: `1px solid ${brandColors.sand}`,
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        {state === "loading" && (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>{t("verifyEmail.checking")}</Typography>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircleIcon sx={{ fontSize: 64, color: "success.main", mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1 }}>
              {t("verifyEmail.successTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {t("verifyEmail.successDesc")}
            </Typography>
            <Button variant="contained" onClick={() => router.push("/dashboard")}>
              {t("verifyEmail.toDashboard")}
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1 }}>
              {t("verifyEmail.errorTitle")}
            </Typography>
            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
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
