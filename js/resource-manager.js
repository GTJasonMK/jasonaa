/**
 * 资源管理器
 * 统一管理音频、定时器、动画帧等资源，防止内存泄漏
 *
 * 使用方法：
 * const resMgr = new ResourceManager();
 * const audioCtx = resMgr.createAudioContext();
 * resMgr.setTimeout(callback, delay);
 * resMgr.cleanup(); // 页面卸载时调用
 */

class ResourceManager {
    constructor(options = {}) {
        // 配置选项
        this.options = {
            maxCacheSize: options.maxCacheSize || 20,  // 最大缓存项数
            maxCacheMemory: options.maxCacheMemory || 50 * 1024 * 1024, // 50MB
            ...options
        };

        // 音频上下文
        this.audioContext = null;

        // 音频缓存（使用Map实现LRU）
        this.audioCache = new Map();
        this.cacheAccessOrder = []; // 记录访问顺序

        // 定时器列表
        this.timers = new Set();

        // 动画帧列表
        this.animationFrames = new Set();

        // 间隔定时器列表
        this.intervals = new Set();

        // 当前缓存占用的内存（估算值，字节）
        this.currentCacheMemory = 0;

        // 标记是否已清理
        this.isCleanedUp = false;
    }

    /**
     * 创建或获取AudioContext
     * @returns {AudioContext|null}
     */
    createAudioContext() {
        if (this.isCleanedUp) {
            console.warn('ResourceManager已被清理，无法创建AudioContext');
            return null;
        }

        if (this.audioContext) {
            return this.audioContext;
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
                console.log('AudioContext已创建');
                return this.audioContext;
            }
        } catch (error) {
            console.error('创建AudioContext失败:', error);
        }

