"use client";

import { createTheme } from "@mui/material/styles";
import { brandColors } from "./colors";

// Single mobile breakpoint for the typography scale. Keeping it here means any
// future tweak to mobile font sizing only needs to change this one number.
const MOBILE = "@media (max-width: 600px)";

const shared = {
  typography: {
    fontFamily: ["'Poppins'", "'Segoe UI'", "Roboto", "sans-serif"].join(","),
    // Headings: keep desktop sizes (MUI defaults) and shrink on mobile via @media.
    // This means every `<Typography variant="hX">` across the app auto-resizes
    // on small screens — no need to set responsive sx on each call site.
    h1: {
      fontFamily: "'Cinzel', 'Poppins', sans-serif",
      fontWeight: 700,
      letterSpacing: "0.02em",
      [MOBILE]: { fontSize: "2rem", lineHeight: 1.2 },
    },
    h2: {
      fontFamily: "'Cinzel', 'Poppins', sans-serif",
      fontWeight: 700,
      letterSpacing: "0.02em",
      [MOBILE]: { fontSize: "1.75rem", lineHeight: 1.25 },
    },
    h3: {
      fontFamily: "'Cinzel', 'Poppins', sans-serif",
      fontWeight: 700,
      [MOBILE]: { fontSize: "1.5rem", lineHeight: 1.3 },
    },
    h4: {
      fontFamily: "'Cinzel', 'Poppins', sans-serif",
      fontWeight: 700,
      [MOBILE]: { fontSize: "1.35rem", lineHeight: 1.3 },
    },
    h5: {
      fontWeight: 600,
      [MOBILE]: { fontSize: "1.15rem", lineHeight: 1.35 },
    },
    h6: {
      fontWeight: 600,
      [MOBILE]: { fontSize: "1rem", lineHeight: 1.4 },
    },
    subtitle1: {
      [MOBILE]: { fontSize: "0.95rem" },
    },
    subtitle2: {
      [MOBILE]: { fontSize: "0.85rem" },
    },
    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.7,
      fontWeight: 400,
      [MOBILE]: { fontSize: "0.9rem", lineHeight: 1.6 },
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      fontWeight: 400,
      [MOBILE]: { fontSize: "0.825rem" },
    },
    caption: { fontWeight: 500 },
    button: { textTransform: "none" as const, fontWeight: 600, letterSpacing: "0.03em" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: "8px 22px",
          boxShadow: "none",
          whiteSpace: "nowrap" as const,
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
    MuiTableContainer: {
      styleOverrides: { root: { overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as const } },
    },
    MuiTableCell: {
      styleOverrides: { root: { "@media (max-width: 600px)": { padding: "6px 8px", fontSize: "0.8rem" } } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          "@media (max-width: 600px)": {
            margin: 8,
            maxHeight: "calc(100vh - 16px)",
            width: "calc(100% - 16px)",
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { "@media (max-width: 600px)": { minWidth: "auto", padding: "8px 12px", fontSize: "0.8rem" } },
      },
    },
    // Default Tabs to scrollable so they never overflow horizontally on mobile.
    // Pages can still opt out with variant="standard" if needed.
    MuiTabs: {
      defaultProps: {
        variant: "scrollable" as const,
        scrollButtons: "auto" as const,
        allowScrollButtonsMobile: true,
      },
      styleOverrides: {
        root: { minHeight: 42 },
      },
    },
    // Inputs allowed to shrink below their natural minWidth on small screens.
    // Combined with flex containers using `flexWrap: "wrap"` (the standard pattern
    // on this codebase) this lets filter rows wrap naturally on phones instead
    // of forcing horizontal scroll.
    MuiFormControl: {
      styleOverrides: {
        root: { "@media (max-width: 600px)": { minWidth: "0 !important" } },
      },
    },
    // DialogActions: by default it's `display: flex` with no wrap, so 3+ buttons
    // overflow horizontally on small screens. Allow wrapping on mobile.
    MuiDialogActions: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            flexWrap: "wrap",
            gap: 8,
            "& > :not(:first-of-type)": { marginLeft: 0 },
            // Make every button stretch full-width when it wraps to its own row,
            // so they line up as full-width stacked buttons rather than half-overlapping.
            "& > .MuiButton-root": { flex: "1 1 100%", minWidth: 0 },
          },
        },
      },
    },
    // Long text inside Dialog content should wrap on word boundaries instead
    // of pushing the dialog wider than the viewport.
    MuiDialogContent: {
      styleOverrides: {
        root: { "& p, & .MuiTypography-root": { wordBreak: "break-word" } },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: "light",
    primary: {
      main: brandColors.saffron,
      light: brandColors.saffronLight,
      dark: brandColors.saffronDark,
      contrastText: "#ffffff",
    },
    secondary: {
      main: brandColors.gold,
      light: brandColors.goldLight,
      dark: brandColors.goldDark,
      contrastText: "#ffffff",
    },
    error: { main: brandColors.error },
    warning: { main: brandColors.warning },
    info: { main: brandColors.info },
    success: { main: brandColors.success },
    background: { default: brandColors.cream, paper: brandColors.ivory },
    text: {
      primary: brandColors.textDark,
      secondary: brandColors.textMedium,
      disabled: brandColors.textLight,
    },
    divider: "#E8D9BF",
  },
});

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: "dark",
    primary: {
      main: brandColors.saffronLight,
      light: "#FFB74D",
      dark: brandColors.saffron,
      contrastText: "#000",
    },
    secondary: {
      main: brandColors.goldLight,
      light: "#FFD54F",
      dark: brandColors.gold,
      contrastText: "#000",
    },
    error: { main: "#EF5350" },
    warning: { main: "#FFA726" },
    info: { main: "#42A5F5" },
    success: { main: "#66BB6A" },
    background: { default: "#1A1210", paper: "#2C211A" },
    text: { primary: "#F5E6D0", secondary: "#C4A882", disabled: "#8A7560" },
    divider: "#3D2E22",
  },
});

// Default export for backward compatibility
export default lightTheme;
