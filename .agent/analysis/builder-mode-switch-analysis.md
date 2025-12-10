# AI 模式切换到手动编辑模式 - 深度链路分析

## 📋 概述

本文档详细分析从 AI 聊天模式切换到手动编辑（Builder）模式时的完整执行链路、状态变化、潜在问题点以及发现的 Bug。

---

## 🔄 切换触发点

### 入口位置
- **文件**: `src/components/studio/Toolbar.tsx` 第 306-392 行
- **触发方式**: 
  1. 点击 "手动编辑" 按钮
  2. 快捷键 `Cmd+B` (第 133 行)

### 触发代码流程
```typescript
// Toolbar.tsx 第 310-377 行
onClick={async () => {
  if (!isBuilderMode) {
    // 步骤 1: 检查 builderData 是否为空
    let isBasicallyEmpty = !builderData || builderData === '{}';
    
    if (!isBasicallyEmpty && builderData) {
      try {
        const parsed = JSON.parse(builderData);
        // 检查 ROOT 节点是否有子节点
        isBasicallyEmpty = !parsed.ROOT || 
          (parsed.ROOT.nodes && parsed.ROOT.nodes.length === 0);
      } catch (e) {
        isBasicallyEmpty = true;
      }
    }
    
    // 步骤 2: 如果为空且有 HTML，执行转换
    if (isBasicallyEmpty && htmlContent) {
      try {
        const { convertHtmlToCraft } = await import('@/app/actions/parser');
        const result = await convertHtmlToCraft(htmlContent);
        if (result.success && result.data) {
          setBuilderData(JSON.stringify(result.data));
        } else {
          throw new Error(result.error);
        }
      } catch (e) {
        // 降级：包裹在 CustomHTML 中
        setBuilderData(fallbackJson);
      }
    }
    
    // 步骤 3: 等待状态更新
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 步骤 4: 切换模式
    toggleBuilderMode();
  } else {
    toggleBuilderMode();
  }
}}
```

---

## 📊 完整数据流图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       用户点击 "手动编辑" 按钮                                │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Toolbar.tsx onClick 处理器                              │
│                                                                              │
│  检查条件: isBuilderMode === false                                           │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
          ┌─────────────────────┐      ┌─────────────────────┐
          │ builderData 为空    │      │ builderData 已存在   │
          │ 或 ROOT.nodes=[] ?  │      │ 且有有效节点 ?       │
          └──────────┬──────────┘      └──────────┬──────────┘
                     │                            │
                     ▼                            │
          ┌─────────────────────┐                 │
          │ 调用 convertHtmlToCraft()             │
          │ (Server Action)     │                 │
          │                     │                 │
          │ 输入: htmlContent   │                 │
          │ 输出: BuilderData   │                 │
          └──────────┬──────────┘                 │
                     │                            │
                     ▼                            │
          ┌─────────────────────┐                 │
          │ setBuilderData()    │                 │
          │ 更新 Store          │                 │
          │                     │◄────────────────┘
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ await 100ms         │   ⚠️ 问题点1: 硬编码等待时间
          │ (等待状态更新)       │      可能不够或过长
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ toggleBuilderMode() │
          │                     │
          │ isBuilderMode: true │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────────────────────────────┐
          │        React 重新渲染                         │
          │                                              │
          │  LivePreview.tsx:                            │
          │  isBuilderMode ? <BuilderCanvas /> : iframe  │
          │                                              │
          │  左侧面板:                                    │
          │  isBuilderMode ? <Toolbox /> : <ChatAssistant/>
          │                                              │
          │  右侧面板:                                    │
          │  isBuilderMode ? <SettingsPanel /> : <AssetManager/>
          └──────────────────────────────────────────────┘
                     │
                     ▼
          ┌─────────────────────────────────────────────┐
          │           BuilderCanvas 组件挂载             │
          └──────────────────────┬──────────────────────┘
                                 │
                                 ▼
          ┌─────────────────────────────────────────────┐
          │        BuilderCanvas useEffect 执行          │
          │                                              │
          │  依赖: [builderData, htmlContent,            │
          │         actions, setBuilderData]             │
          └──────────────────────┬──────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌─────────────────────┐  ┌─────────────────────┐
          │ builderData 存在    │  │ builderData 不存在   │
          │                     │  │ 但 htmlContent 存在  │
          └──────────┬──────────┘  └──────────┬──────────┘
                     │                        │
                     ▼                        ▼
          ┌─────────────────────┐  ┌─────────────────────┐
          │ 解析 JSON           │  │ ⚠️ 再次调用          │
          │ 验证 ROOT 节点      │  │ convertHtmlToCraft() │
          │ 验证 type.resolvedName  │ (Lazy Conversion)    │
          └──────────┬──────────┘  └──────────┬──────────┘
                     │                        │
                     ▼                        ▼
          ┌─────────────────────────────────────────────┐
          │           actions.deserialize()              │
          │           (Craft.js 反序列化)                │
          └──────────────────────┬──────────────────────┘
                                 │
                                 ▼
          ┌─────────────────────────────────────────────┐
          │        Craft.js 重建组件树                   │
          │                                              │
          │  Frame > Element > 各种 Builder 组件         │
          └──────────────────────────────────────────────┘
