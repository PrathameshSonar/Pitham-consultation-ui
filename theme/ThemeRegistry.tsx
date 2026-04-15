"use client";

import * as React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { I18nProvider } from "@/i18n/I18nProvider";
import { ThemeModeProvider, useThemeMode } from "./ThemeContext";
import { lightTheme, darkTheme } from "./theme";

function ThemeInner({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeModeProvider>
        <I18nProvider>
          <ThemeInner>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {children}
            </LocalizationProvider>
          </ThemeInner>
        </I18nProvider>
      </ThemeModeProvider>
    </AppRouterCacheProvider>
  );
}
