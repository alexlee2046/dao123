#!/bin/bash

# 子域名功能测试脚本
echo "🧪 测试子域名功能..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
PASS=0
FAIL=0

# 测试函数
test_subdomain() {
    local subdomain=$1
    local expected=$2
    local description=$3
    
    echo -n "测试: $description ... "
    
    # 调用 API
    result=$(curl -s -X POST http://localhost:3000/api/subdomain/check \
        -H "Content-Type: application/json" \
        -d "{\"subdomain\":\"$subdomain\"}")
    
    if echo "$result" | grep -q "\"available\":$expected"; then
        echo -e "${GREEN}✓ 通过${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗ 失败${NC}"
        echo "  预期: available=$expected"
        echo "  实际: $result"
        ((FAIL++))
    fi
}

# 检查开发服务器是否运行
echo "检查开发服务器状态..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo -e "${RED}✗ 开发服务器未运行${NC}"
    echo ""
    echo "请先启动开发服务器："
    echo "  npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ 开发服务器正在运行${NC}"
echo ""

# 运行测试
echo "开始测试子域名验证..."
echo ""

# 有效的子域名
test_subdomain "my-site" "true" "有效的子域名"
test_subdomain "alex-portfolio" "true" "有效的子域名（带连字符）"
test_subdomain "blog2024" "true" "有效的子域名（带数字）"
test_subdomain "cool-app-123" "true" "有效的子域名（混合）"

echo ""
echo "测试无效的子域名..."
echo ""

# 无效的子域名
test_subdomain "ab" "false" "太短的子域名"
test_subdomain "www" "false" "保留字 (www)"
test_subdomain "api" "false" "保留字 (api)"
test_subdomain "-mysite" "false" "以连字符开头"
test_subdomain "mysite-" "false" "以连字符结尾"
test_subdomain "my--site" "false" "连续连字符"
test_subdomain "My-Site" "false" "包含大写字母"

echo ""
echo "========================================="
echo "测试结果:"
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo "========================================="

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}❌ 部分测试失败${NC}"
    exit 1
fi
