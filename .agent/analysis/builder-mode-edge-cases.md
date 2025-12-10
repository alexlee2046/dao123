# Builder 模式切换 - 边界情况与测试场景

## 🧪 测试场景矩阵

### 场景 1: 新项目首次切换 (最常见)

**初始状态**:
- `htmlContent`: 默认欢迎页面
- `builderData`: `null`
- `isBuilderMode`: `false`

**期望行为**:
1. 用户点击 "手动编辑"
2. 检测到 `builderData` 为空
3. 调用 `convertHtmlToCraft(htmlContent)`
4. 转换成功，设置 `builderData`
5. 切换到 Builder 模式
6. BuilderCanvas 加载数据
7. 显示转换后的组件树

**可能问题**:
- 默认 HTML 可能包含不支持的标签
- 转换可能失败，触发 fallback

---

### 场景 2: AI 生成后首次切换

**初始状态**:
- `htmlContent`: AI 生成的复杂 HTML
- `builderData`: `null` (被 ChatAssistant 清除)
- `isBuilderMode`: `false`

**期望行为**:
与场景 1 类似，但 HTML 更复杂

**可能问题**:
- AI 生成的 HTML 可能包含复杂的 SVG、Canvas、Script
- 这些会被转换为 CustomHTML 组件
- 用户可能期望更细粒度的编辑能力

---

### 场景 3: 已编辑过的项目重新切换

**初始状态**:
- `htmlContent`: 与 builderData 同步的 HTML
- `builderData`: 有效的 JSON 字符串
- `isBuilderMode`: `false`

**期望行为**:
1. 检测到 `builderData` 有效
2. 不调用转换
3. 直接切换模式
4. BuilderCanvas 加载已有数据

**可能问题**:
- 如果 htmlContent 与 builderData 不同步怎么办？
- 应该以哪个为准？

---

### 场景 4: Builder 模式编辑后切换回 AI 模式

**过程**:
1. 用户在 Builder 模式编辑组件
2. 修改了一些属性
3. 点击切换回 AI 模式
4. **此时 builderData 是否已保存？**

**代码分析**:
```typescript
// Toolbar.tsx toggleBuilderMode
toggleBuilderMode: () => set((state) => ({ isBuilderMode: !state.isBuilderMode }))
```

切换时**没有**自动保存 builderData！

**问题**: 如果用户编辑后直接切换，然后 AI 生成新内容（清除 builderData），再切换回 Builder 模式，之前的编辑会丢失。

**修复方案**:
```typescript
// 在切换回 AI 模式前，应该自动同步 builderData
if (isBuilderMode) {
  // 同步当前 Builder 状态到 store
  const currentBuilderData = query.serialize();
  setBuilderData(currentBuilderData);
  
  // 同时生成 HTML 以保持同步
  const html = generateHtmlFromBuilderData(JSON.parse(currentBuilderData));
  setHtmlContent(html);
}
toggleBuilderMode();
```

---

### 场景 5: builderData 存在但 ROOT.nodes 为空

**初始状态**:
```json
{
  "ROOT": {
    "type": { "resolvedName": "BuilderContainer" },
    "nodes": [],
    "props": { "className": "..." }
  }
}
```

**代码逻辑** (Toolbar.tsx 第 318-319 行):
```typescript
isBasicallyEmpty = !parsed.ROOT || 
  (parsed.ROOT.nodes && parsed.ROOT.nodes.length === 0);
```

会被判定为空，触发转换。**这是正确的行为**。

---

### 场景 6: builderData 包含无效节点

**初始状态**:
```json
{
  "ROOT": { "type": { "resolvedName": "BuilderContainer" }, "nodes": ["node1"] },
  "node1": { "type": null }  // 无效类型
}
```

**代码逻辑** (BuilderCanvas.tsx 第 29-35 行):
```typescript
for (const [nodeId, node] of Object.entries(dataToLoad)) {
  const nodeData = node as any;
  if (!nodeData.type || !nodeData.type.resolvedName) {
    console.warn(`Node ${nodeId} has invalid type, skipping deserialization`);
    return;  // 完全跳过加载
  }
}
```

**问题**: 如果有一个无效节点，整个加载会被跳过，画布显示默认内容。

