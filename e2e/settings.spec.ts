import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('设置页面测试', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('设置页面加载', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.locator('main')).toBeVisible();
    });

    test('API 密钥输入框状态', async ({ page }) => {
        await page.goto('/settings');
        const apiKeyInput = page.locator('input[type="password"], input[placeholder*="API"]').first();
        if (await apiKeyInput.isVisible()) {
            await expect(apiKeyInput).toBeEnabled();
        }
    });
});
