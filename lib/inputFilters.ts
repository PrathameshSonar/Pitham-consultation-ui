/**
 * Input filters for form fields.
 *
 * Use on `onChange` to strip disallowed characters as the user types.
 * Server-side validation in backend/routers/auth.py is the security boundary;
 * these helpers exist for UX so users can't accidentally type a phone number
 * into the "name" field.
 */

/** Letters (any script — supports Devanagari for Hindi/Marathi names),
 *  spaces, hyphens, apostrophes, dots. Used for: name, birth place, city,
 *  state, country. Strips digits and most punctuation as you type. */
export function lettersOnly(value: string): string {
  return (value || "").replace(/[^\p{L}\p{M}\s.'-]/gu, "");
}
