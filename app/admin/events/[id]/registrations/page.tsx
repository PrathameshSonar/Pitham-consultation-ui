"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TablePagination,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import {
  adminListEventRegistrations,
  adminConfirmManualRegistration,
  adminCancelRegistration,
  adminMarkRegistrationAttended,
  adminPromoteFromWaitlist,
  adminCreateUserList,
  getPublicEvent,
  getToken,
  type EventItem,
  type EventRegistration,
} from "@/services/api";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { useRequireSection } from "@/lib/useRequireSection";

const STATUS_LABEL: Record<
  EventRegistration["status"],
  { label: string; color: "default" | "primary" | "success" | "warning" | "error" }
> = {
  pending_payment: { label: "Payment pending", color: "warning" },
  confirmed:       { label: "Confirmed",        color: "success" },
  attended:        { label: "Attended",         color: "primary" },
  cancelled:       { label: "Cancelled",        color: "error"   },
  waitlist:        { label: "Waitlist",         color: "default" },
};

const PAYMENT_LABEL: Record<
  EventRegistration["payment_status"],
  { label: string; color: "default" | "success" | "warning" | "error" }
> = {
  paid:     { label: "Paid",     color: "success" },
  pending:  { label: "Pending",  color: "warning" },
  refunded: { label: "Refunded", color: "default" },
  "n/a":    { label: "—",        color: "default" },
};

type StatusFilter = "all" | EventRegistration["status"];
type TierFilter = "all" | string;

