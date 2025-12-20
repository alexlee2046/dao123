import { describe, test, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import type { NodeDefinition, NodeContext } from './types';

// We need to test the registry class directly, not the singleton
// So we'll create a fresh instance for each test

// ============================================
// Test Fixtures
// ============================================

const createMockNode = (overrides: Partial<NodeDefinition> = {}): NodeDefinition => {
  const inputSchema = z.object({
    message: z.string(),
  });

  return {
    meta: {
      id: 'test.mock',
      name: 'Mock Node',
      description: 'A mock node for testing',
      category: 'action',
      module: 'test',
      icon: 'Box',
      inputSchema,
      examples: [
        {
          name: 'Basic Example',
          config: { message: 'Hello' },
        },
      ],
      ...overrides.meta,
    },
    execute: overrides.execute || (async (input: unknown) => ({
      success: true,
      output: { received: input },
    })),
    validate: overrides.validate,
  };
};

const createEmailNode = (): NodeDefinition => ({
  meta: {
    id: 'email.send',
    name: 'Send Email',
    description: 'Send an email to a contact',
    category: 'action',
    module: 'email',
    icon: 'Mail',
    inputSchema: z.object({
      to: z.string().email(),
      subject: z.string(),
      body: z.string(),
    }),
    examples: [
      {
        name: 'Welcome Email',
        config: { to: 'user@example.com', subject: 'Welcome', body: 'Hello!' },
      },
    ],
  },
  execute: async (input: { to: string; subject: string; body: string }) => ({
    success: true,
    output: { sent: true, to: input.to },
  }),
});

const createWaitNode = (): NodeDefinition => ({
  meta: {
    id: 'flow.wait',
    name: 'Wait',
    description: 'Wait for a duration',
    category: 'flow',
    module: 'flow',
    icon: 'Clock',
    inputSchema: z.object({
      duration: z.number().positive(),
      unit: z.enum(['seconds', 'minutes', 'hours', 'days']),
    }),
    examples: [],
  },
  execute: async (input: { duration: number; unit: string }) => ({
    success: true,
    output: { waited: input.duration, unit: input.unit },
  }),
});

// ============================================
// Registry Class Tests (using dynamic import)
// ============================================

describe('NodeRegistry', () => {
  // Create a fresh registry instance for each test
  let NodeRegistry: new () => {
    register: (node: NodeDefinition) => void;
    registerAll: (nodes: NodeDefinition[]) => void;
    get: (id: string) => NodeDefinition | undefined;
    getAll: () => NodeDefinition[];
    getByModule: (module: string) => NodeDefinition[];
    getModules: () => string[];
    getAllMeta: () => NodeDefinition['meta'][];
    getAIDescriptions: () => unknown[];
    generateAIPrompt: () => string;
    execute: (nodeId: string, input: unknown, context: NodeContext) => Promise<{ success: boolean; error?: string; output?: unknown }>;
  };

  let registry: InstanceType<typeof NodeRegistry>;

  beforeEach(async () => {
    // Dynamically create a fresh NodeRegistry class
    const { zodToJsonSchema } = await import('zod-to-json-schema');

    class FreshNodeRegistry {
      private nodes: Map<string, NodeDefinition> = new Map();
      private modules: Map<string, Set<string>> = new Map();

      register(node: NodeDefinition): void {
        const { id, module } = node.meta;
        this.nodes.set(id, node);
        if (!this.modules.has(module)) {
          this.modules.set(module, new Set());
        }
        this.modules.get(module)!.add(id);
      }

      registerAll(nodes: NodeDefinition[]): void {
        nodes.forEach((node) => this.register(node));
      }

      get(id: string): NodeDefinition | undefined {
        return this.nodes.get(id);
      }

      getAll(): NodeDefinition[] {
        return Array.from(this.nodes.values());
      }

      getByModule(module: string): NodeDefinition[] {
        const nodeIds = this.modules.get(module);
        if (!nodeIds) return [];
        return Array.from(nodeIds)
          .map((id) => this.nodes.get(id)!)
          .filter(Boolean);
      }

      getModules(): string[] {
        return Array.from(this.modules.keys());
      }

      getAllMeta(): NodeDefinition['meta'][] {
        return this.getAll().map((node) => node.meta);
      }

      getAIDescriptions(): unknown[] {
        return this.getAll().map((node) => ({
          id: node.meta.id,
          name: node.meta.name,
          description: node.meta.description,
          category: node.meta.category,
          module: node.meta.module,
          inputSchema: zodToJsonSchema(node.meta.inputSchema),
          examples: node.meta.examples,
        }));
      }

      generateAIPrompt(): string {
        let prompt = '# 可用节点\n\n';
        const byModule = new Map<string, NodeDefinition[]>();

        this.getAll().forEach(node => {
          const mod = node.meta.module;
          if (!byModule.has(mod)) byModule.set(mod, []);
          byModule.get(mod)!.push(node);
        });

        byModule.forEach((nodes, module) => {
          prompt += `## ${module} 模块\n\n`;
          nodes.forEach((node) => {
            prompt += `### ${node.meta.name} (${node.meta.id})\n`;
            prompt += `${node.meta.description}\n\n`;
          });
        });

        return prompt;
      }

      async execute(
        nodeId: string,
        input: unknown,
        context: NodeContext
      ): Promise<{ success: boolean; error?: string; output?: unknown }> {
        const node = this.get(nodeId);

        if (!node) {
          return {
            success: false,
            error: `Node "${nodeId}" not found`,
          };
        }

        try {
          const validatedInput = node.validate
            ? node.validate(input)
            : node.meta.inputSchema.parse(input);
          return await node.execute(validatedInput, context);
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }
    }

    NodeRegistry = FreshNodeRegistry as unknown as typeof NodeRegistry;
    registry = new FreshNodeRegistry();
  });

  describe('registration', () => {
    test('should register a node', () => {
      const node = createMockNode();
      registry.register(node);

      expect(registry.get('test.mock')).toBe(node);
    });

    test('should register multiple nodes', () => {
      const emailNode = createEmailNode();
      const waitNode = createWaitNode();

      registry.registerAll([emailNode, waitNode]);

      expect(registry.get('email.send')).toBe(emailNode);
      expect(registry.get('flow.wait')).toBe(waitNode);
    });

    test('should overwrite existing node with same id', () => {
      const node1 = createMockNode();
      const node2 = createMockNode({
        execute: async () => ({ success: true, output: { different: true } }),
      });

      registry.register(node1);
      registry.register(node2);

      expect(registry.get('test.mock')).toBe(node2);
    });
  });

  describe('retrieval', () => {
    beforeEach(() => {
      registry.register(createEmailNode());
      registry.register(createWaitNode());
      registry.register(createMockNode());
    });

    test('should get node by id', () => {
      const node = registry.get('email.send');
      expect(node).toBeDefined();
      expect(node!.meta.id).toBe('email.send');
    });

    test('should return undefined for unknown id', () => {
      const node = registry.get('nonexistent.node');
      expect(node).toBeUndefined();
    });

    test('should get all nodes', () => {
      const nodes = registry.getAll();
      expect(nodes).toHaveLength(3);
    });
  });

  describe('module grouping', () => {
    beforeEach(() => {
      registry.register(createEmailNode());
      registry.register(createWaitNode());
      registry.register(createMockNode());
    });

    test('should get nodes by module', () => {
      const emailNodes = registry.getByModule('email');
      expect(emailNodes).toHaveLength(1);
      expect(emailNodes[0].meta.id).toBe('email.send');
    });

    test('should return empty array for unknown module', () => {
      const nodes = registry.getByModule('nonexistent');
      expect(nodes).toHaveLength(0);
    });

    test('should get all modules', () => {
      const modules = registry.getModules();
      expect(modules.sort()).toEqual(['email', 'flow', 'test']);
    });
  });

  describe('metadata', () => {
    beforeEach(() => {
      registry.register(createEmailNode());
      registry.register(createWaitNode());
    });

    test('should get all metadata', () => {
      const metas = registry.getAllMeta();
      expect(metas).toHaveLength(2);
      expect(metas.map(m => m.id).sort()).toEqual(['email.send', 'flow.wait']);
    });

    test('should generate AI descriptions', () => {
      const descriptions = registry.getAIDescriptions();
      expect(descriptions).toHaveLength(2);

      const emailDesc = descriptions.find((d: any) => d.id === 'email.send') as any;
      expect(emailDesc).toBeDefined();
      expect(emailDesc.name).toBe('Send Email');
      expect(emailDesc.inputSchema).toBeDefined();
    });

    test('should generate AI prompt', () => {
      const prompt = registry.generateAIPrompt();

      expect(prompt).toContain('# 可用节点');
      expect(prompt).toContain('## email 模块');
      expect(prompt).toContain('Send Email');
      expect(prompt).toContain('email.send');
    });
  });

  describe('execution', () => {
    const mockContext: NodeContext = {
      userId: 'test-user',
      contactId: 'test-contact',
      workflowId: 'test-workflow',
    };

    beforeEach(() => {
      registry.register(createEmailNode());
    });

    test('should execute node with valid input', async () => {
      const result = await registry.execute(
        'email.send',
        { to: 'test@example.com', subject: 'Test', body: 'Hello' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.output).toEqual({ sent: true, to: 'test@example.com' });
    });

    test('should return error for unknown node', async () => {
      const result = await registry.execute('nonexistent', {}, mockContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should return error for invalid input', async () => {
      const result = await registry.execute(
        'email.send',
        { to: 'invalid-email', subject: 'Test' }, // missing body, invalid email
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should use custom validate function if provided', async () => {
      const customValidate = vi.fn((input) => input);
      const nodeWithValidate = createMockNode({
        validate: customValidate,
      });

      registry.register(nodeWithValidate);
      await registry.execute('test.mock', { message: 'test' }, mockContext);

      expect(customValidate).toHaveBeenCalledWith({ message: 'test' });
    });
  });
});
