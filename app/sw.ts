import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  ExpirationPlugin,
  NetworkFirst,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: /^\/api\/dashboard/,
      handler: new StaleWhileRevalidate({
        cacheName: "api-dashboard",
        plugins: [new ExpirationPlugin({ maxEntries: 1, maxAgeSeconds: 60 })],
      }),
    },
    {
      matcher: /^\/api\/receipts/,
      handler: new NetworkFirst({
        cacheName: "api-receipts",
        networkTimeoutSeconds: 5,
      }),
    },
    {
      matcher: /^\/uploads\//,
      handler: new NetworkFirst({
        cacheName: "uploads",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
        ],
      }),
    },
    {
      matcher: /^\/api\/uploads\//,
      handler: new NetworkFirst({
        cacheName: "api-uploads",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
        ],
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
