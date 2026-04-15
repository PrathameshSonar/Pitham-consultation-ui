import dayjs from "dayjs";

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
