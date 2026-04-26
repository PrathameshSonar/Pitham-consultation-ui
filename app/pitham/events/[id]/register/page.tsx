"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import Script from "next/script";
import {
  getPublicEvent,
  getProfile,
  getMyEventRegistration,
  getEventAvailability,
  registerForEvent,
  verifyRazorpayPayment,
  getToken,
  type EventItem,
  type EventAvailability,
  type EventRegistrationConfig,
  type EventRegistrationInitResult,
  type RazorpayOrderInfo,
} from "@/services/api";
import { EVENT_FIELD_CATALOG, hydrateRegistrationConfig } from "@/lib/eventFields";
import { useT } from "@/i18n/I18nProvider";
import type { MessageKey } from "@/i18n/messages";

// Field-key → translation key map. Translated label takes priority over the
// catalog's English fallback so the public form respects the active language.
const FIELD_LABEL_KEY: Record<string, MessageKey> = {
  name:              "events.field.name",
  email:             "events.field.email",
  mobile:            "events.field.mobile",
  dob:               "events.field.dob",
  tob:               "events.field.tob",
  birth_place:       "events.field.birth_place",
  address:           "events.field.address",
  city:              "events.field.city",
  problem_statement: "events.field.problem_statement",
  emergency_contact: "events.field.emergency_contact",
};

