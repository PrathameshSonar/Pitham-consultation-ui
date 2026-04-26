"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Typography,
  Menu,
  MenuItem,
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
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CampaignIcon from "@mui/icons-material/Campaign";
import NotificationBell from "./NotificationBell";
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
import { getAccessibleSections, isSuperAdminClient } from "@/lib/permissions";
import type { AdminSectionKey } from "@/lib/adminSections";
import * as styles from "./navbarStyles";

interface NavLink {
  href: string;
  labelKey: MessageKey;
  icon: ReactNode;
  /** If set, this link is hidden unless the current user has the section
   * permission OR is super admin. Settings is super-admin only. */
  section?: AdminSectionKey | "super_admin";
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useT();
  const { mode, toggleMode } = useThemeMode();
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [allowedSections, setAllowedSections] = useState<readonly AdminSectionKey[]>([]);
  const [isSuper, setIsSuper] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langMenuAnchor, setLangMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    setName(localStorage.getItem("name") || "");
    setAllowedSections(getAccessibleSections());
    setIsSuper(isSuperAdminClient());
  }, [pathname]);

  function logout() {
    clearToken();
    setRole("");
    setName("");
    router.push("/login");
  }

  function changeLang(l: Lang) {
    setLang(l);
    setLangMenuAnchor(null);
  }

  const isAdmin = role === "admin" || role === "moderator";
  const isPublic =
    !role &&
    [
      "/",
      "/login",
      "/register",
      "/terms",
      "/privacy",
      "/forgot-password",
      "/pitham",
      "/about",
      "/contact",
    ].includes(pathname);

  const userLinks: NavLink[] = [
    { href: "/dashboard", labelKey: "nav.dashboard", icon: <DashboardIcon fontSize="small" /> },
    {
      href: "/dashboard/book-appointment",
      labelKey: "nav.book",
      icon: <CalendarMonthIcon fontSize="small" />,
    },
    { href: "/dashboard/history", labelKey: "nav.history", icon: <HistoryIcon fontSize="small" /> },
    { href: "/dashboard/documents", labelKey: "nav.documents", icon: <DescriptionIcon fontSize="small" /> },
    { href: "/dashboard/queries", labelKey: "nav.queries", icon: <ChatBubbleIcon fontSize="small" /> },
    {
      href: "/dashboard/notifications",
      labelKey: "nav.notifications",
      icon: <NotificationsIcon fontSize="small" />,
    },
  ];

  // The full admin nav as authored. Each entry tagged with the section that
  // governs it (or "super_admin" for the settings page). The filter below
  // hides items the current user can't reach.
  const allAdminLinks: NavLink[] = [
    { href: "/admin", labelKey: "nav.dashboard", icon: <DashboardIcon fontSize="small" /> },
    { href: "/admin/appointments", labelKey: "nav.appointments", icon: <EventNoteIcon fontSize="small" />, section: "appointments" },
    { href: "/admin/users", labelKey: "nav.users", icon: <PeopleIcon fontSize="small" />, section: "users" },
    { href: "/admin/user-lists", labelKey: "nav.lists", icon: <ListAltIcon fontSize="small" />, section: "user_lists" },
    { href: "/admin/calendar", labelKey: "nav.calendar", icon: <CalendarTodayIcon fontSize="small" />, section: "appointments" },
    { href: "/admin/documents", labelKey: "nav.sadhna", icon: <AutoStoriesIcon fontSize="small" />, section: "documents" },
    { href: "/admin/recordings", labelKey: "nav.recordings", icon: <VideocamIcon fontSize="small" />, section: "recordings" },
    { href: "/admin/queries", labelKey: "nav.queries", icon: <ChatBubbleIcon fontSize="small" />, section: "queries" },
    { href: "/admin/broadcasts", labelKey: "adm.tile.broadcast", icon: <CampaignIcon fontSize="small" />, section: "broadcasts" },
    { href: "/admin/pitham", labelKey: "adm.tile.pcms", icon: <EventAvailableIcon fontSize="small" />, section: "pitham_cms" },
    { href: "/admin/settings", labelKey: "nav.settings", icon: <SettingsIcon fontSize="small" />, section: "super_admin" },
  ];

  const adminLinks: NavLink[] = allAdminLinks.filter((l) => {
    if (!l.section) return true;                            // /admin home always visible
    if (l.section === "super_admin") return isSuper;        // /admin/settings → super only
    return isSuper || allowedSections.includes(l.section);  // gated by permissions
  });

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const langSwitcher = (
    <>
      <IconButton
        size="small"
        onClick={(e) => setLangMenuAnchor(e.currentTarget)}
        sx={{
          color: "inherit",
          border: "1px solid",
          borderColor: "rgba(255,255,255,0.25)",
          borderRadius: 2,
          px: 1,
          py: 0.5,
        }}
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
        keepMounted
      >
        {LANGUAGES.map((l) => (
          <MenuItem key={l.code} onClick={() => changeLang(l.code)} selected={l.code === lang}>
            {l.native}{" "}
            <Typography variant="caption" sx={{ ml: 1, color: "text.disabled" }}>
              {l.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  // Public navbar
  if (isPublic) {
    const publicLinks: { href: string; label: string }[] = [
      { href: "/pitham",  label: t("nav.pitham")  },
      { href: "/about",   label: t("nav.about")   },
      { href: "/contact", label: t("nav.contact") },
    ];

    return (
      <>
        <AppBar
          position="sticky"
          sx={styles.publicAppBar}
          elevation={0}
          component="nav"
          aria-label="Main navigation"
        >
          <Toolbar>
            {/* Brand → home */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "inherit",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <Image src="/spbsp-logo.png" alt={t("brand.name")} width={36} height={36} priority />
              <Typography sx={{ ...styles.brandLogo, color: "inherit" }}>{t("brand.short")}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />

            {/* Desktop: inline nav + lang + auth buttons */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 0.5, mr: 1 }}>
              {publicLinks.map((l) => (
                <Button key={l.href} component={Link} href={l.href} sx={styles.publicNavLink}>
                  {l.label}
                </Button>
              ))}
            </Box>
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1 }}>
              {langSwitcher}
              <Button component={Link} href="/login" sx={styles.publicNavLink}>
                {t("common.login")}
              </Button>
              <Button component={Link} href="/register" variant="contained" color="primary">
                {t("common.register")}
              </Button>
            </Box>

            {/* Mobile: hamburger */}
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: "flex", md: "none" }, color: "inherit" }}
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Mobile drawer for public users */}
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={styles.mobileDrawer} role="presentation">
            <List>
              {publicLinks.map((l) => (
                <ListItem key={l.href} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={l.href}
                    selected={pathname === l.href}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemText primary={l.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider />
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Button
                component={Link}
                href="/login"
                onClick={() => setDrawerOpen(false)}
                fullWidth
                variant="outlined"
                size="large"
              >
                {t("common.login")}
              </Button>
              <Button
                component={Link}
                href="/register"
                onClick={() => setDrawerOpen(false)}
                fullWidth
                variant="contained"
                size="large"
              >
                {t("common.register")}
              </Button>
            </Box>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mb: 1 }}>
                Language
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {LANGUAGES.map((l) => (
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
          </Box>
        </Drawer>
      </>
    );
  }

  if (!role) return null;

  const links = isAdmin ? adminLinks : userLinks;
  // Super admins land in settings (where they manage roles/permissions).
  // Moderators don't have settings access, so they go to their own profile.
  const profileHref = isSuper ? "/admin/settings" : "/dashboard/profile";

  return (
    <>
      <AppBar
        position="sticky"
        sx={isAdmin ? styles.adminAppBar : styles.userAppBar}
        elevation={0}
        component="nav"
        aria-label="Main navigation"
      >
        <Toolbar>
          <Box
            component={Link}
            href={isAdmin ? "/admin" : "/dashboard"}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "inherit",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <Image src="/spbsp-logo.png" alt={t("brand.name")} width={36} height={36} priority />
            <Typography sx={{ ...styles.brandLogo, color: "inherit" }}>
              {t("brand.short")}{" "}
              {role === "admin" && <span style={{ fontSize: "0.7em", opacity: 0.8 }}>· ADMIN</span>}
              {role === "moderator" && <span style={{ fontSize: "0.7em", opacity: 0.8 }}>· MODERATOR</span>}
            </Typography>
          </Box>

          {/* Admin nav (~11 entries) overflows even at lg, so admins always
              use the hamburger drawer. Regular users only have 6 entries and
              keep the inline experience from the lg breakpoint up. */}
          {!isAdmin && (
            <Box sx={styles.navLinksWrap}>
              {links.map((l) => (
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
          )}

          {!isAdmin && (
            <Box sx={{ display: { xs: "none", lg: "flex" }, alignItems: "center", gap: 1.5 }}>
              <IconButton onClick={toggleMode} sx={{ color: "#fff" }} aria-label="Toggle dark mode">
                {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
              <NotificationBell ariaLabel={t("nav.notifications")} />
              {langSwitcher}
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
                sx={{
                  color: "#fff",
                  bgcolor: "rgba(255,255,255,0.08)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
                }}
                aria-label={t("common.logout")}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Admins: keep the notification bell visible on the bar even when
              the rest collapses to the drawer — unread broadcasts are the
              one signal worth surfacing without opening the menu. */}
          {isAdmin && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
              <NotificationBell ariaLabel={t("nav.notifications")} />
            </Box>
          )}

          <IconButton
            sx={{
              display: isAdmin ? "flex" : { xs: "flex", lg: "none" },
              color: "#fff",
              ml: isAdmin ? 0 : "auto",
            }}
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
            {links.map((l) => (
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
            <Button
              size="small"
              onClick={toggleMode}
              startIcon={mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              sx={{ mb: 1 }}
            >
              {mode === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            <Typography variant="caption" color="text.disabled">
              Language
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
              {LANGUAGES.map((l) => (
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
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary={t("common.logout")} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
