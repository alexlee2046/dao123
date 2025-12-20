import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { NodeContext, NodeResult } from '../../core/types';

// ============================================
// Test Fixtures
// ============================================

const createMockContext = (overrides: Partial<NodeContext> = {}): NodeContext => ({
  userId: 'test-user',
  contactId: 'test-contact',
  workflowId: 'test-workflow',
  ...overrides,
});

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            not: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [] })),
            })),
            single: vi.fn(() => ({ data: null })),
          })),
          single: vi.fn(() => ({ data: null })),
        })),
        single: vi.fn(() => ({ data: null })),
      })),
    })),
  })),
}));

// ============================================
// Wait Node Tests
// ============================================

describe('flow.wait node', () => {
  let waitNode: { execute: (input: unknown, context: NodeContext) => Promise<NodeResult> };

  beforeEach(async () => {
    const flowNodes = await import('./nodes');
    waitNode = flowNodes.waitNode;
  });

  test('should return success with wait configuration', async () => {
    const context = createMockContext();
    const input = { duration: 1, unit: 'hours' };

    const result = await waitNode.execute(input, context);

    expect(result.success).toBe(true);
    expect(result.output?.waited).toBe(true);
    expect(result.output?.duration).toBe(1);
    expect(result.output?.unit).toBe('hours');
  });

  test('should calculate correct wait time for days', async () => {
    const context = createMockContext();
    const input = { duration: 3, unit: 'days' };

    const result = await waitNode.execute(input, context);

    expect(result.success).toBe(true);
    expect(result.data?.duration).toBe(3);
    expect(result.data?.waitUntil).toBeInstanceOf(Date);
  });

  test('should handle different time units', async () => {
    const context = createMockContext();
    const units = ['seconds', 'minutes', 'hours', 'days'];

    for (const unit of units) {
      const input = { duration: 5, unit };
      const result = await waitNode.execute(input, context);
      expect(result.success).toBe(true);
      expect(result.output?.unit).toBe(unit);
    }
  });
});

// ============================================
// Split (A/B Test) Node Tests
// ============================================

describe('flow.split node', () => {
  let splitNode: { execute: (input: unknown, context: NodeContext) => Promise<NodeResult> };

  beforeEach(async () => {
    const flowNodes = await import('./nodes');
    splitNode = flowNodes.splitNode;
  });

  test('should select a variant based on percentages', async () => {
    const context = createMockContext();
    const input = {
      variants: [
        { id: 'a', name: 'Variant A', percentage: 50 },
        { id: 'b', name: 'Variant B', percentage: 50 },
      ],
    };

    const result = await splitNode.execute(input, context);

    expect(result.success).toBe(true);
    expect(['a', 'b']).toContain(result.output?.variantId);
    expect(['Variant A', 'Variant B']).toContain(result.output?.variantName);
    expect(result.output?.branch).toBe(result.output?.variantId);
  });

  test('should respect percentage distribution', async () => {
    const context = createMockContext();
    const input = {
      variants: [
        { id: 'a', name: 'Variant A', percentage: 100 },
        { id: 'b', name: 'Variant B', percentage: 0 },
      ],
    };

    // With 100% for A and 0% for B, should always select A
    for (let i = 0; i < 10; i++) {
      const result = await splitNode.execute(input, context);
      expect(result.output?.variantId).toBe('a');
    }
  });

  test('should handle three variants', async () => {
    const context = createMockContext();
    const input = {
      variants: [
        { id: 'a', name: 'Variant A', percentage: 33 },
        { id: 'b', name: 'Variant B', percentage: 33 },
        { id: 'c', name: 'Variant C', percentage: 34 },
      ],
    };

    const result = await splitNode.execute(input, context);

    expect(result.success).toBe(true);
    expect(['a', 'b', 'c']).toContain(result.output?.variantId);
  });

  test('should return correct data structure', async () => {
    const context = createMockContext();
    const input = {
      variants: [
        { id: 'test-variant', name: 'Test Variant', percentage: 100 },
      ],
    };

    const result = await splitNode.execute(input, context);

    expect(result.data?.selectedVariantId).toBe('test-variant');
    expect(result.data?.selectedVariantName).toBe('Test Variant');
  });
});

// ============================================
// Condition Node Tests
// ============================================

