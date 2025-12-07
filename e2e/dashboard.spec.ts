import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('仪表盘与导航测试', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('仪表盘页面正确加载', async ({ page }) => {
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('main, [role="main"], .container').first()).toBeVisible();
    });

    test('侧边栏导航功能', async ({ page }) => {
        // 图像生成
        const imageLink = page.locator('a[href*="generate/image"], a:has-text("AI 图片")').first();
        if (await imageLink.isVisible()) {
            await imageLink.click();
            await expect(page).toHaveURL(/.*generate\/image/);
        }

        // 返回仪表盘
        await page.goto('/dashboard');

        // 社区
        const communityLink = page.locator('a[href*="community"], nav a:has-text("社区")').first();
        if (await communityLink.isVisible()) {
            await communityLink.click();
            await expect(page).toHaveURL(/.*community/);
        }
    });

    test('性能测试 - 仪表盘加载', async ({ page }) => {
        const startTime = Date.now();
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(10000);
        console.log(`仪表盘加载时间: ${loadTime}ms`);
    });
});
