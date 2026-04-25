"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TablePagination,
  MenuItem,
  Snackbar,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  adminGetUsers,
  adminGetUser,
  adminGetUserAppointments,
  adminGetUserDocuments,
  adminDeleteAssignedDocument,
  getToken,
  fileUrl,
} from "@/services/api";
import { formatTime12h } from "@/lib/timeSlots";
import { statusChipColors } from "@/theme/sharedStyles";
import { useT } from "@/i18n/I18nProvider";

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-12 px-2 sm:px-4";
const CONTAINER_CLASS = "max-w-[1200px] mx-auto w-full";
const FILTERS_CARD_CLASS =
  "!p-3 md:!p-5 !mb-6 !rounded-3xl !bg-brand-ivory !border !border-brand-sand !grid !gap-3 md:!gap-4 !items-center !grid-cols-1 sm:!grid-cols-2 md:!grid-cols-[2fr_1fr_1fr_1fr_1.5fr_auto] [&_.MuiFormControl-root]:!w-full";
const TABLE_PAPER_CLASS =
  "!rounded-3xl !bg-brand-ivory !border !border-brand-sand !overflow-auto !max-w-full";
const TABLE_HEAD_ROW_CLASS =
  "!bg-brand-cream [&_th]:!font-bold [&_th]:!text-brand-maroon [&_th]:!uppercase [&_th]:!text-[0.75rem] [&_th]:!tracking-[0.05em] [&_th]:!whitespace-nowrap";

type SortKey = "newest" | "oldest" | "name" | "joinedOn";

