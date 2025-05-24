/**
 * 全局设置加载器
 * 用于在整个应用程序中加载用户设置
 */

// 默认设置
const DEFAULT_SETTINGS = {
    ui: {
        theme: 'dark',
        fontSize: 16,
        animations: true,
        highContrast: false
    },
    audio: {
        volume: 0.8,
        noteDelay: 400,
        answerDelay: 1000,
        autoPlayNext: true,
        soundEffects: true
    },
    music: {
        startingDifficulty: 0,
        melodyLength: 3,
        pointsPerCorrect: 10,
        showHints: true
    },
    games: {
        gameSpeed: 5,
        vibrationFeedback: true,
        snakeColor: 'green',
        tetrisRotationSystem: 'classic'
    },
    forum: {
        showAvatars: true,
        commentsPerPage: 10,
        defaultSort: 'newest'
    }
};

// 定义全局设置对象
let globalSettings = {};

/**
 * 加载用户设置
 * @returns {Object} 合并后的用户设置
 */
function loadUserSettings() {
    try {
        const storedSettings = localStorage.getItem('userSettings');
        if (storedSettings) {
            const parsedSettings = JSON.parse(storedSettings);
            
            // 深度合并设置，确保所有新添加的配置项也包含在内
            globalSettings = {
                ui: { ...DEFAULT_SETTINGS.ui, ...(parsedSettings.ui || {}) },
                audio: { ...DEFAULT_SETTINGS.audio, ...(parsedSettings.audio || {}) },
                music: { ...DEFAULT_SETTINGS.music, ...(parsedSettings.music || {}) },
                games: { ...DEFAULT_SETTINGS.games, ...(parsedSettings.games || {}) },
                forum: { ...DEFAULT_SETTINGS.forum, ...(parsedSettings.forum || {}) }
            };
            
            // 应用设置
            applySettings(globalSettings);
            return globalSettings;
        }
    } catch (error) {
        console.error('加载设置时出错:', error);
    }
    
    // 如果没有保存的设置或出错，使用默认设置
    globalSettings = { ...DEFAULT_SETTINGS };
    applySettings(globalSettings);
    return globalSettings;
}

/**
 * 保存用户设置
 * @param {Object} settings 要保存的设置对象
 */
function saveUserSettings(settings) {
    try {
        localStorage.setItem('userSettings', JSON.stringify(settings || globalSettings));
        
        // 应用设置
        if (settings) {
            globalSettings = settings;
            applySettings(globalSettings);
        }
        
        return true;
    } catch (error) {
        console.error('保存设置时出错:', error);
        return false;
    }
}

/**
 * 应用设置到当前页面
 * @param {Object} settings 要应用的设置
 */
function applySettings(settings) {
    // 应用UI设置
    document.body.classList.toggle('light-theme', settings.ui.theme === 'light');
    document.body.classList.toggle('high-contrast', settings.ui.highContrast);
    document.documentElement.style.fontSize = settings.ui.fontSize + 'px';
    
    // 应用其他设置逻辑可以在这里添加
    // ...
}

/**
 * 获取特定设置值
 * @param {string} category 设置分类
 * @param {string} key 设置键名
 * @param {any} defaultValue 默认值
 * @returns {any} 设置值或默认值
 */
function getSetting(category, key, defaultValue) {
    if (!globalSettings[category]) return defaultValue;
    return globalSettings[category][key] !== undefined ? globalSettings[category][key] : defaultValue;
}

/**
 * 更新单个设置值
 * @param {string} category 设置分类
 * @param {string} key 设置键名
 * @param {any} value 设置值
 * @returns {boolean} 是否更新成功
 */
function updateSetting(category, key, value) {
    if (!globalSettings[category]) return false;
    
    globalSettings[category][key] = value;
    saveUserSettings(globalSettings);
    
    return true;
}

/**
 * 重置所有设置为默认值
 */
function resetAllSettings() {
    globalSettings = { ...DEFAULT_SETTINGS };
    saveUserSettings(globalSettings);
    applySettings(globalSettings);
    return globalSettings;
}

// 在页面加载时初始化设置
document.addEventListener('DOMContentLoaded', () => {
    loadUserSettings();
});

// 导出全局对象
window.settingsManager = {
    loadUserSettings,
    saveUserSettings,
    getSetting,
    updateSetting,
    resetAllSettings,
    settings: globalSettings
}; 