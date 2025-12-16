# 多渠道线索搜索集成计划

> 集成类似 laifaxin.com 的多渠道客户搜索功能，支持邮箱查找、验证、LinkedIn 数据丰富等功能。

---

## 📋 项目概览

**目标**: 在联系人管理模块中集成多渠道搜索功能，帮助用户高效开发客户

**核心渠道**:
- Hunter.io (邮箱查找 & 验证) ✅ 已有 API Key
- Apollo.io (B2B 综合数据库)
- Proxycurl (LinkedIn 数据)
- Google 搜索 (公司信息)

**用户 API Keys**:
- Hunter.io: `7ec98a5dfbbe387b945810766d2e05ad3762a510`

---

## Phase 1: Hunter.io 基础集成 ✅ 已完成核心功能

**预计时间**: 1-2 天
**优先级**: 🔴 高

### 1.1 API 服务层搭建 ✅ 完成
- [x] 创建 `/src/lib/services/lead-search/` 目录结构
- [x] 创建 Hunter.io API 客户端 `hunter.ts`
  - [x] 邮箱查找 (Email Finder)
  - [x] 域名搜索 (Domain Search)
  - [x] 邮箱验证 (Email Verifier)
  - [x] 邮箱计数 (Email Count)
- [x] 创建统一的 API 响应类型 `types.ts`
- [x] 添加环境变量 `HUNTER_API_KEY`

### 1.2 后端 API 路由 ✅ 使用 Server Actions 替代
- [x] 创建 Server Actions `/src/lib/actions/lead-search/hunter.ts`
  - [x] `searchDomain` - 按域名搜索所有邮箱
  - [x] `findEmail` - 按姓名+域名查找邮箱
  - [x] `verifyEmail` - 验证单个邮箱
  - [x] `verifyEmails` - 批量验证邮箱
  - [x] `getEmailCount` - 获取域名邮箱数量
  - [x] `getAccountInfo` - 获取账户配额信息

### 1.3 前端 UI 组件 ✅ 完成
- [x] 创建 `LeadSearchPanel.tsx` 搜索面板组件
  - [x] 域名搜索表单
  - [x] 姓名+公司搜索表单
  - [x] 邮箱验证表单
  - [x] 搜索结果列表
- [x] 创建 `EmailVerifyBadge` 验证状态徽章 (内置在 LeadSearchPanel)
- [x] 在 `ContactsPageClient.tsx` 中集成搜索入口
- [x] 添加搜索结果导入到联系人功能

### 1.4 数据库集成 ⏸️ 待开始
- [ ] 更新 contacts 表，添加 `email_verified` 字段
- [ ] 添加 `email_source` 字段 (记录来源: hunter, apollo 等)
- [ ] 创建搜索历史表 `lead_search_history`


---

## Phase 2: Apollo.io 集成

**预计时间**: 2-3 天
**优先级**: 🟠 中高

### 2.1 API 客户端
- [ ] 注册 Apollo.io 账户并获取 API Key
- [ ] 创建 Apollo API 客户端 `apollo.ts`
  - [ ] 人员搜索 (People Search)
  - [ ] 公司搜索 (Organization Search)
  - [ ] 数据丰富 (Enrichment)
- [ ] 添加环境变量 `APOLLO_API_KEY`

### 2.2 后端 API 路由
- [ ] 创建 `/api/lead-search/apollo/` 路由
  - [ ] `POST /api/lead-search/apollo/people` - 搜索人员
  - [ ] `POST /api/lead-search/apollo/companies` - 搜索公司
  - [ ] `POST /api/lead-search/apollo/enrich` - 数据丰富
- [ ] 实现搜索过滤器 (行业、职位、地区、公司规模)

### 2.3 前端 UI
- [ ] 扩展 `LeadSearchPanel.tsx` 支持 Apollo 搜索
- [ ] 添加高级筛选器 UI
- [ ] 添加公司信息卡片组件
- [ ] 添加联系人详情抽屉

---

## Phase 3: Proxycurl LinkedIn 集成

**预计时间**: 2-3 天
**优先级**: 🟡 中

### 3.1 API 客户端
- [ ] 注册 Proxycurl 账户
- [ ] 创建 Proxycurl API 客户端 `proxycurl.ts`
  - [ ] 个人资料查询 (Person Profile)
  - [ ] 公司资料查询 (Company Profile)
  - [ ] 职位搜索 (Role Search)
- [ ] 添加环境变量 `PROXYCURL_API_KEY`

### 3.2 后端 API 路由
- [ ] 创建 `/api/lead-search/linkedin/` 路由
  - [ ] `POST /api/lead-search/linkedin/profile` - 获取个人资料
  - [ ] `POST /api/lead-search/linkedin/company` - 获取公司资料
  - [ ] `POST /api/lead-search/linkedin/search` - 搜索人员

