import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 3, md: 6 },
  px: { xs: 1, sm: 2 },
};

export const card: SxProps<Theme> = {
  maxWidth: 720,
  mx: "auto",
  width: "100%",
  p: { xs: 2, sm: 3, md: 5 },
  borderRadius: { xs: 3, md: 5 },
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  boxShadow: "0 12px 40px rgba(123, 30, 30, 0.08)",
};

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 0.5,
};

export const subtitle: SxProps<Theme> = {
  color: brandColors.textMedium,
  mb: 4,
};

export const gridTwo: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  gap: 2.5,
};

export const fileWrap: SxProps<Theme> = {
  display: "flex",
  alignItems: { xs: "flex-start", sm: "center" },
  flexDirection: { xs: "column", sm: "row" },
  gap: 1.5,
  p: 2,
  border: `2px dashed ${brandColors.sand}`,
  borderRadius: 2,
  bgcolor: "background.paper",
};

export const paymentNote: SxProps<Theme> = {
  p: 2.5,
  borderRadius: 3,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.goldLight}`,
  my: 3,
};

export const paymentNoteTitle: SxProps<Theme> = {
  fontWeight: 700,
  color: brandColors.gold,
  mb: 0.5,
};
