import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "./colors";

/**
 * ── Shared sx style objects ───────────────────────────────────────────────
 * Reusable pieces used across multiple pages. Keep page-specific styles in
 * each page's own `styles.ts` file.
 */

export const pageWrapper: SxProps<Theme> = {
  minHeight: "100vh",
  background: `linear-gradient(180deg, ${brandColors.cream} 0%, #FFF4DE 100%)`,
  py: { xs: 4, md: 6 },
  px: 2,
};

export const adminPageWrapper: SxProps<Theme> = {
  minHeight: "100vh",
  bgcolor: "#FAF6EE",
  py: { xs: 4, md: 6 },
  px: 2,
};

export const contentContainer: SxProps<Theme> = {
  maxWidth: 1100,
  mx: "auto",
};

export const narrowContainer: SxProps<Theme> = {
  maxWidth: 720,
  mx: "auto",
};

export const formContainer: SxProps<Theme> = {
  maxWidth: 600,
  mx: "auto",
};

export const card: SxProps<Theme> = {
  bgcolor: "background.paper",
  borderRadius: 4,
  p: { xs: 3, md: 4 },
  border: `1px solid ${brandColors.sand}`,
  boxShadow: "0 4px 20px rgba(123, 30, 30, 0.06)",
};

export const sectionTitle: SxProps<Theme> = {
  color: brandColors.maroon,
  mb: 3,
  fontWeight: 600,
};

export const subTitle: SxProps<Theme> = {
  color: brandColors.textMedium,
  mb: 2,
};

export const primaryButton: SxProps<Theme> = {
  bgcolor: brandColors.saffron,
  color: "#fff",
  px: 4,
  py: 1.2,
  fontWeight: 600,
  "&:hover": { bgcolor: brandColors.saffronDark },
};

export const outlineButton: SxProps<Theme> = {
  borderColor: brandColors.saffron,
  color: brandColors.saffron,
  px: 4,
  py: 1.2,
  fontWeight: 600,
  border: `2px solid ${brandColors.saffron}`,
  "&:hover": { bgcolor: brandColors.saffron, color: "#fff" },
};

export const loadingWrapper: SxProps<Theme> = {
  minHeight: "60vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const statusChipColors: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#EFEBE4", fg: brandColors.textMedium },
  payment_pending: { bg: "#FFF4D6", fg: "#8A6500" },
  payment_verified: { bg: "#DDEEFF", fg: "#0B558A" },
  scheduled: { bg: "#D7EEDF", fg: "#1F5E2B" },
  completed: { bg: "#E8DDF0", fg: "#5B3378" },
  cancelled: { bg: "#FADBDB", fg: "#8E2424" },
  rescheduled: { bg: "#FFE1C2", fg: "#8A4200" },
  open: { bg: "#FFF4D6", fg: "#8A6500" },
  answered: { bg: "#D7EEDF", fg: "#1F5E2B" },
  paid: { bg: "#D7EEDF", fg: "#1F5E2B" },
};
