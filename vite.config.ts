import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["soleia-icon.png", "apple-touch-icon.png", "soleia-icon-192.png", "soleia-icon-512.png", "soleia-icon-maskable-512.png", "favicon.ico"],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // /screens-guide is a static page in public/, not an app route: the
        // worker must let the browser fetch it instead of serving the shell.
        navigateFallbackDenylist: [/^\/~oauth/, /^\/screens-guide/],
        // Shell only. This used to include png and svg, which pulled every
        // image in public/ into the precache -- 29 MB of the 33 MB a first
        // visit downloaded, most of it mapping diagrams nobody had opened.
        // Images now load on demand; the app icons stay precached through
        // includeAssets above.
        globPatterns: ["**/*.{js,css,html,ico,woff2}"],
        // pdf.js loads only when a client opens a deck; it is not part of the shell.
        // The screens guide is one 9 MB self-contained page; it loads on demand.
        globIgnores: ["**/pdf-*.js", "**/pdf.worker*", "**/screens-guide/**"],
      },
      manifest: {
        name: "Soleia Creative",
        short_name: "Soleia",
        description: "Soleia Creative — jobs, packets, proposals and creative sessions",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#14161A",
        // Charcoal: the band the OS paints around an installed window.
        theme_color: "#1D2027",
        // Any: iPad landscape and iPhone landscape are supported layouts, and
        // portrait-primary locked an installed copy upright where it is honoured.
        orientation: "any",
        // Square, at the sizes they claim to be. The old entries pointed both
        // at one 450x469 file and called it "any maskable", so a launcher
        // cropping to a circle cut into the sun.
        icons: [
          { src: "/soleia-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/soleia-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/soleia-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
