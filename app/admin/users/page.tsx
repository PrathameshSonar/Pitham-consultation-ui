"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, Button, TextField, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TablePagination,
  MenuItem, Snackbar, Alert, Stack,
  Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HistoryIcon from "@mui/icons-material/History";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  adminGetUsers, adminGetUser, adminGetUserAppointments,
  adminGetUserDocuments, adminDeleteAssignedDocument, getToken, fileUrl,
} from "@/services/api";
import { formatTime12h } from "@/lib/timeSlots";
import { statusChipColors } from "@/theme/sharedStyles";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

type SortKey = "newest" | "oldest" | "name" | "joinedOn";

export default function AdminUsers() {
  const router = useRouter();
  const { t } = useT();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch]   = useState("");
  const [city, setCity]       = useState("");
  const [state, setState]     = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [userAppts, setUserAppts] = useState<any[]>([]);
  const [userDocs, setUserDocs]   = useState<any[]>([]);

  // Pagination + sort
  const [page, setPage]       = useState(0);
  const [rowsPerPage, setRpp] = useState(10);
  const [sort, setSort]       = useState<SortKey>("newest");

  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [viewAppt, setViewAppt] = useState<any>(null);

  function fetchUsers() {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    adminGetUsers(token, { search, city, state, country })
      .then(setUsers)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function viewUser(user: any) {
    const token = getToken();
    if (!token) return;
    const [full, appts, docs] = await Promise.all([
      adminGetUser(user.id, token),
      adminGetUserAppointments(user.id, token),
      adminGetUserDocuments(user.id, token),
    ]);
    setSelected(full);
    setUserAppts(appts);
    setUserDocs(docs);
  }

  async function handleDeleteDoc(docId: number) {
    const token = getToken();
    if (!token || !selected) return;
    try {
      await adminDeleteAssignedDocument(docId, token);
      setUserDocs(prev => prev.filter(d => d.id !== docId));
      setSnack({ msg: t("docs.delete.success"), severity: "success" });
    } catch (err: any) {
      setSnack({ msg: err?.detail || t("docs.delete.error"), severity: "error" });
    }
  }

  // Sort
  const sortedUsers = [...users].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    const ad = new Date(a.created_at).getTime();
    const bd = new Date(b.created_at).getTime();
    if (sort === "joinedOn") return ad - bd; // oldest joined first
    return sort === "oldest" ? ad - bd : bd - ad;
  });
  const paged = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Typography variant="h4" sx={s.title}>{t("users.title")}</Typography>

        <Paper elevation={0} sx={s.filtersCard}>
          <TextField size="small" placeholder={t("users.searchName")} value={search}
            onChange={e => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 180 }} />
          <TextField size="small" placeholder={t("users.city")} value={city}
            onChange={e => setCity(e.target.value)} sx={{ width: 140 }} />
          <TextField size="small" placeholder={t("users.state")} value={state}
            onChange={e => setState(e.target.value)} sx={{ width: 140 }} />
          <TextField size="small" placeholder={t("users.country")} value={country}
            onChange={e => setCountry(e.target.value)} sx={{ width: 140 }} />
          <TextField
            select size="small" label={t("table.sortBy")} value={sort}
            onChange={e => { setSort(e.target.value as SortKey); setPage(0); }}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="newest">{t("sort.newest")}</MenuItem>
            <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
            <MenuItem value="name">{t("sort.name")}</MenuItem>
            <MenuItem value="joinedOn">{t("sort.joinedOn")}</MenuItem>
          </TextField>
          <Button variant="contained" startIcon={<SearchIcon />} onClick={() => { fetchUsers(); setPage(0); }}>
            {t("common.search")}
          </Button>
        </Paper>

        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}><CircularProgress color="primary" /></Box>
        ) : users.length === 0 ? (
          <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: 4 }}>
            <Typography color="text.secondary">No users found.</Typography>
          </Paper>
        ) : (
          <>
            <Paper elevation={0} sx={s.tablePaper}>
              <Table>
                <TableHead>
                  <TableRow sx={s.tableHeadRow}>
                    {[
                      t("common.name"), t("common.email"), t("common.mobile"),
                      t("users.city"), t("users.state"), t("users.country"),
                      t("users.joined"), "",
                    ].map((h, i) => (
                      <TableCell key={i}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((u: any) => (
                    <TableRow key={u.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.mobile}</TableCell>
                      <TableCell>{u.city}</TableCell>
                      <TableCell>{u.state}</TableCell>
                      <TableCell>{u.country}</TableCell>
                      <TableCell sx={{ color: "text.disabled" }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => viewUser(u)}>{t("common.view")}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={sortedUsers.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                labelRowsPerPage={t("table.rowsPerPage")}
              />
            </Paper>
          </>
        )}
      </Box>

      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        {selected && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "primary.dark" }}>
              {selected.name}
              <IconButton onClick={() => setSelected(null)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={s.detailGrid}>
                {[
                  [t("common.email"), selected.email],
                  [t("common.mobile"), selected.mobile],
                  [t("users.dob"), selected.dob],
                  [t("users.tob"), selected.tob],
                  [t("users.birthPlace"), selected.birth_place],
                  [t("users.city"), selected.city],
                  [t("users.state"), selected.state],
                  [t("users.country"), selected.country],
                  [t("users.joined"), new Date(selected.created_at).toLocaleDateString()],
                ].map(([k, v], i) => (
                  <Box key={i}>
                    <Typography variant="caption" color="text.disabled">{k}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{v}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Consultation history */}
              <Accordion
                elevation={0}
                defaultExpanded
                sx={{ mb: 1.5, borderRadius: "12px !important", border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <HistoryIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography sx={{ fontWeight: 700, color: "primary.dark" }}>
                    {t("users.history")} ({userAppts.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {userAppts.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 2 }}>{t("users.noAppts")}</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}>{t("common.name")}</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}>{t("users.dob")} / {t("users.tob")}</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}>{t("users.birthPlace")}</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}>{t("common.date")}</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}>{t("appts.problem")}</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}>{t("common.actions")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userAppts.map((a: any) => (
                          <TableRow key={a.id} hover>
                            <TableCell sx={{ py: 1, whiteSpace: "nowrap" }}>{a.name}</TableCell>
                            <TableCell sx={{ py: 1, whiteSpace: "nowrap" }}>
                              {a.dob} · {formatTime12h(a.tob)}
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>{a.birth_place}</TableCell>
                            <TableCell sx={{ py: 1, whiteSpace: "nowrap" }}>
                              {a.scheduled_date || "–"}
                            </TableCell>
                            <TableCell sx={{ py: 1, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {a.problem}
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Chip label={a.status.replace("_", " ")} size="small" sx={{ textTransform: "capitalize" }} />
                                <IconButton size="small" color="primary" onClick={() => setViewAppt(a)}>
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionDetails>
              </Accordion>

              {/* Sadhna documents */}
              <Accordion
                elevation={0}
                defaultExpanded
                sx={{ borderRadius: "12px !important", border: "1px solid", borderColor: "divider", "&:before": { display: "none" } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <DescriptionIcon sx={{ mr: 1, color: "warning.main" }} />
                  <Typography sx={{ fontWeight: 700, color: "primary.dark" }}>
                    {t("users.docs")} ({userDocs.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  {userDocs.length === 0 ? (
                    <Typography color="text.secondary" sx={{ p: 2 }}>{t("users.noDocs")}</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}>{t("common.title")}</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}>{t("common.date")}</TableCell>
                          <TableCell sx={{ fontWeight: 700, py: 1 }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userDocs.map((doc: any) => (
                          <TableRow key={doc.id} hover>
                            <TableCell sx={{ py: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <DescriptionIcon fontSize="small" color="warning" />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{doc.title}</Typography>
                                  {doc.batch_label && (
                                    <Typography variant="caption" color="text.disabled">{doc.batch_label}</Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 1, whiteSpace: "nowrap", color: "text.disabled" }}>
                              {new Date(doc.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell sx={{ py: 1 }}>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Button
                                  component="a"
                                  href={fileUrl(doc.file_path)}
                                  target="_blank"
                                  rel="noreferrer"
                                  size="small"
                                  startIcon={<DownloadIcon />}
                                >
                                  {t("common.view")}
                                </Button>
                                <IconButton size="small" color="error"
                                  onClick={() => { if (confirm(t("docs.delete.confirm"))) handleDeleteDoc(doc.id); }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </AccordionDetails>
              </Accordion>
            </DialogContent>
          </>
        )}
      </Dialog>
      {/* Appointment detail dialog */}
      <Dialog open={!!viewAppt} onClose={() => setViewAppt(null)} fullWidth maxWidth="sm">
        {viewAppt && (
          <>
            <DialogTitle sx={{ fontWeight: 700, color: "primary.dark", display: "flex", justifyContent: "space-between" }}>
              {t("appts.details")}
              <IconButton onClick={() => setViewAppt(null)} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {[
                    [t("common.name"), viewAppt.name],
                    [t("common.email"), viewAppt.email],
                    [t("common.mobile"), viewAppt.mobile],
                    [t("users.dob"), viewAppt.dob],
                    [t("users.tob"), formatTime12h(viewAppt.tob)],
                    [t("users.birthPlace"), viewAppt.birth_place],
                  ].map(([k, v], i) => (
                    <Box key={i}>
                      <Typography variant="caption" color="text.disabled">{k}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled">{t("appts.problem")}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{viewAppt.problem}</Typography>
                </Box>
                {viewAppt.selfie_path && (
                  <Box
                    component="img"
                    src={fileUrl(viewAppt.selfie_path)}
                    alt="selfie"
                    sx={{ maxWidth: 200, maxHeight: 200, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                  />
                )}
                {viewAppt.scheduled_date && (
                  <Box>
                    <Typography variant="caption" color="text.disabled">{t("history.dateTime")}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {viewAppt.scheduled_date} · {formatTime12h(viewAppt.scheduled_time)}
                    </Typography>
                  </Box>
                )}
                {viewAppt.analysis_path && (
                  <Button component="a" href={fileUrl(viewAppt.analysis_path)}
                    target="_blank" rel="noreferrer" variant="outlined" size="small"
                    startIcon={<DescriptionIcon />}>
                    {t("appts.viewAnalysis")}
                  </Button>
                )}
                {viewAppt.recording_link && (
                  <Button component="a" href={viewAppt.recording_link}
                    target="_blank" rel="noreferrer" variant="outlined" size="small">
                    {t("appts.watchRecording")}
                  </Button>
                )}
                <Box>
                  <Chip
                    label={viewAppt.status.replace("_", " ")}
                    size="small"
                    sx={{
                      textTransform: "capitalize",
                      bgcolor: (statusChipColors[viewAppt.status] || statusChipColors.pending).bg,
                      color: (statusChipColors[viewAppt.status] || statusChipColors.pending).fg,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snack ? (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} sx={{ width: "100%" }}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Box>
  );
}
