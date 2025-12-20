import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { allFunctions } from '@/inngest/functions';
import { registerAllModules } from '@/inngest/modules';

// 注册所有模块节点
registerAllModules();

// Inngest API 端点
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allFunctions,
});
