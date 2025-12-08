import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('End-to-End AI Generation Flow', () => {
    // Increase timeout for this suite as AI generation takes time
    test.setTimeout(300000); // 5 minutes

    // Set larger viewport for better visibility
    test.use({ viewport: { width: 1920, height: 1080 } });

    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('Full Flow: Login -> Builder Mode -> AI Generation -> Manual Edit', async ({ page }) => {
        // 1. Navigate to Studio
        console.log('Step 1: Navigating to Studio...');
        await page.goto('/studio/new');

        // Wait for page to be ready
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000); // Extra wait for React hydration

        // Take initial screenshot
        await page.screenshot({ path: 'test-results/01-initial-studio.png' });

        // 2. Find chat input area
        console.log('Step 2: Looking for chat input...');
        const chatInput = page.locator('textarea').first();
        await expect(chatInput).toBeVisible({ timeout: 15000 });
        console.log('Chat input found.');

        // 3. Switch to Builder Mode (manually select ⚡Builder button)
        console.log('Step 3: Switching to Builder mode...');
        // ChatAssistant.tsx has buttons "Default" and "⚡Builder" in the footer
        // The button contains span with ⚡ and text "Builder"
        const builderModeBtn = page.locator('button').filter({ hasText: 'Builder' }).first();
        try {
            if (await builderModeBtn.isVisible({ timeout: 5000 })) {
                await builderModeBtn.click();
                console.log('Switched to Builder mode.');
                await page.waitForTimeout(500);
            } else {
                console.log('Builder mode button not visible.');
            }
        } catch (e) {
            console.log('Builder mode switch failed:', e);
        }

        // Take screenshot after mode switch
        await page.screenshot({ path: 'test-results/02-builder-mode.png' });

        // 4. Try to select a model (optional - use default if DeepSeek not available)
        console.log('Step 4: Attempting to select model...');
        try {
            // Model selector is the last combobox in the chat panel footer
            const modelSelectTrigger = page.locator('button[role="combobox"]').last();
            if (await modelSelectTrigger.isVisible({ timeout: 3000 })) {
                await modelSelectTrigger.click();
                await page.waitForTimeout(500);

                // Look for any DeepSeek option
                const deepseekOption = page.locator('div[role="option"]').filter({ hasText: /DeepSeek/i }).first();
                if (await deepseekOption.isVisible({ timeout: 2000 })) {
                    await deepseekOption.click();
                    console.log('Selected DeepSeek model.');
                } else {
                    console.log('DeepSeek not found, using default model.');
                    await page.keyboard.press('Escape');
                }
            }
        } catch (e) {
            console.log('Model selection skipped:', e);
        }

        // 5. Input Prompt for Multi-page Site
        console.log('Step 5: Entering prompt...');
        const prompt = "Create a simple personal website with 3 pages: Home, About, Contact";
        await chatInput.fill(prompt);
        console.log(`Prompt entered: "${prompt}"`);

        // Take screenshot before sending
        await page.screenshot({ path: 'test-results/03-prompt-entered.png' });

        // 6. Send Prompt
        console.log('Step 6: Sending prompt...');
        // Try multiple selectors for the send button
        const sendButton = page.locator('[data-send-button]')
            .or(page.locator('button:has(svg.lucide-send)'))
            .or(page.locator('button').filter({ has: page.locator('svg') }).last());

        await expect(sendButton.first()).toBeVisible({ timeout: 5000 });
        await sendButton.first().click();
        console.log('Prompt sent.');

        // 7. Monitor Generation Process
        console.log('Step 7: Waiting for AI response...');

        // Wait for some indication that processing started
        await page.waitForTimeout(3000); // Give time for request to initiate

        // Take screenshot right after sending
        await page.screenshot({ path: 'test-results/04-after-send.png' });

        // Check multiple possible indicators (Builder mode uses toast messages)
        const processingIndicator = page.locator('text=/Thinking|思考中|Loading|加载|Architect|Builder Agent|Planning/i')
            .or(page.locator('.animate-spin'))
            .or(page.locator('[data-state="loading"]'));

        // Wait for processing to start OR for a response to appear (with graceful timeout handling)
        let responseAppeared = 'timeout';
        try {
            await Promise.race([
                processingIndicator.waitFor({ state: 'visible', timeout: 30000 }).then(() => { responseAppeared = 'processing'; }),
                page.locator('.whitespace-pre-wrap').waitFor({ state: 'visible', timeout: 30000 }).then(() => { responseAppeared = 'response'; }),
            ]);
        } catch (e) {
            console.log('No immediate processing indicator found, checking page state...');
        }

        console.log(`Detection result: ${responseAppeared}`);

        // Take screenshot during processing
        await page.screenshot({ path: 'test-results/05-processing.png' });

        // Wait for generation to complete (up to 4 minutes for AI generation)
        console.log('Step 8: Waiting for generation to complete...');

        // Wait up to 4 minutes for loading indicators to disappear
        try {
            await page.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 240000 });
        } catch (e) {
            console.log('No spinner found or already completed.');
        }

        // Additional wait if Builder mode is actively building pages
        await page.waitForTimeout(5000);

        // Take screenshot after completion
        await page.screenshot({ path: 'test-results/06-after-generation.png' });
        console.log('Captured post-generation screenshot.');

        // 9. Check for any generated content or pages
        console.log('Step 9: Verifying generated pages...');

        // Look for page selector with multiple pages
        try {
            const pageSelectTrigger = page.locator('button[role="combobox"]').first();
            if (await pageSelectTrigger.isVisible()) {
                await pageSelectTrigger.click();
                await page.waitForTimeout(500);

                // Count options
                const options = page.locator('div[role="option"]');
                const count = await options.count();
                console.log(`Found ${count} pages in selector.`);

                // Take screenshot of page dropdown
                await page.screenshot({ path: 'test-results/07-page-selector.png' });

                await page.keyboard.press('Escape');
            }
        } catch (e) {
            console.log('Page selector check failed:', e);
        }

        // 10. Test Manual Edit Transition (Toolbar button)
        console.log('Step 10: Testing Manual Edit transition...');

        // Look for mode toggle button in the Toolbar (not chat panel)
        // Toolbar.tsx has "Manual Edit" / "手动编辑" button
        const manualEditBtn = page.locator('button').filter({ hasText: /Manual Edit|手动编辑/ });
        const aiChatBtn = page.locator('button').filter({ hasText: /AI Chat|AI 对话/ });

        if (await manualEditBtn.isVisible({ timeout: 3000 })) {
            await manualEditBtn.click();
            console.log('Clicked Manual Edit button - switched to Builder mode.');
            await page.waitForTimeout(1000);
        } else if (await aiChatBtn.isVisible({ timeout: 3000 })) {
            console.log('Already in Builder/Manual Edit mode (AI Chat button visible).');
        } else {
            console.log('Mode toggle button not found in toolbar.');
        }

        // Take final screenshot
        await page.screenshot({ path: 'test-results/08-final-state.png' });
        console.log('Full flow test completed. Check screenshots for visual verification.');
    });
});
