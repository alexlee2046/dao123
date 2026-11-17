import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    testMatch: 'standalone.smoke.spec.ts',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: { baseURL: 'http://127.0.0.1:3006' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: {
        command: 'node .next/standalone/server.js',
        url: 'http://127.0.0.1:3006/health',
        env: { HOSTNAME: '127.0.0.1', PORT: '3006', SHADOW_NOINDEX: '1' },
        reuseExistingServer: false,
    },
});
