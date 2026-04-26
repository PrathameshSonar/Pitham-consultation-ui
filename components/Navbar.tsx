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
import { brandColors } from "@/theme/colors";

// Linear gradients with brand-color stops are easier to read inline than
// expanded into Tailwind arbitrary properties. They're set on the AppBar
// `style` prop so we don't pay per-render emotion overhead.
const USER_BAR_GRADIENT = `linear-gradient(90deg, ${brandColors.saffronDark} 0%, ${brandColors.saffron} 100%)`;
const ADMIN_BAR_GRADIENT = `linear-gradient(90deg, #2C1810 0%, ${brandColors.maroon} 100%)`;

const BRAND_LOGO_CLASS =
  "!font-['Cinzel',serif] !font-bold !tracking-[0.08em] !cursor-pointer !whitespace-nowrap !flex-shrink-0";

function navLinkClass(active: boolean): string {
  return [
    "!text-white !px-3 !py-1.5 !rounded-lg !text-[0.82rem] !whitespace-nowrap !min-w-0 !flex-shrink-0",
    active ? "!font-bold !bg-white/[0.18]" : "!font-medium !bg-transparent",
    "hover:!bg-white/[0.12]",
  ].join(" ");
}

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
    if (!l.section) return true;
    if (l.section === "super_admin") return isSuper;
    return isSuper || allowedSections.includes(l.section);
  });

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const langSwitcher = (
    <>
      <IconButton
        size="small"
        onClick={(e) => setLangMenuAnchor(e.currentTarget)}
        className="!text-inherit !border !border-white/25 !rounded-lg !px-2 !py-1"
        aria-label="Change language"
      >
        <LanguageIcon fontSize="small" className="!mr-1" />
        <Typography variant="caption" className="!font-semibold">
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
            <Typography variant="caption" className="!ml-2 !text-brand-text-light">
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
          className="!bg-white !text-brand-maroon !border-b !border-brand-sand"
          elevation={0}
          component="nav"
          aria-label="Main navigation"
        >
          <Toolbar>
            {/* Brand → home */}
            <Box
              component={Link}
              href="/"
              className="flex items-center gap-2 text-inherit no-underline shrink-0"
            >
              <Image src="/spbsp-logo.png" alt={t("brand.name")} width={36} height={36} priority />
              <Typography
                className={`${BRAND_LOGO_CLASS} !text-inherit !text-[1.1rem] md:!text-[1.4rem]`}
              >
                {t("brand.short")}
              </Typography>
            </Box>
            <Box className="grow" />

            {/* Desktop: inline nav + lang + auth buttons */}
            <Box className="hidden md:flex items-center gap-1 mr-2">
              {publicLinks.map((l) => (
                <Button
                  key={l.href}
                  component={Link}
                  href={l.href}
                  className="!text-brand-maroon !font-medium !px-4"
                >
                  {l.label}
                </Button>
              ))}
            </Box>
            <Box className="hidden md:flex items-center gap-2">
              {langSwitcher}
              <Button
                component={Link}
                href="/login"
                className="!text-brand-maroon !font-medium !px-4"
              >
                {t("common.login")}
              </Button>
              <Button component={Link} href="/register" variant="contained" color="primary">
                {t("common.register")}
              </Button>
            </Box>

            {/* Mobile: hamburger */}
            <IconButton
              onClick={() => setDrawerOpen(true)}
              className="!flex md:!hidden !text-inherit"
              aria-label="Open menu"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Mobile drawer for public users */}
        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box className="w-[260px] sm:w-[300px] pt-4" role="presentation">
            <List>
              {publicLinks.map((l) => (
                <ListItem key={l.href} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={l.href}
                    selected={pathname === l.href}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemText primary={l.label} slotProps={{ primary: { className: "!font-semibold" } }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider />
            <Box className="p-4 flex flex-col gap-2.5">
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
            <Box className="p-4">
              <Typography variant="caption" color="text.disabled" className="!block !mb-2">
                Language
              </Typography>
              <Box className="flex gap-2 flex-wrap">
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
        className="!text-white"
        style={{ background: isAdmin ? ADMIN_BAR_GRADIENT : USER_BAR_GRADIENT }}
        elevation={0}
        component="nav"
        aria-label="Main navigation"
      >
        <Toolbar>
          <Box
            component={Link}
            href={isAdmin ? "/admin" : "/dashboard"}
            className="flex items-center gap-2 text-inherit no-underline min-w-0 shrink overflow-hidden"
          >
            <Image
              src="/spbsp-logo.png"
              alt={t("brand.name")}
              width={36}
              height={36}
              priority
              style={{ flexShrink: 0 }}
            />
            <Typography
              className={`${BRAND_LOGO_CLASS} !text-inherit !min-w-0 !overflow-hidden !text-ellipsis !text-[0.95rem] sm:!text-[1.1rem] md:!text-[1.4rem]`}
            >
              {t("brand.short")}
              {/* ADMIN / MODERATOR suffix hides on xs so the toolbar fits the
                  brand + bell + hamburger on a 360-wide phone. */}
              {role === "admin" && (
                <Box component="span" className="hidden sm:inline text-[0.7em] opacity-80">
                  {" "}· ADMIN
                </Box>
              )}
              {role === "moderator" && (
                <Box component="span" className="hidden sm:inline text-[0.7em] opacity-80">
                  {" "}· MODERATOR
                </Box>
              )}
            </Typography>
          </Box>

          {/* Admin nav (~11 entries) overflows even at lg, so admins always
              use the hamburger drawer. Regular users only have 6 entries and
              keep the inline experience from the lg breakpoint up. */}
          {!isAdmin && (
            <Box className="hidden lg:flex gap-1 ml-4 grow flex-nowrap overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {links.map((l) => (
                <Button
                  key={l.href}
                  component={Link}
                  href={l.href}
                  startIcon={l.icon}
                  className={navLinkClass(pathname === l.href)}
                >
                  {t(l.labelKey)}
                </Button>
              ))}
            </Box>
          )}

          {!isAdmin && (
            <Box className="hidden lg:flex items-center gap-3">
              <IconButton onClick={toggleMode} className="!text-white" aria-label="Toggle dark mode">
                {mode === "dark" ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
              <NotificationBell ariaLabel={t("nav.notifications")} />
              {langSwitcher}
              <Button
                component={Link}
                href={profileHref}
                startIcon={<AccountCircleIcon />}
                className={`!text-white !normal-case !font-semibold hover:!bg-white/20 ${
                  pathname === profileHref ? "!bg-white/20" : "!bg-white/[0.08]"
                }`}
              >
                {name || t("nav.profile")}
              </Button>
              <IconButton
                onClick={logout}
                className="!text-white !bg-white/[0.08] hover:!bg-white/[0.18]"
                aria-label={t("common.logout")}
              >
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Box>
          )}

          {/* Admins: keep the notification bell visible on the bar even when
              the rest collapses to the drawer — unread broadcasts are the
              one signal worth surfacing without opening the menu. shrink-0
              guarantees the hamburger is always reachable even when the brand
              text is wide. */}
          {isAdmin && (
            <Box className="flex items-center gap-1 ml-auto shrink-0">
              <NotificationBell ariaLabel={t("nav.notifications")} />
            </Box>
          )}

          <IconButton
            className={`!text-white !shrink-0 ${
              isAdmin ? "!flex" : "!flex lg:!hidden !ml-auto"
            }`}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box className="w-[260px] sm:w-[300px] pt-4" role="presentation">
          <Button
            component={Link}
            href={profileHref}
            startIcon={<AccountCircleIcon />}
            onClick={() => setDrawerOpen(false)}
            className="!px-4 !py-3 !justify-start !font-bold !text-brand-saffron"
          >
            {name || t("nav.profile")}
          </Button>
          <Divider className="!my-2" />
          <List>
            {links.map((l) => (
              <ListItem key={l.href} disablePadding>
                <ListItemButton component={Link} href={l.href} onClick={() => setDrawerOpen(false)}>
                  <ListItemIcon className="!min-w-9">{l.icon}</ListItemIcon>
                  <ListItemText primary={t(l.labelKey)} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <Box className="p-4">
            <Button
              size="small"
              onClick={toggleMode}
              startIcon={mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
              className="!mb-2"
            >
              {mode === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            <Typography variant="caption" color="text.disabled">
              Language
            </Typography>
            <Box className="flex gap-2 mt-2 flex-wrap">
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
                <ListItemIcon className="!min-w-9">
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
