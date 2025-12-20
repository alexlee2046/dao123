/**
 * Pre-built Automation Templates
 *
 * These templates provide ready-to-use automation sequences
 * that can be customized by users.
 */

import type { TriggerType, AutomationStep } from '@/lib/actions/automations';
import { nanoid } from 'nanoid';

export interface AutomationTemplate {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: 'onboarding' | 'nurturing' | 'engagement' | 'retention' | 'sales';
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  steps: AutomationStep[];
  tags: string[];
}

/**
 * Generate unique step IDs for a template
 */
function generateStepIds(steps: Omit<AutomationStep, 'id'>[]): AutomationStep[] {
  return steps.map((step, index) => ({
    ...step,
    id: `step-${nanoid(8)}`,
    order: index,
  }));
}

/**
 * Welcome Sequence Template
 * Best for: New user onboarding
 */
export const welcomeSequenceTemplate: AutomationTemplate = {
  id: 'template-welcome-sequence',
  name: '新用户欢迎序列',
  nameEn: 'Welcome Sequence',
  description: '通过一系列邮件帮助新用户了解产品，提高激活率和留存率',
  descriptionEn: 'Help new users understand your product through a series of emails to improve activation and retention',
  category: 'onboarding',
  trigger_type: 'contact_created',
  trigger_config: {},
  steps: generateStepIds([
    {
      type: 'add_tag',
      config: { tag: 'onboarding-started' },
      order: 0,
    },
    {
      type: 'send_email',
      config: {
        subject: '欢迎加入！这是您的快速入门指南',
        content: `<h2>欢迎加入我们！</h2>
<p>感谢您的注册。我们很高兴您成为我们社区的一员。</p>
<p>接下来的几天，我们会发送一些邮件帮助您快速上手：</p>
<ul>
  <li>产品核心功能介绍</li>
  <li>使用技巧和最佳实践</li>
  <li>成功案例分享</li>
</ul>
<p><a href="{{login_url}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">立即开始</a></p>`,
        preheader: '欢迎加入！一分钟快速上手',
      },
      order: 1,
    },
    {
      type: 'wait',
      config: { duration: 1, unit: 'days' },
      order: 2,
    },
    {
      type: 'send_email',
      config: {
        subject: '3个让您事半功倍的核心功能',
        content: `<h2>发现核心功能</h2>
<p>今天让我们来看看最受欢迎的三个功能：</p>
<h3>1. [功能一名称]</h3>
<p>[功能一描述和使用场景]</p>
<h3>2. [功能二名称]</h3>
<p>[功能二描述和使用场景]</p>
<h3>3. [功能三名称]</h3>
<p>[功能三描述和使用场景]</p>
<p><a href="{{features_url}}">查看所有功能 →</a></p>`,
      },
      order: 3,
    },
    {
      type: 'wait',
      config: { duration: 2, unit: 'days' },
      order: 4,
    },
    {
      type: 'send_email',
      config: {
        subject: '看看其他用户是怎么使用的',
        content: `<h2>成功案例</h2>
<p>让我们看看其他用户是如何使用我们的产品取得成功的：</p>
<blockquote>
  <p>"[客户评价引用]"</p>
  <cite>— [客户名称], [公司名称]</cite>
</blockquote>
<p><a href="{{case_studies_url}}">阅读更多案例 →</a></p>`,
      },
      order: 5,
    },
    {
      type: 'wait',
      config: { duration: 2, unit: 'days' },
      order: 6,
    },
    {
      type: 'send_email',
      config: {
        subject: '需要帮助吗？我们随时为您服务',
        content: `<h2>我们在这里帮助您</h2>
<p>如果您在使用过程中遇到任何问题，请随时联系我们：</p>
<ul>
  <li>📚 <a href="{{help_center_url}}">帮助中心</a> - 常见问题解答</li>
  <li>💬 <a href="{{chat_url}}">在线客服</a> - 实时支持</li>
  <li>📧 <a href="mailto:support@example.com">邮件支持</a> - 详细咨询</li>
</ul>
<p>祝您使用愉快！</p>`,
      },
      order: 7,
    },
    {
      type: 'add_tag',
      config: { tag: 'onboarding-completed' },
      order: 8,
    },
  ]),
  tags: ['onboarding', 'welcome', 'new-users'],
};

