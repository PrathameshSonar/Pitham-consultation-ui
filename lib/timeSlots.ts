import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const PITHAM_TZ = "Asia/Kolkata";

/**
 * Fixed 30-minute time slots for appointment scheduling.
 * Range: 09:00 AM to 07:30 PM
 */
export const TIME_SLOTS: { value: string; label: string }[] = (() => {
  const slots: { value: string; label: string }[] = [];
  // 9:00 (09:00) to 19:30 (7:30 PM)
  for (let h = 9; h <= 19; h++) {
    for (const m of [0, 30]) {
      // Stop after 19:30
      if (h === 19 && m > 30) break;
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const label = dayjs().hour(h).minute(m).format("hh:mm A");
      slots.push({ value, label });
    }
  }
  return slots;
})();

/** Convert a 24-h "HH:mm" string to a 12-h "hh:mm A" display. */
export function formatTime12h(value24: string | null | undefined): string {
  if (!value24) return "";
  const [h, m] = value24.split(":").map(Number);
  return dayjs().hour(h).minute(m).format("hh:mm A");
}

/**
 * Format a stored appointment date+time (IST) for display, appending the user's
 * local equivalent if their browser time zone differs from IST. Result examples:
 *   "10 Jun 2026, 03:30 PM IST"                                    (IST user)
 *   "10 Jun 2026, 03:30 PM IST · 10:00 AM CET (your time)"          (CET user)
 */
export function formatAppointmentDateTime(
  date: string | null | undefined,
  time: string | null | undefined,
): string {
  if (!date || !time) return "";
  const [h, m] = time.split(":").map(Number);
  // Build the appointment moment in IST
  const ist = dayjs.tz(`${date} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, "YYYY-MM-DD HH:mm", PITHAM_TZ);
  const istLabel = `${ist.format("DD MMM YYYY, hh:mm A")} IST`;

  let userTz = PITHAM_TZ;
  try {
    userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || PITHAM_TZ;
  } catch {
    userTz = PITHAM_TZ;
  }
  if (userTz === PITHAM_TZ) return istLabel;

  const local = ist.tz(userTz);
  const tzAbbrev = local.format("z") || userTz;
  return `${istLabel} · ${local.format("hh:mm A")} ${tzAbbrev} (your time)`;
}
