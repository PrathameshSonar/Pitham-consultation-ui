"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, TextField, Button, Alert, MenuItem,
  Stack, CircularProgress, Tabs, Tab, IconButton, Radio, RadioGroup,
  FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, List, ListItemButton, ListItemText, Checkbox, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails,
  TablePagination, Snackbar,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import GroupIcon from "@mui/icons-material/Group";
import {
  adminGetDocuments, adminGetGallery, adminUploadGalleryDocument,
  adminDeleteGalleryDocument, adminDeleteAssignedDocument,
  adminBulkAssignFromGallery, adminBulkUploadDocument,
  adminGetUsers, adminGetUserLists, getToken, fileUrl,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

type SortKey = "newest" | "oldest" | "title";

interface AssignedGroup {
  key: string;                 // batch_id or `single-${id}`
  isBatch: boolean;
  label: string;
  created_at: string;
  docs: any[];
}

export default function AdminDocuments() {
  const router = useRouter();
  const { t } = useT();

  const [tab, setTab]           = useState(0);
  const [gallery, setGallery]   = useState<any[]>([]);
  const [assigned, setAssigned] = useState<any[]>([]);
  const [users, setUsers]       = useState<any[]>([]);
  const [lists, setLists]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [snack, setSnack]       = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  // Gallery upload form
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryDesc, setGalleryDesc]   = useState("");
  const [galleryFile, setGalleryFile]   = useState<File | null>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");

  // Assigned view: sort + pagination
  const [sort, setSort]       = useState<SortKey>("newest");
  const [page, setPage]       = useState(0);
  const [rowsPerPage, setRpp] = useState(10);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting]         = useState(false);

  // Quick assign (event mode)
  const [quickDoc, setQuickDoc]               = useState<any>(null);
  const [quickSelectedLists, setQuickSelectedLists] = useState<Set<number>>(new Set());
  const [quickSaving, setQuickSaving]         = useState(false);
  const [quickError, setQuickError]           = useState("");

  // Assign dialog
  const [assignOpen, setAssignOpen]         = useState(false);
  const [assignSource, setAssignSource]     = useState<"gallery" | "upload">("gallery");
  const [assignGalleryId, setAssignGalleryId] = useState("");
  const [assignTitle, setAssignTitle]       = useState("");
  const [assignDesc, setAssignDesc]         = useState("");
  const [assignFile, setAssignFile]         = useState<File | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [userSearch, setUserSearch]         = useState("");
  const [appliedLists, setAppliedLists]     = useState<any[]>([]);
  const [assignSaving, setAssignSaving]     = useState(false);
  const [assignError, setAssignError]       = useState("");

  async function fetchAll() {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    try {
      const [g, d, u, l] = await Promise.all([
        adminGetGallery(token),
        adminGetDocuments(token),
        adminGetUsers(token),
        adminGetUserLists(token),
      ]);
      setGallery(g); setAssigned(d); setUsers(u); setLists(l);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Gallery upload ───────────────────────────────────────────────────────
  async function handleGalleryUpload(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    if (!galleryFile) { setError("Select a file"); return; }
    const token = getToken();
    if (!token) return;
    setError(""); setGalleryUploading(true);
    try {
      const fd = new FormData();
      fd.append("title", galleryTitle);
      fd.append("description", galleryDesc);
      fd.append("file", galleryFile);
      const newDoc = await adminUploadGalleryDocument(fd, token);
      setGallery(prev => [newDoc, ...prev]);
      setGalleryTitle(""); setGalleryDesc(""); setGalleryFile(null);
      setSnack({ msg: "Gallery document uploaded.", severity: "success" });
    } catch (err: any) {
      setError(err?.detail || "Upload failed");
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleDeleteGallery(id: number) {
    if (!confirm("Delete this gallery document? Previously assigned copies will not be affected.")) return;
    const token = getToken();
    if (!token) return;
    try {
      await adminDeleteGalleryDocument(id, token);
      setGallery(prev => prev.filter(g => g.id !== id));
      setSnack({ msg: "Gallery document deleted.", severity: "success" });
    } catch (err: any) {
      setError(err?.detail || "Delete failed");
    }
  }

  // ── Delete assigned ──────────────────────────────────────────────────────
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const token = getToken();
    if (!token) return;
    setDeleting(true);
    try {
      await adminDeleteAssignedDocument(deleteTarget.id, token);
      setAssigned(prev => prev.filter(d => d.id !== deleteTarget.id));
      setSnack({ msg: t("docs.delete.success"), severity: "success" });
      setDeleteTarget(null);
    } catch (err: any) {
      setSnack({ msg: err?.detail || t("docs.delete.error"), severity: "error" });
    } finally {
      setDeleting(false);
    }
  }

  // ── Assign dialog ────────────────────────────────────────────────────────
  function openAssignDialog() {
    setAssignSource("gallery"); setAssignGalleryId("");
    setAssignTitle(""); setAssignDesc(""); setAssignFile(null);
    setSelectedUserIds(new Set()); setUserSearch("");
    setAppliedLists([]); setAssignError("");
    setAssignOpen(true);
  }

  function toggleUser(id: number) {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleList(list: any) {
    const alreadyApplied = appliedLists.some(l => l.id === list.id);
    if (alreadyApplied) {
      setAppliedLists(prev => prev.filter(l => l.id !== list.id));
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        list.member_ids.forEach((id: number) => next.delete(id));
        return next;
      });
    } else {
      setAppliedLists(prev => [...prev, list]);
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        list.member_ids.forEach((id: number) => next.add(id));
        return next;
      });
    }
  }

  function selectAllFiltered() {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      filteredUsers.forEach(u => next.add(u.id));
      return next;
    });
  }

  function clearAllUsers() {
    setSelectedUserIds(new Set());
    setAppliedLists([]);
  }

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u: any) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.city || "").toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  async function handleAssign() {
    const token = getToken();
    if (!token) return;
    if (selectedUserIds.size === 0) { setAssignError("Select at least one user"); return; }

    // Compose batch label — list name(s) if any, else "Bulk: N users"
    const batchLabel =
      appliedLists.length > 0
        ? `List: ${appliedLists.map(l => l.name).join(", ")}`
        : `Bulk: ${selectedUserIds.size} users`;

    setAssignError(""); setAssignSaving(true);
    const ids = Array.from(selectedUserIds);
    try {
      let result;
      if (assignSource === "gallery") {
        if (!assignGalleryId) { setAssignError("Select a gallery document"); setAssignSaving(false); return; }
        result = await adminBulkAssignFromGallery(
          { gallery_doc_id: Number(assignGalleryId), user_ids: ids, batch_label: batchLabel },
          token
        );
      } else {
        if (!assignFile)   { setAssignError("Select a file to upload"); setAssignSaving(false); return; }
        if (!assignTitle)  { setAssignError("Title is required"); setAssignSaving(false); return; }
        const fd = new FormData();
        fd.append("user_ids", JSON.stringify(ids));
        fd.append("title", assignTitle);
        fd.append("description", assignDesc);
        fd.append("batch_label", batchLabel);
        fd.append("file", assignFile);
        result = await adminBulkUploadDocument(fd, token);
      }
      const fresh = await adminGetDocuments(token);
      setAssigned(fresh);
      setAssignOpen(false);
      setSnack({
        msg: `Assigned to ${result.assigned_count} user(s).` +
             (result.skipped?.length ? ` Skipped: ${result.skipped.length}` : ""),
        severity: "success",
      });
    } catch (err: any) {
      setAssignError(err?.detail || "Assignment failed");
    } finally {
      setAssignSaving(false);
    }
  }

  // ── Quick assign (event mode) ─────────────────────────────────────────────
  function openQuickAssign(doc: any) {
    setQuickDoc(doc);
    setQuickSelectedLists(new Set());
    setQuickError("");
  }

  function toggleQuickList(listId: number) {
    setQuickSelectedLists(prev => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId); else next.add(listId);
      return next;
    });
  }

  async function handleQuickAssign() {
    if (!quickDoc) return;
    const token = getToken();
    if (!token) return;
    if (quickSelectedLists.size === 0) {
      setQuickError(t("docs.selectUser"));
      return;
    }

    // Collect all user IDs from selected lists
    const userIdSet = new Set<number>();
    for (const listId of quickSelectedLists) {
      const list = lists.find((l: any) => l.id === listId);
      if (list) {
        list.member_ids.forEach((id: number) => userIdSet.add(id));
      }
    }

    if (userIdSet.size === 0) {
      setQuickError(t("docs.selectUser"));
      return;
    }

    const listNames = Array.from(quickSelectedLists)
      .map(id => lists.find((l: any) => l.id === id)?.name || "")
      .filter(Boolean)
      .join(", ");

    setQuickError(""); setQuickSaving(true);
    try {
      const result = await adminBulkAssignFromGallery(
        {
          gallery_doc_id: quickDoc.id,
          user_ids: Array.from(userIdSet),
          batch_label: `List: ${listNames}`,
        },
        token
      );
      const fresh = await adminGetDocuments(token);
      setAssigned(fresh);
      setQuickDoc(null);
      setSnack({
        msg: `Assigned to ${result.assigned_count} user(s).` +
             (result.skipped?.length ? ` Skipped: ${result.skipped.length}` : ""),
        severity: "success",
      });
    } catch (err: any) {
      setQuickError(err?.detail || "Assignment failed");
    } finally {
      setQuickSaving(false);
    }
  }

  // ── Group assigned docs by batch, then sort ──────────────────────────────
  const groupedAssigned: AssignedGroup[] = useMemo(() => {
    const groups = new Map<string, AssignedGroup>();
    for (const d of assigned) {
      if (d.batch_id) {
        const key = d.batch_id;
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            isBatch: true,
            label: d.batch_label || `${d.title}`,
            created_at: d.created_at,
            docs: [],
          });
        }
        groups.get(key)!.docs.push(d);
      } else {
        const key = `single-${d.id}`;
        groups.set(key, {
          key, isBatch: false,
          label: d.title, created_at: d.created_at, docs: [d],
        });
      }
    }
    const arr = Array.from(groups.values());
    arr.sort((a, b) => {
      if (sort === "title")  return a.label.localeCompare(b.label);
      const ad = new Date(a.created_at).getTime();
      const bd = new Date(b.created_at).getTime();
      return sort === "oldest" ? ad - bd : bd - ad;
    });
    return arr;
  }, [assigned, sort]);

  const paged = groupedAssigned.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
        <Typography sx={s.subtitle}>{t("docs.subtitle")}</Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={s.tabs}>
          <Tab label={`${t("docs.tab.gallery")} (${gallery.length})`} />
          <Tab label={`${t("docs.tab.assigned")} (${assigned.length})`} />
        </Tabs>

        {/* ── TAB 0: Gallery ──────────────────────────────────────────── */}
        {tab === 0 && (
          <>
            <Paper elevation={0} sx={s.sectionCard}>
              <Typography variant="h6" sx={s.sectionTitle}>Upload to Gallery</Typography>
              <Typography sx={s.sectionHint}>
                Upload reusable documents here. Assign them to one or many users from the
                &ldquo;Assigned&rdquo; tab without re-uploading.
              </Typography>
              <Box component="form" onSubmit={handleGalleryUpload}>
                <Stack spacing={2.5}>
                  <TextField label="Title" required value={galleryTitle}
                    onChange={e => setGalleryTitle(e.target.value)} fullWidth
                    placeholder="e.g. Morning Sadhna – Beginner" />
                  <TextField label="Description" value={galleryDesc}
                    onChange={e => setGalleryDesc(e.target.value)} fullWidth />
                  <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}
                    sx={{ alignSelf: "flex-start" }}>
                    {galleryFile ? galleryFile.name : "Choose File"}
                    <input hidden type="file" onChange={e => setGalleryFile(e.target.files?.[0] || null)} />
                  </Button>
                  <Button type="submit" variant="contained" disabled={galleryUploading}
                    sx={{ alignSelf: "flex-start" }}>
                    {galleryUploading ? "Uploading…" : "Add to Gallery"}
                  </Button>
                </Stack>
              </Box>
            </Paper>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <Typography variant="h6" sx={s.sectionTitle}>{t("docs.galleryDocs")}</Typography>
              <TextField
                size="small"
                placeholder={t("docs.searchGallery")}
                value={gallerySearch}
                onChange={e => setGallerySearch(e.target.value)}
                sx={{ minWidth: 240, flex: { xs: 1, sm: "none" } }}
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
            </Box>
            {(() => {
              const q = gallerySearch.trim().toLowerCase();
              const filteredGallery = q
                ? gallery.filter((g: any) =>
                    g.title.toLowerCase().includes(q) ||
                    (g.description || "").toLowerCase().includes(q))
                : gallery;

              if (filteredGallery.length === 0) {
                return (
                  <Box sx={s.emptyBox}>
                    <Typography color="text.secondary">{t("docs.empty.gallery")}</Typography>
                  </Box>
                );
              }
              return (
              <Box sx={s.galleryGrid}>
                {filteredGallery.map((doc: any) => (
                  <Paper key={doc.id} elevation={0} sx={s.galleryCard}>
                    <DescriptionIcon sx={s.galleryDocIcon} />
                    <Typography sx={s.galleryDocTitle}>{doc.title}</Typography>
                    {doc.description && (
                      <Typography variant="caption" color="text.secondary">{doc.description}</Typography>
                    )}
                    <Typography variant="caption" color="text.disabled">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </Typography>
                    <Box sx={s.galleryActions}>
                      <Button component="a"
                        href={fileUrl(doc.file_path)}
                        target="_blank" rel="noreferrer"
                        size="small" startIcon={<DownloadIcon />}>
                        {t("common.view")}
                      </Button>
                      <Button size="small" color="primary"
                        startIcon={<FlashOnIcon />}
                        onClick={() => openQuickAssign(doc)}>
                        {t("docs.quickAssign")}
                      </Button>
                      <IconButton size="small" color="error"
                        onClick={() => handleDeleteGallery(doc.id)} sx={{ ml: "auto" }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
              );
            })()}
          </>
        )}

        {/* ── TAB 1: Assigned ─────────────────────────────────────────── */}
        {tab === 1 && (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
              <TextField
                select
                size="small"
                label={t("table.sortBy")}
                value={sort}
                onChange={e => { setSort(e.target.value as SortKey); setPage(0); }}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="newest">{t("sort.newest")}</MenuItem>
                <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
                <MenuItem value="title">{t("sort.title")}</MenuItem>
              </TextField>
              <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openAssignDialog}>
                {t("docs.assignBtn")}
              </Button>
            </Box>

            {groupedAssigned.length === 0 ? (
              <Box sx={s.emptyBox}>
                <Typography color="text.secondary">{t("docs.empty.assigned")}</Typography>
              </Box>
            ) : (
              <>
                {paged.map((group) => {
                  if (group.isBatch && group.docs.length > 1) {
                    return (
                      <Accordion
                        key={group.key}
                        elevation={0}
                        sx={{ mb: 1.5, borderRadius: "16px !important", border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
                            <GroupIcon color="primary" />
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 700 }}>{group.docs[0].title}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {group.label}
                              </Typography>
                            </Box>
                            <Chip
                              label={t("docs.membersAssigned", { count: group.docs.length })}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          {group.docs.map((doc: any) => {
                            const u = users.find(x => x.id === doc.user_id);
                            return (
                              <Box key={doc.id} sx={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                py: 1, borderTop: "1px dashed", borderColor: "divider", gap: 2,
                              }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {u ? u.name : `User #${doc.user_id}`}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {u?.email}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <Button component="a"
                                    href={fileUrl(doc.file_path)}
                                    target="_blank" rel="noreferrer"
                                    size="small" startIcon={<DownloadIcon />}>
                                    {t("common.view")}
                                  </Button>
                                  <IconButton size="small" color="error" onClick={() => setDeleteTarget(doc)}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            );
                          })}
                        </AccordionDetails>
                      </Accordion>
                    );
                  }

                  // Individual assignment
                  const doc = group.docs[0];
                  const u = users.find(x => x.id === doc.user_id);
                  return (
                    <Paper key={group.key} elevation={0} sx={s.listItem}>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{doc.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          For: {u ? `${u.name} (${u.email})` : `User #${doc.user_id}`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button component="a"
                          href={fileUrl(doc.file_path)}
                          target="_blank" rel="noreferrer"
                          size="small" startIcon={<DownloadIcon />}>
                          {t("common.download")}
                        </Button>
                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(doc)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  );
                })}

                <TablePagination
                  component="div"
                  count={groupedAssigned.length}
                  page={page}
                  onPageChange={(_, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={e => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage={t("table.rowsPerPage")}
                />
              </>
            )}
          </>
        )}
      </Box>

      {/* ── Delete confirmation dialog ───────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>
          {t("common.delete")}
        </DialogTitle>
        <DialogContent>
          <Typography>{t("docs.delete.confirm")}</Typography>
          {deleteTarget && (
            <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{deleteTarget.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(users.find(u => u.id === deleteTarget.user_id) || { name: `User #${deleteTarget.user_id}`, email: "" }).name}
              </Typography>
            </Paper>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>{t("common.cancel")}</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? t("common.saving") : t("common.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk-assign dialog ──────────────────────────────────────────── */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 700, color: "primary.dark" }}>
          {t("docs.assignBtn")}
        </DialogTitle>
        <DialogContent>
          {assignError && <Alert severity="error" sx={{ mb: 2 }}>{assignError}</Alert>}

          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* 1. Document source */}
            <Box>
              <Typography variant="caption" color="text.secondary">Document Source</Typography>
              <RadioGroup row value={assignSource}
                onChange={e => setAssignSource(e.target.value as "gallery" | "upload")}
                sx={{ mt: 0.5 }}>
                <FormControlLabel value="gallery" control={<Radio />} label="From Gallery" />
                <FormControlLabel value="upload"  control={<Radio />} label="Upload New" />
              </RadioGroup>

              {assignSource === "gallery" ? (
                gallery.length === 0 ? (
                  <Alert severity="info">
                    Your gallery is empty. Switch to &ldquo;Upload New&rdquo; or add documents to the gallery first.
                  </Alert>
                ) : (
                  <TextField select label="Gallery Document" required value={assignGalleryId}
                    onChange={e => setAssignGalleryId(e.target.value)} fullWidth sx={{ mt: 1 }}>
                    <MenuItem value="">Select a document…</MenuItem>
                    {gallery.map((doc: any) => (
                      <MenuItem key={doc.id} value={doc.id}>{doc.title}</MenuItem>
                    ))}
                  </TextField>
                )
              ) : (
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField label="Title" required value={assignTitle}
                    onChange={e => setAssignTitle(e.target.value)} fullWidth />
                  <TextField label="Description" value={assignDesc}
                    onChange={e => setAssignDesc(e.target.value)} fullWidth />
                  <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}
                    sx={{ alignSelf: "flex-start" }}>
                    {assignFile ? assignFile.name : "Choose File"}
                    <input hidden type="file" onChange={e => setAssignFile(e.target.files?.[0] || null)} />
                  </Button>
                </Stack>
              )}
            </Box>

            {/* 2. Lists quick-pick */}
            {lists.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Quick-pick from User Lists</Typography>
                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {lists.map((l: any) => {
                    const applied = appliedLists.some(x => x.id === l.id);
                    return (
                      <Chip
                        key={l.id}
                        label={`${l.name} (${l.member_count})`}
                        onClick={() => toggleList(l)}
                        color={applied ? "primary" : "default"}
                        variant={applied ? "filled" : "outlined"}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* 3. User picker */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Users ({selectedUserIds.size} selected)
              </Typography>
              <TextField
                placeholder="Search users…"
                fullWidth size="small" sx={{ mt: 1, mb: 1 }}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
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
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <Button size="small" onClick={selectAllFiltered}>Select all filtered</Button>
                <Button size="small" onClick={clearAllUsers}>Clear all</Button>
              </Box>
              <Box sx={{
                maxHeight: 280, overflow: "auto",
                border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper",
              }}>
                <List dense disablePadding>
                  {filteredUsers.map((u: any) => (
                    <ListItemButton key={u.id} onClick={() => toggleUser(u.id)}>
                      <Checkbox edge="start" tabIndex={-1} disableRipple
                        checked={selectedUserIds.has(u.id)} />
                      <ListItemText
                        primary={u.name}
                        secondary={`${u.email} · ${u.city || ""}${u.state ? ", " + u.state : ""}`}
                      />
                    </ListItemButton>
                  ))}
                  {filteredUsers.length === 0 && (
                    <Box sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="caption" color="text.secondary">No users match.</Typography>
                    </Box>
                  )}
                </List>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAssignOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleAssign} disabled={assignSaving}>
            {assignSaving ? t("common.saving") : `Assign to ${selectedUserIds.size}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Quick Assign dialog (event mode) ──────────────────────────── */}
      <Dialog open={!!quickDoc} onClose={() => setQuickDoc(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: "primary.dark" }}>
          <FlashOnIcon sx={{ verticalAlign: "middle", mr: 0.5 }} />
          {t("docs.quickAssign")}
        </DialogTitle>
        <DialogContent>
          {quickError && <Alert severity="error" sx={{ mb: 2 }}>{quickError}</Alert>}
          {quickDoc && (
            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>{quickDoc.title}</Typography>
                {quickDoc.description && (
                  <Typography variant="body2" color="text.secondary">{quickDoc.description}</Typography>
                )}
              </Paper>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t("docs.quickPick")}
                </Typography>
                {lists.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("lists.empty")}
                  </Typography>
                ) : (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {lists.map((l: any) => {
                      const selected = quickSelectedLists.has(l.id);
                      return (
                        <Chip
                          key={l.id}
                          label={`${l.name} (${l.member_count} ${l.member_count === 1 ? t("lists.member") : t("lists.members")})`}
                          onClick={() => toggleQuickList(l.id)}
                          color={selected ? "primary" : "default"}
                          variant={selected ? "filled" : "outlined"}
                          sx={{ cursor: "pointer" }}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>

              {quickSelectedLists.size > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {(() => {
                    const count = new Set<number>();
                    for (const listId of quickSelectedLists) {
                      const list = lists.find((l: any) => l.id === listId);
                      if (list) list.member_ids.forEach((id: number) => count.add(id));
                    }
                    return t("docs.assignTo", { count: count.size });
                  })()}
                </Typography>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setQuickDoc(null)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            startIcon={<FlashOnIcon />}
            onClick={handleQuickAssign}
            disabled={quickSaving || quickSelectedLists.size === 0}
          >
            {quickSaving ? t("common.saving") : t("docs.quickAssign")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ────────────────────────────────────────────────────── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
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
