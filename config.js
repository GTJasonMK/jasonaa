/**
 * 应用程序配置代理
 * 作为settingsManager的便捷访问层，保持向后兼容性
 *
 * 重要：此文件已简化，所有配置都统一由settingsManager管理
 * 不再维护独立的配置系统，避免数据不一致
 */

/**
 * 初始化配置系统
 * 依赖settingsManager必须先加载
 */
document.addEventListener('DOMContentLoaded', () => {
    // 确保settingsManager已加载
    if (!window.settingsManager) {
        console.error('配置系统错误: settingsManager未找到！请确保settings-loader.js已正确加载。');

        // 提供最小的降级配置，避免页面完全崩溃
        window.appConfig = {
            audio: { volume: 0.8, noteDelay: 400, answerDelay: 1000, autoPlayNext: true, soundEffects: true },
            game: { startingDifficulty: 0, defaultMelodyLength: 3, pointsPerCorrect: 10, showHints: true, gameSpeed: 5, vibrationFeedback: true, snakeColor: 'green', tetrisRotationSystem: 'classic' },
            ui: { theme: 'dark', fontSize: 16, animations: true },
            accessibility: { colorBlindMode: false, highContrast: false, keyboardShortcuts: true },
            forum: { showAvatars: true, commentsPerPage: 10, defaultSort: 'newest' }
        };

        window.configManager = {
            saveConfig: () => console.warn('settingsManager不可用，无法保存配置'),
            resetConfig: () => console.warn('settingsManager不可用，无法重置配置'),
            updateConfig: () => console.warn('settingsManager不可用，无法更新配置')
        };

        return;
    }

    // 确保settingsManager已初始化
    const settings = window.settingsManager.loadUserSettings();

    /**
     * 配置对象代理
     * 提供便捷的配置访问接口，数据直接来自settingsManager
     */
    window.appConfig = {
        get audio() {
            return window.settingsManager.settings.audio || {};
        },

        get game() {
            // 兼容旧的命名：合并music和games配置
            const musicSettings = window.settingsManager.settings.music || {};
            const gameSettings = window.settingsManager.settings.games || {};
            return {
                // 音乐练习相关
                startingDifficulty: musicSettings.startingDifficulty,
                defaultMelodyLength: musicSettings.melodyLength,
                pointsPerCorrect: musicSettings.pointsPerCorrect,
                showHints: musicSettings.showHints,
                // 游戏相关
                gameSpeed: gameSettings.gameSpeed,
                vibrationFeedback: gameSettings.vibrationFeedback,
                snakeColor: gameSettings.snakeColor,
                tetrisRotationSystem: gameSettings.tetrisRotationSystem
            };
        },

        get ui() {
            return window.settingsManager.settings.ui || {};
        },

        get accessibility() {
            // 将高对比度等UI设置映射到accessibility
            const uiSettings = window.settingsManager.settings.ui || {};
            return {
                colorBlindMode: uiSettings.highContrast || false,
                highContrast: uiSettings.highContrast || false,
                keyboardShortcuts: true
            };
        },

        get forum() {
            return window.settingsManager.settings.forum || {};
        }
    };

    /**
     * 配置管理器代理
     * 所有操作委托给settingsManager
     */
    window.configManager = {
        /**
         * 保存配置到localStorage
         * @returns {boolean} 是否保存成功
         */
        saveConfig: function() {
            return window.settingsManager.saveUserSettings();
        },

        /**
         * 重置所有配置为默认值
         * @returns {Object} 重置后的配置对象
         */
        resetConfig: function() {
            return window.settingsManager.resetAllSettings();
        },

        /**
         * 更新单个配置项
         * @param {string} category - 配置类别
         * @param {string} setting - 配置键名
         * @param {any} value - 配置值
         * @returns {boolean} 是否更新成功
         */
        updateConfig: function(category, setting, value) {
            return window.settingsManager.updateSetting(category, setting, value);
        }
    };

    console.log('配置系统已初始化（通过settingsManager）');

    // 清理旧的musicAppConfig（迁移）
    if (localStorage.getItem('musicAppConfig')) {
        console.log('检测到旧的musicAppConfig，将在下次保存时自动清理');
        // 不立即删除，以防万一需要回滚
        // localStorage.removeItem('musicAppConfig');
    }
});
