# M1 表单构建器 - 已完成

**完成日期**: 2025-12-19

## 实现内容

### 数据库
- `forms` 表 - 表单定义（fields, settings, status）
- `form_submissions` 表 - 提交记录（data, metadata, contact_id）
- RLS 策略 - 用户隔离 + 匿名提交
- 触发器 - updated_at 自动更新、submission_count 自增

### 后端
- `src/lib/actions/forms.ts` - Server Actions (createForm, getForms, getForm, updateForm, deleteForm, duplicateForm, submitForm, getFormSubmissions)
- `src/app/api/forms/submit/route.ts` - 公开 API（速率限制 10req/min/IP）
- 联系人同步 - 自动创建/更新 contacts 表

### 前端
- `src/components/studio/grapes/plugins/lead-form-plugin.ts` - GrapesJS 插件
- 3 种预设表单：Lead Capture、Newsletter、Contact
- 可配置：formId, successMessage, buttonColor, buttonText

## 技术决策
- 选择 GrapesJS 集成方案（轻量级）而非 Formbricks（重量级）
- 使用 `project_id` 关联项目（非 site_id）
- 表单提交使用 service role 绕过 RLS

## 待优化
- [ ] 表单管理 UI 页面
- [ ] 拖拽字段自定义
- [ ] Webhook 触发
- [ ] 文件上传字段
