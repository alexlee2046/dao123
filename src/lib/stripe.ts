import Stripe from 'stripe';

/**
 * Stripe 客户端配置
 * 
 * 安全说明：
 * - 不使用假密钥作为回退，缺少配置时会抛出明确错误
 * - 在 Stripe 功能被调用时才会报错，允许其他功能正常工作
 */

// 验证 Stripe 密钥是否存在
function getStripeSecretKey(): string {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        // 在开发环境中记录警告，但不阻止应用启动
        if (process.env.NODE_ENV === 'development') {
            console.warn('[Stripe] STRIPE_SECRET_KEY not configured. Stripe features will not work.');
        }
        // 返回空字符串，Stripe API 调用会失败并给出明确错误
        return '';
    }
    return key;
}

// 延迟初始化 Stripe 客户端
let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
    if (!stripeInstance) {
        const secretKey = getStripeSecretKey();
        if (!secretKey) {
            throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
        }
        stripeInstance = new Stripe(secretKey, {
            apiVersion: '2024-11-20.acacia' as Stripe.LatestApiVersion,
            typescript: true,
        });
    }
    return stripeInstance;
}

// 保留旧的导出以保持向后兼容，但使用懒加载
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop) {
        const client = getStripeClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});
