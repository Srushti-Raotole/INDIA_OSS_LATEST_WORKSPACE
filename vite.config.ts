import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],

    // Reads VITE_APP_BASE from .env.development or .env.production
    base: env.VITE_APP_BASE || "/uitest/",

    server: {
      port: 7070,
      proxy: {
        "/indiabackend": {
          target: "http://10.27.144.225:8080",
          changeOrigin: true,
          ws: true,
        },
      },
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    optimizeDeps: {
      include: ["sockjs-client", "@stomp/stompjs"],
    },

    define: {
      global: "window",
    },
  };
});
