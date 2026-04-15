import type { SxProps, Theme } from "@mui/material";
import { brandColors } from "@/theme/colors";

export const heroWrap: SxProps<Theme> = {
  minHeight: { xs: "auto", md: "calc(100vh - 64px)" },
  bgcolor: "background.default",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  px: { xs: 2, md: 4 },
  py: { xs: 6, md: 8 },
};

export const heroContent: SxProps<Theme> = {
  textAlign: "center",
  maxWidth: 820,
  mx: "auto",
  width: "100%",
};

export const omSymbol: SxProps<Theme> = {
  fontSize: { xs: "3rem", md: "4rem" },
  color: brandColors.saffron,
  mb: 2,
  fontFamily: "serif",
  textShadow: `0 2px 8px rgba(230,81,0,0.25)`,
};

export const tagline: SxProps<Theme> = {
  color: brandColors.gold,
  fontWeight: 700,
  letterSpacing: { xs: "0.1em", md: "0.2em" },
  textTransform: "uppercase",
  fontSize: { xs: "0.7rem", md: "0.85rem" },
  mb: 2,
};

export const heroTitle: SxProps<Theme> = {
  fontSize: { xs: "1.6rem", sm: "2rem", md: "3.2rem" },
  color: brandColors.maroon,
  mb: 3,
  lineHeight: 1.2,
  wordBreak: "break-word",
};

export const heroSubtitle: SxProps<Theme> = {
  color: brandColors.textMedium,
  fontSize: { xs: "0.9rem", md: "1.15rem" },
  mb: { xs: 3, md: 5 },
  lineHeight: 1.8,
  fontStyle: "italic",
};

export const ctaRow: SxProps<Theme> = {
  display: "flex",
  gap: 2,
  justifyContent: "center",
  flexWrap: "wrap",
};

export const featuresWrap: SxProps<Theme> = {
  bgcolor: "#FFFBF3",
  py: { xs: 6, md: 10 },
  px: { xs: 2, md: 4 },
  borderTop: `1px solid ${brandColors.sand}`,
};

export const featuresGrid: SxProps<Theme> = {
  maxWidth: 1100,
  mx: "auto",
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
  gap: { xs: 2, md: 4 },
};

export const featureCard: SxProps<Theme> = {
  p: { xs: 3, md: 4 },
  textAlign: "center",
  bgcolor: "background.paper",
  border: `1px solid ${brandColors.sand}`,
  borderRadius: 4,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: `0 12px 30px rgba(230, 81, 0, 0.15)`,
    borderColor: brandColors.saffronLight,
  },
};

export const featureIcon: SxProps<Theme> = {
  fontSize: { xs: "2.5rem", md: "3rem" },
  mb: 2,
};

export const featureTitle: SxProps<Theme> = {
  color: brandColors.maroon,
  mb: 1.5,
  fontWeight: 700,
  fontSize: { xs: "1.1rem", md: "1.25rem" },
};

export const featureDesc: SxProps<Theme> = {
  color: brandColors.textMedium,
  lineHeight: 1.8,
  fontSize: { xs: "0.85rem", md: "0.95rem" },
};

export const ctaBand: SxProps<Theme> = {
  background: `linear-gradient(135deg, ${brandColors.saffronDark} 0%, ${brandColors.saffron} 100%)`,
  py: { xs: 5, md: 8 },
  px: { xs: 2, md: 4 },
  textAlign: "center",
  color: "#fff",
};

export const ctaBandTitle: SxProps<Theme> = {
  mb: 2,
  fontWeight: 600,
  fontSize: { xs: "1.4rem", md: "2.125rem" },
};
