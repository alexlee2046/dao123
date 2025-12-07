#!/bin/bash

# 一键部署子域名功能 - 快速启动脚本
# 使用方法：bash scripts/setup-subdomain.sh

echo "🚀 开始配置子域名功能..."
echo ""

# 检查环境变量
echo "📋 步骤 1/3: 检查环境变量"
if [ -f .env.local ]; then
    echo "✅ .env.local 文件已存在"
    
    if grep -q "NEXT_PUBLIC_BASE_DOMAIN" .env.local; then
        echo "✅ NEXT_PUBLIC_BASE_DOMAIN 已配置"
    else
        echo "📝 添加 NEXT_PUBLIC_BASE_DOMAIN 到 .env.local"
        echo "" >> .env.local
        echo "# 子域名配置" >> .env.local
        echo "NEXT_PUBLIC_BASE_DOMAIN=dao123.me" >> .env.local
    fi
else
    echo "⚠️  .env.local 文件不存在，请先创建并配置 Supabase 环境变量"
    exit 1
fi

echo ""
echo "📊 步骤 2/3: 数据库迁移"
echo ""
echo "请按照以下步骤操作："
echo ""
echo "1. 访问 Supabase Dashboard: https://app.supabase.com"
echo "2. 选择你的项目"
echo "3. 进入 SQL Editor"
echo "4. 复制并运行文件: migrations/add_subdomain_support.sql"
echo ""
read -p "完成迁移后按 Enter 继续..."

echo ""
echo "🔍 步骤 3/3: 验证安装"
echo ""

# 检查必需的文件
files=(
    "src/lib/subdomain.ts"
    "src/app/api/subdomain/check/route.ts"
    "src/components/studio/PublishModal.tsx"
    "migrations/add_subdomain_support.sql"
)

all_files_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 缺失"
        all_files_exist=false
    fi
done

echo ""
if [ "$all_files_exist" = true ]; then
    echo "✅ 所有文件已就绪！"
    echo ""
    echo "🎉 配置完成！"
    echo ""
    echo "下一步："
    echo "1. 启动开发服务器: npm run dev"
    echo "2. 访问编辑器: http://localhost:3006/studio/new"
    echo "3. 点击发布按钮测试子域名功能"
    echo ""
    echo "📚 更多信息请查看:"
    echo "  - IMPLEMENTATION_SUMMARY.md (实现总结)"
    echo "  - SUBDOMAIN_DEPLOYMENT_GUIDE.md (部署指南)"
    echo "  - VERCEL_SUBDOMAIN_SOLUTION.md (技术方案)"
else
    echo "❌ 部分文件缺失，请检查安装"
    exit 1
fi
