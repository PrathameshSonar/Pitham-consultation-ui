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

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4";
const CONTAINER_CLASS = "max-w-[1200px] mx-auto";

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

  const [historySearch, setHistorySearch] = useState("");
  const [historyListFilter, setHistoryListFilter] = useState<string>("all");
  const [historySort, setHistorySort] = useState<"newest" | "oldest" | "title">("newest");
  const [historyPage, setHistoryPage] = useState(0);
  const [historyRpp, setHistoryRpp] = useState(10);

  const token = getToken();

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
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Typography variant="h4" className="!text-brand-maroon !font-bold !mb-1">
          {t("bc.title")}
        </Typography>
        <Typography className="!text-brand-text-medium">{t("bc.subtitle")}</Typography>

        {/* Compose */}
        <Paper
          elevation={0}
          className="!p-6 md:!p-8 !rounded-3xl !border !border-brand-sand !mt-6"
        >
          {error && (
            <Alert severity="error" className="!mb-4">
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
              <Typography
                variant="caption"
                color="text.secondary"
                className="!block !mb-1"
              >
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
                  className="!mt-2 !w-full sm:!w-60"
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
            <Stack
              direction="row"
              spacing={1.5}
              useFlexGap
              className="!items-center !flex-wrap"
            >
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
        <Typography
          variant="h6"
          className="!font-bold !text-brand-maroon !mt-10 !mb-4"
        >
          {t("bc.history")}
        </Typography>

        {/* Filters: search + by user list + sort */}
        <Box className="grid gap-3 md:gap-4 mb-4 items-center grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr] [&_.MuiFormControl-root]:!w-full">
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
          <Box className="text-center py-8">
            <CircularProgress />
          </Box>
        ) : filteredHistory.length === 0 ? (
          <Paper
            elevation={0}
            className="!p-10 !rounded-3xl !border !border-dashed !border-brand-sand !text-center"
          >
            <CampaignIcon className="!text-[56px] !text-brand-sand !mb-2" />
            <Typography color="text.secondary">{t("bc.empty")}</Typography>
          </Paper>
        ) : (
          <>
            <Stack spacing={2}>
              {pagedHistory.map((b: Broadcast) => (
                <Paper
                  key={b.id}
                  elevation={0}
                  className="!p-4 md:!p-5 !rounded-3xl !border !border-brand-sand !flex !flex-col sm:!flex-row !gap-3 sm:!gap-4 !items-stretch sm:!items-start"
                >
                  {b.image_path && (
                    <Box className="w-full sm:w-[140px] h-[200px] sm:h-[140px] shrink-0 rounded-lg overflow-hidden bg-brand-cream">
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
                  <Box className="flex-1 min-w-0">
                    <Box className="flex justify-between items-start gap-2 mb-1">
                      <Typography className="!font-bold !text-brand-maroon !break-words">
                        {b.title}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => setDelTarget(b)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      className="!whitespace-pre-wrap !leading-relaxed !mb-2 !break-words"
                    >
                      {b.message}
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap className="!flex-wrap">
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
        <DialogTitle className="!font-bold !text-brand-error">
          {t("common.delete")}
        </DialogTitle>
        <DialogContent>
          <Typography>{t("bc.delete.confirm")}</Typography>
          {delTarget && (
            <Paper
              elevation={0}
              className="!mt-4 !p-4 !border !border-[#E8D9BF] !rounded-lg"
            >
              <Typography className="!font-semibold">{delTarget.title}</Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
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
          <Alert severity={snack.severity} onClose={() => setSnack(null)} className="!w-full">
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
