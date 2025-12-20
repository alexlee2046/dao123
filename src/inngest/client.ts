import { Inngest, EventSchemas } from 'inngest';

// ============================================
// Event Types - 所有模块的事件定义
// ============================================

type Events = {
  // Form 模块事件
  'form/submitted': {
    data: {
      formId: string;
      submissionId: string;
      contactId: string;
      fields: Record<string, unknown>;
      metadata?: {
        ip?: string;
        userAgent?: string;
        referrer?: string;
      };
    };
  };

  // Contact 模块事件
  'contact/created': {
    data: {
      contactId: string;
      email: string;
      source: string;
      tags?: string[];
    };
  };
  'contact/tag.added': {
    data: {
      contactId: string;
      tag: string;
      userId: string;
    };
  };
  'contact/tag.removed': {
    data: {
      contactId: string;
      tag: string;
      userId: string;
    };
  };

  // Email 模块事件
  'email/send': {
    data: {
      to: string;
      subject: string;
      templateId?: string;
      html?: string;
      contactId?: string;
      campaignId?: string;
      variables?: Record<string, string>;
    };
  };
  'email/opened': {
    data: {
      emailLogId: string;
      contactId: string;
    };
  };
  'email/clicked': {
    data: {
      emailLogId: string;
      contactId: string;
      url: string;
    };
  };

  // Automation 模块事件
  'automation/trigger': {
    data: {
      automationId: string;
      contactId: string;
      triggerType: 'form_submission' | 'contact_created' | 'tag_added' | 'manual' | 'page_visit' | 'scheduled';
      triggerData?: Record<string, unknown>;
    };
  };

  // Phase 2: 页面访问触发
  'contact/page.visited': {
    data: {
      contactId: string;
      pageUrl: string;
      pageTitle?: string;
      userId: string;
      visitedAt: string;
      referrer?: string;
    };
  };

  // Phase 2: 定时触发
  'automation/scheduled.check': {
    data: {
      timestamp: string;
    };
  };
  'automation/step.execute': {
    data: {
      enrollmentId: string;
      stepIndex: number;
    };
  };

  // Lead Search 模块事件
  'lead-search/domain': {
    data: {
      domain: string;
      userId: string;
      provider?: 'hunter' | 'apollo';
    };
  };
  'lead-search/enrich': {
    data: {
      contactId: string;
      email: string;
    };
  };

  // Campaign 模块事件
  'campaign/send': {
    data: {
      campaignId: string;
      userId: string;
    };
  };

  // Webhook 模块事件 (未来扩展)
  'webhook/call': {
    data: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: unknown;
    };
  };

  // Workflow 模块事件 (DAG 工作流)
  'workflow/execute': {
    data: {
      workflowId: string;
      userId: string;
      contactId?: string;
      triggerData?: Record<string, unknown>;
    };
  };
  'workflow/approval-required': {
    data: {
      runId: string;
      nodeId: string;
      message: string;
      options?: Array<{ label: string; value: string }>;
      timeout?: string;
    };
  };
  'workflow/approval-response': {
    data: {
      runId: string;
      approved: boolean;
      response?: string;
      userId: string;
    };
  };
  'workflow/foreach': {
    data: {
      runId: string;
      nodeId: string;
      items: unknown[];
      bodyNodeIds: string[];
      concurrency?: number;
      userId: string;
      contactId?: string;
      workflow: unknown;
      stepsData: Record<string, Record<string, unknown>>;
    };
  };
};

// ============================================
// Inngest Client
// ============================================

export const inngest = new Inngest({
  id: 'dao123',
  schemas: new EventSchemas().fromRecord<Events>(),
});

// 导出类型供其他模块使用
export type InngestEvents = Events;
