import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Proxy /api and /ws to Spring Boot. Used for both `vite` and `vite preview`. */
function devProxy(env) {
  const raw = env.VITE_DEV_PROXY_TARGET || "http://127.0.0.1:8080";
  const httpTarget = raw.replace(/\/$/, "");
  const wsTarget = httpTarget.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://");
  return {
    "/api": {
      target: httpTarget,
      changeOrigin: true,
      timeout: 7_200_000,
      proxyTimeout: 7_200_000,
      secure: false
    },
    "/ws": {
      target: wsTarget,
      ws: true,
      changeOrigin: true,
      secure: false
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxy = devProxy(env);

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy
    },
    // Without this, `vite preview` has no proxy — `/api` hits the preview server and fails (Network Error).
    preview: {
      port: 4173,
      proxy
    }
  };
});
