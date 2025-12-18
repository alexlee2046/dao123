# 产品需求文档 (PRD)

## Phase 1: 获客闭环系统

> 版本: 1.0  
> 日期: 2025年12月18日  
> 状态: 草稿

---

## 一、背景与目标

### 1.1 背景

根据市场调研（见 `market-research-2025-12.md`），当前市场上：
- **建站工具**（Framer/Durable）停在"发布"这一步
- **邮件工具**（Lemlist/Instantly）需要用户自备线索和落地页
- **没有产品**真正做到 AI建站 → 线索收集 → 自动化触达 的端到端闭环

Dao123 现有功能已具备：
- ✅ AI 网站生成
- ✅ 可视化编辑器 (GrapesJS)
- ✅ 联系人管理
- ✅ 线索搜索 (Hunter.io)
- ✅ 邮件编辑器 (Easy Email)
- ✅ 邮件追踪 (打开/点击)
- 🟡 自动化框架（仅数据模型）
- ❌ 表单构建器
- ❌ 邮件发送服务
- ❌ 自动化执行引擎

### 1.2 目标

**打通 "建站 → 收集 → 触达" 闭环**，实现差异化卖点：

```
用户建站 → 嵌入表单 → 访客提交 → 自动加入联系人 → 触发邮件序列 → 追踪转化
```

### 1.3 成功指标

| 指标 | 目标值 |
|------|--------|
| 表单创建 → 发布转化率 | > 60% |
| 自动化序列激活率 | > 40% |
| 邮件送达率 | > 95% |
| 用户获客成本降低 | 对比使用多工具方案降低 50% |

---

## 二、功能范围

### 2.1 本期交付（P0）

| 模块 | 功能 | 优先级 |
|------|------|--------|
| 表单构建器 | 拖拽式表单创建、嵌入代码生成 | P0 |
| 表单数据收集 | 提交记录存储、联系人自动创建 | P0 |
| 邮件发送服务 | Resend 集成、批量发送 | P0 |
| 自动化引擎 | 表单触发、延迟发送、序列执行 | P0 |

### 2.2 下期规划（P1）

| 模块 | 功能 |
|------|------|
| 条件逻辑 | 表单字段条件显示/隐藏 |
| 行为触发 | 页面访问、标签变更触发 |
| A/B 测试 | 邮件变体自动分发 |
| 可视化自动化构建器 | 拖拽式流程编排 |

---

## 三、详细需求

### 3.1 表单构建器

#### 3.1.1 用户故事

```
作为网站创建者，
我希望能够快速创建表单并嵌入到我的网站中，
以便收集访客信息（姓名、邮箱、公司等）。
```

#### 3.1.2 功能需求

**F1.1 表单管理**

| ID | 需求 | 描述 |
|----|------|------|
| F1.1.1 | 创建表单 | 输入名称，选择模板或从空白开始 |
| F1.1.2 | 表单列表 | 显示所有表单，支持搜索、排序 |
| F1.1.3 | 编辑表单 | 修改表单字段和设置 |
| F1.1.4 | 删除表单 | 软删除，保留历史数据 |
| F1.1.5 | 复制表单 | 快速复制现有表单 |

**F1.2 表单编辑器**

| ID | 需求 | 描述 |
|----|------|------|
| F1.2.1 | 字段类型 | 文本、邮箱、电话、下拉选择、单选、多选、文本域 |
| F1.2.2 | 字段属性 | 标签、占位符、必填、默认值、验证规则 |
| F1.2.3 | 拖拽排序 | 拖拽调整字段顺序 |
| F1.2.4 | 实时预览 | 右侧实时显示表单效果 |
| F1.2.5 | 样式设置 | 主题色、按钮文字、成功提示 |

**F1.3 表单发布**

