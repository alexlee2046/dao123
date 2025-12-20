/**
 * Inngest 模块主入口
 *
 * 这是 dao123 的工作流引擎核心，基于 Inngest 构建。
 *
 * 架构说明:
 * - client.ts: Inngest 客户端和事件类型定义
 * - core/: 核心类型系统和节点注册中心
 * - modules/: 模块化节点定义 (email, form, lead-search 等)
 * - functions/: Inngest 函数定义 (自动化、定时任务等)
 *
 * 使用方式:
 *
 * 1. 发送事件触发工作流:
 *    import { inngest } from '@/inngest';
 *    await inngest.send({ name: 'form/submitted', data: { ... } });
 *
 * 2. 注册自定义节点:
 *    import { registerNode } from '@/inngest/core/registry';
 *    registerNode(myCustomNode);
 *
 * 3. 获取 AI 可用的节点描述:
 *    import { nodeRegistry } from '@/inngest/core/registry';
 *    const prompt = nodeRegistry.generateAIPrompt();
 */

// 客户端
export { inngest } from './client';
export type { InngestEvents } from './client';

// 核心
export { nodeRegistry, registerNode, registerNodes, executeNode } from './core/registry';
export {
  DAGParser,
  parseWorkflow,
  validateWorkflow,
  getParallelGroups,
  resolveConfigReferences,
  resolveReference,
} from './core/dag-parser';
export type {
  NodeDefinition,
  NodeMeta,
  NodeContext,
  NodeResult,
  NodeCategory,
  WorkflowStep,
  WorkflowDefinition,
  WorkflowTrigger,
  DAGWorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowRun,
  NodeExecution,
  AINodeDescription,
  AIWorkflowIntent,
} from './core/types';

// 模块
export { registerAllModules } from './modules';

// 函数
export { allFunctions } from './functions';

// 便捷函数: 发送事件
export async function sendEvent<T extends keyof import('./client').InngestEvents>(
  name: T,
  data: import('./client').InngestEvents[T]['data']
) {
  const { inngest } = await import('./client');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return inngest.send({ name, data } as any);
}
