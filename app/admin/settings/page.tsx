"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, TextField, Button, Alert, Switch,
  FormControlLabel, Stack, CircularProgress, Divider, Tabs, Tab,
  Chip, Table, TableHead, TableBody, TableRow, TableCell, TablePagination,
  MenuItem, InputAdornment,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import SaveIcon from "@mui/icons-material/Save";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DownloadIcon from "@mui/icons-material/Download";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import nextDynamic from "next/dynamic";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import NotificationsIcon from "@mui/icons-material/Notifications";
import {
  adminGetSettings, adminUpdateSettings, adminDownloadInvoicesZip,
  adminGetPendingSettings, adminApproveSettingChange, adminRejectSettingChange,
  adminGetAuditLog, adminExportUsers, adminExportAppointments, adminExportPayments,
  adminGlobalSearch, adminSendReminders,
  adminGetUsers, adminChangeUserRole, adminGetModeratorCount,
  getToken, isSuperAdmin,
} from "@/services/api";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import GroupIcon from "@mui/icons-material/Group";
import { Avatar, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemAvatar, ListItemText, Snackbar } from "@mui/material";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

// react-quill must be loaded client-side only (no SSR)
const ReactQuill = nextDynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ color: [] }, { background: [] }],
    ["link"],
    ["clean"],
  ],
};

