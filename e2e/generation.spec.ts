import { test, expect } from '@playwright/test';
import { login } from './utils';

/**
 * 专门用于调试 AI 生成 + 零损失识别流程的 E2E 测试
 * 重点追踪：
 * 1. /api/chat 的调用和响应
 * 2. /api/parse 的调用和响应
 * 3. ChatAssistant.tsx 中 onFinish 的处理逻辑
 * 4. Toolbar.tsx 中切换到 Builder Mode 时的 HTML -> BuilderJSON 转换
 */
test.describe('AI Generation & Zero-Loss Parser Debug', () => {
    test.setTimeout(300000); // 5 minutes
    test.use({ viewport: { width: 1920, height: 1080 } });

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('Debug: Track AI Generation and Parsing Flow', async ({ page }) => {
        // Set up request/response logging
        const apiLogs: { type: string; url: string; method?: string; status?: number; body?: any; response?: any }[] = [];

        // Intercept ALL API calls (not just chat/parse)
        page.on('request', request => {
            const url = request.url();
            if (url.includes('/api/')) {
                const postData = request.postData();
                let bodySnippet = 'N/A';
                if (postData) {
                    try {
                        const parsed = JSON.parse(postData);
                        bodySnippet = JSON.stringify(parsed).substring(0, 200);
                    } catch {
                        bodySnippet = postData.substring(0, 200);
                    }
                }
                apiLogs.push({
                    type: 'REQUEST',
                    url: url,
                    method: request.method(),
                    body: bodySnippet
                });
                console.log(`[DEBUG] REQUEST: ${request.method()} ${url}`);
                console.log(`[DEBUG]   Body: ${bodySnippet}`);
            }
        });

        page.on('response', async response => {
            const url = response.url();
            if (url.includes('/api/')) {
                let responseBody = 'streaming or binary';
                try {
                    if (!url.includes('/api/chat')) { // Chat is streaming
                        responseBody = await response.text();
                        if (responseBody.length > 500) {
                            responseBody = responseBody.substring(0, 500) + '... [truncated]';
                        }
                    }
                } catch (e) {
                    // Ignore
                }
                apiLogs.push({
                    type: 'RESPONSE',
                    url: url,
                    status: response.status(),
                    response: responseBody
                });
                console.log(`[DEBUG] RESPONSE: ${response.status()} ${url}`);
                if (response.status() >= 400) {
                    console.log(`[DEBUG]   ERROR Body: ${responseBody}`);
                }
            }
        });

        // Capture requestfailed events
        page.on('requestfailed', request => {
            console.log(`[DEBUG] REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
        });

        // Capture console logs from the page (including errors)
        page.on('console', msg => {
            const text = msg.text();
            // Log all errors and relevant messages
            if (msg.type() === 'error' || text.includes('Chat') || text.includes('API') || text.includes('Architect') || text.includes('Builder') || text.includes('error')) {
                console.log(`[PAGE CONSOLE] ${msg.type()}: ${text}`);
            }
        });

        // Capture page errors
        page.on('pageerror', err => {
            console.log(`[PAGE ERROR] ${err.message}`);
        });

        // 1. Navigate to Studio
        console.log('\n=== Step 1: Navigate to Studio ===');
        await page.goto('/studio/new');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test-results/debug-01-initial.png' });

        // 2. Find chat input
        console.log('\n=== Step 2: Find chat input ===');
        const chatInput = page.locator('textarea').first();
        await expect(chatInput).toBeVisible({ timeout: 15000 });

        // 3. Switch to Builder mode if possible
        console.log('\n=== Step 3: Try to switch to Builder mode ===');
        const builderBtn = page.getByTestId('mode-toggle-builder');
        try {
            if (await builderBtn.isVisible({ timeout: 5000 })) {
                await builderBtn.click();
                console.log('Switched to Builder mode');
                await page.waitForTimeout(500);
            } else {
                console.log('Builder button not found (by test-id), using Default mode');
            }
        } catch (e) {
            console.log('Builder button interaction failed, using Default mode');
        }

        await page.screenshot({ path: 'test-results/debug-02-mode.png' });

        // 4. Enter prompt - use type() instead of fill() to trigger React state updates
        console.log('\n=== Step 4: Enter prompt ===');
        const prompt = "Create a simple landing page with a hero section and a footer";

        // Clear the input first
        await chatInput.click();
        await chatInput.clear();

        // Type slowly to ensure React picks up each character
        await chatInput.type(prompt, { delay: 10 });
        console.log(`Prompt typed: "${prompt}"`);

        // Wait a moment for state to settle
        await page.waitForTimeout(500);

        // 5. Send prompt
        console.log('\n=== Step 5: Send prompt ===');

        // Check if send button is enabled
        const sendBtn = page.locator('[data-send-button]')
            .or(page.locator('button:has(svg.lucide-send)'))
            .or(page.locator('button').filter({ has: page.locator('svg') }).last());

        const firstSendBtn = sendBtn.first();
        const isDisabled = await firstSendBtn.isDisabled();
        console.log(`Send button disabled: ${isDisabled}`);

        if (isDisabled) {
            console.log('WARNING: Send button is disabled! Input might not have registered.');
            // Try pressing Enter as alternative
            await chatInput.press('Enter');
            console.log('Pressed Enter key as fallback');
        } else {
            await firstSendBtn.click();
            console.log('Clicked send button');
        }

        await page.screenshot({ path: 'test-results/debug-03-sent.png' });

        // 6. Wait and monitor
        console.log('\n=== Step 6: Waiting for AI response (up to 2 min) ===');

        // Wait for spinner or response indicator
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'test-results/debug-04-processing.png' });

        // Check for loading state
        const spinner = page.locator('.animate-spin');
        const hasSpinner = await spinner.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`Spinner visible: ${hasSpinner}`);

        // Wait up to 2 minutes for generation
        if (hasSpinner) {
            try {
                await spinner.waitFor({ state: 'hidden', timeout: 120000 });
                console.log('Spinner hidden - generation complete');
            } catch (e) {
                console.log('Spinner still visible after timeout');
            }
        }

        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-results/debug-05-after-wait.png' });

        // 7. Check for messages in chat
        console.log('\n=== Step 7: Check chat messages ===');
        const messages = page.locator('.whitespace-pre-wrap');
        const messageCount = await messages.count();
        console.log(`Found ${messageCount} message(s) in chat`);

        // 8. Check page selector for new pages
        console.log('\n=== Step 8: Check page selector ===');
        const pageSelect = page.locator('button[role="combobox"]').first();
        if (await pageSelect.isVisible()) {
            await pageSelect.click();
            await page.waitForTimeout(500);
            const options = page.locator('div[role="option"]');
            const optionCount = await options.count();
            console.log(`Found ${optionCount} page(s) in selector`);

            // List all pages
            for (let i = 0; i < optionCount; i++) {
                const optionText = await options.nth(i).textContent();
                console.log(`  - Page ${i + 1}: ${optionText}`);
            }
            await page.keyboard.press('Escape');
        }

        await page.screenshot({ path: 'test-results/debug-06-page-selector.png' });

        // 9. Try Manual Edit mode to trigger HTML -> Builder conversion
        console.log('\n=== Step 9: Test Manual Edit (HTML -> Builder conversion) ===');
        const manualEditBtn = page.locator('button').filter({ hasText: /Manual Edit|手动编辑/ });
        if (await manualEditBtn.isVisible({ timeout: 3000 })) {
            await manualEditBtn.click();
            console.log('Clicked Manual Edit button');
            await page.waitForTimeout(2000);
        }

        await page.screenshot({ path: 'test-results/debug-07-manual-edit.png' });

        // 10. Print API logs summary
        console.log('\n=== API Call Summary ===');
        apiLogs.forEach((log, i) => {
            console.log(`${i + 1}. ${log.type} ${log.method || ''} ${log.url} [${log.status || ''}]`);
            if (log.response && log.type === 'RESPONSE') {
                console.log(`   Response snippet: ${log.response.substring(0, 150)}`);
            }
        });

        console.log('\n=== Debug test completed ===');
        console.log('Check test-results/debug-*.png for screenshots');
    });
});
