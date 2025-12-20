import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel } from '@/lib/actions/models';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

/**
 * Node Registry - Authoritative source for all available nodes
 * Based on WorkflowLLM research: detailed hierarchical API documentation improves accuracy by 23%
 */
const NODE_REGISTRY = {
  'ai.generateImage': {
    name: 'Generate Image',
    description: 'Generate images from text prompts using AI models',
    category: 'ai',
    params: {
      prompt: { type: 'string', required: true, description: 'Text prompt describing the image to generate' },
      model: { type: 'enum', values: ['flux-schnell', 'flux-dev', 'stable-diffusion-3', 'dall-e-3'], default: 'flux-schnell' },
      aspectRatio: { type: 'enum', values: ['1:1', '16:9', '9:16', '4:3', '3:4'], default: '1:1' },
      count: { type: 'number', min: 1, max: 4, default: 1 },
    },
    returns: { images: 'string[]', cost: 'number' },
  },
  'ai.generateVideo': {
    name: 'Generate Video',
    description: 'Generate videos from text or image using AI models',
    category: 'ai',
    params: {
      prompt: { type: 'string', required: true, description: 'Text prompt describing the video' },
      model: { type: 'string', default: 'kling-v1' },
      duration: { type: 'number', min: 3, max: 10, default: 5 },
      aspectRatio: { type: 'enum', values: ['16:9', '9:16', '1:1'], default: '16:9' },
    },
    returns: { videoUrl: 'string', cost: 'number' },
  },
  'ai.generateText': {
    name: 'Generate Text',
    description: 'Generate text content using LLM models',
    category: 'ai',
    params: {
      prompt: { type: 'string', required: true, description: 'Text prompt for generation' },
      model: { type: 'string', default: 'anthropic/claude-3.5-sonnet' },
      format: { type: 'enum', values: ['text', 'json', 'html', 'markdown'], default: 'text' },
      temperature: { type: 'number', min: 0, max: 1, default: 0.7 },
      maxTokens: { type: 'number', min: 1, max: 8192, default: 1024 },
    },
    returns: { text: 'string', cost: 'number' },
  },
  'ai.generateEmail': {
    name: 'Generate Email',
    description: 'Generate marketing email content with subject and body',
    category: 'ai',
    params: {
      prompt: { type: 'string', required: true, description: 'Describe the email content and purpose' },
      recipientInfo: { type: 'object', description: 'Optional recipient context for personalization' },
      tone: { type: 'enum', values: ['professional', 'friendly', 'casual'], default: 'professional' },
    },
    returns: { subject: 'string', body: 'string', cost: 'number' },
  },
  'media.upload': {
    name: 'Upload Media',
    description: 'Upload external URL to cloud storage',
    category: 'media',
    params: {
      url: { type: 'string', required: true, description: 'URL of the media to upload' },
      filename: { type: 'string', description: 'Optional custom filename' },
    },
    returns: { url: 'string', path: 'string' },
  },
  'media.download': {
    name: 'Download Media',
    description: 'Download media as base64 encoded data',
    category: 'media',
    params: {
      url: { type: 'string', required: true, description: 'URL of the media to download' },
    },
    returns: { base64: 'string', mimeType: 'string' },
  },
  'media.resize': {
    name: 'Resize Image',
    description: 'Resize image to specified dimensions',
    category: 'media',
    params: {
      url: { type: 'string', required: true, description: 'URL of the image to resize' },
      width: { type: 'number', description: 'Target width in pixels' },
      height: { type: 'number', description: 'Target height in pixels' },
    },
    returns: { url: 'string' },
  },
  'media.filter': {
    name: 'Filter Media',
    description: 'Filter and select items from a media list',
    category: 'media',
    params: {
      items: { type: 'array', required: true, description: 'Array of items to filter (or reference like {{nodeId.images}})' },
      mode: { type: 'enum', values: ['first', 'last', 'random', 'slice'], required: true },
      count: { type: 'number', default: 1, description: 'Number of items to select' },
    },
    returns: { items: 'array' },
  },
  'media.merge': {
    name: 'Merge Media',
    description: 'Merge multiple media items into a gallery or grid',
    category: 'media',
    params: {
      items: { type: 'array', required: true, description: 'Array of media URLs to merge' },
      layout: { type: 'enum', values: ['gallery', 'grid', 'slideshow'], required: true },
      columns: { type: 'number', default: 2, description: 'Number of columns for grid layout' },
    },
    returns: { html: 'string' },
  },
  'email.send': {
    name: 'Send Email',
    description: 'Send email to recipients',
    category: 'email',
    params: {
      to: { type: 'string', required: true, description: 'Recipient email address' },
      subject: { type: 'string', required: true, description: 'Email subject line' },
      html: { type: 'string', description: 'HTML body content' },
      templateId: { type: 'string', description: 'Email template ID (alternative to html)' },
      variables: { type: 'object', description: 'Template variables for replacement' },
    },
    returns: { messageId: 'string', success: 'boolean' },
  },
  'flow.delay': {
    name: 'Delay',
    description: 'Wait for a specified duration before continuing',
    category: 'flow',
    params: {
      duration: { type: 'number', required: true, description: 'Duration to wait' },
      unit: { type: 'enum', values: ['seconds', 'minutes', 'hours', 'days'], default: 'seconds' },
    },
    returns: { waited: 'boolean' },
  },
  'flow.approval': {
    name: 'Human Approval',
    description: 'Pause workflow and wait for human approval',
    category: 'flow',
    params: {
      message: { type: 'string', required: true, description: 'Message to show to approver' },
      timeout: { type: 'string', description: 'Timeout duration (e.g., "24h")' },
    },
    returns: { approved: 'boolean', response: 'string' },
  },
  'flow.forEach': {
    name: 'For Each Loop',
    description: 'Execute child nodes for each item in array',
    category: 'flow',
    params: {
      items: { type: 'array', required: true, description: 'Array to iterate over' },
      concurrency: { type: 'number', default: 1, description: 'Max parallel executions' },
    },
    returns: { results: 'array' },
  },
} as const;