### 3.3 前端 UI
- [ ] 添加 LinkedIn 资料卡片组件
- [ ] 在联系人详情中显示 LinkedIn 信息
- [ ] 添加 LinkedIn URL 输入和解析

---

## Phase 4: 统一搜索引擎

**预计时间**: 3-4 天
**优先级**: 🟡 中

### 4.1 统一搜索层
- [ ] 创建 `UnifiedSearchService.ts` 统一搜索服务
  - [ ] 聚合多渠道搜索结果
  - [ ] 结果去重和合并
  - [ ] 置信度评分
- [ ] 实现搜索策略配置
- [ ] 添加结果缓存 (Redis/内存)

### 4.2 智能搜索 UI
- [ ] 创建 `SmartSearchBar.tsx` 智能搜索栏
- [ ] 自动识别搜索意图 (公司名、人名、邮箱、域名)
- [ ] 搜索建议和自动补全
- [ ] 搜索历史记录

### 4.3 批量操作
- [ ] 批量邮箱验证功能
- [ ] 批量数据丰富功能
- [ ] 导出搜索结果 (CSV/Excel)
- [ ] 批量导入到联系人

---

## Phase 5: 高级功能

**预计时间**: 2-3 天
**优先级**: 🟢 低

### 5.1 邮箱验证增强
- [ ] 集成 ZeroBounce 作为备用验证
- [ ] 实时验证指示器
- [ ] 验证结果缓存

### 5.2 公司信息自动补全
- [ ] 按域名自动获取公司信息
- [ ] 公司 Logo 自动获取
- [ ] 行业分类自动识别

### 5.3 搜索配额管理
- [ ] API 配额使用统计
- [ ] 配额告警通知
- [ ] 多账户轮换 (可选)

---

## 📁 文件结构规划

```
src/
├── lib/
│   ├── services/
│   │   └── lead-search/
│   │       ├── index.ts           # 统一导出
│   │       ├── types.ts           # 通用类型定义
│   │       ├── hunter.ts          # Hunter.io 客户端
│   │       ├── apollo.ts          # Apollo.io 客户端
│   │       ├── proxycurl.ts       # Proxycurl 客户端
│   │       └── unified-search.ts  # 统一搜索服务
│   └── actions/
│       └── lead-search/
│           ├── hunter.ts          # Hunter Server Actions
│           ├── apollo.ts          # Apollo Server Actions
│           └── linkedin.ts        # LinkedIn Server Actions
├── app/
│   └── api/
│       └── lead-search/
│           ├── hunter/
│           │   ├── find/route.ts
│           │   ├── domain/route.ts
│           │   └── verify/route.ts
│           ├── apollo/
│           │   ├── people/route.ts
│           │   └── companies/route.ts
│           └── linkedin/
│               └── profile/route.ts
└── components/
    └── mail/
        └── contacts/
            ├── LeadSearchPanel.tsx    # 搜索面板
            ├── LeadSearchResults.tsx  # 搜索结果
            ├── EmailVerifyBadge.tsx   # 验证徽章
            ├── CompanyCard.tsx        # 公司卡片
            └── LinkedInProfile.tsx    # LinkedIn 资料
```

---

## 🔐 环境变量

```env
# Hunter.io
HUNTER_API_KEY=7ec98a5dfbbe387b945810766d2e05ad3762a510

# Apollo.io (待获取)
APOLLO_API_KEY=

# Proxycurl (待获取)
PROXYCURL_API_KEY=

# ZeroBounce (可选)
ZEROBOUNCE_API_KEY=
```

---

## 📊 进度追踪

| Phase | 状态 | 进度 | 预计完成 |
|-------|------|------|----------|
| Phase 1: Hunter.io | ✅ 核心完成 | 85% | 2025-12-16 |
| Phase 2: Apollo.io | ⏸️ 待开始 | 0% | - |
| Phase 3: Proxycurl | ⏸️ 待开始 | 0% | - |
| Phase 4: 统一搜索 | ⏸️ 待开始 | 0% | - |
| Phase 5: 高级功能 | ⏸️ 待开始 | 0% | - |

---

## 🎯 当前任务

**已完成**:
- ✅ Hunter.io API 客户端 (域名搜索、邮箱查找、邮箱验证)
- ✅ Server Actions 封装
- ✅ 前端搜索面板 UI
- ✅ 联系人页面集成

**下一步可选**:
1. Phase 1.4 - 数据库集成 (添加验证状态字段)
2. Phase 2 - 集成 Apollo.io (需要先获取 API Key)
3. Phase 3 - 集成 Proxycurl LinkedIn (需要先获取 API Key)

---

## 📝 备注

1. Hunter.io 免费版每月 25 次请求，付费版 $49/月起
2. Apollo.io 免费版每月 100 积分
3. Proxycurl 按请求计费，$10 起步
4. 建议先用免费额度测试，确认需求后再升级