| ID | 需求 | 描述 |
|----|------|------|
| F1.3.1 | 嵌入代码 | 生成 iframe / script 嵌入代码 |
| F1.3.2 | 独立链接 | 生成表单独立访问 URL |
| F1.3.3 | GrapesJS 集成 | 在 Studio 编辑器中作为组件拖入 |

#### 3.1.3 数据模型

```sql
-- 表单定义
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id uuid REFERENCES sites(id) ON DELETE SET NULL,  -- 可选关联站点
  name text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]',  -- FormField[]
  settings jsonb NOT NULL DEFAULT '{}', -- FormSettings
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  submission_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 表单字段结构
-- fields: FormField[]
{
  "id": "field_xxx",
  "type": "email" | "text" | "phone" | "select" | "radio" | "checkbox" | "textarea",
  "label": "Email Address",
  "placeholder": "Enter your email",
  "required": true,
  "validation": {
    "pattern": "^[^@]+@[^@]+\\.[^@]+$",
    "message": "Please enter a valid email"
  },
  "options": [  // 仅 select/radio/checkbox
    { "label": "Option 1", "value": "opt1" }
  ],
  "mapping": "email"  // 映射到联系人字段: email|first_name|last_name|company_name|phone|custom
}

-- 表单设置结构
-- settings: FormSettings
{
  "theme": {
    "primaryColor": "#3b82f6",
    "backgroundColor": "#ffffff",
    "borderRadius": 8
  },
  "submitButton": {
    "text": "Submit",
    "loadingText": "Submitting..."
  },
  "successMessage": "Thank you for your submission!",
  "redirectUrl": null,  // 提交后跳转URL
  "notifyEmail": null,  // 通知邮箱
  "automationId": null  // 触发的自动化ID
}

-- 表单提交记录
CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  data jsonb NOT NULL,  -- 原始提交数据
  metadata jsonb DEFAULT '{}',  -- IP、UA、referrer等
  created_at timestamptz DEFAULT now()
);

-- 索引
CREATE INDEX idx_forms_user_id ON forms(user_id);
CREATE INDEX idx_forms_site_id ON forms(site_id);
CREATE INDEX idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_contact_id ON form_submissions(contact_id);
```

#### 3.1.4 API 设计

```typescript
// Server Actions (src/lib/actions/forms/)

// 表单 CRUD
export async function createForm(data: CreateFormInput): Promise<Form>
export async function getForms(): Promise<Form[]>
export async function getForm(id: string): Promise<Form | null>
export async function updateForm(id: string, data: UpdateFormInput): Promise<Form>
export async function deleteForm(id: string): Promise<void>
export async function duplicateForm(id: string): Promise<Form>

// 表单提交
export async function submitForm(formId: string, data: Record<string, any>, metadata?: SubmissionMetadata): Promise<FormSubmission>
export async function getFormSubmissions(formId: string, options?: PaginationOptions): Promise<FormSubmission[]>

// API Routes (公开接口，供嵌入表单调用)
POST /api/forms/[formId]/submit  -- 表单提交
GET  /api/forms/[formId]         -- 获取表单定义（公开字段）
```

#### 3.1.5 UI 设计

**页面路由**：
- `/mail/forms` - 表单列表页
- `/mail/forms/new` - 创建表单
- `/mail/forms/[id]` - 编辑表单
- `/mail/forms/[id]/submissions` - 查看提交记录

**组件结构**：
```
src/components/forms/
├── FormList.tsx              # 表单列表
├── FormEditor/
│   ├── index.tsx             # 编辑器主组件
│   ├── FieldPalette.tsx      # 字段类型面板
│   ├── FieldEditor.tsx       # 单个字段编辑
│   ├── SettingsPanel.tsx     # 表单设置面板
│   ├── PreviewPanel.tsx      # 实时预览
│   └── EmbedCodeDialog.tsx   # 嵌入代码弹窗
├── FormRenderer.tsx          # 表单渲染（用于嵌入）
└── SubmissionsTable.tsx      # 提交记录表格
```

---