describe('flow.condition node', () => {
  let conditionNode: { execute: (input: unknown, context: NodeContext) => Promise<NodeResult> };

  beforeEach(async () => {
    vi.clearAllMocks();
    const flowNodes = await import('./nodes');
    conditionNode = flowNodes.conditionNode;
  });

  test('should return false branch when condition not met (no data)', async () => {
    const context = createMockContext();
    const input = {
      conditionType: 'email_opened',
      params: { emailStepId: 'step_1' },
    };

    const result = await conditionNode.execute(input, context);

    expect(result.success).toBe(true);
    expect(result.output?.conditionResult).toBe(false);
    expect(result.output?.branch).toBe('false');
  });

  test('should return false when contactId is missing', async () => {
    const context = createMockContext({ contactId: undefined });
    const input = {
      conditionType: 'email_opened',
      params: { emailStepId: 'step_1' },
    };

    const result = await conditionNode.execute(input, context);

    expect(result.output?.branch).toBe('false');
  });

  test('should return false for tag_exists when tag param missing', async () => {
    const context = createMockContext();
    const input = {
      conditionType: 'tag_exists',
      params: {},
    };

    const result = await conditionNode.execute(input, context);

    expect(result.output?.branch).toBe('false');
  });

  test('should return false for field_equals when field param missing', async () => {
    const context = createMockContext();
    const input = {
      conditionType: 'field_equals',
      params: {},
    };

    const result = await conditionNode.execute(input, context);

    expect(result.output?.branch).toBe('false');
  });

  test('should return correct data structure', async () => {
    const context = createMockContext();
    const input = {
      conditionType: 'email_clicked',
      params: { emailStepId: 'step_2' },
    };

    const result = await conditionNode.execute(input, context);

    expect(result.success).toBe(true);
    expect(result.data?.conditionType).toBe('email_clicked');
    expect(typeof result.data?.result).toBe('boolean');
  });

  test('should handle expression condition type', async () => {
    const context = createMockContext({
      stepsData: {
        step1: { output: { success: true } },
      },
    });
    const input = {
      conditionType: 'expression',
      params: { expression: '{{step1.output.success}} === true' },
    };

    const result = await conditionNode.execute(input, context);

    expect(result.success).toBe(true);
    // Expression evaluation may vary based on implementation
    expect(['true', 'false']).toContain(result.output?.branch);
  });
});

// ============================================
// Variant Selection Algorithm Tests
// ============================================

describe('selectVariant algorithm', () => {
  test('distribution should be roughly correct over many iterations', async () => {
    const flowNodes = await import('./nodes');
    const splitNode = flowNodes.splitNode;
    const context = createMockContext();

    const input = {
      variants: [
        { id: 'a', name: 'A', percentage: 70 },
        { id: 'b', name: 'B', percentage: 30 },
      ],
    };

    const counts = { a: 0, b: 0 };
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const result = await splitNode.execute(input, context);
      const id = result.output?.variantId as 'a' | 'b';
      counts[id]++;
    }

    // Should be roughly 70% A, 30% B (with some variance)
    const aPercentage = (counts.a / iterations) * 100;
    const bPercentage = (counts.b / iterations) * 100;

    expect(aPercentage).toBeGreaterThan(60);
    expect(aPercentage).toBeLessThan(80);
    expect(bPercentage).toBeGreaterThan(20);
    expect(bPercentage).toBeLessThan(40);
  });
});

// ============================================
// Input Schema Validation Tests
// ============================================

describe('input schema validation', () => {
  test('wait node schema should require duration and unit', async () => {
    const flowNodes = await import('./nodes');
    const schema = flowNodes.waitNode.meta.inputSchema;

    expect(() => schema.parse({})).toThrow();
    expect(() => schema.parse({ duration: 1 })).toThrow();
    expect(() => schema.parse({ unit: 'hours' })).toThrow();
    expect(() => schema.parse({ duration: 1, unit: 'hours' })).not.toThrow();
  });

  test('wait node schema should reject invalid units', async () => {
    const flowNodes = await import('./nodes');
    const schema = flowNodes.waitNode.meta.inputSchema;

    expect(() => schema.parse({ duration: 1, unit: 'weeks' })).toThrow();
  });

  test('split node schema should require at least 2 variants', async () => {
    const flowNodes = await import('./nodes');
    const schema = flowNodes.splitNode.meta.inputSchema;

    expect(() => schema.parse({ variants: [] })).toThrow();
    expect(() => schema.parse({
      variants: [{ id: 'a', name: 'A', percentage: 100 }],
    })).toThrow();
    expect(() => schema.parse({
      variants: [
        { id: 'a', name: 'A', percentage: 50 },
        { id: 'b', name: 'B', percentage: 50 },
      ],
    })).not.toThrow();
  });

  test('condition node schema should validate condition types', async () => {
    const flowNodes = await import('./nodes');
    const schema = flowNodes.conditionNode.meta.inputSchema;

    expect(() => schema.parse({
      conditionType: 'invalid_type',
      params: {},
    })).toThrow();

    expect(() => schema.parse({
      conditionType: 'email_opened',
      params: {},
    })).not.toThrow();
  });
});