export default function EventRegisterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useT();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [config, setConfig] = useState<EventRegistrationConfig | null>(null);
  const [availability, setAvailability] = useState<EventAvailability | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  // null = no tier picked yet. Required-but-blank surfaces an inline error
  // when admin configured tiers; ignored otherwise (single-fee mode).
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  const eventId = useMemo(() => Number(params?.id), [params?.id]);

  // Load event + check existing registration + prefill from profile in
  // parallel. If the user isn't logged in, kick them to /login with a return
  // path so they come back here after auth.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(`/pitham/events/${eventId}/register`)}`);
      return;
    }
    if (!eventId || Number.isNaN(eventId)) {
      setError(t("events.reg.invalidId"));
      setLoading(false);
      return;
    }

    Promise.all([
      getPublicEvent(eventId).catch(() => null),
      getMyEventRegistration(eventId, token).catch(() => null),
      getProfile(token).catch(() => null),
      getEventAvailability(eventId).catch(() => null),
    ])
      .then(([ev, existing, profile, avail]) => {
        if (!ev) {
          setError(t("events.reg.notFound"));
          return;
        }
        const cfg = hydrateRegistrationConfig(ev.registration_config);
        setEvent(ev);
        setConfig(cfg);
        setAvailability(avail);

        if (existing) {
          setAlreadyRegistered(true);
          return;
        }

        // Prefill enabled fields from the user's profile where the catalog
        // marks the field as profile-derived. Saves the user typing data we
        // already know.
        const seed: Record<string, string> = {};
        for (const f of EVENT_FIELD_CATALOG) {
          if (!cfg.fields[f.key]?.enabled) continue;
          if (f.prefillFromProfile && profile && (profile as any)[f.prefillFromProfile]) {
            seed[f.key] = String((profile as any)[f.prefillFromProfile]);
          }
        }
        setValues(seed);

        // Pre-select the first non-full tier if there are tiers — saves a
        // click for events with a single option that just happens to be
        // modelled as a tier.
        if (cfg.tiers.length > 0 && avail) {
          const firstAvailable = cfg.tiers.find(
            (t) => !avail.tiers.find((a) => a.id === t.id)?.is_full,
          );
          if (firstAvailable) setSelectedTierId(firstAvailable.id);
        }
      })
      .finally(() => setLoading(false));
  }, [eventId, router]);

  function setValue(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.BaseSyntheticEvent) {
    e.preventDefault();
    if (!config) return;
    const token = getToken();
    if (!token) return;

    // Client-side required check — mirrors the server, gives instant feedback.
    for (const f of EVENT_FIELD_CATALOG) {
      const cell = config.fields[f.key];
      if (cell?.enabled && cell.required && !(values[f.key] || "").trim()) {
        const label = FIELD_LABEL_KEY[f.key] ? t(FIELD_LABEL_KEY[f.key]) : f.label;
        setError(t("events.reg.fieldRequired", { field: label }));
        return;
      }
    }

    // Tier required when configured.
    if (config.tiers.length > 0 && !selectedTierId) {
      setError(t("events.reg.pickOption"));
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const result = await registerForEvent(eventId, values, token, selectedTierId);

      // PhonePe → hosted-checkout redirect, comes back to /dashboard/events/payment-status
      if (result.gateway === "phonepe" && result.redirect_url) {
        window.location.href = result.redirect_url;
        return;
      }

      // Razorpay → open the inline checkout popup; verify on success.
      if (result.gateway === "razorpay" && result.razorpay_order) {
        await openRazorpayCheckout(result, token, event?.title || "Event registration");
        // openRazorpayCheckout either router.push'es on success or rethrows
        // an "abandoned"-style error which we surface below.
        return;
      }

      // Manual gateway requires admin verification — drop to My Events with
      // a banner so the user knows what's happening.
      // Free / instant: same — registration is already confirmed server-side.
      router.push(`/dashboard/events?registered=${result.registration_id}`);
    } catch (err: any) {
      setError(err?.detail || err?.message || t("events.reg.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  /** Open Razorpay's checkout popup, verify the payment server-side after
   *  the user pays, and navigate to My Events on success. Razorpay's
   *  checkout JS is loaded via the <Script> tag below; if it isn't ready
   *  yet (slow network), this throws and the caller surfaces the error. */
  async function openRazorpayCheckout(
    result: EventRegistrationInitResult,
    token: string,
    eventTitle: string,
  ): Promise<void> {
    const order = result.razorpay_order as RazorpayOrderInfo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const RazorpayCtor = (window as any).Razorpay;
    if (typeof RazorpayCtor !== "function") {
      throw new Error("Razorpay checkout failed to load. Refresh and try again.");
    }

    return new Promise<void>((resolve, reject) => {
      const rzp = new RazorpayCtor({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "SPBSP, Ahilyanagar",
        description: eventTitle,
        prefill: {
          name: values.name || "",
          email: values.email || "",
          contact: values.mobile || "",
        },
        theme: { color: "#7B1E1E" },
        handler: async (rsp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyRazorpayPayment(result.registration_id, rsp, token);
            router.push(`/dashboard/events?registered=${result.registration_id}`);
            resolve();
          } catch (err: any) {
            reject(new Error(err?.detail || "Payment verification failed."));
          }
        },
        modal: {
          ondismiss: () => {
            // User closed the popup without paying — keep the registration in
            // pending_payment so they can retry from My Events. Throwing
            // here surfaces an inline message; we don't navigate away.
            reject(new Error("Payment cancelled. You can retry from My Events."));
          },
        },
      });
      rzp.on("payment.failed", (resp: { error?: { description?: string } }) => {
        reject(new Error(resp?.error?.description || "Payment failed. Please try again."));
      });
      rzp.open();
    });
  }

  if (loading) {
    return (
      <Box className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !event) {
    return (
      <Box className="min-h-[calc(100vh-64px)] py-16 px-4 flex items-center justify-center">
        <Paper
          elevation={0}
          className="!p-8 !rounded-3xl !max-w-[480px] !text-center !border !border-brand-sand"
        >
          <Alert severity="warning" className="!mb-6">
            {error}
          </Alert>
          <Button component={Link} href="/pitham" startIcon={<ArrowBackIcon />} variant="outlined">
            {t("events.btn.backToEvent")}
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!event || !config) return null;

  if (!config.enabled) {
    return (
      <Box className="min-h-[calc(100vh-64px)] py-16 px-4 flex items-center justify-center">
        <Paper
          elevation={0}
          className="!p-8 !rounded-3xl !max-w-[480px] !text-center !border !border-brand-sand"
        >
          <Alert severity="info" className="!mb-6">
            {t("events.reg.notAvailable")}
          </Alert>
          <Button
            component={Link}
            href={`/pitham/events/${eventId}`}
            startIcon={<ArrowBackIcon />}
            variant="outlined"
          >
            {t("events.btn.backToEvent")}
          </Button>
        </Paper>
      </Box>
    );
  }

  if (alreadyRegistered) {
    return (
      <Box className="min-h-[calc(100vh-64px)] py-16 px-4 flex items-center justify-center">
        <Paper
          elevation={0}
          className="!p-8 !rounded-3xl !max-w-[480px] !text-center !border !border-brand-sand"
        >
          <Typography variant="h5" className="!font-bold !text-brand-maroon !mb-2">
            {t("events.reg.alreadyTitle")}
          </Typography>
          <Typography color="text.secondary" className="!mb-6">
            {t("events.reg.alreadyDesc")}
          </Typography>
          <Box className="flex gap-3 flex-wrap justify-center">
            <Button component={Link} href="/dashboard/events" variant="contained">
              {t("events.btn.myEvents")}
            </Button>
            <Button
              component={Link}
              href={`/pitham/events/${eventId}`}
              variant="outlined"
              startIcon={<ArrowBackIcon />}
            >
              {t("events.btn.backToEvent")}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Catalog-ordered enabled fields — order is locked by EVENT_FIELD_CATALOG.
  const visibleFields = EVENT_FIELD_CATALOG.filter((f) => config.fields[f.key]?.enabled);

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4">
      {/* Razorpay's checkout JS is only needed when this event uses Razorpay,
          but loading it lazily inside the click handler causes flicker. The
          script self-resolves after first load. */}
      {config.gateway === "razorpay" && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      )}
      <Box className="max-w-[640px] mx-auto">
        <Button
          component={Link}
          href={`/pitham/events/${eventId}`}
          startIcon={<ArrowBackIcon />}
          className="!text-brand-maroon !font-semibold !mb-4"
        >
          {t("events.btn.backToEvent")}
        </Button>

        <Paper elevation={0} className="!p-6 md:!p-10 !rounded-3xl !border !border-brand-sand">
          <Typography
            variant="h4"
            className="!font-bold !text-brand-maroon !mb-1"
          >
            {t("events.reg.title")}
          </Typography>
          <Typography variant="h6" className="!text-brand-text-medium !mb-2">
            {event.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" className="!mb-6">
            {event.event_date}
            {event.event_time ? ` · ${event.event_time}` : ""}
            {event.location ? ` · ${event.location}` : ""}
          </Typography>

          {error && (
            <Alert severity="error" className="!mb-4">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* ── Tier picker (optional) ─────────────────────────────────
                When the admin configured registration options, render them
                as radio cards before the form fields. Cards show the fee +
                per-tier capacity status; sold-out tiers are disabled. */}
            {config.tiers.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" className="!font-semibold !uppercase !tracking-wider !block !mb-2">
                  {t("events.reg.option")} *
                </Typography>
                <Box className="flex flex-col gap-2">
                  {config.tiers.map((tier) => {
                    const tierAvail = availability?.tiers.find((a) => a.id === tier.id);
                    const tierFull = tierAvail?.is_full ?? false;
                    const spotsLeft = tierAvail?.spots_remaining ?? null;
                    const isSelected = selectedTierId === tier.id;
                    const disabled = tierFull && !config.waitlist_enabled;
                    return (
                      <label
                        key={tier.id}
                        className={[
                          "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                          disabled
                            ? "border-brand-sand bg-brand-cream/50 opacity-60 cursor-not-allowed"
                            : isSelected
                              ? "border-brand-saffron bg-brand-saffron/5 cursor-pointer"
                              : "border-brand-sand bg-white hover:border-brand-saffron-light cursor-pointer",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="tier"
                          value={tier.id}
                          checked={isSelected}
                          disabled={disabled}
                          onChange={() => setSelectedTierId(tier.id)}
                          className="mt-1 accent-brand-saffron"
                        />
                        <Box className="flex-1 min-w-0">
                          <Box className="flex items-baseline justify-between gap-2 flex-wrap">
                            <Typography className="!font-bold !text-brand-maroon">
                              {tier.name}
                            </Typography>
                            <Typography className="!font-bold !text-brand-saffron-dark">
                              {tier.fee > 0 ? `₹${tier.fee.toLocaleString("en-IN")}` : t("events.reg.free")}
                            </Typography>
                          </Box>
                          {tier.description && (
                            <Typography variant="body2" color="text.secondary" className="!mt-1">
                              {tier.description}
                            </Typography>
                          )}
                          {tierFull ? (
                            <Typography variant="caption" className="!block !mt-2 !font-semibold !text-brand-error">
                              {config.waitlist_enabled
                                ? t("events.reg.tierWaitlist")
                                : t("events.reg.tierSoldOut")}
                            </Typography>
                          ) : spotsLeft !== null && spotsLeft <= 5 ? (
                            <Typography variant="caption" className="!block !mt-2 !font-semibold !text-brand-warning">
                              {t(spotsLeft === 1 ? "events.reg.spotLeft" : "events.reg.spotsLeft", { count: spotsLeft })}
                            </Typography>
                          ) : tierAvail?.max_attendees ? (
                            <Typography variant="caption" color="text.secondary" className="!block !mt-2">
                              {t("events.reg.registeredOf", { registered: tierAvail.registered, max: tierAvail.max_attendees })}
                            </Typography>
                          ) : null}
                        </Box>
                      </label>
                    );
                  })}
                </Box>
              </Box>
            )}

            {visibleFields.map((f) => {
              const required = !!config.fields[f.key]?.required;
              const labelKey = FIELD_LABEL_KEY[f.key];
              const translatedLabel = labelKey ? t(labelKey) : f.label;
              const common = {
                key: f.key,
                label: translatedLabel + (required ? " *" : ""),
                fullWidth: true,
                required,
                value: values[f.key] || "",
                onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                  setValue(f.key, e.target.value),
              };
              if (f.type === "textarea") {
                return <TextField {...common} multiline rows={3} />;
              }
              return <TextField {...common} type={f.type} />;
            })}

            {/* Fee summary — uses chosen tier's fee when applicable, else
                the single config.fee. The "submit" CTA below also adapts. */}
            {(() => {
              const chosenTier = config.tiers.find((t) => t.id === selectedTierId);
              const effectiveFee = chosenTier ? chosenTier.fee : config.fee;
              return (
                <Box className="rounded-2xl border border-brand-gold-light bg-brand-ivory p-4">
                  <Typography className="!font-bold !text-brand-gold !mb-1">
                    {effectiveFee > 0
                      ? `${t("events.reg.fee")}: ₹${effectiveFee.toLocaleString("en-IN")}${
                          chosenTier ? ` · ${chosenTier.name}` : ""
                        }`
                      : t("events.reg.noPayment")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {effectiveFee > 0
                      ? config.gateway === "manual"
                        ? t("events.reg.manualNote")
                        : t("events.reg.redirectNote")
                      : t("events.reg.submitNote")}
                  </Typography>
                </Box>
              );
            })()}

            <Box className="flex gap-3 flex-wrap">
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<HowToRegIcon />}
                disabled={submitting}
              >
                {(() => {
                  if (submitting) return t("events.btn.submitting");
                  const chosenTier = config.tiers.find((tt) => tt.id === selectedTierId);
                  const effectiveFee = chosenTier ? chosenTier.fee : config.fee;
                  return effectiveFee > 0 ? t("events.btn.payRegister") : t("events.btn.register");
                })()}
              </Button>
              <Button component={Link} href={`/pitham/events/${eventId}`} size="large" variant="outlined">
                {t("events.btn.cancel")}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
