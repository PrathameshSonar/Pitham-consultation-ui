// Backend URL precedence:
//   1. NEXT_PUBLIC_API_URL  — set at BUILD time on the deployment platform.
//                             Must be present for any non-localhost deploy.
//   2. http://localhost:8000 — implicit fallback for `npm run dev`.
//
// We deliberately do NOT hardcode a production URL: every domain change
// would otherwise need a code edit + redeploy. If you forget to set
// NEXT_PUBLIC_API_URL on prod, fetches will hit localhost:8000 and fail
// loudly — that's the intended signal to fix the env, not paper over it.
//
// We also deliberately do NOT fall back to NEXT_PUBLIC_SITE_URL — that's the
// frontend origin (used for OG tags / metadata) and pointing API calls at it
// turns every request into a same-origin 404.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BASE = API_BASE;

/** Build a full URL for a backend file path (uploads, receipts, etc.) */
export function fileUrl(path: string): string {
  if (!path) return "";
  return `${API_BASE}/${path.replace(/\\/g, "/")}`;
}

/** Wrap fetch so the httpOnly auth cookie is always sent. The Bearer token is
 *  also forwarded for cross-site deployments where third-party cookies are
 *  blocked by the browser (Safari ITP, Chrome 3rd-party cookie phaseout) —
 *  in those setups the cookie can't flow and Bearer is the only thing that
 *  keeps auth working. For same-origin deployments the cookie alone would do. */
function cfetch(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { credentials: "include", ...init });
}

