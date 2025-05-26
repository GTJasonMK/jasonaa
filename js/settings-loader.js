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
    },
    // 新增各游戏特定设置
    tetris: {
        // 速度等级配置
        baseLevelSpeed: 1000, // 1级的基础速度(毫秒)
        speedDecreasePerLevel: 100, // 每级速度减少值
        minSpeed: 100, // 最低速度限制
        scoreMultiplierBase: 1, // 基础分数倍率
        scoreMultiplierIncrement: 0.1, // 每级分数倍率增加值
        maxScoreMultiplier: 2, // 最大分数倍率
        
        // 连击系统
        comboMaxMultiplier: 2, // 连击最大倍率
        comboMultiplierStep: 0.1, // 每次连击增加的倍率步长
        comboRewards: {
            // 连击奖励阈值和分数
            5: 500,
            10: 1000,
            15: 2000,
            20: 5000
        },
        
        // 特殊能力
        abilityUnlockThresholds: {
            // 连击解锁特殊能力的阈值
            lineClear: 8,
            slowTime: 12,
            shapeTransform: 16
        },
        slowTimeEffectDuration: 10000, // 减缓时间效果持续时间(毫秒)
        
        // 特殊方块
        specialPieceChanceBase: 0, // 基础特殊方块出现概率
        specialPieceChanceIncrement: 0.05, // 每级增加的特殊方块概率
        maxSpecialPieceChance: 0.2 // 最大特殊方块出现概率
    },
    snake: {
        // 移动速度
        initialSpeed: 150, // 初始移动延迟(毫秒)
        minSpeed: 50, // 最小移动延迟
        speedDecreasePerPoint: 2, // 每得分减少的延迟值
        
        // 游戏区域
        gridSize: 20, // 格子大小(像素)
        boardWidth: 20, // 棋盘宽度(格子数)
        boardHeight: 20, // 棋盘高度(格子数)
        
        // 食物参数
        specialFoodChance: 0.1, // 特殊食物出现概率
        specialFoodScoreMultiplier: 3, // 特殊食物分数倍率
        specialFoodDuration: 5000, // 特殊食物持续时间(毫秒)
        
        // 游戏难度
        wallCollision: true, // 是否与墙壁碰撞结束游戏
        growthPerFood: 1 // 每个食物使蛇增长的节数
    },
    game2048: {
        // 等级系统
        levelThresholds: [
            0,     // 级别1
            1000,  // 级别2
            2000,  // 级别3
            4000,  // 级别4
            8000,  // 级别5
            16000, // 级别6
            32000, // 级别7
            50000, // 级别8
            75000, // 级别9
            100000 // 级别10
        ],
        // 每级加成倍率
        levelBonusMultipliers: [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2, 2.2],
        
        // 随机数生成
        initialTile4Probability: 0.1, // 初始数字为4的概率
        tile4ProbabilityIncrement: 0.05, // 每级增加的4出现概率
        maxTile4Probability: 0.4, // 最大4出现概率
        
        // 动画设置
        animationSpeed: 150, // 动画速度(毫秒)
        showAnimations: true // 是否显示动画
    },
    memory: {
        // 难度设置
        difficulties: {
            easy: 12,    // 简单模式卡片数
            medium: 20,  // 中等模式卡片数
            hard: 30     // 困难模式卡片数
        },
        cardShowDuration: 1000, // 卡片翻开展示时间(毫秒)
        
        // 计时系统
        timerPenaltyPerSecond: 5, // 每秒时间惩罚分数
        
        // 匹配规则
        consecutiveMatchBonus: 20, // 连续匹配奖励分数
        wrongMatchPenalty: 10, // 错误匹配扣除分数
        
        // 初始难度
        defaultDifficulty: 'easy' // 默认难度设置
    }
};

// 定义全局设置对象
let globalSettings = {};

/**
 * 加载用户设置
 * @returns {Object} 合并后的用户设置
 */
