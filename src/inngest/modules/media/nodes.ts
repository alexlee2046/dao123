import { z } from 'zod';
import type { NodeDefinition, NodeContext, NodeResult } from '../../core/types';
import { createClient } from '@/lib/supabase/server';

// ============================================
// Media 模块 - 媒体处理节点
// ============================================

// --- Upload Media Node ---

const uploadMediaInputSchema = z.object({
  url: z.string().url().describe('要上传的媒体 URL'),
  type: z.enum(['image', 'video', 'audio', 'file']).describe('媒体类型'),
  name: z.string().optional().describe('文件名 (不含扩展名)'),
  folder: z.string().default('workflow').describe('存储文件夹'),
});

type UploadMediaInput = z.infer<typeof uploadMediaInputSchema>;

export const uploadMediaNode: NodeDefinition<UploadMediaInput> = {
  meta: {
    id: 'media.upload',
    name: '上传媒体',
    description: '将外部媒体 URL 上传到存储。支持图片、视频、音频和文件。',
    category: 'media',
    module: 'media',
    icon: 'Upload',
    color: '#06b6d4',
    inputSchema: uploadMediaInputSchema,
    outputDescription: '返回上传后的存储 URL',
    examples: [
      {
        name: '上传图片',
        config: {
          url: '{{previousStep.imageUrl}}',
          type: 'image',
          folder: 'generated',
        },
      },
    ],
  },

  async execute(input: UploadMediaInput, context: NodeContext): Promise<NodeResult> {
    const supabase = await createClient();

    try {
      // 下载外部文件
      const response = await fetch(input.url);
      if (!response.ok) {
        return { success: false, error: `无法下载文件: ${response.statusText}` };
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // 确定文件扩展名
      let ext = 'bin';
      if (contentType.includes('image/')) {
        ext = contentType.split('/')[1].split(';')[0];
      } else if (contentType.includes('video/')) {
        ext = contentType.split('/')[1].split(';')[0];
      } else if (contentType.includes('audio/')) {
        ext = contentType.split('/')[1].split(';')[0];
      }

      // 生成文件名
      const fileName = input.name || `${Date.now()}`;
      const filePath = `${input.folder}/${context.workflowId || 'manual'}/${fileName}.${ext}`;

      // 上传到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, buffer, { contentType });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage.from('assets').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // 保存资产记录
      const { data: asset } = await supabase
        .from('assets')
        .insert({
          user_id: context.userId,
          type: input.type,
          url: publicUrl,
          name: fileName,
          metadata: {
            originalUrl: input.url,
            folder: input.folder,
            workflowId: context.workflowId,
          },
        })
        .select('id')
        .single();

      return {
        success: true,
        data: {
          url: publicUrl,
          assetId: asset?.id,
          path: filePath,
        },
        output: {
          url: publicUrl,
          assetId: asset?.id,
        },
        artifacts: [
          {
            type: input.type as 'image' | 'video' | 'audio' | 'file',
            url: publicUrl,
            name: fileName,
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// --- Download Media Node ---

const downloadMediaInputSchema = z.object({
  url: z.string().url().describe('要下载的媒体 URL'),
});

type DownloadMediaInput = z.infer<typeof downloadMediaInputSchema>;

export const downloadMediaNode: NodeDefinition<DownloadMediaInput> = {
  meta: {
    id: 'media.download',
    name: '下载媒体',
    description: '下载媒体文件并返回 base64 编码。用于传递给其他节点处理。',
    category: 'media',
    module: 'media',
    icon: 'Download',
    color: '#06b6d4',
    inputSchema: downloadMediaInputSchema,
    outputDescription: '返回 base64 编码的媒体数据',
    examples: [
      {
        name: '下载图片',
        config: {
          url: 'https://example.com/image.png',
        },
      },
    ],
  },

  async execute(input: DownloadMediaInput, _context: NodeContext): Promise<NodeResult> {
    try {
      const response = await fetch(input.url);
      if (!response.ok) {
        return { success: false, error: `无法下载文件: ${response.statusText}` };
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;

      return {
        success: true,
        data: {
          base64,
          dataUrl,
          contentType,
          size: buffer.byteLength,
        },
        output: {
          base64,
          dataUrl,
          contentType,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// --- Resize Image Node ---

const resizeImageInputSchema = z.object({
  imageUrl: z.string().describe('图片 URL 或 base64'),
  width: z.number().min(1).max(4096).optional().describe('目标宽度'),
  height: z.number().min(1).max(4096).optional().describe('目标高度'),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover').describe('缩放模式'),
  format: z.enum(['jpeg', 'png', 'webp']).default('webp').describe('输出格式'),
  quality: z.number().min(1).max(100).default(80).describe('压缩质量'),
});

type ResizeImageInput = z.infer<typeof resizeImageInputSchema>;

export const resizeImageNode: NodeDefinition<ResizeImageInput> = {
  meta: {
    id: 'media.resize',
    name: '调整图片大小',
    description: '调整图片尺寸和格式。支持多种缩放模式和输出格式。',
    category: 'media',
    module: 'media',
    icon: 'Maximize',
    color: '#10b981',
    inputSchema: resizeImageInputSchema,
    outputDescription: '返回调整后的图片 URL',
    examples: [
      {
        name: '缩放为缩略图',
        config: {
          imageUrl: '{{previousStep.imageUrl}}',
          width: 200,
          height: 200,
          fit: 'cover',
        },
      },
    ],
  },

  async execute(input: ResizeImageInput, context: NodeContext): Promise<NodeResult> {
    // 注意: 实际的图片处理需要使用 Sharp 或其他图片处理库
    // 这里使用 Supabase 的 image transformation 功能
    const supabase = await createClient();

    try {
      let imageUrl = input.imageUrl;

      // 如果是 Supabase Storage URL，可以使用 transform 参数
      if (imageUrl.includes('supabase') && imageUrl.includes('/storage/')) {
        const transformParams = new URLSearchParams();
        if (input.width) transformParams.set('width', input.width.toString());
        if (input.height) transformParams.set('height', input.height.toString());
        transformParams.set('resize', input.fit);
        transformParams.set('format', input.format);
        transformParams.set('quality', input.quality.toString());

        // 添加 transform 参数到 URL
        const separator = imageUrl.includes('?') ? '&' : '?';
        imageUrl = `${imageUrl}${separator}${transformParams.toString()}`;
      } else {
        // 对于外部 URL，需要下载后使用 Sharp 处理
        // 这里简化处理，直接返回原 URL
        // 完整实现需要 Sharp 或调用外部 API
        return {
          success: true,
          data: {
            url: imageUrl,
            note: '外部 URL 暂不支持直接处理，请先上传到存储',
          },
          output: {
            imageUrl,
          },
        };
      }

      return {
        success: true,
        data: {
          url: imageUrl,
          width: input.width,
          height: input.height,
        },
        output: {
          imageUrl,
        },
        artifacts: [
          {
            type: 'image',
            url: imageUrl,
            name: 'Resized Image',
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// --- Filter/Select Media Node ---

const filterMediaInputSchema = z.object({
  items: z.array(z.string()).describe('媒体 URL 列表'),
  type: z.enum(['first', 'last', 'random', 'all', 'slice']).default('all').describe('选择模式'),
  count: z.number().min(1).optional().describe('选择数量 (slice 模式)'),
  offset: z.number().min(0).default(0).describe('起始位置 (slice 模式)'),
});

type FilterMediaInput = z.infer<typeof filterMediaInputSchema>;

export const filterMediaNode: NodeDefinition<FilterMediaInput> = {
  meta: {
    id: 'media.filter',
    name: '筛选媒体',
    description: '从媒体列表中筛选项目。支持首个、末个、随机、切片等模式。',
    category: 'media',
    module: 'media',
    icon: 'Filter',
    color: '#f59e0b',
    inputSchema: filterMediaInputSchema,
    outputDescription: '返回筛选后的媒体列表',
    examples: [
      {
        name: '选择前3个',
        config: {
          items: '{{previousStep.images}}',
          type: 'slice',
          count: 3,
        },
      },
    ],
  },

  async execute(input: FilterMediaInput, _context: NodeContext): Promise<NodeResult> {
    const items = input.items;

    if (!items || items.length === 0) {
      return {
        success: true,
        data: { items: [], count: 0 },
        output: { items: [], selected: null },
      };
    }

    let result: string[] = [];

    switch (input.type) {
      case 'first':
        result = [items[0]];
        break;
      case 'last':
        result = [items[items.length - 1]];
        break;
      case 'random':
        const randomIndex = Math.floor(Math.random() * items.length);
        result = [items[randomIndex]];
        break;
      case 'slice':
        const count = input.count || items.length;
        result = items.slice(input.offset, input.offset + count);
        break;
      case 'all':
      default:
        result = items;
    }

    return {
      success: true,
      data: {
        items: result,
        count: result.length,
      },
      output: {
        items: result,
        selected: result.length === 1 ? result[0] : null,
      },
    };
  },
};

// --- Merge Media Node ---

const mergeMediaInputSchema = z.object({
  sources: z.array(z.string()).min(1).describe('要合并的媒体 URL 列表'),
  type: z.enum(['gallery', 'grid', 'slideshow']).default('gallery').describe('合并模式'),
  columns: z.number().min(1).max(6).default(3).describe('网格列数 (grid 模式)'),
  gap: z.number().min(0).max(32).default(4).describe('间距 (px)'),
});

type MergeMediaInput = z.infer<typeof mergeMediaInputSchema>;

export const mergeMediaNode: NodeDefinition<MergeMediaInput> = {
  meta: {
    id: 'media.merge',
    name: '合并媒体',
    description: '将多个媒体合并为画廊、网格或幻灯片格式。',
    category: 'media',
    module: 'media',
    icon: 'LayoutGrid',
    color: '#8b5cf6',
    inputSchema: mergeMediaInputSchema,
    outputDescription: '返回合并后的 HTML 或配置',
    examples: [
      {
        name: '创建图片网格',
        config: {
          sources: '{{previousStep.images}}',
          type: 'grid',
          columns: 3,
        },
      },
    ],
  },

  async execute(input: MergeMediaInput, _context: NodeContext): Promise<NodeResult> {
    const { sources, type, columns, gap } = input;

    let html = '';

    switch (type) {
      case 'grid':
        html = `<div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px;">`;
        sources.forEach((url, index) => {
          html += `<img src="${url}" alt="Image ${index + 1}" style="width: 100%; height: auto; object-fit: cover;" />`;
        });
        html += '</div>';
        break;

      case 'gallery':
        html = `<div style="display: flex; flex-wrap: wrap; gap: ${gap}px;">`;
        sources.forEach((url, index) => {
          html += `<img src="${url}" alt="Image ${index + 1}" style="max-width: 300px; height: auto;" />`;
        });
        html += '</div>';
        break;

      case 'slideshow':
        html = `<div class="slideshow" data-sources='${JSON.stringify(sources)}'>`;
        html += `<img src="${sources[0]}" alt="Slideshow" style="width: 100%; height: auto;" />`;
        html += '</div>';
        break;
    }

    return {
      success: true,
      data: {
        html,
        type,
        count: sources.length,
      },
      output: {
        html,
        sources,
      },
    };
  },
};

// --- 导出所有节点 ---

export const mediaNodes = [
  uploadMediaNode,
  downloadMediaNode,
  resizeImageNode,
  filterMediaNode,
  mergeMediaNode,
];
