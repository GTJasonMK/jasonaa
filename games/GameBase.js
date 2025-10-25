/**
 * 触摸手势处理器
 * 统一处理所有触摸交互：滑动、点击、长按等
 */
class TouchGestureHandler {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            minSwipeDistance: 30,
            maxTapDuration: 300,
            longPressDuration: 500,
            ...options
        };

        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.lastTouchTime = 0;
        this.isSwiping = false;

        // 回调函数
        this.onSwipe = null;
        this.onTap = null;
        this.onLongPress = null;
        this.onDoubleTap = null;
    }

    /**
     * 启用滑动检测
     * @param {Function} callback - 回调函数，接收{direction, distance}
     */
    enableSwipe(callback) {
        this.onSwipe = callback;
        return this;
    }

    /**
     * 启用点击检测
     * @param {Function} callback - 点击回调
     */
    enableTap(callback) {
        this.onTap = callback;
        return this;
    }

    /**
     * 启用长按检测
     * @param {Function} callback - 长按回调
     */
    enableLongPress(callback) {
        this.onLongPress = callback;
        return this;
    }

    /**
     * 启用双击检测
     * @param {Function} callback - 双击回调
     */
    enableDoubleTap(callback) {
        this.onDoubleTap = callback;
        return this;
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
        this.isSwiping = false;
    }

    /**
     * 处理触摸移动
     */
    handleTouchMove(e) {
        const touch = e.touches[0];
        const diffX = Math.abs(touch.clientX - this.touchStartX);
        const diffY = Math.abs(touch.clientY - this.touchStartY);

        if (diffX > 10 || diffY > 10) {
            this.isSwiping = true;
        }
    }

    /**
     * 处理触摸结束
     */
    handleTouchEnd(e) {
        const touch = e.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const touchEndTime = Date.now();
        const duration = touchEndTime - this.touchStartTime;

        const diffX = touchEndX - this.touchStartX;
        const diffY = touchEndY - this.touchStartY;

        // 检测滑动
        if (this.onSwipe && this.isSwiping) {
            const absX = Math.abs(diffX);
            const absY = Math.abs(diffY);

            if (absX > this.options.minSwipeDistance || absY > this.options.minSwipeDistance) {
                let direction;
                if (absX > absY) {
                    direction = diffX > 0 ? 'right' : 'left';
                } else {
                    direction = diffY > 0 ? 'down' : 'up';
                }

                this.onSwipe({
                    direction,
                    distance: Math.max(absX, absY),
                    deltaX: diffX,
                    deltaY: diffY
                });
            }
        }

        // 检测点击
        if (this.onTap && !this.isSwiping && duration < this.options.maxTapDuration) {
            // 检测双击
            const timeSinceLastTap = touchEndTime - this.lastTouchTime;
            if (this.onDoubleTap && timeSinceLastTap < 300) {
                this.onDoubleTap(e);
            } else {
                this.onTap(e);
            }
            this.lastTouchTime = touchEndTime;
        }

        // 检测长按
        if (this.onLongPress && !this.isSwiping && duration >= this.options.longPressDuration) {
            this.onLongPress(e);
        }
    }
}

/**
 * 等级系统管理器
 * 提供智能的等级计算和管理
 */
class LevelSystem {
    constructor(levelConfig) {
        this.levelConfig = levelConfig || {};
        this.maxLevel = Object.keys(this.levelConfig).length;
    }

    /**
     * 根据分数计算等级
     * @param {number} score - 当前分数
     * @returns {number} 等级
     */
    calculateLevel(score) {
        let level = 1;
        for (let l = this.maxLevel; l >= 1; l--) {
            const config = this.levelConfig[l];
            if (!config) continue;

            // 支持多种配置键名
            const threshold = config.scoreThreshold || config.requiredScore || 0;
            if (score >= threshold) {
                level = l;
                break;
            }
        }
        return level;
    }

