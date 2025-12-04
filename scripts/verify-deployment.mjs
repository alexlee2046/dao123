// Using global fetch available in Node.js 18+

const BASE_URL = 'http://127.0.0.1:3000';

const routes = [
    { path: '/', name: 'Home (Marketing)' },
    { path: '/login', name: 'Login Page' },
    { path: '/signup', name: 'Signup Page' },
    { path: '/studio', name: 'Studio Page' },
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/community', name: 'Community' },
    { path: '/generate', name: 'Generate' },
    { path: '/inspiration', name: 'Inspiration' },
    { path: '/settings', name: 'Settings' },
    { path: '/admin', name: 'Admin Dashboard' },
];

const apis = [
    { path: '/api/models/verify', method: 'POST', name: 'Verify Model API', body: {} },
    { path: '/api/chat', method: 'POST', name: 'Chat API', body: { messages: [] } },
    { path: '/api/deploy/vercel', method: 'POST', name: 'Deploy Vercel API', body: {} },
    { path: '/api/generate-asset', method: 'POST', name: 'Generate Asset API', body: {} },
    { path: '/api/stripe/webhook', method: 'POST', name: 'Stripe Webhook', body: {} },
    { path: '/api/stripe/checkout', method: 'POST', name: 'Stripe Checkout', body: {} },
];

async function checkUrl(url, method = 'GET', body = null) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const options = {
            method,
            signal: controller.signal,
            headers: {}
        };

        if (method === 'POST' && body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }

        const res = await fetch(`${BASE_URL}${url}`, options);
        clearTimeout(timeoutId);

        // We consider it "alive" if it returns anything other than Connection Refused.
        // 200-299: OK
        // 300-399: Redirect (OK)
        // 401/403: Unauthorized (OK - endpoint exists and is protected)
        // 405: Method Not Allowed (OK - endpoint exists)
        // 404: Not Found (FAIL - endpoint missing)
        // 500: Internal Server Error (FAIL - endpoint crashing)

        let status = 'UNKNOWN';
        let isOk = false;

        if (res.status >= 200 && res.status < 300) {
            status = 'OK';
            isOk = true;
        } else if (res.status >= 300 && res.status < 400) {
            status = `REDIRECT (${res.status})`;
            isOk = true;
        } else if (res.status === 400) {
            status = `BAD REQUEST (400) - OK`;
            isOk = true; // Endpoint exists and validated input
        } else if (res.status === 401 || res.status === 403) {
            status = `PROTECTED (${res.status})`;
            isOk = true;
        } else if (res.status === 405) {
            status = `METHOD NOT ALLOWED (${res.status})`;
            isOk = true; // Endpoint exists
        } else if (res.status === 404) {
            status = 'NOT FOUND (404)';
            isOk = false;
        } else if (res.status >= 500) {
            status = `SERVER ERROR (${res.status})`;
            isOk = false;
        } else {
            status = `STATUS ${res.status}`;
            isOk = false;
        }

        return {
            url,
            status,
            isOk
        };
    } catch (e) {
        return {
            url,
            status: `CONNECTION ERROR: ${e.message}`,
            isOk: false
        };
    }
}

async function main() {
    console.log(`\n🔍 Starting Fullstack Health Check on ${BASE_URL}...\n`);

    let passCount = 0;
    let failCount = 0;

    console.log('📄 Checking Frontend Pages:');
    console.log('----------------------------------------');
    for (const route of routes) {
        const result = await checkUrl(route.path);
        const icon = result.isOk ? '✅' : '❌';
        console.log(`${icon} ${route.name.padEnd(20)} (${route.path}): ${result.status}`);
        if (result.isOk) passCount++; else failCount++;
    }

    console.log('\n🔌 Checking Backend APIs:');
    console.log('----------------------------------------');
    for (const api of apis) {
        const result = await checkUrl(api.path, api.method, api.body);
        const icon = result.isOk ? '✅' : '❌';
        console.log(`${icon} ${api.name.padEnd(20)} (${api.path}) [${api.method}]: ${result.status}`);
        if (result.isOk) passCount++; else failCount++;
    }

    console.log('\n----------------------------------------');
    console.log(`Summary: ${passCount} Passed, ${failCount} Failed`);

    if (failCount > 0) {
        console.log('\n⚠️  Some checks failed. Please review the logs above.');
        process.exit(1);
    } else {
        console.log('\n✨ All checks passed! System appears operational.');
        process.exit(0);
    }
}

main();
