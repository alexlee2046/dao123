# 子域名功能部署指南

本指南将帮助你完成子域名功能的部署。

## 📋 前置要求

1. ✅ 已有 Supabase 项目
2. ✅ 已有 Vercel 账号（可选，用于生产部署）
3. ✅ 拥有域名 `dao123.me`（或其他域名）

---

## 🚀 快速开始

### 步骤 1：应用数据库迁移

在 Supabase Dashboard 中运行迁移 SQL：

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 SQL Editor
4. 复制并运行 `/migrations/add_subdomain_support.sql` 文件内容

或者使用自动脚本：

```bash
# 确保设置了环境变量
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# 运行迁移
node scripts/migrate-subdomain.js
```

### 步骤 2：测试本地功能

```bash
# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:3006/studio/new
```

测试流程：
1. 创建或打开一个项目
2. 点击工具栏的"发布"按钮
3. 输入自定义子域名（如 `my-test-site`）
4. 查看实时验证反馈
5. 点击"发布到 dao123 子域名"

### 步骤 3：配置 DNS（生产环境）

#### 选项 A：使用 Vercel 泛域名（推荐）

**前提条件**：
- Vercel Pro 计划（$20/月）
- 控制域名的 Nameservers

**配置步骤**：

1. **修改域名 Nameservers**
   
   在域名注册商（如 GoDaddy、Namecheap、Cloudflare）处：
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

2. **在 Vercel 添加域名**
   
   访问你的 Vercel 项目设置：
   ```
   Project Settings → Domains
   ```
   
   添加以下域名：
   - `dao123.me`（根域名）
   - `*.dao123.me`（泛域名）

3. **等待 DNS 传播**
   
   通常需要 5-30 分钟，可以使用以下命令检查：
   ```bash
   dig dao123.me
   dig test.dao123.me
   ```

4. **验证 SSL 证书**
   
   Vercel 会自动为所有子域名颁发 SSL 证书

#### 选项 B：仅使用 Vercel 默认域名（免费）

如果暂时不想配置自定义域名：

1. 用户部署后会获得 `*.vercel.app` 域名
2. 可以稍后再添加自定义域名
3. 完全免费，适合测试和 MVP

---

## 🔧 配置文件更新

### 1. 环境变量

在 `.env.local` 中添加：

```bash
# 基础域名（用于生成完整的子域名 URL）
NEXT_PUBLIC_BASE_DOMAIN=dao123.me

# Vercel 模板仓库（用于一键部署）
NEXT_PUBLIC_VIEWER_TEMPLATE_REPO=your-github-username/dao123-viewer-template

# 可选：Vercel API Token（用于自动化部署）
VERCEL_TOKEN=your_vercel_token
```

### 2. Next.js 配置

更新 `next.config.ts`（如需支持子域名路由）：

```typescript
const nextConfig: NextConfig = {
  // ... 现有配置

  // 如果要在主应用中处理子域名路由
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/user/:path*',
        has: [
          {
            type: 'host',
            value: '(?<subdomain>.*).dao123.me',
          },
        ],
      },
    ];
  },
};
```

---

## 📦 创建 Viewer 模板仓库（可选）

如果要支持完整的 Vercel 一键部署：

### 1. 创建新仓库

```bash
# 在 GitHub 创建新仓库: dao123-viewer-template
mkdir dao123-viewer-template
cd dao123-viewer-template
git init
```

### 2. 初始化 Next.js 项目

```bash
npx create-next-app@latest . --typescript --tailwind --app
npm install @supabase/supabase-js
```

### 3. 创建核心文件

**src/middleware.ts**:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  
  const url = request.nextUrl.clone();
  url.searchParams.set('subdomain', subdomain);
  
  return NextResponse.rewrite(url);
}
```

**src/app/page.tsx**:
```typescript
import { createClient } from '@/lib/supabase';

