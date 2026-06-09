import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const baseConfig: NextConfig = {
  reactStrictMode: true,
};

const finalConfig = withPWA({
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
})(baseConfig);

// Fix: @opentelemetry/api (bundled via ncc by next-auth) uses __dirname
// which is undefined in Vercel's Edge Runtime on Linux. We patch the
// webpack function AFTER withPWA wraps the config so the DefinePlugin
// is guaranteed to run regardless of how withPWA chains webpack.
const pwaWebpack = finalConfig.webpack;
finalConfig.webpack = function (config, options) {
  const result = pwaWebpack ? pwaWebpack(config, options) : config;
  if (options.nextRuntime === "edge") {
    result.plugins.push(
      new options.webpack.DefinePlugin({ __dirname: JSON.stringify("/") })
    );
  }
  return result;
};

export default finalConfig;
