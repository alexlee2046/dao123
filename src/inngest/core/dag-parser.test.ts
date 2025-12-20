import { describe, test, expect } from 'vitest';
import {
  DAGParser,
  parseDataReference,
  resolveReference,
  resolveConfigReferences,
  parseWorkflow,
  validateWorkflow,
  getParallelGroups,
} from './dag-parser';
import type { DAGWorkflowDefinition } from './types';

// ============================================
// Test Fixtures
// ============================================

const baseWorkflowFields = {
  trigger: { type: 'manual' },
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createLinearWorkflow = (): DAGWorkflowDefinition => ({
  id: 'test-linear',
  name: 'Linear Workflow',
  ...baseWorkflowFields,
  nodes: [
    { id: 'start', type: 'trigger.start', config: {} },
    { id: 'step1', type: 'email.send', config: {} },
    { id: 'step2', type: 'flow.wait', config: {} },
    { id: 'end', type: 'flow.end', config: {} },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'step1' },
    { id: 'e2', source: 'step1', target: 'step2' },
    { id: 'e3', source: 'step2', target: 'end' },
  ],
});

const createParallelWorkflow = (): DAGWorkflowDefinition => ({
  id: 'test-parallel',
  name: 'Parallel Workflow',
  ...baseWorkflowFields,
  nodes: [
    { id: 'start', type: 'trigger.start', config: {} },
    { id: 'task-a', type: 'email.send', config: {} },
    { id: 'task-b', type: 'contact.addTag', config: {} },
    { id: 'task-c', type: 'webhook.call', config: {} },
    { id: 'merge', type: 'flow.merge', config: {} },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'task-a' },
    { id: 'e2', source: 'start', target: 'task-b' },
    { id: 'e3', source: 'start', target: 'task-c' },
    { id: 'e4', source: 'task-a', target: 'merge' },
    { id: 'e5', source: 'task-b', target: 'merge' },
    { id: 'e6', source: 'task-c', target: 'merge' },
  ],
});

const createCyclicWorkflow = (): DAGWorkflowDefinition => ({
  id: 'test-cyclic',
  name: 'Cyclic Workflow (Invalid)',
  ...baseWorkflowFields,
  nodes: [
    { id: 'a', type: 'step.a', config: {} },
    { id: 'b', type: 'step.b', config: {} },
    { id: 'c', type: 'step.c', config: {} },
  ],
  edges: [
    { id: 'e1', source: 'a', target: 'b' },
    { id: 'e2', source: 'b', target: 'c' },
    { id: 'e3', source: 'c', target: 'a' }, // Creates cycle
  ],
});

const createDiamondWorkflow = (): DAGWorkflowDefinition => ({
  id: 'test-diamond',
  name: 'Diamond Workflow',
  ...baseWorkflowFields,
  nodes: [
    { id: 'start', type: 'trigger.start', config: {} },
    { id: 'left', type: 'step.left', config: {} },
    { id: 'right', type: 'step.right', config: {} },
    { id: 'end', type: 'flow.end', config: {} },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'left' },
    { id: 'e2', source: 'start', target: 'right' },
    { id: 'e3', source: 'left', target: 'end' },
    { id: 'e4', source: 'right', target: 'end' },
  ],
});

// ============================================
// DAGParser Tests
// ============================================

