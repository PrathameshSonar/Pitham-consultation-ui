import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 3, md: 6 },
  px: { xs: 1, sm: 2 },
};

export const container: SxProps<Theme> = {
  maxWidth: 900,
  mx: "auto",
  width: "100%",
};

export const headerRow: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: { xs: 2, md: 4 },
  flexWrap: "wrap",
  gap: 1.5,
};

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  fontSize: { xs: "1.4rem", md: "2.125rem" },
};

export const emptyCard: SxProps<Theme> = {
  p: { xs: 4, md: 6 },
  textAlign: "center",
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px dashed ${brandColors.sand}`,
};

export const apptCard: SxProps<Theme> = {
  p: { xs: 2, md: 3 },
  mb: 2,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  transition: "all 0.2s",
  overflow: "hidden",
  "&:hover": { boxShadow: `0 8px 25px rgba(230, 81, 0, 0.08)` },
};

export const apptTopRow: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 1,
};

export const apptName: SxProps<Theme> = {
  fontWeight: 700,
  color: brandColors.maroon,
  wordBreak: "break-word",
};

export const scheduledBox: SxProps<Theme> = {
  mt: 2,
  pt: 2,
  borderTop: `1px dashed ${brandColors.sand}`,
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" },
  gap: 1.5,
};