function loadUserSettings() {
    console.log('开始加载用户设置...');
    try {
        const storedSettings = localStorage.getItem('userSettings');
        console.log('从localStorage加载设置:', storedSettings);
        if (storedSettings) {
            const parsedSettings = JSON.parse(storedSettings);
            
            // 深度合并设置，确保所有新添加的配置项也包含在内
            globalSettings = {
                ui: { ...DEFAULT_SETTINGS.ui, ...(parsedSettings.ui || {}) },
                audio: { ...DEFAULT_SETTINGS.audio, ...(parsedSettings.audio || {}) },
                music: { ...DEFAULT_SETTINGS.music, ...(parsedSettings.music || {}) },
                games: { ...DEFAULT_SETTINGS.games, ...(parsedSettings.games || {}) },
                forum: { ...DEFAULT_SETTINGS.forum, ...(parsedSettings.forum || {}) },
                tetris: { ...DEFAULT_SETTINGS.tetris, ...(parsedSettings.tetris || {}) },
                snake: { ...DEFAULT_SETTINGS.snake, ...(parsedSettings.snake || {}) },
                game2048: { ...DEFAULT_SETTINGS.game2048, ...(parsedSettings.game2048 || {}) },
                memory: { ...DEFAULT_SETTINGS.memory, ...(parsedSettings.memory || {}) }
            };
            
            // 应用设置
            applySettings(globalSettings);
            console.log('用户设置加载成功:', globalSettings);
            return globalSettings;
        }
    } catch (error) {
        console.error('加载设置时出错:', error);
    }
    
    // 如果没有保存的设置或出错，使用默认设置
    console.log('没有找到保存的设置，使用默认设置');
    globalSettings = { ...DEFAULT_SETTINGS };
    applySettings(globalSettings);
    console.log('默认设置应用成功:', globalSettings);
    return globalSettings;
}

/**
 * 保存用户设置
 * @param {Object} settings 要保存的设置对象
 */
function saveUserSettings(settings) {
    try {
        console.log('保存用户设置:', settings || globalSettings);
        localStorage.setItem('userSettings', JSON.stringify(settings || globalSettings));
        
        // 应用设置
        if (settings) {
            globalSettings = settings;
            applySettings(globalSettings);
        }
        
        // 添加一个标记，表示设置已更新
        sessionStorage.setItem('settingsUpdated', Date.now().toString());
        
        console.log('设置保存成功，当前globalSettings:', globalSettings);
        return true;
    } catch (error) {
        console.error('保存设置时出错:', error);
        return false;
    }
}

// 检查设置是否更新的函数
function checkSettingsUpdated() {
    // 如果存在设置更新标记
    const lastUpdate = sessionStorage.getItem('settingsUpdated');
    if (lastUpdate) {
        // 清除标记以避免重复加载
        sessionStorage.removeItem('settingsUpdated');
        
        console.log('检测到设置已更新，重新加载设置');
        // 重新加载设置并返回最新设置
        try {
            const storedSettings = localStorage.getItem('userSettings');
            if (storedSettings) {
                const parsedSettings = JSON.parse(storedSettings);
                console.log('从更新检测中加载的新设置:', parsedSettings);
                
                // 深度合并设置
                globalSettings = {
                    ui: { ...DEFAULT_SETTINGS.ui, ...(parsedSettings.ui || {}) },
                    audio: { ...DEFAULT_SETTINGS.audio, ...(parsedSettings.audio || {}) },
                    music: { ...DEFAULT_SETTINGS.music, ...(parsedSettings.music || {}) },
                    games: { ...DEFAULT_SETTINGS.games, ...(parsedSettings.games || {}) },
                    forum: { ...DEFAULT_SETTINGS.forum, ...(parsedSettings.forum || {}) },
                    tetris: { ...DEFAULT_SETTINGS.tetris, ...(parsedSettings.tetris || {}) },
                    snake: { ...DEFAULT_SETTINGS.snake, ...(parsedSettings.snake || {}) },
                    game2048: { ...DEFAULT_SETTINGS.game2048, ...(parsedSettings.game2048 || {}) },
                    memory: { ...DEFAULT_SETTINGS.memory, ...(parsedSettings.memory || {}) }
                };
                
                // 应用更新的设置
                applySettings(globalSettings);
                console.log('已重新加载最新设置:', globalSettings);
                return globalSettings;
            }
        } catch (error) {
            console.error('检查设置更新时出错:', error);
        }
    }
    return null;
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
    checkSettingsUpdated,
    get settings() { 
        // 每次访问settings时，检查是否有更新
        const updatedSettings = checkSettingsUpdated();
        if (updatedSettings) {
            console.log('settings getter: 检测到更新的设置');
            return updatedSettings;
        }
        // 没有更新时返回当前全局设置
        return globalSettings; 
    }
}; 