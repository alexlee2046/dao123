# 工作流引擎升级计划

**创建日期**: 2025-12-20
**状态**: 进行中
**目标**: 将 dao123 打造成一站式 AI 营销平台，支持复杂多媒体工作流

---

## 整体架构目标

```
用户说需求 → AI 理解意图 → 生成 DAG 工作流 → 人工审批 → 自动执行
                                    ↓
        ┌──────────────────────────────────────────────┐
        │              可视化工作流编辑器                │
        │  [图片生成] → [筛选] → [视频合成] → [发布]     │
        └──────────────────────────────────────────────┘
```

---

## Phase 0: Inngest 迁移完成 [已完成 ✓]

**目标**: 将旧 automation engine 完全迁移到 Inngest

### Checklist

- [x] **0.1** 分析旧 engine.ts 所有功能
  - [ ] triggerAutomation()
  - [ ] executeNextStep()
  - [ ] processScheduledSteps() (Cron)
  - [ ] handleFormSubmissionTrigger()
  - [ ] handleContactCreatedTrigger()
  - [ ] handleTagAddedTrigger()

- [x] **0.2** 确保 Inngest functions 覆盖所有触发器
  - [x] form/submitted → onFormSubmitted
  - [x] contact/created → onContactCreated
  - [x] contact/tag.added → onTagAdded
  - [x] automation/trigger → onAutomationTrigger

- [x] **0.3** 更新所有触发点调用 Inngest
  - [x] /api/forms/submit/route.ts
  - [x] contacts Server Actions (创建时)
  - [x] contacts Server Actions (标签添加时)

- [x] **0.4** 验证节点执行 (TypeScript + Build 通过)
  - [x] email.send 节点就绪
  - [x] contact.addTag 节点就绪
  - [x] contact.removeTag 节点就绪
  - [x] flow.wait 节点就绪
  - [x] flow.condition 节点就绪
  - [x] flow.split 节点就绪

- [x] **0.5** 删除旧代码
  - [x] 标记 engine.ts 为 deprecated
  - [x] 更新 /api/cron/automation (deprecated, 返回空结果)

- [ ] **0.6** 端到端测试 (需要部署后验证)
  - [ ] 表单提交 → 触发自动化 → 发送邮件
  - [ ] 延时步骤正确执行 (Inngest step.sleep)
  - [ ] 错误处理和重试

---

## Phase 1: AI 生成节点 [待开始]

**目标**: 将现有 AI 生成能力包装为工作流节点

### Checklist

- [ ] **1.1** 创建 AI 模块
  - [ ] src/inngest/modules/ai/nodes.ts
  - [ ] src/inngest/modules/ai/index.ts

- [ ] **1.2** 图片生成节点 `ai.generateImage`
  - [ ] 输入: prompt, model, style, aspectRatio
  - [ ] 输出: imageUrl, metadata
  - [ ] 集成现有 /generate/image 逻辑

- [ ] **1.3** 视频生成节点 `ai.generateVideo`
  - [ ] 输入: prompt, model, duration, images[]
  - [ ] 输出: videoUrl, metadata

- [ ] **1.4** 文本生成节点 `ai.generateText`
  - [ ] 输入: prompt, model, maxTokens
  - [ ] 输出: text, usage

- [ ] **1.5** 创建媒体模块
  - [ ] src/inngest/modules/media/nodes.ts

- [ ] **1.6** 媒体处理节点
  - [ ] media.resize
  - [ ] media.merge
  - [ ] media.filter
  - [ ] media.upload

- [ ] **1.7** 注册新模块到 registry

---

## Phase 2: DAG 执行引擎 [待开始]

**目标**: 支持复杂工作流 (并行、分支、合并)

### Checklist

- [ ] **2.1** DAG 解析器
  - [ ] src/inngest/core/dag-parser.ts
  - [ ] topologicalSort()
  - [ ] findParallelGroups()

- [ ] **2.2** DAG 执行器
  - [ ] src/inngest/functions/dag-executor.ts
  - [ ] executeDAGWorkflow Inngest function

- [ ] **2.3** 数据引用解析
  - [ ] resolveReferences() 函数
  - [ ] 支持 {{step1.output.images}} 格式

- [ ] **2.4** 并行执行
  - [ ] Promise.all 并发
  - [ ] step.run 包装

- [ ] **2.5** 循环支持
  - [ ] forEach 遍历
  - [ ] concurrency 控制

- [ ] **2.6** 人工审批节点
  - [ ] step.waitForEvent
  - [ ] 审批 API

- [ ] **2.7** 工作流状态追踪
  - [ ] workflow_runs 表
  - [ ] 状态更新逻辑

---

## Phase 3: 可视化工作流编辑器 [待开始]

**目标**: 拖拽式 DAG 编辑器

### Checklist

- [ ] **3.1** 安装依赖
  - [ ] @xyflow/react (React Flow)

- [ ] **3.2** 编辑器组件
  - [ ] WorkflowEditor.tsx
  - [ ] NodePalette.tsx
  - [ ] CustomNode.tsx
  - [ ] NodeConfigPanel.tsx

- [ ] **3.3** 节点面板
  - [ ] 按模块分组
  - [ ] 拖拽添加
  - [ ] 搜索

- [ ] **3.4** 节点配置
  - [ ] 动态表单生成
  - [ ] 数据引用选择器

- [ ] **3.5** 连线逻辑
  - [ ] 类型匹配
  - [ ] 禁止循环

- [ ] **3.6** 保存加载
  - [ ] 序列化 DAGWorkflowDefinition
  - [ ] 数据库存储

- [ ] **3.7** 页面路由
  - [ ] /mail/workflows
  - [ ] /mail/workflows/new
  - [ ] /mail/workflows/[id]
  - [ ] /mail/workflows/[id]/runs

---

## Phase 4: AI 编排层 [可选]

**目标**: 用户说需求，AI 自动生成工作流

### Checklist

- [ ] **4.1** 意图理解 Prompt
- [ ] **4.2** 工作流生成 API
- [ ] **4.3** 交互确认流程

---

## 数据库变更

```sql
-- Phase 2 需要
CREATE TABLE workflows (...);
CREATE TABLE workflow_runs (...);
CREATE TABLE workflow_approvals (...);
```

---

## 进度日志

| 日期 | 阶段 | 完成项 |
|------|------|--------|
| 2025-12-20 | Phase 0 | Inngest 基础架构搭建, 节点类型系统, 示例模块 |
| 2025-12-20 | Phase 0 | 完成迁移: flow nodes (wait/condition/split), 触发点更新 (contacts/tags), 旧代码标记废弃 |
