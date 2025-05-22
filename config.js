/**
 * 应用程序配置文件
 * 定义各种可配置的设置及其默认值
 */
document.addEventListener('DOMContentLoaded', () => {
    // 默认配置
    const defaultConfig = {
        audio: {
            volume: 0.8,                // 音量 (0-1)
            noteDelay: 400,             // 音符间隔时间 (毫秒)
            correctAnswerDelay: 1000,   // 答案反馈延迟 (毫秒)
            autoPlayNextNote: true,     // 回答正确后自动播放下一个音符
            highlightDuration: 500      // 高亮持续时间 (毫秒)
        },
        game: {
            startingDifficulty: 0,      // 初始难度 (0=基础, 1=进阶, 2=扩展)
            defaultMelodyLength: 3,     // 默认旋律长度
            pointsPerCorrect: 10,       // 每个正确答案的分数
            showHints: true             // 是否显示提示
        },
        ui: {
            theme: 'light',             // 主题 (light, dark)
            fontSize: 'medium',         // 字体大小 (small, medium, large)
            compactMode: false,         // 紧凑模式
            animationsEnabled: true     // 是否启用动画
        },
        accessibility: {
            colorBlindMode: false,      // 色盲模式
            highContrast: false,        // 高对比度
            keyboardShortcuts: true     // 启用键盘快捷键
        }
    };

    // 尝试从本地存储中加载配置
    let appConfig;
    try {
        const savedConfig = localStorage.getItem('musicAppConfig');
        if (savedConfig) {
            // 将保存的配置与默认配置合并
            appConfig = {
                ...defaultConfig,
                ...JSON.parse(savedConfig)
            };
            
            // 确保所有新添加的配置项也包含在内
            if (!appConfig.audio) appConfig.audio = defaultConfig.audio;
            else appConfig.audio = {...defaultConfig.audio, ...appConfig.audio};
            
            if (!appConfig.game) appConfig.game = defaultConfig.game;
            else appConfig.game = {...defaultConfig.game, ...appConfig.game};
            
            if (!appConfig.ui) appConfig.ui = defaultConfig.ui;
            else appConfig.ui = {...defaultConfig.ui, ...appConfig.ui};
            
            if (!appConfig.accessibility) appConfig.accessibility = defaultConfig.accessibility;
            else appConfig.accessibility = {...defaultConfig.accessibility, ...appConfig.accessibility};
        } else {
            appConfig = defaultConfig;
        }
    } catch (error) {
        console.error('加载配置时出错:', error);
        appConfig = defaultConfig;
    }

    // 保存配置到本地存储
    function saveConfig() {
        try {
            localStorage.setItem('musicAppConfig', JSON.stringify(appConfig));
            console.log('配置已保存');
        } catch (error) {
            console.error('保存配置时出错:', error);
        }
    }

    // 重置配置为默认值
    function resetConfig() {
        appConfig = {...defaultConfig};
        saveConfig();
        return appConfig;
    }

    // 更新单个配置项
    function updateConfig(category, setting, value) {
        if (appConfig[category] && appConfig[category][setting] !== undefined) {
            appConfig[category][setting] = value;
            saveConfig();
            return true;
        }
        return false;
    }

    // 将配置对象和管理函数暴露给全局
    window.appConfig = appConfig;
    window.configManager = {
        saveConfig,
        resetConfig,
        updateConfig
    };
}); 