```

---

## 🚨 已识别问题点

### 问题 1: 竞态条件 - 双重转换

**位置**: `Toolbar.tsx` + `BuilderCanvas.tsx`

**描述**: 
转换逻辑存在于**两个地方**，可能导致双重转换：

1. `Toolbar.tsx` 第 326-341 行：切换前预转换
2. `BuilderCanvas.tsx` 第 41-63 行：挂载时 Lazy Conversion

**场景**:
```
T0: 用户点击切换
T1: Toolbar 检测到 builderData 为空，开始转换
T2: 转换完成，setBuilderData(data)
T3: 等待 100ms
T4: toggleBuilderMode()
T5: React 重新渲染，BuilderCanvas 挂载
T6: BuilderCanvas useEffect 执行
T7: ⚠️ 此时 builderData 可能还没有更新到 BuilderCanvas 的闭包中！
T8: BuilderCanvas 再次检测到 builderData 为空（闭包捕获的旧值）
T9: 再次调用 convertHtmlToCraft() - 重复转换!
```

**影响**: 
- 不必要的双重转换
- 潜在的覆盖问题
- 性能浪费

**修复方案**:
```typescript
// 方案 A: 移除 Toolbar 中的预转换，完全依赖 BuilderCanvas 的 Lazy Conversion

// 方案 B: 在 BuilderCanvas 中使用 ref 追踪是否已在转换
const isConvertingRef = useRef(false);
useEffect(() => {
  if (isConvertingRef.current) return;
  // ...
}, [builderData, htmlContent]);

// 方案 C: 使用全局状态标记转换进行中
// store.ts 增加: conversionInProgress: boolean
```

---

### 问题 2: 100ms 硬编码等待不可靠

**位置**: `Toolbar.tsx` 第 372 行

**描述**:
```typescript
await new Promise(resolve => setTimeout(resolve, 100));
```

这是一个魔术数字，目的是等待 `setBuilderData` 状态更新传播。但：
- Zustand 是同步更新的，不需要等待
- React 调度可能比 100ms 长
- 如果转换耗时长会导致竞态

**修复方案**:
```typescript
// 移除等待，或使用更可靠的方式
// 由于 Zustand 是同步的，理论上立即 toggle 应该没问题
// 但如果组件依赖于 useEffect 检测变化，可能需要使用 flushSync
import { flushSync } from 'react-dom';

