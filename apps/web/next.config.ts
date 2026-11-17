

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Local MinIO
      { protocol: "http", hostname: "localhost", port: "9000" },
      // Production CDN — update later
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    // Optimizes package imports for large UI libraries (future-proof)
    optimizePackageImports: [],
  },
};

export default withNextIntl(nextConfig);