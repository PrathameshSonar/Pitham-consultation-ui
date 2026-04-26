"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {
  getMyEventRegistrations,
  getToken,
  fileUrl,
  type MyEventRegistration,
} from "@/services/api";
import { useT } from "@/i18n/I18nProvider";

// Map status → (i18n key, color). Resolved at render time so language toggles
// take effect without remounting.
const STATUS_INFO: Record<
  string,
  { labelKey: "events.status.pending_payment" | "events.status.confirmed" | "events.status.attended" | "events.status.cancelled" | "events.status.waitlist"; color: "default" | "primary" | "success" | "warning" | "error" }
> = {
  pending_payment: { labelKey: "events.status.pending_payment", color: "warning" },
  confirmed:       { labelKey: "events.status.confirmed",        color: "success" },
  attended:        { labelKey: "events.status.attended",         color: "primary" },
  cancelled:       { labelKey: "events.status.cancelled",        color: "error"   },
  waitlist:        { labelKey: "events.status.waitlist",         color: "default" },
};

export default function MyEventsPage() {
  const { t } = useT();
  const params = useSearchParams();
  const justRegisteredId = params.get("registered");

  const [items, setItems] = useState<MyEventRegistration[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError(t("events.my.signInRequired"));
      setLoading(false);
      return;
    }
    getMyEventRegistrations(token)
      .then(setItems)
      .catch((e) => setError(e?.detail || t("events.my.loadFailed")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { upcoming, past } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const u: MyEventRegistration[] = [];
    const p: MyEventRegistration[] = [];
    for (const it of items ?? []) {
      if (it.event.event_date >= today && it.registration.status !== "cancelled") {
        u.push(it);
      } else {
        p.push(it);
      }
    }
    return { upcoming: u, past: p };
  }, [items]);

  return (
    <Box className="min-h-[calc(100vh-64px)] bg-brand-cream py-8 md:py-12 px-4">
      <Box className="max-w-[900px] mx-auto">
        <Typography variant="h4" className="!font-bold !text-brand-maroon !mb-1">
          {t("events.my.title")}
        </Typography>
        <Typography color="text.secondary" className="!mb-6">
          {t("events.my.subtitle")}
        </Typography>

        {justRegisteredId && (
          <Alert severity="success" className="!mb-4">
            {t("events.my.justRegistered")}
          </Alert>
        )}

        {error && (
          <Alert severity="error" className="!mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <Box className="text-center py-12">
            <CircularProgress />
          </Box>
        ) : (items?.length ?? 0) === 0 ? (
          <Paper
            elevation={0}
            className="!p-10 !rounded-3xl !text-center !border !border-dashed !border-brand-sand"
          >
            <EventNoteIcon className="!text-[56px] !text-brand-sand !mb-2" />
            <Typography color="text.secondary" className="!mb-4">
              {t("events.my.empty")}
            </Typography>
            <Button component={Link} href="/pitham" variant="outlined">
              {t("events.my.browse")}
            </Button>
          </Paper>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section title={t("events.my.upcoming")} items={upcoming} />
            )}
            {past.length > 0 && (
              <Box className="mt-8">
                <Section title={t("events.my.past")} items={past} faded />
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

function Section({
  title,
  items,
  faded = false,
}: {
  title: string;
  items: MyEventRegistration[];
  faded?: boolean;
}) {
  return (
    <>
      <Typography variant="h6" className="!font-bold !text-brand-maroon !mb-3">
        {title}
      </Typography>
      <Box className="grid grid-cols-1 gap-4">
        {items.map((it) => (
          <RegistrationCard key={it.registration.id} item={it} faded={faded} />
        ))}
      </Box>
    </>
  );
}

function RegistrationCard({ item, faded }: { item: MyEventRegistration; faded: boolean }) {
  const { t } = useT();
  const { event, registration } = item;
  const statusInfo = STATUS_INFO[registration.status] || STATUS_INFO.confirmed;
  return (
    <Paper
      elevation={0}
      className={`!rounded-3xl !border !border-brand-sand !overflow-hidden !flex !flex-col sm:!flex-row ${
        faded ? "!opacity-75" : ""
      }`}
    >
      {event.image_url && (
        <Box className="w-full sm:w-48 h-40 sm:h-auto shrink-0 bg-brand-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.image_url.startsWith("http") ? event.image_url : fileUrl(event.image_url)}
            alt={event.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </Box>
      )}
      <Box className="p-5 flex-1 min-w-0">
        <Box className="flex items-start justify-between gap-3 flex-wrap">
          <Box>
            <Typography className="!font-bold !text-brand-maroon">{event.title}</Typography>
            {registration.tier_name && (
              <Typography variant="caption" color="text.secondary" className="!block !mt-0.5">
                {registration.tier_name}
              </Typography>
            )}
          </Box>
          <Chip label={t(statusInfo.labelKey)} size="small" color={statusInfo.color} variant="outlined" />
        </Box>
        <Box className="flex flex-wrap gap-3 mt-2 text-brand-text-medium">
          <Box className="flex items-center gap-1 text-sm">
            <CalendarMonthIcon fontSize="small" />
            <span>
              {event.event_date}
              {event.event_time ? ` · ${event.event_time}` : ""}
            </span>
          </Box>
          {event.location && (
            <Box className="flex items-center gap-1 text-sm">
              <LocationOnIcon fontSize="small" />
              <span>{event.location}</span>
            </Box>
          )}
        </Box>
        {registration.fee_amount > 0 && (
          <Typography variant="caption" color="text.secondary" className="!block !mt-2">
            ₹{registration.fee_amount} · payment{" "}
            <strong className={registration.payment_status === "paid" ? "text-brand-success" : ""}>
              {registration.payment_status}
            </strong>
            {registration.payment_gateway ? ` (${registration.payment_gateway})` : ""}
          </Typography>
        )}
        <Box className="mt-3">
          <Button
            component={Link}
            href={`/pitham/events/${event.id}`}
            size="small"
            variant="outlined"
          >
            {t("events.my.viewEvent")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
