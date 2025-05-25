// 主题切换功能
document.addEventListener('DOMContentLoaded', function() {
    // 如果存在settingsManager，则使用其设置
    if (window.settingsManager) {
        try {
            const settings = window.settingsManager.loadUserSettings();
            if (settings && settings.ui) {
                const isLightTheme = settings.ui.theme === 'light';
                document.body.classList.toggle('light-theme', isLightTheme);
                updateThemeIcon(isLightTheme);
                
                // 应用高对比度设置（如果有）
                if (settings.ui.highContrast) {
                    document.body.classList.add('high-contrast');
                }
                
                // 监听系统主题切换
                const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
                prefersDarkScheme.addEventListener('change', (e) => {
                    // 只在用户没有明确设置主题时跟随系统
                    if (!settings.ui.theme || settings.ui.theme === 'system') {
                        const isDark = e.matches;
                        document.body.classList.toggle('light-theme', !isDark);
                        updateThemeIcon(!isDark);
                        
                        // 更新设置
                        window.settingsManager.updateSetting('ui', 'theme', isDark ? 'dark' : 'light');
                    }
                });
                
                // 创建主题切换按钮
                createThemeToggleButton(isLightTheme);
                
                console.log('主题设置已从settingsManager加载');
                return; // 使用了settingsManager，不需要执行后续代码
            }
        } catch (error) {
            console.error('加载主题设置时出错:', error);
            // 如果出错，将继续使用默认逻辑
        }
    }
    
    // 以下是原始功能，当settingsManager不可用时使用
    // 检查用户是否已有保存的主题偏好
    const savedTheme = localStorage.getItem('theme');
    
    // 如果没有保存的主题，则检查系统偏好设置
    if (!savedTheme) {
        // 检查系统是否偏好暗色主题
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        if (prefersDarkScheme.matches) {
            document.body.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
            updateThemeIcon(false);
        } else {
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            updateThemeIcon(true);
        }
        
        // 监听系统主题切换
        prefersDarkScheme.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) { // 只有当用户没有明确设置主题时才跟随系统
                const isDark = e.matches;
                document.body.classList.toggle('light-theme', !isDark);
                updateThemeIcon(!isDark);
            }
        });
    } else {
        // 应用保存的主题
        document.body.classList.toggle('light-theme', savedTheme === 'light');
        updateThemeIcon(savedTheme === 'light');
    }
    
    // 创建主题切换按钮
    createThemeToggleButton(savedTheme === 'light');
    
    // 向同源内嵌iframe发送主题更改
    sendThemeToIframes();
    
    // 接收来自父窗口的主题更改消息
    receiveThemeMessages();
});

// 创建主题切换按钮
function createThemeToggleButton(isLightTheme) {
    // 如果页面上还没有主题切换按钮，则创建一个
    if (!document.querySelector('.theme-toggle')) {
        const themeToggleBtn = document.createElement('button');
        themeToggleBtn.className = 'theme-toggle';
        themeToggleBtn.setAttribute('aria-label', '切换明暗主题');
        themeToggleBtn.innerHTML = isLightTheme ? '🌙' : '☀️';
        document.body.appendChild(themeToggleBtn);
        
        // 添加点击事件监听器
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// 向同源内嵌iframe发送主题更改
function sendThemeToIframes() {
    const iframes = document.querySelectorAll('iframe');
    if (iframes.length > 0) {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        iframes.forEach(iframe => {
            try {
                if (iframe.src.startsWith(window.location.origin)) {
                    iframe.contentWindow.postMessage({ type: 'theme-change', theme: currentTheme }, window.location.origin);
                }
            } catch (e) {
                console.error('无法向iframe发送主题更改:', e);
            }
        });
    }
}

// 接收主题更改消息
function receiveThemeMessages() {
    window.addEventListener('message', (event) => {
        if (event.origin === window.location.origin && 
            event.data && 
            event.data.type === 'theme-change') {
            document.body.classList.toggle('light-theme', event.data.theme === 'light');
            updateThemeIcon(event.data.theme === 'light');
        }
    });
}

// 切换主题
function toggleTheme() {
    const isLightTheme = document.body.classList.toggle('light-theme');
    
    // 如果有settingsManager，则使用其保存设置
    if (window.settingsManager) {
        try {
            window.settingsManager.updateSetting('ui', 'theme', isLightTheme ? 'light' : 'dark');
            console.log('主题设置已更新到settingsManager');
        } catch (error) {
            console.error('更新主题设置时出错:', error);
            // 如果出错，退回到使用localStorage
            localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
        }
    } else {
        // 否则保存到localStorage
        localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
    }
    
    // 更新主题图标
    updateThemeIcon(isLightTheme);
    
    // 向同源内嵌iframe发送主题更改
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        try {
            if (iframe.src.startsWith(window.location.origin)) {
                iframe.contentWindow.postMessage(
                    { type: 'theme-change', theme: isLightTheme ? 'light' : 'dark' }, 
                    window.location.origin
                );
            }
        } catch (e) {
            console.error('无法向iframe发送主题更改:', e);
        }
    });
}

// 更新主题切换按钮图标
function updateThemeIcon(isLightTheme) {
    const themeToggleBtn = document.querySelector('.theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = isLightTheme ? '🌙' : '☀️'; // 亮主题显示月亮图标，暗主题显示太阳图标
    }
} 