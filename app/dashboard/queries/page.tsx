"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, TextField, Button, Typography, Alert, Chip, Stack, CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { getMyQueries, getMyRecordings, submitQuery, getToken } from "@/services/api";
import { statusChipColors } from "@/theme/sharedStyles";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

export default function Queries() {
  const router = useRouter();
  const { t } = useT();
  const [queries, setQueries] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    Promise.all([getMyQueries(token), getMyRecordings(token)])
      .then(([q, r]) => { setQueries(q); setRecordings(r); })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setError(""); setSuccess(""); setSubmitting(true);
    try {
      const newQ = await submitQuery({ subject, message }, token);
      setQueries(prev => [newQ, ...prev]);
      setSubject(""); setMessage("");
      setSuccess(t("queries.submitted"));
    } catch (err: any) {
      setError(err?.detail || t("queries.failed"));
    } finally {
      setSubmitting(false);
    }
  }

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
        <Paper elevation={0} sx={s.formCard}>
          <Typography variant="h5" sx={s.sectionTitle}>{t("queries.ask")}</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField label={t("queries.subject")} required fullWidth
                value={subject} onChange={e => setSubject(e.target.value)} />
              <TextField label={t("queries.message")} required fullWidth multiline rows={4}
                value={message} onChange={e => setMessage(e.target.value)} />
              <Button type="submit" variant="contained" startIcon={<SendIcon />}
                disabled={submitting} sx={{ alignSelf: "flex-start" }}>
                {submitting ? t("queries.sending") : t("queries.send")}
              </Button>
            </Stack>
          </Box>
        </Paper>

        <Typography variant="h5" sx={s.subHeading}>{t("queries.my")}</Typography>
        {queries.length === 0 ? (
          <Paper elevation={0} sx={s.emptyBox}>
            <Typography color="text.secondary">{t("queries.none")}</Typography>
          </Paper>
        ) : (
          queries.map((q: any) => {
            const c = statusChipColors[q.status] || statusChipColors.open;
            return (
              <Paper key={q.id} elevation={0} sx={s.queryCard}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: "text.primary" }}>{q.subject}</Typography>
                  <Chip label={q.status} size="small"
                    sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>{q.message}</Typography>
                {q.reply && (
                  <Box sx={s.replyBlock}>
                    <Typography sx={s.replyLabel}>🪔 {t("queries.reply")}</Typography>
                    <Typography variant="body2" sx={{ wordBreak: "break-word" }}>{q.reply}</Typography>
                  </Box>
                )}
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
                  {new Date(q.created_at).toLocaleDateString()}
                </Typography>
              </Paper>
            );
          })
        )}

        {recordings.length > 0 && (
          <>
            <Typography variant="h5" sx={{ ...s.subHeading, mt: 5 }}>{t("rec.my")}</Typography>
            {recordings.map((r: any) => (
              <Paper key={r.id} elevation={0} sx={s.recCard}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, wordBreak: "break-word" }}>{r.title}</Typography>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(r.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                <Button
                  component="a"
                  href={r.zoom_recording_url}
                  target="_blank"
                  rel="noreferrer"
                  variant="outlined"
                  startIcon={<PlayCircleIcon />}
                >
                  {t("rec.watch")}
                </Button>
              </Paper>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
