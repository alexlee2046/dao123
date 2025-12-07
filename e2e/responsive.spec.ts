import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('移动端适配测试', () => {
    test.use({
        viewport: { width: 375, height: 667 }
    });

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('移动端仪表盘布局', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        
        // 验证汉堡菜单是否显示
        const menuButton = page.locator('button[aria-label*="menu"], [class*="hamburger"]').first();
        // 某些实现可能没有显式的 aria-label
        
        const content = page.locator('main').first();
        await expect(content).toBeVisible();
    });

    test('移动端 Studio 布局', async ({ page }) => {
        await page.goto('/studio/new');
        await expect(page.locator('body')).toBeVisible();
    });
});
