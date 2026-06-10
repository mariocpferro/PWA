import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
});

const baseConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSerwist(baseConfig);
