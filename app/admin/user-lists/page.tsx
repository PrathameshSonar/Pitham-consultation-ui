"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  Checkbox,
  InputAdornment,
  MenuItem,
  TablePagination,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import {
  adminGetUsers,
  adminGetUserLists,
  adminCreateUserList,
  adminUpdateUserList,
  adminUpdateUserListMembers,
  adminDeleteUserList,
  getToken,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";

const WRAPPER_CLASS = "min-h-[calc(100vh-64px)] bg-[#FAF6EE] py-8 md:py-12 px-4";
const CONTAINER_CLASS = "max-w-[1100px] mx-auto";

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

  const [listSearch, setListSearch] = useState("");
  const [listSort, setListSort] = useState<SortKey>("newest");
  const [listPage, setListPage] = useState(0);
  const [listRpp, setListRpp] = useState(10);

  const [mode, setMode] = useState<Mode>(null);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [userSearch, setUserSearch] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const [u, l] = await Promise.all([adminGetUsers(token), adminGetUserLists(token)]);
      setUsers(u);
      setLists(l);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() {
    setMode("create");
    setEditing(null);
    setName("");
    setDescription("");
    setSelectedIds(new Set());
    setUserSearch("");
    setError("");
  }

  function openEditName(list: UserListItem) {
    setMode("edit-name");
    setEditing(list);
    setName(list.name);
    setDescription(list.description || "");
    setError("");
  }

  function openEditMembers(list: UserListItem) {
    setMode("edit-members");
    setEditing(list);
    setSelectedIds(new Set(list.member_ids));
    setUserSearch("");
    setError("");
  }

  function closeDialog() {
    setMode(null);
    setEditing(null);
  }

  function toggleUser(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredUsers.forEach((u) => next.add(u.id));
      return next;
    });
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  const filteredLists = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    let arr = lists;
    if (q) {
      arr = arr.filter(
        (l) => l.name.toLowerCase().includes(q) || (l.description || "").toLowerCase().includes(q),
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
    return users.filter(
      (u: any) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.city || "").toLowerCase().includes(q),
    );
  }, [users, userSearch]);

  async function handleSave() {
    const token = getToken();
    if (!token) return;
    setError("");
    setSaving(true);
    try {
      if (mode === "create") {
        if (!name.trim()) {
          setError("List name is required");
          setSaving(false);
          return;
        }
        const newList = await adminCreateUserList(
          { name, description, user_ids: Array.from(selectedIds) },
          token,
        );
        setLists((prev) => [newList, ...prev]);
        setSuccess("List created.");
      } else if (mode === "edit-name" && editing) {
        const updated = await adminUpdateUserList(editing.id, { name, description }, token);
        setLists((prev) => prev.map((l) => (l.id === editing.id ? updated : l)));
        setSuccess("List updated.");
      } else if (mode === "edit-members" && editing) {
        const updated = await adminUpdateUserListMembers(editing.id, Array.from(selectedIds), token);
        setLists((prev) => prev.map((l) => (l.id === editing.id ? updated : l)));
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
      setLists((prev) => prev.filter((l) => l.id !== list.id));
      setSuccess("List deleted.");
    } catch (err: any) {
      setError(err?.detail || "Delete failed");
    }
  }

  if (loading) {
    return (
      <Box className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const showUserPicker = mode === "create" || mode === "edit-members";
  const dialogTitle =
    mode === "create"
      ? "Create User List"
      : mode === "edit-name"
        ? "Edit List Details"
        : mode === "edit-members"
          ? `Edit Members — ${editing?.name || ""}`
          : "";

  return (
    <Box className={WRAPPER_CLASS}>
      <Box className={CONTAINER_CLASS}>
        <Box className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <Typography variant="h4" className="!text-brand-maroon !font-bold">
            {t("lists.title")}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            {t("lists.createBtn")}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" className="!mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" className="!mb-4" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {/* Search + sort toolbar */}
        <Paper
          elevation={0}
          className="!p-3 md:!p-4 !mb-6 !rounded-2xl !grid !gap-3 md:!gap-4 !grid-cols-1 sm:!grid-cols-[2fr_1fr] !items-center !border !border-[#E8D9BF] !bg-white [&_.MuiFormControl-root]:!w-full"
        >
          <TextField
            size="small"
            placeholder={t("lists.searchPlace")}
            value={listSearch}
            onChange={(e) => {
              setListSearch(e.target.value);
              setListPage(0);
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
            label={t("table.sortBy")}
            value={listSort}
            onChange={(e) => {
              setListSort(e.target.value as SortKey);
              setListPage(0);
            }}
          >
            <MenuItem value="newest">{t("sort.newest")}</MenuItem>
            <MenuItem value="oldest">{t("sort.oldest")}</MenuItem>
            <MenuItem value="name">{t("sort.name")}</MenuItem>
          </TextField>
        </Paper>

        {filteredLists.length === 0 ? (
          <Box className="p-12 text-center rounded-3xl bg-white border border-dashed border-brand-sand">
            <PeopleIcon className="!text-[3rem] !text-[color:rgba(0,0,0,0.38)] !mb-2" />
            <Typography color="text.secondary">{t("lists.empty")}</Typography>
            <Typography variant="body2" color="text.disabled" className="!mt-1">
              {t("lists.empty.desc")}
            </Typography>
          </Box>
        ) : (
          <>
            {pagedLists.map((list) => (
              <Paper
                key={list.id}
                elevation={0}
                className="!p-6 !mb-4 !rounded-3xl !bg-white !border !border-brand-sand"
              >
                <Box className="flex items-start justify-between gap-4 flex-wrap">
                  <Box className="min-w-0 flex-1">
                    <Typography className="!font-bold !text-brand-maroon">{list.name}</Typography>
                    {list.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        className="!mt-1 !break-words"
                      >
                        {list.description}
                      </Typography>
                    )}
                    <Box className="mt-2">
                      <Box
                        component="span"
                        className="bg-[#FFF4DE] text-brand-gold font-bold px-3 py-1 rounded-full text-[0.8rem] inline-block"
                      >
                        {list.member_count} {list.member_count !== 1 ? t("lists.members") : t("lists.member")}
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openEditName(list)} title={t("lists.rename")}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(list)}
                      title={t("common.delete")}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box className="mt-4 flex gap-2 flex-wrap">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PeopleIcon />}
                    onClick={() => openEditMembers(list)}
                  >
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
              onRowsPerPageChange={(e) => {
                setListRpp(parseInt(e.target.value, 10));
                setListPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage={t("table.rowsPerPage")}
            />
          </>
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={!!mode} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle className="!font-bold !text-brand-saffron-dark">{dialogTitle}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" className="!mb-4">
              {error}
            </Alert>
          )}

          {(mode === "create" || mode === "edit-name") && (
            <Box className="mt-2 mb-4">
              <TextField
                label="List Name"
                required
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="!mb-4"
              />
              <TextField
                label="Description"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                onChange={(e) => setUserSearch(e.target.value)}
                className="!mb-2"
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
              <Box className="flex gap-2 mb-2">
                <Button size="small" onClick={selectAllFiltered}>
                  Select all filtered
                </Button>
                <Button size="small" onClick={clearAll}>
                  Clear
                </Button>
                <Typography
                  variant="caption"
                  className="!ml-auto !self-center !text-brand-text-medium"
                >
                  {selectedIds.size} selected
                </Typography>
              </Box>
              <Box className="max-h-[380px] overflow-auto border border-brand-sand rounded-lg bg-brand-ivory">
                <List dense disablePadding>
                  {filteredUsers.map((u: any) => (
                    <ListItemButton key={u.id} onClick={() => toggleUser(u.id)}>
                      <Checkbox edge="start" checked={selectedIds.has(u.id)} tabIndex={-1} disableRipple />
                      <ListItemText
                        primary={u.name}
                        secondary={`${u.email} · ${u.city || ""}${u.state ? ", " + u.state : ""}`}
                      />
                    </ListItemButton>
                  ))}
                  {filteredUsers.length === 0 && (
                    <Box className="p-4 text-center">
                      <Typography variant="caption" color="text.secondary">
                        No users match.
                      </Typography>
                    </Box>
                  )}
                </List>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions className="!px-6 !pb-4">
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
