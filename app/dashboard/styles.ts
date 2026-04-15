import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const wrapper: SxProps<Theme> = {
  minHeight: "calc(100vh - 64px)",
  bgcolor: "background.default",
  py: { xs: 3, md: 6 },
  px: { xs: 1.5, sm: 2 },
};

export const container: SxProps<Theme> = {
  maxWidth: 1000,
  mx: "auto",
  width: "100%",
};

export const welcomeCard: SxProps<Theme> = {
  background: `linear-gradient(135deg, ${brandColors.saffronDark} 0%, ${brandColors.saffron} 100%)`,
  color: "#fff",
  p: { xs: 3, md: 4 },
  borderRadius: 5,
  mb: 4,
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '"ॐ"',
    position: "absolute",
    right: 24,
    top: -20,
    fontSize: "10rem",
    opacity: 0.08,
    fontFamily: "serif",
  },
};

export const welcomeLabel: SxProps<Theme> = {
  opacity: 0.85,
  fontSize: "0.85rem",
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  mb: 0.5,
};

export const welcomeName: SxProps<Theme> = {
  fontFamily: "'Cinzel', serif",
  fontWeight: 700,
  fontSize: { xs: "1.4rem", sm: "1.8rem", md: "2.2rem" },
  mb: 2,
  wordBreak: "break-word",
};

export const infoGrid: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
  gap: 2,
  position: "relative",
  zIndex: 1,
};

export const infoItem: SxProps<Theme> = {
  "& .label": {
    display: "block",
    fontSize: "0.75rem",
    opacity: 0.75,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  "& .value": {
    fontSize: "0.95rem",
    fontWeight: 500,
  },
};

export const tilesGrid: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  gap: 3,
};

export const tile: SxProps<Theme> = {
  p: 3,
  borderRadius: 4,
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  display: "flex",
  alignItems: "center",
  gap: 3,
  cursor: "pointer",
  transition: "all 0.25s ease",
  textDecoration: "none",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: `0 12px 30px rgba(230, 81, 0, 0.14)`,
    borderColor: brandColors.saffronLight,
  },
};

export const tileIcon: SxProps<Theme> = {
  fontSize: "2.5rem",
  lineHeight: 1,
};

export const tileTitle: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 0.5,
};

export const tileDesc: SxProps<Theme> = {
  color: brandColors.textMedium,
  fontSize: "0.88rem",
};
