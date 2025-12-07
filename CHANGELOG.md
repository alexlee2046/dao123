# 更新日志

## [2025-12-05] - Vercel 一键部署与子域名功能

### ✨ 新增功能

#### 🌐 子域名系统
- **自定义子域名**: 用户可以为项目设置自定义子域名（如 `my-site.dao123.me`）
- **实时验证**: 输入时自动验证子域名格式和可用性
- **智能建议**: 基于项目名称自动生成合适的子域名
- **保留字系统**: 防止用户使用系统保留的关键子域名（如 `www`, `api`, `admin` 等）

#### 🚀 Vercel 部署集成
- **一键部署**: 简化的 Vercel 部署流程
- **环境变量预填**: 自动配置必需的环境变量
- **部署指导**: 清晰的分步说明
- **部署历史**: 追踪所有部署记录

#### 📊 数据库更新
- 新增 `subdomain` 字段到 `projects` 表
- 新增 `custom_domain` 字段（支持完全自定义域名）
- 新增 `deployment_status` 字段（追踪部署状态）
- 新增 `deployed_at` 时间戳
- 创建 `reserved_subdomains` 表
- 创建 `deployment_history` 表

### 🔧 改进

#### UI/UX 增强
- **多步骤发布流程**: 
  1. 选择发布方式
  2. 配置确认
  3. 部署进度
  4. 成功确认
- **视觉反馈**: 实时显示验证状态（✓ 可用 / ✗ 不可用）
- **错误提示**: 清晰的错误信息和建议
- **URL 预览**: 实时显示完整的子域名 URL

#### 安全增强
- 子域名格式验证（前端 + 后端双重验证）
- SQL 注入防护
- 数据库约束和触发器
- Row Level Security (RLS) 策略

### 📁 新增文件

#### 文档
- `VERCEL_SUBDOMAIN_SOLUTION.md` - 完整技术方案
- `SUBDOMAIN_DEPLOYMENT_GUIDE.md` - 部署指南  
- `IMPLEMENTATION_SUMMARY.md` - 实现总结
- `CHANGELOG.md` - 本更新日志

#### 代码
- `src/lib/subdomain.ts` - 子域名工具函数库
- `src/app/api/subdomain/check/route.ts` - 子域名检查 API
- `migrations/add_subdomain_support.sql` - 数据库迁移脚本
- `scripts/migrate-subdomain.js` - 自动化迁移脚本
- `scripts/setup-subdomain.sh` - 快速启动脚本

#### 修改
- `src/components/studio/PublishModal.tsx` - 完全重写

### 🎯 功能规格

#### 子域名验证规则
- ✅ 长度: 3-63 个字符
- ✅ 字符: 小写字母、数字、连字符
- ✅ 格式: 不能以连字符开头或结尾
- ✅ 唯一性: 每个子域名只能使用一次
- ❌ 保留字: 32 个系统保留子域名

#### 部署状态
- `draft` - 草稿（未部署）
- `deploying` - 部署中
- `deployed` - 已部署
- `failed` - 部署失败

### 🚀 如何使用

#### 快速开始
```bash
# 1. 应用数据库迁移
# 访问 Supabase Dashboard > SQL Editor
# 运行 migrations/add_subdomain_support.sql

# 2. 启动开发服务器
npm run dev

# 3. 测试功能
# 访问 http://localhost:3006/studio/new
# 点击发布按钮
```

#### 生产部署
```bash
# 运行快速启动脚本
bash scripts/setup-subdomain.sh
```

查看 `SUBDOMAIN_DEPLOYMENT_GUIDE.md` 了解详细步骤。

### 🔮 未来计划

- [ ] 完整的 Vercel API 集成（自动化部署）
- [ ] Viewer 模板仓库（用于展示用户项目）
- [ ] 完全自定义域名支持
- [ ] DNS 验证流程
- [ ] 访问统计和分析
- [ ] 部署性能监控
- [ ] 批量部署功能

### 📚 参考资料

- [Vercel 泛域名文档](https://vercel.com/docs/concepts/projects/domains/wildcard-domains)
- [Supabase RLS 文档](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### 🐛 已知问题

无

### 💬 反馈

如有问题或建议，请查看相关文档或联系技术支持。

---

## 技术细节

### API 端点

#### POST `/api/subdomain/check`
检查子域名可用性

**请求**:
```json
{
  "subdomain": "my-site"
}
```

**响应**:
```json
{
  "available": true
}
```

### 数据库架构

#### Projects 表新增字段
```sql
subdomain TEXT UNIQUE
custom_domain TEXT
deployed_at TIMESTAMPTZ
deployment_status TEXT CHECK (deployment_status IN ('draft', 'deploying', 'deployed', 'failed'))
```

#### Reserved Subdomains 表
```sql
CREATE TABLE reserved_subdomains (
  subdomain TEXT PRIMARY KEY,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Deployment History 表
```sql
CREATE TABLE deployment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL,
  status TEXT NOT NULL,
  vercel_deployment_id TEXT,
  deployment_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### 工具函数

```typescript
// 验证子域名格式
validateSubdomain(subdomain: string): { valid: boolean; error?: string }

// 检查可用性
checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean; error?: string }>

// 生成建议
suggestSubdomain(input: string): string

// 获取完整 URL
getSubdomainUrl(subdomain: string): string

// 提取子域名
extractSubdomain(hostname: string): string | null

// 生成 Vercel 部署链接
getVercelDeployUrl(config): string
```

---

**版本**: 1.0.0  
**日期**: 2025-12-05  
**作者**: Antigravity AI
