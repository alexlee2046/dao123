# 模型定价与积分消耗指南 (Model Pricing & Credits Guide)

*Last Updated: 2025-12-20*

本文档详细列出了系统当前配置的 AI 模型清单、OpenRouter 实际成本以及对应的积分消耗策略。

## 1. 定价策略概述 (Pricing Strategy)

系统采用 **积分 (Credits)** 作为内部计费单位。

*   **汇率基准**: 1 积分 (Credit) ≈ $0.01 USD (约合 ¥0.07 RMB)
*   **计算公式**: `积分消耗 = (API 成本 / $0.01) * 利润率`
*   **目标利润率**: 免费模型 500%+，高端模型 150-500%
*   **促销空间**: 免费层模型有大量促销空间，高端模型谨慎打折

---

## 2. 模型详细清单 (Model List)

### 2.1 聊天模型 (Chat Models)

**计费方式**: 按每次对话回合 (Per Turn) 计费。
*成本基于典型对话 (1K input + 2K output tokens)*

#### 免费层 (Free Tier) - 成本 < $0.002

| 模型 ID | 名称 | OpenRouter 成本 | **积分** | 利润率 | 说明 |
|---------|------|----------------|---------|--------|------|
| `deepseek/deepseek-v3.2` | DeepSeek V3.2 | $0.001 | **1** | 900% | 极致性价比，免费用户首选 |
| `google/gemini-2.5-flash-lite-preview` | Gemini 2.5 Flash Lite | $0.001 | **1** | 900% | Google 轻量级，速度快 |
| `qwen/qwen-2.5-72b-instruct` | Qwen 2.5 72B | $0.0013 | **1** | 669% | 中文能力最强 |

#### 性价比层 (Best Value) - 成本 $0.005-0.01

| 模型 ID | 名称 | OpenRouter 成本 | **积分** | 利润率 | 说明 |
|---------|------|----------------|---------|--------|------|
| `google/gemini-3-flash-preview` | **Gemini 3 Flash** ⭐ | $0.0065 | **5** | 669% | **主力推荐**，12月17日发布，性能超Pro |
| `openai/gpt-5-mini` | GPT-5 Mini | $0.0085 | **8** | 841% | OpenAI 高性价比入门 |

#### 旗舰层 (Flagship) - 成本 $0.02-0.04

| 模型 ID | 名称 | OpenRouter 成本 | **积分** | 利润率 | 说明 |
|---------|------|----------------|---------|--------|------|
| `google/gemini-3-pro-preview` | Gemini 3 Pro | $0.026 | **15** | 477% | 1M 上下文，WebDev Arena 榜首 |
| `anthropic/claude-sonnet-4.5` | Claude Sonnet 4.5 | $0.033 | **20** | 506% | **编程专家**，代码质量最高 |
| `openai/gpt-5.1` | GPT-5.1 | $0.022 | **25** | 1036% | OpenAI 旗舰，综合能力强 |

---

### 2.2 图像生成模型 (Image Models)

**计费方式**: 按每张图片 (Per Image) 计费，**成本随分辨率增加**。

> ⚠️ **重要**: 图像模型按分辨率/百万像素计费，以下成本基于 1K (1024x1024) 分辨率。
> 高分辨率 (2K/4K) 成本会显著增加，建议在产品层面限制输出分辨率。

| 模型 ID | 名称 | 分辨率 | OpenRouter 成本 | **积分** | 利润率 | 说明 |
|---------|------|--------|----------------|---------|--------|------|
| `google/gemini-2.5-flash-image` | Nano Banana | 1K | $0.039 | **8** | 105% | 性价比入门，1290 tokens/张 |
| `google/gemini-3-pro-image-preview` | **Nano Banana Pro** ⭐ | 1K-2K | $0.134 | **20** | 49% | 高质量，文字渲染强 |
| `google/gemini-3-pro-image-preview` | Nano Banana Pro | 4K | $0.24 | **35** | 46% | 4K 高清需额外收费 |
| `black-forest-labs/flux.2-pro` | Flux 2 Pro | 1K | $0.03 | **15** | 400% | 专业级，按百万像素计费 |
| `black-forest-labs/flux.2-pro` | Flux 2 Pro | 2K | $0.075 | **15** | 100% | 2K 分辨率利润较薄 |
| `black-forest-labs/flux.2-max` | Flux 2 Max | 1K | $0.07 | **25** | 257% | 极致画质 |
| `black-forest-labs/flux.2-max` | Flux 2 Max | 4K | $0.16 | **30** | 87% | 4K 商业用途 |

#### 定价策略说明

