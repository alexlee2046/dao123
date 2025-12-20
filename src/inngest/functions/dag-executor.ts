/**
 * DAG 工作流执行器
 *
 * 支持:
 * - 并行执行 (同层节点)
 * - 条件分支
 * - 数据引用解析
 * - 错误处理和重试
 * - 人工审批 (waitForEvent)
 */

import { inngest } from '../client';
import { nodeRegistry } from '../core/registry';
import { createClient } from '@/lib/supabase/server';
import {
  parseWorkflow,
  resolveConfigReferences,
  type DAGParseResult,
} from '../core/dag-parser';
import type {
  DAGWorkflowDefinition,
  WorkflowNode,
  NodeContext,
  NodeResult,
  NodeExecution,
  WorkflowRun,
} from '../core/types';

// ============================================
// 类型定义
// ============================================

interface ExecuteDAGEvent {
  data: {
    workflowId: string;
    userId: string;
    contactId?: string;
    triggerData?: Record<string, unknown>;
  };
}

interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  duration?: number;
  artifacts?: NodeResult['artifacts'];
}

// ============================================
// DAG 工作流执行函数
// ============================================

export const executeDAGWorkflow = inngest.createFunction(
  {
    id: 'dag-workflow-executor',
    name: 'DAG Workflow Executor',
    retries: 2,
    concurrency: {
      limit: 10,
      key: 'event.data.userId',
    },
  },
  { event: 'workflow/execute' },
  async ({ event, step }) => {
    const { workflowId, userId, contactId, triggerData } = event.data;
    const supabase = await createClient();

    // Step 1: 加载工作流定义
    const workflow = await step.run('load-workflow', async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        throw new Error(`Workflow not found: ${workflowId}`);
      }

      // 映射数据库字段到接口定义
      return {
        ...data,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isActive: data.is_active,
      } as DAGWorkflowDefinition;
    });

    // Step 2: 解析 DAG
    const dagResult = await step.run('parse-dag', async () => {
      const result = parseWorkflow(workflow);

      if (!result.isValid) {
        throw new Error(`Invalid workflow: ${result.errors.join(', ')}`);
      }

      return result;
    });

    // Step 3: 创建运行记录
    const runId = await step.run('create-run', async () => {
      const { data, error } = await supabase
        .from('workflow_runs')
        .insert({
          workflow_id: workflowId,
          user_id: userId,
          status: 'running',
          trigger_type: workflow.trigger.type,
          trigger_data: triggerData || {},
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create run:', error);
        return `run-${Date.now()}`;
      }

      return data.id;
    });

    // Step 4: 按层级执行节点
    const stepsData: Record<string, Record<string, unknown>> = {};
    const nodeExecutions: Record<string, NodeExecution> = {};

    // 初始数据 (来自触发器)
    if (triggerData) {
      stepsData['trigger'] = triggerData;
    }

    // 按层级顺序执行
    for (let levelIndex = 0; levelIndex < dagResult.levels.length; levelIndex++) {
      const levelNodeIds = dagResult.levels[levelIndex];

      if (levelNodeIds.length === 0) continue;

      // 同一层的节点可以并行执行
      if (levelNodeIds.length === 1) {
        // 单节点, 直接执行
        const nodeId = levelNodeIds[0];
        const result = await executeNode(
          step,
          workflow,
          nodeId,
          userId,
          contactId,
          runId,
          stepsData,
          supabase
        );

        stepsData[nodeId] = result.output || {};
        nodeExecutions[nodeId] = createNodeExecution(nodeId, result);
      } else {
        // 多节点并行执行
        const results = await step.run(
          `execute-level-${levelIndex}`,
          async () => {
            const promises = levelNodeIds.map(async (nodeId) => {
              return executeNodeDirect(
                workflow,
                nodeId,
                userId,
                contactId,
                runId,
                stepsData
              );
            });

            return Promise.all(promises);
          }
        );

        // 收集结果
        for (let i = 0; i < levelNodeIds.length; i++) {
          const nodeId = levelNodeIds[i];
          const result = results[i];
          stepsData[nodeId] = result.output || {};
          nodeExecutions[nodeId] = createNodeExecution(nodeId, result);
        }
      }

      // 更新运行状态
      await step.run(`update-run-level-${levelIndex}`, async () => {
        await supabase
          .from('workflow_runs')
          .update({
            node_executions: nodeExecutions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', runId);
      });
    }

    // Step 5: 完成运行
    await step.run('complete-run', async () => {
      const hasErrors = Object.values(nodeExecutions).some(
        (e) => e.status === 'failed'
      );

      await supabase
        .from('workflow_runs')
        .update({
          status: hasErrors ? 'failed' : 'completed',
          node_executions: nodeExecutions,
          completed_at: new Date().toISOString(),
        })
        .eq('id', runId);
    });

    return {
      runId,
      status: 'completed',
      nodeExecutions,
      stepsData,
    };
  }
);

// ============================================
// 节点执行辅助函数
// ============================================

/**
 * 使用 step.run 包装的节点执行
 */
async function executeNode(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  step: any,
  workflow: DAGWorkflowDefinition,
  nodeId: string,
  userId: string,
  contactId: string | undefined,
  runId: string,
  stepsData: Record<string, Record<string, unknown>>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<NodeExecutionResult> {
  const node = workflow.nodes.find((n) => n.id === nodeId);
  if (!node) {
    return {
      nodeId,
      success: false,
      error: `Node not found: ${nodeId}`,
    };
  }

  // 检查延时
  if (node.delay) {
    const delayMs = convertDelayToMs(node.delay);
    if (delayMs > 0) {
      await step.sleep(`delay-${nodeId}`, delayMs);
    }
  }

  // 执行节点
  return step.run(`execute-${nodeId}`, async () => {
    return executeNodeDirect(workflow, nodeId, userId, contactId, runId, stepsData);
  });
}

/**
 * 直接执行节点 (不包装 step.run)
 */
async function executeNodeDirect(
  workflow: DAGWorkflowDefinition,
  nodeId: string,
  userId: string,
  contactId: string | undefined,
  runId: string,
  stepsData: Record<string, Record<string, unknown>>
): Promise<NodeExecutionResult> {
  const startTime = Date.now();

  const node = workflow.nodes.find((n) => n.id === nodeId);
  if (!node) {
    return {
      nodeId,
      success: false,
      error: `Node not found: ${nodeId}`,
    };
  }

  // 获取节点定义
  const nodeDefinition = nodeRegistry.get(node.type);
  if (!nodeDefinition) {
    return {
      nodeId,
      success: false,
      error: `Unknown node type: ${node.type}`,
    };
  }

  // 解析配置中的引用
  const resolvedConfig = resolveConfigReferences(node.config, stepsData);

  // 构建上下文
  const context: NodeContext = {
    userId,
    contactId,
    workflowId: workflow.id,
    runId,
    stepId: nodeId,
    stepsData,
    previousData: getPreviousNodeOutput(nodeId, workflow, stepsData),
  };

  try {
    // 验证输入
    const validatedInput = nodeDefinition.meta.inputSchema.parse(resolvedConfig);

    // 执行节点
    const result = await nodeDefinition.execute(validatedInput, context);

    return {
      nodeId,
      success: result.success,
      output: result.output,
      error: result.error,
      duration: Date.now() - startTime,
      artifacts: result.artifacts,
    };
  } catch (error) {
    return {
      nodeId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * 获取前一个节点的输出 (用于简单引用)
 */
function getPreviousNodeOutput(
  nodeId: string,
  workflow: DAGWorkflowDefinition,
  stepsData: Record<string, Record<string, unknown>>
): Record<string, unknown> | undefined {
  // 找到指向当前节点的边
  const incomingEdge = workflow.edges.find((e) => e.target === nodeId);
  if (!incomingEdge) return undefined;

  return stepsData[incomingEdge.source];
}

/**
 * 创建节点执行记录
 */
function createNodeExecution(
  nodeId: string,
  result: NodeExecutionResult
): NodeExecution {
  return {
    nodeId,
    status: result.success ? 'completed' : 'failed',
    completedAt: new Date(),
    duration: result.duration,
    output: result.output,
    error: result.error,
    artifacts: result.artifacts,
  };
}

/**
 * 将延时配置转换为毫秒
 */
function convertDelayToMs(delay: WorkflowNode['delay']): number {
  if (!delay) return 0;

  const multipliers: Record<string, number> = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  };

  return delay.duration * (multipliers[delay.unit] || 0);
}

// ============================================
// 人工审批支持
// ============================================

export const executeApprovalNode = inngest.createFunction(
  {
    id: 'approval-node-executor',
    name: 'Approval Node Executor',
  },
  { event: 'workflow/approval-required' },
  async ({ event, step }) => {
    const { runId, nodeId, message, options, timeout } = event.data;

    // 等待审批事件
    const approval = await step.waitForEvent('wait-for-approval', {
      event: 'workflow/approval-response',
      match: 'data.runId',
      timeout: timeout || '7d',
    });

    if (!approval) {
      // 超时, 使用默认行为
      return {
        approved: false,
        reason: 'timeout',
      };
    }

    return {
      approved: approval.data.approved,
      response: approval.data.response,
      respondedBy: approval.data.userId,
    };
  }
);

// ============================================
// 循环执行支持
// ============================================

export const executeForEachNode = inngest.createFunction(
  {
    id: 'foreach-node-executor',
    name: 'ForEach Node Executor',
    concurrency: {
      limit: 5,
      key: 'event.data.runId',
    },
  },
  { event: 'workflow/foreach' },
  async ({ event, step }) => {
    const {
      runId,
      nodeId,
      items,
      bodyNodeIds,
      concurrency = 3,
      userId,
      contactId,
      workflow,
      stepsData,
    } = event.data;

    const results: Record<string, unknown>[] = [];

    // 分批处理
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);

      const batchResults = await step.run(
        `foreach-batch-${i}`,
        async () => {
          const promises = batch.map(async (item: unknown, batchIndex: number) => {
            const itemIndex = i + batchIndex;
            const itemStepsData = {
              ...stepsData,
              $item: { value: item, index: itemIndex },
            };

            // 执行 body 节点
            // 这里简化处理, 实际需要递归执行子 DAG
            return { item, index: itemIndex };
          });

          return Promise.all(promises);
        }
      );

      results.push(...batchResults);
    }

    return {
      nodeId,
      results,
      count: items.length,
    };
  }
);

// ============================================
// 导出函数列表
// ============================================

export const dagFunctions = [
  executeDAGWorkflow,
  executeApprovalNode,
  executeForEachNode,
];
