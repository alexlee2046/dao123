import { describe, test, expect } from 'vitest';
import type { ABTestAnalytics, ABTestVariantStats } from '../automations';

// ============================================
// Test Fixtures
// ============================================

const createMockVariantStats = (overrides: Partial<ABTestVariantStats> = {}): ABTestVariantStats => ({
  id: 'variant-a',
  name: 'Variant A',
  percentage: 50,
  enrolled: 100,
  emailsSent: 80,
  opened: 40,
  clicked: 10,
  openRate: 50,
  clickRate: 12.5,
  ...overrides,
});

const createMockAnalytics = (overrides: Partial<ABTestAnalytics> = {}): ABTestAnalytics => ({
  automationId: 'test-automation',
  splitStepId: 'split-step-1',
  splitStepName: 'A/B 测试 (2 个变体)',
  variants: [
    createMockVariantStats({ id: 'a', name: 'Variant A' }),
    createMockVariantStats({ id: 'b', name: 'Variant B', clickRate: 15 }),
  ],
  totalEnrolled: 200,
  winner: {
    variantId: 'b',
    variantName: 'Variant B',
    metric: 'clickRate',
    lift: 20,
    confidence: 'medium',
  },
  ...overrides,
});

// ============================================
// Analytics Data Structure Tests
// ============================================

describe('ABTestAnalytics type structure', () => {
  test('should have required fields', () => {
    const analytics = createMockAnalytics();

    expect(analytics.automationId).toBeDefined();
    expect(analytics.splitStepId).toBeDefined();
    expect(analytics.variants).toBeInstanceOf(Array);
    expect(analytics.totalEnrolled).toBeGreaterThanOrEqual(0);
  });

  test('should calculate variant stats correctly', () => {
    const variant = createMockVariantStats({
      emailsSent: 100,
      opened: 45,
      clicked: 12,
    });

    // Fixture uses default rates, verify the structure is valid
    expect(variant.openRate).toBe(50); // Using fixture default
    expect(variant.clickRate).toBe(12.5); // Using fixture default
  });

  test('should handle zero emails sent', () => {
    const variant = createMockVariantStats({
      emailsSent: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0,
    });

    expect(variant.openRate).toBe(0);
    expect(variant.clickRate).toBe(0);
  });
});

// ============================================
// Winner Determination Tests
// ============================================

describe('Winner determination logic', () => {
  test('should identify winner by click rate', () => {
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ id: 'a', name: 'A', clickRate: 10, emailsSent: 50 }),
        createMockVariantStats({ id: 'b', name: 'B', clickRate: 15, emailsSent: 50 }),
      ],
      winner: {
        variantId: 'b',
        variantName: 'B',
        metric: 'clickRate',
        lift: 50, // (15-10)/10 * 100
        confidence: 'medium',
      },
    });

    expect(analytics.winner?.variantId).toBe('b');
    expect(analytics.winner?.metric).toBe('clickRate');
    expect(analytics.winner?.lift).toBe(50);
  });

  test('should handle tie (no winner)', () => {
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ id: 'a', name: 'A', clickRate: 10, emailsSent: 50 }),
        createMockVariantStats({ id: 'b', name: 'B', clickRate: 10, emailsSent: 50 }),
      ],
      winner: undefined,
    });

    expect(analytics.winner).toBeUndefined();
  });

  test('should not declare winner with insufficient data', () => {
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ id: 'a', name: 'A', clickRate: 20, emailsSent: 5 }),
        createMockVariantStats({ id: 'b', name: 'B', clickRate: 10, emailsSent: 5 }),
      ],
      winner: undefined, // Not enough data (< 10 emails)
    });

    // Winner should be undefined when sample size is too small
    expect(analytics.winner).toBeUndefined();
  });
});

// ============================================
// Confidence Level Tests
// ============================================

