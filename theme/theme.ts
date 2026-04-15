"use client";

import { createTheme } from "@mui/material/styles";
import { brandColors } from "./colors";

const shared = {
  typography: {
    fontFamily: ["'Poppins'", "'Segoe UI'", "Roboto", "sans-serif"].join(","),
    h1: { fontFamily: "'Cinzel', 'Poppins', sans-serif", fontWeight: 700, letterSpacing: "0.02em" },
    h2: { fontFamily: "'Cinzel', 'Poppins', sans-serif", fontWeight: 700, letterSpacing: "0.02em" },
    h3: { fontFamily: "'Cinzel', 'Poppins', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Cinzel', 'Poppins', sans-serif", fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontSize: "0.95rem", lineHeight: 1.7, fontWeight: 400 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6, fontWeight: 400 },
    caption: { fontWeight: 500 },
    button: { textTransform: "none" as const, fontWeight: 600, letterSpacing: "0.03em" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999, padding: "8px 22px", boxShadow: "none", whiteSpace: "nowrap" as const,
          "&:hover": { boxShadow: "0 4px 14px rgba(230, 81, 0, 0.25)" },
          "@media (max-width: 600px)": { padding: "6px 16px", fontSize: "0.82rem" },
        },
        sizeSmall: { padding: "4px 12px", fontSize: "0.78rem" },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16, boxShadow: "0 2px 12px rgba(123, 30, 30, 0.06)" },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" as const, size: "small" as const } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: "0 2px 10px rgba(123, 30, 30, 0.1)" } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTableContainer: { styleOverrides: { root: { overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const } } },
    MuiTableCell: { styleOverrides: { root: { "@media (max-width: 600px)": { padding: "6px 8px", fontSize: "0.8rem" } } } },
    MuiDialog: { styleOverrides: { paper: { "@media (max-width: 600px)": { margin: 8, maxHeight: "calc(100vh - 16px)", width: "calc(100% - 16px)" } } } },
    MuiTab: { styleOverrides: { root: { "@media (max-width: 600px)": { minWidth: "auto", padding: "8px 12px", fontSize: "0.8rem" } } } },
  },
};

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    primary: { main: brandColors.saffron, light: brandColors.saffronLight, dark: brandColors.saffronDark, contrastText: "#ffffff" },
    secondary: { main: brandColors.gold, light: brandColors.goldLight, dark: brandColors.goldDark, contrastText: "#ffffff" },
    error: { main: brandColors.error }, warning: { main: brandColors.warning },
    info: { main: brandColors.info }, success: { main: brandColors.success },
    background: { default: brandColors.cream, paper: brandColors.ivory },
    text: { primary: brandColors.textDark, secondary: brandColors.textMedium, disabled: brandColors.textLight },
    divider: "#E8D9BF",
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: { main: brandColors.saffronLight, light: "#FFB74D", dark: brandColors.saffron, contrastText: "#000" },
    secondary: { main: brandColors.goldLight, light: "#FFD54F", dark: brandColors.gold, contrastText: "#000" },
    error: { main: "#EF5350" }, warning: { main: "#FFA726" },
    info: { main: "#42A5F5" }, success: { main: "#66BB6A" },
    background: { default: "#1A1210", paper: "#2C211A" },
    text: { primary: "#F5E6D0", secondary: "#C4A882", disabled: "#8A7560" },
    divider: "#3D2E22",
  },
});

// Default export for backward compatibility
export default lightTheme;
