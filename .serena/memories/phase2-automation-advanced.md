# Phase 2: 自动化高级功能

> 创建日期: 2025-12-19
> 状态: 基础功能完成

## 实现进度 (2025-12-19 完成)

### P0: 条件分支 ✅
- [x] StepType 扩展 'condition' | 'split'
- [x] ConditionConfig 接口 (4种条件类型)
- [x] evaluateCondition() 函数
- [x] executeStep() 处理条件和分流
- [x] AutomationEditor 条件步骤 UI

### P1: AI 序列生成 ✅
- [x] /api/ai/automation 端点
- [x] Vercel AI SDK + OpenRouter 集成
- [x] 邮件营销专家 Prompt
- [x] AutomationEditor AI 生成对话框
- [x] 产品描述/目标受众/邮件数量/语气配置

### P2: A/B 测试 ✅
- [x] SplitConfig 变体管理
- [x] selectVariant() 百分比分配
- [x] UI: 变体添加/删除/百分比

---

## 当前架构分析

### 现有类型
```typescript
TriggerType = 'form_submission' | 'contact_created' | 'tag_added' | 'manual'
StepType = 'send_email' | 'wait' | 'add_tag' | 'remove_tag'
```

### 核心文件
- `src/lib/automation/engine.ts` - 执行引擎
- `src/components/automations/AutomationEditor.tsx` - 编辑器UI
- `src/lib/actions/mail/automations.ts` - Server Actions

---

## Phase 2 功能优先级

| 优先级 | 功能 | 复杂度 | 价值 |
|--------|------|--------|------|
| P0 | 条件分支 | 中 | 高 |
| P1 | AI序列生成 | 中 | 高 |
| P2 | A/B测试集成 | 低 | 中 |
| P3 | 多触发条件 | 高 | 中 |
| P4 | 可视化编辑器 | 高 | 低 |

---

## P0: 条件分支

### 新增步骤类型
```typescript
StepType = 
  | 'send_email' 
  | 'wait' 
  | 'add_tag' 
  | 'remove_tag'
  | 'condition'      // 新增
  | 'split'          // 新增: A/B分流

interface ConditionConfig {
  type: 'email_opened' | 'email_clicked' | 'tag_exists' | 'field_equals';
  params: {
    emailStepId?: string;   // 检查哪封邮件
    tag?: string;           // 标签名
    field?: string;         // 字段名
    value?: string;         // 比较值
  };
  trueBranch: AutomationStep[];   // 条件为真执行
  falseBranch: AutomationStep[];  // 条件为假执行
}
```

### 数据模型变更
```sql
-- 在 automation_enrollments 表添加
ALTER TABLE automation_enrollments ADD COLUMN 
  branch_path jsonb DEFAULT '[]';  -- 记录分支路径 ["step_1:true", "step_3:false"]
```

### 执行逻辑变更
- executeStep 处理 condition 类型
- 评估条件 → 选择分支 → 递归执行分支步骤
- 记录分支路径到 branch_path

---

## P1: AI序列生成

### API设计
```typescript
// POST /api/ai/automation
interface GenerateSequenceRequest {
  productDescription: string;
  targetAudience?: string;
  sequenceLength?: number;  // 默认5封
  tone?: 'professional' | 'friendly' | 'casual';
}

interface GenerateSequenceResponse {
  steps: AutomationStep[];
  explanation: string;
}
```

### Prompt模板
```
你是一位专业的邮件营销专家。根据以下产品描述，生成一个{sequenceLength}封邮件的自动化序列。

产品: {productDescription}
目标受众: {targetAudience}
语气: {tone}

要求:
1. 第一封: 欢迎+价值主张
2. 第二封: 痛点+解决方案
3. 第三封: 社会证明+案例
4. 第四封: 功能深入+FAQ
5. 第五封: 限时优惠+CTA

每封邮件之间建议等待2-3天。

输出JSON格式...
```

---

## P2: A/B测试集成

### 新增步骤类型
```typescript
interface SplitConfig {
  variants: Array<{
    id: string;
    name: string;
    percentage: number;  // 0-100
    steps: AutomationStep[];
  }>;
  winnerCriteria?: 'open_rate' | 'click_rate' | 'conversion';
  testDuration?: number;  // 小时
}
```

### 执行逻辑
- 根据百分比随机分配
- 记录到 enrollment 的 variant_id
- 统计各变体表现

---

## 实现计划

### 阶段1: 条件分支 (预计2-3天)
1. 扩展 StepType 和 Config 类型
2. 修改 engine.ts 条件评估逻辑
3. 更新 AutomationEditor UI 支持条件配置
4. 添加 branch_path 字段追踪

### 阶段2: AI序列生成 (预计1-2天)
1. 创建 /api/ai/automation 端点
2. 设计 Prompt 模板
3. 添加 UI 按钮触发生成
4. 解析响应填充步骤

### 阶段3: A/B测试 (预计1天)
1. 添加 split 步骤类型
2. 随机分配逻辑
3. UI 配置界面

---

## 测试用例

### 条件分支
- [ ] 邮件打开后发送跟进
- [ ] 未打开3天后重发
- [ ] 有特定标签走不同路径

### AI生成
- [ ] 生成SaaS产品欢迎序列
- [ ] 生成电商促销序列
- [ ] 自定义语气和长度
