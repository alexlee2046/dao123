# Builder 模式切换 - 修复实施计划

## 📋 修复任务清单

本计划按优先级排序，每个任务可独立执行，但建议按顺序进行。

---

## 🔴 P0 - 紧急修复

### 任务 1: 统一 tag/tagName 属性

**状态**: 待修复  
**预估时间**: 15 分钟  
**影响范围**: 解析器、生成器、组件

#### 修改文件清单

**文件 1**: `src/lib/builder/parser-server.ts`

找到第 168-182 行，将 `tagName` 改为 `tag`:

```typescript
// 当前代码 (错误):
if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'li', 'blockquote'].includes(tagName)) {
  if (hasOnlyTextChildren(node)) {
    const id = nanoid();
    builderData[id] = {
      id,
      type: { resolvedName: 'BuilderText' },
      props: {
        text: el.text().trim() || '',
        tagName: tagName,  // ❌ 错误
        className: remainingClasses,
        ...parsedProps
      },
      // ...
    };
  }
}

// 修复后:
props: {
  text: el.text().trim() || '',
  tag: tagName,  // ✅ 正确 - 与 BuilderText 组件接口匹配
  className: remainingClasses,
  ...parsedProps
}
```

同样修改第 78 行 (raw text nodes):
```typescript
// 当前:
tagName: 'span',

// 修复:
tag: 'span',
```

**文件 2**: `src/lib/builder/generator.ts`

修改第 72 行，兼容两种属性名:

```typescript
// 当前代码:
const tagName = node.props.tagName || 'p';

// 修复后 (兼容):
const tagName = node.props.tag || node.props.tagName || 'p';
```

#### 验证步骤

1. 创建包含 H1 标题的简单 HTML
2. 调用 `convertHtmlToCraft()`
3. 检查返回的 JSON 中使用的是 `tag` 而不是 `tagName`
4. 在 Builder 模式选中文本组件
5. 确认属性面板正确显示标签类型

---

### 任务 2: 解决竞态条件 (双重转换)

**状态**: 待修复  
**预估时间**: 30 分钟  
**影响范围**: Toolbar, BuilderCanvas

#### 方案选择

**推荐方案 B**: 在 BuilderCanvas 中添加防重复转换保护

原因:
- 保留 Toolbar 的预转换可以提供更好的用户反馈 (转换中...)
- BuilderCanvas 的 Lazy Conversion 作为兜底

#### 修改文件清单

**文件**: `src/components/studio/builder/BuilderCanvas.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
// ... 其他 imports

export const BuilderCanvas = () => {
    const { builderData, htmlContent, setBuilderData } = useStudioStore();
    const { actions } = useEditor();
    const t = useTranslations('builder');
    const [isConverting, setIsConverting] = React.useState(false);
    
    // 新增: 防重复转换标志
    const conversionAttemptedRef = useRef(false);
    const lastHtmlContentRef = useRef<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            // 如果 builderData 存在且有效，直接加载
            if (builderData) {
                try {
                    let dataToLoad = typeof builderData === 'string' 
                        ? JSON.parse(builderData) 
                        : builderData;

                    if (!dataToLoad.ROOT) {
                        console.debug("[BuilderCanvas] Builder data missing ROOT node");
                        return;
                    }

                    // 验证节点
                    for (const [nodeId, node] of Object.entries(dataToLoad)) {
                        const nodeData = node as any;
                        if (!nodeData.type || !nodeData.type.resolvedName) {
                            console.warn(`[BuilderCanvas] Node ${nodeId} has invalid type, skipping`);
                            return;
                        }
                    }

                    // 重置转换标志，因为有新的有效数据
                    conversionAttemptedRef.current = false;
                    lastHtmlContentRef.current = null;

                    actions.deserialize(JSON.stringify(dataToLoad));
                    console.log("[BuilderCanvas] Loaded builder data successfully");
                } catch (e) {
                    console.error("[BuilderCanvas] Failed to load builder data:", e);
                }
            } else if (htmlContent) {
                // 防重复转换检查
                if (conversionAttemptedRef.current && 
                    lastHtmlContentRef.current === htmlContent) {
                    console.log("[BuilderCanvas] Skipping duplicate conversion attempt");
                    return;
                }

                console.log("[BuilderCanvas] No builder data found, performing lazy conversion...");
                conversionAttemptedRef.current = true;
                lastHtmlContentRef.current = htmlContent;
                
                setIsConverting(true);
                try {
                    const { convertHtmlToCraft } = await import('@/app/actions/parser');
                    const result = await convertHtmlToCraft(htmlContent);

                    if (result.success && result.data) {
                        const jsonString = JSON.stringify(result.data);
                        setBuilderData(jsonString);
                        actions.deserialize(jsonString);
                        console.log("[BuilderCanvas] Lazy conversion successful");
                    } else {
                        console.error("[BuilderCanvas] Lazy conversion failed:", result.error);
                    }
                } catch (err) {
                    console.error("[BuilderCanvas] Error during lazy conversion:", err);
                } finally {
                    setIsConverting(false);
                }
            }
        };

        loadData();
    }, [builderData, htmlContent, actions, setBuilderData]);

    // ... 其余代码不变
};
```