### 3.2 表单数据 → 联系人自动同步

#### 3.2.1 用户故事

```
作为网站创建者，
我希望表单提交的数据能自动创建/更新联系人，
以便我无需手动导入即可开始营销。
```

#### 3.2.2 功能需求

| ID | 需求 | 描述 |
|----|------|------|
| F2.1 | 字段映射 | 表单字段映射到联系人字段（email必填） |
| F2.2 | 自动创建 | 新邮箱自动创建联系人，source='form' |
| F2.3 | 自动更新 | 已存在邮箱更新其他字段 |
| F2.4 | 自动标签 | 根据表单名称/来源自动打标签 |
| F2.5 | 去重策略 | 基于 email 去重 |

#### 3.2.3 处理流程

```
表单提交
    ↓
验证必填字段 + 格式校验
    ↓
存储 form_submissions 记录
    ↓
提取 email 字段
    ↓
查询 contacts 是否存在
    ├── 不存在 → createContact({ ..., source: 'form', tags: ['form:表单名'] })
    └── 存在 → updateContact({ ... }) 更新非空字段
    ↓
关联 form_submissions.contact_id
    ↓
检查 forms.settings.automationId
    ├── 有 → 触发自动化
    └── 无 → 结束
```

---

### 3.3 邮件发送服务

#### 3.3.1 用户故事

```
作为营销人员，
我希望能够发送邮件给我的联系人，
并追踪邮件的送达、打开和点击情况。
```

#### 3.3.2 功能需求

| ID | 需求 | 描述 |
|----|------|------|
| F3.1 | 邮件服务商 | 集成 Resend（首选，API简洁，免费额度充足） |
| F3.2 | 单封发送 | 发送单封邮件给指定联系人 |
| F3.3 | 批量发送 | 批量发送给联系人列表（限流100封/秒） |
| F3.4 | 追踪注入 | 自动注入打开追踪像素和点击追踪链接 |
| F3.5 | 退订链接 | 自动添加退订链接 |
| F3.6 | 发送记录 | 记录到 email_logs 表 |

#### 3.3.3 技术选型

**选择 Resend 的理由**：
- API 设计现代、简洁
- 免费额度：3000封/月
- 支持 React Email 模板
- 送达率高，自带 DKIM/SPF
- Next.js 集成友好

**备选方案**：
- SendGrid（更成熟，但 API 复杂）
- AWS SES（最便宜，但配置复杂）

#### 3.3.4 数据模型更新

```sql
-- 更新 email_logs 表
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS
  message_id text,           -- Resend 返回的消息ID
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  error_message text,
  delivered_at timestamptz,
  bounced_at timestamptz;

-- 退订记录
CREATE TABLE email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  contact_id uuid REFERENCES contacts(id),
  email text NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);
```

#### 3.3.5 发送流程

```typescript
// src/lib/mail/sender.ts

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  campaignId?: string;
  contactId?: string;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

async function sendEmail(options: SendEmailOptions): Promise<SendResult> {
  // 1. 检查退订名单
  if (await isUnsubscribed(options.to)) {
    return { success: false, reason: 'unsubscribed' };
  }

  // 2. 注入追踪代码
  let html = options.html;
  if (options.trackOpens) {
    html = injectOpenTracker(html, logId);
  }
  if (options.trackClicks) {
    html = injectClickTracker(html, logId);
  }

  // 3. 添加退订链接
  html = injectUnsubscribeLink(html, unsubscribeUrl);

  // 4. 调用 Resend API
  const result = await resend.emails.send({
    from: options.from || 'noreply@dao123.com',
    to: options.to,
    subject: options.subject,
    html: html,
  });

  // 5. 记录发送日志
  await createEmailLog({
    campaignId: options.campaignId,
    contactId: options.contactId,
    messageId: result.id,
    status: 'sent',
  });

  return { success: true, messageId: result.id };
}

// 批量发送（带限流）
async function sendBulkEmails(
  emails: SendEmailOptions[],
  options: { rateLimit: number } = { rateLimit: 100 }
): Promise<BulkSendResult> {
  const results = [];
  for (const batch of chunk(emails, options.rateLimit)) {
    const batchResults = await Promise.all(
      batch.map(email => sendEmail(email))
    );
    results.push(...batchResults);
    await sleep(1000); // 每批次间隔1秒
  }
  return { total: emails.length, sent: results.filter(r => r.success).length };
}
```

