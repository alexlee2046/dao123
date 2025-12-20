import { z } from 'zod';

// ============================================
// 节点类型系统 - 类似 n8n 的设计
// ============================================

/**
 * 节点分类
 */
export type NodeCategory =
  | 'trigger'      // 触发器节点
  | 'action'       // 动作节点
  | 'flow'         // 流程控制节点 (并行、条件、循环)
  | 'transform'    // 数据转换节点
  | 'ai'           // AI 生成节点 (图片、视频、文本)
  | 'media'        // 媒体处理节点
  | 'integration'; // 第三方集成节点

/**
 * 节点输入/输出类型
 */
export type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'image'        // 图片 URL 或 base64
  | 'video'        // 视频 URL
  | 'audio'        // 音频 URL
  | 'file'         // 文件 URL
  | 'any';

/**
 * 节点端口定义 - 用于 DAG 连接
 */
export interface NodePort {
  id: string;
  name: string;
  type: DataType;
  required?: boolean;
  multiple?: boolean;  // 是否接受多个输入 (用于合并节点)
}

/**
 * 节点元数据 - 供 AI 理解和 UI 展示
 */
export interface NodeMeta {
  /** 唯一标识符, 如 'email.send' */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 - AI 用来理解节点用途 */
  description: string;
  /** 分类 */
  category: NodeCategory;
  /** 所属模块 */
  module: string;
  /** 图标 (Lucide icon name) */
  icon: string;
  /** 节点颜色 */
  color?: string;
  /** 输入参数 schema */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputSchema: z.ZodType<any>;
  /** 输入端口 - DAG 连接用 */
  inputs?: NodePort[];
  /** 输出端口 - DAG 连接用 */
  outputs?: NodePort[];
  /** 输出类型描述 */
  outputDescription?: string;
  /** 是否支持批量处理 */
  supportsBatch?: boolean;
  /** 预估执行时间 (秒) - 用于 UI 显示 */
  estimatedDuration?: number;
  /** 示例配置 - 供 AI 参考 */
  examples?: Array<{
    name: string;
    config: Record<string, unknown>;
  }>;
}

/**
 * 节点执行上下文
 */
export interface NodeContext {
  /** 当前用户 ID */
  userId: string;
  /** 当前联系人 ID (如果有) */
  contactId?: string;
  /** 工作流 ID */
  workflowId?: string;
  /** 工作流运行 ID */
  runId?: string;
  /** 当前步骤 ID */
  stepId?: string;
  /** 所有步骤的输出数据 (key: stepId) */
  stepsData?: Record<string, Record<string, unknown>>;
  /** 上一步的输出数据 (兼容简单模式) */
  previousData?: Record<string, unknown>;
  /** 变量替换上下文 */
  variables?: Record<string, string>;
  /** 资源存储服务 */
  storage?: {
    upload: (file: Buffer | string, filename: string) => Promise<string>;
    download: (url: string) => Promise<Buffer>;
  };
}

/**
 * 节点执行结果
 */
