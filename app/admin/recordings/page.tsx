"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  MenuItem,
  Stack,
  CircularProgress,
  Chip,
  InputAdornment,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import GroupIcon from "@mui/icons-material/Group";
import LinkIcon from "@mui/icons-material/Link";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PeopleIcon from "@mui/icons-material/People";
import {
  adminGetRecordings,
  adminBulkAssignRecording,
  adminDeleteRecording,
  adminLookupUsers,
  adminGetUserLists,
  getToken,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { useRequireSection } from "@/lib/useRequireSection";

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4";
const CONTAINER_CLASS = "max-w-[900px] mx-auto";

type SortKey = "newest" | "oldest" | "title";

interface RecordingGroup {
  key: string;
  title: string;
  url: string;
  created_at: string;
  records: any[];
}

export default function AdminRecordings() {
  const router = useRouter();
  const { t } = useT();
  const gate = useRequireSection("recordings");
  const [recordings, setRecordings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignUrl, setAssignUrl] = useState("");
  const [selectedListIds, setSelectedListIds] = useState<Set<number>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState("");

  async function reload() {
    const token = getToken();
    if (!token) return;
    const recs = await adminGetRecordings(token);
    setRecordings(recs);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    Promise.all([adminGetRecordings(token), adminLookupUsers(token, { limit: 200 }), adminGetUserLists(token)])
      .then(([r, u, l]) => {
        setRecordings(r);
        setUsers(u);
        setLists(l);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const grouped: RecordingGroup[] = useMemo(() => {
    const groups = new Map<string, RecordingGroup>();
    for (const r of recordings) {
      const key = `${r.title}|||${r.zoom_recording_url}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          title: r.title,
          url: r.zoom_recording_url,
          created_at: r.created_at,
          records: [],
        });
      }
      groups.get(key)!.records.push(r);
    }
    return Array.from(groups.values());
  }, [recordings]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = grouped;
    if (q) {
      list = list.filter((g) => g.title.toLowerCase().includes(q) || g.url.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const ad = new Date(a.created_at).getTime();
      const bd = new Date(b.created_at).getTime();
      return sort === "oldest" ? ad - bd : bd - ad;
    });
    return list;
  }, [grouped, search, sort]);

  const paged = filtered.slice(page * rpp, page * rpp + rpp);

  function toggleList(id: number) {
    setSelectedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openAssign() {
    setAssignTitle("");
    setAssignUrl("");
    setSelectedListIds(new Set());
    setAssignError("");
    setAssignOpen(true);
  }

  async function handleAssign() {
    if (!assignTitle.trim()) {
      setAssignError(t("common.required"));
      return;
    }
    if (!assignUrl.trim()) {
      setAssignError(t("common.required"));
      return;
    }
    if (selectedListIds.size === 0) {
      setAssignError(t("rec.selectList"));
      return;
    }

    const token = getToken();
    if (!token) return;
    setAssignError("");
    setAssignSaving(true);
    try {
      const result = await adminBulkAssignRecording(
        {
          title: assignTitle.trim(),
          recording_url: assignUrl.trim(),
          list_ids: Array.from(selectedListIds),
        },
        token,
      );
      setAssignOpen(false);
      await reload();
      setSnack({
        msg: `${t("rec.assigned")} ${result.assigned_count} ${t("rec.users")}`,
        severity: "success",
      });
    } catch (err: any) {
      setAssignError(err?.detail || "Failed");
    } finally {
      setAssignSaving(false);
    }
  }

  async function handleDeleteGroup(group: RecordingGroup) {
    const token = getToken();
    if (!token) return;
    try {
      for (const r of group.records) {
        await adminDeleteRecording(r.id, token);
      }
      await reload();
      setSnack({ msg: t("rec.deleted"), severity: "success" });
    } catch (err: any) {
      setSnack({ msg: err?.detail || "Failed", severity: "error" });
    }
  }

  async function handleDeleteSingle(id: number) {
    const token = getToken();
    if (!token) return;
    try {
      await adminDeleteRecording(id, token);
      await reload();
      setSnack({ msg: t("rec.deleted"), severity: "success" });
    } catch (err: any) {
      setSnack({ msg: err?.detail || "Failed", severity: "error" });
    }
  }

  if (gate !== "allowed" || loading) {
    return (
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Box className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-3 sm:gap-4">
          <Typography variant="h4" className="!text-brand-maroon !font-bold !mb-0">
            {t("rec.admin.title")}
          </Typography>
          <Button
            variant="contained"
            startIcon={<GroupIcon />}
            onClick={openAssign}
            className="!w-full sm:!w-auto sm:!self-auto"
          >
            {t("rec.assignToList")}
          </Button>
        </Box>

        <Box className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-[2fr_1fr] [&_.MuiFormControl-root]:!w-full">
          <TextField
            size="small"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            label={t("table.sortBy")}
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(0);
            }}
          >
            <MenuItem value="newest">{t("sort.newest")}</MenuItem>
            <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
            <MenuItem value="title">{t("sort.title")}</MenuItem>
          </TextField>
        </Box>

        {filtered.length === 0 ? (
          <Paper elevation={0} className="!p-10 !text-center !rounded-3xl">
            <Typography color="text.secondary">{t("rec.none")}</Typography>
          </Paper>
        ) : (
          <>
            {paged.map((group) => (
              <Accordion
                key={group.key}
                elevation={0}
                className="!mb-3 !rounded-2xl !border !border-[#E8D9BF] [&::before]:!hidden"
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  className="[&_.MuiAccordionSummary-content]:!min-w-0 [&_.MuiAccordionSummary-content]:!my-2 sm:[&_.MuiAccordionSummary-content]:!my-3"
                >
                  <Box className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full min-w-0">
                    <Box className="flex items-center gap-3 min-w-0 flex-1 w-full">
                      <PlayCircleIcon color="primary" className="!shrink-0" />
                      <Box className="flex-1 min-w-0">
                        <Typography className="!font-bold !break-words">{group.title}</Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          className="!break-all !block"
                        >
                          {group.url}
                        </Typography>
                      </Box>
                    </Box>
                    <Box className="flex items-center gap-2 shrink-0 ml-8 sm:ml-0">
                      <Chip
                        icon={<PeopleIcon />}
                        label={`${group.records.length} ${t("rec.users")}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        className="!whitespace-nowrap"
                      >
                        {new Date(group.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails className="!pt-0">
                  <Box className="flex gap-2 mb-4 flex-wrap [&>.MuiButton-root]:!flex-[1_1_100%] sm:[&>.MuiButton-root]:!flex-none">
                    <Button
                      component="a"
                      href={group.url}
                      target="_blank"
                      rel="noreferrer"
                      size="small"
                      variant="outlined"
                      startIcon={<PlayCircleIcon />}
                    >
                      {t("rec.watch")}
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        if (confirm(`${t("common.delete")}? (${group.records.length} ${t("rec.users")})`))
                          handleDeleteGroup(group);
                      }}
                    >
                      {t("rec.deleteAll")}
                    </Button>
                  </Box>
                  <Typography variant="subtitle2" className="!mb-2 !font-semibold">
                    {t("rec.assignedTo")}:
                  </Typography>
                  <Box className="flex flex-wrap gap-1">
                    {group.records.map((r: any) => {
                      const u = users.find((x) => x.id === r.user_id);
                      return (
                        <Chip
                          key={r.id}
                          label={u ? u.name : `#${r.user_id}`}
                          size="small"
                          variant="outlined"
                          onDelete={() => handleDeleteSingle(r.id)}
                        />
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rpp}
              onRowsPerPageChange={(e) => {
                setRpp(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage={t("table.rowsPerPage")}
            />
          </>
        )}
      </Box>

      {/* Bulk assign dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle className="!font-bold !text-brand-saffron-dark">{t("rec.assignToList")}</DialogTitle>
        <DialogContent>
          {assignError && (
            <Alert severity="error" className="!mb-4">
              {assignError}
            </Alert>
          )}
          <Stack spacing={2.5} className="!mt-2">
            <TextField
              label={t("rec.recordingTitle")}
              required
              fullWidth
              value={assignTitle}
              onChange={(e) => setAssignTitle(e.target.value)}
              placeholder="e.g. Sadhna Video – April 2026"
              slotProps={{ htmlInput: { "aria-label": t("rec.recordingTitle") } }}
            />
            <TextField
              label={t("rec.recordingUrl")}
              required
              fullWidth
              value={assignUrl}
              onChange={(e) => setAssignUrl(e.target.value)}
              placeholder="https://zoom.us/rec/... or YouTube link"
              slotProps={{
                htmlInput: { "aria-label": t("rec.recordingUrl") },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box>
              <Typography variant="subtitle2" className="!mb-2">
                {t("rec.selectLists")}
              </Typography>
              {lists.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("lists.empty")}
                </Typography>
              ) : (
                <Box className="flex gap-2 flex-wrap">
                  {lists.map((l: any) => {
                    const selected = selectedListIds.has(l.id);
                    return (
                      <Chip
                        key={l.id}
                        label={`${l.name} (${l.member_count})`}
                        onClick={() => toggleList(l.id)}
                        color={selected ? "primary" : "default"}
                        variant={selected ? "filled" : "outlined"}
                        className="!cursor-pointer"
                      />
                    );
                  })}
                </Box>
              )}
            </Box>
            {selectedListIds.size > 0 && (
              <Typography variant="body2" color="text.secondary">
                {(() => {
                  const count = new Set<number>();
                  for (const lid of selectedListIds) {
                    const list = lists.find((l: any) => l.id === lid);
                    if (list) list.member_ids.forEach((id: number) => count.add(id));
                  }
                  return `${count.size} ${t("rec.users")} ${t("lists.selected").toLowerCase()}`;
                })()}
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setAssignOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleAssign} disabled={assignSaving}>
            {assignSaving ? t("common.saving") : t("rec.assignBtn")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
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
