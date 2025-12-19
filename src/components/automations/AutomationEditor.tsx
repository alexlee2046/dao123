'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Zap,
  Plus,
  Trash2,
  GripVertical,
  Mail,
  Clock,
  Tag,
  ArrowDown,
  Save,
  Play,
  FileText,
  Users,
  GitBranch,
  Split,
  Eye,
  MousePointerClick,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  createAutomation,
  updateAutomation,
  type Automation,
} from '@/lib/actions/automations';
import type { AutomationStep, TriggerType, ConditionType, ConditionConfig, SplitConfig } from '@/lib/automation/engine';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface AutomationEditorProps {
  automation?: Automation;
  templates?: { id: string; name: string }[];
  forms?: { id: string; name: string }[];
}

const triggerOptions: { value: TriggerType; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'form_submission',
    label: '表单提交',
    description: '当访客提交指定表单时触发',
    icon: FileText,
  },
  {
    value: 'contact_created',
    label: '新建联系人',
    description: '当新联系人被创建时触发',
    icon: Users,
  },
  {
    value: 'tag_added',
    label: '添加标签',
    description: '当联系人被添加特定标签时触发',
    icon: Tag,
  },
  {
    value: 'manual',
    label: '手动触发',
    description: '手动选择联系人触发',
    icon: Zap,
  },
];

const stepTypeOptions = [
  { value: 'send_email', label: '发送邮件', icon: Mail },
  { value: 'wait', label: '等待', icon: Clock },
  { value: 'add_tag', label: '添加标签', icon: Tag },
  { value: 'remove_tag', label: '移除标签', icon: Tag },
  { value: 'condition', label: '条件分支', icon: GitBranch },
  { value: 'split', label: 'A/B 测试', icon: Split },
];

const conditionTypeOptions: { value: ConditionType; label: string; icon: React.ElementType }[] = [
  { value: 'email_opened', label: '邮件已打开', icon: Eye },
  { value: 'email_clicked', label: '邮件已点击', icon: MousePointerClick },
  { value: 'tag_exists', label: '标签存在', icon: Tag },
  { value: 'field_equals', label: '字段等于', icon: FileText },
];

