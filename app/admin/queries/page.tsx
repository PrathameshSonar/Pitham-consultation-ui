"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Paper, Typography, TextField, Button, Chip, Alert, CircularProgress } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { adminGetQueries, adminReplyQuery, getToken } from "@/services/api";
import { statusChipColors } from "@/theme/sharedStyles";
import { useT } from "@/i18n/I18nProvider";
import { useRequireSection } from "@/lib/useRequireSection";

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4";
const CONTAINER_CLASS = "max-w-[900px] mx-auto";

export default function AdminQueries() {
  const router = useRouter();
  const { t } = useT();
  const gate = useRequireSection("queries");
  const [queries, setQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    adminGetQueries(token)
      .then(setQueries)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleReply(id: number) {
    const token = getToken();
    if (!token || !replyText.trim()) return;
    setError("");
    setSaving(true);
    try {
      const updated = await adminReplyQuery(id, replyText, token);
      setQueries((prev) => prev.map((q) => (q.id === id ? updated : q)));
      setReplyingId(null);
      setReplyText("");
    } catch (err: any) {
      setError(err?.detail || "Failed to save reply");
    } finally {
      setSaving(false);
    }
  }

  if (gate !== "allowed" || loading) {
    return (
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const open = queries.filter((q) => q.status === "open");
  const answered = queries.filter((q) => q.status === "answered");

  const renderQuery = (q: any, isOpen: boolean) => {
    const c = statusChipColors[q.status] || statusChipColors.open;
    return (
      <Paper
        key={q.id}
        elevation={0}
        className={`!p-6 !mb-4 !rounded-3xl !border !border-brand-sand ${isOpen ? "" : "!opacity-85"}`}
      >
        <Box className="flex justify-between items-center mb-2">
          <Typography className="!font-bold">{q.subject}</Typography>
          <Chip
            label={q.status}
            size="small"
            className="!font-semibold"
            style={{ backgroundColor: c.bg, color: c.fg }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {q.message}
        </Typography>
        <Typography
          variant="caption"
          color="text.disabled"
          className="!mt-2 !block"
        >
          User #{q.user_id} · {new Date(q.created_at).toLocaleDateString()}
        </Typography>

        {q.reply && (
          <Box className="mt-4 pt-4 border-t border-dashed border-brand-sand">
            <Typography
              variant="caption"
              className="!text-brand-saffron !font-bold !uppercase !tracking-[0.1em] !block !mb-1"
            >
              🪔 {t("queries.reply")}
            </Typography>
            <Typography variant="body2">{q.reply}</Typography>
          </Box>
        )}

        {isOpen &&
          (replyingId === q.id ? (
            <Box className="mt-4">
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder={t("queries.replyPlace")}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <Box className="mt-3 flex gap-2">
                <Button
                  variant="contained"
                  disabled={saving}
                  onClick={() => handleReply(q.id)}
                  startIcon={<SendIcon />}
                >
                  {saving ? t("common.saving") : t("queries.sendReply")}
                </Button>
                <Button
                  onClick={() => {
                    setReplyingId(null);
                    setReplyText("");
                  }}
                >
                  {t("common.cancel")}
                </Button>
              </Box>
            </Box>
          ) : (
            <Button
              className="!mt-4"
              onClick={() => {
                setReplyingId(q.id);
                setReplyText("");
              }}
            >
              {t("common.reply")}
            </Button>
          ))}
      </Paper>
    );
  };

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Typography variant="h4" className="!text-brand-maroon !font-bold !mb-8">
          {t("queries.admin.title")}
        </Typography>

        {error && (
          <Alert severity="error" className="!mb-4">
            {error}
          </Alert>
        )}

        <Typography variant="h6" className="!text-brand-maroon !font-bold !mb-4">
          {t("queries.open")} ({open.length})
        </Typography>
        {open.length === 0 ? (
          <Paper elevation={0} className="!p-8 !text-center !rounded-3xl !mb-8">
            <Typography color="text.secondary">{t("queries.none")}</Typography>
          </Paper>
        ) : (
          open.map((q) => renderQuery(q, true))
        )}

        {answered.length > 0 && (
          <>
            <Typography variant="h6" className="!text-brand-maroon !font-bold !mb-4 !mt-10">
              {t("queries.answered")} ({answered.length})
            </Typography>
            {answered.map((q) => renderQuery(q, false))}
          </>
        )}
      </Box>
    </Box>
  );
}
