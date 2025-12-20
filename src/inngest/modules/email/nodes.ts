import { z } from 'zod';
import type { NodeDefinition, NodeContext, NodeResult } from '../../core/types';
import { sendEmail } from '@/lib/mail/sender';
import { createClient } from '@/lib/supabase/server';

// ============================================
// Email 模块节点定义
// ============================================

// --- Send Email Node ---

const sendEmailInputSchema = z.object({
  to: z.string().email().optional().describe('收件人邮箱，不填则使用 context 中的联系人邮箱'),
  subject: z.string().describe('邮件主题'),
  templateId: z.string().uuid().optional().describe('邮件模板 ID'),
  html: z.string().optional().describe('邮件 HTML 内容（与 templateId 二选一）'),
  variables: z.record(z.string()).optional().describe('模板变量替换'),
  trackOpens: z.boolean().default(true).describe('是否追踪打开'),
  trackClicks: z.boolean().default(true).describe('是否追踪点击'),
});

type SendEmailInput = z.infer<typeof sendEmailInputSchema>;

export const sendEmailNode: NodeDefinition<SendEmailInput> = {
  meta: {
    id: 'email.send',
    name: '发送邮件',
    description: '发送邮件给联系人。支持模板或自定义 HTML 内容，自动追踪打开和点击。',
    category: 'action',
    module: 'email',
    icon: 'Mail',
    color: '#3b82f6',
    inputSchema: sendEmailInputSchema,
    outputDescription: '返回 messageId 和发送状态',
    examples: [
      {
        name: '使用模板发送',
        config: {
          subject: '欢迎加入我们！',
          templateId: 'template-uuid-here',
          variables: { first_name: '{{contact.first_name}}' },
        },
      },
      {
        name: '自定义内容发送',
        config: {
          subject: '您有一条新消息',
          html: '<h1>Hello!</h1><p>感谢您的关注。</p>',
        },
      },
    ],
  },

  async execute(input: SendEmailInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();

    // 获取收件人邮箱
    let toEmail = input.to;
    if (!toEmail && context.contactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('email, first_name, last_name')
        .eq('id', context.contactId)
        .single();

      if (!contact?.email) {
        return { success: false, error: 'Contact has no email address' };
      }
      toEmail = contact.email;
    }

    if (!toEmail) {
      return { success: false, error: 'No recipient email specified' };
    }

    // 获取模板内容
    let html = input.html || '';
    let subject = input.subject;

    if (input.templateId) {
      const { data: template } = await supabase
        .from('templates')
        .select('name, content_html')
        .eq('id', input.templateId)
        .single();

      if (template) {
        html = template.content_html || '';
        subject = subject || template.name;
      }
    }

    // 变量替换
    if (input.variables) {
      Object.entries(input.variables).forEach(([key, value]) => {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
    }

    // 发送邮件
    const result = await sendEmail({
      to: toEmail,
      subject,
      html,
      contactId: context.contactId,
      trackOpens: input.trackOpens,
      trackClicks: input.trackClicks,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: { messageId: result.messageId },
      output: { messageId: result.messageId, sentTo: toEmail },
    };
  },
};

// --- Add Tag Node ---

const addTagInputSchema = z.object({
  tag: z.string().min(1).describe('要添加的标签名称'),
  contactId: z.string().uuid().optional().describe('联系人 ID，不填则使用 context 中的'),
});

type AddTagInput = z.infer<typeof addTagInputSchema>;

export const addTagNode: NodeDefinition<AddTagInput> = {
  meta: {
    id: 'contact.addTag',
    name: '添加标签',
    description: '为联系人添加标签。如果标签已存在则跳过。',
    category: 'action',
    module: 'email',
    icon: 'Tag',
    color: '#10b981',
    inputSchema: addTagInputSchema,
    examples: [
      { name: '添加单个标签', config: { tag: 'engaged' } },
    ],
  },

  async execute(input: AddTagInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();
    const contactId = input.contactId || context.contactId;

    if (!contactId) {
      return { success: false, error: 'No contact ID specified' };
    }

    // 获取当前标签
    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', contactId)
      .single();

    const currentTags: string[] = contact?.tags || [];

    if (currentTags.includes(input.tag)) {
      return {
        success: true,
        data: { skipped: true, reason: 'Tag already exists' },
        output: { tags: currentTags },
      };
    }

    // 添加标签
    const newTags = [...currentTags, input.tag];
    const { error } = await supabase
      .from('contacts')
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq('id', contactId);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { added: input.tag },
      output: { tags: newTags },
    };
  },
};

// --- Remove Tag Node ---

const removeTagInputSchema = z.object({
  tag: z.string().min(1).describe('要移除的标签名称'),
  contactId: z.string().uuid().optional().describe('联系人 ID'),
});

type RemoveTagInput = z.infer<typeof removeTagInputSchema>;

export const removeTagNode: NodeDefinition<RemoveTagInput> = {
  meta: {
    id: 'contact.removeTag',
    name: '移除标签',
    description: '移除联系人的标签。如果标签不存在则跳过。',
    category: 'action',
    module: 'email',
    icon: 'TagOff',
    color: '#ef4444',
    inputSchema: removeTagInputSchema,
    examples: [
      { name: '移除标签', config: { tag: 'new_lead' } },
    ],
  },

  async execute(input: RemoveTagInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();
    const contactId = input.contactId || context.contactId;

    if (!contactId) {
      return { success: false, error: 'No contact ID specified' };
    }

    const { data: contact } = await supabase
      .from('contacts')
      .select('tags')
      .eq('id', contactId)
      .single();

    const currentTags: string[] = contact?.tags || [];
    const newTags = currentTags.filter((t) => t !== input.tag);

    if (currentTags.length === newTags.length) {
      return {
        success: true,
        data: { skipped: true, reason: 'Tag not found' },
        output: { tags: currentTags },
      };
    }

    const { error } = await supabase
      .from('contacts')
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq('id', contactId);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: { removed: input.tag },
      output: { tags: newTags },
    };
  },
};

// --- 导出所有节点 ---

export const emailNodes = [sendEmailNode, addTagNode, removeTagNode];
