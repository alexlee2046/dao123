import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { getDefaultModel } from '@/lib/actions/models';
import { z } from 'zod';
import { nanoid } from 'nanoid';

export const runtime = 'edge';

// Schema for generated workflow
const workflowNodeSchema = z.object({
  id: z.string().describe('Unique node ID'),
  type: z.string().describe('Node type from available nodes (e.g., ai.generateImage)'),
  label: z.string().describe('Human-readable node label'),
  config: z.record(z.unknown()).describe('Node configuration matching the input schema'),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).describe('Node position on canvas'),
});

const workflowEdgeSchema = z.object({
  id: z.string().describe('Unique edge ID'),
  source: z.string().describe('Source node ID'),
  target: z.string().describe('Target node ID'),
});

const generatedWorkflowSchema = z.object({
  name: z.string().describe('Workflow name'),
  description: z.string().describe('Workflow description'),
  nodes: z.array(workflowNodeSchema).describe('Workflow nodes'),
  edges: z.array(workflowEdgeSchema).describe('Connections between nodes'),
  explanation: z.string().describe('Explanation of the workflow design'),
});

// Available nodes catalog for AI
const NODE_CATALOG = `
# Available Workflow Nodes

## AI Module
- **ai.generateImage**: Generate images from text prompts
  - Config: { prompt: string, model?: "flux-schnell"|"flux-dev"|"stable-diffusion-3"|"dall-e-3", aspectRatio?: "1:1"|"16:9"|"9:16", count?: 1-4 }
  - Output: { images: string[], cost: number }

- **ai.generateVideo**: Generate videos from text or image
  - Config: { prompt: string, model?: string, duration?: number, aspectRatio?: string }
  - Output: { videoUrl: string, cost: number }

- **ai.generateText**: Generate text using LLM
  - Config: { prompt: string, model?: string, format?: "text"|"json"|"html"|"markdown", temperature?: 0-1, maxTokens?: number }
  - Output: { text: string, cost: number }

- **ai.generateEmail**: Generate marketing email
  - Config: { prompt: string, recipientInfo?: object, tone?: "professional"|"friendly"|"casual" }
  - Output: { subject: string, body: string, cost: number }

## Media Module
- **media.upload**: Upload external URL to storage
  - Config: { url: string, filename?: string }
  - Output: { url: string, path: string }

- **media.download**: Download media as base64
  - Config: { url: string }
  - Output: { base64: string, mimeType: string }

- **media.resize**: Resize image
  - Config: { url: string, width?: number, height?: number }
  - Output: { url: string }

- **media.filter**: Filter media list
  - Config: { items: array, mode: "first"|"last"|"random"|"slice", count?: number }
  - Output: { items: array }

- **media.merge**: Merge media into gallery
  - Config: { items: array, layout: "gallery"|"grid"|"slideshow", columns?: number }
  - Output: { html: string }

## Email Module
- **email.send**: Send email
  - Config: { to: string, subject: string, templateId?: string, html?: string, variables?: object }
  - Output: { messageId: string, success: boolean }

## Flow Module
- **flow.delay**: Wait for duration
  - Config: { duration: number, unit: "seconds"|"minutes"|"hours"|"days" }
  - Output: { waited: boolean }

- **flow.approval**: Wait for human approval
  - Config: { message: string, timeout?: string }
  - Output: { approved: boolean, response?: string }

- **flow.forEach**: Loop over items
  - Config: { items: array|string, concurrency?: number }
  - Output: { results: array }

## Data References
Use {{nodeId.output.field}} to reference output from previous nodes.
Example: {{generateImage.images[0]}} references first image from generateImage node.
`;

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

    const systemPrompt = `You are a workflow design expert. Based on the user's requirements, create a DAG (Directed Acyclic Graph) workflow using the available nodes.

${NODE_CATALOG}

## Design Principles
1. Start with data acquisition or generation nodes
2. Connect nodes logically - data flows from source to destination
3. Use appropriate node types for each task
4. Include delays between external API calls if needed
5. Position nodes left-to-right, top-to-bottom (x increases right, y increases down)
6. Space nodes approximately 250px apart horizontally, 150px vertically
7. Use meaningful IDs like "generateImage", "filterMedia", "sendEmail"
8. Reference previous outputs using {{nodeId.output.field}} syntax

## Output Language
Generate names, descriptions, and explanations in ${language === 'zh' ? 'Chinese' : 'English'}.

## Example
User: "Generate 4 product images and send the best one via email"
Workflow:
1. ai.generateImage (count: 4)
2. media.filter (mode: "first", count: 1)
3. email.send (with image reference)`;

    // Generate structured response
    const result = await generateObject({
      model: openRouter(modelId),
      schema: generatedWorkflowSchema,
      system: systemPrompt,
      prompt: `Create a workflow for: ${prompt}`,
    });

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
      }
    });

  } catch (error: unknown) {
    console.error('[Workflow Generate API Error]:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'AI 服务调用失败'
    }, { status: 500 });
  }
}