    /**
     * 获取等级配置
     * @param {number} level - 等级
     * @returns {Object} 配置对象
     */
    getLevelConfig(level) {
        return this.levelConfig[level] || {};
    }

    /**
     * 获取下一等级所需分数
     * @param {number} currentLevel - 当前等级
     * @returns {number|null} 所需分数，如果已是最高级返回null
     */
    getNextLevelThreshold(currentLevel) {
        if (currentLevel >= this.maxLevel) return null;

        const nextConfig = this.levelConfig[currentLevel + 1];
        if (!nextConfig) return null;

        return nextConfig.scoreThreshold || nextConfig.requiredScore || 0;
    }
}

/**
 * 通知系统
 * 统一管理所有通知消息
 */
class NotificationSystem {
    constructor(resourceManager) {
        this.resourceManager = resourceManager;
        this.container = null;
        this.init();
    }

    init() {
        // 确保通知容器样式已加载
        if (!document.getElementById('notification-system-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-system-styles';
            style.textContent = `
                @keyframes slideInDown {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -100%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }
                @keyframes fadeOutUp {
                    from {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                    to {
                        opacity: 0;
                        transform: translate(-50%, -100%);
                    }
                }
                @keyframes pulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.05); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * 显示通知
     * @param {string} message - 消息内容
     * @param {Object} options - 配置选项
     */
    show(message, options = {}) {
        const config = {
            type: 'info', // 'success', 'warning', 'error', 'info', 'levelup'
            duration: 2000,
            position: 'top', // 'top', 'center', 'bottom'
            animation: 'slideIn', // 'slideIn', 'fade', 'pulse'
            ...options
        };

        const notification = document.createElement('div');
        notification.className = `game-notification notification-${config.type}`;

        // 根据类型设置样式
        const colors = {
            success: 'rgba(76, 175, 80, 0.95)',
            warning: 'rgba(255, 152, 0, 0.95)',
            error: 'rgba(244, 67, 54, 0.95)',
            info: 'rgba(33, 150, 243, 0.95)',
            levelup: 'rgba(156, 39, 176, 0.95)'
        };

        // 根据位置设置样式
        const positions = {
            top: 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%);',
            center: 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);',
            bottom: 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);'
        };

        // 根据动画类型设置
        const animations = {
            slideIn: 'slideInDown 0.3s ease-out',
            fade: 'fadeIn 0.3s ease-out',
            pulse: 'pulse 0.5s ease-out'
        };

        notification.style.cssText = `
            ${positions[config.position]}
            background: ${colors[config.type] || colors.info};
            color: white;
            padding: 16px 32px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: ${animations[config.animation] || animations.slideIn};
            max-width: 80%;
            text-align: center;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        // 自动移除
        this.resourceManager.setTimeout(() => {
            notification.style.animation = 'fadeOutUp 0.3s ease-out';
            this.resourceManager.setTimeout(() => {
                notification.remove();
            }, 300);
        }, config.duration);

        return notification;
    }

    /**
     * 快捷方法
     */
    success(message, duration) {
        return this.show(message, { type: 'success', duration });
    }

    warning(message, duration) {
        return this.show(message, { type: 'warning', duration });
    }

    error(message, duration) {
        return this.show(message, { type: 'error', duration });
    }

    info(message, duration) {
        return this.show(message, { type: 'info', duration });
    }

    levelUp(level, duration) {
        return this.show(`升级到 ${level} 级!`, {
            type: 'levelup',
            position: 'center',
            animation: 'pulse',
            duration: duration || 2000
        });
    }
}

/**
 * 存储辅助器
 * 统一管理localStorage操作
 */
class StorageHelper {
    constructor(prefix) {
        this.prefix = prefix;
    }

    /**
     * 生成完整的键名
     */
    getKey(key) {
        return `${this.prefix}_${key}`;
    }

    /**
     * 保存数据
     * @param {string} key - 键
     * @param {*} value - 值（自动JSON序列化）
     */
    save(key, value) {
        try {
            const fullKey = this.getKey(key);
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            return true;
        } catch (error) {
            console.error('保存数据失败:', error);
            return false;
        }
    }

    /**
     * 加载数据
     * @param {string} key - 键
     * @param {*} defaultValue - 默认值
     * @returns {*} 解析后的值
     */
    load(key, defaultValue = null) {
        try {
            const fullKey = this.getKey(key);
            const serialized = localStorage.getItem(fullKey);
            if (serialized === null) return defaultValue;
            return JSON.parse(serialized);
        } catch (error) {
            console.error('加载数据失败:', error);
            return defaultValue;
        }
    }

    /**
     * 删除数据
     */
    remove(key) {
        try {
            const fullKey = this.getKey(key);
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }

    /**
     * 清空所有游戏数据
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }
}

/**
 * 游戏基础类（增强版）
 * 为所有游戏提供通用功能，包括资源管理、事件管理、设置加载等
 *
 * 新增功能：
 * - 触摸手势处理
 * - 智能等级系统
 * - 通知系统
 * - 增强的存储管理
 *
 * 使用方法：
 * class MyGame extends GameBase {
 *     constructor() {
 *         super('myGameName');
 *         this.initGame();
 *     }
 *     initGame() {
 *         // 游戏特定初始化代码
 *     }
 * }
 */
class GameBase {
    /**
     * 构造函数
     * @param {string} gameType - 游戏类型（对应settingsManager中的配置键）
     * @param {Object} options - 配置选项
     */
    constructor(gameType, options = {}) {
        this.gameType = gameType;
        this.options = {
            enableAutoCleanup: true, // 是否自动在页面卸载时清理
            enableTouchGestures: true, // 是否启用触摸手势
            enableNotifications: true, // 是否启用通知系统
            ...options
        };

        // 创建事件管理器
        this.eventManager = new EventManager();

        // 创建资源管理器
        this.resourceManager = new ResourceManager();

        // 创建存储辅助器
        this.storage = new StorageHelper(gameType);

        // 游戏状态
        this.state = {
            isRunning: false,
            isPaused: false,
            isGameOver: false,
            score: 0,
            level: 1,
            highScore: 0
        };

        // 加载游戏设置
        this.settings = this.loadSettings();

        // 检测设备类型
        this.deviceInfo = this.detectDevice();

        // 创建通知系统
        if (this.options.enableNotifications) {
            this.notify = new NotificationSystem(this.resourceManager);
        }

        // 加载最高分
        this.loadHighScore();

        // 如果启用自动清理，注册清理函数
        if (this.options.enableAutoCleanup) {
            window.addEventListener('beforeunload', () => {
                this.cleanup();
            });
        }

        console.log(`${this.gameType}游戏基础类已初始化（增强版）`);
    }

    /**
     * 加载游戏设置
     * @returns {Object} 游戏设置对象
     */
    loadSettings() {
        const defaultSettings = {};

        if (window.settingsManager) {
            try {
                // 检查是否有更新
                window.settingsManager.checkSettingsUpdated();
                const settings = window.settingsManager.settings;

                // 获取游戏特定设置
                if (settings[this.gameType]) {
                    console.log(`已加载${this.gameType}的特定设置`);
                    return { ...defaultSettings, ...settings[this.gameType] };
                }

                // 获取通用游戏设置
                if (settings.games) {
                    console.log(`已加载通用游戏设置`);
                    return { ...defaultSettings, ...settings.games };
                }
            } catch (error) {
                console.error('加载设置时出错:', error);
            }
        }

        console.warn(`未找到${this.gameType}的设置，使用默认值`);
        return defaultSettings;
    }

    /**
     * 检测设备类型
     * @returns {Object} 设备信息
     */
    detectDevice() {
        const userAgent = navigator.userAgent || '';

        // 检测移动设备
        const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

        // 检测屏幕尺寸
        const isSmallScreen = window.matchMedia && (
            window.matchMedia('(max-width: 768px)').matches ||
            window.matchMedia('(max-device-width: 768px)').matches
        );

        // 检测触摸支持
        const hasTouch = 'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0;

        // 综合判断
        const isMobile = isMobileUserAgent || (isSmallScreen && hasTouch);

        // iOS特殊检测
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

        return {
            isMobile,
            hasTouch,
            isSmallScreen,
            isIOS,
            userAgent,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
        };
    }

    /**
     * 设置触摸手势处理
     * @param {HTMLElement} element - 目标元素
     * @param {Object} options - 配置选项
     * @returns {TouchGestureHandler} 手势处理器实例
     */
    setupTouchGestures(element, options = {}) {
        const handler = new TouchGestureHandler(element, options);

        // 自动绑定事件
        this.on(element, 'touchstart', (e) => handler.handleTouchStart(e), { passive: false });
        this.on(element, 'touchmove', (e) => handler.handleTouchMove(e), { passive: false });
        this.on(element, 'touchend', (e) => handler.handleTouchEnd(e), { passive: false });

        return handler;
    }

    /**
     * 设置等级系统
     * @param {Object} levelConfig - 等级配置
     * @returns {LevelSystem} 等级系统实例
     */
    setupLevelSystem(levelConfig) {
        this.levelSystem = new LevelSystem(levelConfig);
        return this.levelSystem;
    }

    /**
     * 自动更新等级（如果设置了等级系统）
     */
    autoUpdateLevel() {
        if (this.levelSystem) {
            const newLevel = this.levelSystem.calculateLevel(this.state.score);
            if (newLevel > this.state.level) {
                this.updateLevel(newLevel);
                return true;
            }
        }
        return false;
    }

    /**
     * 加载最高分
     */
    loadHighScore() {
        this.state.highScore = this.storage.load('highScore', 0);
        if (this.state.highScore > 0) {
            console.log(`已加载最高分: ${this.state.highScore}`);
        }
    }

    /**
     * 保存最高分
     */
    saveHighScore() {
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            this.storage.save('highScore', this.state.highScore);
            console.log(`新最高分已保存: ${this.state.highScore}`);
            return true;
        }
        return false;
    }

    /**
     * 保存游戏数据
     * @param {string} key - 键
     * @param {*} value - 值
     */
    saveGameData(key, value) {
        return this.storage.save(key, value);
    }

    /**
     * 加载游戏数据
     * @param {string} key - 键
     * @param {*} defaultValue - 默认值
     */
    loadGameData(key, defaultValue = null) {
        return this.storage.load(key, defaultValue);
    }

    /**
     * 更新分数
     * @param {number} points - 增加的分数
     */
    updateScore(points) {
        this.state.score += points;
        this.saveHighScore();

        // 自动检查等级
        this.autoUpdateLevel();

        // 触发分数更新事件
        this.onScoreUpdate && this.onScoreUpdate(this.state.score);
    }

    /**
     * 设置分数
     * @param {number} score - 新分数
     */
    setScore(score) {
        this.state.score = score;
        this.saveHighScore();

        // 自动检查等级
        this.autoUpdateLevel();

        this.onScoreUpdate && this.onScoreUpdate(this.state.score);
    }

    /**
     * 更新等级
     * @param {number} newLevel - 新等级
     * @param {boolean} showNotification - 是否显示通知
     */
    updateLevel(newLevel, showNotification = true) {
        if (newLevel > this.state.level) {
            const oldLevel = this.state.level;
            this.state.level = newLevel;

            // 显示等级提升通知
            if (showNotification && this.notify) {
                this.notify.levelUp(newLevel);
            }

            // 触发等级提升事件
            this.onLevelUp && this.onLevelUp(newLevel, oldLevel);

            console.log(`等级提升: ${oldLevel} -> ${newLevel}`);
        }
    }

    /**
     * 显示等级提升消息（保留向后兼容）
     * @param {string} message - 自定义消息
     */
    showLevelUpMessage(message) {
        if (this.notify) {
            const msg = message || `升级到 ${this.state.level} 级!`;
            this.notify.levelUp(this.state.level);
        }
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.state.isRunning) {
            console.warn('游戏已在运行中');
            return;
        }

        this.state.isRunning = true;
        this.state.isPaused = false;
        this.state.isGameOver = false;

        console.log(`${this.gameType}游戏已开始`);

        // 触发开始事件
        this.onStart && this.onStart();
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.state.isRunning || this.state.isPaused) {
            return;
        }

        this.state.isPaused = true;
        console.log(`${this.gameType}游戏已暂停`);

        // 触发暂停事件
        this.onPause && this.onPause();
    }

    /**
     * 恢复游戏
     */
    resume() {
        if (!this.state.isRunning || !this.state.isPaused) {
            return;
        }

        this.state.isPaused = false;
        console.log(`${this.gameType}游戏已恢复`);

        // 触发恢复事件
        this.onResume && this.onResume();
    }

    /**
     * 游戏结束
     */
    gameOver() {
        if (this.state.isGameOver) {
            return;
        }

        this.state.isRunning = false;
        this.state.isPaused = false;
        this.state.isGameOver = true;

        // 保存最高分
        const isNewRecord = this.saveHighScore();

        console.log(`${this.gameType}游戏结束，最终分数: ${this.state.score}`);

        // 触发游戏结束事件
        this.onGameOver && this.onGameOver(this.state.score, this.state.highScore, isNewRecord);
    }

    /**
     * 重置游戏
     */
    reset() {
        this.state.score = 0;
        this.state.level = 1;
        this.state.isRunning = false;
        this.state.isPaused = false;
        this.state.isGameOver = false;

        console.log(`${this.gameType}游戏已重置`);

        // 触发重置事件
        this.onReset && this.onReset();
    }

    /**
     * 添加事件监听器（通过事件管理器）
     * @param {EventTarget} target - 目标元素
     * @param {string} event - 事件名称
     * @param {Function} handler - 处理函数
     * @param {Object} options - 选项
     */
    on(target, event, handler, options) {
        return this.eventManager.addEventListener(target, event, handler, options);
    }

    /**
     * 创建管理的定时器
     * @param {Function} callback - 回调函数
     * @param {number} delay - 延迟（毫秒）
     */
    setTimeout(callback, delay) {
        return this.resourceManager.setTimeout(callback, delay);
    }

    /**
     * 创建管理的间隔定时器
     * @param {Function} callback - 回调函数
     * @param {number} interval - 间隔（毫秒）
     */
    setInterval(callback, interval) {
        return this.resourceManager.setInterval(callback, interval);
    }

    /**
     * 获取游戏统计信息
     * @returns {Object}
     */
    getStats() {
        return {
            gameType: this.gameType,
            state: { ...this.state },
            device: this.deviceInfo,
            resources: this.resourceManager.getStats(),
            eventListeners: this.eventManager.getListenerCount(),
            hasLevelSystem: !!this.levelSystem,
            hasNotifications: !!this.notify
        };
    }

    /**
     * 清理资源
     * 在游戏页面卸载时调用，释放所有资源
     */
    cleanup() {
        console.log(`开始清理${this.gameType}游戏资源...`);

        // 清理事件监听器
        this.eventManager.cleanup();

        // 清理资源管理器
        this.resourceManager.cleanup();

        console.log(`${this.gameType}游戏资源已清理完成`);

        // 触发清理事件
        this.onCleanup && this.onCleanup();
    }
}

/**
 * 导出所有类
 */
window.GameBase = GameBase;
window.TouchGestureHandler = TouchGestureHandler;
window.LevelSystem = LevelSystem;
window.NotificationSystem = NotificationSystem;
window.StorageHelper = StorageHelper;

console.log('GameBase基础类已加载（增强版 v2.0）');
console.log('新增功能: 触摸手势、智能等级、通知系统、存储辅助');