#### 3.3.6 Webhook 处理

```typescript
// POST /api/mail/webhook/resend
// 处理 Resend 的事件回调

export async function POST(request: Request) {
  const event = await request.json();
  
  switch (event.type) {
    case 'email.delivered':
      await updateEmailLog(event.data.email_id, { 
        status: 'delivered', 
        delivered_at: new Date() 
      });
      break;
    case 'email.opened':
      await logOpen(event.data.email_id);
      break;
    case 'email.clicked':
      await logClick(event.data.email_id, event.data.link);
      break;
    case 'email.bounced':
      await updateEmailLog(event.data.email_id, { 
        status: 'bounced', 
        bounced_at: new Date(),
        error_message: event.data.reason 
      });
      break;
    case 'email.complained':
      await handleComplaint(event.data.email);
      break;
  }
  
  return Response.json({ received: true });
}
```

---

### 3.4 自动化引擎

#### 3.4.1 用户故事

```
作为营销人员，
我希望当有人提交表单后，系统能自动发送一系列邮件，
以便我无需手动跟进每一个潜在客户。
```

#### 3.4.2 功能需求

| ID | 需求 | 描述 |
|----|------|------|
| F4.1 | 触发类型 | 表单提交、手动添加联系人、标签变更 |
| F4.2 | 动作类型 | 发送邮件、等待、添加标签 |
| F4.3 | 序列步骤 | 支持多步骤串联 |
| F4.4 | 延迟执行 | 支持分钟/小时/天延迟 |
| F4.5 | 状态管理 | 跟踪每个联系人在序列中的进度 |
| F4.6 | 手动停止 | 支持停止单个联系人或整个自动化 |

#### 3.4.3 数据模型

```sql
-- 更新 automations 表结构
ALTER TABLE automations DROP COLUMN IF EXISTS steps;
ALTER TABLE automations ADD COLUMN steps jsonb NOT NULL DEFAULT '[]';

-- steps 结构: AutomationStep[]
{
  "id": "step_xxx",
  "type": "send_email" | "wait" | "add_tag" | "remove_tag",
  "config": {
    // send_email
    "templateId": "uuid",
    "subject": "Welcome!",
    
    // wait
    "duration": 24,
    "unit": "hours" | "minutes" | "days",
    
    // add_tag / remove_tag
    "tag": "engaged"
  },
  "order": 1
}

-- 自动化执行记录（跟踪每个联系人的进度）
CREATE TABLE automation_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid REFERENCES automations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  current_step_index integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'error')),
  next_action_at timestamptz,  -- 下一步执行时间
  error_message text,
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(automation_id, contact_id)
);

-- 步骤执行日志
CREATE TABLE automation_step_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid REFERENCES automation_enrollments(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  step_type text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'skipped', 'error')),
  result jsonb,
  executed_at timestamptz DEFAULT now()
);

-- 索引
CREATE INDEX idx_enrollments_automation ON automation_enrollments(automation_id);
CREATE INDEX idx_enrollments_contact ON automation_enrollments(contact_id);
CREATE INDEX idx_enrollments_next_action ON automation_enrollments(next_action_at) 
  WHERE status = 'active';
```

#### 3.4.4 执行引擎设计

