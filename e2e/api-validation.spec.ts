
import { test, expect } from '@playwright/test';
import { login } from './utils';

test.describe('API Generation & Parsing Stress Test', () => {

    // We need to login first to get the session cookies
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should successfully generate content via /api/chat and parse it', async ({ page }) => {
        // 1. Prepare the payload
        // We use a simple prompt to save tokens/time
        const messages = [
            { role: 'user', content: 'Create a very simple HTML button that says "Click Me"' }
        ];

        console.log('[API Test] Sending request to /api/chat...');

        // 2. Call /api/chat using page.request (shares cookies/session)
        const response = await page.request.post('/api/chat', {
            data: {
                messages,
                model: 'anthropic/claude-3.5-sonnet', // or your default model
                mode: 'direct'
            }
        });

        // 3. Check status code (Breakpoint 1)
        console.log(`[API Test] Chat API Status: ${response.status()}`);
        if (response.status() !== 200) {
            const errorText = await response.text();
            console.error('[API Test] Chat API Error:', errorText);
        }
        expect(response.status()).toBe(200);

        // 4. Read the stream
        // The endpoint returns a stream. content-type should be text/event-stream or similar, 
        // but 'ai' sdk might return text/plain depending on config.
        // We will read the full body text.
        const body = await response.body();
        const text = body.toString();
        console.log('[API Test] Chat API Response Length:', text.length);
        console.log('[API Test] Response Snippet:', text.substring(0, 200));

        // 5. Extract HTML from the response (Simulating client-side logic)
        // The response from streamText with 'toUIMessageStreamResponse' usually contains line-delimited chunks
        // like: 0:"..." 
        // We need to parse this widely. For this test, valid presence of "Click Me" and "<button" is enough proof of AI working.

        const hasButton = text.includes('button') || text.includes('Click Me');
        if (!hasButton) {
            console.warn('[API Test] Warning: Response does not contain expected keywords. Inspect full response.');
        }
        expect(hasButton).toBeTruthy();

        // 6. Test Parsing API (Breakpoint 2)
        // We'll construct a mock HTML payload to test /api/parse indepedently 
        // (to avoid dependency on AI randomly not generating what we want)
        const mockHtml = `
            <!DOCTYPE html>
            <html>
            <head><script src="https://cdn.tailwindcss.com"></script></head>
            <body>
                <div class="p-10">
                    <h1 class="text-2xl font-bold">Hello World</h1>
                    <button class="bg-blue-500 text-white px-4 py-2 rounded">Test Button</button>
                </div>
            </body>
            </html>
        `;

        console.log('[API Test] Sending request to /api/parse...');
        const parseResponse = await page.request.post('/api/parse', {
            data: {
                content: mockHtml
            }
        });

        console.log(`[API Test] Parse API Status: ${parseResponse.status()}`);
        if (parseResponse.status() !== 200) {
            const parseError = await parseResponse.text();
            console.error('[API Test] Parse API Error:', parseError);
        }
        expect(parseResponse.status()).toBe(200);

        const parseResult = await parseResponse.json();
        // Check if we got a builder JSON structure
        console.log('[API Test] Parse Result Keys:', Object.keys(parseResult));

        // Basic validation of Builder JSON (Context7/Craft.js format usually has ROOT)
        expect(parseResult).toHaveProperty('ROOT');

        // Breakpoint 3: Check Deeply
        const rootNode = parseResult['ROOT'];
        expect(rootNode.type.resolvedName).toBe('BuilderContainer');
        console.log('[API Test] Parse validation successful.');
    });
});
