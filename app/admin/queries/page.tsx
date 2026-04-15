"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, TextField, Button, Chip, Alert, CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { adminGetQueries, adminReplyQuery, getToken } from "@/services/api";
import { statusChipColors } from "@/theme/sharedStyles";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

export default function AdminQueries() {
  const router = useRouter();
  const { t } = useT();
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    adminGetQueries(token)
      .then(setQueries)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleReply(id: number) {
    const token = getToken();
    if (!token || !replyText.trim()) return;
    setError(""); setSaving(true);
    try {
      const updated = await adminReplyQuery(id, replyText, token);
      setQueries(prev => prev.map(q => q.id === id ? updated : q));
      setReplyingId(null); setReplyText("");
    } catch (err: any) {
      setError(err?.detail || "Failed to save reply");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const open = queries.filter(q => q.status === "open");
  const answered = queries.filter(q => q.status === "answered");

  const renderQuery = (q: any, isOpen: boolean) => {
    const c = statusChipColors[q.status] || statusChipColors.open;
    return (
      <Paper key={q.id} elevation={0} sx={{ ...s.queryCard, opacity: isOpen ? 1 : 0.85 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>{q.subject}</Typography>
          <Chip label={q.status} size="small"
            sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600 }} />
        </Box>
        <Typography variant="body2" color="text.secondary">{q.message}</Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block" }}>
          User #{q.user_id} · {new Date(q.created_at).toLocaleDateString()}
        </Typography>

        {q.reply && (
          <Box sx={s.replyBlock}>
            <Typography variant="caption" sx={{
              color: "primary.main", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", display: "block", mb: 0.5,
            }}>
              🪔 {t("queries.reply")}
            </Typography>
            <Typography variant="body2">{q.reply}</Typography>
          </Box>
        )}

        {isOpen && (
          replyingId === q.id ? (
            <Box sx={{ mt: 2 }}>
              <TextField fullWidth multiline rows={3}
                placeholder={t("queries.replyPlace")}
                value={replyText}
                onChange={e => setReplyText(e.target.value)} />
              <Box sx={{ mt: 1.5, display: "flex", gap: 1 }}>
                <Button variant="contained" disabled={saving} onClick={() => handleReply(q.id)}
                  startIcon={<SendIcon />}>
                  {saving ? t("common.saving") : t("queries.sendReply")}
                </Button>
                <Button onClick={() => { setReplyingId(null); setReplyText(""); }}>
                  {t("common.cancel")}
                </Button>
              </Box>
            </Box>
          ) : (
            <Button sx={{ mt: 2 }} onClick={() => { setReplyingId(q.id); setReplyText(""); }}>
              {t("common.reply")}
            </Button>
          )
        )}
      </Paper>
    );
  };

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Typography variant="h4" sx={s.title}>{t("queries.admin.title")}</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h6" sx={s.sectionHeading}>{t("queries.open")} ({open.length})</Typography>
        {open.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: "center", borderRadius: 4, mb: 4 }}>
            <Typography color="text.secondary">{t("queries.none")}</Typography>
          </Paper>
        ) : (
          open.map(q => renderQuery(q, true))
        )}

        {answered.length > 0 && (
          <>
            <Typography variant="h6" sx={{ ...s.sectionHeading, mt: 5 }}>
              {t("queries.answered")} ({answered.length})
            </Typography>
            {answered.map(q => renderQuery(q, false))}
          </>
        )}
      </Box>
    </Box>
  );
}
