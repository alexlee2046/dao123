# 手动编辑模式增强计划

## 目标
让手动编辑模式能够：
1. 识别 AI 生成内容中的每个模块
2. 提供完备的编辑功能
3. 支持动效定义

---

## Phase 1: 增强 SettingsPanel ✅ 进行中
为每种组件类型提供丰富的编辑选项。

### 1.1 通用属性编辑器
- [x] 基础属性（className, text 等）
- [x] 颜色选择器（背景色、文字色、边框色）
- [x] 间距控制（padding, margin 滑块）
- [x] 尺寸控制（width, height）
- [x] 边框样式（宽度、圆角、样式）
- [x] 阴影设置

### 1.2 组件专属编辑器
- [ ] Text: 字体大小、粗细、行高、对齐
- [ ] Button: 尺寸、圆角、变体预览
- [ ] Image: 尺寸、裁剪方式、圆角
- [ ] Video: 自动播放、循环、静音开关
- [ ] Link: 目标窗口、下划线样式
- [ ] Layout 组件: 间距、对齐、方向选择器
- [ ] Block 组件: 预设主题选择

### 1.3 响应式预览
- [ ] 桌面/平板/手机视图切换
- [ ] 响应式属性覆盖

---

## Phase 2: HTML 智能解析器
将 AI 生成的 HTML 拆分成可编辑的 Craft.js 组件。

### 2.1 解析器核心
- [ ] HTML → AST 解析
- [ ] 语义识别（识别 header, nav, hero, section, footer 等）
- [ ] 组件映射（将 HTML 元素映射到对应的 Builder 组件）

### 2.2 组件映射规则
- `<h1-h6>` → BuilderText (tag: h1-h6)
- `<p>` → BuilderText (tag: p)
- `<a>` → BuilderLink
- `<button>` → BuilderButton
- `<img>` → BuilderImage
- `<video>`, `<iframe[youtube/vimeo]>` → BuilderVideo
- `<nav>` → BuilderNavbar (尝试解析内部结构)
- `<footer>` → BuilderFooter (尝试解析内部结构)
- `<section class="hero">` → BuilderHero
- `<div class="card">` → BuilderCard
- `<div class="flex">` → BuilderRow/Column
- `<div class="grid">` → BuilderGrid
- 其他复杂结构 → CustomHTML (降级)

### 2.3 AI 生成优化
- [ ] 更新 AI prompt，生成更结构化的 HTML
- [ ] 添加 data-component 属性辅助解析

---

## Phase 3: 动效系统
为组件添加动画支持。

### 3.1 入场动画
- [ ] Fade In (淡入)
- [ ] Slide In (滑入 - 上下左右)
- [ ] Zoom In (缩放)
- [ ] Bounce (弹跳)

### 3.2 交互动效
- [ ] Hover 效果（放大、阴影、颜色变化）
- [ ] 点击效果

### 3.3 滚动动画
- [ ] 滚动触发的入场动画
- [ ] 视差效果

### 3.4 实现方式
- 使用 Framer Motion
- 在 SettingsPanel 中添加动画配置选项
- 组件 props 中添加 animation 属性

---

## 执行顺序
1. **Phase 1.1** - 通用属性编辑器（颜色、间距、尺寸）
2. **Phase 1.2** - 组件专属编辑器
3. **Phase 2.1-2.2** - HTML 解析器核心
4. **Phase 2.3** - AI 生成优化
5. **Phase 3** - 动效系统

---

## 当前进度
- [x] 基础组件库已创建
- [ ] **进行中**: Phase 1.1 通用属性编辑器
