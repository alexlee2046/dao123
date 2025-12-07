import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false, // 禁用并行运行，因为测试间有依赖
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['html', { open: 'never' }],
        ['list']
    ],
    use: {
        baseURL: 'http://localhost:3006',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
    ],
    timeout: 60000,
    expect: {
        timeout: 10000,
    },

    /* Run your local dev server before starting the tests */
    webServer: {
        command: process.env.CI ? 'npm run start -- -p 3006' : 'npm run dev -- -p 3006',
        url: 'http://localhost:3006',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
