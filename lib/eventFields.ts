/**
 * Event registration form catalog — mirror of `backend/utils/event_fields.py`.
 *
 * Adding a new collectable field is a one-line change in both files. The
 * order here is the canonical order the public registration form renders;
 * the saved JSON's natural ordering is irrelevant.
 *
 * `prefillFromProfile` lets the public form pre-populate the field from
 * the logged-in user's profile when they first land on the form, so they
 * don't have to retype known data.
 */

import type { EventRegistrationConfig } from "@/services/api";

export interface EventField {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "date" | "time" | "textarea";
  prefillFromProfile?:
    | "name"
    | "email"
    | "mobile"
    | "dob"
    | "tob"
    | "birth_place"
    | "city";
}

export const EVENT_FIELD_CATALOG: readonly EventField[] = [
  { key: "name",              label: "Full name",                       type: "text",     prefillFromProfile: "name" },
  { key: "email",             label: "Email",                           type: "email",    prefillFromProfile: "email" },
  { key: "mobile",            label: "Mobile",                          type: "tel",      prefillFromProfile: "mobile" },
  { key: "dob",               label: "Date of birth",                   type: "date",     prefillFromProfile: "dob" },
  { key: "tob",               label: "Time of birth",                   type: "time",     prefillFromProfile: "tob" },
  { key: "birth_place",       label: "Birth place",                     type: "text",     prefillFromProfile: "birth_place" },
  { key: "address",           label: "Address",                         type: "textarea" },
  { key: "city",              label: "City",                            type: "text",     prefillFromProfile: "city" },
  { key: "problem_statement", label: "What would you like to discuss?", type: "textarea" },
  { key: "emergency_contact", label: "Emergency contact",               type: "text" },
] as const;

export const GATEWAY_OPTIONS = [
  { key: "free",     label: "Free (no payment)",       implemented: true  },
  { key: "manual",   label: "Manual (admin verifies)", implemented: true  },
  { key: "phonepe",  label: "PhonePe",                 implemented: true  },
  { key: "razorpay", label: "Razorpay",                implemented: true  },
  { key: "gpay",     label: "Google Pay (coming soon)", implemented: false },
] as const;

/** Build a registration_config with everything off — used as the seed when
 *  the admin opens the dialog on an event that has never been configured. */
export function emptyRegistrationConfig(): EventRegistrationConfig {
  const fields: Record<string, { enabled: boolean; required: boolean }> = {};
  for (const f of EVENT_FIELD_CATALOG) {
    fields[f.key] = { enabled: false, required: false };
  }
  return {
    enabled: false,
    fee: 0,
    gateway: "free",
    fields,
    max_attendees: null,
    deadline: null,
    confirmation_message: "",
    waitlist_enabled: false,
    tiers: [],
  };
}

/** Stable client-side id for newly-created tier rows — backend tolerates and
 *  preserves whatever string we send. Format is human-recognisable so it
 *  shows up readable in audit logs. */
export function newTierId(): string {
  return `tier_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Hydrate whatever the backend returned (which may have missing keys) into
 *  a fully-populated config the form can edit safely. */
export function hydrateRegistrationConfig(
  partial: Partial<EventRegistrationConfig> | undefined | null,
): EventRegistrationConfig {
  const base = emptyRegistrationConfig();
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    fields: {
      ...base.fields,
      ...(partial.fields || {}),
    },
  };
}
