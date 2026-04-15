import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: { xs: 1.5, sm: 3 },
};

export const card: SxProps<Theme> = {
  width: "100%",
  maxWidth: 440,
  p: { xs: 3, sm: 4, md: 5 },
  borderRadius: { xs: 3, md: 5 },
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  boxShadow: "0 20px 60px rgba(123, 30, 30, 0.12)",
};

export const omIcon: SxProps<Theme> = {
  fontSize: "2.8rem",
  textAlign: "center",
  color: brandColors.saffron,
  mb: 1,
};

export const title: SxProps<Theme> = {
  textAlign: "center",
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 0.5,
};

export const subtitle: SxProps<Theme> = {
  textAlign: "center",
  color: brandColors.textMedium,
  mb: 4,
};

export const formStack: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
};

export const footerRow: SxProps<Theme> = {
  mt: 3,
  textAlign: "center",
  color: brandColors.textMedium,
};

export const link: SxProps<Theme> = {
  color: brandColors.saffron,
  fontWeight: 600,
  "&:hover": { textDecoration: "underline" },
};
