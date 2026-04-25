import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 3, md: 6 },
  px: { xs: 1, sm: 2 },
};

export const container: SxProps<Theme> = {
  maxWidth: 1200,
  mx: "auto",
  width: "100%",
};

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: { xs: 2, md: 4 },
  fontSize: { xs: "1.5rem", md: "2.125rem" },
};

export const apptCard: SxProps<Theme> = {
  p: { xs: 2, md: 3 },
  mb: 2,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  overflow: "hidden",
};

export const topRow: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 1.5,
};

export const chipCol: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  gap: 0.75,
  alignItems: { xs: "flex-start", sm: "flex-end" },
  flexShrink: 0,
  width: { xs: "100%", sm: "auto" },
  mt: { xs: 1, sm: 0 },
  // Tighter chip styling on mobile so the long "payment_pending" label
  // doesn't crowd the appointment info.
  "& .MuiChip-root": {
    fontSize: { xs: "0.7rem", sm: "0.75rem" },
    height: { xs: 22, sm: 24 },
  },
};

export const scheduledBox: SxProps<Theme> = {
  mt: 2,
  pt: 2,
  borderTop: `1px dashed ${brandColors.sand}`,
  display: "flex",
  gap: { xs: 1.5, md: 3 },
  flexWrap: "wrap",
  alignItems: "center",
};

export const actions: SxProps<Theme> = {
  mt: 2,
  display: "flex",
  gap: 1,
  flexWrap: "wrap",
};
