"use client";

import { useCallback, useMemo, useState } from "react";
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
  InputAdornment,
  TablePagination,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import CampaignIcon from "@mui/icons-material/Campaign";
import SearchIcon from "@mui/icons-material/Search";
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

  // ── History controls (filter, sort, pagination) ─────────────────────────────
  const [historySearch, setHistorySearch] = useState("");
  const [historyListFilter, setHistoryListFilter] = useState<string>("all"); // "all" | "broadcast-all" | listId
  const [historySort, setHistorySort] = useState<"newest" | "oldest" | "title">("newest");
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRpp, setHistoryRpp] = useState(10);

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

  // Derive filtered + sorted history. Pagination then slices the result.
  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    let rows = history.slice();
    if (q) {
      rows = rows.filter(
        (b: Broadcast) =>
          b.title.toLowerCase().includes(q) ||
          (b.message || "").toLowerCase().includes(q) ||
          (b.sent_by_name || "").toLowerCase().includes(q),
      );
    }
    if (historyListFilter === "broadcast-all") {
      rows = rows.filter((b: Broadcast) => b.target_type === "all");
    } else if (historyListFilter !== "all") {
      const lid = Number(historyListFilter);
      rows = rows.filter(
        (b: Broadcast) => b.target_type === "list" && b.target_list_id === lid,
      );
    }
    rows.sort((a: Broadcast, b: Broadcast) => {
      if (historySort === "title") return a.title.localeCompare(b.title);
      const ad = new Date(a.created_at).getTime();
      const bd = new Date(b.created_at).getTime();
      return historySort === "oldest" ? ad - bd : bd - ad;
    });
    return rows;
  }, [history, historySearch, historyListFilter, historySort]);

  const pagedHistory = filteredHistory.slice(
    historyPage * historyRpp,
    historyPage * historyRpp + historyRpp,
  );

  // Build a quick lookup so list-target chips can show the list name (not just the id).
  const listNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const l of lists) m.set(l.id, l.name);
    return m;
  }, [lists]);

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
                  sx={{ mt: 1, width: { xs: "100%", sm: 240 } }}
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

        {/* Filters: search + by user list + sort */}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.25, md: 2 },
            mb: 2,
            alignItems: "center",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "2fr 1fr 1fr" },
            "& .MuiFormControl-root": { width: "100%" },
          }}
        >
          <TextField
            size="small"
            placeholder={t("common.search")}
            value={historySearch}
            onChange={(e) => {
              setHistorySearch(e.target.value);
              setHistoryPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            label={t("bc.filterByList")}
            value={historyListFilter}
            onChange={(e) => {
              setHistoryListFilter(e.target.value);
              setHistoryPage(0);
            }}
          >
            <MenuItem value="all">{t("common.all")}</MenuItem>
            <MenuItem value="broadcast-all">{t("bc.targetAll")}</MenuItem>
            {lists.map((l: any) => (
              <MenuItem key={l.id} value={String(l.id)}>
                {l.name} ({l.member_count})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t("table.sortBy")}
            value={historySort}
            onChange={(e) => {
              setHistorySort(e.target.value as "newest" | "oldest" | "title");
              setHistoryPage(0);
            }}
          >
            <MenuItem value="newest">{t("sort.newest")}</MenuItem>
            <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
            <MenuItem value="title">{t("sort.title")}</MenuItem>
          </TextField>
        </Box>

        {isLoading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredHistory.length === 0 ? (
          <Paper
            elevation={0}
            sx={{ p: 5, borderRadius: 4, border: `1px dashed ${brandColors.sand}`, textAlign: "center" }}
          >
            <CampaignIcon sx={{ fontSize: 56, color: brandColors.sand, mb: 1 }} />
            <Typography color="text.secondary">{t("bc.empty")}</Typography>
          </Paper>
        ) : (
          <>
            <Stack spacing={2}>
              {pagedHistory.map((b: Broadcast) => (
                <Paper
                  key={b.id}
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: 4,
                    border: `1px solid ${brandColors.sand}`,
                    // Stack image above content on mobile so it gets its full width;
                    // side-by-side from sm and up.
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 1.5, sm: 2 },
                    alignItems: { xs: "stretch", sm: "flex-start" },
                  }}
                >
                  {b.image_path && (
                    <Box
                      sx={{
                        width: { xs: "100%", sm: 140 },
                        height: { xs: 200, sm: 140 },
                        flexShrink: 0,
                        borderRadius: 2,
                        overflow: "hidden",
                        bgcolor: "background.default",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fileUrl(b.image_path)}
                        alt=""
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Box>
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
                      <Typography sx={{ fontWeight: 700, color: brandColors.maroon, wordBreak: "break-word" }}>
                        {b.title}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => setDelTarget(b)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: "pre-wrap", lineHeight: 1.6, mb: 1, wordBreak: "break-word" }}
                    >
                      {b.message}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                      <Chip
                        size="small"
                        label={
                          b.target_type === "all"
                            ? t("bc.targetAll")
                            : listNameById.get(b.target_list_id ?? -1) ||
                              t("bc.targetList", { id: b.target_list_id ?? "" })
                        }
                      />
                      {b.sent_by_name && (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${t("bc.sentBy")}: ${b.sent_by_name}`}
                        />
                      )}
                      <Chip
                        size="small"
                        variant="outlined"
                        label={new Date(b.created_at).toLocaleString()}
                      />
                    </Stack>
                  </Box>
                </Paper>
              ))}
            </Stack>
            <TablePagination
              component="div"
              count={filteredHistory.length}
              page={historyPage}
              onPageChange={(_, p) => setHistoryPage(p)}
              rowsPerPage={historyRpp}
              onRowsPerPageChange={(e) => {
                setHistoryRpp(parseInt(e.target.value, 10));
                setHistoryPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage={t("table.rowsPerPage")}
            />
          </>
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
