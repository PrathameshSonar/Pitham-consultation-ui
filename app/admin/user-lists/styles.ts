import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "#FAF6EE",
  py: { xs: 4, md: 6 },
  px: 2,
};

export const container: SxProps<Theme> = {
  maxWidth: 1100,
  mx: "auto",
};

export const headerRow: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: 4,
  flexWrap: "wrap",
  gap: 2,
};

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
};

export const listCard: SxProps<Theme> = {
  p: 3,
  mb: 2,
  borderRadius: 4,
  bgcolor: "#fff",
  border: `1px solid ${brandColors.sand}`,
};

export const listHeader: SxProps<Theme> = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 2,
  flexWrap: "wrap",
};

export const listName: SxProps<Theme> = {
  fontWeight: 700,
  color: brandColors.maroon,
};

export const memberBadge: SxProps<Theme> = {
  bgcolor: "#FFF4DE",
  color: brandColors.gold,
  fontWeight: 700,
  px: 1.5,
  py: 0.5,
  borderRadius: 999,
  fontSize: "0.8rem",
  display: "inline-block",
};

export const emptyBox: SxProps<Theme> = {
  p: 6,
  textAlign: "center",
  borderRadius: 4,
  bgcolor: "#fff",
  border: `1px dashed ${brandColors.sand}`,
};

export const actionsRow: SxProps<Theme> = {
  mt: 2,
  display: "flex",
  gap: 1,
  flexWrap: "wrap",
};

export const userPickerList: SxProps<Theme> = {
  maxHeight: 380,
  overflow: "auto",
  border: `1px solid ${brandColors.sand}`,
  borderRadius: 2,
  bgcolor: "#FFFBF3",
};
