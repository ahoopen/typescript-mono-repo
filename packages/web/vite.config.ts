import { defineConfig } from "vite";
import "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    watch: false,
    deps: {
      registerNodeLoader: true
    }
  },
});