/**
 * Lead Nurturing Template
 * Best for: Converting leads to customers
 */
export const leadNurturingTemplate: AutomationTemplate = {
  id: 'template-lead-nurturing',
  name: '潜客培育序列',
  nameEn: 'Lead Nurturing Sequence',
  description: '通过价值内容培育潜在客户，引导他们预约演示或开始试用',
  descriptionEn: 'Nurture leads with valuable content and guide them to book a demo or start a trial',
  category: 'nurturing',
  trigger_type: 'form_submission',
  trigger_config: {},
  steps: generateStepIds([
    {
      type: 'add_tag',
      config: { tag: 'lead-nurturing' },
      order: 0,
    },
    {
      type: 'send_email',
      config: {
        subject: '感谢您的关注！这里有一份礼物',
        content: `<h2>感谢您的关注</h2>
<p>您刚刚下载/请求的资源已准备好：</p>
<p><a href="{{resource_url}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">下载资源</a></p>
<p>希望这份资源对您有所帮助。接下来几天，我们会分享更多相关内容。</p>`,
      },
      order: 1,
    },
    {
      type: 'wait',
      config: { duration: 2, unit: 'days' },
      order: 2,
    },
    {
      type: 'send_email',
      config: {
        subject: '[行业洞察] 您可能感兴趣的趋势',
        content: `<h2>行业洞察</h2>
<p>[分享行业趋势和见解，建立专业权威]</p>
<p><a href="{{blog_url}}">阅读更多洞察 →</a></p>`,
      },
      order: 3,
    },
    {
      type: 'wait',
      config: { duration: 3, unit: 'days' },
      order: 4,
    },
    {
      type: 'send_email',
      config: {
        subject: '这个方案帮客户节省了50%的时间',
        content: `<h2>客户成功案例</h2>
<p>[详细的客户案例，包括挑战、解决方案和成果]</p>
<p><a href="{{case_study_url}}">查看完整案例 →</a></p>`,
      },
      order: 5,
    },
    {
      type: 'wait',
      config: { duration: 3, unit: 'days' },
      order: 6,
    },
    {
      type: 'send_email',
      config: {
        subject: '想看看实际效果吗？',
        content: `<h2>预约产品演示</h2>
<p>我们的产品专家可以为您展示如何解决您的具体需求。</p>
<p>预约一次 15 分钟的演示：</p>
<p><a href="{{demo_url}}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">预约演示</a></p>`,
      },
      order: 7,
    },
    {
      type: 'add_tag',
      config: { tag: 'nurturing-completed' },
      order: 8,
    },
  ]),
  tags: ['nurturing', 'leads', 'conversion'],
};

/**
 * Re-engagement Template
 * Best for: Winning back inactive users
 */
export const reengagementTemplate: AutomationTemplate = {
  id: 'template-reengagement',
  name: '用户唤醒序列',
  nameEn: 'Re-engagement Sequence',
  description: '重新激活不活跃用户，提供特别优惠吸引他们回来',
  descriptionEn: 'Re-activate inactive users with special offers to bring them back',
  category: 'retention',
  trigger_type: 'tag_added',
  trigger_config: { tag: 'inactive-30-days' },
  steps: generateStepIds([
    {
      type: 'send_email',
      config: {
        subject: '我们想念您！',
        content: `<h2>好久不见</h2>
<p>我们注意到您最近没有使用我们的服务。一切都还好吗？</p>
<p>如果您遇到任何问题，我们随时愿意帮助。</p>
<p><a href="{{login_url}}">回来看看 →</a></p>`,
      },
      order: 0,
    },
    {
      type: 'wait',
      config: { duration: 3, unit: 'days' },
      order: 1,
    },
    {
      type: 'send_email',
      config: {
        subject: '您错过的新功能',
        content: `<h2>看看有什么新变化</h2>
<p>自您上次访问以来，我们添加了一些令人兴奋的新功能：</p>
<ul>
  <li>[新功能1]</li>
  <li>[新功能2]</li>
  <li>[新功能3]</li>
</ul>
<p><a href="{{whats_new_url}}">查看所有更新 →</a></p>`,
      },
      order: 2,
    },
    {
      type: 'wait',
      config: { duration: 4, unit: 'days' },
      order: 3,
    },
    {
      type: 'send_email',
      config: {
        subject: '专属优惠：限时20%折扣',
        content: `<h2>特别为您准备</h2>
<p>作为老用户，我们为您准备了一份特别优惠：</p>
<p style="font-size: 24px; font-weight: bold; color: #e74c3c;">20% 折扣</p>
<p>使用优惠码：<strong>COMEBACK20</strong></p>
<p>优惠有效期至 [日期]</p>
<p><a href="{{upgrade_url}}" style="display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">立即使用</a></p>`,
      },
      order: 4,
    },
    {
      type: 'add_tag',
      config: { tag: 'reengagement-sent' },
      order: 5,
    },
  ]),
  tags: ['retention', 'reengagement', 'win-back'],
};

