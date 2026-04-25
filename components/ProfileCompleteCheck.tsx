"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from "@mui/material";
import { getProfile, getToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";

const CACHE_KEY = "profile_complete";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function ProfileCompleteCheck() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    // Only check on /dashboard/* pages, not profile page itself
    if (!pathname.startsWith("/dashboard") || pathname === "/dashboard/profile") return;

    const token = getToken();
    if (!token) return;

    // Check sessionStorage cache to avoid repeated API calls
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { complete, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) {
        if (!complete) setOpen(true);
        return;
      }
    }

    // Only fetch once per mount
    if (checked.current) return;
    checked.current = true;

    getProfile(token)
      .then((p: any) => {
        const complete = !!(p.mobile && p.dob && p.tob && p.birth_place);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ complete, ts: Date.now() }));
        if (!complete) setOpen(true);
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "primary.dark" }}>{t("profile.completeTitle")}</DialogTitle>
      <DialogContent>
        <Typography>{t("profile.completeDesc")}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          onClick={() => {
            setOpen(false);
            // Clear cache so it re-checks after profile update
            sessionStorage.removeItem(CACHE_KEY);
            router.push("/dashboard/profile");
          }}
        >
          {t("profile.completeBtn")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