function StepCard({
  step,
  index,
  onUpdate,
  onDelete,
  templates,
}: {
  step: AutomationStep;
  index: number;
  onUpdate: (step: AutomationStep) => void;
  onDelete: () => void;
  templates?: { id: string; name: string }[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState(step.config);

  const getStepIcon = () => {
    switch (step.type) {
      case 'send_email': return <Mail className="h-4 w-4" />;
      case 'wait': return <Clock className="h-4 w-4" />;
      case 'add_tag': return <Tag className="h-4 w-4 text-green-500" />;
      case 'remove_tag': return <Tag className="h-4 w-4 text-red-500" />;
      case 'condition': return <GitBranch className="h-4 w-4 text-blue-500" />;
      case 'split': return <Split className="h-4 w-4 text-purple-500" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getStepSummary = () => {
    switch (step.type) {
      case 'send_email':
        const emailConfig = step.config as any;
        const template = templates?.find(t => t.id === emailConfig.templateId);
        return template?.name || emailConfig.subject || '发送邮件';
      case 'wait':
        const waitConfig = step.config as any;
        const unitLabels: Record<string, string> = { minutes: '分钟', hours: '小时', days: '天' };
        return `等待 ${waitConfig.duration} ${unitLabels[waitConfig.unit] || waitConfig.unit}`;
      case 'add_tag':
        return `添加标签: ${(step.config as any).tag}`;
      case 'remove_tag':
        return `移除标签: ${(step.config as any).tag}`;
      case 'condition':
        const condConfig = step.config as ConditionConfig;
        const condOption = conditionTypeOptions.find(c => c.value === condConfig.conditionType);
        return `条件: ${condOption?.label || condConfig.conditionType}`;
      case 'split':
        const splitConfig = step.config as SplitConfig;
        return `A/B 测试 (${splitConfig.variants?.length || 0} 个变体)`;
      default:
        return '未知步骤';
    }
  };

  const handleSave = () => {
    onUpdate({ ...step, config: editedConfig });
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-card border rounded-lg group">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripVertical className="h-4 w-4 cursor-grab" />
          <span className="text-sm font-medium w-6">{index + 1}</span>
        </div>

        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {getStepIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{getStepSummary()}</p>
        </div>

        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            编辑
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑步骤</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {step.type === 'send_email' && (
              <>
                <div className="space-y-2">
                  <Label>选择模板</Label>
                  <Select
                    value={(editedConfig as any).templateId || ''}
                    onValueChange={(value) => setEditedConfig({ ...editedConfig, templateId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择邮件模板" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates?.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>邮件主题（可选，覆盖模板）</Label>
                  <Input
                    value={(editedConfig as any).subject || ''}
                    onChange={(e) => setEditedConfig({ ...editedConfig, subject: e.target.value })}
                    placeholder="留空使用模板主题"
                  />
                </div>
              </>
            )}

            {step.type === 'wait' && (
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label>等待时间</Label>
                  <Input
                    type="number"
                    min="1"
                    value={(editedConfig as any).duration || 1}
                    onChange={(e) => setEditedConfig({ ...editedConfig, duration: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label>单位</Label>
                  <Select
                    value={(editedConfig as any).unit || 'hours'}
                    onValueChange={(value) => setEditedConfig({ ...editedConfig, unit: value as 'minutes' | 'hours' | 'days' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">分钟</SelectItem>
                      <SelectItem value="hours">小时</SelectItem>
                      <SelectItem value="days">天</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {(step.type === 'add_tag' || step.type === 'remove_tag') && (
              <div className="space-y-2">
                <Label>标签名称</Label>
                <Input
                  value={(editedConfig as any).tag || ''}
                  onChange={(e) => setEditedConfig({ ...editedConfig, tag: e.target.value })}
                  placeholder="输入标签名称"
                />
              </div>
            )}

            {step.type === 'condition' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>条件类型</Label>
                  <Select
                    value={(editedConfig as ConditionConfig).conditionType || 'email_opened'}
                    onValueChange={(value) => setEditedConfig({
                      ...editedConfig,
                      conditionType: value as ConditionType,
                      params: (editedConfig as ConditionConfig).params || {}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择条件类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {((editedConfig as ConditionConfig).conditionType === 'email_opened' ||
                  (editedConfig as ConditionConfig).conditionType === 'email_clicked') && (
                  <div className="space-y-2">
                    <Label>检查哪个邮件步骤</Label>
                    <Input
                      value={(editedConfig as ConditionConfig).params?.emailStepId || ''}
                      onChange={(e) => setEditedConfig({
                        ...editedConfig,
                        params: { ...(editedConfig as ConditionConfig).params, emailStepId: e.target.value }
                      })}
                      placeholder="输入邮件步骤ID"
                    />
                    <p className="text-xs text-muted-foreground">
                      留空则检查序列中的上一封邮件
                    </p>
                  </div>
                )}

                {(editedConfig as ConditionConfig).conditionType === 'tag_exists' && (
                  <div className="space-y-2">
                    <Label>检查标签</Label>
                    <Input
                      value={(editedConfig as ConditionConfig).params?.tag || ''}
                      onChange={(e) => setEditedConfig({
                        ...editedConfig,
                        params: { ...(editedConfig as ConditionConfig).params, tag: e.target.value }
                      })}
                      placeholder="输入标签名称"
                    />
                  </div>
                )}

                {(editedConfig as ConditionConfig).conditionType === 'field_equals' && (
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label>字段名</Label>
                      <Input
                        value={(editedConfig as ConditionConfig).params?.field || ''}
                        onChange={(e) => setEditedConfig({
                          ...editedConfig,
                          params: { ...(editedConfig as ConditionConfig).params, field: e.target.value }
                        })}
                        placeholder="如: country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>等于值</Label>
                      <Input
                        value={(editedConfig as ConditionConfig).params?.value || ''}
                        onChange={(e) => setEditedConfig({
                          ...editedConfig,
                          params: { ...(editedConfig as ConditionConfig).params, value: e.target.value }
                        })}
                        placeholder="如: China"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium mb-1">分支说明</p>
                  <p>• 条件为真: 执行 trueBranch 中的步骤</p>
                  <p>• 条件为假: 执行 falseBranch 中的步骤</p>
                  <p className="mt-2 text-xs">分支步骤需在保存后通过 API 配置</p>
                </div>
              </div>
            )}

            {step.type === 'split' && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-sm font-medium text-purple-600 mb-1">A/B 测试配置</p>
                  <p className="text-xs text-muted-foreground">
                    配置多个变体，系统会按百分比随机分配联系人
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>变体数量: {(editedConfig as SplitConfig).variants?.length || 2}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const variants = (editedConfig as SplitConfig).variants || [];
                        if (variants.length < 4) {
                          setEditedConfig({
                            ...editedConfig,
                            variants: [
                              ...variants,
                              { id: nanoid(), name: `变体 ${String.fromCharCode(65 + variants.length)}`, percentage: 0, steps: [] }
                            ]
                          });
                        }
                      }}
                    >
                      添加变体
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const variants = (editedConfig as SplitConfig).variants || [];
                        if (variants.length > 2) {
                          setEditedConfig({
                            ...editedConfig,
                            variants: variants.slice(0, -1)
                          });
                        }
                      }}
                    >
                      移除变体
                    </Button>
                  </div>
                </div>

                {((editedConfig as SplitConfig).variants || []).map((variant, idx) => (
                  <div key={variant.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="flex-1">
                      <Input
                        value={variant.name}
                        onChange={(e) => {
                          const variants = [...((editedConfig as SplitConfig).variants || [])];
                          variants[idx] = { ...variants[idx], name: e.target.value };
                          setEditedConfig({ ...editedConfig, variants });
                        }}
                        placeholder={`变体 ${String.fromCharCode(65 + idx)}`}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={variant.percentage}
                        onChange={(e) => {
                          const variants = [...((editedConfig as SplitConfig).variants || [])];
                          variants[idx] = { ...variants[idx], percentage: parseInt(e.target.value) || 0 };
                          setEditedConfig({ ...editedConfig, variants });
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                ))}

                <p className="text-xs text-muted-foreground">
                  百分比总和应为 100%。每个变体的步骤需在保存后通过 API 配置。
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AutomationEditor({
  automation,
  templates = [],
  forms = [],
}: AutomationEditorProps) {
  const router = useRouter();
  const isEditing = !!automation;

  const [name, setName] = useState(automation?.name || '');
  const [triggerType, setTriggerType] = useState<TriggerType>(automation?.trigger_type || 'form_submission');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>(automation?.trigger_config || {});
  const [steps, setSteps] = useState<AutomationStep[]>(automation?.steps || []);
  const [isActive, setIsActive] = useState(automation?.is_active || false);
  const [saving, setSaving] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);

  // AI generation state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProductDescription, setAiProductDescription] = useState('');
  const [aiTargetAudience, setAiTargetAudience] = useState('');
  const [aiSequenceLength, setAiSequenceLength] = useState(5);
  const [aiTone, setAiTone] = useState('professional');

  const handleAddStep = (type: string) => {
    let config: any = {};

    switch (type) {
      case 'wait':
        config = { duration: 1, unit: 'days' };
        break;
      case 'condition':
        config = {
          conditionType: 'email_opened',
          params: {},
          trueBranch: [],
          falseBranch: []
        };
        break;
      case 'split':
        config = {
          variants: [
            { id: nanoid(), name: '变体 A', percentage: 50, steps: [] },
            { id: nanoid(), name: '变体 B', percentage: 50, steps: [] }
          ]
        };
        break;
      default:
        config = {};
    }

    const newStep: AutomationStep = {
      id: nanoid(),
      type: type as any,
      order: steps.length,
      config,
    };
    setSteps([...steps, newStep]);
    setShowAddStep(false);
  };

  const handleUpdateStep = (index: number, step: AutomationStep) => {
    const newSteps = [...steps];
    newSteps[index] = step;
    setSteps(newSteps);
  };

  const handleDeleteStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('请输入自动化名称');
      return;
    }

    if (steps.length === 0) {
      toast.error('请至少添加一个步骤');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateAutomation(automation.id, {
          name,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          steps,
          is_active: isActive,
        });
        toast.success('自动化已更新');
      } else {
        const newAutomation = await createAutomation({
          name,
          trigger_type: triggerType,
          trigger_config: triggerConfig,
          steps,
          is_active: isActive,
        });
        toast.success('自动化已创建');
        router.push(`/mail/automations/${newAutomation.id}`);
      }
    } catch (error) {
      toast.error(isEditing ? '更新失败' : '创建失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiProductDescription.trim()) {
      toast.error('请输入产品描述');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await fetch('/api/ai/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: aiProductDescription,
          targetAudience: aiTargetAudience,
          sequenceLength: aiSequenceLength,
          tone: aiTone,
          language: 'zh',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI 生成失败');
      }

      if (data.success && data.sequence) {
        // Set name if empty
        if (!name) {
          setName(data.sequence.name);
        }
        // Replace steps with generated ones
        setSteps(data.sequence.steps);
        toast.success(`已生成 ${data.sequence.steps.length} 个步骤`);
        setShowAIDialog(false);
        // Reset form
        setAiProductDescription('');
        setAiTargetAudience('');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'AI 生成失败');
    } finally {
      setAiGenerating(false);
    }
  };

  const selectedTrigger = triggerOptions.find(t => t.value === triggerType);

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>自动化名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：新用户欢迎序列"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>启用状态</Label>
              <p className="text-sm text-muted-foreground">
                启用后，符合条件的联系人将自动进入此流程
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      {/* Trigger */}
      <Card>
        <CardHeader>
          <CardTitle>触发条件</CardTitle>
          <CardDescription>选择何时触发此自动化</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {triggerOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTriggerType(option.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  triggerType === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <option.icon className="h-5 w-5" />
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>

          {/* Trigger-specific config */}
          {triggerType === 'form_submission' && forms.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label>选择表单</Label>
              <Select
                value={triggerConfig.formId || ''}
                onValueChange={(value) => setTriggerConfig({ ...triggerConfig, formId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择触发的表单" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {triggerType === 'tag_added' && (
            <div className="space-y-2 pt-4 border-t">
              <Label>触发标签</Label>
              <Input
                value={triggerConfig.tag || ''}
                onChange={(e) => setTriggerConfig({ ...triggerConfig, tag: e.target.value })}
                placeholder="输入标签名称"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      <Card>
        <CardHeader>
          <CardTitle>自动化步骤</CardTitle>
          <CardDescription>配置触发后要执行的动作序列</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Trigger indicator */}
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            {selectedTrigger && <selectedTrigger.icon className="h-4 w-4 text-primary" />}
            <span className="text-sm font-medium text-primary">
              {selectedTrigger?.label || '触发'}
            </span>
          </div>

          {steps.length > 0 && (
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Steps list */}
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step.id}>
                <StepCard
                  step={step}
                  index={index}
                  onUpdate={(s) => handleUpdateStep(index, s)}
                  onDelete={() => handleDeleteStep(index)}
                  templates={templates}
                />
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add step buttons */}
          <div className="pt-4 flex gap-3">
            <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
              <Button
                variant="outline"
                className="flex-1 border-dashed"
                onClick={() => setShowAddStep(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加步骤
              </Button>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加步骤</DialogTitle>
                  <DialogDescription>选择要添加的动作类型</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 py-4">
                  {stepTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleAddStep(option.value)}
                      className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <option.icon className="h-5 w-5" />
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
              <Button
                variant="outline"
                className="border-dashed bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-violet-500/30 hover:border-violet-500/50"
                onClick={() => setShowAIDialog(true)}
              >
                <Sparkles className="h-4 w-4 mr-2 text-violet-500" />
                AI 生成
              </Button>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-violet-500" />
                    AI 智能生成
                  </DialogTitle>
                  <DialogDescription>
                    描述您的产品或服务，AI 将为您生成完整的邮件自动化序列
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>产品/服务描述 *</Label>
                    <Textarea
                      value={aiProductDescription}
                      onChange={(e) => setAiProductDescription(e.target.value)}
                      placeholder="例如：一款帮助中小企业管理客户关系的 SaaS 软件，主要功能包括联系人管理、邮件营销和销售漏斗追踪..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>目标受众（可选）</Label>
                    <Input
                      value={aiTargetAudience}
                      onChange={(e) => setAiTargetAudience(e.target.value)}
                      placeholder="例如：25-45岁的创业者和中小企业主"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>邮件数量</Label>
                      <Select
                        value={String(aiSequenceLength)}
                        onValueChange={(v) => setAiSequenceLength(parseInt(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 封</SelectItem>
                          <SelectItem value="5">5 封</SelectItem>
                          <SelectItem value="7">7 封</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>语气风格</Label>
                      <Select value={aiTone} onValueChange={setAiTone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">专业正式</SelectItem>
                          <SelectItem value="friendly">友好亲切</SelectItem>
                          <SelectItem value="casual">轻松随意</SelectItem>
                          <SelectItem value="urgent">紧迫感</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {steps.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="text-sm text-amber-600">
                        注意：生成将覆盖现有的 {steps.length} 个步骤
                      </p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAIDialog(false)}
                    disabled={aiGenerating}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !aiProductDescription.trim()}
                    className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        生成序列
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          取消
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            '保存中...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? '保存更改' : '创建自动化'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
