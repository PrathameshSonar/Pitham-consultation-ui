/** Backend API base URL — set via NEXT_PUBLIC_API_URL env var */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/** Build a full URL for a backend file path (uploads, receipts, etc.) */
export function fileUrl(path: string): string {
  if (!path) return "";
  return `${API_BASE}/${path.replace(/\\/g, "/")}`;
}

/** Authorization header helper */
export function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
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