#### 验证步骤

1. 打开浏览器 Console
2. 清空 Console
3. 切换到 Builder 模式
4. 检查日志，应该只有一次 "conversion successful"
5. 快速连续切换模式多次
6. 确认没有多次转换

---

### 任务 3: 修复 Fallback JSON 中的 isCanvas

**状态**: 待修复  
**预估时间**: 5 分钟  
**影响范围**: Toolbar

#### 修改文件

**文件**: `src/components/studio/Toolbar.tsx`

找到第 355-366 行:

```typescript
// 当前代码 (错误):
"fallback-node": {
  "type": { "resolvedName": "CustomHTML" },
  "isCanvas": true,  // ❌ CustomHTML 不应该是 canvas
  "props": { "code": htmlContent },
  // ...
}

// 修复后:
"fallback-node": {
  "type": { "resolvedName": "CustomHTML" },
  "isCanvas": false,  // ✅ 正确
  "props": { "code": htmlContent },
  "displayName": "Custom HTML",
  "custom": {},
  "hidden": false,
  "nodes": [],
  "linkedNodes": {},
  "parent": "ROOT"
}
```

---

## 🟡 P1 - 重要修复

### 任务 4: 模式切换时自动同步状态

**状态**: 待修复  
**预估时间**: 45 分钟  
**影响范围**: Toolbar, Store

#### 问题描述

当前从 Builder 模式切换回 AI 模式时，不会自动保存 Builder 中的编辑状态。

#### 修改文件清单

**文件 1**: `src/components/studio/Toolbar.tsx`

修改模式切换处理逻辑:

