import type { NextConfig } from "next";

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

export default withAnalyzer(nextConfig);
