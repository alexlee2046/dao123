# Builder 模式切换修复 - 完成报告

## 📅 修复日期
2025-12-11

## ✅ 已完成修复

### P0 修复

#### 任务 1: 统一 tag/tagName 属性 ✅
**状态**: 已完成  
**修改文件**:
- `src/lib/builder/parser-server.ts`:
  - 第 78 行: `tagName: 'span'` → `tag: 'span'`
  - 第 174 行: `tagName: tagName` → `tag: tagName`
- `src/lib/builder/generator.ts`:
  - 第 72 行: 添加兼容处理 `node.props.tag || node.props.tagName || 'p'`

**影响**: 修复了从 HTML 转换到 Builder 再到 HTML 往返过程中标签类型丢失的问题

---

#### 任务 3: 修复 Fallback JSON 中的 isCanvas ✅
**状态**: 已完成  
**修改文件**:
- `src/components/studio/Toolbar.tsx`:
  - 第 357 行: `"isCanvas": true` → `"isCanvas": false`

**影响**: 防止用户在 CustomHTML 组件中拖入子组件导致的异常

---

#### 任务 2: 解决竞态条件 (双重转换) ✅
**状态**: 已完成  
**修改文件**:
- `src/components/studio/builder/BuilderCanvas.tsx`: 完全重写
  - 添加 `conversionAttemptedRef` 防止重复转换
  - 添加 `lastHtmlContentRef` 追踪已转换的内容
  - 添加 `isMountedRef` 防止卸载后的状态更新
  - 使用 refs 存储 `actions` 和 `setBuilderData` 避免依赖问题
  - 移除 `actions` 和 `setBuilderData` 从 useEffect 依赖数组

**影响**: 
- 防止 Toolbar 和 BuilderCanvas 同时触发转换
- 优化 useEffect 依赖，避免不必要的重新执行
- 添加组件生命周期保护

---

### P1 修复

#### 任务 4: 模式切换时自动同步状态 ✅
**状态**: 已完成  
**修改文件**:
- `src/components/studio/Toolbar.tsx`:
  - 第 374-418 行: 添加切换回 AI 模式时的状态同步逻辑
  - 在切换前: `query.serialize()` → `setBuilderData()`
  - 生成 HTML: `generateHtmlFromBuilderData()`
  - 更新 store: `useStudioStore.setState()`

**影响**: 
- 在 Builder 模式编辑后切换回 AI 模式，编辑内容会自动同步到 HTML
- 防止 AI 生成新内容后覆盖之前的编辑

---

## 📊 构建验证

```
✓ npm run lint - 通过 (仅预存在的警告)
✓ npm run build - 成功
```

---

## 🔧 涉及的文件清单

| 文件 | 修改类型 |
|------|----------|
| `src/lib/builder/parser-server.ts` | 属性名修改 |
| `src/lib/builder/generator.ts` | 兼容处理 |
| `src/components/studio/Toolbar.tsx` | isCanvas 修复 + 状态同步 |
| `src/components/studio/builder/BuilderCanvas.tsx` | 完全重写 |

---

## 📋 待完成任务

| 任务 | 优先级 | 状态 |
|------|--------|------|
| 移除 100ms 硬编码等待 | P2 | 待评估 |
| 增强错误处理和用户反馈 | P2 | 待实现 |
| 添加单元测试 | P2 | 待实现 |

---

## 🧪 测试建议

### 手动测试场景

1. **新项目首次切换**
   - 创建新项目
   - 切换到 Builder 模式
   - 验证默认内容正确显示

2. **AI 生成后切换**
   - 让 AI 生成一个页面
   - 切换到 Builder 模式
   - 验证转换后的组件树

3. **编辑后切换回 AI 模式**
   - 在 Builder 模式修改文本
   - 切换回 AI 模式
   - 查看预览是否反映修改
   - 再切换回 Builder 验证修改保持

4. **快速连续切换**
   - 快速连续切换模式多次
   - 验证无错误和重复转换

5. **保存后刷新**
   - 在 Builder 模式编辑
   - 保存项目
   - 刷新页面
   - 验证编辑内容恢复

---

## 📝 关键代码变更

### BuilderCanvas.tsx 防重复转换逻辑

```typescript
// 防止重复转换
const conversionAttemptedRef = useRef(false);
const lastHtmlContentRef = useRef<string | null>(null);

// 在转换前检查
if (conversionAttemptedRef.current && 
    lastHtmlContentRef.current === htmlContent) {
  console.log("[BuilderCanvas] Skipping duplicate conversion attempt");
  return;
}

// 标记转换已尝试
conversionAttemptedRef.current = true;
lastHtmlContentRef.current = htmlContent;
```

### Toolbar.tsx 状态同步逻辑

```typescript
// 切换回 AI 模式前同步
const currentBuilderData = query.serialize();
setBuilderData(currentBuilderData);

const { generateHtmlFromBuilderData } = await import('@/lib/builder/generator');
const generatedHtml = generateHtmlFromBuilderData(JSON.parse(currentBuilderData));

useStudioStore.setState((state) => ({
  htmlContent: fullHtml,
  pages: state.pages.map(p => 
    p.path === state.currentPage 
      ? { ...p, content: fullHtml, content_json: currentBuilderData }
      : p
  )
}));
```

