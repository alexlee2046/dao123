/**
 * 模块统一入口
 * 新增模块时在这里注册
 */

import { registerNodes } from '../core/registry';
import { emailNodes } from './email';
import { formNodes } from './form';
import { flowNodes } from './flow';

// 注册所有模块节点
export function registerAllModules() {
  registerNodes([
    ...emailNodes,
    ...formNodes,
    ...flowNodes,
    // 未来添加更多模块:
    // ...aiNodes,
    // ...mediaNodes,
    // ...webhookNodes,
  ]);
}

// 重新导出模块
export * from './email';
export * from './form';
export * from './flow';
