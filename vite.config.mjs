import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createScanHandler } from "./server/scan-service.mjs";

export default defineConfig(({mode})=>({
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), {
    name: 'local-floor-plan-ai',
    configureServer(server) {
      const handler=createScanHandler({env:{...loadEnv(mode,process.cwd(),''),...process.env}});
      server.middlewares.use('/api/scan-floor-plan',handler);
    }
  }],
}));
