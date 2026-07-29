import "dotenv/config";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: false,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL!,
      SESSION_SECRET: "test-only-secret-not-for-production-0123456789",
      NODE_ENV: "test",
    },
    fileParallelism: false,
    testTimeout: 15000,
    setupFiles: ["./tests/setup.ts"],
  },
});
