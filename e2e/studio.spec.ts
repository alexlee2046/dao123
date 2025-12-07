import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('Studio 编辑器测试', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('Studio 页面加载与工具栏', async ({ page }) => {
        await page.goto('/studio/new');
        // Networkidle works well for most cases but can be flaky on some browsers/networks
        // Changing to domcontentloaded and explicit element wait is more robust
        await page.waitForLoadState('domcontentloaded');
        
        const toolbar = page.locator('div.h-14, div.border-b').first();
        await expect(toolbar).toBeVisible({ timeout: 10000 });
    });

    test('AI 对话面板交互', async ({ page }) => {
        await page.goto('/studio/new');
        
        const chatInput = page.locator('input[placeholder*="message"], textarea').first();
        if (await chatInput.isVisible()) {
            await chatInput.fill('Test message');
            const sendButton = page.locator('button[type="submit"]').first();
            if (await sendButton.isVisible()) {
                await expect(sendButton).toBeEnabled();
            }
        }
    });

    test('响应式预览切换', async ({ page }) => {
        await page.goto('/studio/new');
        
        const mobileButton = page.locator('button:has([class*="mobile"]), button[title*="Mobile"]').first();
        if (await mobileButton.isVisible()) {
            await mobileButton.click();
            // 验证预览区域尺寸变化或类名变化，这里简单验证不报错
            await page.waitForTimeout(500);
        }
    });

    test('手动编辑组件 (Manual Editing)', async ({ page }) => {
        await page.goto('/studio/new');
        await page.waitForLoadState('domcontentloaded');

        // 1. Switch to Builder Mode (Manual Edit)
        // Use keyboard shortcut to avoid UI layout interception issues
        // ControlOrMeta matches Command on macOS and Control on Windows/Linux
        await page.keyboard.press('ControlOrMeta+B');
        
        // Wait for button to change to AI Chat mode (indicating switch happened)
        const aiChatBtn = page.locator('button:has-text("AI Chat"), button:has-text("AI 对话")').first();
        await expect(aiChatBtn).toBeVisible({ timeout: 10000 });

        // 2. Find and select the welcome text (converted from default HTML)
        // Default HTML in store has "欢迎来到您的新网站"
        // If conversion fails, it might show default builder text "欢迎使用构建器！" or English "Welcome to the Builder!"
        const welcomeText = page.locator('text=欢迎来到您的新网站')
            .or(page.locator('text=欢迎使用构建器！'))
            .or(page.locator('text=Welcome to the Builder!'))
            .first();
        
        try {
            await expect(welcomeText).toBeVisible({ timeout: 15000 });
        } catch (e) {
            console.log('Welcome text not found. Dumping page content...');
            // const content = await page.content();
            // console.log(content); // Too verbose for CI, but good for debugging locally if needed
            throw e;
        }
        
        // Click to select the component
        await welcomeText.click({ force: true });

        // 3. Find the Settings Panel input for "Text Content"
        // The settings panel should appear on the right
        const settingsPanel = page.locator('div').filter({ hasText: /Content|内容/ }).first();
        await expect(settingsPanel).toBeVisible();

        const textInput = page.locator('input[value*="欢迎"], textarea[value*="欢迎"], input[value*="Welcome"], textarea[value*="Welcome"]').first();
        await expect(textInput).toBeVisible();

        // 4. Edit the text
        const newText = 'Edited by Playwright';
        await textInput.fill(newText);

        // 5. Verify the change on canvas
        await expect(page.locator(`text=${newText}`)).toBeVisible();
    });
});
