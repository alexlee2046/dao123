# M3 邮件发送服务 - 已完成

**完成日期**: 2025-12-19

## 实现内容

### 核心模块
- `src/lib/mail/sender.ts` - 邮件发送服务
  - `sendEmail()` - 单封发送
  - `sendBulkEmails()` - 批量发送（带限流）
  - `sendCampaign()` - 发送营销活动
  - `isUnsubscribed()` - 检查退订状态
  - `unsubscribe()` - 添加退订

### API 路由
- `/api/mail/webhook/resend` - Resend 事件回调
- `/api/mail/unsubscribe` - 退订页面（带 UI）

### 数据库更新
- `email_logs` 新增列：message_id, error_message, delivered_at, bounced_at
- `email_unsubscribes` 新表：管理退订列表
- `increment_email_click_count()` 函数

### 功能特性
1. **追踪注入**
   - 打开追踪：1x1 像素图片
   - 点击追踪：链接重写
   
2. **退订机制**
   - 自动添加退订链接
   - 美观的退订确认页面
   - 支持用户请求和投诉自动退订

3. **Webhook 处理**
   - email.sent / delivered / opened / clicked
   - email.bounced / complained
   - 自动更新 campaign 统计

## 环境变量（需配置）
```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@dao123.com
RESEND_WEBHOOK_SECRET=whsec_xxx  # 可选
```

## 下一步
- M4: 自动化引擎（表单触发 → 邮件序列）
