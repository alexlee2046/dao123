# Vercel 一键部署 - 子域名解决方案

## 问题概述

当用户点击"一键部署到 Vercel"按钮时，我们需要为每个用户的项目分配自定义子域名（如 `username.dao123.me`），这需要特殊的 DNS 配置。

## 解决方案架构

### 方案 A：使用 Vercel 泛域名（推荐）✅

这是**最标准和可靠**的方案，适合生产环境。

#### 1. DNS 配置要求

**必须将域名的 Nameservers 指向 Vercel：**

在域名注册商处修改 Nameservers：
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

#### 2. Vercel 配置步骤

1. **添加根域名**
   - 在 Vercel 项目设置中添加 `dao123.me`
   - Vercel 会自动验证域名所有权

2. **添加泛域名**
   - 在同一项目中添加 `*.dao123.me`
   - Vercel 会自动颁发 SSL 证书（通过 Let's Encrypt）

3. **环境变量配置**
   - 用户部署时，通过环境变量传递项目 ID
   - 应用根据子域名动态加载对应用户的内容

#### 3. 实现流程

```
用户点击部署
    ↓
系统生成唯一项目 ID
    ↓
创建 Vercel 部署（使用模板仓库）
    ↓
设置环境变量：NEXT_PUBLIC_PROJECT_ID
    ↓
Vercel 自动分配 *.vercel.app 域名
    ↓
用户可以设置自定义子域名（如 username.dao123.me）
    ↓
Vercel 自动处理 SSL 和路由
```

#### 4. 优势
- ✅ 自动 SSL 证书管理
- ✅ 全球 CDN 加速
- ✅ 无限子域名支持
- ✅ 零运维成本
- ✅ 生产级可靠性

#### 5. 实现代码

见下方的完整实现方案。

---

### 方案 B：Vercel Rewrites（备选方案）

如果**无法修改 Nameservers**，可以使用此方案：

#### DNS 配置
```
类型: A
主机: *.dao123.me
值: 76.76.21.21 (Vercel Edge Network)
```

或者：
```
类型: CNAME
主机: *
值: cname.vercel-dns.com
```

#### Vercel 配置 (next.config.ts)
```typescript
async rewrites() {
  return [
    {
      source: '/:path*',
      destination: '/api/proxy/:path*',
      has: [
        {
          type: 'host',
          value: '(?<subdomain>.*).dao123.me',
        },
      ],
    },
  ];
}
```

#### 限制
- ⚠️ 需要手动配置 SSL 证书
- ⚠️ 可能需要 Vercel Pro 计划
- ⚠️ 性能略低于方案 A

---

## 推荐实现方案

### 架构设计

```
┌─────────────────┐
│   用户浏览器     │
│ user.dao123.me  │
└────────┬────────┘
         │
         ↓ (DNS: *.dao123.me → Vercel)
┌─────────────────┐
│  Vercel Edge    │
│  (Next.js App)  │
└────────┬────────┘
         │
         ↓ (读取子域名)
┌─────────────────┐
│  Middleware     │
│  提取 username  │
└────────┬────────┘
         │
         ↓ (查询项目数据)
┌─────────────────┐
│   Supabase DB   │
│  projects 表    │
└─────────────────┘
```

### 数据库 Schema

```sql
-- 在 projects 表中添加子域名字段
ALTER TABLE projects 
ADD COLUMN subdomain TEXT UNIQUE,
ADD COLUMN custom_domain TEXT;

-- 创建索引以加速查询
CREATE INDEX idx_projects_subdomain ON projects(subdomain);
```

### 完整实现代码

#### 1. 创建部署模板仓库

创建一个独立的 Next.js 应用作为"查看器"模板：

```bash
# 在 GitHub 创建新仓库: dao123-viewer-template
```

**模板项目结构：**
```
dao123-viewer-template/
├── src/
│   ├── middleware.ts          # 子域名处理
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx          # 动态加载用户内容
│   └── lib/
│       ├── db.ts             # Supabase 客户端
│       └── renderer.tsx      # 渲染用户项目
├── next.config.ts
└── package.json
```

#### 2. Middleware 实现（模板项目）

```typescript
// dao123-viewer-template/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // 提取子域名
  const subdomain = hostname.split('.')[0];
  
  // 如果是主域名，跳转到主站
  if (subdomain === 'dao123' || subdomain === 'www') {
    return NextResponse.rewrite(new URL('/', request.url));
  }
  
  // 将子域名传递给页面组件
  const url = request.nextUrl.clone();
  url.searchParams.set('subdomain', subdomain);
  
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: '/:path*',
};
```

#### 3. 动态内容加载（模板项目）

```typescript
// dao123-viewer-template/src/app/page.tsx
import { createClient } from '@/lib/db';
import { Renderer } from '@/lib/renderer';

export default async function Page({
  searchParams,
}: {
  searchParams: { subdomain?: string };
}) {
  const subdomain = searchParams.subdomain;
  
  if (!subdomain) {
    return <div>Invalid subdomain</div>;
  }
  
  // 从数据库获取项目内容
  const supabase = createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('content, name')
    .eq('subdomain', subdomain)
    .single();
  
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p>项目不存在</p>
        </div>
      </div>
    );
  }
  
  // 渲染用户的项目内容
  return <Renderer content={project.content} title={project.name} />;
}
```

#### 4. 主项目中的部署按钮实现