export default function AdminUsers() {
  const router = useRouter();
  const { t } = useT();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [userAppts, setUserAppts] = useState<any[]>([]);
  const [userDocs, setUserDocs] = useState<any[]>([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRpp] = useState(10);
  const [sort, setSort] = useState<SortKey>("newest");

  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [viewAppt, setViewAppt] = useState<any>(null);

  function fetchUsers() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    adminGetUsers(token, { search, city, state, country })
      .then(setUsers)
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      setUserDocs((prev) => prev.filter((d) => d.id !== docId));
      setSnack({ msg: t("docs.delete.success"), severity: "success" });
    } catch (err: any) {
      setSnack({ msg: err?.detail || t("docs.delete.error"), severity: "error" });
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    const ad = new Date(a.created_at).getTime();
    const bd = new Date(b.created_at).getTime();
    if (sort === "joinedOn") return ad - bd;
    return sort === "oldest" ? ad - bd : bd - ad;
  });
  const paged = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Typography
          variant="h4"
          className="!text-brand-maroon !font-bold !mb-4 md:!mb-8 !text-[1.5rem] md:!text-[2.125rem]"
        >
          {t("users.title")}
        </Typography>

        <Paper elevation={0} className={FILTERS_CARD_CLASS}>
          <TextField
            size="small"
            placeholder={t("users.searchName")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <TextField
            size="small"
            placeholder={t("users.city")}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <TextField
            size="small"
            placeholder={t("users.state")}
            value={state}
            onChange={(e) => setState(e.target.value)}
          />
          <TextField
            size="small"
            placeholder={t("users.country")}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
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
            <MenuItem value="name">{t("sort.name")}</MenuItem>
            <MenuItem value="joinedOn">{t("sort.joinedOn")}</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={() => {
              fetchUsers();
              setPage(0);
            }}
            className="!w-full md:!w-auto"
          >
            {t("common.search")}
          </Button>
        </Paper>

        {loading ? (
          <Box className="text-center py-8">
            <CircularProgress color="primary" />
          </Box>
        ) : users.length === 0 ? (
          <Paper elevation={0} className="!p-12 !text-center !rounded-3xl">
            <Typography color="text.secondary">No users found.</Typography>
          </Paper>
        ) : (
          <>
            <Paper elevation={0} className={TABLE_PAPER_CLASS}>
              <Table>
                <TableHead>
                  <TableRow className={TABLE_HEAD_ROW_CLASS}>
                    {[
                      t("common.name"),
                      t("common.email"),
                      t("common.mobile"),
                      t("users.city"),
                      t("users.state"),
                      t("users.country"),
                      t("users.joined"),
                      "",
                    ].map((h, i) => (
                      <TableCell key={i}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((u: any) => (
                    <TableRow key={u.id} hover>
                      <TableCell className="!font-semibold">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.mobile}</TableCell>
                      <TableCell>{u.city}</TableCell>
                      <TableCell>{u.state}</TableCell>
                      <TableCell>{u.country}</TableCell>
                      <TableCell className="!text-[color:rgba(0,0,0,0.38)]">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => viewUser(u)}>
                          {t("common.view")}
                        </Button>
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
                onRowsPerPageChange={(e) => {
                  setRpp(parseInt(e.target.value, 10));
                  setPage(0);
                }}
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
            <DialogTitle className="!flex !justify-between !font-bold !text-brand-saffron-dark">
              {selected.name}
              <IconButton onClick={() => setSelected(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                    <Typography variant="caption" color="text.disabled">
                      {k}
                    </Typography>
                    <Typography variant="body2" className="!font-semibold">
                      {v}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Consultation history */}
              <Accordion
                elevation={0}
                defaultExpanded
                className="!mb-3 !rounded-xl !border !border-[#E8D9BF] [&::before]:!hidden"
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <HistoryIcon className="!mr-2 !text-brand-saffron" />
                  <Typography className="!font-bold !text-brand-saffron-dark">
                    {t("users.history")} ({userAppts.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className="!p-0 !overflow-x-auto">
                  {userAppts.length === 0 ? (
                    <Typography color="text.secondary" className="!p-4">
                      {t("users.noAppts")}
                    </Typography>
                  ) : (
                    <Table size="small" className="!min-w-[720px]">
                      <TableHead>
                        <TableRow className="!bg-[rgba(0,0,0,0.04)]">
                          <TableCell className="!font-bold !py-2">{t("common.name")}</TableCell>
                          <TableCell className="!font-bold !py-2">
                            {t("users.dob")} / {t("users.tob")}
                          </TableCell>
                          <TableCell className="!font-bold !py-2">{t("users.birthPlace")}</TableCell>
                          <TableCell className="!font-bold !py-2">{t("common.date")}</TableCell>
                          <TableCell className="!font-bold !py-2">{t("appts.problem")}</TableCell>
                          <TableCell className="!font-bold !py-2">{t("common.actions")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userAppts.map((a: any) => (
                          <TableRow key={a.id} hover>
                            <TableCell className="!py-2 !whitespace-nowrap">{a.name}</TableCell>
                            <TableCell className="!py-2 !whitespace-nowrap">
                              {a.dob} · {formatTime12h(a.tob)}
                            </TableCell>
                            <TableCell className="!py-2">{a.birth_place}</TableCell>
                            <TableCell className="!py-2 !whitespace-nowrap">
                              {a.scheduled_date || "–"}
                            </TableCell>
                            <TableCell className="!py-2 !max-w-[200px] !overflow-hidden !text-ellipsis !whitespace-nowrap">
                              {a.problem}
                            </TableCell>
                            <TableCell className="!py-2 !whitespace-nowrap">
                              <Box className="flex items-center gap-2">
                                <Chip
                                  label={a.status.replace("_", " ")}
                                  size="small"
                                  className="!capitalize"
                                />
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
                className="!rounded-xl !border !border-[#E8D9BF] [&::before]:!hidden"
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <DescriptionIcon className="!mr-2 !text-brand-warning" />
                  <Typography className="!font-bold !text-brand-saffron-dark">
                    {t("users.docs")} ({userDocs.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className="!p-0 !overflow-x-auto">
                  {userDocs.length === 0 ? (
                    <Typography color="text.secondary" className="!p-4">
                      {t("users.noDocs")}
                    </Typography>
                  ) : (
                    <Table size="small" className="!min-w-[480px]">
                      <TableHead>
                        <TableRow className="!bg-[rgba(0,0,0,0.04)]">
                          <TableCell className="!font-bold !py-2">{t("common.title")}</TableCell>
                          <TableCell className="!font-bold !py-2">{t("common.date")}</TableCell>
                          <TableCell className="!font-bold !py-2"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userDocs.map((doc: any) => (
                          <TableRow key={doc.id} hover>
                            <TableCell className="!py-2">
                              <Box className="flex items-center gap-2">
                                <DescriptionIcon fontSize="small" color="warning" />
                                <Box>
                                  <Typography variant="body2" className="!font-semibold">
                                    {doc.title}
                                  </Typography>
                                  {doc.batch_label && (
                                    <Typography variant="caption" color="text.disabled">
                                      {doc.batch_label}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell className="!py-2 !whitespace-nowrap !text-[color:rgba(0,0,0,0.38)]">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="!py-2">
                              <Box className="flex gap-1">
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
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    if (confirm(t("docs.delete.confirm"))) handleDeleteDoc(doc.id);
                                  }}
                                >
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
            <DialogTitle className="!font-bold !text-brand-saffron-dark !flex !justify-between">
              {t("appts.details")}
              <IconButton onClick={() => setViewAppt(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    [t("common.name"), viewAppt.name],
                    [t("common.email"), viewAppt.email],
                    [t("common.mobile"), viewAppt.mobile],
                    [t("users.dob"), viewAppt.dob],
                    [t("users.tob"), formatTime12h(viewAppt.tob)],
                    [t("users.birthPlace"), viewAppt.birth_place],
                  ].map(([k, v], i) => (
                    <Box key={i}>
                      <Typography variant="caption" color="text.disabled">
                        {k}
                      </Typography>
                      <Typography variant="body2" className="!font-semibold">
                        {v}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.disabled">
                    {t("appts.problem")}
                  </Typography>
                  <Typography variant="body2" className="!whitespace-pre-wrap">
                    {viewAppt.problem}
                  </Typography>
                </Box>
                {viewAppt.selfie_path && (
                  <Box
                    component="img"
                    src={fileUrl(viewAppt.selfie_path)}
                    alt="selfie"
                    className="!max-w-[200px] !max-h-[200px] !rounded-lg !border !border-[#E8D9BF]"
                  />
                )}
                {viewAppt.scheduled_date && (
                  <Box>
                    <Typography variant="caption" color="text.disabled">
                      {t("history.dateTime")}
                    </Typography>
                    <Typography variant="body2" className="!font-semibold">
                      {viewAppt.scheduled_date} · {formatTime12h(viewAppt.scheduled_time)}
                    </Typography>
                  </Box>
                )}
                {viewAppt.analysis_path && (
                  <Button
                    component="a"
                    href={fileUrl(viewAppt.analysis_path)}
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                    size="small"
                    startIcon={<DescriptionIcon />}
                  >
                    {t("appts.viewAnalysis")}
                  </Button>
                )}
                {viewAppt.recording_link && (
                  <Button
                    component="a"
                    href={viewAppt.recording_link}
                    target="_blank"
                    rel="noreferrer"
                    variant="outlined"
                    size="small"
                  >
                    {t("appts.watchRecording")}
                  </Button>
                )}
                <Box>
                  <Chip
                    label={viewAppt.status.replace("_", " ")}
                    size="small"
                    className="!capitalize !font-semibold"
                    style={{
                      backgroundColor: (statusChipColors[viewAppt.status] || statusChipColors.pending).bg,
                      color: (statusChipColors[viewAppt.status] || statusChipColors.pending).fg,
                    }}
                  />
                </Box>
              </Stack>
            </DialogContent>
          </>
        )}
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
