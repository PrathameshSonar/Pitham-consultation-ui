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

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4";
const CONTAINER_CLASS = "max-w-[780px] mx-auto";
const SUB_HEADING_CLASS = "!text-brand-maroon !font-bold !mb-4";

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
    <Paper
      elevation={0}
      className="!p-6 !mb-4 !rounded-3xl !border !border-brand-sand"
    >
      <Box className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <Typography className="!font-bold !text-brand-text-dark">{q.subject}</Typography>
        <Chip
          label={q.status}
          size="small"
          className="!font-semibold"
          style={{ backgroundColor: c.bg, color: c.fg }}
        />
      </Box>
      <Typography variant="body2" color="text.secondary" className="!break-words">
        {q.message}
      </Typography>
      {q.reply && (
        <Box className="mt-4 pt-4 border-t border-dashed border-brand-sand">
          <Typography className="!text-brand-saffron !font-bold !text-[0.75rem] !uppercase !tracking-[0.1em] !mb-1">
            🪔 {replyLabel}
          </Typography>
          <Typography variant="body2" className="!break-words">
            {q.reply}
          </Typography>
        </Box>
      )}
      <Typography
        variant="caption"
        color="text.disabled"
        className="!mt-2 !block"
      >
        {new Date(q.created_at).toLocaleDateString()}
      </Typography>
    </Paper>
  );
});

const RecordingRow = memo(function RecordingRow({ r, watchLabel }: { r: RecordingItem; watchLabel: string }) {
  return (
    <Paper
      elevation={0}
      className="!p-6 !mb-4 !rounded-3xl !border !border-brand-sand !flex !justify-between !items-center !gap-4"
    >
      <Box className="min-w-0 flex-1">
        <Typography className="!font-bold !break-words">{r.title}</Typography>
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
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Paper
          elevation={0}
          className="!p-6 md:!p-8 !rounded-3xl !border !border-brand-sand !mb-10"
        >
          <Typography variant="h5" className="!text-brand-maroon !font-bold !mb-6">
            {t("queries.ask")}
          </Typography>
          {error && (
            <Alert severity="error" className="!mb-4">
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" className="!mb-4">
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
                className="!self-start"
              >
                {submitMutation.isPending ? t("queries.sending") : t("queries.send")}
              </Button>
            </Stack>
          </Box>
        </Paper>

        <Typography variant="h5" className={SUB_HEADING_CLASS}>
          {t("queries.my")}
        </Typography>
        {queries.length === 0 ? (
          <Paper
            elevation={0}
            className="!p-8 !text-center !rounded-3xl !border !border-dashed !border-brand-sand"
          >
            <Typography color="text.secondary">{t("queries.none")}</Typography>
          </Paper>
        ) : (
          queries.map((q) => <QueryRow key={q.id} q={q} replyLabel={t("queries.reply")} />)
        )}

        {recordings.length > 0 && (
          <>
            <Typography variant="h5" className={`${SUB_HEADING_CLASS} !mt-10`}>
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
