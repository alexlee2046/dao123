# StitchClone - AI 驱动的 CMS SaaS 平台

一个面向小白用户的无代码网站构建平台，灵感来自 Google Stitch。

## 🌟 核心特性

### 已完成功能

#### Phase 1: 基础架构
- ✅ Next.js 14 + TypeScript + Tailwind CSS
- ✅ Shadcn UI 组件库
- ✅ Zustand 状态管理
- ✅ 响应式布局设计

#### Phase 2: Studio 编辑器
- ✅ **三栏布局**
  - 左侧：AI 对话助手（**集成 Vercel AI SDK + OpenRouter**）
  - 中间：实时预览窗口（支持移动端/桌面端切换）
  - 右侧：素材管理器
- ✅ **智能对话助手**
  - 🎉 **真实 AI 集成**（OpenRouter）
  - 支持多种模型（Claude 3.5 Sonnet、GPT-4o、Gemini 等）
  - 流式响应
  - 素材感知（AI 会主动使用用户上传的图片）
- ✅ **实时预览**
  - 支持移动端/桌面端视图切换
  - 带动画的设备切换效果
  - Sandbox 安全渲染
- ✅ **撤销/重做功能**
  - 完整的历史记录管理
  - 支持快捷键操作

#### Phase 3: 模板与灵感
- ✅ **灵感广场**
  - 视觉化的模板画廊
  - 社区模板展示
  - 点赞和标签系统
- ✅ **Remix 功能**
  - 一键克隆模板到编辑器
  - 4+ 预设模板（作品集、咖啡店、SaaS、博客）

#### Phase 4: 发布与分享
- ✅ **素材库**
  - 拖拽上传图片
  - 图片预览和管理
  - AI 自动识别并使用素材
- ✅ **发布到网络**
  - 子域名分配
  - 模拟部署流程
  - 进度条反馈
- ✅ **分享功能**
  - 链接复制
  - 邮件分享
  - 社交媒体集成（占位）

## 🚀 快速开始

### 安装依赖
\`\`\`bash
npm install
\`\`\`

### 启动开发服务器
\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
\`\`\`bash
npm run build
npm start
\`\`\`

## 📁 项目结构

\`\`\`
src/
├── app/
│   ├── (app)/              # 主应用路由（带侧边栏）
│   │   ├── dashboard/      # 我的网站仪表盘
│   │   ├── inspiration/    # 灵感广场
│   │   └── settings/       # 设置页面
│   ├── (marketing)/        # 营销页面（无侧边栏）
│   │   └── page.tsx        # 落地页
│   └── studio/             # Studio 编辑器（全屏）
│       ├── [siteId]/       # 编辑器页面
│       └── remix/          # 模板克隆页面
├── components/
│   ├── studio/             # Studio 相关组件
│   │   ├── Toolbar.tsx     # 工具栏
│   │   ├── ChatAssistant.tsx  # AI 助手
│   │   ├── LivePreview.tsx    # 预览窗口
│   │   ├── AssetManager.tsx   # 素材管理器
│   │   ├── PublishModal.tsx   # 发布对话框
│   │   └── ShareModal.tsx     # 分享对话框
│   ├── shared/             # 共享组件
│   │   └── Sidebar.tsx     # 侧边栏导航
│   └── ui/                 # Shadcn UI 组件
└── lib/
    ├── store.ts            # Zustand 全局状态
    └── utils.ts            # 工具函数
\`\`\`

## 🎨 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: Shadcn UI (Radix Primitives)
- **状态管理**: Zustand + localStorage
- **AI 集成**: Vercel AI SDK + OpenRouter
- **图标**: Lucide React
- **布局**: React Resizable Panels

## 🔮 待实现功能

### Phase 5: 高级功能
- [ ] 高级模式切换（显示代码编辑器）
- [ ] 自定义域名绑定
- [ ] SEO 自动优化（AI 生成 meta 标签）
- [x] 真实的 AI 模型接入（OpenRouter）✅
- [ ] Supabase 后端集成（认证、数据库、存储）
- [ ] 真实的网站部署（Vercel/Netlify）

## 💡 使用示例

### 1. 配置 OpenRouter API Key

**首次使用必须配置！**

1. 访问 [OpenRouter](https://openrouter.ai/keys) 获取 API Key
2. 进入应用的 "设置" 页面
3. 粘贴 API Key 并选择模型（推荐 Claude 3.5 Sonnet）
4. 点击保存

详细步骤请查看 [OPENROUTER_GUIDE.md](./OPENROUTER_GUIDE.md)

### 2. 创建新网站

1. 进入 Dashboard
2. 点击 "创建新网站"
3. 进入 Studio 编辑器

### 3. 使用 AI 生成网站

在左侧聊天框输入需求，例如：

**示例 1 - 咖啡店落地页:**
```
创建一个现代化的咖啡店落地页，要求：
- 深棕色和米色配色
- 顶部有透明导航栏
- Hero 区域有大标题和 CTA 按钮
- 三个特色产品卡片
- 底部联系信息
```

**示例 2 - 作品集网站:**
```
设计一个设计师作品集网站：
- 深色主题
- 大标题展示我的名字和职业
- 网格布局展示 6 个作品
- 每个作品悬停时显示名称
- 底部有社交媒体链接
```

**示例 3 - 使用素材:**
```
使用我上传的 logo.png 创建一个导航栏，
然后添加 Hero 区域，使用我的 hero-image.jpg
```

### 4. 上传素材

1. 在右侧素材管理器拖拽上传图片
2. AI 会自动识别并在生成时使用这些图片

### 5. 预览和调整

- 使用工具栏的移动端/桌面端切换查看不同设备效果
- 使用撤销/重做按钮调整历史版本
- 继续对话优化细节："把背景色改成深蓝色"

### 6. 发布网站

- 点击工具栏的 "发布" 按钮（当前为模拟功能）
- 设置子域名
- 一键发布到网络

## 🎯 设计理念

- **面向小白用户**: 隐藏技术细节，提供直观的可视化界面
- **AI 优先**: 用自然语言描述需求，AI 负责生成代码
- **素材感知**: AI 会主动识别和使用用户上传的素材
- **即时反馈**: 所有操作都有实时的视觉反馈
- **容错性**: 支持撤销/重做，用户可以放心尝试

## 📝 注意事项

### AI 功能相关
- ✅ AI 功能已完全集成（Vercel AI SDK + OpenRouter）
- ⚠️ **需要配置 OpenRouter API Key 才能使用**（免费注册即可获取）
- 💰 OpenRouter 按使用量计费，但价格很低（~$0.01/次生成）
- 🎯 推荐模型：Claude 3.5 Sonnet（代码质量最高）

### 其他功能
- 发布和分享功能目前是前端模拟，需要后端支持才能真正部署
- 建议配合真实的部署服务（如 Vercel、Netlify）使用以获得完整体验

### 快速开始
1. `npm install` - 安装依赖
2. `npm run dev` - 启动开发服务器
3. 访问 http://localhost:3000/settings - 配置 OpenRouter API Key
4. 开始创建！🎉

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
