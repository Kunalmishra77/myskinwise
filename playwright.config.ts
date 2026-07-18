import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the marketing-site E2E smoke + axe accessibility
 * suites (Task 24). The `webServer` block builds a production bundle and
 * boots it with `next start` — the axe/Lighthouse-grade checks in this repo
 * intentionally run against the production build, not `next dev`, so
 * timings and output match what actually ships.
 *
 * `reuseExistingServer` is `true` outside CI so a server already running
 * locally (e.g. `npm run start` in another terminal) is reused instead of
 * rebuilding on every `npm run e2e` invocation; CI always starts fresh.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