export default async function Page({
  searchParams,
}: {
  searchParams: { subdomain?: string };
}) {
  const supabase = createClient();
  const { data: project } = await supabase
    .from('projects')
    .select('content, name')
    .eq('subdomain', searchParams.subdomain)
    .single();

  if (!project) {
    return <div>项目不存在</div>;
  }

  // 渲染项目内容
  return <div dangerouslySetInnerHTML={{ __html: project.content }} />;
}
```

### 4. 推送到 GitHub

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dao123-viewer-template.git
git push -u origin main
```

### 5. 更新主项目配置

在 `PublishModal.tsx` 中更新：

```typescript
const templateRepo = 'your-github-username/dao123-viewer-template';
```

---

## ✅ 测试清单

### 本地测试

- [ ] 子域名输入验证正常工作
- [ ] 实时可用性检查正常
- [ ] 保留字被正确拒绝
- [ ] 格式错误会显示提示
- [ ] 可以成功保存子域名到数据库

### 数据库测试

```sql
-- 查看 projects 表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects';

-- 测试插入子域名
UPDATE projects 
SET subdomain = 'test-site' 
WHERE id = 'your-project-id';

-- 查看保留子域名
SELECT * FROM reserved_subdomains;

-- 查看部署历史
SELECT * FROM deployment_history;
```

### API 测试

```bash
# 测试子域名可用性检查
curl -X POST http://localhost:3006/api/subdomain/check \
  -H "Content-Type: application/json" \
  -d '{"subdomain": "my-test-site"}'

# 应返回: {"available": true}
```

---

## 🐛 故障排除

### 问题 1：迁移失败

**症状**：运行迁移脚本时报错

**解决方法**：
1. 检查环境变量是否正确设置
2. 确认使用的是 SUPABASE_SERVICE_ROLE_KEY（不是 ANON_KEY）
3. 尝试在 Supabase SQL Editor 中手动运行 SQL

### 问题 2：子域名检查总是失败

**症状**：输入任何子域名都显示"检查失败"

**解决方法**：
1. 检查 `/api/subdomain/check` 路由是否正确创建
2. 查看浏览器控制台的网络请求
3. 检查 Supabase 客户端配置

### 问题 3：Vercel 泛域名不工作

**症状**：子域名返回 404 或证书错误

**解决方法**：
1. 确认 Nameservers 已正确指向 Vercel
2. 等待 DNS 传播（最多 48 小时）
3. 检查 Vercel 项目设置中是否正确添加了 `*.dao123.me`
4. 确认已升级到 Vercel Pro 计划

### 问题 4：保留字没有被拦截

**症状**：可以使用 `www`、`api` 等保留字

**解决方法**：
1. 检查数据库触发器是否创建成功
2. 验证 `validateSubdomain` 函数逻辑
3. 查看前端和后端双重验证

---

## 📊 监控和分析

### 数据库查询

```sql
-- 查看所有已部署的项目
SELECT name, subdomain, deployment_status, deployed_at
FROM projects
WHERE subdomain IS NOT NULL
ORDER BY deployed_at DESC;

-- 统计部署状态
SELECT deployment_status, COUNT(*)
FROM projects
WHERE subdomain IS NOT NULL
GROUP BY deployment_status;

-- 查看热门子域名前缀
SELECT LEFT(subdomain, 3) as prefix, COUNT(*)
FROM projects
WHERE subdomain IS NOT NULL
GROUP BY prefix
ORDER BY COUNT DESC
LIMIT 10;
```

---

## 🎯 下一步

完成基本设置后，可以考虑：

1. **添加自定义域名支持**
   - 让用户绑定自己的域名（如 `www.example.com`）
   - 实现 DNS 验证流程

2. **实现 Vercel API 集成**
   - 自动化部署流程
   - 使用 Vercel API 创建和管理部署

3. **添加分析功能**
   - 跟踪子域名访问量
   - 提供部署成功率统计

4. **实现 CDN 缓存**
   - 优化子域名页面加载速度
   - 配置边缘缓存策略

---

## 📚 参考资料

- [Vercel 泛域名文档](https://vercel.com/docs/concepts/projects/domains/wildcard-domains)
- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

如有问题，请查看 `/VERCEL_SUBDOMAIN_SOLUTION.md` 了解详细的技术方案。
