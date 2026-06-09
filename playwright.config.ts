import { defineConfig, devices } from "@playwright/test";
import { withE2eSupabaseEnv } from "./e2e/ci-env";

const port = Number(process.env.PORT || 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        // En CI el build va en un paso aparte (evita OOM al compilar dentro del webServer).
        command: process.env.CI ? "npm run start" : "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: process.env.CI ? 120_000 : 300_000,
        env: {
          ...withE2eSupabaseEnv(process.env),
          NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--max-old-space-size=4096",
          PORT: String(port),
        },
      },
});