export default function AdminSettings() {
  const router = useRouter();
  const { t } = useT();
  const superAdmin = isSuperAdmin();
  const [settingsTab, setSettingsTab] = useState("search");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fee, setFee] = useState("500");
  const [enabled, setEnabled] = useState(true);
  const [resumeDate, setResumeDate] = useState<Dayjs | null>(null);
  const [holdMessage, setHoldMessage] = useState("");
  const [limit, setLimit] = useState("0");
  const [deadline, setDeadline] = useState<Dayjs | null>(null);
  const [terms, setTerms] = useState("");
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);

  // Contact & Social
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYoutube, setSocialYoutube] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialWhatsapp, setSocialWhatsapp] = useState("");
  const [contactMapUrl, setContactMapUrl] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    adminGetSettings(token)
      .then((s: any) => {
        setFee(s.consultation_fee || "500");
        setEnabled(s.booking_enabled === "true");
        if (s.booking_resume_date) setResumeDate(dayjs(s.booking_resume_date));
        setHoldMessage(s.booking_hold_message || "");
        setLimit(s.booking_limit || "0");
        if (s.booking_limit_deadline) setDeadline(dayjs(s.booking_limit_deadline));
        setTerms(s.consultation_terms || "");
        setContactEmail(s.contact_email || "");
        setContactPhone(s.contact_phone || "");
        setContactAddress(s.contact_address || "");
        setSocialFacebook(s.social_facebook || "");
        setSocialInstagram(s.social_instagram || "");
        setSocialYoutube(s.social_youtube || "");
        setSocialTwitter(s.social_twitter || "");
        setSocialWhatsapp(s.social_whatsapp || "");
        setContactMapUrl(s.contact_map_url || "");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
    // Load pending changes for super admin
    if (isSuperAdmin()) {
      adminGetPendingSettings(token).then(setPendingChanges).catch(() => { });
    }
  }, [router]);

  async function handleSave() {
    const token = getToken();
    if (!token) return;
    setError(""); setSuccess(""); setSaving(true);
    try {
      const res = await adminUpdateSettings({
        consultation_fee: parseInt(fee) || 500,
        booking_enabled: enabled,
        booking_resume_date: resumeDate ? resumeDate.format("YYYY-MM-DD") : "",
        booking_hold_message: holdMessage,
        booking_limit: parseInt(limit) || 0,
        booking_limit_deadline: deadline ? deadline.toISOString() : "",
        consultation_terms: terms,
      }, token);
      if (res.pending) {
        setSuccess(t("settings.sentForApproval"));
      } else {
        setSuccess(t("settings.saved"));
      }
    } catch (err: any) {
      setError(err?.detail || "Failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: "calc(100vh - 64px)",
      bgcolor: "background.default",
      py: { xs: 3, md: 6 }, px: { xs: 1, sm: 2 },
    }}>
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
          {t("settings.title")}
        </Typography>

        <Tabs value={settingsTab} onChange={(_, v) => setSettingsTab(v)} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
          <Tab value="search" label={t("tools.search")} />
          <Tab value="reminders" label={t("tools.reminders")} />
          <Tab value="consultation" label={t("settings.tabConsultation")} />
          <Tab value="terms" label={t("settings.tabTerms")} />
          <Tab value="contact" label={t("settings.tabContact")} />
          {superAdmin && <Tab value="audit" label={t("tools.auditLog")} />}
          {superAdmin && <Tab value="export" label={t("tools.export")} />}
          {superAdmin && <Tab value="moderators" label={t("settings.tabModerators")} />}
        </Tabs>


        {settingsTab === "search" && <GlobalSearchTab />}

        {settingsTab === "reminders" && <RemindersTab />}

        {settingsTab === "consultation" && (
          <Paper elevation={0} sx={{
            p: { xs: 3, md: 5 }, borderRadius: 4,
            border: `1px solid ${brandColors.sand}`,
          }}>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Stack spacing={3}>
              <TextField
                label={t("settings.fee")}
                type="number"
                value={fee}
                onChange={e => setFee(e.target.value)}
                fullWidth
                slotProps={{
                  input: { startAdornment: <Typography sx={{ mr: 1 }}>&#8377;</Typography> },
                  htmlInput: { "aria-label": t("settings.fee") },
                }}
              />

              <FormControlLabel
                control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} color="primary" />}
                label={t("settings.bookingEnabled")}
              />

              {!enabled && (
                <>
                  <DatePicker
                    label={t("settings.resumeDate")}
                    value={resumeDate}
                    onChange={v => setResumeDate(v)}
                    format="DD/MM/YYYY"
                    minDate={dayjs()}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                  <TextField
                    label={t("settings.holdMessage")}
                    multiline rows={3}
                    value={holdMessage}
                    onChange={e => setHoldMessage(e.target.value)}
                    fullWidth
                    placeholder="e.g. Consultation is on hold. Will resume on..."
                  />
                </>
              )}

              <TextField
                label={t("settings.bookingLimit")}
                type="number"
                value={limit}
                onChange={e => setLimit(e.target.value)}
                fullWidth
                helperText={t("settings.bookingLimitHelp")}
              />

              <DateTimePicker
                label={t("settings.deadline")}
                value={deadline}
                onChange={v => setDeadline(v)}
                format="DD/MM/YYYY hh:mm A"
                ampm
                minDateTime={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: t("settings.deadlineHelp"),
                  },
                }}
              />

              <Button
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? t("common.saving") : t("common.save")}
              </Button>
            </Stack>
          </Paper>
        )}

        {/* ── Terms & Conditions Tab ── */}
        {settingsTab === "terms" && (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <EditNoteIcon /> {t("settings.termsEditor")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("settings.termsEditorHelp")}
            </Typography>
            <Box sx={{
              ".ql-container": { minHeight: 200, fontSize: "0.95rem", borderRadius: "0 0 10px 10px" },
              ".ql-toolbar": { borderRadius: "10px 10px 0 0", bgcolor: "background.paper" },
              ".ql-editor": { minHeight: 200 },
              mb: 3,
            }}>
              <ReactQuill theme="snow" value={terms} onChange={setTerms} modules={QUILL_MODULES}
                placeholder="Write consultation terms & conditions here..." />
            </Box>
            <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
              {saving ? t("common.saving") : superAdmin ? t("common.save") : t("settings.submitForApproval")}
            </Button>
          </Paper>
        )}

        {/* ── Audit Log Tab (super admin) ── */}
        {/* ── Search Tab ── */}
        {/* ── Contact & Social Tab ── */}
        {settingsTab === "contact" && (
          <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
              {t("settings.contactInfo")}
            </Typography>
            <Stack spacing={2.5}>
              <TextField label={t("common.email")} fullWidth value={contactEmail}
                onChange={e => setContactEmail(e.target.value)} placeholder="contact@pitham.com" />
              <TextField label={t("common.mobile")} fullWidth value={contactPhone}
                onChange={e => setContactPhone(e.target.value)} placeholder="+91 9876543210" />
              <TextField label={t("contact.address")} fullWidth multiline rows={2} value={contactAddress}
                onChange={e => setContactAddress(e.target.value)} />
              <TextField label={t("settings.mapUrl")} fullWidth value={contactMapUrl}
                onChange={e => setContactMapUrl(e.target.value)}
                placeholder="https://www.google.com/maps/embed?pb=..." />

              <Divider />
              <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon }}>
                {t("settings.socialLinks")}
              </Typography>

              <TextField label="WhatsApp Number" fullWidth value={socialWhatsapp}
                onChange={e => setSocialWhatsapp(e.target.value)} placeholder="+919876543210" />
              <TextField label="Instagram" fullWidth value={socialInstagram}
                onChange={e => setSocialInstagram(e.target.value)} placeholder="https://instagram.com/pitham" />
              <TextField label="Facebook" fullWidth value={socialFacebook}
                onChange={e => setSocialFacebook(e.target.value)} placeholder="https://facebook.com/pitham" />
              <TextField label="YouTube" fullWidth value={socialYoutube}
                onChange={e => setSocialYoutube(e.target.value)} placeholder="https://youtube.com/@pitham" />
              <TextField label="Twitter / X" fullWidth value={socialTwitter}
                onChange={e => setSocialTwitter(e.target.value)} placeholder="https://x.com/pitham" />

              <Button variant="contained" size="large" startIcon={<SaveIcon />} disabled={saving}
                onClick={async () => {
                  const token = getToken();
                  if (!token) return;
                  setSaving(true); setError(""); setSuccess("");
                  try {
                    await adminUpdateSettings({
                      contact_email: contactEmail,
                      contact_phone: contactPhone,
                      contact_address: contactAddress,
                      contact_map_url: contactMapUrl,
                      social_facebook: socialFacebook,
                      social_instagram: socialInstagram,
                      social_youtube: socialYoutube,
                      social_twitter: socialTwitter,
                      social_whatsapp: socialWhatsapp,
                    }, token);
                    setSuccess(t("settings.saved"));
                  } catch (err: any) { setError(err?.detail || "Failed"); }
                  finally { setSaving(false); }
                }}>
                {saving ? t("common.saving") : t("common.save")}
              </Button>
            </Stack>
          </Paper>
        )}

        {settingsTab === "audit" && superAdmin && <AuditLogTab />}

        {/* ── Export Tab (super admin) — includes Invoice ZIP download ── */}
        {settingsTab === "export" && superAdmin && (
          <Stack spacing={3}>
            <ExportTab />
            <InvoiceDownloadSection />
          </Stack>
        )}

        {/* ── Moderators Tab (super admin only) ── */}
        {settingsTab === "moderators" && superAdmin && <ModeratorsTab />}

        {/* ── Pending Approvals (super admin only) ── */}
        {superAdmin && pendingChanges.length > 0 && (
          <Paper elevation={0} sx={{
            maxWidth: 800, mx: "auto", mt: 4, p: { xs: 3, md: 5 }, borderRadius: 4,
            border: `1px solid ${brandColors.sand}`,
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 2 }}>
              {t("settings.pendingApprovals")}
            </Typography>
            <Stack spacing={2}>
              {pendingChanges.map((pc: any) => (
                <Paper key={pc.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {pc.submitted_by} wants to change <strong>{pc.key}</strong>
                  </Typography>
                  {pc.key === "consultation_terms" ? (
                    <Paper variant="outlined" sx={{
                      p: 3, my: 1.5, borderRadius: 3, bgcolor: "background.default",
                      "& h1, & h2, & h3": { color: "primary.dark", mt: 2, mb: 1, fontSize: "1.1rem" },
                      "& ol, & ul": { pl: 3 },
                      "& li": { mb: 0.5 },
                      "& p": { mb: 1 },
                      "& strong": { fontWeight: 700 },
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: pc.value }} />
                    </Paper>
                  ) : (
                    <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                      {pc.key === "consultation_fee" ? `₹${pc.value}` : pc.value}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="small" variant="contained" color="success"
                      onClick={async () => {
                        const token = getToken();
                        await adminApproveSettingChange(pc.id, token);
                        setPendingChanges(prev => prev.filter(x => x.id !== pc.id));
                        // Reload settings
                        const s = await adminGetSettings(token);
                        setFee(s.consultation_fee || "500");
                        setTerms(s.consultation_terms || "");
                      }}>
                      {t("settings.approve")}
                    </Button>
                    <Button size="small" variant="outlined" color="error"
                      onClick={async () => {
                        const token = getToken();
                        await adminRejectSettingChange(pc.id, token);
                        setPendingChanges(prev => prev.filter(x => x.id !== pc.id));
                      }}>
                      {t("settings.reject")}
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Paper>
        )}
      </Box>
    </Box>
  );
}


function GlobalSearchTab() {
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (query.trim().length < 2) return;
    const token = getToken();
    if (!token) return;
    setSearching(true);
    try {
      const res = await adminGlobalSearch(query.trim(), token);
      setResults(res);
    } catch { setResults(null); }
    finally { setSearching(false); }
  }

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField fullWidth placeholder={t("tools.searchPlaceholder")}
          value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
        <Button variant="contained" onClick={handleSearch} disabled={searching}>
          {t("common.search")}
        </Button>
      </Box>
      {searching && <CircularProgress size={24} />}
      {results && (
        <Stack spacing={2.5}>
          {results.users.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t("tools.users")} ({results.users.length})</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {results.users.map((u: any) => (
                  <Chip key={u.id} label={`${u.name} — ${u.email || u.mobile}`} />
                ))}
              </Box>
            </Box>
          )}
          {results.appointments.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t("tools.appointments")} ({results.appointments.length})</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {results.appointments.map((a: any) => (
                  <Chip key={a.id} label={`${a.name} — ${a.status}`} variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
          {results.documents.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{t("tools.documents")} ({results.documents.length})</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {results.documents.map((d: any) => (
                  <Chip key={d.id} label={d.title} variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
          {results.users.length === 0 && results.appointments.length === 0 && results.documents.length === 0 && (
            <Typography color="text.secondary">{t("tools.noResults")}</Typography>
          )}
        </Stack>
      )}
    </Paper>
  );
}

function RemindersTab() {
  const { t } = useT();
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  async function handleSend() {
    const token = getToken();
    if (!token) return;
    try {
      const res = await adminSendReminders(token);
      setSnack({ msg: res.message, severity: "success" });
    } catch (err: any) {
      setSnack({ msg: err?.detail || "Failed", severity: "error" });
    }
  }

  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{t("tools.sendReminders")}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("tools.remindersDesc")}
      </Typography>
      <Button variant="contained" startIcon={<NotificationsIcon />} onClick={handleSend}>
        {t("tools.sendNow")}
      </Button>
      {snack && (
        <Alert severity={snack.severity} sx={{ mt: 2 }} onClose={() => setSnack(null)}>
          {snack.msg}
        </Alert>
      )}
    </Paper>
  );
}

function AuditLogTab() {
  const { t } = useT();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterAdminId, setFilterAdminId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState<Dayjs | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Dayjs | null>(null);
  const [sortOrder, setSortOrder] = useState("newest");

  // Filter options from backend
  const [actionOptions, setActionOptions] = useState<string[]>([]);
  const [adminOptions, setAdminOptions] = useState<{ id: number; name: string }[]>([]);

  function load(p: number) {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    adminGetAuditLog(token, {
      page: p + 1,
      limit: rpp,
      action: filterAction || undefined,
      admin_id: filterAdminId ? parseInt(filterAdminId) : undefined,
      date_from: filterDateFrom?.format("YYYY-MM-DD"),
      date_to: filterDateTo?.format("YYYY-MM-DD"),
      sort: sortOrder,
    })
      .then((r: any) => {
        setLogs(r.logs);
        setTotal(r.total);
        if (r.filters) {
          setActionOptions(r.filters.actions || []);
          setAdminOptions(r.filters.admins || []);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(0); }, []);

  function applyFilters() {
    setPage(0);
    load(0);
  }

  function clearFilters() {
    setFilterAction(""); setFilterAdminId("");
    setFilterDateFrom(null); setFilterDateTo(null);
    setSortOrder("newest"); setPage(0);
    // Reload with no filters
    const token = getToken();
    if (!token) return;
    setLoading(true);
    adminGetAuditLog(token, { page: 1, limit: rpp, sort: "newest" })
      .then((r: any) => {
        setLogs(r.logs); setTotal(r.total);
        if (r.filters) { setActionOptions(r.filters.actions || []); setAdminOptions(r.filters.admins || []); }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }

  return (
    <Box>
      {/* Filters */}
      <Paper elevation={0} sx={{
        p: 2, mb: 2, borderRadius: 4, border: `1px solid ${brandColors.sand}`,
        display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center"
      }}>
        <TextField
          select size="small" label={t("tools.admin")}
          value={filterAdminId} onChange={e => setFilterAdminId(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">{t("common.all")}</MenuItem>
          {adminOptions.map(a => (
            <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          select size="small" label={t("tools.action")}
          value={filterAction} onChange={e => setFilterAction(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{t("common.all")}</MenuItem>
          {actionOptions.map(a => (
            <MenuItem key={a} value={a}>{a}</MenuItem>
          ))}
        </TextField>
        <DatePicker
          label={t("settings.invoiceFrom")}
          value={filterDateFrom} onChange={v => setFilterDateFrom(v)}
          format="DD/MM/YYYY"
          slotProps={{ textField: { size: "small", sx: { minWidth: 145 } } }}
        />
        <DatePicker
          label={t("settings.invoiceTo")}
          value={filterDateTo} onChange={v => setFilterDateTo(v)}
          format="DD/MM/YYYY"
          slotProps={{ textField: { size: "small", sx: { minWidth: 145 } } }}
        />
        <TextField
          select size="small" label={t("table.sortBy")}
          value={sortOrder} onChange={e => setSortOrder(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="newest">{t("sort.newest")}</MenuItem>
          <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
        </TextField>
        <Button variant="contained" size="small" onClick={applyFilters}>{t("common.filter")}</Button>
        <Button variant="outlined" size="small" onClick={clearFilters}>{t("common.clear")}</Button>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ borderRadius: 4, border: `1px solid ${brandColors.sand}`, overflow: "auto" }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>
        ) : logs.length === 0 ? (
          <Typography sx={{ p: 4, textAlign: "center" }} color="text.secondary">{t("tools.noLogs")}</Typography>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "background.default" }}>
                  <TableCell sx={{ fontWeight: 700 }}>{t("common.date")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("tools.admin")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("tools.action")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("tools.entity")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("tools.details")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((l: any) => (
                  <TableRow key={l.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{l.admin_name}</TableCell>
                    <TableCell><Chip label={l.action} size="small" /></TableCell>
                    <TableCell>{l.entity_type}{l.entity_id ? ` #${l.entity_id}` : ""}</TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {l.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination component="div" count={total} page={page}
              onPageChange={(_, p) => { setPage(p); load(p); }}
              rowsPerPage={rpp}
              onRowsPerPageChange={e => { setRpp(parseInt(e.target.value, 10)); setPage(0); load(0); }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage={t("table.rowsPerPage")} />
          </>
        )}
      </Paper>
    </Box>
  );
}

function ExportTab() {
  const { t } = useT();
  const [exportFrom, setExportFrom] = useState<Dayjs | null>(null);
  const [exportTo, setExportTo] = useState<Dayjs | null>(null);
  const [exporting, setExporting] = useState("");

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExport(type: "users" | "appointments" | "payments") {
    const token = getToken();
    if (!token) return;
    setExporting(type);
    try {
      const from = exportFrom?.format("YYYY-MM-DD");
      const to = exportTo?.format("YYYY-MM-DD");
      let blob: Blob;
      if (type === "users") {
        blob = await adminExportUsers(token);
      } else if (type === "appointments") {
        blob = await adminExportAppointments(token, from, to);
      } else {
        blob = await adminExportPayments(token, from, to);
      }
      downloadBlob(blob, `${type}.csv`);
    } catch { alert("Export failed. Please try again."); }
    finally { setExporting(""); }
  }

  return (
    <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{t("tools.exportData")}</Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
        <DatePicker label={t("settings.invoiceFrom")} value={exportFrom} onChange={v => setExportFrom(v)} format="DD/MM/YYYY"
          slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }} />
        <DatePicker label={t("settings.invoiceTo")} value={exportTo} onChange={v => setExportTo(v)} format="DD/MM/YYYY"
          slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }} />
      </Box>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport("users")}
          disabled={exporting === "users"}>
          {exporting === "users" ? t("common.loading") : t("tools.exportUsers")}
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport("appointments")}
          disabled={exporting === "appointments"}>
          {exporting === "appointments" ? t("common.loading") : t("tools.exportAppts")}
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport("payments")}
          disabled={exporting === "payments"}>
          {exporting === "payments" ? t("common.loading") : t("tools.exportPayments")}
        </Button>
      </Stack>
    </Paper>
  );
}

function InvoiceDownloadSection() {
  const { t } = useT();
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");

  async function handleDownload() {
    if (!dateFrom || !dateTo) { setInvoiceError(t("settings.invoiceDateRequired")); return; }
    const token = getToken();
    if (!token) return;
    setInvoiceError(""); setDownloading(true);
    try {
      const blob = await adminDownloadInvoicesZip(
        dateFrom.format("YYYY-MM-DD"),
        dateTo.format("YYYY-MM-DD"),
        token
      );
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices_${dateFrom.format("YYYY-MM-DD")}_to_${dateTo.format("YYYY-MM-DD")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setInvoiceError(err?.detail || "No invoices found for this date range.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Paper elevation={0} sx={{
      p: { xs: 3, md: 5 }, borderRadius: 4,
      border: `1px solid ${brandColors.sand}`,
    }}>
      <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <ReceiptLongIcon /> {t("settings.invoiceDownload")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t("settings.invoiceDownloadHelp")}
      </Typography>

      {invoiceError && <Alert severity="error" sx={{ mb: 2 }}>{invoiceError}</Alert>}

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <DatePicker
          label={t("settings.invoiceFrom")}
          value={dateFrom}
          onChange={v => setDateFrom(v)}
          format="DD/MM/YYYY"
          slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
        />
        <DatePicker
          label={t("settings.invoiceTo")}
          value={dateTo}
          onChange={v => setDateTo(v)}
          format="DD/MM/YYYY"
          slotProps={{ textField: { size: "small", sx: { minWidth: 160 } } }}
        />
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          disabled={downloading || !dateFrom || !dateTo}
        >
          {downloading ? t("common.loading") : t("settings.invoiceDownloadBtn")}
        </Button>
      </Box>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Moderators tab — super-admin only
// ─────────────────────────────────────────────────────────────────────────────

function ModeratorsTab() {
  const { t } = useT();
  const [moderators, setModerators] = useState<any[]>([]);
  const [cap, setCap] = useState<{ current: number; max: number }>({ current: 0, max: 5 });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [promoteTarget, setPromoteTarget] = useState<any>(null);
  const [revokeTarget, setRevokeTarget] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [mods, count] = await Promise.all([
        adminGetUsers(token, { role: "moderator" }),
        adminGetModeratorCount(token),
      ]);
      setModerators(mods);
      setCap(count);
    } catch (e: any) {
      setError(e?.detail || "Failed to load moderators");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function runSearch() {
    const token = getToken();
    if (!token) return;
    if (search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await adminGetUsers(token, { search: search.trim(), role: "user" });
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function confirmPromote() {
    if (!promoteTarget) return;
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await adminChangeUserRole(promoteTarget.id, "moderator", token);
      setSnack({ msg: t("mod.promoted"), severity: "success" });
      setPromoteTarget(null);
      setSearch(""); setSearchResults([]);
      await load();
    } catch (e: any) {
      setSnack({ msg: e?.detail || "Failed", severity: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    const token = getToken();
    if (!token) return;
    setBusy(true);
    try {
      await adminChangeUserRole(revokeTarget.id, "user", token);
      setSnack({ msg: t("mod.revoked"), severity: "success" });
      setRevokeTarget(null);
      await load();
    } catch (e: any) {
      setSnack({ msg: e?.detail || "Failed", severity: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress /></Box>;
  }

  const atLimit = cap.current >= cap.max;

  return (
    <Stack spacing={3}>
      {/* Header card */}
      <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: brandColors.maroon, display: "flex", alignItems: "center", gap: 1 }}>
            <GroupIcon /> {t("mod.title")}
          </Typography>
          <Chip
            label={t("mod.count", { current: cap.current, max: cap.max })}
            color={atLimit ? "warning" : "primary"}
            sx={{ fontWeight: 700 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t("mod.subtitle", { max: cap.max })}
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      {/* Current moderators */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{t("mod.current")}</Typography>
        {moderators.length === 0 ? (
          <Typography color="text.secondary">{t("mod.empty")}</Typography>
        ) : (
          <List disablePadding>
            {moderators.map((m: any, i: number) => (
              <ListItem
                key={m.id}
                divider={i < moderators.length - 1}
                secondaryAction={
                  <Button
                    size="small" color="error" variant="outlined"
                    startIcon={<PersonRemoveIcon />}
                    onClick={() => setRevokeTarget(m)}
                  >
                    {t("mod.revoke")}
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: brandColors.maroon }}>{m.name?.charAt(0).toUpperCase() || "?"}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600 }}>{m.name}</Typography>}
                  secondary={`${m.email || m.mobile || ""}${m.city ? " · " + m.city : ""}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Promote new moderator */}
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 4, border: `1px solid ${brandColors.sand}` }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{t("mod.add")}</Typography>
        {atLimit && (
          <Alert severity="warning" sx={{ mb: 2 }}>{t("mod.atLimit")}</Alert>
        )}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <TextField
            fullWidth size="small"
            placeholder={t("mod.searchUsers")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && runSearch()}
            disabled={atLimit}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
              },
            }}
          />
          <Button variant="contained" onClick={runSearch} disabled={atLimit || searching || search.trim().length < 2}>
            {t("common.search")}
          </Button>
        </Box>

        {searching && <CircularProgress size={24} />}
        {!searching && search.trim().length >= 2 && searchResults.length === 0 && (
          <Typography color="text.secondary" variant="body2">{t("mod.noResults")}</Typography>
        )}
        {searchResults.length > 0 && (
          <List disablePadding>
            {searchResults.map((u: any, i: number) => (
              <ListItem
                key={u.id}
                divider={i < searchResults.length - 1}
                secondaryAction={
                  <Button
                    size="small" variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setPromoteTarget(u)}
                    disabled={atLimit}
                  >
                    {t("mod.addBtn")}
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar>{u.name?.charAt(0).toUpperCase() || "?"}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 600 }}>{u.name}</Typography>}
                  secondary={`${u.email || u.mobile || ""}${u.city ? " · " + u.city : ""}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Promote confirm */}
      <Dialog open={!!promoteTarget} onClose={() => !busy && setPromoteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: brandColors.maroon }}>{t("mod.addBtn")}</DialogTitle>
        <DialogContent>
          <Typography>{t("mod.promoteConfirm", { name: promoteTarget?.name || "" })}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPromoteTarget(null)} disabled={busy}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={confirmPromote} disabled={busy}>
            {busy ? t("common.saving") : t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke confirm */}
      <Dialog open={!!revokeTarget} onClose={() => !busy && setRevokeTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "error.main" }}>{t("mod.revoke")}</DialogTitle>
        <DialogContent>
          <Typography>{t("mod.revokeConfirm", { name: revokeTarget?.name || "" })}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRevokeTarget(null)} disabled={busy}>{t("common.cancel")}</Button>
          <Button variant="contained" color="error" onClick={confirmRevoke} disabled={busy}>
            {busy ? t("common.saving") : t("mod.revoke")}
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
    </Stack>
  );
}
