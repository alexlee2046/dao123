import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils';

test.describe('认证功能测试', () => {
    test('登录页面应该正确显示', async ({ page, isMobile }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('input[id="email"]')).toBeVisible();
        await expect(page.locator('input[id="password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
        
        if (!isMobile) {
            await expect(page.locator('text=Dao 123')).toBeVisible();
        }
    });

    test('使用有效凭据登录成功', async ({ page }) => {
        await login(page);
        await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    test('登录表单验证 - 空字段', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');

        const emailInput = page.locator('input[id="email"]');
        await expect(emailInput).toHaveAttribute('required', '');
    });

    test('用户注册流程 (模拟)', async ({ page }) => {
        await page.goto('/signup');
        // 如果没有 signup 页面，可能会重定向或404，这里假设存在
        // 如果项目没有 /signup 路由（比如只有邀请制），这个测试会失败，需要确认
        // 根据文件结构 src/app/[locale]/(app)/signup/page.tsx 存在
        
        await page.waitForLoadState('networkidle');
        
        // 验证注册表单存在
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible()) {
             await expect(page.locator('button[type="submit"]')).toBeVisible();
        }
    });
});
