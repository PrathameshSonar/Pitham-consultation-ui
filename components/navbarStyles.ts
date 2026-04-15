import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const publicAppBar: SxProps<Theme> = {
  bgcolor: "#fff",
  color: brandColors.maroon,
  borderBottom: `1px solid ${brandColors.sand}`,
};

export const userAppBar: SxProps<Theme> = {
  background: `linear-gradient(90deg, ${brandColors.saffronDark} 0%, ${brandColors.saffron} 100%)`,
  color: "#fff",
};

export const adminAppBar: SxProps<Theme> = {
  background: `linear-gradient(90deg, #2C1810 0%, ${brandColors.maroon} 100%)`,
  color: "#fff",
};

export const brandLogo: SxProps<Theme> = {
  fontFamily: "'Cinzel', serif",
  fontWeight: 700,
  fontSize: { xs: "1.1rem", md: "1.4rem" },
  letterSpacing: "0.08em",
  cursor: "pointer",
  flexShrink: 0,
  whiteSpace: "nowrap",
};

export const navLinksWrap: SxProps<Theme> = {
  display: { xs: "none", lg: "flex" },
  gap: 0.25,
  ml: 2,
  flexGrow: 1,
  flexWrap: "nowrap",
  overflow: "auto",
  // Hide scrollbar but allow scroll
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
};

export const navLink = (active: boolean): SxProps<Theme> => ({
  color: "#fff",
  px: 1.5,
  py: 0.75,
  borderRadius: 2,
  fontSize: "0.82rem",
  fontWeight: active ? 700 : 500,
  bgcolor: active ? "rgba(255,255,255,0.18)" : "transparent",
  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
  whiteSpace: "nowrap",
  minWidth: "auto",
  flexShrink: 0,
});

export const publicNavLink: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 500,
  px: 2,
};

export const mobileDrawer: SxProps<Theme> = {
  width: { xs: 260, sm: 300 },
  pt: 2,
};
