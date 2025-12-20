import { zodToJsonSchema } from 'zod-to-json-schema';
import type { NodeDefinition, NodeMeta, AINodeDescription } from './types';

// ============================================
// 节点注册中心
// ============================================

class NodeRegistry {
  private nodes: Map<string, NodeDefinition> = new Map();
  private modules: Map<string, Set<string>> = new Map();

  /**
   * 注册节点
   */
  register(node: NodeDefinition): void {
    const { id, module } = node.meta;

    if (this.nodes.has(id)) {
      console.warn(`[NodeRegistry] Node "${id}" already registered, overwriting.`);
    }

    this.nodes.set(id, node);

    // 按模块分组
    if (!this.modules.has(module)) {
      this.modules.set(module, new Set());
    }
    this.modules.get(module)!.add(id);

    console.log(`[NodeRegistry] Registered node: ${id} (module: ${module})`);
  }

  /**
   * 批量注册
   */
  registerAll(nodes: NodeDefinition[]): void {
    nodes.forEach((node) => this.register(node));
  }

  /**
   * 获取节点
   */
  get(id: string): NodeDefinition | undefined {
    return this.nodes.get(id);
  }

  /**
   * 获取所有节点
   */
  getAll(): NodeDefinition[] {
    return Array.from(this.nodes.values());
  }

  /**
   * 获取模块下的所有节点
   */
  getByModule(module: string): NodeDefinition[] {
    const nodeIds = this.modules.get(module);
    if (!nodeIds) return [];
    return Array.from(nodeIds)
      .map((id) => this.nodes.get(id)!)
      .filter(Boolean);
  }

  /**
   * 获取所有模块名称
   */
  getModules(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * 获取所有节点元数据 (用于 UI)
   */
  getAllMeta(): NodeMeta[] {
    return this.getAll().map((node) => node.meta);
  }

  /**
   * 获取 AI 可理解的节点描述 (用于 prompt)
   */
  getAIDescriptions(): AINodeDescription[] {
    return this.getAll().map((node) => ({
      id: node.meta.id,
      name: node.meta.name,
      description: node.meta.description,
      category: node.meta.category,
      module: node.meta.module,
      inputSchema: zodToJsonSchema(node.meta.inputSchema) as Record<string, unknown>,
      examples: node.meta.examples,
    }));
  }

  /**
   * 生成 AI prompt 用的节点目录
   */
  generateAIPrompt(): string {
    const descriptions = this.getAIDescriptions();
    const byModule: Record<string, AINodeDescription[]> = {};

    descriptions.forEach((desc) => {
      if (!byModule[desc.module]) {
        byModule[desc.module] = [];
      }
      byModule[desc.module].push(desc);
    });

    let prompt = '# 可用节点\n\n';

    Object.entries(byModule).forEach(([module, nodes]) => {
      prompt += `## ${module} 模块\n\n`;
      nodes.forEach((node) => {
        prompt += `### ${node.name} (${node.id})\n`;
        prompt += `${node.description}\n\n`;
        if (node.examples && node.examples.length > 0) {
          prompt += '示例配置:\n```json\n';
          prompt += JSON.stringify(node.examples[0].config, null, 2);
          prompt += '\n```\n\n';
        }
      });
    });

    return prompt;
  }

  /**
   * 执行节点
   */
  async execute(
    nodeId: string,
    input: unknown,
    context: import('./types').NodeContext
  ): Promise<import('./types').NodeResult> {
    const node = this.get(nodeId);

    if (!node) {
      return {
        success: false,
        error: `Node "${nodeId}" not found`,
      };
    }

    try {
      // 验证输入
      const validatedInput = node.validate
        ? node.validate(input)
        : node.meta.inputSchema.parse(input);

      // 执行节点
      return await node.execute(validatedInput, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// 单例导出
export const nodeRegistry = new NodeRegistry();

// 便捷函数
export const registerNode = (node: NodeDefinition) => nodeRegistry.register(node);
export const registerNodes = (nodes: NodeDefinition[]) => nodeRegistry.registerAll(nodes);
export const getNode = (id: string) => nodeRegistry.get(id);
export const getAllNodes = () => nodeRegistry.getAll();
export const executeNode = nodeRegistry.execute.bind(nodeRegistry);
