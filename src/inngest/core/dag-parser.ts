/**
 * DAG 解析器 - 解析工作流图结构
 *
 * 功能:
 * - 拓扑排序 (确保依赖顺序)
 * - 识别并行组 (可同时执行的节点)
 * - 验证图结构 (无环检测)
 * - 数据引用解析
 */

import type {
  DAGWorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  ParallelGroup,
} from './types';

// ============================================
// DAG 解析结果
// ============================================

export interface DAGParseResult {
  /** 拓扑排序后的节点 ID 列表 */
  sortedNodeIds: string[];
  /** 按层级分组的节点 (每层可并行执行) */
  levels: string[][];
  /** 节点依赖关系 (nodeId -> 依赖的节点 IDs) */
  dependencies: Map<string, Set<string>>;
  /** 节点被依赖关系 (nodeId -> 依赖它的节点 IDs) */
  dependents: Map<string, Set<string>>;
  /** 入度 (用于执行调度) */
  inDegree: Map<string, number>;
  /** 根节点 (无依赖的节点) */
  rootNodes: string[];
  /** 叶节点 (无后续的节点) */
  leafNodes: string[];
  /** 是否有效 (无环) */
  isValid: boolean;
  /** 错误信息 */
  errors: string[];
}

// ============================================
// DAG 解析器
// ============================================

export class DAGParser {
  private nodes: Map<string, WorkflowNode>;
  private edges: WorkflowEdge[];
  private dependencies: Map<string, Set<string>>;
  private dependents: Map<string, Set<string>>;
  private inDegree: Map<string, number>;

  constructor(workflow: DAGWorkflowDefinition) {
    this.nodes = new Map(workflow.nodes.map(n => [n.id, n]));
    this.edges = workflow.edges;
    this.dependencies = new Map();
    this.dependents = new Map();
    this.inDegree = new Map();

    this.buildGraph();
  }

  /**
   * 构建邻接表
   */
  private buildGraph(): void {
    // 初始化所有节点
    for (const node of this.nodes.values()) {
      this.dependencies.set(node.id, new Set());
      this.dependents.set(node.id, new Set());
      this.inDegree.set(node.id, 0);
    }

    // 从边构建关系
    for (const edge of this.edges) {
      // source -> target, 即 target 依赖 source
      this.dependencies.get(edge.target)?.add(edge.source);
      this.dependents.get(edge.source)?.add(edge.target);
      this.inDegree.set(
        edge.target,
        (this.inDegree.get(edge.target) || 0) + 1
      );
    }
  }

  /**
   * 解析 DAG
   */
  parse(): DAGParseResult {
    const errors: string[] = [];

    // 拓扑排序 (Kahn's algorithm)
    const { sorted, isValid } = this.topologicalSort();

    if (!isValid) {
      errors.push('工作流图中存在循环依赖');
    }

    // 按层级分组
    const levels = this.groupByLevels();

    // 找出根节点和叶节点
    const rootNodes: string[] = [];
    const leafNodes: string[] = [];

    for (const [nodeId, deps] of this.dependencies) {
      if (deps.size === 0) {
        rootNodes.push(nodeId);
      }
    }

    for (const [nodeId, deps] of this.dependents) {
      if (deps.size === 0) {
        leafNodes.push(nodeId);
      }
    }

    return {
      sortedNodeIds: sorted,
      levels,
      dependencies: this.dependencies,
      dependents: this.dependents,
      inDegree: this.inDegree,
      rootNodes,
      leafNodes,
      isValid,
      errors,
    };
  }

  /**
   * 拓扑排序 - Kahn's Algorithm
   * 返回排序后的节点 ID 列表
   */
  private topologicalSort(): { sorted: string[]; isValid: boolean } {
    const sorted: string[] = [];
    const inDegree = new Map(this.inDegree);

    // 初始队列: 入度为 0 的节点
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      sorted.push(nodeId);

      // 减少所有后续节点的入度
      const deps = this.dependents.get(nodeId) || new Set();
      for (const dependentId of deps) {
        const newDegree = (inDegree.get(dependentId) || 0) - 1;
        inDegree.set(dependentId, newDegree);

        if (newDegree === 0) {
          queue.push(dependentId);
        }
      }
    }

    // 如果排序后的节点数不等于总节点数, 说明有环
    const isValid = sorted.length === this.nodes.size;

