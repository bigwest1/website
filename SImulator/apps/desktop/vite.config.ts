import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@course-creator-os/agent-system": fileURLToPath(
        new URL("../../packages/agent-system/src/index.ts", import.meta.url),
      ),
      "@course-creator-os/ui": fileURLToPath(
        new URL("../../packages/ui/src/index.ts", import.meta.url),
      ),
      "@course-creator-os/project-model": fileURLToPath(
        new URL("../../packages/project-model/src/index.ts", import.meta.url),
      ),
      "@course-creator-os/validation": fileURLToPath(
        new URL("../../packages/validation/src/index.ts", import.meta.url),
      ),
      "@course-creator-os/performance": fileURLToPath(
        new URL("../../packages/performance/src/index.ts", import.meta.url),
      ),
      "@course-creator-os/packaging": fileURLToPath(
        new URL("../../packages/packaging/src/index.ts", import.meta.url),
      )
    }
  },
  server: {
    port: 1420,
    strictPort: true
  },
  preview: {
    port: 4173,
    strictPort: true
  }
});
