import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Optimize images from backend uploads
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Security headers
  async headers() {
    // Build CSP off the same env vars the frontend already uses so the
    // allowlist tracks whichever backend it's actually talking to. We can't
    // fully lock down script-src without wiring nonce/hash generation through
    // every Server Component, so 'unsafe-inline' + 'unsafe-eval' stay for
    // now — the value of CSP here is the explicit outbound allowlist for
    // script/connect/frame origins, not inline-script blocking.
    const isDev = process.env.NODE_ENV !== "production";
    const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

    // In dev the backend is on localhost:8000 by convention. We add it
    // unconditionally so a fresh checkout without NEXT_PUBLIC_API_URL set
    // doesn't silently lose its connect-src and break every fetch.
    const devApiOrigins = isDev ? ["http://localhost:8000"] : [];

    // No production fallback — NEXT_PUBLIC_API_URL must be set as a
    // build-time env var on the deployment platform. Hardcoding a default
    // here would re-create the breakage every time the backend domain
    // moves. If the var is missing in a prod build, connect-src will not
    // include the API origin and fetches will fail loudly — that's the
    // intended signal to fix the env config, not paper over it here.

    // Google reCAPTCHA loads its widget script + frame from www.google.com,
    // pulls assets from www.gstatic.com, and posts solve XHRs back to
    // www.google.com / www.recaptcha.net. Missing any of these breaks the
    // captcha entirely (silent — the iframe just never loads).
    const recaptchaScript = ["https://www.google.com", "https://www.gstatic.com"];
    const recaptchaFrame = ["https://www.google.com", "https://www.recaptcha.net"];
    const recaptchaConnect = ["https://www.google.com", "https://www.recaptcha.net"];

    const csp = [
      "default-src 'self'",
      [
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "https://accounts.google.com",
        "https://*.razorpay.com",
        "https://*.sentry.io",
        ...recaptchaScript,
      ].join(" "),
      // MUI emits inline styles; Google fonts ship CSS from googleapis;
      // Google Sign-In's GSI button pulls /gsi/style from accounts.google.com.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // data: for inline SVGs we generate at runtime; blob: for in-app PDF previews.
      "img-src 'self' data: blob: https:",
      // Razorpay popup, Google Sign-In iframe, embedded Google Maps on the
      // contact page, reCAPTCHA challenge frame.
      [
        "frame-src 'self'",
        "https://*.razorpay.com",
        "https://accounts.google.com",
        "https://*.google.com",
        ...recaptchaFrame,
      ].join(" "),
      // XHR/fetch targets: same-origin (Sentry tunnel, internal APIs), the
      // backend host, Google/Razorpay direct calls, reCAPTCHA solve endpoint.
      [
        "connect-src 'self'",
        ...(apiOrigin ? [apiOrigin] : []),
        ...devApiOrigins,
        "https://accounts.google.com",
        "https://*.razorpay.com",
        "https://*.sentry.io",
        ...recaptchaConnect,
      ].join(" "),
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Belt-and-braces alongside X-Frame-Options DENY below.
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Google Sign-In opens a popup and uses window.postMessage to return
          // the credential. Default `same-origin` blocks that — `same-origin-allow-popups`
          // keeps cross-origin isolation on but lets our own popups talk back.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },

  // Remove console in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Standalone output for Docker deployments
  output: "standalone",

  // Powered by header disabled
  poweredByHeader: false,

  // Tree-shake heavy libraries — emits per-icon imports automatically.
  // Without this, importing one MUI icon pulls the whole library into the bundle.
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "@mui/x-date-pickers", "recharts"],
  },
};

// Wrap with @next/bundle-analyzer when ANALYZE=true. Run `npm run analyze`
// to open an interactive treemap of every chunk in the build.
const withAnalyzer =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@next/bundle-analyzer")({ enabled: true })
    : (cfg: NextConfig) => cfg;

// Only wrap with Sentry when an org/project is configured. Otherwise the
// build still succeeds but Sentry's plugin no-ops cleanly at runtime.
const sentryEnabled = !!process.env.SENTRY_ORG && !!process.env.SENTRY_PROJECT;
const withSentry = sentryEnabled
  ? (cfg: NextConfig) =>
      withSentryConfig(cfg, {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        silent: true,
        widenClientFileUpload: true,
        disableLogger: true,
        tunnelRoute: "/monitoring",
      })
  : (cfg: NextConfig) => cfg;

export default withSentry(withAnalyzer(nextConfig));