flushSync(() => {
  setBuilderData(JSON.stringify(result.data));
});
toggleBuilderMode();
```

---

### 问题 3: BuilderCanvas useEffect 依赖数组问题

**位置**: `BuilderCanvas.tsx` 第 67 行

**描述**:
```typescript
useEffect(() => {
  const loadData = async () => {
    if (builderData) {
      // ...
      actions.deserialize(JSON.stringify(dataToLoad));
    } else if (htmlContent) {
      // Lazy Conversion
    }
  };
  loadData();
}, [builderData, htmlContent, actions, setBuilderData]);
```

**问题**:
- `actions` 是 Craft.js 的 actions 对象，每次渲染可能是新引用
- 如果 `actions` 变化，会重新执行 `loadData()`
- 可能导致多次 `deserialize()` 覆盖用户编辑

**修复方案**:
```typescript
// 使用 ref 存储 actions 避免依赖变化
const actionsRef = useRef(actions);
actionsRef.current = actions;

// 或者使用 useCallback 稳定化 loadData
const loadData = useCallback(async () => {
  // ...
}, [builderData, htmlContent]);

useEffect(() => {
  loadData();
}, [loadData]);
```

---

### 问题 4: ChatAssistant 清除 builderData 可能导致意外

**位置**: `ChatAssistant.tsx` 第 181 行

**描述**:
```typescript
// 在 onFinish 回调中
useStudioStore.getState().setBuilderData(null);
```

当 AI 聊天完成生成新 HTML 时，会将 `builderData` 设为 `null`。

**潜在问题**:
- 如果用户在 Builder 模式编辑过，切换回 AI 模式让 AI 生成新内容后，再切换回 Builder 模式
- 此时 `builderData` 为 `null`，会触发 Lazy Conversion，丢失之前的编辑

**这可能是设计意图**（AI 生成新内容应覆盖旧内容），但需要确认。

---

### 问题 5: 解析器可能生成无效的组件类型

**位置**: `parser-server.ts`

**描述**:
解析器根据 HTML 标签生成对应的 Builder 组件。但某些情况下可能生成 Editor resolver 中未注册的组件类型。

**示例**:
```typescript
// parser-server.ts 创建 BuilderLink 节点
return createContainerNode($, 'BuilderLink', node, parentId, builderData, extra);
```

而在 `page.tsx` 的 Editor resolver 中：
```typescript
resolver={{
  BuilderText,
  BuilderButton,
  BuilderImage,
  BuilderContainer,
  BuilderLink,  // ✅ 已注册
  // ...
}}
```

需确保所有可能生成的组件类型都已在 resolver 中注册。

---

### 问题 6: tagName vs tag 属性不一致

**位置**: 多处

**描述**:
在不同地方使用不同的属性名：

```typescript
// parser-server.ts 第 79 行
props: {
  text: textContent,
  tagName: 'span',  // 使用 tagName
}

// BuilderText.tsx 第 9 行
export interface BuilderTextProps extends BuilderStyleProps {
  text: string;
  tag?: 'h1' | 'h2' | ...;  // 使用 tag
}

// generator.ts 第 72 行
const tagName = node.props.tagName || 'p';  // 查找 tagName
```

**问题**: 解析器设置 `tagName`，组件期望 `tag`，生成器查找 `tagName`。

**影响**: 从 HTML 转换到 Builder 再生成回 HTML 时，标签可能不一致。

**修复方案**:
```typescript
// 统一使用一个属性名，推荐 tag

// parser-server.ts
props: {
  text: textContent,
  tag: 'span',  // 改为 tag
}

// generator.ts
const tagName = node.props.tag || node.props.tagName || 'p';  // 兼容两者
```

---

### 问题 7: isCanvas 标志不一致

**位置**: `parser-server.ts`, `transformer.ts`

**描述**:
某些地方设置了 `isCanvas: true`，某些地方没有设置：

```typescript
// parser-server.ts - BuilderContainer 节点
isCanvas: true,  // ✅ 设置了

// parser-server.ts - BuilderText 节点
// 没有 isCanvas 属性

