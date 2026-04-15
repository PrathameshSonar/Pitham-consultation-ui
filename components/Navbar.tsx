"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  AppBar, Toolbar, Box, Button, IconButton, Drawer,
  List, ListItem, ListItemButton, ListItemText, ListItemIcon,
  Divider, Typography, Menu, MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageIcon from "@mui/icons-material/Language";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HistoryIcon from "@mui/icons-material/History";
import DescriptionIcon from "@mui/icons-material/Description";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PeopleIcon from "@mui/icons-material/People";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import VideocamIcon from "@mui/icons-material/Videocam";
import SettingsIcon from "@mui/icons-material/Settings";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { clearToken } from "@/services/api";
import { useT } from "@/i18n/I18nProvider";
import { useThemeMode } from "@/theme/ThemeContext";
import { LANGUAGES, Lang, MessageKey } from "@/i18n/messages";
import * as styles from "./navbarStyles";

interface NavLink { href: string; labelKey: MessageKey; icon: ReactNode }

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useT();
  const { mode, toggleMode } = useThemeMode();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    setName(localStorage.getItem("name") || "");
  }, [pathname]);

  function logout() {
    clearToken();
    setRole(""); setName("");
    router.push("/login");
  }

  function changeLang(l: Lang) {
    setLang(l);
    setLangMenuAnchor(null);
  }

  const isAdmin = role === "admin" || role === "moderator";
  const isPublic = !role && ["/", "/login", "/register", "/terms", "/privacy", "/forgot-password"].includes(pathname);

  const userLinks: NavLink[] = [
    { href: "/dashboard",                  labelKey: "nav.dashboard",  icon: <DashboardIcon fontSize="small" /> },
    { href: "/dashboard/book-appointment", labelKey: "nav.book",       icon: <CalendarMonthIcon fontSize="small" /> },
    { href: "/dashboard/history",          labelKey: "nav.history",    icon: <HistoryIcon fontSize="small" /> },
    { href: "/dashboard/documents",        labelKey: "nav.documents",  icon: <DescriptionIcon fontSize="small" /> },
    { href: "/dashboard/queries",          labelKey: "nav.queries",    icon: <ChatBubbleIcon fontSize="small" /> },
  ];

  const adminLinks: NavLink[] = [
    { href: "/admin",              labelKey: "nav.dashboard",    icon: <DashboardIcon fontSize="small" /> },
    { href: "/admin/appointments", labelKey: "nav.appointments", icon: <EventNoteIcon fontSize="small" /> },
    { href: "/admin/users",        labelKey: "nav.users",        icon: <PeopleIcon fontSize="small" /> },
    { href: "/admin/user-lists",   labelKey: "nav.lists",        icon: <ListAltIcon fontSize="small" /> },
    { href: "/admin/calendar",     labelKey: "nav.calendar",     icon: <CalendarTodayIcon fontSize="small" /> },
    { href: "/admin/documents",    labelKey: "nav.sadhna",       icon: <AutoStoriesIcon fontSize="small" /> },
    { href: "/admin/recordings",   labelKey: "nav.recordings",   icon: <VideocamIcon fontSize="small" /> },
    { href: "/admin/queries",      labelKey: "nav.queries",      icon: <ChatBubbleIcon fontSize="small" /> },
    { href: "/admin/settings",     labelKey: "nav.settings",     icon: <SettingsIcon fontSize="small" /> },
  ];

  const currentLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  const LangSwitcher = () => (
    <>
      <IconButton
        size="small"
        onClick={e => setLangMenuAnchor(e.currentTarget)}
        sx={{ color: "inherit", border: "1px solid", borderColor: "rgba(255,255,255,0.25)", borderRadius: 2, px: 1, py: 0.5 }}
        aria-label="Change language"
      >
        <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {currentLang.native}
        </Typography>
      </IconButton>
      <Menu
        anchorEl={langMenuAnchor}
        open={!!langMenuAnchor}
        onClose={() => setLangMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {LANGUAGES.map(l => (
          <MenuItem key={l.code} onClick={() => changeLang(l.code)} selected={l.code === lang}>
            {l.native} <Typography variant="caption" sx={{ ml: 1, color: "text.disabled" }}>{l.label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  // Public navbar
  if (isPublic) {
    return (
      <AppBar position="sticky" sx={styles.publicAppBar} elevation={0} component="nav" aria-label="Main navigation">
        <Toolbar>
          <Typography component={Link} href="/" sx={{ ...styles.brandLogo, color: "inherit" }}>
            ॐ PITHAM
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LangSwitcher />
            <Button component={Link} href="/login" sx={styles.publicNavLink}>{t("common.login")}</Button>
            <Button component={Link} href="/register" variant="contained" color="primary">
              {t("common.register")}
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  if (!role) return null;

  const links = isAdmin ? adminLinks : userLinks;
  const profileHref = isAdmin ? "/admin/settings" : "/dashboard/profile";

  return (
    <>
      <AppBar position="sticky" sx={isAdmin ? styles.adminAppBar : styles.userAppBar} elevation={0} component="nav" aria-label="Main navigation">
        <Toolbar>
          <Typography
            component={Link}
            href={isAdmin ? "/admin" : "/dashboard"}
            sx={{ ...styles.brandLogo, color: "inherit" }}
          >
            ॐ PITHAM {role === "admin" && <span style={{ fontSize: "0.7em", opacity: 0.8 }}>· ADMIN</span>}
            {role === "moderator" && <span style={{ fontSize: "0.7em", opacity: 0.8 }}>· MODERATOR</span>}
          </Typography>

          <Box sx={styles.navLinksWrap}>
            {links.map(l => (
              <Button
                key={l.href}
                component={Link}
                href={l.href}
                startIcon={l.icon}
                sx={styles.navLink(pathname === l.href)}
              >
                {t(l.labelKey)}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 1.5 }}>
            <IconButton onClick={toggleMode} sx={{ color: "#fff" }} aria-label="Toggle dark mode">
              {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
            <LangSwitcher />
            <Button
              component={Link}
              href={profileHref}
              startIcon={<AccountCircleIcon />}
              sx={{
                color: "#fff",
                bgcolor: pathname === profileHref ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              {name || t("nav.profile")}
            </Button>
            <IconButton
              onClick={logout}
              sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.08)", "&:hover": { bgcolor: "rgba(255,255,255,0.18)" } }}
              aria-label={t("common.logout")}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Box>

          <IconButton
            sx={{ display: { xs: "flex", lg: "none" }, color: "#fff", ml: "auto" }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={styles.mobileDrawer} role="presentation">
          <Button
            component={Link}
            href={profileHref}
            startIcon={<AccountCircleIcon />}
            onClick={() => setDrawerOpen(false)}
            sx={{ px: 2, py: 1.5, justifyContent: "flex-start", fontWeight: 700, color: "primary.main" }}
          >
            {name || t("nav.profile")}
          </Button>
          <Divider sx={{ my: 1 }} />
          <List>
            {links.map(l => (
              <ListItem key={l.href} disablePadding>
                <ListItemButton component={Link} href={l.href} onClick={() => setDrawerOpen(false)}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{l.icon}</ListItemIcon>
                  <ListItemText primary={t(l.labelKey)} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button size="small" onClick={toggleMode} startIcon={mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />} sx={{ mb: 1 }}>
              {mode === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            <Typography variant="caption" color="text.disabled">Language</Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              {LANGUAGES.map(l => (
                <Button
                  key={l.code}
                  size="small"
                  variant={l.code === lang ? "contained" : "outlined"}
                  onClick={() => changeLang(l.code)}
                >
                  {l.native}
                </Button>
              ))}
            </Box>
          </Box>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={logout}>
                <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary={t("common.logout")} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
