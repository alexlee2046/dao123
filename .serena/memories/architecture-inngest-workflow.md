# Inngest 工作流引擎架构

**创建日期**: 2025-12-20

## 概述

dao123 采用 Inngest 作为核心工作流引擎，实现模块化、可扩展的自动化系统。类似 n8n/Dify 的设计理念，但深度集成 Next.js。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Orchestrator                          │
│         (理解用户意图 → 生成工作流 → 人工审批)                    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Inngest Workflow Engine                       │
│        (编排、执行、暂停、重试、审批、step functions)             │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Email Module │     │  Form Module  │     │  Lead Module  │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ • email.send  │     │ • form.sync   │     │ • lead.search │
│ • contact.add │     │ • form.submit │     │ • lead.enrich │
│ • contact.tag │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Node Registry                               │
│        (节点注册、发现、元数据、能力描述给 AI)                     │
└─────────────────────────────────────────────────────────────────┘
```

## 目录结构

```
src/inngest/
├── client.ts           # Inngest 客户端 + 事件类型定义
├── index.ts            # 主入口，导出所有公共 API
├── core/
│   ├── types.ts        # 节点类型系统 (NodeDefinition, WorkflowStep, etc.)
│   ├── registry.ts     # 节点注册中心
│   └── index.ts
├── modules/
│   ├── email/
│   │   ├── nodes.ts    # email.send, contact.addTag, contact.removeTag
│   │   └── index.ts
│   ├── form/
│   │   ├── nodes.ts    # form.syncContact
│   │   └── index.ts
│   ├── lead-search/    # 待实现
│   └── index.ts        # 模块注册入口
└── functions/
    ├── automation.ts   # 自动化工作流函数
    └── index.ts

src/app/api/inngest/
└── route.ts            # Inngest API 端点
```

## 核心概念

### 1. 节点 (Node)

每个节点是一个独立的执行单元，定义了：
- `meta`: 元数据（ID、名称、描述、图标、输入 schema）
- `execute()`: 执行函数

```typescript
interface NodeDefinition<TInput, TOutput> {
  meta: NodeMeta;
  execute(input: TInput, context: NodeContext): Promise<NodeResult<TOutput>>;
}
```

### 2. 事件 (Event)

Inngest 基于事件驱动，所有事件定义在 `client.ts`:

| 事件 | 触发场景 |
|------|----------|
| `form/submitted` | 表单提交 |
| `contact/created` | 联系人创建 |
| `contact/tag.added` | 标签添加 |
| `automation/trigger` | 手动触发 |
| `email/send` | 发送邮件 |
| `campaign/send` | 发送活动 |

### 3. 工作流步骤 (WorkflowStep)

```typescript
interface WorkflowStep {
  id: string;
  nodeId: string;           // 引用 NodeMeta.id
  config: Record<string, unknown>;
  delay?: { duration: number; unit: string };
  condition?: { type: string; field: string; value?: unknown };
  onError?: 'stop' | 'continue' | 'retry';
}
```

### 4. 节点注册中心 (NodeRegistry)

全局单例，管理所有节点：

```typescript
import { nodeRegistry, registerNode } from '@/inngest';

// 注册自定义节点
registerNode(myCustomNode);

// 执行节点
const result = await nodeRegistry.execute('email.send', input, context);

// 获取 AI prompt
const prompt = nodeRegistry.generateAIPrompt();
```

## 已实现节点

| 节点 ID | 名称 | 模块 |
|---------|------|------|
| `email.send` | 发送邮件 | email |
| `contact.addTag` | 添加标签 | email |
| `contact.removeTag` | 移除标签 | email |
| `form.syncContact` | 同步联系人 | form |

## 使用方式

### 发送事件

```typescript
import { inngest } from '@/inngest';

await inngest.send({
  name: 'form/submitted',
  data: {
    formId: 'xxx',
    submissionId: 'xxx',
    contactId: 'xxx',
    fields: { ... },
  },
});
```

### 添加新模块

1. 创建 `src/inngest/modules/[module]/nodes.ts`
2. 定义节点，实现 `NodeDefinition` 接口
3. 在 `src/inngest/modules/index.ts` 注册
4. 如需要，在 `client.ts` 添加事件类型

### 添加新工作流函数

在 `src/inngest/functions/` 创建文件，使用 `inngest.createFunction()`:

```typescript
export const myFunction = inngest.createFunction(
  { id: 'my-function' },
  { event: 'my/event' },
  async ({ event, step }) => {
    await step.run('step-1', async () => { ... });
    await step.sleep('wait', '1h');
    await step.run('step-2', async () => { ... });
  }
);
```

## Inngest 优势

1. **Step Functions** - 每一步可独立重试、恢复
2. **无超时** - 长任务不受 Vercel 限制
3. **事件驱动** - 解耦、可扩展
4. **内置调度** - 无需 Cron job
5. **可观测** - Inngest Dashboard 可视化
6. **AI 友好** - 节点元数据可生成 prompt

## 开发模式

本地开发使用 Inngest Dev Server:

```bash
npx inngest-cli@latest dev
```

访问 http://localhost:8288 查看事件和函数执行。

## 下一步

1. [ ] 完善 lead-search 模块
2. [ ] 添加 webhook 模块
3. [ ] 添加 condition 条件分支节点
4. [ ] 实现 AI 编排层
5. [ ] 可视化工作流编辑器
