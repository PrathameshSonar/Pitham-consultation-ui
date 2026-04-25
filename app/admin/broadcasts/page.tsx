"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CampaignIcon from "@mui/icons-material/Campaign";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminListBroadcasts,
  adminCreateBroadcast,
  adminDeleteBroadcast,
  adminGetUserLists,
  getToken,
  fileUrl,
  type Broadcast,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";
import * as s from "../styles";

export default function AdminBroadcastsPage() {
  const router = useRouter();
  const { t } = useT();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"all" | "list">("all");
  const [listId, setListId] = useState<number | "">("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [delTarget, setDelTarget] = useState<Broadcast | null>(null);

  const token = getToken();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["broadcasts", "admin"],
    queryFn: () => adminListBroadcasts(token),
    enabled: !!token,
  });

  const { data: lists = [] } = useQuery({
    queryKey: ["user-lists"],
    queryFn: () => adminGetUserLists(token),
    enabled: !!token,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: () =>
      adminCreateBroadcast(
        {
          title: title.trim(),
          message: message.trim(),
          target_type: target,
          target_list_id: target === "list" ? Number(listId) : undefined,
          image,
        },
        token,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broadcasts", "admin"] });
      setSnack({ msg: t("bc.sent"), severity: "success" });
      setTitle("");
      setMessage("");
      setImage(null);
      setError("");
    },
    onError: (e: any) => setError(e?.detail || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminDeleteBroadcast(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["broadcasts", "admin"] });
      setSnack({ msg: t("bc.deleted"), severity: "success" });
      setDelTarget(null);
    },
    onError: (e: any) => {
      setSnack({ msg: e?.detail || "Failed", severity: "error" });
      setDelTarget(null);
    },
  });

  const handleSend = useCallback(() => {
    if (!title.trim() || !message.trim()) {
      setError(t("bc.titleRequired"));
      return;
    }
    if (target === "list" && !listId) {
      setError(t("bc.listRequired"));
      return;
    }
    setError("");
    sendMutation.mutate();
  }, [title, message, target, listId, sendMutation, t]);

  if (!token) {
    router.push("/login");
    return null;
  }

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Typography variant="h4" sx={s.headerTitle}>
          {t("bc.title")}
        </Typography>
        <Typography sx={s.headerSubtitle}>{t("bc.subtitle")}</Typography>

        {/* Compose */}
        <Paper
          elevation={0}
          sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${brandColors.sand}`, mt: 3 }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2.5}>
            <TextField
              label={t("bc.subjectLabel")}
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label={t("bc.message")}
              required
              fullWidth
              multiline
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                {t("bc.target")}
              </Typography>
              <RadioGroup row value={target} onChange={(e) => setTarget(e.target.value as "all" | "list")}>
                <FormControlLabel value="all" control={<Radio />} label={t("bc.target.all")} />
                <FormControlLabel value="list" control={<Radio />} label={t("bc.target.list")} />
              </RadioGroup>
              {target === "list" && (
                <TextField
                  select
                  label={t("bc.list")}
                  value={listId}
                  onChange={(e) => setListId(Number(e.target.value) || "")}
                  sx={{ mt: 1, minWidth: 240 }}
                  size="small"
                >
                  {lists.map((l: any) => (
                    <MenuItem key={l.id} value={l.id}>
                      {l.name} ({l.member_count})
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
            <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Button component="label" variant="outlined" size="small" startIcon={<CloudUploadIcon />}>
                {image ? image.name : t("bc.attach")}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              </Button>
              {image && <Chip size="small" label={`${(image.size / 1024).toFixed(0)} KB`} />}
            </Stack>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleSend}
              disabled={sendMutation.isPending}
              size="large"
            >
              {sendMutation.isPending ? t("common.saving") : t("bc.send")}
            </Button>
          </Stack>
        </Paper>

        {/* History */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mt: 5, mb: 2 }}>
          {t("bc.history")}
        </Typography>
        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : history.length === 0 ? (
          <Paper
            elevation={0}
            sx={{ p: 5, borderRadius: 4, border: `1px dashed ${brandColors.sand}`, textAlign: "center" }}
          >
            <CampaignIcon sx={{ fontSize: 56, color: brandColors.sand, mb: 1 }} />
            <Typography color="text.secondary">{t("bc.empty")}</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {history.map((b: Broadcast) => (
              <Paper
                key={b.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 4,
                  border: `1px solid ${brandColors.sand}`,
                  display: "flex",
                  gap: 2,
                  alignItems: "flex-start",
                }}
              >
                {b.image_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl(b.image_path)}
                    alt=""
                    loading="lazy"
                    style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, color: brandColors.maroon }}>{b.title}</Typography>
                    <IconButton size="small" color="error" onClick={() => setDelTarget(b)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, mb: 1 }}
                  >
                    {b.message}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      label={
                        b.target_type === "all"
                          ? t("bc.targetAll")
                          : t("bc.targetList", { id: b.target_list_id ?? "" })
                      }
                    />
                    {b.sent_by_name && (
                      <Chip size="small" variant="outlined" label={`${t("bc.sentBy")}: ${b.sent_by_name}`} />
                    )}
                    <Chip size="small" variant="outlined" label={new Date(b.created_at).toLocaleString()} />
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <Dialog
        open={!!delTarget}
        onClose={() => !deleteMutation.isPending && setDelTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>{t("common.delete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("bc.delete.confirm")}</Typography>
          {delTarget && (
            <Paper
              elevation={0}
              sx={{ mt: 2, p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
            >
              <Typography sx={{ fontWeight: 600 }}>{delTarget.title}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDelTarget(null)} disabled={deleteMutation.isPending}>
            {t("common.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => delTarget && deleteMutation.mutate(delTarget.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t("common.saving") : t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
