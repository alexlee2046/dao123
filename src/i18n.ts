import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { AbstractIntlMessages } from 'next-intl';

// 支持的语言列表
export const locales = ['en', 'zh'] as const;
export type Locale = (typeof locales)[number];

// 默认语言
export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
    // 验证传入的 locale 参数
    const currentLocale = locale ?? defaultLocale;
    if (!locales.includes(currentLocale as Locale)) notFound();

    const messages = (await import(`../messages/${currentLocale}.json`)).default;

    return {
        locale: currentLocale,
        messages: messages as AbstractIntlMessages
    };
});

