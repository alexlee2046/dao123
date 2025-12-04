# 多语言快速参考

## 🌍 语言切换器位置

语言切换器已添加到：
- ✅ 应用布局顶部（dashboard、community、settings 等）
- ✅ 使用地球图标的下拉选择器
- ✅ 显示当前选择的语言

## 📝 常用代码片段

### 1. 服务端页面组件
```tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'yourNamespace' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function YourPage({ 
  params 
}: { 
  params: Promise<{ locale: string }> 
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'yourNamespace' });

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### 2. 客户端组件
```tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/components/link';

export function YourComponent() {
  const t = useTranslations('yourNamespace');
  const locale = useLocale();

  return (
    <div>
      <h1>{t('title')}</h1>
      <Link href="/dashboard">
        {t('goToDashboard')}
      </Link>
      <p>Current language: {locale}</p>
    </div>
  );
}
```

### 3. 服务端布局组件
```tsx
export default async function YourLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // 使用 locale 进行重定向等操作
  
  return <div>{children}</div>;
}
```

### 4. 动态重定向
```tsx
import { redirect } from 'next/navigation';

// 在服务端组件或布局中
const { locale } = await params;
redirect(`/${locale}/login`);
```

### 5. 路由器导航（客户端）
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function YourComponent() {
  const router = useRouter();
  const locale = useLocale();

  const handleClick = () => {
    router.push(`/${locale}/dashboard`);
  };

  return <button onClick={handleClick}>Go</button>;
}
```

## 📂 翻译文件结构

```json
{
  "common": {
    "language": "语言",
    "save": "保存",
    "cancel": "取消"
  },
  "dashboard": {
    "title": "仪表板",
    "welcome": "欢迎回来"
  },
  "yourNamespace": {
    "key": "value"
  }
}
```

## 🔗 链接组件使用

### 替换所有 next/link
```tsx
// ❌ 旧方式
import Link from 'next/link';
<Link href="/dashboard">Dashboard</Link>

// ✅ 新方式
import { Link } from '@/components/link';
<Link href="/dashboard">Dashboard</Link>
// 自动变成 /zh/dashboard 或 /en/dashboard
```

## 🎯 URL 格式

| 页面 | 中文 URL | 英文 URL |
|------|----------|----------|
| 首页 | `/zh` | `/en` |
| 仪表板 | `/zh/dashboard` | `/en/dashboard` |
| 社区 | `/zh/community` | `/en/community` |
| 工作室 | `/zh/studio` | `/en/studio` |
| 设置 | `/zh/settings` | `/en/settings` |
| 管理 | `/zh/admin` | `/en/admin` |
| 登录 | `/zh/login` | `/en/login` |
| 注册 | `/zh/signup` | `/en/signup` |

## ⚠️ 注意事项

1. **所有页面组件都需要接受 params**
   ```tsx
   params: Promise<{ locale: string }>
   ```

2. **所有布局组件都需要接受 params**
   ```tsx
   params: Promise<{ locale: string }>
   ```

3. **重定向时必须包含 locale**
   ```tsx
   redirect(`/${locale}/login`)  // ✅ 正确
   redirect('/login')             // ❌ 错误
   ```

4. **使用自定义 Link 组件**
   ```tsx
   import { Link } from '@/components/link';  // ✅ 正确
   import Link from 'next/link';               // ❌ 避免使用
   ```

5. **API 路由不需要 locale 前缀**
   ```
   /api/auth         ✅ 正确
   /zh/api/auth      ❌ 错误
   ```

## 🔍 调试技巧

### 检查当前语言
```tsx
'use client';

import { useLocale } from 'next-intl';

export function DebugLocale() {
  const locale = useLocale();
  return <div>Current locale: {locale}</div>;
}
```

### 检查路径是否包含 locale
```tsx
'use client';

import { usePathname } from 'next/navigation';

export function DebugPath() {
  const pathname = usePathname();
  return <div>Current path: {pathname}</div>;
}
```

### 检查翻译是否加载
```tsx
'use client';

import { useTranslations } from 'next-intl';

export function DebugTranslations() {
  const t = useTranslations('common');
  
  try {
    return <div>{t('language')}</div>;
  } catch (error) {
    return <div>Translation error: {String(error)}</div>;
  }
}
```

## 📖 可用的命名空间

- `common` - 通用文本（按钮、标签等）
- `nav` - 导航菜单
- `auth` - 认证（登录、注册）
- `dashboard` - 仪表板
- `projects` - 项目管理
- `studio` - 工作室
- `community` - 社区
- `settings` - 设置
- `admin` - 管理界面
- `metadata` - SEO 元数据

## 🚀 测试清单

访问以下 URL 确保一切正常：

- [ ] http://localhost:3006/ （应重定向到 /zh）
- [ ] http://localhost:3006/zh
- [ ] http://localhost:3006/en
- [ ] http://localhost:3006/zh/dashboard
- [ ] http://localhost:3006/en/dashboard
- [ ] 切换语言并验证 URL 更新
- [ ] 验证侧边栏文本切换
- [ ] 验证页面标题切换
- [ ] 验证退出登录重定向正确

## 💡 提示

- 始终使用 `await params` 获取 locale
- 使用 `Link` 组件替代 `next/link`
- 在翻译文件中组织好命名空间
- 为新页面添加 SEO 元数据生成函数
