import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:3000",
    channel: "chrome",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: false,
    env: {
      NGOCNHU_TEST_DRIVE_DIR: "/tmp/ngocnhu-pw-drive",
      APP_SESSION_SECRET: "test-only-ngocnhu-session-secret-32b!",
    },
  },
});
