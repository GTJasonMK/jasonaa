#!/bin/bash

# 自动生成版本信息脚本
# 使用方法：在提交前运行 ./update-version.sh 或 bash update-version.sh

echo "正在生成版本信息..."

# 获取Git信息
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
COMMIT_MSG=$(git log -1 --format=%s 2>/dev/null || echo "首次提交")
COMMIT_DATE=$(git log -1 --format=%ai 2>/dev/null || echo "未知时间")
CURRENT_TIME=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)

# 创建js目录（如果不存在）
mkdir -p js

# 生成version.js文件
cat > js/version.js << EOF
/**
 * 自动生成的版本信息
 * 生成时间: ${CURRENT_TIME}
 * 请勿手动修改此文件
 */

window.VERSION_INFO = {
    commits: ${COMMIT_COUNT},
    hash: '${COMMIT_HASH}',
    message: '${COMMIT_MSG}',
    date: '${COMMIT_DATE}',
    generated: '${CURRENT_TIME}'
};

// 在控制台打印版本信息
(function() {
    const info = window.VERSION_INFO;
    console.log('%c🚀 部署版本信息', 'font-size: 16px; color: #4CAF50; font-weight: bold; padding: 4px 0;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4CAF50;');
    console.log('%c📊 提交次数: %c第 ' + info.commits + ' 次提交', 'color: #666; font-weight: bold;', 'color: #2196F3; font-weight: bold;');
    console.log('%c🔖 提交哈希: %c' + info.hash, 'color: #666; font-weight: bold;', 'color: #FF9800;');
    console.log('%c📝 提交信息: %c' + info.message, 'color: #666; font-weight: bold;', 'color: #9C27B0;');
    console.log('%c🕐 提交时间: %c' + info.date, 'color: #666; font-weight: bold;', 'color: #009688;');
    console.log('%c⚙️  生成时间: %c' + info.generated, 'color: #666; font-weight: bold;', 'color: #795548;');
    console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #4CAF50;');
    console.log('%c💡 提示: 如果这是最新提交，说明部署成功！', 'color: #4CAF50; font-style: italic;');
})();
EOF

echo "✅ 版本信息已生成到 js/version.js"
echo "📊 当前是第 ${COMMIT_COUNT} 次提交"
echo "🔖 提交哈希: ${COMMIT_HASH}"
echo ""
echo "接下来请执行："
echo "  git add js/version.js"
echo "  git commit -m \"你的提交信息\""
echo "  git push"
