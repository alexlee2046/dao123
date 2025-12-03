# OpenRouter AI 集成指南

## ✅ 已集成功能

### 1. **Vercel AI SDK**
- 使用 `ai` 包 (最新版本)
- 流式响应支持
- OpenRouter 完全集成

### 2. **OpenRouter 配置**
- 支持 **60+ 顶级 AI 模型** (2025年12月最新):
  
  **🔥 2025年顶级推荐**
  - Claude Opus 4.5 (最强代码) ⭐⭐⭐
  - Claude Sonnet 4.5 (代码首选) ⭐⭐
  - Gemini 2.5 Pro (最新多模态) ⭐⭐
  - Grok Code Fast 1 (编程王者) ⭐⭐
  
  **OpenAI 系列**
  - GPT-4o, GPT-4o Mini
  - O1, O1 Mini (推理模型)
  
  **Google Gemini 系列 (2025)**
  - Gemini 2.5 Pro, Gemini 2.5 Flash
  - Gemini 2.0 Flash (免费)
  
  **Meta Llama 4 系列 (2025新)**
  - Llama 4 Maverick (256K上下文)
  - Llama 4 Scout, Llama 4 Behemoth
  
  **DeepSeek 系列 (2025更新)**
  - DeepSeek V3.2 (性价比王)
  - DeepSeek Coder (代码专用)
  
  **xAI Grok 系列 (2025)**
  - Grok Code Fast 1, Grok 4.1 Fast (免费)
  
  **Moonshot AI (2025新)**
  - Kimi K2 Thinking (推理)
  - Kimi Linear (长文本)
  
  **Amazon Nova (2025新)**
  - Nova Premier 1.0 (多模态)
  
  以及 Mistral, Qwen, Cohere, NVIDIA 等更多模型...

### 3. **本地存储**
- API Key 安全存储在浏览器 localStorage
- 不会上传到服务器
- 支持用户自定义模型选择

## 🚀 使用步骤

### 步骤 1: 获取 OpenRouter API Key
1. 访问 [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. 注册或登录账号
3. 创建新的 API Key
4. 复制 API Key (格式: `sk-or-v1-...`)

### 步骤 2: 配置 API Key
1. 启动应用: `npm run dev`
2. 访问 http://localhost:3000
3. 点击侧边栏的 "设置"
4. 在 "OpenRouter API 配置" 部分：
   - 粘贴你的 API Key
   - 选择 AI 模型（推荐 Claude 3.5 Sonnet）
   - 点击 "保存配置"

### 步骤 3: 开始使用 AI
1. 进入 Dashboard
2. 点击 "创建新网站"
3. 在 Studio 编辑器的左侧聊天框中：
   - 描述你想要的网站，例如：
     * "创建一个现代化的咖啡店落地页"
     * "做一个作品集网站，包含作品展示区和联系方式"
     * "设计一个 SaaS 产品的定价页面"
4. AI 会实时流式生成 HTML 代码
5. 代码会自动在右侧预览窗口显示

### 步骤 4: 使用素材
1. 在右侧素材管理器拖拽上传图片
2. 在聊天框中提到这些素材，例如：
   - "使用我上传的 Logo 创建导航栏"
   - "把我上传的图片添加到 Hero 区域"
3. AI 会自动在生成的代码中使用这些素材的 URL

## 📁 技术实现

### API 路由
**文件**: `src/app/api/chat/route.ts`

```typescript
// 使用 OpenRouter 的 OpenAI 兼容 API
const openrouter = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://openrouter.ai/api/v1',
});

// 流式响应
const response = await openrouter.chat.completions.create({
  model: model,
  messages: [systemMessage, ...messages],
  stream: true,
});
```

### 聊天组件
**文件**: `src/components/studio/ChatAssistant.tsx`

```typescript
// 使用 Vercel AI SDK 的 useChat hook
const { messages, append, isLoading } = useChat({
  api: '/api/chat',
  body: {
    apiKey: openRouterApiKey,
    model: selectedModel,
  },
  onFinish: (message) => {
    // 自动提取并设置 HTML 到预览
    setHtmlContent(message.content);
  },
});
```

### 状态管理
**文件**: `src/lib/store.ts`

```typescript
// API Key 和模型选择存储在 Zustand + localStorage
openRouterApiKey: typeof window !== 'undefined' 
  ? localStorage.getItem('openRouterApiKey') || '' 
  : '',
selectedModel: 'anthropic/claude-3.5-sonnet',
```

## 💡 使用技巧

### 1. **精确描述**
越详细的描述，AI 生成的结果越准确：
- ❌ "做一个网站"
- ✅ "创建一个深色主题的作品集网站，包含顶部导航、Hero 区域展示我的作品、技能标签云、联系表单"

### 2. **素材优先**
先上传素材再开始对话，AI 会主动使用：
- 上传 Logo → AI 会在导航栏使用
- 上传产品图 → AI 会在 Hero/特性区域使用
- 上传团队照片 → AI 会在关于我们区域使用

### 3. **迭代优化**
如果第一次结果不满意，继续对话：
- "把背景色改成深蓝色"
- "增加一个 CTA 按钮"
- "让导航栏变成透明的"

### 4. **模型选择**
- **Claude Opus 4.5**: 2025年最强代码生成，推荐首选！
- **Claude Sonnet 4.5**: 速度更快，质量依然顶级
- **Grok Code Fast 1**: xAI 的编程专用模型，速度极快
- **Gemini 2.5 Pro**: Google 最新多模态模型
- **GPT-4o**: OpenAI 旗舰，平衡性好
- **免费选择**: Gemini 2.0 Flash, Grok 4.1 Fast, Qwen3 Coder 480B

## 🔧 故障排除

### 问题 1: "请先配置 API Key"
**解决方案**: 
- 检查设置页面是否已保存 API Key
- 确认 API Key 格式正确 (`sk-or-v1-...`)

### 问题 2: AI 不响应
**解决方案**:
- 检查 OpenRouter 账户余额
- 尝试切换到其他模型
- 检查浏览器控制台是否有错误

### 问题 3: 生成的代码不显示
**解决方案**:
- 确保 AI 返回的是完整的 HTML 文档
- 检查是否包含 `<!DOCTYPE html>` 标签
- 查看浏览器控制台的错误信息

## 📊 成本估算

OpenRouter 按使用量计费：
- **Claude 3.5 Sonnet**: ~$3/1M tokens
- **GPT-4o**: ~$2.5/1M tokens
- **Gemini Pro 1.5**: 免费配额 + $0.7/1M tokens

平均一个网站生成大约使用 2000-5000 tokens，成本 < $0.02

## 🎯 下一步优化

- [ ] 添加对话历史保存
- [ ] 支持多轮对话上下文
- [ ] 添加代码预览模式切换
- [ ] 集成图片生成 API (DALL-E/Midjourney)
- [ ] 支持自定义 System Prompt
