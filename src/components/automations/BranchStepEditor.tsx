'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  Trash2,
  ChevronDown,
  Mail,
  Clock,
  Tag,
  GitBranch,
  Split,
  Zap,
} from 'lucide-react';
import type { AutomationStep } from '@/lib/actions/automations';
import type { ConditionType, ConditionConfig, SplitConfig } from '@/lib/automation/engine';
import { nanoid } from 'nanoid';
import { cn } from '@/lib/utils';

// Step config type definitions
interface EmailStepConfig {
  templateId?: string;
  subject?: string;
}

interface WaitStepConfig {
  duration?: number;
  unit?: 'minutes' | 'hours' | 'days';
}

interface TagStepConfig {
  tag: string;
}

type StepConfig = EmailStepConfig | WaitStepConfig | TagStepConfig | ConditionConfig | SplitConfig | Record<string, unknown>;

interface BranchStepEditorProps {
  steps: AutomationStep[];
  onUpdate: (steps: AutomationStep[]) => void;
  branchLabel: string;
  branchColor: 'green' | 'red' | 'purple';
  templates?: { id: string; name: string }[];
  depth?: number;
  parentSteps?: AutomationStep[];
  maxDepth?: number;
}

const stepTypeOptions = [
  { value: 'send_email', label: '发送邮件', icon: Mail },
  { value: 'wait', label: '等待', icon: Clock },
  { value: 'add_tag', label: '添加标签', icon: Tag },
  { value: 'remove_tag', label: '移除标签', icon: Tag },
  { value: 'condition', label: '条件分支', icon: GitBranch },
  { value: 'split', label: 'A/B 测试', icon: Split },
];

const conditionTypeOptions: { value: ConditionType; label: string }[] = [
  { value: 'email_opened', label: '邮件已打开' },
  { value: 'email_clicked', label: '邮件已点击' },
  { value: 'tag_exists', label: '标签存在' },
  { value: 'field_equals', label: '字段等于' },
];

const borderColors = {
  green: 'border-l-green-500',
  red: 'border-l-red-500',
  purple: 'border-l-purple-500',
};

const bgColors = {
  green: 'bg-green-500/5',
  red: 'bg-red-500/5',
  purple: 'bg-purple-500/5',
};

