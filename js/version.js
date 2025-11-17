/**
 * 自动生成的版本信息
 * 生成时间: 2025-11-17T20:28:25+08:00
 * 请勿手动修改此文件
 */

window.VERSION_INFO = {
    commits: 117,
    hash: 'ee045d4',
    message: '重大改进：博客真正像博客了，默认进入论坛',
    date: '2025-11-17 15:01:50 +0800',
    generated: '2025-11-17T20:28:25+08:00'
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
