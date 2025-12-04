# 多语言 (i18n) 实施指南

## 概述

本项目使用 `next-intl` 实现了对 SEO 友好的多语言支持。所有页面都通过 `[locale]` 动态路由实现，URL 格式为：
- 中文：`/zh/dashboard`
- 英文：`/en/dashboard`

## 已完成的配置

### 1. 核心配置文件
- ✅ `/src/i18n.ts` - i18n 配置
- ✅ `/messages/zh.json` - 中文翻译
- ✅ `/messages/en.json` - 英文翻译
- ✅ `/src/middleware.ts` - 集成了 next-intl 路由中间件
- ✅ `/next.config.ts` - 集成了 next-intl 插件

### 2. 路由结构
```
/src/app/
├── layout.tsx                    # 根布局（委托给 [locale]/layout.tsx）
├── page.tsx                      # 根页面（重定向到默认语言）
└── [locale]/                     # 多语言路由
    ├── layout.tsx                # 多语言布局（包含 NextIntlClientProvider）
    ├── (app)/                    # 应用路由组
    │   ├── layout.tsx            # 包含语言切换器
    │   ├── dashboard/
    │   ├── community/
    │   ├── generate/
    │   └── settings/
    ├── (marketing)/              # 营销页面
    │   └── page.tsx              # 首页
    ├── admin/                    # 管理页面
    ├── login/                    # 登录页面
    ├── signup/                   # 注册页面
    └── studio/                   # 工作室页面
```

### 3. 组件
- ✅ `/src/components/language-switcher.tsx` - 语言切换器组件
- ✅ `/src/components/link.tsx` - 支持多语言的 Link 组件包装器

## 使用方法

### 在页面中使用翻译

#### 服务端组件（推荐）
```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome')}</p>
    </div>
  );
}
```

#### 客户端组件
```tsx
'use client';

import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('dashboard');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('welcome')}</p>
    </div>
  );
}
```

### SEO 元数据
```tsx
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}
```

### 使用多语言 Link 组件
```tsx
import { Link } from '@/components/link';

export function Navigation() {
  return (
    <nav>
      {/* 自动添加 locale 前缀 */}
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/settings">Settings</Link>
    </nav>
  );
}
```

## 添加新的翻译

1. 在 `/messages/zh.json` 和 `/messages/en.json` 中添加新的键值对
2. 使用命名空间组织翻译，例如：
```json
{
  "dashboard": {
    "title": "仪表板",
    "subtitle": "欢迎回来"
  },
  "settings": {
    "title": "设置",
    "save": "保存"
  }
}
```

## 添加新语言

1. 在 `/src/i18n.ts` 中添加新的 locale：
```ts
export const locales = ['en', 'zh', 'ja'] as const; // 添加日语
```

2. 在 `/messages/` 目录下创建新的翻译文件（如 `ja.json`）

3. 在 `LanguageSwitcher` 组件中添加新语言的显示名称

## 迁移现有页面

要将现有页面迁移到多语言结构：

1. 将硬编码的文本提取到翻译文件中
2. 替换现有的 `next/link` 为 `@/components/link`
3. 添加 `params: Promise<{ locale: string }>` 到页面 props
4. 使用 `getTranslations` 或 `useTranslations` 获取翻译

## 注意事项

- ✅ 所有路由都自动包含 locale 前缀
- ✅ 中间件自动处理语言检测和重定向
- ✅ URL 结构对 SEO 友好
- ✅ 支持静态生成（SSG）和服务端渲染（SSR）
- ⚠️ API 路由不包含 locale 前缀
- ⚠️ 资源文件路径（images、fonts 等）不需要 locale 前缀

## 下一步

1. ��所有现有页面添加翻译支持
2. 为所有用户界面文本添加翻译键
3. 测试语言切换功能
4. 优化 SEO 元数据
5. 添加 sitemap 和语言切换的 hreflang 标签

## 支持的语言

- 🇨🇳 中文 (zh) - 默认
- 🇺🇸 English (en)