export default function BranchStepEditor({
  steps,
  onUpdate,
  branchLabel,
  branchColor,
  templates = [],
  depth = 0,
  parentSteps = [],
  maxDepth = 2,
}: BranchStepEditorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showAddStep, setShowAddStep] = useState(false);
  const [editingStep, setEditingStep] = useState<{ index: number; step: AutomationStep } | null>(null);
  const [editedConfig, setEditedConfig] = useState<StepConfig>({});

  // Get all email steps for condition selection (parent + current branch)
  const allEmailSteps = [...parentSteps, ...steps].filter(s => s.type === 'send_email');

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'send_email': return <Mail className="h-3.5 w-3.5" />;
      case 'wait': return <Clock className="h-3.5 w-3.5" />;
      case 'add_tag': return <Tag className="h-3.5 w-3.5 text-green-500" />;
      case 'remove_tag': return <Tag className="h-3.5 w-3.5 text-red-500" />;
      case 'condition': return <GitBranch className="h-3.5 w-3.5 text-blue-500" />;
      case 'split': return <Split className="h-3.5 w-3.5 text-purple-500" />;
      default: return <Zap className="h-3.5 w-3.5" />;
    }
  };

  const getStepSummary = (step: AutomationStep) => {
    switch (step.type) {
      case 'send_email': {
        const emailConfig = step.config as EmailStepConfig;
        const template = templates.find(t => t.id === emailConfig.templateId);
        return template?.name || emailConfig.subject || '发送邮件';
      }
      case 'wait': {
        const waitConfig = step.config as WaitStepConfig;
        const unitLabels: Record<string, string> = { minutes: '分钟', hours: '小时', days: '天' };
        const unit = waitConfig.unit || 'hours';
        return `等待 ${waitConfig.duration || 1} ${unitLabels[unit] || unit}`;
      }
      case 'add_tag':
        return `添加标签: ${(step.config as TagStepConfig).tag}`;
      case 'remove_tag':
        return `移除标签: ${(step.config as TagStepConfig).tag}`;
      case 'condition': {
        const condConfig = step.config as ConditionConfig;
        const condOption = conditionTypeOptions.find(c => c.value === condConfig.conditionType);
        return `条件: ${condOption?.label || condConfig.conditionType}`;
      }
      case 'split': {
        const splitConfig = step.config as SplitConfig;
        return `A/B 测试 (${splitConfig.variants?.length || 0} 变体)`;
      }
      default:
        return '未知步骤';
    }
  };

  const handleAddStep = (type: string) => {
    let config: StepConfig = {};

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
      type: type as AutomationStep['type'],
      order: steps.length,
      config,
    };

    onUpdate([...steps, newStep]);
    setShowAddStep(false);
  };

  const handleDeleteStep = (index: number) => {
    onUpdate(steps.filter((_, i) => i !== index));
  };

  const handleEditStep = (index: number, step: AutomationStep) => {
    setEditingStep({ index, step });
    setEditedConfig(step.config);
  };

  const handleSaveStep = () => {
    if (!editingStep) return;
    const newSteps = [...steps];
    newSteps[editingStep.index] = { ...editingStep.step, config: editedConfig };
    onUpdate(newSteps);
    setEditingStep(null);
    setEditedConfig({});
  };

  const handleUpdateBranchSteps = (stepIndex: number, branch: 'trueBranch' | 'falseBranch', branchSteps: AutomationStep[]) => {
    const newSteps = [...steps];
    const config = newSteps[stepIndex].config as ConditionConfig;
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      config: { ...config, [branch]: branchSteps }
    };
    onUpdate(newSteps);
  };

  const handleUpdateVariantSteps = (stepIndex: number, variantId: string, variantSteps: AutomationStep[]) => {
    const newSteps = [...steps];
    const config = newSteps[stepIndex].config as SplitConfig;
    const newVariants = config.variants.map(v =>
      v.id === variantId ? { ...v, steps: variantSteps } : v
    );
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      config: { ...config, variants: newVariants }
    };
    onUpdate(newSteps);
  };

  const canAddBranching = depth < maxDepth;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className={cn(
          "w-full flex items-center gap-2 p-2 rounded-t-lg text-sm font-medium",
          "border-l-4 transition-colors hover:bg-accent/50",
          borderColors[branchColor],
          bgColors[branchColor]
        )}>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform",
            isOpen ? "" : "-rotate-90"
          )} />
          <span>{branchLabel}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {steps.length} 步骤
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className={cn(
        "border-l-4 rounded-b-lg",
        borderColors[branchColor],
        bgColors[branchColor]
      )}>
        <div className="p-3 space-y-2">
          {/* Steps list */}
          {steps.map((step, index) => (
            <div key={step.id}>
              {/* Step card */}
              <div className="flex items-center gap-2 p-2 bg-background border rounded text-sm group">
                <span className="text-muted-foreground text-xs w-4">{index + 1}</span>
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  {getStepIcon(step.type)}
                </div>
                <span className="flex-1 truncate">{getStepSummary(step)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => handleEditStep(index, step)}
                  >
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleDeleteStep(index)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Nested branches for condition steps */}
              {step.type === 'condition' && depth < maxDepth && (
                <div className="ml-4 mt-2 space-y-2">
                  <BranchStepEditor
                    steps={(step.config as ConditionConfig).trueBranch || []}
                    onUpdate={(newSteps) => handleUpdateBranchSteps(index, 'trueBranch', newSteps)}
                    branchLabel="条件为真"
                    branchColor="green"
                    templates={templates}
                    depth={depth + 1}
                    parentSteps={[...parentSteps, ...steps.slice(0, index)]}
                    maxDepth={maxDepth}
                  />
                  <BranchStepEditor
                    steps={(step.config as ConditionConfig).falseBranch || []}
                    onUpdate={(newSteps) => handleUpdateBranchSteps(index, 'falseBranch', newSteps)}
                    branchLabel="条件为假"
                    branchColor="red"
                    templates={templates}
                    depth={depth + 1}
                    parentSteps={[...parentSteps, ...steps.slice(0, index)]}
                    maxDepth={maxDepth}
                  />
                </div>
              )}

              {/* Nested variants for split steps */}
              {step.type === 'split' && depth < maxDepth && (
                <div className="ml-4 mt-2 space-y-2">
                  {(step.config as SplitConfig).variants?.map((variant) => (
                    <BranchStepEditor
                      key={variant.id}
                      steps={variant.steps || []}
                      onUpdate={(newSteps) => handleUpdateVariantSteps(index, variant.id, newSteps)}
                      branchLabel={`${variant.name} (${variant.percentage}%)`}
                      branchColor="purple"
                      templates={templates}
                      depth={depth + 1}
                      parentSteps={[...parentSteps, ...steps.slice(0, index)]}
                      maxDepth={maxDepth}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Add step button */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full border border-dashed text-xs h-8"
            onClick={() => setShowAddStep(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            添加步骤
          </Button>
        </div>

        {/* Add step dialog */}
        <Dialog open={showAddStep} onOpenChange={setShowAddStep}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>添加步骤</DialogTitle>
              <DialogDescription>选择要添加到「{branchLabel}」的动作</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 py-4">
              {stepTypeOptions
                .filter(opt => canAddBranching || (opt.value !== 'condition' && opt.value !== 'split'))
                .map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAddStep(option.value)}
                    className="p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </div>
                  </button>
                ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit step dialog */}
        <Dialog open={!!editingStep} onOpenChange={() => setEditingStep(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑步骤</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {editingStep?.step.type === 'send_email' && (
                <>
                  <div className="space-y-2">
                    <Label>选择模板</Label>
                    <Select
                      value={(editedConfig as EmailStepConfig).templateId || ''}
                      onValueChange={(value) => setEditedConfig({ ...editedConfig, templateId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择邮件模板" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>邮件主题（可选）</Label>
                    <Input
                      value={(editedConfig as EmailStepConfig).subject || ''}
                      onChange={(e) => setEditedConfig({ ...editedConfig, subject: e.target.value })}
                      placeholder="留空使用模板主题"
                    />
                  </div>
                </>
              )}

              {editingStep?.step.type === 'wait' && (
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>等待时间</Label>
                    <Input
                      type="number"
                      min="1"
                      value={(editedConfig as WaitStepConfig).duration || 1}
                      onChange={(e) => setEditedConfig({ ...editedConfig, duration: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>单位</Label>
                    <Select
                      value={(editedConfig as WaitStepConfig).unit || 'hours'}
                      onValueChange={(value) => setEditedConfig({ ...editedConfig, unit: value })}
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

              {(editingStep?.step.type === 'add_tag' || editingStep?.step.type === 'remove_tag') && (
                <div className="space-y-2">
                  <Label>标签名称</Label>
                  <Input
                    value={(editedConfig as TagStepConfig).tag || ''}
                    onChange={(e) => setEditedConfig({ ...editedConfig, tag: e.target.value })}
                    placeholder="输入标签名称"
                  />
                </div>
              )}

              {editingStep?.step.type === 'condition' && (
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
                      <Select
                        value={(editedConfig as ConditionConfig).params?.emailStepId || ''}
                        onValueChange={(value) => setEditedConfig({
                          ...editedConfig,
                          params: { ...(editedConfig as ConditionConfig).params, emailStepId: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择邮件步骤" />
                        </SelectTrigger>
                        <SelectContent>
                          {allEmailSteps.map((step, idx) => {
                            const cfg = step.config as EmailStepConfig;
                            return (
                              <SelectItem key={step.id} value={step.id}>
                                {idx + 1}. {cfg.subject || templates.find(t => t.id === cfg.templateId)?.name || '邮件'}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {allEmailSteps.length === 0 && (
                        <p className="text-xs text-amber-600">
                          请先添加邮件步骤
                        </p>
                      )}
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
                </div>
              )}

              {editingStep?.step.type === 'split' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    变体配置在主对话框中管理
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStep(null)}>
                取消
              </Button>
              <Button onClick={handleSaveStep}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CollapsibleContent>
    </Collapsible>
  );
}
