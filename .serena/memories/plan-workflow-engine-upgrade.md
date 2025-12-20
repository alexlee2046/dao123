# 工作流引擎升级计划

**创建日期**: 2025-12-20
**状态**: Phase 4 已完成 ✓ (全部完成)
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

所有步骤已完成，commit `89b2146`

---

## Phase 1: AI 生成节点 [已完成 ✓]

**目标**: 将现有 AI 生成能力包装为工作流节点

### 已实现节点

**AI 模块 (4 节点)**:
- `ai.generateImage` - 文生图/图生图，支持多种模型和宽高比
- `ai.generateVideo` - 文生视频/图生视频
- `ai.generateText` - 通用文本生成，支持 text/json/html/markdown 格式
- `ai.generateEmail` - 专业营销邮件生成

**Media 模块 (5 节点)**:
- `media.upload` - 上传外部 URL 到 Supabase Storage
- `media.download` - 下载媒体为 base64
- `media.resize` - 调整图片大小 (使用 Supabase transforms)
- `media.filter` - 筛选媒体列表 (first/last/random/slice)
- `media.merge` - 合并媒体为 gallery/grid/slideshow HTML

### 技术特性
- 使用 `getProvider()` 集成 OpenRouter API
- 使用 `calculateCost` / `calculateUserCost` 计费
- 所有节点遵循 `NodeDefinition` 接口
- Zod schema 输入验证
- artifacts 跟踪生成资产

commit `40aedda` - 5 files, +1154

---

## Phase 2: DAG 执行引擎 [已完成 ✓]

**目标**: 支持复杂工作流 (并行、分支、合并)

### 已实现

**dag-parser.ts**:
- `DAGParser` 类 - DAG 解析和验证
- `topologicalSort` - Kahn's 算法拓扑排序
- `groupByLevels` - 按层级分组支持并行执行
- `findParallelGroups` - 识别并行执行组
- `resolveConfigReferences` - 解析 `{{stepId.output.field}}` 引用
- `resolveReference` - 路径解析 (支持嵌套对象和数组)

**dag-executor.ts**:
- `executeDAGWorkflow` - 主执行函数 (Inngest function)
  - 按层级顺序执行，同层并行
  - 支持节点延时 (step.sleep)
  - 支持条件执行
  - workflow_runs 状态追踪
- `executeApprovalNode` - 人工审批节点 (step.waitForEvent)
- `executeForEachNode` - 循环执行节点 (分批并发)

**client.ts 事件**:
- `workflow/execute` - 触发工作流
- `workflow/approval-required` - 请求审批
- `workflow/approval-response` - 审批响应
- `workflow/foreach` - 循环执行

**数据库**:
- `workflows` 表 - 存储 DAG 定义
- `workflow_runs` 表 - 执行记录和状态
- `workflow_approvals` 表 - 审批记录

commit `4493f91` - 6 files, +1022

---

## Phase 3: 可视化工作流编辑器 [已完成 ✓]

**目标**: 拖拽式 DAG 编辑器

### 已实现

**组件**:
- `WorkflowEditor` - 主编辑器组件 (React Flow)
- `NodePalette` - 左侧节点面板 (分组、搜索、拖拽)
- `WorkflowNode` - 自定义节点渲染 (图标、状态、配置预览)
- `NodeConfigPanel` - 右侧配置面板 (动态表单生成)
- `WorkflowEditorPage` - 完整编辑器页面 (保存/运行)

**类型系统**:
- `WorkflowNodeData` - 节点数据结构
- `PaletteItem` - 面板节点项
- `SavedWorkflow` - 保存格式

**页面路由**:
- `/workflow` - 工作流列表
- `/workflow/new` - 新建工作流
- `/workflow/[id]` - 编辑工作流

**表单生成**:
- 基于 JSON Schema 动态生成
- 支持 string/number/boolean/object/array 类型
- 支持 enum 下拉、slider 滑块
- 支持数据引用模式 `{{stepId.output.field}}`

commit `f2b8206` - 12 files, +2116

---

## Phase 4: AI 编排层 [已完成 ✓]

**目标**: 用户说需求，AI 自动生成工作流

### 已实现

**API 端点**:
- `POST /api/workflow/generate` - AI 工作流生成
- `GET/POST/PUT/DELETE /api/workflow` - 工作流 CRUD
- `POST /api/workflow/[id]/run` - 触发工作流执行

**AI 生成**:
- 节点目录 (NODE_CATALOG) 提供可用节点信息
- 使用 `generateObject` 结构化输出
- 支持中英文生成

**组件**:
- `AIWorkflowChat` - 浮动聊天面板
- 应用生成的工作流到编辑器
- 工作流预览和确认

commit `3dc70a7` - 7 files, +846

---

## 进度日志

| 日期 | 阶段 | Commit |
|------|------|--------|
| 2025-12-20 | Phase 0 | `89b2146` - Inngest 迁移完成 (25 files, +4775/-192) |
| 2025-12-20 | Phase 1 | `40aedda` - AI + Media 节点 (5 files, +1154) |
| 2025-12-20 | Phase 2 | `4493f91` - DAG 执行引擎 (6 files, +1022) |
| 2025-12-20 | Phase 3 | `f2b8206` - 可视化工作流编辑器 (12 files, +2116) |
| 2025-12-20 | Phase 4 | `3dc70a7` - AI 编排层 (7 files, +846) |