// Valid node types for schema validation
const VALID_NODE_TYPES = Object.keys(NODE_REGISTRY) as [string, ...string[]];

// Schema for generated workflow with strict node type validation
const workflowNodeSchema = z.object({
  id: z.string().describe('Unique node ID (use descriptive names like "generateImage", "filterMedia")'),
  type: z.enum(VALID_NODE_TYPES).describe('Node type - MUST be one of the valid types from registry'),
  label: z.string().describe('Human-readable node label'),
  config: z.record(z.unknown()).describe('Node configuration matching the node type params'),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).describe('Node position on canvas'),
});

const workflowEdgeSchema = z.object({
  id: z.string().describe('Unique edge ID'),
  source: z.string().describe('Source node ID - must match an existing node id'),
  target: z.string().describe('Target node ID - must match an existing node id'),
});

const generatedWorkflowSchema = z.object({
  name: z.string().describe('Workflow name'),
  description: z.string().describe('Workflow description'),
  nodes: z.array(workflowNodeSchema).min(1).describe('Workflow nodes - at least one required'),
  edges: z.array(workflowEdgeSchema).describe('Connections between nodes'),
  explanation: z.string().describe('Explanation of the workflow design'),
});

/**
 * Generate structured node catalog from registry
 * This ensures the LLM sees the exact same information used for validation
 */
function generateNodeCatalog(): string {
  const categories: Record<string, string[]> = {};

  for (const [nodeType, def] of Object.entries(NODE_REGISTRY)) {
    const cat = def.category;
    if (!categories[cat]) categories[cat] = [];

    const paramsList = Object.entries(def.params)
      .map(([name, p]) => {
        const req = 'required' in p && p.required ? ' (required)' : '';
        const defVal = 'default' in p ? ` [default: ${p.default}]` : '';
        const typeStr = p.type === 'enum' && 'values' in p ? `enum(${p.values.join('|')})` : p.type;
        return `    - ${name}: ${typeStr}${req}${defVal} - ${p.description}`;
      })
      .join('\n');

    const returnsList = Object.entries(def.returns)
      .map(([name, type]) => `${name}: ${type}`)
      .join(', ');

    categories[cat].push(
      `### ${nodeType}\n` +
      `**${def.name}**: ${def.description}\n` +
      `Parameters:\n${paramsList}\n` +
      `Returns: { ${returnsList} }`
    );
  }

  let catalog = '# Node Registry (ONLY use nodes from this list)\n\n';
  for (const [cat, nodes] of Object.entries(categories)) {
    catalog += `## ${cat.toUpperCase()} Module\n\n${nodes.join('\n\n')}\n\n`;
  }

  return catalog;
}