/**
 * Post-Purchase Template
 * Best for: Customer success and upselling
 */
export const postPurchaseTemplate: AutomationTemplate = {
  id: 'template-post-purchase',
  name: '购买后跟进序列',
  nameEn: 'Post-Purchase Sequence',
  description: '帮助新客户成功使用产品，并适时推荐升级方案',
  descriptionEn: 'Help new customers succeed with the product and recommend upgrades at the right time',
  category: 'engagement',
  trigger_type: 'tag_added',
  trigger_config: { tag: 'customer' },
  steps: generateStepIds([
    {
      type: 'send_email',
      config: {
        subject: '感谢您的购买！开始使用指南',
        content: `<h2>欢迎成为我们的客户！</h2>
<p>感谢您的信任。这里有一份快速入门指南帮助您开始：</p>
<ol>
  <li>完成账户设置</li>
  <li>观看入门视频教程</li>
  <li>尝试核心功能</li>
</ol>
<p><a href="{{getting_started_url}}">查看完整指南 →</a></p>`,
      },
      order: 0,
    },
    {
      type: 'wait',
      config: { duration: 3, unit: 'days' },
      order: 1,
    },
    {
      type: 'send_email',
      config: {
        subject: '使用得怎么样？',
        content: `<h2>我们想听听您的体验</h2>
<p>您已经使用我们的产品几天了。一切顺利吗？</p>
<p>如果您有任何问题或建议，请随时告诉我们。</p>
<p><a href="{{feedback_url}}">分享反馈 →</a></p>`,
      },
      order: 2,
    },
    {
      type: 'wait',
      config: { duration: 7, unit: 'days' },
      order: 3,
    },
    {
      type: 'send_email',
      config: {
        subject: '进阶技巧：让您的使用更高效',
        content: `<h2>高级使用技巧</h2>
<p>现在您已经熟悉了基础功能，来看看一些进阶技巧：</p>
<ul>
  <li>[技巧1]</li>
  <li>[技巧2]</li>
  <li>[技巧3]</li>
</ul>
<p><a href="{{tips_url}}">更多技巧 →</a></p>`,
      },
      order: 4,
    },
    {
      type: 'add_tag',
      config: { tag: 'post-purchase-completed' },
      order: 5,
    },
  ]),
  tags: ['engagement', 'customer-success', 'post-purchase'],
};

/**
 * All available templates
 */
export const automationTemplates: AutomationTemplate[] = [
  welcomeSequenceTemplate,
  leadNurturingTemplate,
  reengagementTemplate,
  postPurchaseTemplate,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): AutomationTemplate | undefined {
  return automationTemplates.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: AutomationTemplate['category']): AutomationTemplate[] {
  return automationTemplates.filter(t => t.category === category);
}

/**
 * Clone a template with new step IDs
 */
export function cloneTemplate(template: AutomationTemplate): {
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  steps: AutomationStep[];
} {
  return {
    name: template.name,
    trigger_type: template.trigger_type,
    trigger_config: { ...template.trigger_config },
    steps: generateStepIds(
      template.steps.map(step => ({
        type: step.type,
        config: { ...step.config },
        order: step.order,
      }))
    ),
  };
}
