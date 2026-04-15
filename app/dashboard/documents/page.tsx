"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, Button, CircularProgress,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import { getMyDocuments, getToken, fileUrl } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

export default function Documents() {
  const router = useRouter();
  const { t } = useT();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    getMyDocuments(token)
      .then(setDocs)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Typography variant="h4" sx={s.title}>{t("docs.title")}</Typography>

        {docs.length === 0 ? (
          <Paper elevation={0} sx={s.emptyCard}>
            <Typography variant="h1" sx={{ fontSize: "3rem", mb: 1 }}>📜</Typography>
            <Typography color="text.secondary">{t("users.noDocs")}</Typography>
          </Paper>
        ) : (
          docs.map((doc: any) => (
            <Paper key={doc.id} elevation={0} sx={s.docCard}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <DescriptionIcon sx={s.docIcon} />
                <Box>
                  <Typography sx={s.docTitle}>{doc.title}</Typography>
                  {doc.description && (
                    <Typography variant="body2" color="text.secondary">{doc.description}</Typography>
                  )}
                  <Typography variant="caption" color="text.disabled">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
              <Button
                component="a"
                href={fileUrl(doc.file_path)}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                startIcon={<DownloadIcon />}
              >
                {t("common.download")}
              </Button>
            </Paper>
          ))
        )}
      </Box>
    </Box>
  );
}
