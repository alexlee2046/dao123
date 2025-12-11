
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
        console.log('Navigating to login...');
        await page.goto('http://localhost:3006/en/login');
        await page.waitForTimeout(3000);

        // Check for nextjs-portal
        const portal = await page.$('nextjs-portal');
        if (portal) {
            console.log('Next.js portal found!');
            const shadowRoot = await portal.evaluate(el => el.shadowRoot ? el.shadowRoot.innerHTML : el.innerHTML);
            console.log('Portal content:', shadowRoot.substring(0, 500)); // Print first 500 chars

            const overlay = await page.$('[data-nextjs-dev-overlay="true"]');
            if (overlay) {
                const text = await overlay.textContent();
                console.log('Overlay text:', text);
            }
        } else {
            console.log('No Next.js portal found.');
        }

        const bodyText = await page.innerText('body');
        console.log('Body start:', bodyText.substring(0, 500));

        // Try to dismiss overlay
        // Capture console logs and errors
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', exception => console.log('PAGE ERROR:', exception));
        page.on('response', response => {
            if (response.status() >= 400) {
                console.log(`NETWORK ERROR: ${response.status()} ${response.url()}`); // Log status and URL
            }
        });

        console.log('Filling email...');
        await page.fill('input[id="email"]', 'admin@dao123.me'); // Correct credentials from utils.ts
        console.log('Filling password...');
        await page.fill('input[id="password"]', 'ningping');

        console.log('Pressing Escape...');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        console.log('Clicking submit...');
        await page.click('button[type="submit"]', { force: true });

        console.log('Waiting for navigation to dashboard...');
        try {
            await page.waitForURL(/.*dashboard/, { timeout: 10000 });
            console.log('Login SUCCESS! Redirected to dashboard.');
        } catch (e) {
            console.error('Login TIMEOUT or FAILURE:', e);
            // Capture screenshot of failure
            await page.screenshot({ path: 'login-debug-failure.png' });
            console.log('Screenshot saved to login-debug-failure.png');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
})();
