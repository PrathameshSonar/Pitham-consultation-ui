import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 3, md: 6 },
  px: { xs: 1, sm: 2 },
};

export const card: SxProps<Theme> = {
  maxWidth: 820,
  mx: "auto",
  width: "100%",
  p: { xs: 2.5, sm: 4, md: 6 },
  borderRadius: { xs: 3, md: 5 },
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  boxShadow: "0 12px 40px rgba(123, 30, 30, 0.08)",
};

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 1,
};

export const subtitle: SxProps<Theme> = {
  color: brandColors.gold,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  fontSize: "0.8rem",
  mb: 4,
};

export const sectionHeading: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 600,
  mb: 1,
  mt: 3,
};

export const sectionText: SxProps<Theme> = {
  color: brandColors.textMedium,
  lineHeight: 1.8,
};

export const actionsRow: SxProps<Theme> = {
  mt: 5,
  display: "flex",
  gap: 2,
  flexWrap: "wrap",
};
