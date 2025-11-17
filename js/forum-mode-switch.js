/**
 * 主页论坛/博客模式切换功能
 */

(function() {
    // 模式配置
    const MODES = {
        forum: {
            title: '社区论坛',
            icon: '💬',
            buttonText: '进入论坛',
            description: '我们的社区论坛是一个交流和分享的平台，您可以：',
            features: [
                '分享游戏技巧和高分攻略',
                '讨论音乐学习心得和练习方法',
                '提出建议或报告问题',
                '与其他用户交流互动'
            ],
            url: 'forum/forum.html'
        },
        blog: {
            title: '作者博客',
            icon: '📝',
            buttonText: '进入博客',
            description: '作者的个人博客，分享技术文章和生活感悟：',
            features: [
                '阅读作者的技术文章和教程',
                '了解项目开发心得和经验',
                '查看最新的更新和公告',
                '与作者互动交流'
            ],
            url: 'forum/forum.html#blog'
        }
    };

    // 当前模式
    let currentMode = 'forum';

    /**
     * 初始化
     */
    function init() {
        // 从LocalStorage加载上次的模式选择
        const savedMode = localStorage.getItem('homepage_forum_mode');
        if (savedMode && MODES[savedMode]) {
            currentMode = savedMode;
        }

        // 更新UI
        updateUI();

        // 绑定事件
        bindEvents();
    }

    /**
     * 绑定事件
     */
    function bindEvents() {
        const titleElement = document.getElementById('forumModeTitle');
        if (titleElement) {
            titleElement.style.cursor = 'pointer';
            titleElement.addEventListener('click', toggleMode);
        }
    }

    /**
     * 切换模式
     */
    function toggleMode() {
        currentMode = currentMode === 'forum' ? 'blog' : 'forum';
        localStorage.setItem('homepage_forum_mode', currentMode);
        updateUI();
    }

    /**
     * 更新UI显示
     */
    function updateUI() {
        const config = MODES[currentMode];
        
        // 更新标题和图标
        const titleElement = document.getElementById('forumModeTitle');
        const iconElement = document.getElementById('forumModeIcon');
        if (titleElement) titleElement.textContent = config.title;
        if (iconElement) iconElement.textContent = config.icon;

        // 更新按钮文字和链接
        const buttonElement = document.getElementById('forumEnterButton');
        if (buttonElement) {
            buttonElement.textContent = config.buttonText;
            buttonElement.href = config.url;
        }

        // 更新描述文字
        const descElement = document.getElementById('forumDescription');
        if (descElement) descElement.textContent = config.description;

        // 更新功能列表
        const featuresElement = document.getElementById('forumFeaturesList');
        if (featuresElement) {
            featuresElement.innerHTML = config.features
                .map(feature => `<li>${feature}</li>`)
                .join('');
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
