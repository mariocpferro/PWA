import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack(config, { nextRuntime, webpack }) {
    if (nextRuntime === "edge") {
      // Fix: __dirname is not defined in Vercel's Edge Runtime.
      // Next.js bundles @opentelemetry/api which contains:
      //   __nccwpck_require__.ab = __dirname + "/"
      // On Windows the webpack DefinePlugin already replaces __dirname with "/",
      // but on Linux (Vercel) it doesn't — this explicitly covers that case.
      config.plugins.push(
        new webpack.DefinePlugin({ __dirname: JSON.stringify("/") })
      );
    }
    return config;
  },
};

export default withPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^\/api\/dashboard/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "api-dashboard",
          expiration: { maxEntries: 1, maxAgeSeconds: 60 },
        },
      },
      {
        urlPattern: /^\/api\/receipts/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-receipts",
          networkTimeoutSeconds: 5,
        },
      },
    ],
  },
})(nextConfig);
