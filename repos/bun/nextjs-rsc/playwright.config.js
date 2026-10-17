import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:3237",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bun run start",
    url: "http://127.0.0.1:3237",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