```typescript
// src/lib/automation/engine.ts

// 1. 触发入口
export async function triggerAutomation(
  automationId: string, 
  contactId: string,
  triggerData?: Record<string, any>
): Promise<void> {
  const automation = await getAutomation(automationId);
  
  if (!automation?.is_active) return;
  
  // 检查是否已在序列中
  const existing = await getEnrollment(automationId, contactId);
  if (existing && existing.status === 'active') return;
  
  // 创建新的 enrollment
  const enrollment = await createEnrollment({
    automation_id: automationId,
    contact_id: contactId,
    current_step_index: 0,
    next_action_at: new Date(), // 立即执行第一步
  });
  
  // 立即执行第一步
  await executeNextStep(enrollment.id);
}

// 2. 执行下一步
export async function executeNextStep(enrollmentId: string): Promise<void> {
  const enrollment = await getEnrollment(enrollmentId);
  const automation = await getAutomation(enrollment.automation_id);
  const steps = automation.steps as AutomationStep[];
  
  if (enrollment.current_step_index >= steps.length) {
    // 序列完成
    await updateEnrollment(enrollmentId, { 
      status: 'completed', 
      completed_at: new Date() 
    });
    return;
  }
  
  const currentStep = steps[enrollment.current_step_index];
  
  try {
    const result = await executeStep(currentStep, enrollment.contact_id);
    
    // 记录执行日志
    await createStepLog({
      enrollment_id: enrollmentId,
      step_index: enrollment.current_step_index,
      step_type: currentStep.type,
      status: 'executed',
      result,
    });
    
    // 计算下一步时间
    const nextStepIndex = enrollment.current_step_index + 1;
    const nextStep = steps[nextStepIndex];
    
    if (nextStep) {
      const nextActionAt = calculateNextActionTime(nextStep);
      await updateEnrollment(enrollmentId, {
        current_step_index: nextStepIndex,
        next_action_at: nextActionAt,
      });
    } else {
      await updateEnrollment(enrollmentId, { 
        status: 'completed', 
        completed_at: new Date() 
      });
    }
  } catch (error) {
    await updateEnrollment(enrollmentId, { 
      status: 'error', 
      error_message: error.message 
    });
  }
}

// 3. 执行单个步骤
async function executeStep(
  step: AutomationStep, 
  contactId: string
): Promise<any> {
  switch (step.type) {
    case 'send_email':
      const contact = await getContact(contactId);
      const template = await getTemplate(step.config.templateId);
      return await sendEmail({
        to: contact.email,
        subject: step.config.subject || template.name,
        html: template.content_html,
        contactId,
      });
      
    case 'add_tag':
      return await addTagToContact(contactId, step.config.tag);
      
    case 'remove_tag':
      return await removeTagFromContact(contactId, step.config.tag);
      
    case 'wait':
      // wait 步骤不需要执行动作，只影响 next_action_at
      return { waited: true };
      
    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}

// 4. 定时任务处理器（需要 Vercel Cron 或外部调度）
export async function processScheduledSteps(): Promise<void> {
  // 查询所有待执行的 enrollments
  const pendingEnrollments = await supabase
    .from('automation_enrollments')
    .select('id')
    .eq('status', 'active')
    .lte('next_action_at', new Date().toISOString())
    .limit(100);
  
  // 并行执行（带限流）
  for (const enrollment of pendingEnrollments.data || []) {
    await executeNextStep(enrollment.id);
  }
}
```

#### 3.4.5 定时任务配置

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/automation",
      "schedule": "* * * * *"  // 每分钟执行
    }
  ]
}
```

```typescript
// src/app/api/cron/automation/route.ts
import { processScheduledSteps } from '@/lib/automation/engine';

