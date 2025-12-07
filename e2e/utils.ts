import { Page, expect } from '@playwright/test';

export const TEST_USER = {
    email: 'admin@dao123.me',
    password: 'ningping'
};

export async function login(page: Page) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check if already logged in
    if (page.url().includes('/dashboard')) {
        return;
    }

    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await expect(page).toHaveURL(/.*dashboard/);
}
