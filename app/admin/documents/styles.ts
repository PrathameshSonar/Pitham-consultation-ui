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

export const title: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 1,
};

export const subtitle: SxProps<Theme> = {
  color: brandColors.textMedium,
  mb: 4,
};

export const tabs: SxProps<Theme> = {
  mb: 4,
  borderBottom: `1px solid ${brandColors.sand}`,
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.95rem",
    color: brandColors.textMedium,
  },
  "& .Mui-selected": { color: `${brandColors.saffron} !important` },
  "& .MuiTabs-indicator": { backgroundColor: brandColors.saffron, height: 3, borderRadius: 2 },
};

export const sectionCard: SxProps<Theme> = {
  p: { xs: 3, md: 4 },
  mb: 3,
  borderRadius: 4,
  bgcolor: "#fff",
  border: `1px solid ${brandColors.sand}`,
};

export const sectionTitle: SxProps<Theme> = {
  color: brandColors.maroon,
  fontWeight: 700,
  mb: 1,
};

export const sectionHint: SxProps<Theme> = {
  color: brandColors.textMedium,
  fontSize: "0.9rem",
  mb: 3,
};

export const galleryGrid: SxProps<Theme> = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
  gap: 2,
};

export const galleryCard: SxProps<Theme> = {
  p: 2.5,
  borderRadius: 3,
  bgcolor: "#FFFBF3",
  border: `1px solid ${brandColors.sand}`,
  display: "flex",
  flexDirection: "column",
  gap: 1,
  transition: "all 0.2s",
  "&:hover": { borderColor: brandColors.gold, boxShadow: "0 6px 18px rgba(201,154,46,0.15)" },
};

export const galleryDocIcon: SxProps<Theme> = {
  fontSize: "2rem",
  color: brandColors.gold,
};

export const galleryDocTitle: SxProps<Theme> = {
  fontWeight: 700,
  color: brandColors.maroon,
  fontSize: "0.95rem",
  lineHeight: 1.3,
};

export const galleryActions: SxProps<Theme> = {
  mt: "auto",
  display: "flex",
  gap: 1,
  pt: 1,
};

export const emptyBox: SxProps<Theme> = {
  p: 4,
  textAlign: "center",
  borderRadius: 3,
  bgcolor: "#FFFBF3",
  border: `1px dashed ${brandColors.sand}`,
};

export const listItem: SxProps<Theme> = {
  p: 2.5,
  mb: 1.5,
  borderRadius: 3,
  bgcolor: "#fff",
  border: `1px solid ${brandColors.sand}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
};

export const radioRow: SxProps<Theme> = {
  display: "flex",
  gap: 3,
  mb: 2,
  flexWrap: "wrap",
};
