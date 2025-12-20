'use client';

/**
 * Node Configuration Panel
 *
 * Right panel for editing selected node's configuration.
 * Generates form fields dynamically based on node schema.
 */

import { useState } from 'react';
import {
  X,
  Trash2,
  Info,
  ChevronDown,
  ChevronRight,
  Braces,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { WorkflowFlowNode } from './types';

// Field schema from JSON Schema
interface FieldSchema {
  type: string;
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  properties?: Record<string, FieldSchema>;
  items?: FieldSchema;
  required?: string[];
}

interface NodeConfigPanelProps {
  node: WorkflowFlowNode;
  onConfigUpdate: (config: Record<string, unknown>) => void;
  onLabelUpdate: (label: string) => void;
  onDelete: () => void;
  onClose: () => void;
  schema?: Record<string, FieldSchema>;
}

// Dynamic field component
interface FieldProps {
  name: string;
  schema: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  path?: string;
}

// Separate component for object fields to allow useState
function ObjectField({ name, schema, value, onChange, path = '' }: FieldProps) {
  const [isOpen, setIsOpen] = useState(true);
  const fieldPath = path ? `${path}.${name}` : name;
  const label = schema.title || name;
  const objectValue = (value as Record<string, unknown>) || {};

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2">
        <Label className="flex items-center gap-2">
          {label}
          {schema.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{schema.description}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-l-2 pl-4">
        {schema.properties &&
          Object.entries(schema.properties).map(([key, fieldSchema]) => (
            <ConfigField
              key={key}
              name={key}
              schema={fieldSchema}
              value={objectValue[key]}
              onChange={(v) => onChange({ ...objectValue, [key]: v })}
              path={fieldPath}
            />
          ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ConfigField({ name, schema, value, onChange, path = '' }: FieldProps) {
  const label = schema.title || name;

  // Reference input mode toggle
  const [isReference, setIsReference] = useState(
    typeof value === 'string' && value.startsWith('{{')
  );

  // String field
  if (schema.type === 'string') {
    // Enum dropdown
    if (schema.enum && schema.enum.length > 0) {
      return (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            {label}
            {schema.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>{schema.description}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Label>
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => onChange(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label}`} />
            </SelectTrigger>
            <SelectContent>
              {schema.enum.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Long text (textarea)
    if (
      (schema.maxLength && schema.maxLength > 200) ||
      name.toLowerCase().includes('prompt') ||
      name.toLowerCase().includes('content') ||
      name.toLowerCase().includes('body')
    ) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              {label}
              {schema.description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{schema.description}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReference(!isReference)}
              className="h-6 gap-1 text-xs"
            >
              <Braces className="h-3 w-3" />
              Ref
            </Button>
          </div>
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              isReference
                ? '{{stepId.output.field}}'
                : schema.default?.toString() || `Enter ${label}...`
            }
            rows={4}
            className={isReference ? 'font-mono text-sm' : ''}
          />
        </div>
      );
    }

    // Regular text input
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            {label}
            {schema.description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>{schema.description}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReference(!isReference)}
            className="h-6 gap-1 text-xs"
          >
            <Braces className="h-3 w-3" />
            Ref
          </Button>
        </div>
        <Input
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isReference
              ? '{{stepId.output.field}}'
              : schema.default?.toString() || `Enter ${label}...`
          }
          className={isReference ? 'font-mono text-sm' : ''}
        />
      </div>
    );
  }

  // Number field
  if (schema.type === 'number' || schema.type === 'integer') {
    const hasRange =
      schema.minimum !== undefined && schema.maximum !== undefined;
    const min = schema.minimum ?? 0;
    const max = schema.maximum ?? 100;
    const currentValue = (value as number) ?? schema.default ?? min;

    if (hasRange && max - min <= 100) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              {label}
              {schema.description && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>{schema.description}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </Label>
            <span className="text-sm text-muted-foreground">{currentValue}</span>
          </div>
          <Slider
            value={[currentValue]}
            onValueChange={(v) => onChange(v[0])}
            min={min}
            max={max}
            step={schema.type === 'integer' ? 1 : 0.1}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {label}
          {schema.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{schema.description}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <Input
          type="number"
          value={(value as number) ?? ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={schema.minimum}
          max={schema.maximum}
        />
      </div>
    );
  }

  // Boolean field
  if (schema.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {label}
          {schema.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{schema.description}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <Switch
          checked={(value as boolean) ?? false}
          onCheckedChange={(v) => onChange(v)}
        />
      </div>
    );
  }

  // Object field (nested) - use separate component
  if (schema.type === 'object' && schema.properties) {
    return (
      <ObjectField
        name={name}
        schema={schema}
        value={value}
        onChange={onChange}
        path={path}
      />
    );
  }

  // Array field
  if (schema.type === 'array') {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {label}
          {schema.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>{schema.description}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Label>
        <Textarea
          value={
            Array.isArray(value)
              ? JSON.stringify(value, null, 2)
              : (value as string) || '[]'
          }
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              onChange(e.target.value);
            }
          }}
          placeholder="JSON array or {{reference}}"
          rows={3}
          className="font-mono text-sm"
        />
      </div>
    );
  }

  // Fallback: JSON editor
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={
          typeof value === 'object'
            ? JSON.stringify(value, null, 2)
            : String(value || '')
        }
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value));
          } catch {
            onChange(e.target.value);
          }
        }}
        placeholder="JSON value"
        rows={3}
        className="font-mono text-sm"
      />
    </div>
  );
}

// Example schema for nodes (would be loaded from registry)
const defaultSchemas: Record<string, Record<string, FieldSchema>> = {
  'ai.generateImage': {
    prompt: {
      type: 'string',
      title: 'Prompt',
      description: 'Text description of the image to generate',
      maxLength: 2000,
    },
    model: {
      type: 'string',
      title: 'Model',
      enum: ['flux-schnell', 'flux-dev', 'stable-diffusion-3', 'dall-e-3'],
      default: 'flux-schnell',
    },
    aspectRatio: {
      type: 'string',
      title: 'Aspect Ratio',
      enum: ['1:1', '16:9', '9:16', '4:3', '3:4'],
      default: '1:1',
    },
    count: {
      type: 'integer',
      title: 'Count',
      description: 'Number of images to generate',
      minimum: 1,
      maximum: 4,
      default: 1,
    },
  },
  'ai.generateText': {
    prompt: {
      type: 'string',
      title: 'Prompt',
      description: 'Text generation prompt',
      maxLength: 4000,
    },
    model: {
      type: 'string',
      title: 'Model',
      enum: ['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro'],
      default: 'gpt-4o',
    },
    format: {
      type: 'string',
      title: 'Output Format',
      enum: ['text', 'json', 'html', 'markdown'],
      default: 'text',
    },
    temperature: {
      type: 'number',
      title: 'Temperature',
      description: 'Creativity (0=focused, 1=creative)',
      minimum: 0,
      maximum: 1,
      default: 0.7,
    },
    maxTokens: {
      type: 'integer',
      title: 'Max Tokens',
      minimum: 100,
      maximum: 4000,
      default: 1000,
    },
  },
  'email.send': {
    to: {
      type: 'string',
      title: 'To',
      description: 'Recipient email or {{reference}}',
    },
    subject: {
      type: 'string',
      title: 'Subject',
    },
    templateId: {
      type: 'string',
      title: 'Template ID',
      description: 'Email template to use',
    },
    variables: {
      type: 'object',
      title: 'Variables',
      description: 'Template variables',
    },
  },
};

// Inner component with state management
function NodeConfigPanelInner({
  node,
  onConfigUpdate,
  onLabelUpdate,
  onDelete,
  onClose,
  schema,
}: NodeConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, unknown>>(node.data.config);
  const [label, setLabel] = useState(node.data.label);

  // Get schema for this node type
  const nodeSchema = schema || defaultSchemas[node.data.nodeType] || {};

  // Handle config change
  const handleConfigChange = (key: string, value: unknown) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigUpdate(newConfig);
  };

  // Handle label change
  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    onLabelUpdate(newLabel);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: node.data.meta.color }}
          />
          <span className="font-medium">{node.data.meta.name}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Label */}
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Node label..."
            />
          </div>

          {/* Config fields */}
          {Object.entries(nodeSchema).map(([key, fieldSchema]) => (
            <ConfigField
              key={key}
              name={key}
              schema={fieldSchema}
              value={config[key]}
              onChange={(v) => handleConfigChange(key, v)}
            />
          ))}

          {/* Raw JSON fallback if no schema */}
          {Object.keys(nodeSchema).length === 0 && (
            <div className="space-y-2">
              <Label>Configuration (JSON)</Label>
              <Textarea
                value={JSON.stringify(config, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setConfig(parsed);
                    onConfigUpdate(parsed);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Node
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Node?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove &quot;{label}&quot; and all its connections.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Use key to reset state when node changes
export function NodeConfigPanel(props: NodeConfigPanelProps) {
  return <NodeConfigPanelInner key={props.node.id} {...props} />;
}
