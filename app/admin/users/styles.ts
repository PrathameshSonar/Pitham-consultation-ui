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

export const filtersCard: SxProps<Theme> = {
  p: { xs: 1.5, md: 2.5 },
  mb: 3,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  // Grid layout: stacks single-column on phones (each input full-width),
  // 2-col on small tablets, dense 4-col on desktop. Avoids the prior issue
  // where flex+wrap squashed the search box on narrow screens.
  display: "grid",
  gap: { xs: 1.25, md: 1.5 },
  alignItems: "center",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "1fr 1fr",
    md: "2fr 1fr 1fr 1fr 1.5fr auto",
  },
  // All form controls inside go full-width within their grid cell.
  "& .MuiFormControl-root": { width: "100%" },
};

export const tablePaper: SxProps<Theme> = {
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  overflow: "auto",
  maxWidth: "100%",
  WebkitOverflowScrolling: "touch",
};

export const tableHeadRow: SxProps<Theme> = {
  bgcolor: "background.default",
  "& th": {
    fontWeight: 700,
    color: brandColors.maroon,
    textTransform: "uppercase",
    fontSize: "0.75rem",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  },
};

export const detailGrid: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
  gap: 2,
  mb: 3,
};