        return null;
    }

    /**
     * 添加音频缓冲到缓存
     * @param {string} key - 缓存键
     * @param {AudioBuffer} buffer - 音频缓冲
     */
    cacheAudioBuffer(key, buffer) {
        if (this.isCleanedUp) {
            return;
        }

        // 估算AudioBuffer占用的内存
        const estimatedSize = buffer.length * buffer.numberOfChannels * 4; // 假设每个样本4字节

        // 如果单个文件超过限制，不缓存
        if (estimatedSize > this.options.maxCacheMemory) {
            console.warn(`音频文件 ${key} 太大 (${(estimatedSize / 1024 / 1024).toFixed(2)}MB)，不缓存`);
            return;
        }

        // 检查是否需要清理缓存
        while ((this.audioCache.size >= this.options.maxCacheSize ||
                this.currentCacheMemory + estimatedSize > this.options.maxCacheMemory) &&
                this.audioCache.size > 0) {
            // 移除最旧的项（LRU策略）
            const oldestKey = this.cacheAccessOrder.shift();
            const oldBuffer = this.audioCache.get(oldestKey);
            if (oldBuffer) {
                const oldSize = oldBuffer.length * oldBuffer.numberOfChannels * 4;
                this.currentCacheMemory -= oldSize;
                this.audioCache.delete(oldestKey);
                console.log(`LRU: 移除缓存 ${oldestKey}`);
            }
        }

        // 添加到缓存
        this.audioCache.set(key, buffer);
        this.cacheAccessOrder.push(key);
        this.currentCacheMemory += estimatedSize;

        console.log(`已缓存音频 ${key} (${(estimatedSize / 1024).toFixed(2)}KB), 总缓存: ${(this.currentCacheMemory / 1024 / 1024).toFixed(2)}MB`);
    }

    /**
     * 从缓存获取音频缓冲
     * @param {string} key - 缓存键
     * @returns {AudioBuffer|null}
     */
    getAudioBuffer(key) {
        const buffer = this.audioCache.get(key);

        if (buffer) {
            // 更新访问顺序（LRU）
            const index = this.cacheAccessOrder.indexOf(key);
            if (index > -1) {
                this.cacheAccessOrder.splice(index, 1);
                this.cacheAccessOrder.push(key);
            }
        }

        return buffer || null;
    }

    /**
     * 清除音频缓存
     */
    clearAudioCache() {
        this.audioCache.clear();
        this.cacheAccessOrder = [];
        this.currentCacheMemory = 0;
        console.log('音频缓存已清空');
    }

    /**
     * 管理的setTimeout
     * @param {Function} callback - 回调函数
     * @param {number} delay - 延迟时间（毫秒）
     * @returns {number} 定时器ID
     */
    setTimeout(callback, delay) {
        if (this.isCleanedUp) {
            console.warn('ResourceManager已被清理，无法创建定时器');
            return 0;
        }

        const timerId = window.setTimeout(() => {
            this.timers.delete(timerId);
            callback();
        }, delay);

        this.timers.add(timerId);
        return timerId;
    }

    /**
     * 管理的setInterval
     * @param {Function} callback - 回调函数
     * @param {number} interval - 间隔时间（毫秒）
     * @returns {number} 定时器ID
     */
    setInterval(callback, interval) {
        if (this.isCleanedUp) {
            console.warn('ResourceManager已被清理，无法创建间隔定时器');
            return 0;
        }

        const intervalId = window.setInterval(callback, interval);
        this.intervals.add(intervalId);
        return intervalId;
    }

    /**
     * 管理的requestAnimationFrame
     * @param {Function} callback - 回调函数
     * @returns {number} 动画帧ID
     */
    requestAnimationFrame(callback) {
        if (this.isCleanedUp) {
            console.warn('ResourceManager已被清理，无法创建动画帧');
            return 0;
        }

        const frameId = window.requestAnimationFrame((timestamp) => {
            this.animationFrames.delete(frameId);
            callback(timestamp);
        });

        this.animationFrames.add(frameId);
        return frameId;
    }

    /**
     * 清除特定定时器
     * @param {number} timerId - 定时器ID
     */
    clearTimeout(timerId) {
        window.clearTimeout(timerId);
        this.timers.delete(timerId);
    }

    /**
     * 清除特定间隔定时器
     * @param {number} intervalId - 间隔定时器ID
     */
    clearInterval(intervalId) {
        window.clearInterval(intervalId);
        this.intervals.delete(intervalId);
    }

    /**
     * 清除特定动画帧
     * @param {number} frameId - 动画帧ID
     */
    cancelAnimationFrame(frameId) {
        window.cancelAnimationFrame(frameId);
        this.animationFrames.delete(frameId);
    }

    /**
     * 获取资源统计信息
     * @returns {Object}
     */
    getStats() {
        return {
            audioContext: this.audioContext ? 'active' : 'none',
            audioCacheSize: this.audioCache.size,
            audioCacheMemory: (this.currentCacheMemory / 1024 / 1024).toFixed(2) + 'MB',
            activeTimers: this.timers.size,
            activeIntervals: this.intervals.size,
            activeAnimationFrames: this.animationFrames.size
        };
    }

    /**
     * 清理所有资源
     * 此方法是幂等的，可以安全地多次调用
     */
    cleanup() {
        if (this.isCleanedUp) {
            return; // 已经清理过
        }

        console.log('开始清理资源管理器...');

        // 关闭AudioContext
        if (this.audioContext) {
            if (this.audioContext.state !== 'closed') {
                this.audioContext.close().then(() => {
                    console.log('AudioContext已关闭');
                }).catch(err => {
                    console.error('关闭AudioContext失败:', err);
                });
            }
            this.audioContext = null;
        }

        // 清除所有定时器
        this.timers.forEach(timerId => window.clearTimeout(timerId));
        this.timers.clear();

        // 清除所有间隔定时器
        this.intervals.forEach(intervalId => window.clearInterval(intervalId));
        this.intervals.clear();

        // 取消所有动画帧
        this.animationFrames.forEach(frameId => window.cancelAnimationFrame(frameId));
        this.animationFrames.clear();

        // 清除音频缓存
        this.clearAudioCache();

        // 标记为已清理
        this.isCleanedUp = true;

        console.log('ResourceManager已清理完成');
    }
}

/**
 * 导出ResourceManager类
 */
window.ResourceManager = ResourceManager;

/**
 * 创建全局资源管理器实例
 */
if (!window.pageResourceManager) {
    window.pageResourceManager = new ResourceManager();

    // 在页面卸载前自动清理
    window.addEventListener('beforeunload', () => {
        if (window.pageResourceManager) {
            window.pageResourceManager.cleanup();
        }
    });

    // 在页面隐藏时清理音频上下文（节省资源）
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && window.pageResourceManager) {
            // 可以选择暂停AudioContext
            const audioCtx = window.pageResourceManager.audioContext;
            if (audioCtx && audioCtx.state === 'running') {
                audioCtx.suspend().then(() => {
                    console.log('页面隐藏，AudioContext已暂停');
                });
            }
        } else if (!document.hidden && window.pageResourceManager) {
            // 页面可见时恢复
            const audioCtx = window.pageResourceManager.audioContext;
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    console.log('页面可见，AudioContext已恢复');
                });
            }
        }
    });
}

console.log('ResourceManager已加载，可通过window.pageResourceManager访问全局实例');
