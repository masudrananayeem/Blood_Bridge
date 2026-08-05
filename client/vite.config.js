import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiOrigin = env.API_PROXY_ORIGIN;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Keep the backend origin out of the browser: proxy /api to the Worker
      // so the Network tab only ever shows http://localhost:5173/api/...
      // Target comes from env (API_PROXY_ORIGIN, a non-VITE_ var so it is
      // never inlined into the client bundle) — no URL is hardcoded here.
      proxy: apiOrigin
        ? {
            "/api": {
              target: apiOrigin,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    build: {
      outDir: "dist",
      // Split heavy vendor chunks so the first paint doesn't
      // have to wait for the entire app bundle to download.
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-firebase": ["firebase/app", "firebase/auth"],
            "vendor-motion": ["framer-motion"],
            "vendor-charts": ["recharts"],
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
  };
});
