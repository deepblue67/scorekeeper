import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testIgnore: "**/*.unit.test.js",
  fullyParallel: false,
  workers: 1,
  timeout: 20_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    channel: "chrome",
    viewport: { width: 390, height: 844 },
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    serviceWorkers: "block",
    trace: "retain-on-failure"
  },
  webServer: process.env.PLAYWRIGHT_NO_SERVER ? undefined : {
    command: "node scripts/serve.mjs",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true
  }
});
