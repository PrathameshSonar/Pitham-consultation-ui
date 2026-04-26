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
    // Build CSP from the same env vars we use elsewhere so it stays in sync
    // with whichever backend the frontend talks to. We can't fully lock down
    // script-src without first wiring nonce/hash generation through the
    // server components, so 'unsafe-inline' + 'unsafe-eval' are kept for now —
    // CSP still buys us the explicit allowlist for outbound script/connect/
    // frame origins, which is the bulk of the value for our threat model
    // (XSS exfil + clickjacking + unintended third-party loads).
    const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "")
      .replace(/\/$/, "");
    const csp = [
      "default-src 'self'",
      // Sentry, Google Sign-In, Razorpay checkout. Inline + eval are still
      // permitted to keep Next.js / MUI working — see comment above.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://*.razorpay.com https://*.sentry.io",
      // MUI emits inline styles; Google fonts/MUI ship CSS from gstatic too.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      // data: for inline SVGs we generate at runtime; blob: for in-app PDF previews.
      "img-src 'self' data: blob: https:",
      // Razorpay popup, Google Sign-In iframe, embedded Google Maps on the contact page.
      "frame-src 'self' https://*.razorpay.com https://accounts.google.com https://www.google.com https://*.google.com",
      // XHR/fetch targets: same-origin (Sentry tunnel, internal APIs) + the
      // backend host, plus Google/Razorpay for direct calls.
      [
        "connect-src 'self'",
        apiOrigin,
        "https://accounts.google.com",
        "https://*.razorpay.com",
        "https://*.sentry.io",
      ]
        .filter(Boolean)
        .join(" "),
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
