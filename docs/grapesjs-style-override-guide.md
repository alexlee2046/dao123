# GrapesJS 样式覆盖指南

> 更新日期: 2025-12-12

## 概述

本文档记录了 dao123 项目中 GrapesJS 编辑器样式定制的方法和最佳实践。所有样式覆盖都在 `src/components/studio/grapes/grapes-overrides.css` 文件中实现。

## 核心问题

GrapesJS 有一套内置的主题系统，使用以下工具类：
- `.gjs-one-bg` - 主背景色
- `.gjs-two-color` - 主文字颜色
- `.gjs-three-bg` - 强调色背景（如选中状态）
- `.gjs-four-color` - 强调色文字

这些类会与我们的设计系统产生冲突，需要通过高优先级选择器覆盖。

## 样式覆盖方法

### 1. 主题工具类覆盖（最高优先级）

```css
/* 放在 CSS 文件最开头 */
.gjs-one-bg {
    background-color: transparent !important;
}

.gjs-two-color {
    color: var(--foreground) !important;
}

.gjs-three-bg {
    background-color: rgba(0, 0, 0, 0.04) !important;
    color: var(--foreground) !important;
}

/* 特定元素覆盖 - 使用更具体的选择器 */
.gjs-clm-tag.gjs-three-bg {
    background-color: transparent !important;
    color: var(--muted-foreground) !important;
}
```

### 2. Class Manager (类管理器) 样式

GrapesJS 的 Class Tag 结构：
```html
<div class="gjs-clm-tag gjs-three-bg">
    <span class="gjs-clm-tag-status"><!-- 复选框 SVG --></span>
    <span id="gjs-clm-tag-label">block</span>
    <span class="gjs-clm-tag-close"><!-- 关闭 SVG --></span>
</div>
```

关键覆盖：
```css
/* 隐藏复选框图标 */
.gjs-clm-tag-status {
    display: none !important;
}

/* 简洁的 tag 样式 */
.gjs-clm-tag {
    background-color: rgba(0, 0, 0, 0.04) !important;
    border-radius: 4px !important;
    padding: 4px 8px !important;
    font-size: 0.7rem !important;
}

/* 悬停时显示关闭按钮 */
.gjs-clm-tag-close {
    display: none !important;
}
.gjs-clm-tag:hover .gjs-clm-tag-close {
    display: flex !important;
}
```

### 3. Style Manager (样式管理器) Sector 手风琴

GrapesJS Sector 结构：
```html
<div class="gjs-sm-sector gjs-sm-sector__general">
    <div class="gjs-sm-sector-title">
        <div class="gjs-sm-sector-caret"><!-- SVG 箭头 --></div>
        <div class="gjs-sm-sector-label">常规</div>
    </div>
    <div class="gjs-sm-properties">...</div>
</div>
```

关键覆盖：
```css
.gjs-sm-sector {
    border: none !important;
    background-color: transparent !important;
}

/* 箭头旋转动画 */
.gjs-sm-sector-caret {
    transition: transform 0.2s !important;
}
.gjs-sm-sector.gjs-sm-open .gjs-sm-sector-caret {
    transform: rotate(0deg) !important;
}
.gjs-sm-sector:not(.gjs-sm-open) .gjs-sm-sector-caret {
    transform: rotate(-90deg) !important;
}
```

### 4. 输入控件样式

Figma 风格的输入框：
```css
.gjs-field input,
.gjs-field select {
    background-color: rgba(0, 0, 0, 0.04) !important;
    border: none !important;
    border-radius: 4px !important;
    height: 28px !important;
    font-size: 0.7rem !important;
}

.gjs-field input:focus,
.gjs-field select:focus {
    outline: 2px solid var(--primary) !important;
    outline-offset: -2px !important;
}
```

### 5. Radio 按钮 - 分段控制样式

```css
.gjs-radio-items {
    display: flex !important;
    background-color: rgba(0, 0, 0, 0.04) !important;
    border-radius: 4px !important;
    padding: 2px !important;
}

.gjs-radio-item {
    background-color: transparent !important;
    flex: 1 !important;
}

.gjs-radio-item.gjs-sm-active {
    background-color: #fff !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
}

/* 隐藏原生 radio */
.gjs-radio-item input[type="radio"] {
    display: none !important;
}
```

### 6. 属性网格布局

```css
.gjs-sm-properties {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 12px !important;
}

/* 复合属性占满两列 */
.gjs-sm-property.gjs-sm-composite,
.gjs-sm-property.gjs-sm-stack,
.gjs-sm-property.gjs-sm-property--full {
    grid-column: span 2;
}
```

## 调试技巧

### 1. 检查 GrapesJS 元素结构
```javascript
// 在浏览器控制台执行
const el = document.querySelector('.gjs-clm-tag');
console.log(el.outerHTML);
```

### 2. 检查计算样式
```javascript
const el = document.querySelector('.gjs-sm-sector');
const styles = window.getComputedStyle(el);
console.log({
    backgroundColor: styles.backgroundColor,
    border: styles.border,
    padding: styles.padding
});
```

### 3. 查找所有 GrapesJS 类名
```javascript
const classes = new Set();
document.querySelectorAll('.gjs-pn-views-container *').forEach(el => {
    el.classList.forEach(c => {
        if (c.startsWith('gjs-')) classes.add(c);
    });
});
console.log(Array.from(classes).sort());
```

## 注意事项

1. **使用 `!important`** - GrapesJS 内联样式优先级很高，几乎所有覆盖都需要 `!important`

2. **选择器特异性** - 当通用覆盖不够时，使用更具体的选择器：
   ```css
   /* 不够具体 */
   .gjs-three-bg { ... }

   /* 更具体 */
   .gjs-clm-tag.gjs-three-bg { ... }
   ```

3. **内联样式** - GrapesJS 会动态添加内联样式（如 `display: none`），这些只能通过 `!important` 覆盖

4. **CSS 变量** - 优先使用设计系统的 CSS 变量：
   ```css
   color: var(--foreground) !important;
   background-color: var(--primary) !important;
   ```

5. **测试所有状态** - 确保测试：
   - 默认状态
   - 悬停状态
   - 选中/激活状态
   - 展开/折叠状态

## 相关文件

- `src/components/studio/grapes/grapes-overrides.css` - 主样式覆盖文件
- `src/components/studio/grapes/GrapesEditor.tsx` - GrapesJS 初始化配置
