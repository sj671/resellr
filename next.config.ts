import type { NextConfig } from "next";
import withPWA from "next-pwa";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: process.env.ANALYZE === "true" });

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const baseConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(
  withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: !isProd,
  })(baseConfig),
);