describe('DAGParser', () => {
  describe('parse linear workflow', () => {
    test('should correctly parse a linear workflow', () => {
      const workflow = createLinearWorkflow();
      const parser = new DAGParser(workflow);
      const result = parser.parse();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sortedNodeIds).toHaveLength(4);
      expect(result.rootNodes).toEqual(['start']);
      expect(result.leafNodes).toEqual(['end']);
    });

    test('should return nodes in topological order', () => {
      const workflow = createLinearWorkflow();
      const parser = new DAGParser(workflow);
      const result = parser.parse();

      // start must come before step1, step1 before step2, etc.
      const startIndex = result.sortedNodeIds.indexOf('start');
      const step1Index = result.sortedNodeIds.indexOf('step1');
      const step2Index = result.sortedNodeIds.indexOf('step2');
      const endIndex = result.sortedNodeIds.indexOf('end');

      expect(startIndex).toBeLessThan(step1Index);
      expect(step1Index).toBeLessThan(step2Index);
      expect(step2Index).toBeLessThan(endIndex);
    });

    test('should correctly identify levels', () => {
      const workflow = createLinearWorkflow();
      const parser = new DAGParser(workflow);
      const result = parser.parse();

      // Linear workflow should have 4 levels, each with 1 node
      expect(result.levels).toHaveLength(4);
      result.levels.forEach(level => {
        expect(level).toHaveLength(1);
      });
    });
  });

  describe('detect cycles', () => {
    test('should detect cyclic dependencies', () => {
      const workflow = createCyclicWorkflow();
      const parser = new DAGParser(workflow);
      const result = parser.parse();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('循环');
    });

    test('should handle self-referencing node', () => {
      const workflow: DAGWorkflowDefinition = {
        id: 'self-ref',
        name: 'Self Reference',
        ...baseWorkflowFields,
        nodes: [{ id: 'a', type: 'step.a', config: {} }],
        edges: [{ id: 'e1', source: 'a', target: 'a' }],
      };

      const parser = new DAGParser(workflow);
      const result = parser.parse();

      expect(result.isValid).toBe(false);
    });
  });

  describe('group nodes by level', () => {
    test('should group parallel nodes in same level', () => {
      const workflow = createParallelWorkflow();
      const parser = new DAGParser(workflow);
      const result = parser.parse();

      expect(result.isValid).toBe(true);

      // Should have 3 levels: start, parallel tasks, merge
      expect(result.levels).toHaveLength(3);

      // Level 0: start
      expect(result.levels[0]).toEqual(['start']);

      // Level 1: task-a, task-b, task-c (in any order)
      expect(result.levels[1].sort()).toEqual(['task-a', 'task-b', 'task-c']);

      // Level 2: merge
      expect(result.levels[2]).toEqual(['merge']);
    });

    test('should identify parallel groups', () => {
      const workflow = createParallelWorkflow();
      const parser = new DAGParser(workflow);
      const groups = parser.findParallelGroups();

      // Should have one parallel group (level 1 with 3 nodes)
      expect(groups.length).toBeGreaterThanOrEqual(1);

      const parallelGroup = groups.find(g => g.nodeIds.length === 3);
      expect(parallelGroup).toBeDefined();
      expect(parallelGroup!.nodeIds.sort()).toEqual(['task-a', 'task-b', 'task-c']);
    });
  });

  describe('diamond workflow', () => {
    test('should correctly parse diamond pattern', () => {
      const workflow = createDiamondWorkflow();
      const parser = new DAGParser(workflow);
      const result = parser.parse();

      expect(result.isValid).toBe(true);
      expect(result.rootNodes).toEqual(['start']);
      expect(result.leafNodes).toEqual(['end']);

      // Should have 3 levels
      expect(result.levels).toHaveLength(3);
      expect(result.levels[1].sort()).toEqual(['left', 'right']);
    });
  });

  describe('getAllDependencies', () => {
    test('should return all transitive dependencies', () => {
      const workflow = createLinearWorkflow();
      const parser = new DAGParser(workflow);

      const endDeps = parser.getAllDependencies('end');
      expect(endDeps.has('start')).toBe(true);
      expect(endDeps.has('step1')).toBe(true);
      expect(endDeps.has('step2')).toBe(true);
      expect(endDeps.size).toBe(3);
    });

    test('should return empty set for root node', () => {
      const workflow = createLinearWorkflow();
      const parser = new DAGParser(workflow);

      const startDeps = parser.getAllDependencies('start');
      expect(startDeps.size).toBe(0);
    });
  });

  describe('findPaths', () => {
    test('should find path in linear workflow', () => {
      const workflow = createLinearWorkflow();
      const parser = new DAGParser(workflow);

      const paths = parser.findPaths('start', 'end');
      expect(paths).toHaveLength(1);
      expect(paths[0]).toEqual(['start', 'step1', 'step2', 'end']);
    });

    test('should find multiple paths in diamond workflow', () => {
      const workflow = createDiamondWorkflow();
      const parser = new DAGParser(workflow);

      const paths = parser.findPaths('start', 'end');
      expect(paths).toHaveLength(2);
    });
  });

  describe('validate', () => {
    test('should validate correct workflow', () => {
      const workflow = createLinearWorkflow();
      const result = validateWorkflow(workflow);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject empty workflow', () => {
      const workflow: DAGWorkflowDefinition = {
        id: 'empty',
        name: 'Empty',
        ...baseWorkflowFields,
        nodes: [],
        edges: [],
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('没有任何节点'))).toBe(true);
    });

    test('should reject invalid edge references', () => {
      const workflow: DAGWorkflowDefinition = {
        id: 'invalid-ref',
        name: 'Invalid Reference',
        ...baseWorkflowFields,
        nodes: [{ id: 'a', type: 'step.a', config: {} }],
        edges: [{ id: 'e1', source: 'a', target: 'nonexistent' }],
      };

      const result = validateWorkflow(workflow);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('不存在的目标节点'))).toBe(true);
    });
  });
});

