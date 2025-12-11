import { Page, expect } from '@playwright/test';

export const TEST_USER = {
    email: process.env.TEST_EMAIL || 'admin@dao123.me',
    password: process.env.TEST_PASSWORD || 'ningping'
};

export async function login(page: Page) {
    console.log('[Login] Starting login flow...');
    console.log(`[Login] Navigating to /login...`);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    // await page.waitForLoadState('networkidle'); // Removing flaky wait
    await page.waitForTimeout(2000); // 额外等待客户端渲染
    console.log(`[Login] Current URL: ${page.url()}`);

    // Check if already logged in
    if (page.url().includes('/dashboard')) {
        console.log('[Login] Already on dashboard, skipping login.');
        return;
    }

    try {
        console.log('[Login] Waiting for email input...');
        // Try multiple selectors
        const emailInput = page.locator('input[id="email"]').or(page.getByPlaceholder('name@example.com'));
        await emailInput.waitFor({ state: 'visible', timeout: 30000 });
        await expect(emailInput).toBeEditable({ timeout: 10000 });
        await emailInput.fill(TEST_USER.email);

        console.log('[Login] Filling password...');
        const pwInput = page.locator('input[id="password"]');
        await pwInput.waitFor({ state: 'visible', timeout: 10000 });
        await pwInput.fill(TEST_USER.password);

        console.log('[Login] Submitting...');
        // Dismiss potential Next.js error overlay
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        await page.click('button[type="submit"]', { force: true });
    } catch (e) {
        console.error('Login interaction failed:', e);
        console.log('Current URL on failure:', page.url());
        await page.screenshot({ path: 'test-results/login-failure.png' });
        throw e;
    }

    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
    await expect(page).toHaveURL(/.*dashboard/);
}
