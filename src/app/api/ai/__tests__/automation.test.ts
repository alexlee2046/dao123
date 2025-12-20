import { describe, test, expect } from 'vitest';
import { z } from 'zod';

// Re-create the schemas from route.ts for testing
const VALID_STEP_TYPES = ['send_email', 'wait', 'add_tag', 'remove_tag'] as const;

const automationStepSchema = z.object({
  type: z.enum(VALID_STEP_TYPES),
  config: z.object({
    subject: z.string().optional(),
    content: z.string().optional(),
    preheader: z.string().optional(),
    duration: z.number().optional(),
    unit: z.enum(['minutes', 'hours', 'days']).optional(),
    tag: z.string().optional(),
  }),
});

const automationSequenceSchema = z.object({
  name: z.string(),
  description: z.string(),
  steps: z.array(automationStepSchema).min(2).max(20),
  explanation: z.string(),
});

// Request schema
const requestSchema = z.object({
  product_description: z.string().min(10),
  target_audience: z.string().optional(),
  sequence_length: z.number().min(2).max(10),
  tone: z.enum(['professional', 'friendly', 'casual', 'formal']).default('professional'),
});

// ============================================
// Schema Validation Tests
// ============================================

describe('/api/ai/automation schema validation', () => {
  describe('request validation', () => {
    test('should accept valid request', () => {
      const request = {
        product_description: 'A SaaS platform for managing customer relationships',
        target_audience: 'Small business owners',
        sequence_length: 5,
        tone: 'professional',
      };

      const result = requestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    test('should reject short product description', () => {
      const request = {
        product_description: 'Short',
        sequence_length: 5,
      };

      const result = requestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    test('should reject sequence length < 2', () => {
      const request = {
        product_description: 'A complete project management solution',
        sequence_length: 1,
      };

      const result = requestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    test('should reject sequence length > 10', () => {
      const request = {
        product_description: 'A complete project management solution',
        sequence_length: 15,
      };

      const result = requestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    test('should reject invalid tone', () => {
      const request = {
        product_description: 'A complete project management solution',
        sequence_length: 5,
        tone: 'aggressive',
      };

      const result = requestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    test('should use default tone if not provided', () => {
      const request = {
        product_description: 'A complete project management solution',
        sequence_length: 5,
      };

      const result = requestSchema.safeParse(request);
      expect(result.success).toBe(true);
      expect(result.data?.tone).toBe('professional');
    });
  });

  describe('step validation', () => {
    test('should validate send_email step', () => {
      const step = {
        type: 'send_email',
        config: {
          subject: 'Welcome!',
          content: '<p>Hello world</p>',
          preheader: 'Start your journey',
        },
      };

      const result = automationStepSchema.safeParse(step);
      expect(result.success).toBe(true);
    });

    test('should validate wait step', () => {
      const step = {
        type: 'wait',
        config: {
          duration: 2,
          unit: 'days',
        },
      };

      const result = automationStepSchema.safeParse(step);
      expect(result.success).toBe(true);
    });

    test('should validate add_tag step', () => {
      const step = {
        type: 'add_tag',
        config: {
          tag: 'onboarding_complete',
        },
      };

      const result = automationStepSchema.safeParse(step);
      expect(result.success).toBe(true);
    });

    test('should validate remove_tag step', () => {
      const step = {
        type: 'remove_tag',
        config: {
          tag: 'trial_user',
        },
      };

      const result = automationStepSchema.safeParse(step);
      expect(result.success).toBe(true);
    });

    test('should reject invalid step type', () => {
      const step = {
        type: 'invalid_type',
        config: {},
      };

      const result = automationStepSchema.safeParse(step);
      expect(result.success).toBe(false);
    });

    test('should reject invalid wait unit', () => {
      const step = {
        type: 'wait',
        config: {
          duration: 2,
          unit: 'weeks', // invalid
        },
      };

      const result = automationStepSchema.safeParse(step);
      expect(result.success).toBe(false);
    });
  });

  describe('sequence validation', () => {
    test('should validate complete sequence', () => {
      const sequence = {
        name: 'Welcome Sequence',
        description: 'Onboard new users',
        steps: [
          { type: 'send_email', config: { subject: 'Welcome!', content: '<p>Hello</p>' } },
          { type: 'wait', config: { duration: 1, unit: 'days' } },
          { type: 'send_email', config: { subject: 'Tips', content: '<p>Tips</p>' } },
          { type: 'add_tag', config: { tag: 'onboarded' } },
        ],
        explanation: 'Progressive engagement strategy',
      };

      const result = automationSequenceSchema.safeParse(sequence);
      expect(result.success).toBe(true);
    });

    test('should reject sequence with < 2 steps', () => {
      const sequence = {
        name: 'Too Short',
        description: 'Only one step',
        steps: [
          { type: 'send_email', config: { subject: 'Hello', content: '<p>Hi</p>' } },
        ],
        explanation: 'Too short',
      };

      const result = automationSequenceSchema.safeParse(sequence);
      expect(result.success).toBe(false);
    });

    test('should reject sequence with > 20 steps', () => {
      const steps = Array(21).fill(null).map((_, i) => ({
        type: 'send_email' as const,
        config: { subject: `Email ${i + 1}`, content: '<p>Content</p>' },
      }));

      const sequence = {
        name: 'Too Long',
        description: 'Too many steps',
        steps,
        explanation: 'Too long',
      };

      const result = automationSequenceSchema.safeParse(sequence);
      expect(result.success).toBe(false);
    });

    test('should reject sequence missing required fields', () => {
      const sequence = {
        name: 'Missing Fields',
        // missing description
        steps: [
          { type: 'send_email', config: { subject: 'Hello', content: '<p>Hi</p>' } },
          { type: 'wait', config: { duration: 1, unit: 'days' } },
        ],
        explanation: 'Missing description',
      };

      const result = automationSequenceSchema.safeParse(sequence);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================
// Step Count Calculation Tests
// ============================================

describe('step count calculation', () => {
  const calculateStepCounts = (emailCount: number) => {
    // Based on the route logic
    const waitSteps = Math.max(0, emailCount - 1);
    const tagSteps = 2; // Start and end tags
    const totalSteps = emailCount + waitSteps + tagSteps;
    return { emailCount, waitSteps, tagSteps, totalSteps };
  };

  test('should calculate for 3 emails', () => {
    const counts = calculateStepCounts(3);
    expect(counts.waitSteps).toBe(2);
    expect(counts.tagSteps).toBe(2);
    expect(counts.totalSteps).toBe(7); // 3 + 2 + 2
  });

  test('should calculate for 5 emails', () => {
    const counts = calculateStepCounts(5);
    expect(counts.waitSteps).toBe(4);
    expect(counts.tagSteps).toBe(2);
    expect(counts.totalSteps).toBe(11); // 5 + 4 + 2
  });

  test('should calculate for 10 emails', () => {
    const counts = calculateStepCounts(10);
    expect(counts.waitSteps).toBe(9);
    expect(counts.tagSteps).toBe(2);
    expect(counts.totalSteps).toBe(21); // 10 + 9 + 2
  });
});

// ============================================
// Generated Sequence Structure Tests
// ============================================

describe('sequence structure validation', () => {
  const validateSequenceStructure = (steps: typeof automationStepSchema._type[]): {
    valid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    // Count step types
    const emailSteps = steps.filter(s => s.type === 'send_email');
    const waitSteps = steps.filter(s => s.type === 'wait');

    // Check email content
    for (const email of emailSteps) {
      if (!email.config.subject || email.config.subject.length === 0) {
        errors.push('Email missing subject');
      }
      if (!email.config.content || email.config.content.length < 10) {
        errors.push('Email missing or too short content');
      }
    }

    // Check wait configuration
    for (const wait of waitSteps) {
      if (!wait.config.duration || wait.config.duration <= 0) {
        errors.push('Wait step missing or invalid duration');
      }
    }

    // Check interleaving (generally emails should have waits between them)
    for (let i = 0; i < steps.length - 1; i++) {
      if (steps[i].type === 'send_email' && steps[i + 1].type === 'send_email') {
        // Two consecutive emails without wait - might be intentional but warn
        // This is not an error, just a note
      }
    }

    return { valid: errors.length === 0, errors };
  };

  test('should validate well-formed sequence', () => {
    const steps = [
      { type: 'add_tag' as const, config: { tag: 'started' } },
      { type: 'send_email' as const, config: { subject: 'Welcome', content: '<p>Welcome to our service!</p>' } },
      { type: 'wait' as const, config: { duration: 2, unit: 'days' as const } },
      { type: 'send_email' as const, config: { subject: 'Tips', content: '<p>Here are some tips...</p>' } },
      { type: 'add_tag' as const, config: { tag: 'completed' } },
    ];

    const result = validateSequenceStructure(steps);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect missing email content', () => {
    const steps = [
      { type: 'send_email' as const, config: { subject: 'Hello', content: '' } },
      { type: 'wait' as const, config: { duration: 1, unit: 'days' as const } },
    ];

    const result = validateSequenceStructure(steps);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('content'))).toBe(true);
  });

  test('should detect missing email subject', () => {
    const steps = [
      { type: 'send_email' as const, config: { subject: '', content: '<p>Some content here</p>' } },
      { type: 'wait' as const, config: { duration: 1, unit: 'days' as const } },
    ];

    const result = validateSequenceStructure(steps);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('subject'))).toBe(true);
  });

  test('should detect invalid wait duration', () => {
    const steps = [
      { type: 'send_email' as const, config: { subject: 'Hello', content: '<p>Hello world</p>' } },
      { type: 'wait' as const, config: { duration: 0, unit: 'days' as const } },
    ];

    const result = validateSequenceStructure(steps);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('duration'))).toBe(true);
  });
});
