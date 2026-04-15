import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 4, md: 6 },
  px: 2,
};

export const container: SxProps<Theme> = {
  maxWidth: 900,
  mx: "auto",
};

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 4,
};

export const formCard: SxProps<Theme> = {
  p: { xs: 3, md: 4 },
  mb: 5,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
};

export const sectionTitle: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 3,
};

export const listItem: SxProps<Theme> = {
  p: 2.5,
  mb: 1.5,
  borderRadius: 3,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
};
