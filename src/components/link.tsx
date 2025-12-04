'use client';

import { useLocale } from 'next-intl';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { ComponentProps } from 'react';

type LinkProps = Omit<NextLinkProps, 'locale'> & ComponentProps<'a'>;

/**
 * 支持多语言的 Link 组件
 * 自动在 href 前添加当前语言前缀
 */
export function Link({ href, ...props }: LinkProps) {
    const locale = useLocale();

    // 如果 href 是字符串，添加 locale 前缀
    const localizedHref = typeof href === 'string' && !href.startsWith(`/${locale}`) && !href.startsWith('/api')
        ? `/${locale}${href.startsWith('/') ? '' : '/'}${href}`
        : href;

    return <NextLink href={localizedHref} {...props} />;
}
