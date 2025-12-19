'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

const FIELD_TYPE_KEYS = ['text', 'email', 'phone', 'textarea', 'select', 'radio', 'checkbox', 'number'] as const;
const FIELD_MAPPING_KEYS = ['email', 'first_name', 'last_name', 'company_name', 'phone', 'position', 'country', 'none'] as const;

function SortableFieldItem({
  field,
  onUpdate,
  onDelete,
  t,
}: {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
  t: ReturnType<typeof useTranslations<'mail.forms'>>;
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
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('editor.fieldLabel')}</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ ...field, label: e.target.value })}
              placeholder={t('editor.newField')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('editor.fieldType')}</Label>
            <Select
              value={field.type}
              onValueChange={(value) => onUpdate({ ...field, type: value as FormField['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_KEYS.map((typeKey) => (
                  <SelectItem key={typeKey} value={typeKey}>
                    {t(`fieldTypes.${typeKey}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('editor.placeholder')}</Label>
            <Input
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
              placeholder={t('editor.placeholderHint')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('editor.mapToContact')}</Label>
            <Select
              value={field.mapping || 'none'}
              onValueChange={(value) => onUpdate({ ...field, mapping: value as FormField['mapping'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_MAPPING_KEYS.map((mappingKey) => (
                  <SelectItem key={mappingKey} value={mappingKey}>
                    {t(`fieldMappings.${mappingKey}`)}
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
            <Label>{t('editor.required')}</Label>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete field"
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
  const t = useTranslations('mail.forms');
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
      label: t('editor.newField'),
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
      toast.error(t('editor.enterFormName'));
      return;
    }

    // Validate must have email field
    const hasEmail = fields.some((f) => f.mapping === 'email');
    if (!hasEmail) {
      toast.error(t('editor.requireEmailField'));
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
          toast.success(publish ? t('editor.formPublished') : t('editor.formSaved'));
          if (publish) {
            router.push('/mail/forms');
          }
        } else {
          toast.error(result.error || t('editor.saveFailed'));
        }
      } else {
        const result = await createForm(formData as any);
        if (result.success && result.form) {
          toast.success(publish ? t('editor.formCreated') : t('editor.formSaved'));
          router.push(`/mail/forms/${result.form.id}`);
        } else {
          toast.error(result.error || t('editor.createFailed'));
        }
      }
    } catch (error) {
      toast.error(t('editor.saveFailed'));
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
            {t('editor.backToList')}
          </Link>
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {form ? t('editor.editForm') : t('editor.createForm')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('editor.designForm')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {form?.status === 'published' && (
              <Button variant="outline" onClick={() => window.open(`/f/${form.id}`, '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                {t('editor.preview')}
              </Button>
            )}
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {t('editor.saveDraft')}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving ? t('editor.saving') : t('editor.publish')}
            </Button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('editor.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('editor.formName')} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('editor.formNamePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('editor.formDescription')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('editor.formDescPlaceholder')}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fields */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('editor.formFields')}</CardTitle>
          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="h-4 w-4 mr-2" />
            {t('editor.addField')}
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
                  t={t}
                />
              ))}
            </SortableContext>
          </DndContext>

          {fields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('editor.noFields')}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />
                {t('editor.addFirstField')}
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
            {t('editor.formSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('editor.submitButtonText')}</Label>
              <Input
                value={settings.submitButton?.text || t('editor.submitButtonDefault')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    submitButton: { ...settings.submitButton, text: e.target.value },
                  })
                }
                placeholder={t('editor.submitButtonDefault')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('editor.loadingButtonText')}</Label>
              <Input
                value={settings.submitButton?.loadingText || t('editor.loadingButtonDefault')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    submitButton: { ...settings.submitButton, loadingText: e.target.value },
                  })
                }
                placeholder={t('editor.loadingButtonDefault')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('editor.successMessage')}</Label>
            <Textarea
              value={settings.successMessage || ''}
              onChange={(e) => setSettings({ ...settings, successMessage: e.target.value })}
              placeholder={t('editor.successMessagePlaceholder')}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('editor.redirectUrl')}</Label>
            <Input
              value={settings.redirectUrl || ''}
              onChange={(e) => setSettings({ ...settings, redirectUrl: e.target.value })}
              placeholder={t('editor.redirectUrlPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('editor.notifyEmail')}</Label>
            <Input
              type="email"
              value={settings.notifyEmail || ''}
              onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.value })}
              placeholder={t('editor.notifyEmailPlaceholder')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
