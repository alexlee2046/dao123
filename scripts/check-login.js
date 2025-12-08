const { chromium } = require('playwright');

async function checkLoginPage() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('Navigating to login page...');
    await page.goto('http://localhost:3006/en/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('Current URL:', page.url());

    // Take screenshot
    await page.screenshot({ path: 'test-results/login-debug.png', fullPage: true });
    console.log('Screenshot saved to test-results/login-debug.png');

    // Get page content
    const html = await page.content();
    console.log('Page has email input:', html.includes('id="email"'));
    console.log('Page has form:', html.includes('<form'));

    // Check for email input
    const emailInput = page.locator('input#email');
    const count = await emailInput.count();
    console.log('Email input count:', count);

    if (count > 0) {
        const isVisible = await emailInput.isVisible();
        console.log('Email input visible:', isVisible);
    }

    // Get all inputs
    const inputs = await page.locator('input').all();
    console.log('Total inputs found:', inputs.length);

    for (const input of inputs) {
        const id = await input.getAttribute('id');
        const type = await input.getAttribute('type');
        const visible = await input.isVisible();
        console.log(`  Input: id=${id}, type=${type}, visible=${visible}`);
    }

    await browser.close();
}

checkLoginPage().catch(console.error);