export default function AdminEventRegistrationsPage() {
  const params = useParams<{ id: string }>();
  const eventId = useMemo(() => Number(params?.id), [params?.id]);
  const gate = useRequireSection("pitham_cms");

  const [event, setEvent] = useState<EventItem | null>(null);
  const [rows, setRows] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");

  // Selected row for the "view full submission" dialog. The catalog-driven
  // public form may collect arbitrary keys we don't want cluttering the
  // table; admin pops a row to see the full thing.
  const [detail, setDetail] = useState<EventRegistration | null>(null);

  // In-flight per-row action so multiple admins can't double-fire the same
  // operation (also disables the button while the request is on the wire).
  const [busyRowId, setBusyRowId] = useState<number | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  // Pagination state — kept client-side so search/status/tier filtering keeps
  // working without a server roundtrip.
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // "Create user list" dialog: turns the currently visible registrations into
  // a reusable list (broadcasts, gallery shares, etc.). user_ids are deduped
  // since one person can register more than once across tiers.
  const [listOpen, setListOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [listDesc, setListDesc] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  async function reload() {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const [ev, regs] = await Promise.all([
        getPublicEvent(eventId).catch(() => null),
        adminListEventRegistrations(eventId, token),
      ]);
      setEvent(ev);
      setRows(regs);
    } catch (e: any) {
      setSnack({ msg: e?.detail || "Failed to load registrations", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (gate !== "allowed" || !eventId) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gate, eventId]);

  // Stats computed from the *unfiltered* set so the strip reflects the
  // event's reality, not what the current search/filter hides.
  const stats = useMemo(() => {
    let total = 0;
    let confirmed = 0;
    let pending = 0;
    let attended = 0;
    let cancelled = 0;
    let waitlist = 0;
    let revenue = 0;
    for (const r of rows) {
      total++;
      if (r.status === "confirmed") confirmed++;
      else if (r.status === "pending_payment") pending++;
      else if (r.status === "attended") attended++;
      else if (r.status === "cancelled") cancelled++;
      else if (r.status === "waitlist") waitlist++;
      if (r.payment_status === "paid") revenue += r.fee_amount || 0;
    }
    return { total, confirmed, pending, attended, cancelled, waitlist, revenue };
  }, [rows]);

  // Distinct tiers seen in registrations — driven by data, not config, so a
  // tier that was renamed/deleted on the event still shows up here as long
  // as some registration row references it (we snapshot tier_name at signup).
  const tierOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const r of rows) {
      if (r.tier_id && r.tier_name && !seen.has(r.tier_id)) {
        seen.set(r.tier_id, r.tier_name);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (tierFilter !== "all" && (r.tier_id || "") !== tierFilter) return false;
      if (!q) return true;
      const hay = [
        r.name,
        r.email || "",
        r.mobile || "",
        r.payment_reference || "",
        r.tier_name || "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter, tierFilter]);

  // Reset to first page whenever the filtered set changes — otherwise after
  // narrowing results the user can land on an out-of-range empty page.
  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, tierFilter]);

  const pagedRows = useMemo(
    () => visibleRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [visibleRows, page, rowsPerPage],
  );

  // Deduped user_ids from the *filtered* set so the admin can scope a list to
  // e.g. only attended people, only a specific tier, etc.
  const visibleUserIds = useMemo(() => {
    const seen = new Set<number>();
    for (const r of visibleRows) {
      if (typeof r.user_id === "number") seen.add(r.user_id);
    }
    return Array.from(seen);
  }, [visibleRows]);

  function openCreateList() {
    // Pre-fill a sensible default name; admin can edit before confirming.
    const base = event?.title ? `${event.title} — registrants` : "Event registrants";
    setListName(base);
    setListDesc("");
    setListOpen(true);
  }

  async function submitCreateList() {
    const token = getToken();
    if (!token) return;
    const name = listName.trim();
    if (!name) {
      setSnack({ msg: "List name is required.", severity: "error" });
      return;
    }
    if (visibleUserIds.length === 0) {
      setSnack({ msg: "No registered users in the current filter.", severity: "error" });
      return;
    }
    setCreatingList(true);
    try {
      await adminCreateUserList(
        { name, description: listDesc.trim() || undefined, user_ids: visibleUserIds },
        token,
      );
      setSnack({
        msg: `User list created with ${visibleUserIds.length} ${
          visibleUserIds.length === 1 ? "member" : "members"
        }.`,
        severity: "success",
      });
      setListOpen(false);
    } catch (e: any) {
      setSnack({ msg: e?.detail || "Failed to create list", severity: "error" });
    } finally {
      setCreatingList(false);
    }
  }

  async function doAction(
    reg: EventRegistration,
    action: "confirm-manual" | "cancel" | "attended" | "promote",
  ) {
    const token = getToken();
    if (!token) return;
    setBusyRowId(reg.id);
    try {
      if (action === "confirm-manual") {
        await adminConfirmManualRegistration(reg.id, token);
        setSnack({ msg: "Registration confirmed.", severity: "success" });
      } else if (action === "cancel") {
        if (!confirm(`Cancel ${reg.name}'s registration?`)) {
          setBusyRowId(null);
          return;
        }
        const res = await adminCancelRegistration(reg.id, token);
        const promotedNote = (res as { promoted_registration_id?: number })?.promoted_registration_id
          ? " A waitlisted user was auto-promoted."
          : "";
        setSnack({ msg: `Registration cancelled.${promotedNote}`, severity: "success" });
      } else if (action === "attended") {
        await adminMarkRegistrationAttended(reg.id, token);
        setSnack({ msg: "Marked attended.", severity: "success" });
      } else if (action === "promote") {
        await adminPromoteFromWaitlist(reg.id, token);
        setSnack({ msg: "Promoted from waitlist.", severity: "success" });
      }
      await reload();
    } catch (e: any) {
      setSnack({ msg: e?.detail || "Action failed", severity: "error" });
    } finally {
      setBusyRowId(null);
    }
  }

  function exportCsv() {
    // Minimal client-side CSV export — covers the visible rows so any active
    // filter/search shapes the file. For a full export, admin can clear the
    // filters first.
    const headers = [
      "Name",
      "Email",
      "Mobile",
      "Option",
      "Status",
      "Payment status",
      "Gateway",
      "Fee",
      "Reference",
      "Registered on",
    ];
    const csv = [
      headers.join(","),
      ...visibleRows.map((r) =>
        [
          csvCell(r.name),
          csvCell(r.email || ""),
          csvCell(r.mobile || ""),
          csvCell(r.tier_name || ""),
          r.status,
          r.payment_status,
          r.payment_gateway || "",
          r.fee_amount,
          csvCell(r.payment_reference || ""),
          new Date(r.created_at).toISOString(),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event_${eventId}_registrations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (gate !== "allowed" || loading) {
    return (
      <Box className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-brand-cream">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-6 md:py-10 px-4">
      <Box className="max-w-[1200px] mx-auto">
        <Button
          component={Link}
          href="/admin/pitham?tab=events"
          startIcon={<ArrowBackIcon />}
          className="!text-brand-maroon !font-semibold !mb-4"
        >
          Back to events
        </Button>

        <Typography variant="h4" className="!font-bold !text-brand-maroon">
          Registrations
        </Typography>
        {event && (
          <Typography color="text.secondary" className="!mb-6">
            {event.title}
            {event.event_date ? ` · ${event.event_date}` : ""}
            {event.event_time ? ` · ${event.event_time}` : ""}
          </Typography>
        )}

        {/* Stats strip — packed tight on phones (3 cols) so the table below
            stays the focal point; eases out to 7 across on desktop. */}
        <Box className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 md:gap-3 mb-5 md:mb-6">
          <StatTile label="Total" value={stats.total} />
          <StatTile label="Confirmed" value={stats.confirmed} accent="text-brand-success" />
          <StatTile label="Pending" value={stats.pending} accent="text-brand-warning" />
          <StatTile label="Attended" value={stats.attended} accent="text-brand-saffron" />
          <StatTile label="Waitlist" value={stats.waitlist} />
          <StatTile label="Cancelled" value={stats.cancelled} accent="text-brand-error" />
          <StatTile label="Revenue" value={`₹${stats.revenue.toLocaleString("en-IN")}`} />
        </Box>

        {/* Toolbar */}
        <Paper
          elevation={0}
          className={[
            "!p-3 md:!p-4 !mb-4 !rounded-2xl !border !border-brand-sand !grid !gap-3 !items-center",
            // Layout grows extra columns based on whether tier filter is needed
            // and reserves room for both action buttons (Create list + Export).
            tierOptions.length > 0
              ? "!grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-[2fr_1fr_1fr_auto_auto]"
              : "!grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-[2fr_1fr_auto_auto]",
          ].join(" ")}
        >
          <TextField
            size="small"
            placeholder="Search by name, email, mobile, tier, or reference"
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
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="pending_payment">Payment pending</MenuItem>
            <MenuItem value="attended">Attended</MenuItem>
            <MenuItem value="waitlist">Waitlist</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          {tierOptions.length > 0 && (
            <TextField
              select
              size="small"
              label="Option"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as TierFilter)}
            >
              <MenuItem value="all">All options</MenuItem>
              {tierOptions.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<GroupAddIcon />}
            onClick={openCreateList}
            disabled={visibleUserIds.length === 0}
          >
            Create user list
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={exportCsv}
            disabled={visibleRows.length === 0}
          >
            Export CSV
          </Button>
        </Paper>

        {/* Table */}
        <Paper elevation={0} className="!rounded-3xl !border !border-brand-sand !overflow-auto">
          {visibleRows.length === 0 ? (
            <Typography className="!p-8 !text-center" color="text.secondary">
              {rows.length === 0
                ? "Nobody has registered yet."
                : "No registrations match the current filters."}
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow className="!bg-brand-cream">
                  <TableCell className="!font-bold">Attendee</TableCell>
                  {tierOptions.length > 0 && (
                    <TableCell className="!font-bold">Option</TableCell>
                  )}
                  <TableCell className="!font-bold">Status</TableCell>
                  <TableCell className="!font-bold">Payment</TableCell>
                  <TableCell className="!font-bold !whitespace-nowrap">Registered</TableCell>
                  <TableCell className="!font-bold !text-right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedRows.map((r) => {
                  const status = STATUS_LABEL[r.status];
                  const pay = PAYMENT_LABEL[r.payment_status];
                  const isManualPending =
                    r.payment_gateway === "manual" && r.status === "pending_payment";
                  const canMarkAttended = r.status === "confirmed";
                  const canCancel = r.status !== "cancelled" && r.status !== "attended";
                  const canPromote = r.status === "waitlist";
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography className="!font-semibold !text-brand-maroon">{r.name}</Typography>
                        <Typography variant="caption" color="text.secondary" className="!block">
                          {r.email || r.mobile || ""}
                        </Typography>
                      </TableCell>
                      {tierOptions.length > 0 && (
                        <TableCell>
                          {r.tier_name ? (
                            <Typography variant="body2" className="!font-medium">
                              {r.tier_name}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip label={status.label} size="small" color={status.color} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label={pay.label} size="small" color={pay.color} variant="outlined" />
                        {r.fee_amount > 0 && (
                          <Typography variant="caption" color="text.secondary" className="!block !mt-0.5">
                            ₹{r.fee_amount}
                            {r.payment_gateway ? ` · ${r.payment_gateway}` : ""}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell className="!whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="!text-right">
                        <Tooltip title="View submission">
                          <IconButton size="small" onClick={() => setDetail(r)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {isManualPending && (
                          <Tooltip title="Confirm manual payment">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={busyRowId === r.id}
                                onClick={() => doAction(r, "confirm-manual")}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {canMarkAttended && (
                          <Tooltip title="Mark attended">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={busyRowId === r.id}
                                onClick={() => doAction(r, "attended")}
                              >
                                <HowToRegIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {canPromote && (
                          <Tooltip title="Promote from waitlist">
                            <span>
                              <IconButton
                                size="small"
                                color="warning"
                                disabled={busyRowId === r.id}
                                onClick={() => doAction(r, "promote")}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        {canCancel && (
                          <Tooltip title="Cancel">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={busyRowId === r.id}
                                onClick={() => doAction(r, "cancel")}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {visibleRows.length > 0 && (
            <TablePagination
              component="div"
              count={visibleRows.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </Paper>
      </Box>

      {/* Create user list dialog */}
      <Dialog open={listOpen} onClose={() => !creatingList && setListOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="!font-bold !text-brand-maroon">
          Create user list
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" className="!mb-3">
            This will create a reusable list of{" "}
            <strong>{visibleUserIds.length}</strong>{" "}
            {visibleUserIds.length === 1 ? "user" : "users"} from the currently
            filtered registrations. Cancelled or duplicate registrations
            collapse to a single member per user.
          </Typography>
          <TextField
            label="List name"
            fullWidth
            size="small"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="!mb-3"
            disabled={creatingList}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            size="small"
            multiline
            minRows={2}
            value={listDesc}
            onChange={(e) => setListDesc(e.target.value)}
            disabled={creatingList}
          />
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setListOpen(false)} disabled={creatingList}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitCreateList}
            disabled={creatingList || !listName.trim() || visibleUserIds.length === 0}
          >
            {creatingList ? "Creating…" : "Create list"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submission detail dialog */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle className="!font-bold !text-brand-maroon">
          {detail?.name}
        </DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailField label="Email" value={detail.email || "—"} />
              <DetailField label="Mobile" value={detail.mobile || "—"} />
              {detail.tier_name && <DetailField label="Option" value={detail.tier_name} />}
              <DetailField label="Status" value={STATUS_LABEL[detail.status].label} />
              <DetailField
                label="Payment"
                value={`${PAYMENT_LABEL[detail.payment_status].label}${
                  detail.fee_amount > 0 ? ` · ₹${detail.fee_amount}` : ""
                }${detail.payment_gateway ? ` · ${detail.payment_gateway}` : ""}`}
              />
              <DetailField label="Reference" value={detail.payment_reference || "—"} />
              <DetailField
                label="Registered on"
                value={new Date(detail.created_at).toLocaleString()}
              />
              {Object.entries(detail.field_values || {}).map(([k, v]) => (
                <Box key={k} className="sm:col-span-2">
                  <DetailField label={prettyLabel(k)} value={v as string} multiline />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={() => setDetail(null)}>Close</Button>
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

// ── Subcomponents ─────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <Paper
      elevation={0}
      className="!p-2 md:!p-4 !rounded-xl md:!rounded-2xl !border !border-brand-sand !text-center"
    >
      <Typography
        variant="caption"
        color="text.secondary"
        className="!block !font-semibold !uppercase !tracking-wider !text-[0.6rem] md:!text-[0.7rem] !leading-tight"
      >
        {label}
      </Typography>
      <Typography
        className={`!font-extrabold !mt-0.5 md:!mt-1 !text-sm md:!text-lg !leading-tight ${
          accent || "!text-brand-maroon"
        }`}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function DetailField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" className="!font-semibold !uppercase !tracking-wider">
        {label}
      </Typography>
      <Typography
        className={multiline ? "!whitespace-pre-wrap !leading-relaxed" : ""}
      >
        {value}
      </Typography>
    </Box>
  );
}

function csvCell(s: string): string {
  // RFC-4180-ish: wrap fields containing comma/quote/newline in quotes,
  // double-up internal quotes.
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function prettyLabel(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