```typescript
// src/components/studio/PublishModal.tsx（更新版本）
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function PublishModal({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = params.siteId as string;
  const [subdomain, setSubdomain] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  
  const handleVercelDeploy = async () => {
    setIsDeploying(true);
    
    try {
      // 1. 检查子域名是否可用
      const supabase = createClient();
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('subdomain', subdomain)
        .single();
      
      if (existing) {
        alert('该子域名已被占用');
        return;
      }
      
      // 2. 保存子域名到数据库
      await supabase
        .from('projects')
        .update({ subdomain })
        .eq('id', projectId);
      
      // 3. 生成 Vercel 部署链接
      const templateRepo = 'your-github-username/dao123-viewer-template';
      const deployUrl = new URL('https://vercel.com/new/clone');
      deployUrl.searchParams.set('repository-url', `https://github.com/${templateRepo}`);
      deployUrl.searchParams.set('env', 'NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY');
      deployUrl.searchParams.set('project-name', `dao123-${subdomain}`);
      
      // 4. 打开 Vercel 部署页面
      window.open(deployUrl.toString(), '_blank');
      
      // 5. 显示配置指南
      alert(`
        请在 Vercel 部署页面完成以下步骤：
        
        1. 连接你的 GitHub 账号
        2. 设置环境变量：
           - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}
           - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
        3. 点击 Deploy
        4. 部署完成后，在 Vercel 项目设置中添加自定义域名：
           ${subdomain}.dao123.me
      `);
      
    } catch (error) {
      console.error('部署失败:', error);
      alert('部署失败，请重试');
    } finally {
      setIsDeploying(false);
    }
  };
  
  return (
    {/* UI 组件... */}
  );
}
```

#### 5. 数据库迁移

```sql
-- migrations/add_subdomain_to_projects.sql
-- 添加子域名字段
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS deployed_at TIMESTAMPTZ;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_subdomain ON projects(subdomain);

-- 添加约束：子域名只能包含字母、数字和连字符
ALTER TABLE projects 
ADD CONSTRAINT subdomain_format 
CHECK (subdomain ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$');
```

---

## 用户使用流程

### 步骤 1：用户在编辑器中完成网站设计

### 步骤 2：点击"发布到 Vercel"
1. 输入期望的子域名（如 `alex-portfolio`）
2. 系统检查可用性
3. 点击"部署"按钮

### 步骤 3：跳转到 Vercel
1. Vercel 页面自动填充模板仓库
2. 用户授权 GitHub
3. 设置环境变量（可预填）
4. 点击 Deploy

### 步骤 4：配置自定义域名
1. 部署完成后，在 Vercel 项目设置中添加域名
2. 输入：`alex-portfolio.dao123.me`
3. Vercel 自动配置 SSL

### 步骤 5：访问网站
用户可以通过以下方式访问：
- `alex-portfolio.dao123.me`（自定义子域名）
- `xxx.vercel.app`（Vercel 默认域名）

---

## 成本分析

### Vercel 费用（使用泛域名）
- **Hobby 计划**：免费，但不支持泛域名 SSL
- **Pro 计划**：$20/月，支持泛域名和自动 SSL ✅
- **Enterprise**：定制价格

### DNS 费用
- 大部分域名注册商免费提供 Nameserver 修改
- 或使用 Cloudflare 免费 DNS

### 总成本
- **初期**：$20/月（Vercel Pro）
- **变动成本**：$0（无限子域名）
- **扩展性**：支持数千个用户

---

## 安全考虑

### 1. 子域名验证
```typescript
function validateSubdomain(subdomain: string): boolean {
  // 只允许字母、数字和连字符
  const regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  
  // 长度限制
  if (subdomain.length < 3 || subdomain.length > 63) {
    return false;
  }
  
  // 禁止保留字
  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp'];
  if (reserved.includes(subdomain)) {
    return false;
  }
  
  return regex.test(subdomain);
}
```

### 2. 内容安全策略
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self'",
  },
];
```

### 3. 速率限制
- 每个用户每天最多创建 3 个项目
- 每个 IP 每小时最多访问 100 次

---

## 替代方案：简化版

如果不想使用泛域名，可以采用更简单的方案：

### 方案 C：仅使用 Vercel 默认域名

```typescript
// 用户部署后获得：username-dao123.vercel.app
// 优点：无需 DNS 配置，完全免费
// 缺点：无法使用自定义域名
```

### 方案 D：预先创建子域名

```typescript
// 管理员预先在 Vercel 创建 1000 个子域名
// user1.dao123.me, user2.dao123.me, ...
// 用户注册时分配一个
// 优点：简单可靠
// 缺点：需要预先规划，不能自定义
```

---

## 推荐实施路线

### 阶段 1：MVP（最小可行产品）
✅ 使用 Vercel 默认域名（`.vercel.app`）
✅ 无需 DNS 配置
✅ 完全免费

### 阶段 2：定制化
✅ 配置泛域名 `*.dao123.me`
✅ 升级到 Vercel Pro（$20/月）
✅ 支持自定义子域名

### 阶段 3：企业级
✅ 支持用户绑定完全自定义域名
✅ 多区域部署
✅ 高级分析和监控

---

## 技术栈总结

1. **前端**：Next.js 14 + TypeScript
2. **部署**：Vercel（支持泛域名）
3. **数据库**：Supabase（存储项目内容）
4. **DNS**：Vercel DNS 或 Cloudflare
5. **SSL**：Let's Encrypt（Vercel 自动管理）

---

## 下一步行动

1. [ ] 购买 Vercel Pro 计划（$20/月）
2. [ ] 修改域名 Nameservers 指向 Vercel
3. [ ] 在 Vercel 添加 `dao123.me` 和 `*.dao123.me`
4. [ ] 创建模板仓库 `dao123-viewer-template`
5. [ ] 实现 Middleware 和动态内容加载
6. [ ] 更新主项目的发布功能
7. [ ] 添加数据库迁移
8. [ ] 测试完整部署流程

---

## 参考资料

- [Vercel 泛域名文档](https://vercel.com/docs/concepts/projects/domains/wildcard-domains)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase 文档](https://supabase.com/docs)