export interface NodeResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  /** 传递给下一个节点的数据 */
  output?: Record<string, unknown>;
  /** 生成的资源 URL (图片、视频等) */
  artifacts?: Array<{
    type: DataType;
    url: string;
    name?: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * 节点定义接口 - 每个节点类型都需要实现
 */
export interface NodeDefinition<TInput = unknown, TOutput = unknown> {
  /** 节点元数据 */
  meta: NodeMeta;

  /**
   * 执行节点
   */
  execute(
    input: TInput,
    context: NodeContext
  ): Promise<NodeResult<TOutput>>;

  /**
   * 验证输入参数 (可选, 默认用 inputSchema)
   */
  validate?(input: unknown): TInput;
}

// ============================================
// DAG 工作流定义 - 支持复杂流程
// ============================================

/**
 * 节点连接 - DAG 边
 */
export interface WorkflowEdge {
  id: string;
  /** 源节点 ID */
  source: string;
  /** 源节点输出端口 */
  sourceHandle?: string;
  /** 目标节点 ID */
  target: string;
  /** 目标节点输入端口 */
  targetHandle?: string;
}

/**
 * 工作流节点实例
 */
export interface WorkflowNode {
  id: string;
  /** 节点类型 ID (引用 NodeMeta.id) */
  type: string;
  /** 节点配置 */
  config: Record<string, unknown>;
  /** 位置信息 (用于可视化编辑器) */
  position?: { x: number; y: number };
  /** 条件执行 */
  condition?: {
    type: 'equals' | 'contains' | 'exists' | 'expression';
    expression?: string;  // 如 "{{step1.success}} && {{step2.count}} > 5"
  };
  /** 等待时间 */
  delay?: {
    duration: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  };
  /** 错误处理 */
  onError?: 'stop' | 'continue' | 'retry';
  retryCount?: number;
  /** 超时 (秒) */
  timeout?: number;
}

/**
 * 并行组 - 多个节点并行执行后合并
 */
export interface ParallelGroup {
  id: string;
  /** 并行执行的节点 ID 列表 */
  nodeIds: string[];
  /** 合并策略 */
  mergeStrategy: 'waitAll' | 'waitAny' | 'waitN';
  /** waitN 时需要的数量 */
  waitCount?: number;
}

/**
 * 循环配置
 */
export interface LoopConfig {
  /** 循环类型 */
  type: 'forEach' | 'while' | 'times';
  /** forEach: 输入数组的引用, 如 "{{step1.images}}" */
  items?: string;
  /** while: 条件表达式 */
  condition?: string;
  /** times: 循环次数 */
  count?: number;
  /** 最大并发数 (forEach 时) */
  concurrency?: number;
}

/**
 * DAG 工作流定义
 */
export interface DAGWorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  /** 触发器配置 */
  trigger: WorkflowTrigger;
  /** 节点列表 */
  nodes: WorkflowNode[];
  /** 边列表 (连接) */
  edges: WorkflowEdge[];
  /** 并行组 */
  parallelGroups?: ParallelGroup[];
  /** 循环配置 */
  loops?: Record<string, LoopConfig>;  // key: nodeId
  /** 全局变量 */
  variables?: Record<string, unknown>;
  /** 是否激活 */
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ============================================
// 兼容旧版线性工作流
// ============================================

/**
 * 工作流步骤 (线性模式, 兼容)
 */
export interface WorkflowStep {
  id: string;
  nodeId: string;
  config: Record<string, unknown>;
  /** 数据引用 - 可以引用任意之前步骤的输出 */
  inputMapping?: Record<string, string>;  // 如 { "images": "{{step1.output.images}}" }
  condition?: {
    type: 'equals' | 'contains' | 'exists' | 'custom';
    field: string;
    value?: unknown;
    customExpression?: string;
  };
  delay?: {
    duration: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  };
  onError?: 'stop' | 'continue' | 'retry';
  retryCount?: number;
}

/**
 * 工作流触发器
 */
export interface WorkflowTrigger {
  type: string;
  filter?: Record<string, unknown>;
}

/**
 * 线性工作流定义 (兼容)
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 工作流运行时状态
// ============================================

/**
 * 节点执行状态
 */
export type NodeExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'cancelled';

/**
 * 节点执行记录
 */
export interface NodeExecution {
  nodeId: string;
  status: NodeExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;  // ms
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  retryCount?: number;
  artifacts?: Array<{
    type: DataType;
    url: string;
    name?: string;
  }>;
}

/**
 * 工作流运行记录
 */
export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  trigger: {
    type: string;
    data: Record<string, unknown>;
  };
  nodeExecutions: Record<string, NodeExecution>;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  /** 用户审批点 */
  pendingApproval?: {
    nodeId: string;
    message: string;
    options?: string[];
  };
}

// ============================================
// AI 编排相关类型
// ============================================

/**
 * AI 可理解的节点描述 (用于 prompt)
 */
export interface AINodeDescription {
  id: string;
  name: string;
  description: string;
  category: NodeCategory;
  module: string;
  inputs?: NodePort[];
  outputs?: NodePort[];
  inputSchema: Record<string, unknown>;
  supportsBatch?: boolean;
  examples?: Array<{
    name: string;
    config: Record<string, unknown>;
  }>;
}

/**
 * AI 生成的工作流意图
 */
export interface AIWorkflowIntent {
  userPrompt: string;
  trigger: {
    event: string;
    conditions?: Record<string, unknown>;
  };
  /** DAG 结构 */
  nodes: Array<{
    id: string;
    nodeId: string;
    config: Record<string, unknown>;
    delay?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
  explanation: string;
}

// ============================================
// 流程控制节点类型
// ============================================

/**
 * 并行节点配置
 */
export interface ParallelNodeConfig {
  branches: Array<{
    id: string;
    name: string;
    nodes: WorkflowNode[];
  }>;
  mergeStrategy: 'waitAll' | 'waitAny';
}

/**
 * 条件分支节点配置
 */
export interface ConditionalNodeConfig {
  conditions: Array<{
    id: string;
    name: string;
    expression: string;  // 如 "{{input.score}} > 80"
    targetNodeId: string;
  }>;
  defaultTargetNodeId?: string;
}

/**
 * 循环节点配置
 */
export interface LoopNodeConfig {
  type: 'forEach' | 'while' | 'times';
  items?: string;      // forEach: "{{step1.images}}"
  condition?: string;  // while: "{{counter}} < 10"
  count?: number;      // times: 5
  concurrency?: number;
  bodyNodes: WorkflowNode[];
}

/**
 * 人工审批节点配置
 */
export interface ApprovalNodeConfig {
  message: string;
  options?: Array<{
    label: string;
    value: string;
    targetNodeId?: string;
  }>;
  timeout?: {
    duration: number;
    unit: 'hours' | 'days';
    defaultAction: 'approve' | 'reject' | 'skip';
  };
  notifyChannels?: Array<'email' | 'slack' | 'webhook'>;
}
