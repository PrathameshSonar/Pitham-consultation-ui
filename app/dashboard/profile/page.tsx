"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { Dayjs } from "dayjs";
import SaveIcon from "@mui/icons-material/Save";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import DownloadIcon from "@mui/icons-material/Download";
import {
  getProfile,
  updateProfile,
  deleteAccount,
  clearToken,
  getToken,
  sendVerificationEmail,
  exportMyData,
} from "@/services/api";
import { lettersOnly } from "@/lib/inputFilters";
import { useT } from "@/i18n/I18nProvider";

const COUNTRIES = ["India", "USA", "UK", "Canada", "Australia", "Other"];

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    birth_place: "",
    city: "",
    state: "",
    country: "India",
  });
  const [dob, setDob] = useState<Dayjs | null>(null);
  const [tob, setTob] = useState<Dayjs | null>(null);

  // Snapshot of the values as they were loaded from the server. Save button
  // stays disabled until at least one field differs from this snapshot.
  const initialRef = useRef<{
    form: typeof form;
    dob: string;
    tob: string;
  } | null>(null);

  // Delete-account flow
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Email verification + data export
  const [emailVerified, setEmailVerified] = useState<boolean>(true);
  const [verifyMsg, setVerifyMsg] = useState("");
  const [verifySending, setVerifySending] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleSendVerification() {
    const token = getToken();
    if (!token) return;
    setVerifyMsg("");
    setVerifySending(true);
    try {
      await sendVerificationEmail(token);
      setVerifyMsg(t("profile.verify.sent"));
    } catch (err: any) {
      setVerifyMsg(err?.detail || t("profile.verify.failed"));
    } finally {
      setVerifySending(false);
    }
  }

  async function handleExportData() {
    const token = getToken();
    if (!token) return;
    setExporting(true);
    try {
      const data = await exportMyData(token);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `spbsp-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // best-effort, no-op
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    const token = getToken();
    if (!token) return;
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteAccount(token);
      clearToken();
      router.push("/");
    } catch (err: any) {
      setDeleteError(err?.detail || t("profile.delete.failed"));
      setDeleting(false);
    }
  }

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    getProfile(token)
      .then((p: any) => {
        const loadedForm = {
          name: p.name || "",
          email: p.email || "",
          mobile: p.mobile || "",
          birth_place: p.birth_place || "",
          city: p.city || "",
          state: p.state || "",
          country: p.country || "India",
        };
        setForm(loadedForm);
        setEmailVerified(!!p.email_verified || !p.email);

        let loadedDob: Dayjs | null = null;
        let loadedTob: Dayjs | null = null;
        if (p.dob) {
          loadedDob = dayjs(p.dob);
          setDob(loadedDob);
        }
        if (p.tob) {
          const parts = (p.tob || "").split(":");
          if (parts.length >= 2) {
            const [h, m, s] = parts;
            loadedTob = dayjs()
              .hour(parseInt(h))
              .minute(parseInt(m))
              .second(parseInt(s || "0"));
            setTob(loadedTob);
          }
        }
        initialRef.current = {
          form: loadedForm,
          dob: loadedDob ? loadedDob.format("YYYY-MM-DD") : "",
          tob: loadedTob ? loadedTob.format("HH:mm:ss") : "",
        };
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const dirty = useMemo(() => {
    const init = initialRef.current;
    if (!init) return false;
    if (
      init.form.name !== form.name ||
      init.form.email !== form.email ||
      init.form.mobile !== form.mobile ||
      init.form.birth_place !== form.birth_place ||
      init.form.city !== form.city ||
      init.form.state !== form.state ||
      init.form.country !== form.country
    ) {
      return true;
    }
    const currentDob = dob ? dob.format("YYYY-MM-DD") : "";
    const currentTob = tob ? tob.format("HH:mm:ss") : "";
    return currentDob !== init.dob || currentTob !== init.tob;
  }, [form, dob, tob]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    if (!form.name.trim()) {
      setError(t("common.required"));
      return;
    }
    if (!form.mobile.trim()) {
      setError(t("profile.mobileRequired"));
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload: Record<string, string> = { ...form };
      if (dob) payload.dob = dob.format("YYYY-MM-DD");
      if (tob) payload.tob = tob.format("HH:mm:ss");
      await updateProfile(payload, token);
      setSuccess(t("profile.saved"));
      initialRef.current = {
        form: { ...form },
        dob: dob ? dob.format("YYYY-MM-DD") : "",
        tob: tob ? tob.format("HH:mm:ss") : "",
      };
    } catch (err: any) {
      setError(err?.detail || t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box className="min-h-[60vh] flex items-center justify-center">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4">
      <Paper
        elevation={0}
        className="!max-w-[700px] !mx-auto !p-6 md:!p-10 !rounded-3xl !border !border-brand-sand"
      >
        <Typography variant="h4" className="!font-bold !text-brand-maroon !mb-2">
          {t("profile.title")}
        </Typography>
        <Typography color="text.secondary" className="!mb-6">
          {t("profile.subtitle")}
        </Typography>

        {!emailVerified && form.email && (
          <Alert
            severity="warning"
            icon={<MarkEmailReadIcon />}
            className="!mb-4"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleSendVerification}
                disabled={verifySending}
              >
                {verifySending ? t("common.saving") : t("profile.verify.send")}
              </Button>
            }
          >
            {verifyMsg || t("profile.verify.prompt")}
          </Alert>
        )}
        {error && (
          <Alert severity="error" className="!mb-4">
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" className="!mb-4">
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSave}>
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <TextField
              label={t("auth.register.fullName")}
              required
              fullWidth
              value={form.name}
              onChange={(e) => set("name", lettersOnly(e.target.value))}
              slotProps={{ htmlInput: { "aria-label": t("auth.register.fullName") } }}
            />
            <TextField
              label={`${t("common.email")} (${t("common.optional")})`}
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              slotProps={{ htmlInput: { "aria-label": t("common.email") } }}
            />
            <TextField
              label={t("common.mobile")}
              required
              fullWidth
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              placeholder="+91 XXXXXXXXXX"
              slotProps={{ htmlInput: { "aria-label": t("common.mobile") } }}
            />
            <TextField
              label={t("auth.register.birthPlace")}
              fullWidth
              value={form.birth_place}
              onChange={(e) => set("birth_place", lettersOnly(e.target.value))}
              slotProps={{ htmlInput: { "aria-label": t("auth.register.birthPlace") } }}
            />
            <DatePicker
              label={t("auth.register.dob")}
              value={dob}
              onChange={setDob}
              format="DD/MM/YYYY"
              maxDate={dayjs()}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TimePicker
              label={t("auth.register.tob")}
              value={tob}
              onChange={setTob}
              ampm
              views={["hours", "minutes", "seconds"]}
              format="hh:mm:ss A"
              timeSteps={{ minutes: 1, seconds: 1 }}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <TextField
              label={t("auth.register.city")}
              fullWidth
              value={form.city}
              onChange={(e) => set("city", lettersOnly(e.target.value))}
              slotProps={{ htmlInput: { "aria-label": t("auth.register.city") } }}
            />
            <TextField
              label={t("auth.register.state")}
              fullWidth
              value={form.state}
              onChange={(e) => set("state", lettersOnly(e.target.value))}
              slotProps={{ htmlInput: { "aria-label": t("auth.register.state") } }}
            />
            <TextField
              select
              label={t("auth.register.country")}
              fullWidth
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              slotProps={{ htmlInput: { "aria-label": t("auth.register.country") } }}
            >
              {COUNTRIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<SaveIcon />}
            disabled={saving || !dirty}
          >
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </Box>
      </Paper>

      {/* ── Privacy: download my data ───────────────────────────────────── */}
      <Paper
        elevation={0}
        className="!max-w-[700px] !mx-auto !mt-8 !p-6 md:!p-8 !rounded-3xl !border !border-brand-sand"
      >
        <Typography variant="h6" className="!font-bold !text-brand-maroon !mb-2">
          {t("profile.export.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="!mb-5 !leading-[1.7]">
          {t("profile.export.desc")}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportData}
          disabled={exporting}
        >
          {exporting ? t("common.loading") : t("profile.export.button")}
        </Button>
      </Paper>

      {/* ── Danger zone ─────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        className="!max-w-[700px] !mx-auto !mt-8 !p-6 md:!p-8 !rounded-3xl !border !border-[#e57373] !bg-[rgba(211,47,47,0.04)]"
      >
        <Typography variant="h6" className="!font-bold !text-brand-error !mb-2">
          {t("profile.delete.title")}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="!mb-5 !leading-[1.7]">
          {t("profile.delete.desc")}
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverIcon />}
          onClick={() => {
            setDeleteConfirmText("");
            setDeleteError("");
            setDeleteOpen(true);
          }}
        >
          {t("profile.delete.button")}
        </Button>
      </Paper>

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="!font-bold !text-brand-error">
          {t("profile.delete.title")}
        </DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" className="!mb-4">
              {deleteError}
            </Alert>
          )}
          <Typography className="!mb-4 !leading-[1.7]">{t("profile.delete.confirm")}</Typography>
          <Typography variant="body2" color="text.secondary" className="!mb-4">
            {t("profile.delete.typePrompt")}
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
          />
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
          >
            {deleting ? t("common.saving") : t("profile.delete.button")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
