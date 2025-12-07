<p align="center">
  <img src="/public/logo.svg" alt="Dao123 Logo" width="120" />
</p>

<h1 align="center">Dao123</h1>

<p align="center">
  <strong>AI Website Builder - Create Professional Websites in Seconds</strong>
</p>

<p align="center">
  <a href="./README.md">中文</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-features">Features</a> ·
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> ·
  <a href="#-deployment">Deploy</a>
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

**No-code AI website generator** inspired by Google Stitch. Build professional multi-page responsive websites in seconds through natural language conversations. Perfect for portfolios, landing pages, and business websites.

> 💡 **Recommended AI Models**: Gemini 3 Pro / DeepSeek V3 for best results

## ✨ Features

### 🤖 AI-Powered Generation
- **Conversational Creation** - Describe your vision, AI builds your complete website
- **Smart Multi-Page Planning** - Auto-generates Home, About, Products, Contact pages
- **Asset-Aware** - Upload images, AI intelligently places them in context
- **Multi-Model Support** - OpenRouter integration: Gemini, DeepSeek, GPT-4o, Claude

### 🎨 Visual Editor
- **WYSIWYG Editing** - Drag-and-drop with real-time preview
- **Responsive Design** - Toggle desktop/tablet/mobile views instantly
- **Component Library** - Pre-built blocks: Hero, Features, Pricing, FAQ, Testimonials
- **Style Customization** - Fine-tune colors, fonts, spacing after AI generation

### 🚀 One-Click Publishing
- **Instant Subdomain** - Get `yoursite.dao123.com` automatically
- **Custom Domains** - Connect your own domain
- **SEO Ready** - Auto-generated meta tags and sitemap

### 💼 Business Ready
- **User Authentication** - Complete signup, login, and profile management
- **Credits System** - Built-in Stripe payments with usage-based billing
- **Community Showcase** - Public gallery for user projects

## 🎯 Use Cases

| Scenario | Examples |
|----------|----------|
| Personal Branding | Portfolio, Resume, Personal Homepage |
| Small Business | Company Website, Product Pages |
| Marketing | Landing Pages, Launch Pages |
| Creators | Course Pages, Knowledge Products |

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19 + Tailwind CSS 4 |
| **Components** | Shadcn UI (Radix Primitives) |
| **Editor** | @craftjs/core (Visual Drag-Drop) |
| **AI** | Vercel AI SDK + OpenRouter |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **Payments** | Stripe |
| **State** | Zustand |
| **i18n** | next-intl |

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── (app)/            # User Dashboard
│   ├── (marketing)/      # Marketing Pages
│   └── studio/           # AI Editor (Core)
├── components/
│   ├── studio/           # Editor (Canvas, Toolbar, Chat)
│   ├── builder/          # Page Blocks (Hero, Features, Pricing...)
│   └── ui/               # Shadcn UI Components
├── lib/
│   ├── ai/               # AI Prompt Engineering
│   ├── supabase/         # Database Client
│   └── store.ts          # Zustand State
└── public/               # Static Assets
```

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- Supabase Account
- OpenRouter API Key (or other AI providers)

### Local Development

```bash
# Clone the repository
git clone https://github.com/alexlee2046/dao123.git
cd dao123

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

Visit http://localhost:3006 to get started.

### Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3006

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_key

# Stripe (Optional)
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Fork this repository to your GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Configure environment variables
4. Click Deploy

### Supabase Setup

1. Create a [Supabase](https://supabase.com) project
2. Run SQL scripts from `migrations/` directory
3. Enable Email + OAuth authentication

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

- **Email**: alexlee20118@gmail.com
- **Issues**: [GitHub Issues](https://github.com/alexlee2046/dao123/issues)

## 📄 License

**PolyForm Noncommercial License 1.0.0**

This project is for non-commercial use only. For commercial licensing, please contact the author.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/alexlee2046">alexlee2046</a>
</p>
