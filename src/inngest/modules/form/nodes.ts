import { z } from 'zod';
import type { NodeDefinition, NodeContext, NodeResult } from '../../core/types';
import { createClient } from '@/lib/supabase/server';

// ============================================
// Form 模块节点定义
// ============================================

// --- Sync Contact Node ---

const syncContactInputSchema = z.object({
  email: z.string().email().describe('联系人邮箱'),
  firstName: z.string().optional().describe('名'),
  lastName: z.string().optional().describe('姓'),
  companyName: z.string().optional().describe('公司名'),
  phone: z.string().optional().describe('电话'),
  position: z.string().optional().describe('职位'),
  source: z.string().default('form').describe('来源'),
  tags: z.array(z.string()).optional().describe('初始标签'),
  customFields: z.record(z.unknown()).optional().describe('自定义字段'),
});

type SyncContactInput = z.infer<typeof syncContactInputSchema>;

export const syncContactNode: NodeDefinition<SyncContactInput> = {
  meta: {
    id: 'form.syncContact',
    name: '同步联系人',
    description: '根据邮箱创建或更新联系人。如果邮箱已存在则更新信息，否则创建新联系人。',
    category: 'action',
    module: 'form',
    icon: 'UserPlus',
    color: '#8b5cf6',
    inputSchema: syncContactInputSchema,
    outputDescription: '返回联系人 ID 和是否新创建',
    examples: [
      {
        name: '从表单同步',
        config: {
          email: '{{form.email}}',
          firstName: '{{form.first_name}}',
          lastName: '{{form.last_name}}',
          source: 'landing_page',
          tags: ['new_lead'],
        },
      },
    ],
  },

  async execute(input: SyncContactInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();

    // 检查是否存在
    const { data: existing } = await supabase
      .from('contacts')
      .select('id, tags')
      .eq('user_id', context.userId)
      .eq('email', input.email)
      .single();

    if (existing) {
      // 更新现有联系人
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (input.firstName) updateData.first_name = input.firstName;
      if (input.lastName) updateData.last_name = input.lastName;
      if (input.companyName) updateData.company_name = input.companyName;
      if (input.phone) updateData.phone = input.phone;
      if (input.position) updateData.position = input.position;

      // 合并标签
      if (input.tags && input.tags.length > 0) {
        const existingTags: string[] = existing.tags || [];
        const newTags = [...new Set([...existingTags, ...input.tags])];
        updateData.tags = newTags;
      }

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', existing.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: { contactId: existing.id, created: false },
        output: { contactId: existing.id, isNew: false },
      };
    }

    // 创建新联系人
    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert({
        user_id: context.userId,
        email: input.email,
        first_name: input.firstName || null,
        last_name: input.lastName || null,
        company_name: input.companyName || null,
        phone: input.phone || null,
        position: input.position || null,
        source: input.source,
        tags: input.tags || [],
      })
      .select('id')
      .single();

    if (error || !newContact) {
      return { success: false, error: error?.message || 'Failed to create contact' };
    }

    return {
      success: true,
      data: { contactId: newContact.id, created: true },
      output: { contactId: newContact.id, isNew: true },
    };
  },
};

// --- 导出所有节点 ---

export const formNodes = [syncContactNode];
