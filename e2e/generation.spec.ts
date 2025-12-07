import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('内容生成功能测试', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('图像生成页面加载', async ({ page }) => {
        await page.goto('/generate/image');
        await expect(page.locator('h1')).toContainText(/Image|图像/i);
        await expect(page.locator('textarea').first()).toBeVisible();
        await expect(page.locator('button:has-text("Generate"), button:has-text("生成")').first()).toBeVisible();
    });

    test('AI 图像生成流程 (Mock)', async ({ page }) => {
        // Mock API response with base64 image to avoid external network issues
        const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==';
        
        await page.route('**/api/generate-asset', async route => {
            console.log('Mock API hit');
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    url: base64Image,
                    prompt: 'A beautiful landscape',
                    id: 'mock-id-123',
                    name: 'AI Generated Image'
                })
            });
        });

        await page.goto('/generate/image');
        
        // Fill prompt
        const promptInput = page.locator('textarea').first();
        await promptInput.fill('A beautiful landscape');

        // Click generate and wait for response
        const generateBtn = page.locator('button:has-text("Generate"), button:has-text("生成")').first();
        
        // Setup promise to wait for response
        const responsePromise = page.waitForResponse(response => 
            response.url().includes('/api/generate-asset') && response.status() === 200
        );
        
        await generateBtn.click();
        await responsePromise;

        // Verify success result
        // Check for the image container or the image itself
        const imageContainer = page.locator('div.aspect-square');
        
        // Wait for image to be visible
        // We use a more specific selector to ensure we are targeting the rendered image
        // next/image usually renders an img element
        await expect(imageContainer.locator('img')).toBeVisible({ timeout: 30000 });
    });

    test('视频生成页面 (Coming Soon)', async ({ page }) => {
        await page.goto('/generate/video');
        // Match "Coming Soon" (case insensitive) or "即将推出"
        const comingSoonText = page.locator('text=Coming Soon').or(page.locator('text=Coming soon')).or(page.locator('text=即将推出')).first();
        await expect(comingSoonText).toBeVisible();
    });
});
