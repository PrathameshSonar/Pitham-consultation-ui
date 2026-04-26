// Mirrors backend/utils/password_policy.py. Server is the security boundary;
// this exists so users see the rule fail before the network round-trip.

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_HELPER_TEXT =
  "10+ characters with at least 3 of: lowercase, uppercase, digit, symbol.";

const BLOCKLIST = new Set(
  [
    "password",
    "password1",
    "passw0rd",
    "qwerty1234",
    "iloveyou1",
    "12345678910",
    "abc1234567",
    "admin12345",
    "welcome123",
    "letmein123",
    "Password1",
    "Password123",
    "Pa$$w0rd",
    "P@ssw0rd",
  ].map((s) => s.toLowerCase()),
);

// Returns null if OK, else the user-facing error message.
export function checkPassword(pw: string): string | null {
  if (!pw) return "Password is required";
  if (pw.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (pw.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`;
  }
  let classes = 0;
  if (/[a-z]/.test(pw)) classes++;
  if (/[A-Z]/.test(pw)) classes++;
  if (/\d/.test(pw)) classes++;
  if (/[^A-Za-z0-9]/.test(pw)) classes++;
  if (classes < 3) {
    return "Password must include at least 3 of: lowercase, uppercase, digit, symbol";
  }
  if (new Set(pw).size <= 2) return "Password is too repetitive";
  if (BLOCKLIST.has(pw.toLowerCase())) {
    return "Password is too common — please choose a stronger one";
  }
  return null;
}