// Fallback JSON in Toolbar.tsx
"fallback-node": {
  "isCanvas": true,  // CustomHTML 被标记为 canvas?
  // ...
}
```

**问题**: `isCanvas: true` 表示该节点是一个画布容器，可以拖入子元素。CustomHTML 不应该是 canvas。

**修复方案**:
```typescript
// Toolbar.tsx fallback JSON
"fallback-node": {
  "type": { "resolvedName": "CustomHTML" },
  "isCanvas": false,  // CustomHTML 不是 canvas
  // ...
}
```

---

## 🔍 调试建议

### 添加日志点

```typescript
// Toolbar.tsx 模式切换
console.log('[Mode Switch] Current state:', {
  isBuilderMode,
  hasBuilderData: !!builderData,
  builderDataLength: builderData?.length,
  htmlContentLength: htmlContent?.length
});

// BuilderCanvas.tsx 加载
console.log('[BuilderCanvas] Effect triggered:', {
  hasBuilderData: !!builderData,
  hasHtmlContent: !!htmlContent,
  timestamp: Date.now()
});

// 转换完成
console.log('[Conversion] Result:', {
  success: result.success,
  nodeCount: Object.keys(result.data || {}).length,
  rootChildren: result.data?.ROOT?.nodes?.length
});
```

### 使用 React DevTools

1. 安装 React DevTools 浏览器扩展
2. 在 Components 标签页中找到 `Editor` 组件
3. 观察 Craft.js 内部状态变化

### 使用 Zustand DevTools

```typescript
// store.ts
export const useStudioStore = create<StudioState>()(
  devtools(  // 添加 devtools 中间件
    (set) => ({
      // ...
    }),
    { name: 'StudioStore' }
  )
);
```

---

## 📋 修复优先级

| 优先级 | 问题 | 影响 | 复杂度 |
|--------|------|------|--------|
| P0 | 竞态条件 - 双重转换 | 高 - 可能导致数据覆盖 | 中 |
| P0 | tagName vs tag 属性不一致 | 高 - 标签丢失 | 低 |
| P1 | isCanvas 标志不一致 | 中 - 编辑行为异常 | 低 |
| P1 | BuilderCanvas useEffect 依赖 | 中 - 可能多次加载 | 中 |
| P2 | 100ms 硬编码等待 | 低 - 通常工作正常 | 低 |

---

## 🛠️ 推荐修复步骤

### 步骤 1: 统一 tag/tagName 属性 (P0)

修改文件:
- `src/lib/builder/parser-server.ts`
- `src/lib/builder/generator.ts`

### 步骤 2: 解决竞态条件 (P0)

推荐方案: 移除 Toolbar 中的预转换，完全依赖 BuilderCanvas 的 Lazy Conversion。

修改文件:
- `src/components/studio/Toolbar.tsx` (移除转换逻辑)
- `src/components/studio/builder/BuilderCanvas.tsx` (保留并优化)

### 步骤 3: 修复 isCanvas 标志 (P1)

修改文件:
- `src/components/studio/Toolbar.tsx` (fallback JSON)

### 步骤 4: 优化 useEffect 依赖 (P1)

修改文件:
- `src/components/studio/builder/BuilderCanvas.tsx`

---

## 📝 相关文件清单

| 文件 | 职责 | 修改优先级 |
|------|------|-----------|
| `src/components/studio/Toolbar.tsx` | 模式切换入口 | 高 |
| `src/components/studio/builder/BuilderCanvas.tsx` | 画布组件，加载 Builder 数据 | 高 |
| `src/lib/store.ts` | 状态管理 | 中 |
| `src/lib/builder/parser-server.ts` | HTML → Craft JSON 转换 | 高 |
| `src/lib/builder/generator.ts` | Craft JSON → HTML 转换 | 高 |
| `src/lib/builder/tailwindParser.ts` | Tailwind 类解析 | 低 |
| `src/lib/builder/styleUtils.ts` | 样式工具 | 低 |
| `src/components/studio/LivePreview.tsx` | 预览区域切换 | 低 |
| `src/app/[locale]/studio/[siteId]/page.tsx` | 页面布局，Editor resolver | 中 |
| `src/components/builder/atoms/*.tsx` | 原子组件 | 中 |

