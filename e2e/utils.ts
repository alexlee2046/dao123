import { Page, expect } from '@playwright/test';

export const TEST_USER = {
    email: process.env.TEST_EMAIL || 'admin@dao123.me',
    password: process.env.TEST_PASSWORD || 'ningping'
};

export async function login(page: Page, maxRetries = 2) {
    console.log('[Login] Starting login flow...');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        console.log(`[Login] Attempt ${attempt + 1}/${maxRetries + 1}`);

        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        console.log(`[Login] Current URL: ${page.url()}`);

        // Check if already logged in
        if (page.url().includes('/dashboard')) {
            console.log('[Login] Already on dashboard.');
            return;
        }

        try {
            // Wait for and fill email
            const emailInput = page.locator('input[id="email"]').or(page.getByPlaceholder('name@example.com'));
            await emailInput.waitFor({ state: 'visible', timeout: 15000 });
            await emailInput.fill(TEST_USER.email);

            // Fill password
            const pwInput = page.locator('input[id="password"]');
            await pwInput.waitFor({ state: 'visible', timeout: 10000 });
            await pwInput.fill(TEST_USER.password);

            // Dismiss potential overlays and submit
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
            await page.click('button[type="submit"]', { force: true });
            console.log('[Login] Form submitted.');

            // Wait for navigation with multiple strategies
            try {
                await Promise.race([
                    page.waitForURL(/.*dashboard/, { timeout: 20000 }),
                    page.waitForURL(/.*studio/, { timeout: 20000 }),
                    page.waitForSelector('[data-testid="dashboard"]', { timeout: 20000 }),
                    page.waitForSelector('h1:has-text("我的创造")', { timeout: 20000 })
                ]);
                console.log('[Login] Navigation successful.');
                return;
            } catch (navError) {
                // Check if we're actually on dashboard despite timeout
                const currentUrl = page.url();
                if (currentUrl.includes('/dashboard') || currentUrl.includes('/studio')) {
                    console.log('[Login] Already navigated (late detection).');
                    return;
                }
                console.log(`[Login] Navigation timeout, URL: ${currentUrl}`);

                // If not last attempt, retry
                if (attempt < maxRetries) {
                    console.log('[Login] Retrying...');
                    await page.waitForTimeout(2000);
                    continue;
                }
            }
        } catch (e) {
            console.error(`[Login] Error on attempt ${attempt + 1}:`, e);
            if (attempt === maxRetries) throw e;
        }
    }

    // Final fallback: navigate directly if we have a session
    console.log('[Login] All attempts failed, trying direct navigation...');
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    if (!page.url().includes('/dashboard')) {
        throw new Error('Login failed after all retries');
    }
}