// Few-shot examples for improved accuracy (based on FlowMind research)
const FEW_SHOT_EXAMPLES = `
## Example 1: Image Generation + Email
User: "Generate 4 product images and send the best one via email"
Response:
{
  "name": "产品图片生成与发送",
  "description": "生成多张产品图片，筛选最佳图片后发送邮件",
  "nodes": [
    {"id": "genImages", "type": "ai.generateImage", "label": "生成产品图片", "config": {"prompt": "Professional product photography", "count": 4}, "position": {"x": 100, "y": 100}},
    {"id": "selectBest", "type": "media.filter", "label": "选择最佳图片", "config": {"items": "{{genImages.images}}", "mode": "first", "count": 1}, "position": {"x": 350, "y": 100}},
    {"id": "sendEmail", "type": "email.send", "label": "发送邮件", "config": {"to": "user@example.com", "subject": "产品图片", "html": "<img src='{{selectBest.items[0]}}'/>"}, "position": {"x": 600, "y": 100}}
  ],
  "edges": [
    {"id": "e1", "source": "genImages", "target": "selectBest"},
    {"id": "e2", "source": "selectBest", "target": "sendEmail"}
  ]
}

## Example 2: Content Generation with Approval
User: "Generate marketing copy, get approval, then send"
Response:
{
  "name": "营销内容审批流程",
  "description": "生成营销文案，人工审批后发送",
  "nodes": [
    {"id": "genContent", "type": "ai.generateText", "label": "生成营销文案", "config": {"prompt": "Write compelling marketing copy", "format": "html"}, "position": {"x": 100, "y": 100}},
    {"id": "approve", "type": "flow.approval", "label": "人工审批", "config": {"message": "请审批以下营销内容: {{genContent.text}}"}, "position": {"x": 350, "y": 100}},
    {"id": "sendEmail", "type": "email.send", "label": "发送邮件", "config": {"to": "subscribers@list.com", "subject": "最新资讯", "html": "{{genContent.text}}"}, "position": {"x": 600, "y": 100}}
  ],
  "edges": [
    {"id": "e1", "source": "genContent", "target": "approve"},
    {"id": "e2", "source": "approve", "target": "sendEmail"}
  ]
}

## Example 3: Video Generation
User: "Create a product video from description"
Response:
{
  "name": "产品视频生成",
  "description": "根据描述生成产品推广视频",
  "nodes": [
    {"id": "genVideo", "type": "ai.generateVideo", "label": "生成产品视频", "config": {"prompt": "Product showcase video", "duration": 5, "aspectRatio": "16:9"}, "position": {"x": 100, "y": 100}},
    {"id": "upload", "type": "media.upload", "label": "上传视频", "config": {"url": "{{genVideo.videoUrl}}"}, "position": {"x": 350, "y": 100}}
  ],
  "edges": [
    {"id": "e1", "source": "genVideo", "target": "upload"}
  ]
}
`;

/**
 * Validate generated workflow structure
 * Based on n8n approach: validate nodes/edges reference correctly
 */