- **Nano Banana Pro**: 利润率较低 (49%)，但作为主力图像模型，用于吸引用户
- **Flux 系列**: 按百万像素计费，高分辨率成本上升快，建议产品限制为 1K 输出
- **建议**: 前端默认输出 1K 分辨率，2K/4K 作为 Pro 用户专属功能

#### 已移除的模型

| 模型 ID | 原因 |
|---------|------|
| ~~`black-forest-labs/flux-1.1-pro`~~ | **已下架**，被 Flux 2 系列替代 |
| ~~`stabilityai/stable-diffusion-xl`~~ | 2023年老模型，已被完全超越 |
| ~~`openai/gpt-5-image`~~ | 与 Flux 重叠，无明显优势 |

---

### 2.3 视频生成模型 (Video Models)

**状态**: *实验性功能 (Experimental)*。视频 API 可用性需定期验证。

| 模型 ID | 名称 | 估算成本 | **积分** | 说明 |
|---------|------|---------|---------|------|
| `luma/dream-machine` | Luma Dream Machine | $0.30-0.50 | **150** | 暂时禁用，需验证可用性 |
| ~~`runway/gen-3-alpha`~~ | ~~Runway Gen-3~~ | - | - | 已有 Gen-4.5，旧版本不推荐 |

---

## 3. Agent 智能体工作流消耗

| Agent 类型 | 描述 | 主要使用模型 | **积分** |
|------------|------|-------------|---------|
| **Agent Architect** | 架构师，项目规划 | Gemini 3 Pro / GPT-5.1 | **25** |
| **Agent Designer** | 设计师，UI/UX 设计 | GPT-5 / Claude 4.5 | **20** |
| **Agent Builder** | 构建者，代码生成 | DeepSeek / Gemini Flash | **2** |
| **H5 Page Generator** | H5 页面生成 | Gemini 3 Flash | **5** |

---

## 4. 定价变更记录 (Change Log)

### 2025-12-20 (v2) - 图像成本修正

**重大修正** - 图像模型成本重新核算:
> ⚠️ 原成本估算有误 (Nano Banana Pro 误估为 $0.00012，实际 $0.134)，差距达 1000 倍！

**图像模型积分调整:**
- `google/gemini-2.5-flash-image`: 2 → **8** 积分 (成本 $0.039，原估算错误)
- `google/gemini-3-pro-image-preview`: 3 → **20** 积分 (成本 $0.134，原估算错误)
- 默认图像积分: 15 → **20** (安全边际)

**新增分辨率说明:**
- 图像模型按分辨率/百万像素计费
- 高分辨率 (2K/4K) 成本会翻倍
- 建议产品层面限制输出分辨率

---

### 2025-12-20 (v1) 更新

**新增模型:**
- ✅ `google/gemini-3-flash-preview` - 性价比之王，主力推荐
- ✅ `google/gemini-2.5-flash-lite-preview` - 免费层新选项
- ✅ `google/gemini-3-pro-image-preview` - Nano Banana Pro 图像生成
- ✅ `black-forest-labs/flux.2-pro` - 替代已下架的 Flux 1.1
- ✅ `black-forest-labs/flux.2-max` - 极致画质新选项

**移除模型:**
- ❌ `black-forest-labs/flux-1.1-pro` - OpenRouter 已下架
- ❌ `stabilityai/stable-diffusion-xl-beta-v2-2-2` - 2023年老模型
- ❌ `openai/gpt-5-image` - 与 Flux 重叠

**定价调整:**
- `qwen/qwen-2.5-72b-instruct`: 2 → **1** 积分 (与 DeepSeek 齐平)
- `openai/gpt-5-mini`: 5 → **8** 积分 (保护利润)
- `anthropic/claude-sonnet-4.5`: 15 → **20** 积分 (成本较高)
- `openai/gpt-5.1`: 20 → **25** 积分 (旗舰定位)
- `luma/dream-machine`: 200 → **150** 积分 (提升竞争力)

---

## 5. 配置来源说明

1. **代码层默认值 (`src/lib/pricing.ts`)**:
   - 定义核心定价逻辑和保底价格
   - 用于数据库未配置时的后备计算

2. **数据库配置 (`models` 表)**:
   - **优先级最高**，管理后台配置直接写入此处
   - 管理员可随时在 `/admin/models` 调整

3. **推荐配置 (`src/app/[locale]/admin/models/page.tsx`)**:
   - 用于管理后台的"一键导入"功能

---

## 6. OpenRouter 定价来源

- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [Gemini 3 Flash Announcement](https://blog.google/technology/developers/build-with-gemini-3-flash/)
- [Flux 2 Pro on OpenRouter](https://openrouter.ai/black-forest-labs/flux.2-pro)
