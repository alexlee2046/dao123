'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  Eye,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { Link } from '@/components/link';
import { createForm, updateForm } from '@/lib/actions/forms';
import type { Form, FormField, FormSettings } from '@/lib/forms/types';
import { DEFAULT_FORM_FIELDS, DEFAULT_FORM_SETTINGS } from '@/lib/forms/types';
import { toast } from 'sonner';

const fieldTypes = [
  { value: 'text', label: '单行文本' },
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '电话' },
  { value: 'textarea', label: '多行文本' },
  { value: 'select', label: '下拉选择' },
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '多选' },
  { value: 'number', label: '数字' },
];

const fieldMappings = [
  { value: 'email', label: '邮箱 (必需)' },
  { value: 'first_name', label: '名字' },
  { value: 'last_name', label: '姓氏' },
  { value: 'company_name', label: '公司' },
  { value: 'phone', label: '电话' },
  { value: 'position', label: '职位' },
  { value: 'country', label: '国家' },
  { value: 'none', label: '不映射' },
];

function SortableFieldItem({
  field,
  onUpdate,
  onDelete,
}: {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-4 mb-3"
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>字段标签</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ ...field, label: e.target.value })}
              placeholder="字段名称"
            />
          </div>

          <div className="space-y-2">
            <Label>字段类型</Label>
            <Select
              value={field.type}
              onValueChange={(value) => onUpdate({ ...field, type: value as FormField['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>占位符</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
              placeholder="输入提示文字"
            />
          </div>

          <div className="space-y-2">
            <Label>映射到联系人</Label>
            <Select
              value={field.mapping || 'none'}
              onValueChange={(value) => onUpdate({ ...field, mapping: value as FormField['mapping'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldMappings.map((mapping) => (
                  <SelectItem key={mapping.value} value={mapping.value}>
                    {mapping.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => onUpdate({ ...field, required: checked })}
            />
            <Label>必填</Label>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface FormEditorProps {
  form?: Form;
}

export default function FormEditor({ form }: FormEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(form?.name || '');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState<FormField[]>(
    (form?.fields as FormField[]) || DEFAULT_FORM_FIELDS
  );
  const [settings, setSettings] = useState<FormSettings>(
    (form?.settings as FormSettings) || DEFAULT_FORM_SETTINGS
  );
  const [status, setStatus] = useState<'draft' | 'published'>(
    (form?.status as 'draft' | 'published') || 'draft'
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '新字段',
      placeholder: '',
      required: false,
      mapping: 'none',
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updatedField: FormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const deleteField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = async (publish = false) => {
    if (!name.trim()) {
      toast.error('请输入表单名称');
      return;
    }

    // 验证必须有 email 字段
    const hasEmail = fields.some((f) => f.mapping === 'email');
    if (!hasEmail) {
      toast.error('表单必须包含一个映射到邮箱的字段');
      return;
    }

    setSaving(true);
    try {
      const formData = {
        name: name.trim(),
        description: description.trim(),
        fields,
        settings,
        status: publish ? 'published' : status,
      };

      if (form) {
        const result = await updateForm(form.id, formData);
        if (result.success) {
          toast.success(publish ? '表单已发布' : '表单已保存');
          if (publish) {
            router.push('/mail/forms');
          }
        } else {
          toast.error(result.error || '保存失败');
        }
      } else {
        const result = await createForm(formData as any);
        if (result.success && result.form) {
          toast.success(publish ? '表单已创建并发布' : '表单已创建');
          router.push(`/mail/forms/${result.form.id}`);
        } else {
          toast.error(result.error || '创建失败');
        }
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-6 md:px-12">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/mail/forms">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {form ? '编辑表单' : '创建表单'}
            </h1>
            <p className="text-muted-foreground mt-1">
              设计您的线索收集表单
            </p>
          </div>

          <div className="flex items-center gap-2">
            {form?.status === 'published' && (
              <Button variant="outline" onClick={() => window.open(`/f/${form.id}`, '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                预览
              </Button>
            )}
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              保存草稿
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving ? '保存中...' : '发布表单'}
            </Button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>表单名称 *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：联系我们"
            />
          </div>
          <div className="space-y-2">
            <Label>描述</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="表单用途描述（可选）"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fields */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>表单字段</CardTitle>
          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="h-4 w-4 mr-2" />
            添加字段
          </Button>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field, index) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  onUpdate={(updated) => updateField(index, updated)}
                  onDelete={() => deleteField(index)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {fields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>还没有字段</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />
                添加第一个字段
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            表单设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>提交按钮文字</Label>
              <Input
                value={settings.submitButton?.text || '提交'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    submitButton: { ...settings.submitButton, text: e.target.value },
                  })
                }
                placeholder="提交"
              />
            </div>
            <div className="space-y-2">
              <Label>提交中按钮文字</Label>
              <Input
                value={settings.submitButton?.loadingText || '提交中...'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    submitButton: { ...settings.submitButton, loadingText: e.target.value },
                  })
                }
                placeholder="提交中..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>成功提示消息</Label>
            <Textarea
              value={settings.successMessage || ''}
              onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
              placeholder="感谢您的提交！我们会尽快与您联系。"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>提交后跳转链接（可选）</Label>
            <Input
              value={settings.redirectUrl || ''}
              onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value })}
              placeholder="https://example.com/thank-you"
            />
          </div>

          <div className="space-y-2">
            <Label>通知邮箱（可选）</Label>
            <Input
              type="email"
              value={settings.notifyEmail || ''}
              onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.value })}
              placeholder="有新提交时发送通知"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
