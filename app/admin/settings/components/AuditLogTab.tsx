"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Chip,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Stack,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { adminGetAuditLog, getToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { brandColors } from "@/theme/colors";

export default function AuditLogTab() {
  const { t } = useT();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(20);
  const [loading, setLoading] = useState(true);

  const [filterAction, setFilterAction] = useState("");
  const [filterAdminId, setFilterAdminId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState<Dayjs | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Dayjs | null>(null);
  const [sortOrder, setSortOrder] = useState("newest");

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
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load(0);
  }, []);

  function applyFilters() {
    setPage(0);
    load(0);
  }
  function clearFilters() {
    setFilterAction("");
    setFilterAdminId("");
    setFilterDateFrom(null);
    setFilterDateTo(null);
    setSortOrder("newest");
    setPage(0);
    const token = getToken();
    if (!token) return;
    setLoading(true);
    adminGetAuditLog(token, { page: 1, limit: rpp, sort: "newest" })
      .then((r: any) => {
        setLogs(r.logs);
        setTotal(r.total);
        if (r.filters) {
          setActionOptions(r.filters.actions || []);
          setAdminOptions(r.filters.admins || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 4,
          border: `1px solid ${brandColors.sand}`,
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          select
          size="small"
          label={t("tools.admin")}
          value={filterAdminId}
          onChange={(e) => setFilterAdminId(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">{t("common.all")}</MenuItem>
          {adminOptions.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t("tools.action")}
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">{t("common.all")}</MenuItem>
          {actionOptions.map((a) => (
            <MenuItem key={a} value={a}>
              {a}
            </MenuItem>
          ))}
        </TextField>
        <DatePicker
          label={t("settings.invoiceFrom")}
          value={filterDateFrom}
          onChange={(v) => setFilterDateFrom(v)}
          format="DD/MM/YYYY"
          slotProps={{ textField: { size: "small", sx: { minWidth: 145 } } }}
        />
        <DatePicker
          label={t("settings.invoiceTo")}
          value={filterDateTo}
          onChange={(v) => setFilterDateTo(v)}
          format="DD/MM/YYYY"
          slotProps={{ textField: { size: "small", sx: { minWidth: 145 } } }}
        />
        <TextField
          select
          size="small"
          label={t("table.sortBy")}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="newest">{t("sort.newest")}</MenuItem>
          <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
        </TextField>
        <Button variant="contained" size="small" onClick={applyFilters}>
          {t("common.filter")}
        </Button>
        <Button variant="outlined" size="small" onClick={clearFilters}>
          {t("common.clear")}
        </Button>
      </Paper>

      <Paper
        elevation={0}
        sx={{ borderRadius: 4, border: `1px solid ${brandColors.sand}`, overflow: "auto" }}
      >
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Typography sx={{ p: 4, textAlign: "center" }} color="text.secondary">
            {t("tools.noLogs")}
          </Typography>
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
                    <TableCell>
                      <Chip label={l.action} size="small" />
                    </TableCell>
                    <TableCell>
                      {l.entity_type}
                      {l.entity_id ? ` #${l.entity_id}` : ""}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {l.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => {
                setPage(p);
                load(p);
              }}
              rowsPerPage={rpp}
              onRowsPerPageChange={(e) => {
                setRpp(parseInt(e.target.value, 10));
                setPage(0);
                load(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
              labelRowsPerPage={t("table.rowsPerPage")}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