```typescript
// 找到 onClick 处理器 (约第 310 行)

onClick={async () => {
  if (!isBuilderMode) {
    // 切换到 Builder 模式 - 现有逻辑保持不变
    // ...
  } else {
    // 切换回 AI 模式 - 新增同步逻辑
    try {
      // 同步 Builder 状态到 Store
      const currentBuilderData = query.serialize();
      
      if (currentBuilderData && currentBuilderData !== '{}') {
        // 更新 builderData
        setBuilderData(currentBuilderData);
        
        // 同步生成 HTML
        const { generateHtmlFromBuilderData } = await import('@/lib/builder/generator');
        const parsedData = JSON.parse(currentBuilderData);
        const generatedHtml = generateHtmlFromBuilderData(parsedData);
        
        if (generatedHtml) {
          // 包装成完整 HTML 文档
          const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white min-h-screen">
${generatedHtml}
</body>
</html>`;
          
          // 注意: 使用特殊方式设置以避免触发 builderData 清除
          useStudioStore.setState((state) => ({
            htmlContent: fullHtml,
            pages: state.pages.map(p => 
              p.path === state.currentPage 
                ? { ...p, content: fullHtml, content_json: currentBuilderData }
                : p
            )
          }));
        }
        
        console.log("[Toolbar] Synced Builder state before mode switch");
      }
    } catch (e) {
      console.warn("[Toolbar] Failed to sync Builder state:", e);
    }
    
    toggleBuilderMode();
  }
}}
```

#### 验证步骤

1. 创建新项目，让 AI 生成一个简单页面
2. 切换到 Builder 模式
3. 修改一个文本组件的内容
4. 切换回 AI 模式
5. 查看预览是否反映了修改
6. 再次切换到 Builder 模式
7. 确认之前的修改仍然存在

---

### 任务 5: 优化 BuilderCanvas useEffect 依赖

**状态**: 待修复  
**预估时间**: 20 分钟  
**影响范围**: BuilderCanvas

#### 问题描述

`actions` 对象可能在每次渲染时变化，导致 useEffect 不必要地重新执行。

#### 修改方案

使用 `useRef` 存储 `actions` 和 `setBuilderData`:

```typescript
export const BuilderCanvas = () => {
    const { builderData, htmlContent, setBuilderData } = useStudioStore();
    const { actions } = useEditor();
    const t = useTranslations('builder');
    const [isConverting, setIsConverting] = React.useState(false);
    
    // 使用 refs 存储回调以避免依赖变化
    const actionsRef = useRef(actions);
    const setBuilderDataRef = useRef(setBuilderData);
    
    // 保持 refs 最新
    useEffect(() => {
        actionsRef.current = actions;
    }, [actions]);
    
    useEffect(() => {
        setBuilderDataRef.current = setBuilderData;
    }, [setBuilderData]);

    useEffect(() => {
        const loadData = async () => {
            if (builderData) {
                // 使用 actionsRef.current
                actionsRef.current.deserialize(JSON.stringify(dataToLoad));
            } else if (htmlContent) {
                // 使用 setBuilderDataRef.current
                setBuilderDataRef.current(jsonString);
                actionsRef.current.deserialize(jsonString);
            }
        };
        loadData();
    }, [builderData, htmlContent]);  // 移除 actions 和 setBuilderData 依赖
    
    // ...
};
```

---

## 🟢 P2 - 增强优化

### 任务 6: 移除 100ms 硬编码等待

**状态**: 待评估  
**预估时间**: 10 分钟  

#### 评估

经过分析，100ms 等待实际上可能不需要：
- Zustand 状态更新是同步的
- React 渲染调度会自然处理

但移除可能导致某些边缘情况下的问题，建议先完成其他修复后再评估。

---

### 任务 7: 增强错误处理和用户反馈

**状态**: 待实现  
**预估时间**: 30 分钟  

#### 改进点

1. 转换失败时显示 Toast 通知
2. 添加重试按钮
3. 显示具体错误信息

---

## 📊 实施时间表

| 阶段 | 任务 | 预估时间 | 累计时间 |
|------|------|----------|----------|
| Phase 1 | 任务 1 (tag/tagName) | 15 min | 15 min |
| Phase 1 | 任务 3 (isCanvas) | 5 min | 20 min |
| Phase 2 | 任务 2 (竞态条件) | 30 min | 50 min |
| Phase 3 | 任务 4 (状态同步) | 45 min | 1h 35min |
| Phase 3 | 任务 5 (依赖优化) | 20 min | 1h 55min |
| Phase 4 | 验证测试 | 30 min | 2h 25min |

---

## ✅ 完成标准

### 功能测试

- [ ] 新项目首次切换到 Builder 正常
- [ ] AI 生成后切换到 Builder 正常
- [ ] Builder 编辑后切换回 AI 保持状态
- [ ] 保存项目后刷新恢复正常
- [ ] 复杂 HTML 转换不丢失内容

### 性能测试

- [ ] 切换模式响应时间 < 500ms
- [ ] 无多余的转换调用
- [ ] 内存无明显泄漏

### 回归测试

- [ ] 现有功能不受影响
- [ ] AI 聊天正常工作
- [ ] 保存/发布正常工作

---

## 📝 回滚计划

如果修复导致严重问题，可通过以下方式回滚:

```bash
# 回滚到修复前的版本
git revert <commit-hash>

# 或者恢复单个文件
git checkout <previous-commit> -- src/lib/builder/parser-server.ts
```

---

## 🔗 相关 PR/Issue

- TBD: 创建 GitHub Issue 跟踪
- TBD: 创建 PR 进行代码审查