// ============================================
// Data Reference Tests
// ============================================

describe('parseDataReference', () => {
  test('should parse simple reference', () => {
    const result = parseDataReference('{{step1.email}}');
    expect(result).toEqual({
      stepId: 'step1',
      path: ['email'],
    });
  });

  test('should parse nested reference', () => {
    const result = parseDataReference('{{step1.output.body.data}}');
    expect(result).toEqual({
      stepId: 'step1',
      path: ['output', 'body', 'data'],
    });
  });

  test('should return null for invalid format', () => {
    expect(parseDataReference('not a reference')).toBeNull();
    expect(parseDataReference('{{invalid}}')).toBeNull();
    expect(parseDataReference('{{ step1.field }}')).toBeNull(); // spaces
  });
});

describe('resolveReference', () => {
  const stepsData = {
    step1: { email: 'test@example.com', count: 42 },
    step2: { output: { body: { message: 'Hello' } } },
  };

  test('should resolve simple reference', () => {
    const result = resolveReference('{{step1.email}}', stepsData);
    expect(result).toBe('test@example.com');
  });

  test('should resolve nested reference', () => {
    const result = resolveReference('{{step2.output.body.message}}', stepsData);
    expect(result).toBe('Hello');
  });

  test('should return undefined for missing step', () => {
    const result = resolveReference('{{nonexistent.field}}', stepsData);
    expect(result).toBeUndefined();
  });

  test('should return original for non-reference', () => {
    const result = resolveReference('plain text', stepsData);
    expect(result).toBe('plain text');
  });
});

describe('resolveConfigReferences', () => {
  const stepsData = {
    step1: { email: 'test@example.com', name: 'John' },
  };

  test('should resolve references in config', () => {
    const config = {
      to: '{{step1.email}}',
      subject: 'Hello',
    };

    const result = resolveConfigReferences(config, stepsData);
    expect(result.to).toBe('test@example.com');
    expect(result.subject).toBe('Hello');
  });

  test('should handle template strings', () => {
    const config = {
      body: 'Hello {{step1.name}}, your email is {{step1.email}}',
    };

    const result = resolveConfigReferences(config, stepsData);
    expect(result.body).toBe('Hello John, your email is test@example.com');
  });

  test('should handle nested objects', () => {
    const config = {
      nested: {
        value: '{{step1.email}}',
      },
    };

    const result = resolveConfigReferences(config, stepsData);
    expect((result.nested as Record<string, unknown>).value).toBe('test@example.com');
  });

  test('should handle arrays', () => {
    const config = {
      items: ['{{step1.email}}', 'static'],
    };

    const result = resolveConfigReferences(config, stepsData);
    expect(result.items).toEqual(['test@example.com', 'static']);
  });
});

// ============================================
// Convenience Function Tests
// ============================================

describe('parseWorkflow', () => {
  test('should return parse result', () => {
    const workflow = createLinearWorkflow();
    const result = parseWorkflow(workflow);

    expect(result.isValid).toBe(true);
    expect(result.sortedNodeIds).toBeDefined();
    expect(result.levels).toBeDefined();
  });
});

describe('getParallelGroups', () => {
  test('should return parallel groups', () => {
    const workflow = createParallelWorkflow();
    const groups = getParallelGroups(workflow);

    expect(groups.length).toBeGreaterThan(0);
  });
});
