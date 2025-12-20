/**
 * Inngest Functions 统一入口
 */

import { automationFunctions } from './automation';
import { dagFunctions } from './dag-executor';

// 导出所有 functions 供 API route 使用
export const allFunctions = [
  ...automationFunctions,
  ...dagFunctions,
  // 未来添加更多:
  // ...campaignFunctions,
  // ...leadSearchFunctions,
];

// 重新导出
export * from './automation';
export * from './dag-executor';
