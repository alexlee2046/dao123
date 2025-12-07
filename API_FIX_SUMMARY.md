# API错误修复总结

## 修复的问题

### 1. 图片加载失败 (400错误) ✅
**问题**: Next.js图片优化功能无法加载Supabase存储的图片
**解决方案**: 在`next.config.ts`中配置了允许的图片域名

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'vvremlrohklddpavxewu.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
    // ... 其他域名
  ],
}
```

### 2. /api/chat 500错误 ✅
**问题**: API调用失败，错误信息不明确
**解决方案**: 
- 添加了详细的错误日志记录
- 改进了积分检查逻辑
- 添加了API密钥验证
- 增强了错误处理和用户反馈

### 3. 导航链接登录提示 ✅
**问题**: iframe中的导航链接无法访问，提示需要登录
**解决方案**: 在`LivePreview.tsx`中添加了`allow-same-origin`和`allow-forms`权限

## 调试工具

### 诊断API
访问以下URL查看系统状态：
```
http://localhost:3006/api/diagnostics
```

这将返回：
- 环境变量配置状态
- 数据库连接状态
- OpenRouter API密钥配置状态
- 用户积分余额

### 控制台日志
现在`/api/chat`会输出详细的日志，包括：
- `[Chat API] User: xxx, Model: xxx, Cost: xxx` - 请求信息
- `[Chat API] User credits: xxx, Required: xxx` - 积分检查
- `[Chat API] API Key source: xxx` - API密钥来源
- `[Chat API] Calling OpenRouter API...` - API调用状态

## 如何使用

### 测试聊天功能
1. 打开开发者工具控制台
2. 在聊天框中输入一条消息
3. 查看：
   - 浏览器控制台的错误信息
   - 终端中的服务器日志（带`[Chat API]`前缀）

### 检查配置
1. 访问 http://localhost:3006/api/diagnostics
2. 检查返回的JSON数据
3. 确认：
   - `environment.hasOpenRouterKey` 或数据库中有API密钥
   - `User Credits` > 0

### 常见问题

#### 积分不足
错误: `积分不足 (当前: X, 需要: Y)`
解决: 前往管理员面板充值用户积分

#### API密钥未配置
错误: `OpenRouter API密钥未配置`
解决: 
1. 访问 http://localhost:3006/admin/settings
2. 配置OpenRouter API Key

#### 用户配置不存在
错误: `用户配置不存在`
解决: 检查数据库中是否存在该用户的profile记录

## 下一步

当你再次测试聊天功能时：
1. 打开浏览器控制台
2. 打开终端查看日志
3. 发送一条测试消息
4. 查看详细的日志输出，定位具体问题
