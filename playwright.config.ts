import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: process.env.FORMA_TEST_URL ?? "http://127.0.0.1:5173",
    timezoneId: "Asia/Shanghai",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath:
            process.env.FORMA_CHROME_PATH ??
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        },
      },
    },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  reporter: [["list"], ["json", { outputFile: "evidence/e2e-results.json" }]],
});
