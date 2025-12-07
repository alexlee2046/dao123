<p align="center">
  <img src="/public/logo.svg" alt="Dao123 Logo" width="120" />
</p>

<h1 align="center">Dao123</h1>

<p align="center">
  <strong>AI-Powered Website Builder & CMS Platform</strong>
</p>

<p align="center">
  <a href="./README_EN.md">English</a> ·
  <a href="#%EF%B8%8F-快速开始">快速开始</a> ·
  <a href="#-核心特性">核心特性</a> ·
  <a href="#-技术栈">技术栈</a> ·
  <a href="#-部署指南">部署</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI-Vercel_SDK-000?logo=vercel" alt="Vercel AI SDK" />
</p>

---

面向普通用户的 **AI 网站生成器**，灵感源自 Google Stitch。通过简单的自然语言对话，秒级生成专业级多页面响应式网站。零代码基础即可创建个人主页、作品集、落地页。

> 💡 **实测推荐**: Gemini 2.5 Pro / DeepSeek V3 表现最佳

## ✨ 核心特性

### 🤖 AI 驱动生成
- **对话式创建** - 描述你的需求，AI 自动生成完整网站
- **智能多页规划** - 自动生成首页、关于、产品、联系等页面结构  
- **素材感知** - 上传图片，AI 智能识别并应用到合适位置
- **多模型支持** - 集成 OpenRouter，同步支持 Gemini、DeepSeek、GPT-4o 等最新模型

### 🎨 可视化编辑器
- **所见即所得** - 拖拽式编辑，实时预览效果
- **响应式设计** - 一键切换桌面/平板/手机视图
- **组件系统** - 丰富的预设组件：Hero、特性展示、定价表、FAQ 等
- **样式微调** - AI 生成后可手动调整颜色、字体、间距

### 🚀 一键发布
- **子域名分配** - 自动分配 `yoursite.dao123.com` 域名
- **自定义域名** - 支持绑定自有域名
- **SEO 友好** - 自动生成 meta 标签、sitemap

### 💼 商业化就绪
- **用户系统** - 完整的注册、登录、个人中心
- **积分系统** - 内置 Stripe 支付，按量计费
- **社区展示** - 用户作品公开展示，互相学习

## 🎯 适用场景

| 场景 | 示例 |
|------|------|
| 个人品牌 | 个人主页、简历网站、作品集 |
| 小型企业 | 公司官网、产品介绍页 |
| 营销推广 | 活动落地页、产品发布页 |
| 创作者经济 | 知识付费页面、课程介绍 |

## 🛠️ 技术栈

| 分类 | 技术 |
|------|------|
| **框架** | Next.js 16 (App Router) |
| **语言** | TypeScript 5 |
| **UI** | React 19 + Tailwind CSS 4 |
| **组件** | Shadcn UI (Radix Primitives) |
| **编辑器** | @craftjs/core (拖拽可视化) |
| **AI** | Vercel AI SDK + OpenRouter |
| **后端** | Supabase (PostgreSQL + Auth) |
| **支付** | Stripe |
| **状态管理** | Zustand |
| **国际化** | next-intl |

## 📁 项目结构

```
src/
├── app/                  # Next.js App Router
│   ├── (app)/            # 用户仪表盘
│   ├── (marketing)/      # 营销落地页
│   └── studio/           # AI 编辑器 (核心)
├── components/
│   ├── studio/           # 编辑器组件 (Canvas, Toolbar, Chat)
│   ├── builder/          # 页面构建组件 (Hero, Features, Pricing...)
│   └── ui/               # Shadcn UI 基础组件
├── lib/
│   ├── ai/               # AI Prompt 工程
│   ├── supabase/         # 数据库客户端
│   └── store.ts          # Zustand 状态管理
└── public/               # 静态资源
```

## ⚡️ 快速开始

### 环境要求
- Node.js 20+
- Supabase 账号
- OpenRouter API Key (或其他 AI 服务)

### 本地运行

```bash
# 克隆项目
git clone https://github.com/alexlee2046/dao123.git
cd dao123

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必要配置

# 启动开发服务器
npm run dev
```

访问 http://localhost:3006 开始使用。

### 环境变量

```env
# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3006

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_key

# Stripe (可选)
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

## 🚀 部署指南

### Vercel 部署 (推荐)

1. Fork 本项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量
4. 点击 Deploy

### Supabase 配置

1. 创建 [Supabase](https://supabase.com) 项目
2. 运行 `migrations/` 中的 SQL 脚本
3. 启用 Email + OAuth 认证

## 📞 联系方式

- **Email**: alexlee20118@gmail.com
- **Issues**: [GitHub Issues](https://github.com/alexlee2046/dao123/issues)

## 📄 许可证

**PolyForm Noncommercial License 1.0.0**

本项目仅供非商业用途学习与研究。商业使用请联系作者获取授权。
