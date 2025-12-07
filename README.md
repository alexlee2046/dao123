# Dao123 - AI 驱动的 CMS SaaS 平台

一个面向小白用户的 AI 网站构建平台，灵感来自 Google Stitch。通过简单的自然语言对话，即可秒级生成多页面响应式网站。

![Dao123 Logo](/public/logo.svg)

## 🌟 核心特性

### 🤖 智能构建系统
- **对话式生成**: 集成 Vercel AI SDK + OpenRouter，支持 Claude 3.5 Sonnet、GPT-4o 等模型。
- **所见即所得 (WYSIWYG)**: 实时预览，支持拖拽编辑 (@craftjs/core)。
- **多页面规划**: AI 自动规划站点结构 (首页, 关于, 联系等)。
- **素材感知**: 自动识别并使用用户上传的图片素材。

### 🛠️ 强大的编辑器 (Studio)
- **三栏布局**: AI 聊天 / 实时画布 / 素材管理。
- **响应式设计**: 一键切换桌面/移动端预览。
- **历史记录**: 完整的撤销/重做支持。
- **智能重写**: 选中组件即可让 AI 优化文案或样式。

### 🚀 发布与商业化
- **一键发布**: 支持子域名分配与自动化部署。
- **商业化集成**: 内置 Stripe 支付集成（Credits 系统）。
- **国际化**: 支持多语言 (Next-intl)。

## 📁 项目结构

```
src/
├── app/                  # Next.js App Router
│   ├── (app)/            # 仪表盘与设置 (Dashboard)
│   ├── (marketing)/      # 营销落地页
│   └── studio/           # 核心编辑器 (全屏模式)
├── components/
│   ├── studio/           # 编辑器核心组件 (Canvas, Toolbar)
│   └── ui/               # Shadcn UI 组件库
├── lib/
│   ├── ai/               # AI Prompt与逻辑
│   ├── supabase/         # 数据库与认证客户端
│   └── store.ts          # Zustand 全局状态
└── public/               # 静态资源
```

## 🎨 技术栈

本项目使用最新的现代前端技术栈构建：

- **核心框架**: [Next.js 16](https://nextjs.org) (App Router)
- **语言**: TypeScript
- **UI 框架**: [React 19](https://react.dev)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com)
- **组件库**: [Shadcn UI](https://ui.shadcn.com) (Radix Primitives)
- **编辑器核心**: @craftjs/core
- **AI SDK**: Vercel AI SDK
- **后端/数据库**: [Supabase](https://supabase.com) (PostgreSQL, Auth, Realtime)
- **支付**: Stripe
- **状态管理**: Zustand
- **国际化**: next-intl

## 🚀 部署指南

本项目支持一键部署到 Vercel，并使用 Supabase 作为后端。

### 1. 环境准备
- Node.js 20+
- Git
- Supabase 账号
- Vercel 账号

### 2. 克隆项目
```bash
git clone https://github.com/your-repo/dao123.git
cd dao123
npm install
```

### 3. 配置 Supabase
1. 创建一个新的 Supabase 项目。
2. 获取 Project URL 和 API Keys (Anon Key, Service Role Key)。
3. 在 Supabase SQL Editor 中运行数据库迁移脚本（位于 `migrations/` 目录，或使用 CLI）。
4. 启用 Authentication (Email/Password, OAuth)。

### 4. 配置环境变量
复制 `.env.example` 到 `.env.local` 并填入以下信息：

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3006

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter (AI)
OPENROUTER_API_KEY=your_openrouter_key

# Stripe (Optional)
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### 5. 本地启动
```bash
npm run dev
# 访问 http://localhost:3006
```

### 6. 部署到 Vercel
1. 安装 Vercel CLI: `npm i -g vercel`
2. 链接项目: `vercel link`
3. 配置环境变量: 使用项目根目录下的 `setup_vercel_env.sh` (需先赋予执行权限) 或手动在 Vercel Dashboard 添加。
4. 部署: `vercel deploy --prod`

## 📞 联系方式

如有任何问题、商业合作或建议，请联系：

*   **Email**: alexlee20118@gmail.com

## 📄 许可证

**PolyForm Noncommercial License 1.0.0**

本项目仅供非商业用途学习与研究。如需商业使用，请通过邮箱联系作者授权。