export async function GET(request: Request) {
  // 验证 Vercel Cron 密钥
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await processScheduledSteps();
  return Response.json({ success: true });
}
```

#### 3.4.6 UI 设计

**页面路由**：
- `/mail/automations` - 自动化列表
- `/mail/automations/new` - 创建自动化
- `/mail/automations/[id]` - 编辑自动化
- `/mail/automations/[id]/enrollments` - 查看执行记录

**组件结构**：
```
src/components/automations/
├── AutomationList.tsx        # 自动化列表
├── AutomationEditor/
│   ├── index.tsx             # 编辑器主组件
│   ├── TriggerSelector.tsx   # 触发条件选择
│   ├── StepList.tsx          # 步骤列表
│   ├── StepEditor.tsx        # 单步骤编辑
│   │   ├── SendEmailStep.tsx
│   │   ├── WaitStep.tsx
│   │   └── TagStep.tsx
│   └── PreviewPanel.tsx      # 流程预览
└── EnrollmentsTable.tsx      # 执行记录表格
```

---

## 四、集成点

### 4.1 表单 ↔ 自动化

```typescript
// 表单提交后触发自动化
async function handleFormSubmission(formId: string, data: Record<string, any>) {
  // 1. 保存提交记录
  const submission = await createFormSubmission(formId, data);
  
  // 2. 创建/更新联系人
  const contact = await syncContactFromSubmission(submission);
  
  // 3. 触发关联的自动化
  const form = await getForm(formId);
  if (form.settings.automationId) {
    await triggerAutomation(form.settings.automationId, contact.id, {
      trigger: 'form_submission',
      formId,
      submissionId: submission.id,
    });
  }
}
```

### 4.2 GrapesJS ↔ 表单组件

```typescript
// 在 GrapesJS 中注册表单组件
editor.BlockManager.add('dao-form', {
  label: 'Lead Form',
  category: 'Forms',
  content: {
    type: 'dao-form',
    attributes: { 'data-form-id': '' },
  },
});

editor.DomComponents.addType('dao-form', {
  model: {
    defaults: {
      tagName: 'div',
      attributes: { class: 'dao-form-container' },
      traits: [
        {
          type: 'select',
          label: 'Form',
          name: 'data-form-id',
          options: [], // 动态加载用户的表单列表
        },
      ],
    },
  },
  view: {
    onRender() {
      // 渲染表单预览
    },
  },
});
```

### 4.3 活动发送 ↔ 邮件服务

```typescript
// 更新 campaigns 发送逻辑
async function sendCampaign(campaignId: string): Promise<void> {
  const campaign = await getCampaign(campaignId);
  const contacts = await getCampaignAudience(campaignId);
  
  // 过滤已退订
  const eligibleContacts = await filterUnsubscribed(contacts);
  
  // 批量发送
  const result = await sendBulkEmails(
    eligibleContacts.map(contact => ({
      to: contact.email,
      subject: campaign.subject,
      html: campaign.content_html,
      campaignId,
      contactId: contact.id,
      trackOpens: true,
      trackClicks: true,
    }))
  );
  
  // 更新活动状态
  await updateCampaign(campaignId, {
    status: 'sent',
    sent_at: new Date(),
    stats: { sent: result.sent },
  });
}
```

---

## 五、技术实现要点

### 5.1 环境变量

```env
# Resend
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@dao123.com
RESEND_WEBHOOK_SECRET=whsec_xxx

# Cron
CRON_SECRET=xxx