function authHeaders(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function registerUser(data: Record<string, string>) {
  const res = await cfetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function loginUser(data: { email?: string; mobile?: string; password: string }) {
  const res = await cfetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { token, role, name }
}

export async function forgotPassword(data: { email?: string; mobile?: string }) {
  const res = await cfetch(`${BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function resetPassword(data: { token: string; new_password: string }) {
  const res = await cfetch(`${BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function googleLogin(credential: string) {
  const res = await cfetch(`${BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { token, role, name }
}

export async function getProfile(token: string) {
  const res = await cfetch(`${BASE}/auth/profile`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function bookAppointment(formData: FormData, token: string) {
  const res = await cfetch(`${BASE}/appointments`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMyAppointments(token: string) {
  const res = await cfetch(`${BASE}/appointments/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function cancelAppointment(id: number, token: string) {
  const res = await cfetch(`${BASE}/appointments/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function generateReceipt(id: number, token: string) {
  const res = await cfetch(`${BASE}/appointments/${id}/generate-receipt`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin: Appointments ───────────────────────────────────────────────────────

export async function adminGetAppointments(token: string) {
  const res = await cfetch(`${BASE}/admin/appointments`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminVerifyPayment(id: number, payment_reference: string, token: string) {
  const res = await cfetch(`${BASE}/admin/appointments/${id}/verify-payment`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ payment_reference }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminAssignSlot(
  id: number,
  data: {
    scheduled_date: string;
    scheduled_time: string;
    zoom_link: string;
    notes?: string;
  },
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/appointments/${id}/assign-slot`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminReschedule(
  id: number,
  data: {
    scheduled_date: string;
    scheduled_time: string;
    zoom_link?: string;
    reason?: string;
  },
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/appointments/${id}/reschedule`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminMarkCompleted(
  id: number,
  data: {
    analysis_notes?: string;
    analysis_file?: File | null;
    recording_link?: string;
    gallery_doc_ids?: number[];
  },
  token: string,
) {
  const fd = new FormData();
  fd.append("analysis_notes", data.analysis_notes || "");
  fd.append("recording_link", data.recording_link || "");
  fd.append("gallery_doc_ids", JSON.stringify(data.gallery_doc_ids || []));
  if (data.analysis_file) fd.append("analysis_file", data.analysis_file);
  const res = await cfetch(`${BASE}/admin/appointments/${id}/complete`, {
    method: "POST",
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function generateInvoice(id: number, token: string) {
  const res = await cfetch(`${BASE}/appointments/${id}/generate-invoice`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDownloadInvoicesZip(dateFrom: string, dateTo: string, token: string) {
  const res = await cfetch(`${BASE}/admin/invoices/download?date_from=${dateFrom}&date_to=${dateTo}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.blob();
}

export async function adminCancelAppointment(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/appointments/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function deleteAccount(token: string) {
  const res = await cfetch(`${BASE}/auth/account`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateNotificationPrefs(data: { notify_email?: boolean }, token: string) {
  const res = await cfetch(`${BASE}/auth/profile/notifications`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function sendVerificationEmail(token: string) {
  const res = await cfetch(`${BASE}/auth/send-verification`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function verifyEmailToken(verifyToken: string) {
  const res = await cfetch(`${BASE}/auth/verify-email?token=${encodeURIComponent(verifyToken)}`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function exportMyData(token: string) {
  const res = await cfetch(`${BASE}/auth/account/export`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMyFeedback(apptId: number, token: string) {
  const res = await cfetch(`${BASE}/appointments/${apptId}/feedback`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json(); // null if not yet submitted
}

export async function submitFeedback(
  apptId: number,
  data: { rating: number; comment?: string },
  token: string,
) {
  const res = await cfetch(`${BASE}/appointments/${apptId}/feedback`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminListFeedback(token: string) {
  const res = await cfetch(`${BASE}/admin/feedback`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminFeedbackSummary(token: string) {
  const res = await cfetch(`${BASE}/admin/feedback/summary`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGenerateInvoice(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/appointments/${id}/generate-invoice`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { message, invoice_path }
}

export async function adminGenerateReceipt(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/appointments/${id}/generate-receipt`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCreateZoomMeeting(
  data: { topic: string; scheduled_date: string; scheduled_time: string; duration?: number },
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/zoom/create-meeting`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { id, join_url, start_url, password }
}

// ── Admin: Users ──────────────────────────────────────────────────────────────

export async function adminGetUsers(
  token: string,
  params?: {
    search?: string;
    city?: string;
    state?: string;
    country?: string;
    role?: "user" | "moderator" | "admin";
  },
) {
  const q = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v)) as Record<string, string>,
  ).toString();
  const res = await cfetch(`${BASE}/admin/users${q ? `?${q}` : ""}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetModeratorCount(token: string): Promise<{ current: number; max: number }> {
  const res = await cfetch(`${BASE}/admin/users/moderators/count`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetUser(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/users/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetUserAppointments(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/users/${id}/appointments`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getMyDocuments(token: string) {
  const res = await cfetch(`${BASE}/documents/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUploadDocument(formData: FormData, token: string) {
  const res = await cfetch(`${BASE}/admin/documents`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetDocuments(token: string) {
  const res = await cfetch(`${BASE}/admin/documents`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin Documents: Gallery (reusable templates) ────────────────────────────

export async function adminUploadGalleryDocument(formData: FormData, token: string) {
  const res = await cfetch(`${BASE}/admin/documents/gallery`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetGallery(token: string) {
  const res = await cfetch(`${BASE}/admin/documents/gallery`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteGalleryDocument(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/documents/gallery/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminAssignFromGallery(
  data: { gallery_doc_id: number; user_id: number },
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/documents/assign-from-gallery`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteAssignedDocument(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetUserDocuments(userId: number, token: string) {
  const res = await cfetch(`${BASE}/admin/users/${userId}/documents`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminBulkAssignFromGallery(
  data: { gallery_doc_id: number; user_ids: number[]; batch_label?: string },
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/documents/bulk-assign-gallery`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { assigned_count, skipped }
}

export async function adminBulkUploadDocument(formData: FormData, token: string) {
  // formData: user_ids (JSON array string), title, description, file
  const res = await cfetch(`${BASE}/admin/documents/bulk-upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin: User Lists ────────────────────────────────────────────────────────

export async function adminGetUserLists(token: string) {
  const res = await cfetch(`${BASE}/admin/user-lists`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCreateUserList(
  data: { name: string; description?: string; user_ids: number[] },
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/user-lists`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateUserList(
  id: number,
  data: { name?: string; description?: string },
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/user-lists/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateUserListMembers(id: number, user_ids: number[], token: string) {
  const res = await cfetch(`${BASE}/admin/user-lists/${id}/members`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ user_ids }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteUserList(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/user-lists/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function submitQuery(data: { subject: string; message: string }, token: string) {
  const res = await cfetch(`${BASE}/queries`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMyQueries(token: string) {
  const res = await cfetch(`${BASE}/queries/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetQueries(token: string) {
  const res = await cfetch(`${BASE}/admin/queries`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminReplyQuery(id: number, reply: string, token: string) {
  const res = await cfetch(`${BASE}/admin/queries/${id}/reply`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Recordings ────────────────────────────────────────────────────────────────

export async function getMyRecordings(token: string) {
  const res = await cfetch(`${BASE}/recordings/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminAddRecording(formData: FormData, token: string) {
  const res = await cfetch(`${BASE}/admin/recordings`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetRecordings(token: string) {
  const res = await cfetch(`${BASE}/admin/recordings`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminBulkAssignRecording(
  data: { title: string; recording_url: string; user_ids?: number[]; list_ids?: number[] },
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/recordings/bulk-assign`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteRecording(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/recordings/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(data: Record<string, string>, token: string) {
  const res = await cfetch(`${BASE}/auth/profile`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getPublicSettings() {
  const res = await cfetch(`${BASE}/settings/public`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetSettings(token: string) {
  const res = await cfetch(`${BASE}/admin/settings`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateSettings(data: Record<string, any>, token: string) {
  const res = await cfetch(`${BASE}/admin/settings`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function adminGetAnalytics(token: string) {
  const res = await cfetch(`${BASE}/admin/analytics`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── User Lookup (cross-section name resolution) ─────────────────────────────
// Lighter than adminGetUsers — returns only id/name/email/mobile/city/state.
// Available to any admin/moderator regardless of "users" section permission.

export interface UserLookup {
  id: number;
  name: string;
  email?: string | null;
  mobile: string;
  city?: string | null;
  state?: string | null;
}

export async function adminLookupUsers(
  token: string,
  opts: { ids?: number[]; search?: string; limit?: number } = {},
): Promise<UserLookup[]> {
  const params = new URLSearchParams();
  if (opts.ids && opts.ids.length > 0) params.set("ids", opts.ids.join(","));
  if (opts.search) params.set("search", opts.search);
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  const url = `${BASE}/admin/users/lookup${qs ? `?${qs}` : ""}`;
  const res = await cfetch(url, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Role Management ──────────────────────────────────────────────────────────

export async function adminChangeUserRole(
  userId: number,
  role: string,
  token: string,
  permissions?: string[],
) {
  const body: Record<string, unknown> = { role };
  if (permissions !== undefined) body.permissions = permissions;
  const res = await cfetch(`${BASE}/admin/users/${userId}/role`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateUserPermissions(
  userId: number,
  permissions: string[],
  token: string,
): Promise<{ message: string; permissions: string[] }> {
  const res = await cfetch(`${BASE}/admin/users/${userId}/permissions`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetPendingSettings(token: string) {
  const res = await cfetch(`${BASE}/admin/settings/pending`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminApproveSettingChange(changeId: number, token: string) {
  const res = await cfetch(`${BASE}/admin/settings/pending/${changeId}/approve`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminRejectSettingChange(changeId: number, token: string) {
  const res = await cfetch(`${BASE}/admin/settings/pending/${changeId}/reject`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin Tools ──────────────────────────────────────────────────────────────

export async function adminGetAuditLog(
  token: string,
  params: {
    page?: number;
    limit?: number;
    action?: string;
    admin_id?: number;
    entity_type?: string;
    date_from?: string;
    date_to?: string;
    sort?: string;
  } = {},
) {
  const p = new URLSearchParams();
  p.set("page", String(params.page || 1));
  p.set("limit", String(params.limit || 20));
  if (params.action) p.set("action", params.action);
  if (params.admin_id) p.set("admin_id", String(params.admin_id));
  if (params.entity_type) p.set("entity_type", params.entity_type);
  if (params.date_from) p.set("date_from", params.date_from);
  if (params.date_to) p.set("date_to", params.date_to);
  if (params.sort) p.set("sort", params.sort);
  const res = await cfetch(`${BASE}/admin/audit-log?${p}`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGlobalSearch(query: string, token: string) {
  const res = await cfetch(`${BASE}/admin/search?q=${encodeURIComponent(query)}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminExportUsers(token: string) {
  const res = await cfetch(`${BASE}/admin/export/users`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.blob();
}

export async function adminExportAppointments(token: string, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await cfetch(`${BASE}/admin/export/appointments?${params}`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.blob();
}

export async function adminExportPayments(token: string, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await cfetch(`${BASE}/admin/export/payments?${params}`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.blob();
}

export async function adminSendReminders(token: string) {
  const res = await cfetch(`${BASE}/admin/send-reminders`, { method: "POST", headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export function downloadCalendarIcs(apptId: number, token: string) {
  window.open(`${BASE}/appointments/${apptId}/calendar?token=${token}`, "_blank");
}

// ── Payments ─────────────────────────────────────────────────────────────────

export async function initiatePhonePePayment(
  data: { appointment_id: number; amount: number },
  token: string,
) {
  const res = await cfetch(`${BASE}/payments/phonepe/initiate`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { redirect_url, transaction_id }
}

export async function checkPhonePeStatus(transactionId: string, token: string) {
  const res = await cfetch(`${BASE}/payments/phonepe/status/${transactionId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { success, state, transaction_id }
}

// ── Events (public + admin) ──────────────────────────────────────────────────

export interface RegistrationTier {
  id: string;
  name: string;
  description?: string;
  fee: number;
  max_attendees?: number | null;
  sort_order: number;
}

export interface EventRegistrationConfig {
  enabled: boolean;
  fee: number;
  gateway: "free" | "manual" | "phonepe" | "razorpay" | "gpay";
  fields: Record<string, { enabled: boolean; required: boolean }>;
  max_attendees: number | null;
  deadline: string | null;
  confirmation_message: string;
  /** When the event is full and this is true, further registrations land
   *  on the waitlist instead of being rejected. Promotion happens
   *  automatically on cancellation or manually via the admin dashboard. */
  waitlist_enabled: boolean;
  /** Optional registration "options" (Mukhya Yajmaan, Annadan Seva, …).
   *  When this array is non-empty, the public form shows a picker and the
   *  chosen tier's fee replaces the single `fee` above. Empty = simple mode. */
  tiers: RegistrationTier[];
}

export interface EventItem {
  id: number;
  title: string;
  description?: string | null;
  event_date: string;
  event_time?: string | null;
  location?: string | null;
  location_map_url?: string | null;
  image_url?: string | null;
  is_featured?: boolean;
  registration_config?: EventRegistrationConfig;
  created_at: string;
}

export interface EventInput {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string;
  location?: string;
  location_map_url?: string;
  image_url?: string;
  is_featured?: boolean;
  /** JSON-stringified EventRegistrationConfig — backend validates + normalises. */
  registration_config?: string;
  image?: File | null;
}

function _eventForm(data: Partial<EventInput>): FormData {
  const fd = new FormData();
  if (data.title !== undefined) fd.append("title", data.title);
  if (data.description !== undefined) fd.append("description", data.description);
  if (data.event_date !== undefined) fd.append("event_date", data.event_date);
  if (data.event_time !== undefined) fd.append("event_time", data.event_time);
  if (data.location !== undefined) fd.append("location", data.location);
  if (data.location_map_url !== undefined) fd.append("location_map_url", data.location_map_url);
  if (data.image_url !== undefined) fd.append("image_url", data.image_url);
  if (data.is_featured !== undefined) fd.append("is_featured", String(data.is_featured));
  if (data.registration_config !== undefined) fd.append("registration_config", data.registration_config);
  if (data.image) fd.append("image", data.image);
  return fd;
}

export async function getPublicEvents(
  scope: "upcoming" | "past" | "all" = "upcoming",
  limit?: number,
): Promise<EventItem[]> {
  const params = new URLSearchParams({ scope });
  if (limit) params.set("limit", String(limit));
  const res = await cfetch(`${BASE}/events?${params}`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetEvents(token: string): Promise<EventItem[]> {
  const res = await cfetch(`${BASE}/admin/events`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCreateEvent(data: EventInput, token: string): Promise<EventItem> {
  const res = await cfetch(`${BASE}/admin/events`, {
    method: "POST",
    headers: authHeaders(token),
    body: _eventForm(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateEvent(
  id: number,
  data: Partial<EventInput>,
  token: string,
): Promise<EventItem> {
  const res = await cfetch(`${BASE}/admin/events/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: _eventForm(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteEvent(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/events/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Pitham CMS (banners / videos / instagram + testimonials) ─────────────────

export type PithamMediaKind = "banner" | "video" | "instagram" | "gallery";

export interface PithamMediaItem {
  id: number;
  kind: PithamMediaKind;
  title?: string | null;
  url?: string | null;
  image_path?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface TestimonialItem {
  id: number;
  name: string;
  location?: string | null;
  quote: string;
  photo_path?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PithamCmsBundle {
  banners: PithamMediaItem[];
  videos: PithamMediaItem[];
  instagram: PithamMediaItem[];
  gallery: PithamMediaItem[];
  testimonials: TestimonialItem[];
  featured_events: EventItem[];
}

export async function getPithamCms(): Promise<PithamCmsBundle> {
  const res = await cfetch(`${BASE}/pitham/cms`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getPublicEvent(id: number | string): Promise<EventItem> {
  const res = await cfetch(`${BASE}/events/${id}`);
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin: Pitham media ─────────────────────────────────────────────────────

export async function adminListPithamMedia(kind: PithamMediaKind, token: string): Promise<PithamMediaItem[]> {
  const res = await cfetch(`${BASE}/admin/pitham/media?kind=${kind}`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCreatePithamMedia(
  data: {
    kind: PithamMediaKind;
    title?: string;
    url?: string;
    sort_order?: number;
    is_active?: boolean;
    image?: File | null;
  },
  token: string,
): Promise<PithamMediaItem> {
  const fd = new FormData();
  fd.append("kind", data.kind);
  if (data.title !== undefined) fd.append("title", data.title);
  if (data.url !== undefined) fd.append("url", data.url);
  if (data.sort_order !== undefined) fd.append("sort_order", String(data.sort_order));
  if (data.is_active !== undefined) fd.append("is_active", String(data.is_active));
  if (data.image) fd.append("image", data.image);
  const res = await cfetch(`${BASE}/admin/pitham/media`, {
    method: "POST",
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdatePithamMedia(
  id: number,
  data: Partial<{ title: string; url: string; sort_order: number; is_active: boolean; image: File | null }>,
  token: string,
): Promise<PithamMediaItem> {
  const fd = new FormData();
  if (data.title !== undefined) fd.append("title", data.title);
  if (data.url !== undefined) fd.append("url", data.url);
  if (data.sort_order !== undefined) fd.append("sort_order", String(data.sort_order));
  if (data.is_active !== undefined) fd.append("is_active", String(data.is_active));
  if (data.image) fd.append("image", data.image);
  const res = await cfetch(`${BASE}/admin/pitham/media/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeletePithamMedia(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/pitham/media/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin: Testimonials ─────────────────────────────────────────────────────

export async function adminListTestimonials(token: string): Promise<TestimonialItem[]> {
  const res = await cfetch(`${BASE}/admin/pitham/testimonials`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCreateTestimonial(
  data: {
    name: string;
    quote: string;
    location?: string;
    sort_order?: number;
    is_active?: boolean;
    photo?: File | null;
  },
  token: string,
): Promise<TestimonialItem> {
  const fd = new FormData();
  fd.append("name", data.name);
  fd.append("quote", data.quote);
  if (data.location !== undefined) fd.append("location", data.location);
  if (data.sort_order !== undefined) fd.append("sort_order", String(data.sort_order));
  if (data.is_active !== undefined) fd.append("is_active", String(data.is_active));
  if (data.photo) fd.append("photo", data.photo);
  const res = await cfetch(`${BASE}/admin/pitham/testimonials`, {
    method: "POST",
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateTestimonial(
  id: number,
  data: Partial<{
    name: string;
    quote: string;
    location: string;
    sort_order: number;
    is_active: boolean;
    photo: File | null;
  }>,
  token: string,
): Promise<TestimonialItem> {
  const fd = new FormData();
  if (data.name !== undefined) fd.append("name", data.name);
  if (data.quote !== undefined) fd.append("quote", data.quote);
  if (data.location !== undefined) fd.append("location", data.location);
  if (data.sort_order !== undefined) fd.append("sort_order", String(data.sort_order));
  if (data.is_active !== undefined) fd.append("is_active", String(data.is_active));
  if (data.photo) fd.append("photo", data.photo);
  const res = await cfetch(`${BASE}/admin/pitham/testimonials/${id}`, {
    method: "PUT",
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteTestimonial(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/pitham/testimonials/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Broadcasts ──────────────────────────────────────────────────────────────

export interface Broadcast {
  id: number;
  title: string;
  message: string;
  image_path?: string | null;
  target_type: "all" | "list";
  target_list_id?: number | null;
  sent_by_name?: string | null;
  created_at: string;
  is_read: boolean;
}

export async function adminListBroadcasts(token: string): Promise<Broadcast[]> {
  const res = await cfetch(`${BASE}/admin/broadcasts`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCreateBroadcast(
  data: {
    title: string;
    message: string;
    target_type: "all" | "list";
    target_list_id?: number;
    image?: File | null;
  },
  token: string,
): Promise<Broadcast> {
  const fd = new FormData();
  fd.append("title", data.title);
  fd.append("message", data.message);
  fd.append("target_type", data.target_type);
  if (data.target_list_id != null) fd.append("target_list_id", String(data.target_list_id));
  if (data.image) fd.append("image", data.image);
  const res = await cfetch(`${BASE}/admin/broadcasts`, {
    method: "POST",
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteBroadcast(id: number, token: string) {
  const res = await cfetch(`${BASE}/admin/broadcasts/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMyBroadcasts(token: string): Promise<Broadcast[]> {
  const res = await cfetch(`${BASE}/broadcasts/my`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getUnreadBroadcastCount(token: string): Promise<{ count: number }> {
  const res = await cfetch(`${BASE}/broadcasts/unread-count`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function markBroadcastRead(id: number, token: string) {
  const res = await cfetch(`${BASE}/broadcasts/${id}/read`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function markAllBroadcastsRead(token: string) {
  const res = await cfetch(`${BASE}/broadcasts/read-all`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Event registrations ─────────────────────────────────────────────────────

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id: number;
  name: string;
  email?: string | null;
  mobile?: string | null;
  field_values: Record<string, string>;
  status: "pending_payment" | "confirmed" | "cancelled" | "attended" | "waitlist";
  payment_status: "pending" | "paid" | "refunded" | "n/a";
  payment_gateway?: string | null;
  payment_reference?: string | null;
  fee_amount: number;
  /** Snapshot of the selected tier at registration time. Renaming a tier
   *  later doesn't rewrite this — admin views read it directly. */
  tier_id?: string | null;
  tier_name?: string | null;
  created_at: string;
}

export interface RazorpayOrderInfo {
  key_id: string;
  order_id: string;
  amount: number;       // paise
  currency: string;
  receipt: string;
}

export interface EventRegistrationInitResult {
  registration_id: number;
  status: string;
  gateway?: string | null;
  requires_payment_action: boolean;
  redirect_url?: string | null;
  razorpay_order?: RazorpayOrderInfo | null;
}

export async function verifyRazorpayPayment(
  registrationId: number,
  payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  token: string,
): Promise<{ success: boolean; registration_id: number }> {
  const res = await cfetch(`${BASE}/events/registrations/${registrationId}/razorpay-verify`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export interface MyEventRegistration {
  registration: EventRegistration;
  event: {
    id: number;
    title: string;
    event_date: string;
    event_time?: string | null;
    location?: string | null;
    image_url?: string | null;
  };
}

export interface TierAvailability {
  id: string;
  max_attendees: number | null;
  registered: number;
  spots_remaining: number | null;
  is_full: boolean;
}

export interface EventAvailability {
  max_attendees: number | null;
  registered: number;
  spots_remaining: number | null;
  is_full: boolean;
  tiers: TierAvailability[];
}

export async function getEventAvailability(eventId: number): Promise<EventAvailability> {
  const res = await cfetch(`${BASE}/events/${eventId}/availability`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function registerForEvent(
  eventId: number,
  fieldValues: Record<string, string>,
  token: string,
  tierId?: string | null,
): Promise<EventRegistrationInitResult> {
  const res = await cfetch(`${BASE}/events/${eventId}/register`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      field_values: fieldValues,
      ...(tierId ? { tier_id: tierId } : {}),
    }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMyEventRegistration(eventId: number, token: string): Promise<EventRegistration | null> {
  const res = await cfetch(`${BASE}/events/${eventId}/registration`, { headers: authHeaders(token) });
  if (!res.ok) {
    if (res.status === 401) return null;
    throw await res.json();
  }
  const body = await res.json();
  return body || null;
}

export async function getMyEventRegistrations(token: string): Promise<MyEventRegistration[]> {
  const res = await cfetch(`${BASE}/me/event-registrations`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function checkEventPaymentStatus(
  txn: string,
  token: string,
): Promise<{ success: boolean; state: string; registration_id: number }> {
  const res = await cfetch(
    `${BASE}/events/registrations/payment-status?txn=${encodeURIComponent(txn)}`,
    { headers: authHeaders(token) },
  );
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminListEventRegistrations(
  eventId: number,
  token: string,
): Promise<EventRegistration[]> {
  const res = await cfetch(`${BASE}/admin/events/${eventId}/registrations`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminConfirmManualRegistration(regId: number, token: string) {
  const res = await cfetch(`${BASE}/admin/event-registrations/${regId}/confirm-manual`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCancelRegistration(regId: number, token: string) {
  const res = await cfetch(`${BASE}/admin/event-registrations/${regId}/cancel`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminMarkRegistrationAttended(regId: number, token: string) {
  const res = await cfetch(`${BASE}/admin/event-registrations/${regId}/attended`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminPromoteFromWaitlist(regId: number, token: string) {
  const res = await cfetch(`${BASE}/admin/event-registrations/${regId}/promote-waitlist`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Payment gateway secrets (super admin only) ────────────────────────────
// These are just namespaced site_settings keys — reuse the existing
// admin-settings GET/PUT instead of dedicated endpoints. Helpers exist for
// readability in the UI.

export const PAYMENT_GATEWAY_KEYS = [
  "payment.phonepe.client_id",
  "payment.phonepe.client_secret",
  "payment.phonepe.client_version",
  "payment.phonepe.env",
  "payment.phonepe.callback_username",
  "payment.phonepe.callback_password",
  "payment.razorpay.key_id",
  "payment.razorpay.key_secret",
  "payment.gpay.merchant_id",
  "payment.gpay.api_key",
] as const;

export async function adminGetPaymentGatewaySecrets(
  token: string,
): Promise<Record<string, string>> {
  const res = await cfetch(`${BASE}/admin/payment-gateways`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdatePaymentGatewaySecrets(
  values: Record<string, string>,
  token: string,
) {
  const res = await cfetch(`${BASE}/admin/payment-gateways`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Session helpers ───────────────────────────────────────────────────────────
// Authentication has two parallel paths:
//   1. httpOnly auth cookie (preferred — XSS can't read it). Works in
//      same-origin and same-site deployments.
//   2. Bearer token in localStorage. Required when the frontend and backend
//      live on different registrable domains (e.g. *.onrender.com subdomains)
//      because browsers' third-party cookie blocking prevents the cookie from
//      flowing. The token is sent via Authorization header.
//
// Both are accepted server-side. For the strongest XSS posture, deploy
// frontend and backend on the same registrable domain so the cookie alone
// suffices and the localStorage token can be removed.
//
// All of these are SSR-safe — `window`/`localStorage` don't exist when Next.js
// prerenders pages on the build server, so every read is guarded. Writes
// no-op on the server (callers only invoke them from event handlers anyway).

const isBrowser = (): boolean => typeof window !== "undefined";

export function saveToken(token: string, role: string, name: string, permissions: readonly string[] = []) {
  if (!isBrowser()) return;
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("name", name);
  localStorage.setItem("permissions", JSON.stringify(Array.isArray(permissions) ? permissions : []));
}

export function clearToken() {
  if (!isBrowser()) return;
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  localStorage.removeItem("permissions");
  // Tell the backend to clear the httpOnly session cookie (fire-and-forget).
  cfetch(`${BASE}/auth/logout`, { method: "POST" }).catch(() => {});
}

export function getToken(): string {
  if (!isBrowser()) return "";
  return localStorage.getItem("token") || "";
}

export function getRole(): string {
  if (!isBrowser()) return "";
  return localStorage.getItem("role") || "";
}

export function isSuperAdmin(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem("role") === "admin";
}

export function isModerator(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem("role") === "moderator";
}
