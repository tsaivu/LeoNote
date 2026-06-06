import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["lion.png"],
      manifest: {
        name: "Leo Task Management",
        short_name: "Leo Tasks",
        description: "Personal task, project, deadline and assignee management.",
        theme_color: "#1e40af",
        background_color: "#f9f9ff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/lion.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/lion.png",
            sizes: "1024x1024",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/"),
            handler: "NetworkOnly",
            method: "GET",
          },
          {
            urlPattern: ({ sameOrigin }) => !sameOrigin,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 9110,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 9110,
    strictPort: true,
  },
});