# 追踪
TRACKING_DOMAIN=https://dao123.com
```

### 5.2 依赖包

```json
{
  "dependencies": {
    "resend": "^4.0.0",
    "@dnd-kit/core": "^6.0.0",      // 拖拽排序
    "@dnd-kit/sortable": "^8.0.0",
    "zod": "^3.22.0"                // 表单验证
  }
}
```

### 5.3 错误处理

| 场景 | 处理方式 |
|------|----------|
| 邮件发送失败 | 记录错误，3次重试后标记失败 |
| 自动化步骤失败 | 记录错误，停止该联系人的序列 |
| 表单提交失败 | 返回用户友好错误，保留数据重试 |
| Webhook 验证失败 | 记录日志，返回 401 |

### 5.4 安全考虑

| 风险 | 措施 |
|------|------|
| 表单滥用 | Rate limit (10次/分钟/IP) |
| 邮件轰炸 | 退订检查 + 每日限额 |
| XSS 攻击 | 表单内容 sanitize |
| 未授权访问 | RLS 策略 + API 鉴权 |

---

## 六、测试计划

### 6.1 单元测试

| 模块 | 测试项 |
|------|--------|
| 表单字段验证 | 各字段类型的验证规则 |
| 联系人同步 | 创建/更新/去重逻辑 |
| 邮件发送 | 追踪注入、退订检查 |
| 自动化引擎 | 步骤执行、延迟计算 |

### 6.2 集成测试

| 场景 | 预期结果 |
|------|----------|
| 表单提交 → 联系人创建 | 联系人正确创建，source='form' |
| 表单提交 → 自动化触发 | enrollment 创建，第一封邮件发送 |
| 等待步骤 → 定时执行 | next_action_at 正确，定时执行 |
| 邮件打开 → 统计更新 | email_logs 更新，campaign stats 更新 |

### 6.3 E2E 测试

| 流程 | 步骤 |
|------|------|
| 完整获客流程 | 创建表单 → 嵌入网站 → 提交表单 → 收到邮件 → 打开追踪 |

---

## 七、里程碑

| 阶段 | 交付物 | 验收标准 |
|------|--------|----------|
| M1 | 表单构建器 | 能创建、编辑、发布表单 |
| M2 | 表单提交 + 联系人同步 | 提交数据正确存储，联系人自动创建 |
| M3 | 邮件发送服务 | 能发送邮件，追踪正常工作 |
| M4 | 自动化引擎 | 表单触发 → 邮件序列执行 |
| M5 | 集成测试 + Bug 修复 | 全流程跑通 |

---

## 八、风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Resend API 限制 | 免费额度3000封/月 | 监控用量，提示升级 |
| Vercel Cron 限制 | Hobby 计划每日执行有限 | 考虑 Pro 计划或外部调度 |
| 邮件送达率 | 可能进垃圾箱 | 配置 DKIM/SPF/DMARC |

---

## 九、后续迭代

本期完成后，Phase 2 规划：

1. **条件分支** - 根据打开/点击行为分支
2. **AI 序列生成** - 输入产品描述，自动生成邮件序列
3. **可视化流程编辑器** - 拖拽式编排
4. **多触发条件** - 页面访问、时间触发
5. **A/B 测试集成** - 自动化中的邮件变体测试

---

## 附录

### A. 表单字段类型定义

```typescript
type FieldType = 
  | 'text'      // 单行文本
  | 'email'     // 邮箱（带验证）
  | 'phone'     // 电话
  | 'textarea'  // 多行文本
  | 'select'    // 下拉选择
  | 'radio'     // 单选
  | 'checkbox'  // 多选
  | 'number'    // 数字
  | 'date';     // 日期

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: {
    pattern?: string;
    message?: string;
    min?: number;
    max?: number;
  };
  options?: { label: string; value: string }[];
  mapping?: ContactFieldMapping;
}

type ContactFieldMapping = 
  | 'email' 
  | 'first_name' 
  | 'last_name' 
  | 'company_name' 
  | 'phone' 
  | 'position'
  | 'country'
  | `custom:${string}`;
```

### B. 自动化步骤类型定义

```typescript
type StepType = 'send_email' | 'wait' | 'add_tag' | 'remove_tag';

interface AutomationStep {
  id: string;
  type: StepType;
  config: SendEmailConfig | WaitConfig | TagConfig;
  order: number;
}

interface SendEmailConfig {
  templateId: string;
  subject?: string;  // 覆盖模板主题
}

interface WaitConfig {
  duration: number;
  unit: 'minutes' | 'hours' | 'days';
}

interface TagConfig {
  tag: string;
}
```

### C. API 响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// 分页响应
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}
```
