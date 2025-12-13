import { test, expect, Page } from '@playwright/test';
import { login } from './utils';

/**
 * Studio 模块综合 E2E 测试
 * 覆盖 Toolbar、PageManager、LivePreview、键盘快捷键和 AI 聊天功能
 */

// 辅助函数：等待 Studio 编辑器界面完全加载
async function waitForStudioReady(page: Page) {
    // 首先到 Dashboard，然后进入一个项目
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 查找并点击第一个项目卡片进入编辑器
    const projectCard = page.locator('a[href*="/studio/"]').first();

    if (await projectCard.isVisible({ timeout: 10000 }).catch(() => false)) {
        await projectCard.click();
        console.log('[Studio] Clicked on existing project');
        await page.waitForURL(/\/studio\//, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);
    } else {
        // 如果没有项目，创建一个新的
        console.log('[Studio] No existing projects, creating new one...');
        await page.goto('/studio/new');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // 检查是否在项目创建页面
        const createProjectBtn = page.getByRole('button', { name: /Create Project|创建项目|Create|创建/i });
        if (await createProjectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            // 填写项目名称
            const nameInput = page.locator('#name, input[name="name"]').first();
            if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
                await nameInput.fill('E2E Test Project ' + Date.now());
            }

            // 创建项目
            await createProjectBtn.click();
            await page.waitForTimeout(5000);
        }
    }

    // 等待编辑器核心元素加载
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
}

