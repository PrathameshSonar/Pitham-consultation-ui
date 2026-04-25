import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 3, md: 5 },
  px: 2,
};

export const container: SxProps<Theme> = {
  maxWidth: 1200,
  mx: "auto",
};

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 3,
};

export const gridLayout: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
  gap: 3,
};

export const sidePanel: SxProps<Theme> = {
  order: { xs: 2, md: 1 },
  display: "flex",
  flexDirection: "column",
  gap: 2,
  maxHeight: { md: "calc(100vh - 150px)" },
  overflow: { md: "auto" },
  pr: { md: 1 },
};

export const sideHeader: SxProps<Theme> = {
  fontWeight: 700,
  color: brandColors.maroon,
  mb: 1,
};

export const emptyPanel: SxProps<Theme> = {
  p: 3,
  textAlign: "center",
  borderRadius: 3,
  bgcolor: "background.paper",
  border: `1px dashed ${brandColors.sand}`,
};

export const calCard: SxProps<Theme> = {
  order: { xs: 1, md: 2 },
  p: { xs: 2, md: 3 },
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  height: "fit-content",
};

export const monthNav: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: 2,
};

export const monthLabel: SxProps<Theme> = {
  fontWeight: 700,
  color: brandColors.maroon,
  fontSize: { xs: "1rem", md: "1.15rem" },
};

export const weekRow: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  mb: 1,
  "& > span": {
    textAlign: "center",
    fontSize: { xs: "0.65rem", md: "0.75rem" },
    fontWeight: 700,
    color: brandColors.textMedium,
    textTransform: "uppercase",
  },
};

export const daysGrid: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 0.5,
};

export const dayCell = (isSelected: boolean, isToday: boolean, hasCount: boolean): SxProps<Theme> => ({
  aspectRatio: "1",
  borderRadius: 2,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: { xs: "0.8rem", md: "0.9rem" },
  fontWeight: isSelected || isToday ? 700 : 500,
  bgcolor: isSelected ? brandColors.saffron : isToday ? "background.paper" : "transparent",
  color: isSelected ? "#fff" : isToday ? brandColors.saffronDark : "text.primary",
  border: isSelected ? "none" : `1px solid ${hasCount ? brandColors.goldLight : "transparent"}`,
  transition: "all 0.15s",
  "&:hover": {
    bgcolor: isSelected ? brandColors.saffronDark : "background.default",
  },
});

export const badge = (selected: boolean): SxProps<Theme> => ({
  mt: 0.3,
  display: "inline-block",
  minWidth: 16,
  height: 16,
  px: 0.5,
  lineHeight: "16px",
  fontSize: "0.6rem",
  fontWeight: 700,
  borderRadius: 999,
  bgcolor: selected ? "#fff" : brandColors.goldLight,
  color: selected ? brandColors.saffronDark : brandColors.maroon,
});

export const apptItem: SxProps<Theme> = {
  p: 2,
  borderRadius: 3,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  transition: "border-color 0.15s",
  "&:hover": { borderColor: brandColors.goldLight },
};

export const dateChip: SxProps<Theme> = {
  display: "inline-block",
  px: 1,
  py: 0.25,
  borderRadius: 1,
  bgcolor: "background.paper",
  color: brandColors.saffronDark,
  fontSize: "0.7rem",
  fontWeight: 700,
  mb: 0.5,
};
