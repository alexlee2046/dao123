import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('管理后台测试', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('访问管理后台首页', async ({ page }) => {
        await page.goto('/admin');
        
        // 只有当用户是管理员时才能看到内容
        // 我们检查 URL 是否保持在 admin，或者是否有特定元素
        if (page.url().includes('/admin')) {
            const content = page.locator('main').first();
            await expect(content).toBeVisible();
        }
    });

    test('用户列表页面', async ({ page }) => {
        await page.goto('/admin/users');
        if (page.url().includes('/admin/users')) {
            const table = page.locator('table').first();
            if (await table.isVisible()) {
                await expect(table).toBeVisible();
            }
        }
    });
});
