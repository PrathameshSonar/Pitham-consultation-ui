export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const BASE = API_BASE;

/** Build a full URL for a backend file path (uploads, receipts, etc.) */
export function fileUrl(path: string): string {
  if (!path) return "";
  return `${API_BASE}/${path.replace(/\\/g, "/")}`;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function registerUser(data: Record<string, string>) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function loginUser(data: { email?: string; mobile?: string; password: string }) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { token, role, name }
}

export async function forgotPassword(data: { email?: string; mobile?: string }) {
  const res = await fetch(`${BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function resetPassword(data: { token: string; new_password: string }) {
  const res = await fetch(`${BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function googleLogin(credential: string) {
  const res = await fetch(`${BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { token, role, name }
}

export async function getProfile(token: string) {
  const res = await fetch(`${BASE}/auth/profile`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Appointments ──────────────────────────────────────────────────────────────

export async function bookAppointment(formData: FormData, token: string) {
  const res = await fetch(`${BASE}/appointments`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMyAppointments(token: string) {
  const res = await fetch(`${BASE}/appointments/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function cancelAppointment(id: number, token: string) {
  const res = await fetch(`${BASE}/appointments/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function generateReceipt(id: number, token: string) {
  const res = await fetch(`${BASE}/appointments/${id}/generate-receipt`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin: Appointments ───────────────────────────────────────────────────────

export async function adminGetAppointments(token: string) {
  const res = await fetch(`${BASE}/admin/appointments`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminVerifyPayment(
  id: number,
  payment_reference: string,
  token: string
) {
  const res = await fetch(`${BASE}/admin/appointments/${id}/verify-payment`, {
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
  token: string
) {
  const res = await fetch(`${BASE}/admin/appointments/${id}/assign-slot`, {
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
  token: string
) {
  const res = await fetch(`${BASE}/admin/appointments/${id}/reschedule`, {
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
  token: string
) {
  const fd = new FormData();
  fd.append("analysis_notes", data.analysis_notes || "");
  fd.append("recording_link", data.recording_link || "");
  fd.append("gallery_doc_ids", JSON.stringify(data.gallery_doc_ids || []));
  if (data.analysis_file) fd.append("analysis_file", data.analysis_file);
  const res = await fetch(`${BASE}/admin/appointments/${id}/complete`, {
    method: "POST",
    headers: authHeaders(token),
    body: fd,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function generateInvoice(id: number, token: string) {
  const res = await fetch(`${BASE}/appointments/${id}/generate-invoice`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDownloadInvoicesZip(dateFrom: string, dateTo: string, token: string) {
  const res = await fetch(
    `${BASE}/admin/invoices/download?date_from=${dateFrom}&date_to=${dateTo}`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) {
    const err = await res.json();
    throw err;
  }
  return res.blob();
}

export async function adminCancelAppointment(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/appointments/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function updateNotificationPrefs(data: { notify_email?: boolean; notify_sms?: boolean }, token: string) {
  const res = await fetch(`${BASE}/auth/profile/notifications`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function sendVerificationEmail(token: string) {
  const res = await fetch(`${BASE}/auth/send-verification`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGenerateInvoice(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/appointments/${id}/generate-invoice`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { message, invoice_path }
}

export async function adminGenerateReceipt(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/appointments/${id}/generate-receipt`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCreateZoomMeeting(
  data: { topic: string; scheduled_date: string; scheduled_time: string; duration?: number },
  token: string
) {
  const res = await fetch(`${BASE}/admin/zoom/create-meeting`, {
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
  params?: { search?: string; city?: string; state?: string; country?: string }
) {
  const q = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params || {}).filter(([, v]) => v)
    ) as Record<string, string>
  ).toString();
  const res = await fetch(`${BASE}/admin/users${q ? `?${q}` : ""}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetUser(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/users/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetUserAppointments(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/users/${id}/appointments`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Documents ─────────────────────────────────────────────────────────────────

export async function getMyDocuments(token: string) {
  const res = await fetch(`${BASE}/documents/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUploadDocument(formData: FormData, token: string) {
  const res = await fetch(`${BASE}/admin/documents`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetDocuments(token: string) {
  const res = await fetch(`${BASE}/admin/documents`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin Documents: Gallery (reusable templates) ────────────────────────────

export async function adminUploadGalleryDocument(formData: FormData, token: string) {
  const res = await fetch(`${BASE}/admin/documents/gallery`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetGallery(token: string) {
  const res = await fetch(`${BASE}/admin/documents/gallery`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteGalleryDocument(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/documents/gallery/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminAssignFromGallery(
  data: { gallery_doc_id: number; user_id: number },
  token: string
) {
  const res = await fetch(`${BASE}/admin/documents/assign-from-gallery`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteAssignedDocument(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetUserDocuments(userId: number, token: string) {
  const res = await fetch(`${BASE}/admin/users/${userId}/documents`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminBulkAssignFromGallery(
  data: { gallery_doc_id: number; user_ids: number[]; batch_label?: string },
  token: string
) {
  const res = await fetch(`${BASE}/admin/documents/bulk-assign-gallery`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { assigned_count, skipped }
}

export async function adminBulkUploadDocument(formData: FormData, token: string) {
  // formData: user_ids (JSON array string), title, description, file
  const res = await fetch(`${BASE}/admin/documents/bulk-upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin: User Lists ────────────────────────────────────────────────────────

export async function adminGetUserLists(token: string) {
  const res = await fetch(`${BASE}/admin/user-lists`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminCreateUserList(
  data: { name: string; description?: string; user_ids: number[] },
  token: string
) {
  const res = await fetch(`${BASE}/admin/user-lists`, {
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
  token: string
) {
  const res = await fetch(`${BASE}/admin/user-lists/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateUserListMembers(
  id: number,
  user_ids: number[],
  token: string
) {
  const res = await fetch(`${BASE}/admin/user-lists/${id}/members`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ user_ids }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteUserList(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/user-lists/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function submitQuery(
  data: { subject: string; message: string },
  token: string
) {
  const res = await fetch(`${BASE}/queries`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getMyQueries(token: string) {
  const res = await fetch(`${BASE}/queries/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetQueries(token: string) {
  const res = await fetch(`${BASE}/admin/queries`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminReplyQuery(
  id: number,
  reply: string,
  token: string
) {
  const res = await fetch(`${BASE}/admin/queries/${id}/reply`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Recordings ────────────────────────────────────────────────────────────────

export async function getMyRecordings(token: string) {
  const res = await fetch(`${BASE}/recordings/my`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminAddRecording(formData: FormData, token: string) {
  const res = await fetch(`${BASE}/admin/recordings`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetRecordings(token: string) {
  const res = await fetch(`${BASE}/admin/recordings`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminBulkAssignRecording(
  data: { title: string; recording_url: string; user_ids?: number[]; list_ids?: number[] },
  token: string
) {
  const res = await fetch(`${BASE}/admin/recordings/bulk-assign`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminDeleteRecording(id: number, token: string) {
  const res = await fetch(`${BASE}/admin/recordings/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(data: Record<string, string>, token: string) {
  const res = await fetch(`${BASE}/auth/profile`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getPublicSettings() {
  const res = await fetch(`${BASE}/settings/public`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetSettings(token: string) {
  const res = await fetch(`${BASE}/admin/settings`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminUpdateSettings(data: Record<string, any>, token: string) {
  const res = await fetch(`${BASE}/admin/settings`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function adminGetAnalytics(token: string) {
  const res = await fetch(`${BASE}/admin/analytics`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Role Management ──────────────────────────────────────────────────────────

export async function adminChangeUserRole(userId: number, role: string, token: string) {
  const res = await fetch(`${BASE}/admin/users/${userId}/role`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGetPendingSettings(token: string) {
  const res = await fetch(`${BASE}/admin/settings/pending`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminApproveSettingChange(changeId: number, token: string) {
  const res = await fetch(`${BASE}/admin/settings/pending/${changeId}/approve`, {
    method: "POST", headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminRejectSettingChange(changeId: number, token: string) {
  const res = await fetch(`${BASE}/admin/settings/pending/${changeId}/reject`, {
    method: "POST", headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

// ── Admin Tools ──────────────────────────────────────────────────────────────

export async function adminGetAuditLog(
  token: string,
  params: {
    page?: number; limit?: number; action?: string; admin_id?: number;
    entity_type?: string; date_from?: string; date_to?: string; sort?: string;
  } = {}
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
  const res = await fetch(`${BASE}/admin/audit-log?${p}`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminGlobalSearch(query: string, token: string) {
  const res = await fetch(`${BASE}/admin/search?q=${encodeURIComponent(query)}`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function adminExportUsers(token: string) {
  const res = await fetch(`${BASE}/admin/export/users`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.blob();
}

export async function adminExportAppointments(token: string, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${BASE}/admin/export/appointments?${params}`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.blob();
}

export async function adminExportPayments(token: string, dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  const res = await fetch(`${BASE}/admin/export/payments?${params}`, { headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.blob();
}

export async function adminSendReminders(token: string) {
  const res = await fetch(`${BASE}/admin/send-reminders`, { method: "POST", headers: authHeaders(token) });
  if (!res.ok) throw await res.json();
  return res.json();
}

export function downloadCalendarIcs(apptId: number, token: string) {
  window.open(`${BASE}/appointments/${apptId}/calendar?token=${token}`, "_blank");
}

// ── Payments ─────────────────────────────────────────────────────────────────

export async function initiatePhonePePayment(
  data: { appointment_id: number; amount: number },
  token: string
) {
  const res = await fetch(`${BASE}/payments/phonepe/initiate`, {
    method: "POST",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { redirect_url, transaction_id }
}

export async function checkPhonePeStatus(transactionId: string, token: string) {
  const res = await fetch(`${BASE}/payments/phonepe/status/${transactionId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw await res.json();
  return res.json(); // { success, state, transaction_id }
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export function saveToken(token: string, role: string, name: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
  localStorage.setItem("name", name);
  document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 3600}`;
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
  document.cookie = "token=; path=/; max-age=0";
}

export function getToken(): string {
  return localStorage.getItem("token") || "";
}

export function getRole(): string {
  return localStorage.getItem("role") || "";
}

export function isSuperAdmin(): boolean {
  return localStorage.getItem("role") === "admin";
}

export function isModerator(): boolean {
  return localStorage.getItem("role") === "moderator";
}
