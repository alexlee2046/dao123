# Phase 2 可视化流程编辑器 - 已完成

**确认日期**: 2025-12-21

## 实现概述

可视化流程编辑器已使用 React Flow (@xyflow/react) 完整实现。

## 组件结构

```
src/components/workflow/
├── WorkflowEditor.tsx       # 核心编辑器 (React Flow 画布)
├── WorkflowEditorPage.tsx   # 完整页面 (工具栏+保存+运行)
├── WorkflowNode.tsx         # 自定义节点组件
├── NodePalette.tsx          # 左侧节点面板 (拖拽)
├── NodeConfigPanel.tsx      # 右侧配置面板
├── AIWorkflowChat.tsx       # AI 生成工作流
└── types.ts                 # 类型定义
```

## 页面路由

- `/workflow` - 工作流列表页
- `/workflow/new` - 创建新工作流
- `/workflow/[id]` - 编辑工作流

## 功能清单

### 画布操作
- [x] 节点拖拽放置 (从面板拖入画布)
- [x] 节点连线 (Edge 连接)
- [x] 节点选择/取消选择
- [x] 节点删除
- [x] 画布缩放/平移
- [x] 小地图 (MiniMap)
- [x] 控制面板 (Controls)
- [x] 背景网格 (Background)

### 节点配置
- [x] 右侧配置面板
- [x] 节点标签编辑
- [x] 节点参数配置
- [x] JSON Schema 驱动的表单

### 保存/运行
- [x] 保存到 workflows 表 (nodes + edges JSON)
- [x] 手动触发运行 (/api/workflow/[id]/run)
- [x] 工作流激活状态切换

### AI 集成
- [x] AIWorkflowChat 组件
- [x] 自然语言描述 → 生成工作流
- [x] 一键应用到画布

## 数据库表

```sql
CREATE TABLE workflows (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text,
  description text,
  trigger jsonb,
  nodes jsonb,      -- React Flow nodes
  edges jsonb,      -- React Flow edges
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
);
```

## 与 Automation 的区别

| 模块 | 用途 | UI |
|------|------|-----|
| Automations | 邮件营销序列 | 列表式步骤编辑器 |
| Workflows | 复杂 DAG 工作流 | React Flow 可视化编辑器 |

两者共享 Inngest 执行引擎和节点注册表。

## 相关记忆

- architecture-dag-workflow-v2 (DAG 类型设计)
- architecture-inngest-workflow (执行引擎)