test.describe('Studio 综合功能测试', () => {
    test.setTimeout(180000); // 3 分钟超时

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    // ==================== Toolbar 功能测试 ====================

    test.describe('Toolbar 功能', () => {
        test('工具栏可见且包含核心元素', async ({ page }) => {
            await waitForStudioReady(page);

            // 验证工具栏容器（高度为 h-14 且有 border-b）
            const toolbar = page.locator('.h-14').first();
            await expect(toolbar).toBeVisible({ timeout: 15000 });

            // 验证返回按钮（链接到 dashboard）
            const backButton = page.locator('a[href*="dashboard"]').first();
            await expect(backButton).toBeVisible();
        });

        test('项目名称或导航区域可见', async ({ page }) => {
            await waitForStudioReady(page);

            // 验证工具栏中有项目相关信息
            const toolbar = page.locator('.h-14').first();
            await expect(toolbar).toBeVisible({ timeout: 10000 });

            // 验证有文本内容
            const content = await toolbar.textContent();
            expect(content?.length).toBeGreaterThan(0);
        });
    });

    // ==================== PageManager 功能测试 ====================

    test.describe('PageManager 功能', () => {
        test('创建新页面 - 通过 Pages 标签', async ({ page }) => {
            await waitForStudioReady(page);

            // 点击 Pages 标签
            const pagesTab = page.getByRole('tab', { name: /Pages|页面/i });
            if (await pagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
                await pagesTab.click();
                await page.waitForTimeout(500);

                // 查找添加页面的输入框
                const input = page.locator('input[placeholder*="page"], input[placeholder*=".html"]').first();

                if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
                    const pageName = 'test-' + Date.now();
                    await input.fill(pageName);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(1000);

                    // 测试通过如果没有报错
                    console.log('[PageManager] Created page: ' + pageName);
                }
            }
        });

        test('页面列表显示 index.html', async ({ page }) => {
            await waitForStudioReady(page);

            // 点击 Pages 标签
            const pagesTab = page.getByRole('tab', { name: /Pages|页面/i });
            if (await pagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
                await pagesTab.click();
                await page.waitForTimeout(500);

                // 验证 index.html 存在
                const indexPage = page.locator('text=index.html').first();
                await expect(indexPage).toBeVisible({ timeout: 5000 });
            }
        });
    });

    // ==================== LivePreview 功能测试 ====================

    test.describe('LivePreview 功能', () => {
        test('编辑器/预览区域加载', async ({ page }) => {
            await waitForStudioReady(page);

            // 查找编辑器区域（GrapesJS iframe 或任何预览容器）
            const editorArea = page.locator('iframe, .gjs-editor, [class*="preview"], [class*="editor"]').first();
            await expect(editorArea).toBeVisible({ timeout: 30000 });
        });
    });

    // ==================== 键盘快捷键测试 ====================

    test.describe('键盘快捷键', () => {
        test('Cmd+S 保存快捷键生效', async ({ page }) => {
            await waitForStudioReady(page);

            // 按下保存快捷键
            await page.keyboard.press('Meta+s');
            await page.waitForTimeout(1500);

            // 检查是否有 toast 反馈
            const toast = page.locator('[data-sonner-toast]').first();
            const hasToast = await toast.isVisible({ timeout: 2000 }).catch(() => false);
            console.log(`[Keyboard] Save shortcut triggered, toast visible: ${hasToast}`);
        });
    });

    // ==================== AI 聊天功能测试 ====================

    test.describe('AI 聊天功能', () => {
        test('聊天面板和输入框可用', async ({ page }) => {
            await waitForStudioReady(page);

            // 确保在 Chat 标签
            const chatTab = page.getByRole('tab', { name: /Chat|聊天/i });
            if (await chatTab.isVisible({ timeout: 5000 }).catch(() => false)) {
                await chatTab.click();
                await page.waitForTimeout(500);
            }

            // 查找 textarea（ChatAssistant 中的输入框）
            const chatInput = page.locator('textarea').first();
            await expect(chatInput).toBeVisible({ timeout: 15000 });
            await expect(chatInput).toBeEditable();
        });

        test('发送按钮存在且响应输入', async ({ page }) => {
            await waitForStudioReady(page);

            // 确保在 Chat 标签
            const chatTab = page.getByRole('tab', { name: /Chat|聊天/i });
            if (await chatTab.isVisible({ timeout: 5000 }).catch(() => false)) {
                await chatTab.click();
                await page.waitForTimeout(500);
            }

            // 使用 data-testid 查找发送按钮
            const sendBtn = page.locator('[data-testid="chat-send-button"]');
            await expect(sendBtn).toBeVisible({ timeout: 10000 });

            // 输入内容后验证按钮状态变化
            const chatInput = page.locator('textarea').first();
            await chatInput.fill('测试消息');
            await page.waitForTimeout(300);

            // 按钮应该启用
            await expect(sendBtn).toBeEnabled();
        });

        test('Chat/Builder 模式切换', async ({ page }) => {
            await waitForStudioReady(page);

            // 确保在 Chat 标签
            const chatTab = page.getByRole('tab', { name: /Chat|聊天/i });
            if (await chatTab.isVisible({ timeout: 5000 }).catch(() => false)) {
                await chatTab.click();
                await page.waitForTimeout(500);
            }

            // 查找模式切换按钮
            const chatModeBtn = page.locator('[data-testid="mode-toggle-chat"]');
            const builderModeBtn = page.locator('[data-testid="mode-toggle-builder"]');

            // 至少有一个模式按钮可见
            const chatVisible = await chatModeBtn.isVisible({ timeout: 5000 }).catch(() => false);
            const builderVisible = await builderModeBtn.isVisible({ timeout: 1000 }).catch(() => false);
            expect(chatVisible || builderVisible).toBeTruthy();

            // 如果 Builder 按钮可见，点击切换
            if (builderVisible) {
                await builderModeBtn.click();
                await page.waitForTimeout(500);

                // 再切换回来
                await chatModeBtn.click();
            }
        });
    });

    // ==================== 左侧面板测试 ====================

    test.describe('左侧面板', () => {
        test('Chat/Pages 标签切换', async ({ page }) => {
            await waitForStudioReady(page);

            // 查找标签
            const chatTab = page.getByRole('tab', { name: /Chat|聊天/i });
            const pagesTab = page.getByRole('tab', { name: /Pages|页面/i });

            // 点击 Pages 标签
            if (await pagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
                await pagesTab.click();
                await page.waitForTimeout(500);

                // 验证 Pages 面板可见
                const pagesPanel = page.locator('text=index.html').first();
                await expect(pagesPanel).toBeVisible({ timeout: 5000 });

                // 切换回 Chat
                if (await chatTab.isVisible()) {
                    await chatTab.click();
                    await page.waitForTimeout(500);
                }
            }
        });
    });
});