**改进方案**:
```typescript
// 过滤无效节点而不是完全放弃
const validData: any = {};
for (const [nodeId, node] of Object.entries(dataToLoad)) {
  const nodeData = node as any;
  if (nodeData.type && nodeData.type.resolvedName) {
    validData[nodeId] = nodeData;
  } else {
    console.warn(`Skipping invalid node: ${nodeId}`);
  }
}
// 修复 parent/children 引用
// ...
actions.deserialize(JSON.stringify(validData));
```

---

## 🔬 转换算法详细分析

### HTML → Craft JSON 转换流程 (parser-server.ts)

```
输入 HTML:
<body class="bg-gray-100 p-8">
  <div class="container mx-auto">
    <h1 class="text-4xl font-bold mb-4">Hello World</h1>
    <p class="text-gray-600">Description text here</p>
    <button class="btn bg-blue-500 text-white px-4 py-2">Click Me</button>
  </div>
</body>

处理步骤:

1. cheerio.load(html) 解析 DOM

2. 初始化 ROOT 节点
   - type: BuilderContainer
   - props: 从 body 类解析
   - nodes: []

3. 遍历 body.contents()

4. 处理 div.container
   ├─ 识别为通用容器
   ├─ 调用 parseTailwindClasses("container mx-auto")
   │   ├─ "container" → 未识别，放入 remainingClasses
   │   └─ "mx-auto" → 解析为 margin { left: 'auto', right: 'auto' }
   ├─ 创建 BuilderContainer 节点
   └─ 递归处理子节点

5. 处理 h1
   ├─ 标签在 ['h1'...'h6', 'p', 'span', 'li', 'blockquote'] 中
   ├─ 检查 hasOnlyTextChildren() → true
   ├─ 创建 BuilderText 节点
   │   ├─ text: "Hello World"
   │   ├─ tagName: "h1" ⚠️ 应该是 tag!
   │   └─ props: 解析后的样式
   └─ 返回节点 ID

6. 处理 p
   └─ 类似 h1 处理

7. 处理 button
   ├─ 标签是 'button'
   ├─ 创建 BuilderButton 节点
   │   ├─ text: "Click Me"
   │   ├─ href: "#"
   │   └─ props: 解析后的样式
   └─ 返回节点 ID

输出 JSON 结构:
{
  "ROOT": {
    "id": "ROOT",
    "type": { "resolvedName": "BuilderContainer" },
    "props": { ... },
    "nodes": ["abc123"],
    "isCanvas": true
  },
  "abc123": {
    "id": "abc123",
    "type": { "resolvedName": "BuilderContainer" },
    "props": { "margin": {...}, "className": "container" },
    "nodes": ["def456", "ghi789", "jkl012"],
    "parent": "ROOT",
    "isCanvas": true
  },
  "def456": {
    "type": { "resolvedName": "BuilderText" },
    "props": { "text": "Hello World", "tagName": "h1", ... },
    "nodes": [],
    "parent": "abc123"
  },
  // ...
}
```

### Tailwind 解析算法关键点 (tailwindParser.ts)

**优先级系统**:
```
p-4     → specificity = 1 (affects all sides)
px-4    → specificity = 2 (affects left + right)
pt-4    → specificity = 3 (affects only top)

规则: 高优先级覆盖低优先级
```

**响应式处理**:
```
输入: "p-4 md:p-8 lg:p-12"

解析结果:
- baseAcc (mobile): p-4 → { padding: '16px' all sides }
- mdAcc (tablet): p-8 → { padding: '32px' all sides }
- lgAcc (desktop): p-12 → { padding: '48px' all sides }

最终 props:
{
  padding: { top: '48px', right: '48px', bottom: '48px', left: '48px' },  // desktop
  responsiveStyles: {
    tablet: { padding: { ... '32px' ... } },
    mobile: { padding: { ... '16px' ... } }
  }
}
```

**已知限制**:
1. 颜色解析简化 (只支持 white/black/transparent)
2. 任意值 `[xxx]` 部分支持
3. 复杂选择器 (hover:, focus:, dark:) 保留为 className

---

## 📊 状态同步问题深入分析

### 三个数据源的关系

