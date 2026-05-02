/**
 * API base URL. In `vite` dev we always use `/api` (Vite proxy) so a leftover `VITE_API_URL` in `.env`
 * cannot force cross-origin requests. Production uses `VITE_API_URL` or same-origin `/api`.
 */
export function apiBaseUrl() {
  if (import.meta.env.DEV) return "/api";
  const v = import.meta.env.VITE_API_URL?.trim();
  if (v) return v.replace(/\/$/, "");
  return "/api";
}

/** WebSocket URL; in dev, same host as the page so Vite proxies `/ws` (ignores `VITE_WS_URL`). */
export function wsUrl() {
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${window.location.host}/ws`;
  }
  const v = import.meta.env.VITE_WS_URL?.trim();
  if (v) {
    if (v.startsWith("ws://") || v.startsWith("wss://")) return v;
    if (v.startsWith("https://")) return "wss://" + v.slice("https://".length);
    if (v.startsWith("http://")) return "ws://" + v.slice("http://".length);
    return v;
  }
  return "ws://127.0.0.1:8080/ws";
}