function validateWorkflow(workflow: z.infer<typeof generatedWorkflowSchema>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const nodeIds = new Set(workflow.nodes.map(n => n.id));

  // Check edge references
  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
    }
    if (edge.source === edge.target) {
      errors.push(`Edge ${edge.id} creates a self-loop on node: ${edge.source}`);
    }
  }

  // Check for duplicate node IDs
  const idCounts = new Map<string, number>();
  for (const node of workflow.nodes) {
    idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
  }
  for (const [id, count] of idCounts) {
    if (count > 1) {
      errors.push(`Duplicate node ID: ${id} (appears ${count} times)`);
    }
  }

  // Check required config params for each node type
  for (const node of workflow.nodes) {
    const registry = NODE_REGISTRY[node.type as keyof typeof NODE_REGISTRY];
    if (registry) {
      for (const [paramName, paramDef] of Object.entries(registry.params)) {
        if ('required' in paramDef && paramDef.required) {
          if (!(paramName in node.config) || node.config[paramName] === undefined) {
            errors.push(`Node ${node.id} (${node.type}) missing required param: ${paramName}`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(req: Request) {
  try {
    const { prompt, language = 'zh' } = await req.json();

    if (!prompt) {
      return Response.json({ error: '请描述您想要创建的工作流' }, { status: 400 });
    }

    // Get API Key
    const supabase = await createClient();
    let apiKey = process.env.OPENROUTER_API_KEY;

    try {
      const { data: dbSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'OPENROUTER_API_KEY')
        .single();

      if (dbSetting?.value) {
        apiKey = dbSetting.value;
      }
    } catch {
      console.warn('Failed to fetch API key from DB, falling back to env');
    }

    if (!apiKey) {
      return Response.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // Get default model
    let modelId = 'anthropic/claude-3.5-sonnet';
    const defaultModel = await getDefaultModel('chat');
    if (defaultModel) {
      modelId = defaultModel.id;
    }

    // Create OpenRouter client
    const openRouter = createOpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      name: 'openrouter',
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://www.dao123.me',
        'X-Title': 'dao123',
      }
    });

    // Generate structured node catalog from registry (ensures consistency)
    const nodeCatalog = generateNodeCatalog();

    const systemPrompt = `You are a workflow design expert. Create DAG workflows using ONLY nodes from the registry below.

${nodeCatalog}

## Data References
Reference previous node outputs using {{nodeId.fieldName}} syntax.
Examples:
- {{generateImage.images}} - array of generated images
- {{generateImage.images[0]}} - first generated image
- {{filterMedia.items[0]}} - first filtered item
- {{generateText.text}} - generated text content

## Design Rules (CRITICAL)
1. ONLY use node types listed in the registry above - inventing new types will fail
2. Include ALL required parameters for each node type
3. Ensure edge source/target reference valid node IDs
4. Use descriptive node IDs (camelCase): "genImages", "filterBest", "sendResult"
5. Position nodes left-to-right: x increases by ~250px, y by ~150px for branches
6. Connect nodes in logical data flow order

## Output Language
Generate names, descriptions, labels, and explanations in ${language === 'zh' ? 'Chinese (简体中文)' : 'English'}.

${FEW_SHOT_EXAMPLES}`;

    // Generate structured response with retry on validation failure
    let attempts = 0;
    const maxAttempts = 2;
    let lastError: string | null = null;

    while (attempts < maxAttempts) {
      attempts++;

      const userPrompt = lastError
        ? `Create a workflow for: ${prompt}\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${lastError}\n\nPlease fix these issues.`
        : `Create a workflow for: ${prompt}`;

      const result = await generateObject({
        model: openRouter(modelId),
        schema: generatedWorkflowSchema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      // Validate the generated workflow
      const validation = validateWorkflow(result.object);

      if (validation.valid) {
        // Ensure unique IDs
        const nodesWithIds = result.object.nodes.map((node) => ({
          ...node,
          id: node.id || nanoid(),
        }));

        const edgesWithIds = result.object.edges.map((edge) => ({
          ...edge,
          id: edge.id || nanoid(),
        }));

        return Response.json({
          success: true,
          workflow: {
            name: result.object.name,
            description: result.object.description,
            nodes: nodesWithIds,
            edges: edgesWithIds,
            explanation: result.object.explanation,
          },
          _meta: {
            attempts,
            model: modelId,
          }
        });
      }

      // Validation failed, prepare for retry
      lastError = validation.errors.join('\n');
      console.warn(`[Workflow Generate] Attempt ${attempts} validation failed:`, validation.errors);
    }

    // All attempts failed
    return Response.json({
      error: `工作流生成验证失败: ${lastError}`,
      _meta: { attempts, model: modelId }
    }, { status: 422 });

  } catch (error: unknown) {
    console.error('[Workflow Generate API Error]:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'AI 服务调用失败'
    }, { status: 500 });
  }
}
