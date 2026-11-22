import { test, expect } from '@playwright/test';

test('health is independent of locale, auth and host', async ({ request }) => {
    for (const path of ['/health', '/api/health']) {
        const response = await request.get(path, { headers: { host: 'shadow.invalid' } });
        expect(response.status()).toBe(200);
        expect(await response.json()).toEqual({ status: 'ok' });
        expect(response.headers()['x-robots-tag']).toContain('noindex');
    }
});

test('shadow robots block crawling', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('Disallow: /');
});

test('shadow responses discourage indexing', async ({ request }) => {
    const response = await request.get('/', { maxRedirects: 0, headers: { host: 'localhost:3006' } });
    expect([200, 307, 308]).toContain(response.status());
    expect(response.headers()['x-robots-tag']).toContain('noindex');
});