```
┌─────────────────────────────────────────────────────────────┐
│                      Store (Zustand)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  htmlContent ◄────────► builderData ◄────────► Craft.js    │
│  (HTML字符串)          (JSON字符串)           (内部状态)     │
│                                                              │
│      ▲                      ▲                    ▲          │
│      │                      │                    │          │
│      │     convertHtmlToCraft()                  │          │
│      └──────────────────────┼────────────────────┘          │
│                             │                               │
│      generateHtmlFromBuilderData()                          │
│      └──────────────────────┘                               │
│                                                              │
│  ⚠️ 问题: 三者可能不同步！                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 不同步场景

**场景 A**: AI 生成新 HTML
```
操作: AI在聊天中生成新页面
结果: 
  - htmlContent ← 新内容
  - builderData ← null (被清除)
  - Craft.js ← 未更新 (不在 Builder 模式)
```

**场景 B**: 用户在 Builder 编辑
```
操作: 用户拖拽、修改属性
结果:
  - Craft.js ← 实时更新
  - builderData ← 未更新 (除非手动保存)
  - htmlContent ← 未更新
```

**场景 C**: 保存项目
```
操作: 用户点击保存
代码 (Toolbar.tsx handleSave):
  1. query.serialize() → builderContent
  2. setBuilderData(builderContent)
  3. generateHtmlFromBuilderData() → finalHtml
  4. 发送到后端

结果: 三者同步 ✅
```

**结论**: 需要在更多场景下自动同步，而不仅仅是保存时。

---

## 🐛 已发现的实际 Bug

### Bug 1: tagName vs tag 不一致

**复现步骤**:
1. 打开一个新项目
2. 在 AI 模式让 AI 生成一个简单页面，包含标题和段落
3. 切换到 Builder 模式
4. 查看 H1 标题的属性面板

**预期**: 属性面板显示正确的标签类型
**实际**: 可能无法正确识别标签类型

**原因**:
```typescript
// parser-server.ts 设置的是:
props: { tagName: "h1", ... }

// BuilderText 组件期望的是:
interface BuilderTextProps {
  tag?: 'h1' | 'h2' | ...;  // 不是 tagName
}
```

### Bug 2: Fallback JSON 中 isCanvas 错误

**复现步骤**:
1. 导入一个包含复杂 JavaScript 的 HTML
2. 转换失败，触发 fallback
3. 切换到 Builder 模式
4. 尝试在 CustomHTML 组件内拖入其他组件

**预期**: 无法拖入 (CustomHTML 不是容器)
**实际**: 可能可以拖入，导致异常

**原因**:
```typescript
// Toolbar.tsx fallback 设置了:
"fallback-node": {
  "isCanvas": true,  // 错误!
  // ...
}
```

### Bug 3: 双重转换日志

**复现步骤**:
1. 打开浏览器开发者工具 Console
2. 加载一个新项目
3. 切换到 Builder 模式
4. 观察日志

**预期**: 只有一次 "Conversion successful" 日志
**实际**: 可能出现两次相同的转换日志

---

## 🔧 环境相关问题

### 服务端 vs 客户端执行

`convertHtmlToCraft` 是一个 Server Action (`'use server'`)，在服务端执行。

**潜在问题**:
- 服务端没有 `window` 对象
- 使用 cheerio 而不是 DOMParser (已正确处理)
- 但某些 Tailwind 任意值可能依赖运行时计算

### Craft.js 版本兼容性

检查 `package.json` 中的 @craftjs/core 版本，确保:
1. `actions.deserialize()` API 兼容
2. `query.serialize()` 返回格式一致
3. `useNode` hook 行为符合预期

---

## 📋 测试清单

### 单元测试需求

- [ ] `parseTailwindClasses()` 各种输入
- [ ] `parseHtmlToBuilderJson()` 各种 HTML 结构
- [ ] `generateHtmlFromBuilderData()` 往返测试
- [ ] 状态同步逻辑

### 集成测试需求

- [ ] AI 生成 → 切换 Builder → 编辑 → 保存 → 刷新 → 验证
- [ ] 复杂 HTML 转换往返一致性
- [ ] 响应式样式在不同设备预览下正确显示

### E2E 测试需求

- [ ] 完整用户流程模拟
- [ ] 错误恢复场景
- [ ] 并发操作 (快速切换模式)

