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

export const formCard: SxProps<Theme> = {
  p: { xs: 3, md: 4 },
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  mb: 5,
};

export const sectionTitle: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 3,
};

export const subHeading: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 2,
};

export const queryCard: SxProps<Theme> = {
  p: 3,
  mb: 2,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
};

export const replyBlock: SxProps<Theme> = {
  mt: 2,
  pt: 2,
  borderTop: `1px dashed ${brandColors.sand}`,
};

export const replyLabel: SxProps<Theme> = {
  color: brandColors.saffron,
  fontWeight: 700,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  mb: 0.5,
};

export const recCard: SxProps<Theme> = {
  p: 3,
  mb: 2,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 2,
};

export const emptyBox: SxProps<Theme> = {
  p: 4,
  textAlign: "center",
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px dashed ${brandColors.sand}`,
};
