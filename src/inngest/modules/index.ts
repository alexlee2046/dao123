/**
 * 模块统一入口
 * 新增模块时在这里注册
 */

import { registerNodes } from '../core/registry';
import { emailNodes } from './email';
import { formNodes } from './form';
import { flowNodes } from './flow';
import { aiNodes } from './ai';
import { mediaNodes } from './media';

// 注册所有模块节点
export function registerAllModules() {
  registerNodes([
    ...emailNodes,
    ...formNodes,
    ...flowNodes,
    ...aiNodes,
    ...mediaNodes,
    // 未来添加更多模块:
    // ...webhookNodes,
    // ...integrationNodes,
  ]);
}

// 重新导出模块
export * from './email';
export * from './form';
export * from './flow';
export * from './ai';
export * from './media';