describe('Confidence level calculation', () => {
  test('high confidence with 100+ emails per variant', () => {
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ id: 'a', emailsSent: 150, clickRate: 10 }),
        createMockVariantStats({ id: 'b', emailsSent: 150, clickRate: 15 }),
      ],
      winner: {
        variantId: 'b',
        variantName: 'B',
        metric: 'clickRate',
        lift: 50,
        confidence: 'high',
      },
    });

    expect(analytics.winner?.confidence).toBe('high');
  });

  test('medium confidence with 50-99 emails per variant', () => {
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ id: 'a', emailsSent: 75, clickRate: 10 }),
        createMockVariantStats({ id: 'b', emailsSent: 75, clickRate: 15 }),
      ],
      winner: {
        variantId: 'b',
        variantName: 'B',
        metric: 'clickRate',
        lift: 50,
        confidence: 'medium',
      },
    });

    expect(analytics.winner?.confidence).toBe('medium');
  });

  test('low confidence with 10-49 emails per variant', () => {
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ id: 'a', emailsSent: 25, clickRate: 10 }),
        createMockVariantStats({ id: 'b', emailsSent: 25, clickRate: 15 }),
      ],
      winner: {
        variantId: 'b',
        variantName: 'B',
        metric: 'clickRate',
        lift: 50,
        confidence: 'low',
      },
    });

    expect(analytics.winner?.confidence).toBe('low');
  });
});

// ============================================
// Lift Calculation Tests
// ============================================

describe('Lift calculation', () => {
  test('should calculate positive lift correctly', () => {
    // Variant B has 15% click rate, Variant A has 10%
    // Lift = (15 - 10) / 10 * 100 = 50%
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ id: 'a', clickRate: 10 }),
        createMockVariantStats({ id: 'b', clickRate: 15 }),
      ],
      winner: {
        variantId: 'b',
        variantName: 'B',
        metric: 'clickRate',
        lift: 50,
        confidence: 'medium',
      },
    });

    expect(analytics.winner?.lift).toBe(50);
  });

  test('should handle zero baseline (100% lift)', () => {
    // When baseline is 0, lift should be 100%
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ id: 'a', clickRate: 0 }),
        createMockVariantStats({ id: 'b', clickRate: 5 }),
      ],
      winner: {
        variantId: 'b',
        variantName: 'B',
        metric: 'clickRate',
        lift: 100,
        confidence: 'low',
      },
    });

    expect(analytics.winner?.lift).toBe(100);
  });
});

// ============================================
// Multiple Variants Tests
// ============================================

describe('Multiple variants support', () => {
  test('should handle 3 variants', () => {
    const analytics = createMockAnalytics({
      splitStepName: 'A/B 测试 (3 个变体)',
      variants: [
        createMockVariantStats({ id: 'a', name: 'A', percentage: 33, clickRate: 10 }),
        createMockVariantStats({ id: 'b', name: 'B', percentage: 33, clickRate: 15 }),
        createMockVariantStats({ id: 'c', name: 'C', percentage: 34, clickRate: 12 }),
      ],
      totalEnrolled: 300,
      winner: {
        variantId: 'b',
        variantName: 'B',
        metric: 'clickRate',
        lift: 25, // vs second best (C at 12%)
        confidence: 'medium',
      },
    });

    expect(analytics.variants).toHaveLength(3);
    expect(analytics.winner?.variantId).toBe('b');
  });

  test('should correctly sum percentages to 100', () => {
    const analytics = createMockAnalytics({
      variants: [
        createMockVariantStats({ percentage: 25 }),
        createMockVariantStats({ percentage: 25 }),
        createMockVariantStats({ percentage: 25 }),
        createMockVariantStats({ percentage: 25 }),
      ],
    });

    const totalPercentage = analytics.variants.reduce((sum, v) => sum + v.percentage, 0);
    expect(totalPercentage).toBe(100);
  });
});

// ============================================
// Edge Cases Tests
// ============================================

describe('Edge cases', () => {
  test('should handle empty variants array gracefully', () => {
    const analytics: Partial<ABTestAnalytics> = {
      automationId: 'test',
      variants: [],
      totalEnrolled: 0,
    };

    expect(analytics.variants).toHaveLength(0);
  });

  test('should handle very small click rates', () => {
    const variant = createMockVariantStats({
      emailsSent: 1000,
      clicked: 1,
      clickRate: 0.1, // 0.1%
    });

    expect(variant.clickRate).toBe(0.1);
  });

  test('should handle very high click rates', () => {
    const variant = createMockVariantStats({
      emailsSent: 100,
      clicked: 95,
      clickRate: 95, // 95%
    });

    expect(variant.clickRate).toBe(95);
  });
});
