# DAG 工作流架构 v2

**创建日期**: 2025-12-20

## 升级说明

为支持复杂多媒体工作流（图片生成 → 视频合成 → 发布），类型系统已升级为 DAG（有向无环图）结构。

## 支持的场景示例

```
[脚本输入] 
    ↓
[AI 生成图片 x5] ──并行──→ [合并图片]
    ↓                        ↓
[筛选/调整] ←────────────────┘
    ↓
[生成视频]
    ↓
[人工审批] ─→ 通过 → [发布]
           ↓
         拒绝 → [重新生成]
```

## 核心类型

### 数据类型
```typescript
type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array' 
              | 'image' | 'video' | 'audio' | 'file' | 'any';
```

### 节点端口
```typescript
interface NodePort {
  id: string;
  name: string;
  type: DataType;
  required?: boolean;
  multiple?: boolean;  // 接受多个输入
}
```

### DAG 工作流
```typescript
interface DAGWorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  parallelGroups?: ParallelGroup[];
  loops?: Record<string, LoopConfig>;
}
```

### 关键设计

| 特性 | 实现方式 |
|------|----------|
| 并行执行 | `ParallelGroup` 定义并行分支 |
| 数据引用 | `{{step1.output.images}}` 引用任意步骤 |
| 循环处理 | `LoopConfig` with `forEach` / `concurrency` |
| 人工审批 | `ApprovalNodeConfig` 暂停等待 |
| 大文件 | `context.storage.upload/download` |

## 节点分类

| 分类 | 示例 |
|------|------|
| `trigger` | 表单提交、定时任务 |
| `action` | 发邮件、添加标签 |
| `flow` | 并行、条件、循环 |
| `ai` | 图片生成、视频生成 |
| `media` | 合并、筛选、调整 |
| `integration` | Webhook、第三方 API |

## 待实现

1. [ ] DAG 执行引擎 (`executeDAGWorkflow`)
2. [ ] AI 模块 (image.generate, video.generate)
3. [ ] 媒体模块 (media.merge, media.filter)
4. [ ] 人工审批流程
5. [ ] 可视化 DAG 编辑器 (React Flow)
6. [ ] AI 编排层 (自然语言 → DAG)

## 文件变更

- `src/inngest/core/types.ts` - 新增 DAG 相关类型
