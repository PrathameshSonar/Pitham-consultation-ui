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
};

export default nextConfig;
