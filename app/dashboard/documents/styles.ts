import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 4, md: 6 },
  px: 2,
};

export const container: SxProps<Theme> = {
  maxWidth: 780,
  mx: "auto",
};

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 4,
};

export const emptyCard: SxProps<Theme> = {
  p: 6,
  textAlign: "center",
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px dashed ${brandColors.sand}`,
};

export const docCard: SxProps<Theme> = {
  p: 3,
  mb: 2,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
  transition: "all 0.2s",
  "&:hover": { boxShadow: `0 8px 25px rgba(230, 81, 0, 0.08)` },
};

export const docIcon: SxProps<Theme> = {
  fontSize: "2.5rem",
  color: brandColors.gold,
};

export const docTitle: SxProps<Theme> = {
  fontWeight: 700,
  color: brandColors.maroon,
};
