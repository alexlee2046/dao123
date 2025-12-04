# 模型管理系统

## 功能概述

这个更新添加了一个完整的AI模型管理系统,包括:

1. **模型数据库表** - 存储所有可用的AI模型配置
2. **管理员模型管理页面** - `/admin/models` 页面用于管理模型
3. **自动化模型选择** - 在ChatAssistant中动态加载启用的模型
4. **最新模型支持** - 修复了DeepSeek V3.2的模型ID问题

## 已修复的问题

### DeepSeek Chat V3.2 模型ID错误

**问题**: 使用了错误的模型ID `deepseek/deepseek-chat-v3.2`,导致400错误

**解决方案**: 
- 正确的模型ID为: `deepseek/deepseek-v3.2-exp` (免费实验版)
- 或者: `deepseek/deepseek-v3.2-speciale` (高性能推理版)

已更新以下文件:
- `src/components/studio/ChatAssistant.tsx` - 更新硬编码模型列表
- `src/lib/pricing.ts` - 添加新模型的定价配置

## 数据库迁移步骤

### 方法1: 使用Supabase Dashboard (推荐)

1. 登录到 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制 `migrations/add_models_table.sql` 的内容
5. 粘贴并执行

### 方法2: 使用Node.js脚本

运行以下命令:

```bash
npm run migrate:models
```

### 方法3: 手动执行SQL

```bash
# 设置环境变量
export SUPABASE_URL="你的Supabase URL"
export SUPABASE_SERVICE_KEY="你的Service Role Key"

# 执行迁移
psql $SUPABASE_URL -f migrations/add_models_table.sql
```

## 使用管理员面板

### 访问模型管理页面

1. 确保你的账户具有 `admin` 角色
2. 访问: `http://localhost:3000/admin/models`
3. 你会看到一个完整的模型管理界面

### 功能列表

- ✅ 查看所有模型
- ✅ 创建新模型
- ✅ 编辑现有模型
- ✅ 删除模型
- ✅ 启用/禁用模型
- ✅ 批量导入推荐模型
- ✅ 按类型筛选 (Chat/Image/Video)
- ✅ 标记免费模型

### 批量导入推荐模型

点击 **"导入推荐模型"** 按钮会自动导入以下模型:

#### Chat Models (对话模型)
- GPT-5 (OpenAI)
- GPT-4o (OpenAI)
- Claude 3.5 Sonnet (Anthropic)
- Gemini 3 Pro Preview (Google)
- DeepSeek V3.2 Experimental (DeepSeek) ⭐ 新增
- DeepSeek V3.2 Speciale (DeepSeek) ⭐ 新增
- Qwen3 Coder (Qwen)

#### Image Models (图像生成)
- DALL-E 3 (OpenAI)
- Flux 1.1 Pro (Black Forest Labs)

#### Video Models (视频生成)
- Luma Dream Machine (Luma)

## 定价配置

在 `src/lib/pricing.ts` 中配置了以下模型价格:

| 模型 | 积分/请求 | 备注 |
|------|----------|------|
| `deepseek/deepseek-v3.2-exp` | 1 | 免费实验版 |
| `deepseek/deepseek-v3.2-speciale` | 3 | 高性能推理 |
| `openai/gpt-5` | 20 | 高级模型 |
| `google/gemini-2.0-flash-exp:free` | 1 | 免费 |

## 更新内容

### 新增文件

1. `src/lib/actions/admin-models.ts` - 模型管理的Server Actions
2. `src/app/(app)/admin/models/page.tsx` - 管理员模型管理页面
3. `migrations/add_models_table.sql` - 数据库迁移脚本
4. `MODEL_UPDATE_2025.md` - 本文档

### 修改文件

1. `src/components/studio/ChatAssistant.tsx`
   - 修复过时的DeepSeek模型ID
   - 从 `deepseek-chat-v3.1:free` 更新为 `deepseek-v3.2-exp`

2. `src/lib/pricing.ts`
   - 添加 DeepSeek V3.2 模型定价

3. `src/components/dashboard/AppSidebar.tsx`
   - 添加管理员角色检测
   - 添加 "Model Management" 菜单项(仅管理员可见)

4. `src/lib/actions/models.ts`
   - 已存在,用于获取启用的模型列表

## OpenRouter 模型ID格式

所有模型ID遵循OpenRouter的命名规范:

```
provider/model-name[:variant]
```

示例:
- `openai/gpt-4o`
- `deepseek/deepseek-v3.2-exp`
- `google/gemini-2.0-flash-exp:free`

## 故障排除

### 问题1: 未找到models表

**解决方案**: 执行数据库迁移脚本

### 问题2: 权限被拒绝

**解决方案**: 确保你的账户角色是 `admin`

```sql
-- 在Supabase SQL Editor中运行
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 问题3: 模型API调用失败

**解决方案**: 
1. 检查OpenRouter API密钥配置
2. 确认模型ID正确
3. 查看 `src/lib/pricing.ts` 确认模型已添加定价

## 下一步建议

1. ✅ 执行数据库迁移
2. ✅ 将你的账户设置为管理员
3. ✅ 访问 `/admin/models` 导入推荐模型
4. ✅ 测试聊天功能,确认模型切换正常工作
5. ⏭️ 根据需要添加更多自定义模型

## 技术细节

### 数据库Schema

```sql
CREATE TABLE models (
    id TEXT PRIMARY KEY,              -- OpenRouter模型ID
    name TEXT NOT NULL,               -- 显示名称
    provider TEXT NOT NULL,           -- 提供商
    type TEXT NOT NULL,               -- 'chat' | 'image' | 'video'
    enabled BOOLEAN DEFAULT true,     -- 是否启用
    is_free BOOLEAN DEFAULT false,    -- 是否免费
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### API权限

所有模型管理操作需要管理员权限:
- `getAllModels()` - 获取所有模型
- `createModel()` - 创建新模型
- `updateModel()` - 更新模型
- `deleteModel()` - 删除模型
- `bulkImportModels()` - 批量导入

## 参考资源

- [OpenRouter Models 文档](https://openrouter.ai/docs#models)
- [DeepSeek V3.2 发布说明](https://openrouter.ai/models/deepseek/deepseek-v3.2-exp)
- [Supabase SQL Editor](https://app.supabase.com)
