"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Paper, Typography, Button, CircularProgress, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  List, ListItemButton, ListItemText, Checkbox, InputAdornment,
  MenuItem, TablePagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import {
  adminGetUsers, adminGetUserLists, adminCreateUserList,
  adminUpdateUserList, adminUpdateUserListMembers, adminDeleteUserList,
  getToken,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import * as s from "./styles";

type SortKey = "newest" | "oldest" | "name";

interface UserListItem {
  id: number;
  name: string;
  description?: string;
  member_count: number;
  member_ids: number[];
  created_at: string;
}

type Mode = "create" | "edit-name" | "edit-members" | null;

export default function AdminUserLists() {
  const router = useRouter();
  const { t } = useT();
  const [users, setUsers] = useState<any[]>([]);
  const [lists, setLists] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search / sort / pagination for the lists grid
  const [listSearch, setListSearch] = useState("");
  const [listSort, setListSort]     = useState<SortKey>("newest");
  const [listPage, setListPage]     = useState(0);
  const [listRpp, setListRpp]       = useState(10);

  // Dialog state
  const [mode, setMode] = useState<Mode>(null);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [userSearch, setUserSearch] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    try {
      const [u, l] = await Promise.all([adminGetUsers(token), adminGetUserLists(token)]);
      setUsers(u); setLists(l);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setMode("create"); setEditing(null);
    setName(""); setDescription("");
    setSelectedIds(new Set()); setUserSearch(""); setError("");
  }

  function openEditName(list: UserListItem) {
    setMode("edit-name"); setEditing(list);
    setName(list.name); setDescription(list.description || ""); setError("");
  }

  function openEditMembers(list: UserListItem) {
    setMode("edit-members"); setEditing(list);
    setSelectedIds(new Set(list.member_ids)); setUserSearch(""); setError("");
  }

  function closeDialog() { setMode(null); setEditing(null); }

  function toggleUser(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredUsers.forEach(u => next.add(u.id));
      return next;
    });
  }

  function clearAll() { setSelectedIds(new Set()); }

  const filteredLists = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    let arr = lists;
    if (q) {
      arr = arr.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q)
      );
    }
    arr = [...arr].sort((a, b) => {
      if (listSort === "name") return a.name.localeCompare(b.name);
      const ad = new Date(a.created_at).getTime();
      const bd = new Date(b.created_at).getTime();
      return listSort === "oldest" ? ad - bd : bd - ad;
    });
    return arr;
  }, [lists, listSearch, listSort]);

  const pagedLists = filteredLists.slice(listPage * listRpp, listPage * listRpp + listRpp);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u: any) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.city || "").toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  async function handleSave() {
    const token = getToken();
    if (!token) return;
    setError(""); setSaving(true);
    try {
      if (mode === "create") {
        if (!name.trim()) { setError("List name is required"); setSaving(false); return; }
        const newList = await adminCreateUserList(
          { name, description, user_ids: Array.from(selectedIds) },
          token
        );
        setLists(prev => [newList, ...prev]);
        setSuccess("List created.");
      } else if (mode === "edit-name" && editing) {
        const updated = await adminUpdateUserList(editing.id, { name, description }, token);
        setLists(prev => prev.map(l => l.id === editing.id ? updated : l));
        setSuccess("List updated.");
      } else if (mode === "edit-members" && editing) {
        const updated = await adminUpdateUserListMembers(
          editing.id, Array.from(selectedIds), token
        );
        setLists(prev => prev.map(l => l.id === editing.id ? updated : l));
        setSuccess("Members updated.");
      }
      closeDialog();
    } catch (err: any) {
      setError(err?.detail || "Action failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(list: UserListItem) {
    if (!confirm(`Delete list "${list.name}"?`)) return;
    const token = getToken();
    if (!token) return;
    try {
      await adminDeleteUserList(list.id, token);
      setLists(prev => prev.filter(l => l.id !== list.id));
      setSuccess("List deleted.");
    } catch (err: any) {
      setError(err?.detail || "Delete failed");
    }
  }

  if (loading) {
    return (
      <Box sx={{ ...s.wrapper, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const showUserPicker = mode === "create" || mode === "edit-members";
  const dialogTitle =
    mode === "create"        ? "Create User List" :
    mode === "edit-name"     ? "Edit List Details" :
    mode === "edit-members"  ? `Edit Members — ${editing?.name || ""}` : "";

  return (
    <Box sx={s.wrapper}>
      <Box sx={s.container}>
        <Box sx={s.headerRow}>
          <Typography variant="h4" sx={s.title}>{t("lists.title")}</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t("lists.createBtn")}
          </Button>
        </Box>

        {error   && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>{success}</Alert>}

        {/* Search + sort toolbar */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, display: "flex", gap: 2, flexWrap: "wrap", border: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
          <TextField
            size="small"
            placeholder={t("lists.searchPlace")}
            value={listSearch}
            onChange={e => { setListSearch(e.target.value); setListPage(0); }}
            sx={{ flex: 1, minWidth: 200 }}
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
            select size="small" label={t("table.sortBy")} value={listSort}
            onChange={e => { setListSort(e.target.value as SortKey); setListPage(0); }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="newest">{t("sort.newest")}</MenuItem>
            <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
            <MenuItem value="name">{t("sort.name")}</MenuItem>
          </TextField>
        </Paper>

        {filteredLists.length === 0 ? (
          <Box sx={s.emptyBox}>
            <PeopleIcon sx={{ fontSize: "3rem", color: "text.disabled", mb: 1 }} />
            <Typography color="text.secondary">{t("lists.empty")}</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              {t("lists.empty.desc")}
            </Typography>
          </Box>
        ) : (
          <>
            {pagedLists.map(list => (
              <Paper key={list.id} elevation={0} sx={s.listCard}>
                <Box sx={s.listHeader}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={s.listName}>{list.name}</Typography>
                    {list.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, wordBreak: "break-word" }}>
                        {list.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 1 }}>
                      <Box component="span" sx={s.memberBadge}>
                        {list.member_count} {list.member_count !== 1 ? t("lists.members") : t("lists.member")}
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openEditName(list)} title={t("lists.rename")}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(list)} title={t("common.delete")}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={s.actionsRow}>
                  <Button size="small" variant="outlined" startIcon={<PeopleIcon />}
                    onClick={() => openEditMembers(list)}>
                    {t("lists.manage")}
                  </Button>
                </Box>
              </Paper>
            ))}
            <TablePagination
              component="div"
              count={filteredLists.length}
              page={listPage}
              onPageChange={(_, p) => setListPage(p)}
              rowsPerPage={listRpp}
              onRowsPerPageChange={e => { setListRpp(parseInt(e.target.value, 10)); setListPage(0); }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage={t("table.rowsPerPage")}
            />
          </>
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={!!mode} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: "primary.dark" }}>{dialogTitle}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {(mode === "create" || mode === "edit-name") && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <TextField
                label="List Name"
                required
                fullWidth
                value={name}
                onChange={e => setName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Description"
                fullWidth
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </Box>
          )}

          {showUserPicker && (
            <>
              <TextField
                placeholder="Search users by name, email, city…"
                fullWidth
                size="small"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                sx={{ mb: 1 }}
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
                <Button size="small" onClick={clearAll}>Clear</Button>
                <Typography variant="caption" sx={{ ml: "auto", alignSelf: "center", color: "text.secondary" }}>
                  {selectedIds.size} selected
                </Typography>
              </Box>
              <Box sx={s.userPickerList}>
                <List dense disablePadding>
                  {filteredUsers.map((u: any) => (
                    <ListItemButton key={u.id} onClick={() => toggleUser(u.id)}>
                      <Checkbox
                        edge="start"
                        checked={selectedIds.has(u.id)}
                        tabIndex={-1}
                        disableRipple
                      />
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
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
