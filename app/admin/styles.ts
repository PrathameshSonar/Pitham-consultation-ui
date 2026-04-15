import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 4, md: 6 },
  px: 2,
};

export const container: SxProps<Theme> = {
  maxWidth: 1200,
  mx: "auto",
};

export const header: SxProps<Theme> = {
  mb: 4,
};

export const headerTitle: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 0.5,
};

export const headerSubtitle: SxProps<Theme> = {
  color: brandColors.textMedium,
};

export const tilesGrid: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
  gap: 3,
};

export const tile: SxProps<Theme> = {
  p: 3,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  display: "flex",
  alignItems: "center",
  gap: 2.5,
  cursor: "pointer",
  textDecoration: "none",
  transition: "all 0.25s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: `0 12px 30px rgba(123, 30, 30, 0.12)`,
    borderColor: brandColors.gold,
  },
};

export const tileIcon: SxProps<Theme> = {
  fontSize: "2.4rem",
  color: brandColors.saffron,
};

export const tileTitle: SxProps<Theme> = {
  fontWeight: 700,
  color: brandColors.maroon,
};

export const tileDesc: SxProps<Theme> = {
  color: brandColors.textMedium,
  fontSize: "0.85rem",
};
