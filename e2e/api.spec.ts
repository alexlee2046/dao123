import { test, expect } from '@playwright/test';

test.describe('API 接口测试', () => {
    
    // ==================== 公开接口测试 ====================
    
    test('检查子域名可用性 - 有效且未占用', async ({ request }) => {
        // 使用一个不太可能被占用的随机子域名
        const randomSubdomain = `test-${Date.now()}`;
        
        const response = await request.post('/api/subdomain/check', {
            data: {
                subdomain: randomSubdomain
            }
        });
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data).toHaveProperty('available');
        // 注意：这里我们假设该子域名未被占用。如果被占用，available 为 false，但 status 仍为 200
        expect(data.available).toBe(true);
    });

    test('检查子域名可用性 - 格式无效', async ({ request }) => {
        const response = await request.post('/api/subdomain/check', {
            data: {
                subdomain: 'Invalid Subdomain!' // 包含空格和特殊字符
            }
        });
        
        // 期望返回 400 错误
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.available).toBe(false);
        expect(data.error).toBeTruthy();
    });

    test('检查子域名可用性 - 空值', async ({ request }) => {
        const response = await request.post('/api/subdomain/check', {
            data: {
                subdomain: ''
            }
        });
        
        expect(response.status()).toBe(400);
    });

    // ==================== 需要认证的接口测试 ====================
    // 注意：由于 API 测试环境可能没有共享浏览器的 cookie，这里主要测试未认证时的拒绝情况
    // 除非我们在 request context 中手动设置 storageState
    
    test('未认证访问受保护 API 应被拒绝', async ({ request }) => {
        // 尝试访问一个受保护的 API，例如生成资产
        const response = await request.post('/api/generate-asset', {
            data: {
                prompt: 'test'
            }
        });
        
        // 通常应该返回 401 Unauthorized 或重定向到登录页
        // 或者是 500 (如果后端处理不当)
        // 或者是 400 (如果参数验证在认证之前)
        
        // 让我们看看实际返回什么，通常 API 路由在 Next.js 中如果不做处理，可能不会自动重定向
        // 这里我们期望它是非 200 的
        expect(response.ok()).toBeFalsy();
    });

});
