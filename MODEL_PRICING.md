# 模型定价与积分消耗指南 (Model Pricing & Credits Guide)

*Last Updated: 2025-12-09*

本文档详细列出了系统当前配置的 AI 模型清单、预估 API 成本以及对应的积分消耗策略。

## 1. 定价策略概述 (Pricing Strategy)

系统采用 **积分 (Credits)** 作为内部计费单位。

*   **汇率基准**: 1 积分 (Credit) ≈ $0.01 USD (约合 ¥0.07 RMB)
*   **计算公式**: `积分消耗 = (API 成本 + 基础设施缓冲) * 利润率`
*   其中，旗舰模型由于支持超长上下文 (1M+ Tokens)，其单次请求的潜在成本波动较大，因此定价包含了高负载请求的缓冲费用。

---

## 2. 模型详细清单 (Model List)

### 2.1 聊天模型 (Chat Models)

**计费方式**: 按每次对话回合 (Per Turn) 计费。
*注：预估 API 成本基于典型混合负载（含部分长上下文或复杂推理），而非仅短文本。*

| 模型 ID (Model ID) | 名称 (Name) | 类型 | 预估 API 成本 | **积分消耗 (Credits)** | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `deepseek/deepseek-v3.2` | DeepSeek V3.2 | Chat | < $0.001 | **1** | **极致性价比** (免费用户可用) |
| `qwen/qwen-2.5-72b-instruct` | Qwen 2.5 72B | Chat | ~$0.002 | **2** | 开源之王，中文能力及指令遵循强 |
| `openai/gpt-5-mini` | GPT-5 Mini | Chat | ~$0.01 - 0.03 | **5** | 高级模型入门款 (高性价比) |
| `anthropic/claude-sonnet-4.5` | Claude Sonnet 4.5 | Chat | ~$0.08 | **15** | **编程专家**，逻辑超越 3.5/3.7 系列 |
| `google/gemini-3-pro-preview` | Gemini 3.0 Pro | Chat | ~$0.08 | **15** | **当前榜首 (LMArena No.1)**，1M 上下文 |
| `openai/gpt-5.1` | GPT-5.1 | Chat | ~$0.15+ | **20** | **OpenAI 旗舰**，综合能力极强 |

### 2.2 视觉与多模态模型 (Vision & Multimodal Models)

**设计理念**: 现代旗舰模型 (如 Gemini 3, GPT-5) 原生具备多模态能力，既能对话也能画图。**不应人为割裂它们的能力。**

#### A. 原生多模态旗舰 (Native Multimodal Flagships)
*这些模型 ID 与聊天模型相同，但在图片生成场景下表现依然顶尖。*

| 模型 ID (Model ID) | 名称 (Name) | 预估 API 成本 | **积分消耗** | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `google/gemini-3-pro-preview` | **Gemini 3.0 Pro** | ~$0.08 | **15** | **全能王者**。物理规律感知强，支持复杂指令绘图。 |
| `anthropic/claude-sonnet-4.5` | **Claude Sonnet 4.5** | ~$0.08 | **15** | **视觉理解**。虽然主要用于代码/文本，但具备极强的图片理解能力。 |
| `openai/gpt-5.1` | **GPT-5.1** | ~$0.15 | **20** | OpenAI 旗舰，多模态理解与生成一体化。 |

#### B. 专业/高效绘图模型 (Specialized & Efficient)
*专门针对图片生成优化的模型，或高性价比选项。*

| 模型 ID (Model ID) | 名称 (Name) | 预估 API 成本 | **积分消耗** | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| `google/gemini-2.5-flash-image` | Gemini 2.5 Flash Image (**Nano Banana**) | ~$0.001 | **2** | **极速/高一致性**。人像与编辑能力极强，成本极低。 |
| `black-forest-labs/flux-1.1-pro` | Flux 1.1 Pro | $0.04 | **25** | **画面极致**。专注于生成超高细节的艺术图像。 |
| `stabilityai/stable-diffusion-xl-beta-v2-2-2` | Stable Diffusion XL | ~$0.05 | **15** | 经典基础绘图模型。 |

### 2.3 视频生成模型 (Video Models)

**状态**: *实验性功能 (Experimental)*。视频生成消耗极大且 API 变动频繁，建议仅对 Pro 用户开放。

| 模型 ID (Model ID) | 名称 (Name) | 类型 | 预估 API 成本 | **积分消耗 (Credits)** | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `luma/dream-machine` | Luma Dream Machine | Video | $0.30 - $0.50 | **200** | 视频生成，消耗较大 (需确认可用性) |
| `runway/gen-3-alpha` | Runway Gen-3 | Video | $0.50+ | **250** | 顶级视频模型 (需确认可用性) |

---

## 3. Agent 智能体工作流消耗

部分高级功能涉及多个模型协同工作（Agentic Workflow），其消耗不仅仅是单次 API 调用。

| Agent 类型 | 描述 | 主要使用模型 | **积分消耗 (Credits)** |
| :--- | :--- | :--- | :--- |
| **Agent Architect** | 架构师智能体，负责项目规划 | GPT-5.1 / Gemini 3 | **30** (每次规划) |
| **Agent Designer** | 设计师智能体，负责 UI/UX 设计 | GPT-5 / Claude 4.5 | **25** (每次设计) |
| **Agent Builder** | 构建者智能体，负责代码生成 | DeepSeek / Qwen | **3** (每代码块) |

---

## 4. 配置来源说明

系统中的模型配置和定价由两部分共同决定：

1.  **代码层默认值 (`src/lib/pricing.ts`)**:
    *   定义了系统的核心定价逻辑和保底价格。
    *   用于在数据库未配置或读取失败时的后备计算。

2.  **数据库配置 (`models` 表)**:
    *   **优先级最高**。管理后台 (`/admin/models`) 的配置直接写入此处。
    *   系统运行时（聊天、生成）会优先读取数据库中的 `cost_per_unit` 字段。
    *   管理员可以随时在后台调整某个模型的积分消耗，无需通过代码审核或重新部署。

3.  **推荐配置 (`src/app/[locale]/admin/models/page.tsx`)**:
    *   仅用于管理后台的“一键导入”功能。
    *   方便管理员快速将上述列表中的模型添加到数据库中。
