# 🚀 Vercel 一键部署 - 快速参考指南

这是子域名功能的快速参考文档，用于日常开发和部署。

---

## 📋 快速开始（3 步）

### 1️⃣ 应用数据库迁移

```bash
# 方法 A：在 Supabase Dashboard 手动运行
# 1. 访问 https://app.supabase.com
# 2. 进入 SQL Editor
# 3. 运行 migrations/add_subdomain_support.sql

# 方法 B：使用命令行（需要配置 SUPABASE_SERVICE_ROLE_KEY）
node scripts/migrate-subdomain.js
```

### 2️⃣ 启动开发服务器

```bash
npm run dev
```

### 3️⃣ 测试功能

```bash
# 访问编辑器
open http://localhost:3006/studio/new

# 点击发布按钮 → 输入子域名 → 查看验证反馈
```

---

## 🎯 常用命令

```bash
# 快速配置（交互式）
bash scripts/setup-subdomain.sh

# 运行测试
bash scripts/test-subdomain.sh

# 应用数据库迁移
node scripts/migrate-subdomain.js

# 构建检查
npm run build

# 启动生产服务器
npm run start
```

---

## 📂 关键文件位置

### 代码
- **工具函数**: `src/lib/subdomain.ts`
- **API 路由**: `src/app/api/subdomain/check/route.ts`
- **发布组件**: `src/components/studio/PublishModal.tsx`

### 数据库
- **迁移文件**: `migrations/add_subdomain_support.sql`
- **迁移脚本**: `scripts/migrate-subdomain.js`

### 文档
- **技术方案**: `VERCEL_SUBDOMAIN_SOLUTION.md`
- **部署指南**: `SUBDOMAIN_DEPLOYMENT_GUIDE.md`
- **实现总结**: `IMPLEMENTATION_SUMMARY.md`
- **更新日志**: `CHANGELOG.md`

---

## 🔧 API 使用

### 检查子域名可用性

```bash
curl -X POST http://localhost:3006/api/subdomain/check \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"my-test-site"}'
```

响应：
```json
{
  "available": true
}
```

### 前端调用

```typescript
import { checkSubdomainAvailability } from '@/lib/subdomain';

const result = await checkSubdomainAvailability('my-site');
if (result.available) {
  console.log('可用！');
}
```

---

## ✅ 子域名规则速查

### ✓ 有效示例
- `my-site`
- `alex-portfolio`
- `blog2024`
- `cool-app-123`

### ✗ 无效示例
- `ab` ← 太短（最少 3 个字符）
- `www` ← 保留字
- `-mysite` ← 不能以连字符开头
- `mysite-` ← 不能以连字符结尾
- `my--site` ← 不能有连续连字符
- `My-Site` ← 必须小写
- `my_site` ← 不能有下划线
- `my.site` ← 不能有点号

### 保留字列表（32 个）
`www`, `api`, `admin`, `app`, `mail`, `ftp`, `smtp`, `pop`, `imap`, `blog`, `shop`, `store`, `dev`, `staging`, `test`, `static`, `assets`, `cdn`, `docs`, `help`, `support`, `status`, `dashboard`, `console`, `portal`, `vpn`, `ssh`, `git`, `svn`, `mysql`, `postgres`, `redis`, `memcached`

---

## 🗃️ 数据库速查

### 查询所有已部署项目

```sql
SELECT name, subdomain, deployment_status, deployed_at
FROM projects
WHERE subdomain IS NOT NULL
ORDER BY deployed_at DESC;
```

### 检查子域名是否存在

```sql
SELECT id, subdomain 
FROM projects 
WHERE subdomain = 'my-site';
```

### 查看部署历史

```sql
SELECT * 
FROM deployment_history 
WHERE project_id = 'your-project-id'
ORDER BY created_at DESC;
```

### 查看保留子域名

```sql
SELECT * FROM reserved_subdomains;
```

---

## 🐛 常见问题

### 问题：子域名检查总是返回错误

**解决方法**：
1. 检查开发服务器是否运行
2. 检查 API 路由：`/api/subdomain/check/route.ts`
3. 查看浏览器控制台的网络请求
4. 确认数据库迁移已应用

### 问题：数据库迁移失败

**解决方法**：
1. 确认环境变量 `SUPABASE_SERVICE_ROLE_KEY` 正确
2. 在 Supabase Dashboard 手动运行 SQL
3. 检查是否有足够的数据库权限

### 问题：构建失败

**解决方法**：
```bash
# 清理缓存
rm -rf .next

# 重新安装依赖
rm -rf node_modules
npm install

# 再次构建
npm run build
```

---

## 🎨 工具函数速查

### `validateSubdomain(subdomain)`
验证子域名格式
```typescript
const { valid, error } = validateSubdomain('my-site');
```

### `normalizeSubdomain(subdomain)`
标准化子域名（转小写、去空格）
```typescript
const normalized = normalizeSubdomain('My-Site '); // 'my-site'
```

### `suggestSubdomain(input)`
自动生成子域名建议
```typescript
const suggestion = suggestSubdomain('My Cool Project'); // 'my-cool-project'
```

### `getSubdomainUrl(subdomain)`
生成完整 URL
```typescript
const url = getSubdomainUrl('my-site'); // 'https://my-site.dao123.me'
```

### `extractSubdomain(hostname)`
从主机名提取子域名
```typescript
const sub = extractSubdomain('my-site.dao123.me'); // 'my-site'
```

### `checkSubdomainAvailability(subdomain)`
检查可用性（异步）
```typescript
const { available, error } = await checkSubdomainAvailability('my-site');
```

---

## 🚀 生产部署

### DNS 配置（Vercel 泛域名）

1. **修改 Nameservers**：
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

2. **在 Vercel 添加域名**：
   - `dao123.me`
   - `*.dao123.me`

3. **等待 DNS 传播**（5-30 分钟）

4. **验证**：
   ```bash
   dig dao123.me
   dig test.dao123.me
   ```

### 环境变量

```bash
# .env.local
NEXT_PUBLIC_BASE_DOMAIN=dao123.me
NEXT_PUBLIC_VIEWER_TEMPLATE_REPO=username/dao123-viewer-template
VERCEL_TOKEN=your_token  # 可选
```

---

## 📊 测试清单

- [ ] 输入有效子域名显示 ✓ 可用
- [ ] 输入无效子域名显示错误提示
- [ ] 保留字被正确拦截
- [ ] 太短的子域名被拒绝
- [ ] 已存在的子域名显示"已占用"
- [ ] 可以成功保存子域名到数据库
- [ ] API `/api/subdomain/check` 正常工作
- [ ] 发布流程完整可用

---

## 📞 获取帮助

查看详细文档：
- **技术细节**: `VERCEL_SUBDOMAIN_SOLUTION.md`
- **部署步骤**: `SUBDOMAIN_DEPLOYMENT_GUIDE.md`
- **完整实现**: `IMPLEMENTATION_SUMMARY.md`

---

**最后更新**: 2025-12-05  
**版本**: 1.0.0