    return { sorted, isValid };
  }

  /**
   * 按执行层级分组 (同一层可并行执行)
   */
  private groupByLevels(): string[][] {
    const levels: string[][] = [];
    const nodeLevel = new Map<string, number>();

    // 计算每个节点的层级 (最长依赖路径)
    const calculateLevel = (nodeId: string, visited: Set<string>): number => {
      if (nodeLevel.has(nodeId)) {
        return nodeLevel.get(nodeId)!;
      }

      if (visited.has(nodeId)) {
        // 检测到环, 返回 -1
        return -1;
      }

      visited.add(nodeId);

      const deps = this.dependencies.get(nodeId) || new Set();
      let maxDepLevel = -1;

      for (const depId of deps) {
        const depLevel = calculateLevel(depId, visited);
        if (depLevel === -1) return -1; // 传播环检测
        maxDepLevel = Math.max(maxDepLevel, depLevel);
      }

      const level = maxDepLevel + 1;
      nodeLevel.set(nodeId, level);
      visited.delete(nodeId);

      return level;
    };

    // 计算所有节点的层级
    for (const nodeId of this.nodes.keys()) {
      calculateLevel(nodeId, new Set());
    }

    // 按层级分组
    const levelGroups = new Map<number, string[]>();
    for (const [nodeId, level] of nodeLevel) {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(nodeId);
    }

    // 转换为数组
    const maxLevel = Math.max(...nodeLevel.values());
    for (let i = 0; i <= maxLevel; i++) {
      levels.push(levelGroups.get(i) || []);
    }

    return levels;
  }

  /**
   * 找出可并行执行的节点组
   */
  findParallelGroups(): ParallelGroup[] {
    const levels = this.groupByLevels();
    const groups: ParallelGroup[] = [];

    levels.forEach((nodeIds, levelIndex) => {
      if (nodeIds.length > 1) {
        groups.push({
          id: `parallel-level-${levelIndex}`,
          nodeIds,
          mergeStrategy: 'waitAll',
        });
      }
    });

    return groups;
  }

  /**
   * 获取节点的所有依赖 (递归)
   */
  getAllDependencies(nodeId: string): Set<string> {
    const allDeps = new Set<string>();
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const deps = this.dependencies.get(id) || new Set();
      for (const depId of deps) {
        allDeps.add(depId);
        traverse(depId);
      }
    };

    traverse(nodeId);
    return allDeps;
  }

  /**
   * 获取两个节点之间的所有路径
   */
  findPaths(sourceId: string, targetId: string): string[][] {
    const paths: string[][] = [];

    const dfs = (currentId: string, path: string[]) => {
      if (currentId === targetId) {
        paths.push([...path, currentId]);
        return;
      }

      const deps = this.dependents.get(currentId) || new Set();
      for (const nextId of deps) {
        if (!path.includes(nextId)) {
          dfs(nextId, [...path, currentId]);
        }
      }
    };

    dfs(sourceId, []);
    return paths;
  }

  /**
   * 验证工作流结构
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查是否有节点
    if (this.nodes.size === 0) {
      errors.push('工作流没有任何节点');
    }

    // 检查边的有效性
    for (const edge of this.edges) {
      if (!this.nodes.has(edge.source)) {
        errors.push(`边引用了不存在的源节点: ${edge.source}`);
      }
      if (!this.nodes.has(edge.target)) {
        errors.push(`边引用了不存在的目标节点: ${edge.target}`);
      }
    }

    // 检查环
    const { isValid } = this.topologicalSort();
    if (!isValid) {
      errors.push('工作流图中存在循环依赖');
    }

    // 检查孤立节点 (除了根节点外, 应该有输入)
    const { rootNodes } = this.parse();
    for (const [nodeId, deps] of this.dependencies) {
      if (deps.size === 0 && !rootNodes.includes(nodeId)) {
        // 这是根节点, 正常
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================
// 数据引用解析
// ============================================

/**
 * 解析数据引用表达式
 * 格式: {{stepId.output.field}} 或 {{stepId.field}}
 */
export function parseDataReference(expression: string): {
  stepId: string;
  path: string[];
} | null {
  const match = expression.match(/^\{\{(\w+)\.(.+)\}\}$/);
  if (!match) return null;

  const [, stepId, pathStr] = match;
  const path = pathStr.split('.');

  return { stepId, path };
}

/**
 * 从步骤数据中解析引用值
 */
export function resolveReference(
  expression: string,
  stepsData: Record<string, Record<string, unknown>>
): unknown {
  const ref = parseDataReference(expression);
  if (!ref) {
    // 不是引用表达式, 返回原值
    return expression;
  }

  const stepData = stepsData[ref.stepId];
  if (!stepData) {
    return undefined;
  }

  // 递归获取嵌套值
  let value: unknown = stepData;
  for (const key of ref.path) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'object') {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * 解析配置中的所有引用
 */
export function resolveConfigReferences(
  config: Record<string, unknown>,
  stepsData: Record<string, Record<string, unknown>>
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string' && value.includes('{{')) {
      // 可能包含引用
      if (value.match(/^\{\{.+\}\}$/)) {
        // 整个值是引用
        resolved[key] = resolveReference(value, stepsData);
      } else {
        // 包含多个引用的模板字符串
        resolved[key] = value.replace(
          /\{\{(\w+\.[.\w]+)\}\}/g,
          (match) => {
            const ref = resolveReference(match, stepsData);
            return ref !== undefined ? String(ref) : match;
          }
        );
      }
    } else if (typeof value === 'object' && value !== null) {
      // 递归处理嵌套对象
      if (Array.isArray(value)) {
        resolved[key] = value.map(item =>
          typeof item === 'object' && item !== null
            ? resolveConfigReferences(item as Record<string, unknown>, stepsData)
            : typeof item === 'string' && item.includes('{{')
              ? resolveReference(item, stepsData)
              : item
        );
      } else {
        resolved[key] = resolveConfigReferences(
          value as Record<string, unknown>,
          stepsData
        );
      }
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

// ============================================
// 便捷函数
// ============================================

/**
 * 解析工作流并返回执行计划
 */
export function parseWorkflow(workflow: DAGWorkflowDefinition): DAGParseResult {
  const parser = new DAGParser(workflow);
  return parser.parse();
}

/**
 * 验证工作流结构
 */
export function validateWorkflow(
  workflow: DAGWorkflowDefinition
): { valid: boolean; errors: string[] } {
  const parser = new DAGParser(workflow);
  return parser.validate();
}

/**
 * 获取工作流的并行执行组
 */
export function getParallelGroups(
  workflow: DAGWorkflowDefinition
): ParallelGroup[] {
  const parser = new DAGParser(workflow);
  return parser.findParallelGroups();
}
