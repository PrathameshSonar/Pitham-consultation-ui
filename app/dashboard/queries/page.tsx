"use client";

import { memo, useCallback, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyQueries, getMyRecordings, submitQuery, getToken } from "@/services/api";
import { useAuthQuery } from "@/services/queryHooks";
import { statusChipColors } from "@/theme/sharedStyles";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

interface QueryItem {
  id: number;
  subject: string;
  message: string;
  reply?: string | null;
  status: string;
  created_at: string;
}

interface RecordingItem {
  id: number;
  title: string;
  zoom_recording_url: string;
  created_at: string;
}

const QueryRow = memo(function QueryRow({ q, replyLabel }: { q: QueryItem; replyLabel: string }) {
  const c = statusChipColors[q.status] || statusChipColors.open;
  return (
    <Paper elevation={0} sx={s.queryCard}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "text.primary" }}>{q.subject}</Typography>
        <Chip label={q.status} size="small" sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600 }} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>
        {q.message}
      </Typography>
      {q.reply && (
        <Box sx={s.replyBlock}>
          <Typography sx={s.replyLabel}>🪔 {replyLabel}</Typography>
          <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
            {q.reply}
          </Typography>
        </Box>
      )}
      <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
        {new Date(q.created_at).toLocaleDateString()}
      </Typography>
    </Paper>
  );
});

const RecordingRow = memo(function RecordingRow({ r, watchLabel }: { r: RecordingItem; watchLabel: string }) {
  return (
    <Paper elevation={0} sx={s.recCard}>
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
        {watchLabel}
      </Button>
    </Paper>
  );
});

export default function Queries() {
  const { t } = useT();
  const qc = useQueryClient();

  const { data: queries = [], isLoading: loadingQ } = useAuthQuery<QueryItem[]>(["my-queries"], getMyQueries);
  const { data: recordings = [], isLoading: loadingR } = useAuthQuery<RecordingItem[]>(
    ["my-recordings"],
    getMyRecordings,
  );

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submitMutation = useMutation({
    mutationFn: () => submitQuery({ subject, message }, getToken()),
    onSuccess: () => {
      setSubject("");
      setMessage("");
      setError("");
      setSuccess(t("queries.submitted"));
      qc.invalidateQueries({ queryKey: ["my-queries"] });
    },
    onError: (err: any) => {
      setError(err?.detail || t("queries.failed"));
      setSuccess("");
    },
  });

  const handleSubmit = useCallback(
    (e: React.BaseSyntheticEvent) => {
      e.preventDefault();
      submitMutation.mutate();
    },
    [submitMutation],
  );

  if (loadingQ || loadingR) {
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
          <Typography variant="h5" sx={s.sectionTitle}>
            {t("queries.ask")}
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label={t("queries.subject")}
                required
                fullWidth
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <TextField
                label={t("queries.message")}
                required
                fullWidth
                multiline
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={submitMutation.isPending}
                sx={{ alignSelf: "flex-start" }}
              >
                {submitMutation.isPending ? t("queries.sending") : t("queries.send")}
              </Button>
            </Stack>
          </Box>
        </Paper>

        <Typography variant="h5" sx={s.subHeading}>
          {t("queries.my")}
        </Typography>
        {queries.length === 0 ? (
          <Paper elevation={0} sx={s.emptyBox}>
            <Typography color="text.secondary">{t("queries.none")}</Typography>
          </Paper>
        ) : (
          queries.map((q) => <QueryRow key={q.id} q={q} replyLabel={t("queries.reply")} />)
        )}

        {recordings.length > 0 && (
          <>
            <Typography variant="h5" sx={{ ...s.subHeading, mt: 5 }}>
              {t("rec.my")}
            </Typography>
            {recordings.map((r) => (
              <RecordingRow key={r.id} r={r} watchLabel={t("rec.watch")} />
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
