/**
 * 事件管理器
 * 统一管理事件监听器的添加和清理，防止内存泄漏
 *
 * 使用方法：
 * const eventMgr = new EventManager();
 * eventMgr.on(element, 'click', handler);
 * eventMgr.cleanup(); // 页面卸载时调用
 */

class EventManager {
    constructor() {
        // 使用AbortController来管理所有事件监听器
        this.abortController = new AbortController();

        // 记录所有添加的监听器（用于调试）
        this.listeners = [];

        // 标记是否已清理
        this.isCleanedUp = false;
    }

    /**
     * 添加事件监听器
     * @param {EventTarget} target - 目标元素或对象
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     * @param {Object} options - addEventListener的选项
     * @returns {EventManager} 返回this以支持链式调用
     */
    addEventListener(target, event, handler, options = {}) {
        if (this.isCleanedUp) {
            console.warn('EventManager已被清理，无法添加新的事件监听器');
            return this;
        }

        // 合并选项，添加signal
        const eventOptions = {
            ...options,
            signal: this.abortController.signal
        };

        // 添加事件监听器
        target.addEventListener(event, handler, eventOptions);

        // 记录监听器（用于调试）
        this.listeners.push({
            target,
            event,
            handler,
            timestamp: Date.now()
        });

        return this;
    }

    /**
     * 简化的on方法（addEventListener的别名）
     */
    on(target, event, handler, options) {
        return this.addEventListener(target, event, handler, options);
    }

    /**
     * 移除特定的事件监听器
     * @param {EventTarget} target - 目标元素
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     */
    removeEventListener(target, event, handler) {
        target.removeEventListener(event, handler);

        // 从记录中移除
        this.listeners = this.listeners.filter(
            listener => !(listener.target === target &&
                         listener.event === event &&
                         listener.handler === handler)
        );
    }

    /**
     * 简化的off方法（removeEventListener的别名）
     */
    off(target, event, handler) {
        return this.removeEventListener(target, event, handler);
    }

    /**
     * 清理所有事件监听器
     * 此方法是幂等的，可以安全地多次调用
     */
    cleanup() {
        if (this.isCleanedUp) {
            return; // 已经清理过，直接返回
        }

        // 中止所有通过AbortController管理的事件监听器
        this.abortController.abort();

        // 清空记录
        const count = this.listeners.length;
        this.listeners = [];

        // 标记为已清理
        this.isCleanedUp = true;

        console.log(`EventManager已清理 ${count} 个事件监听器`);
    }

    /**
     * 获取当前活跃的监听器数量
     * @returns {number}
     */
    getListenerCount() {
        return this.listeners.length;
    }

    /**
     * 获取所有监听器的详细信息（调试用）
     * @returns {Array}
     */
    getListeners() {
        return [...this.listeners];
    }
}

/**
 * 创建全局事件管理器工厂
 * 允许页面创建多个独立的事件管理器实例
 */
window.EventManager = EventManager;

/**
 * 为当前页面创建默认的全局事件管理器
 * 自动在页面卸载时清理
 */
if (!window.pageEventManager) {
    window.pageEventManager = new EventManager();

    // 在页面卸载前自动清理
    window.addEventListener('beforeunload', () => {
        if (window.pageEventManager) {
            window.pageEventManager.cleanup();
        }
    });

    // 如果使用Visibility API，在页面隐藏时也可以选择性清理
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('页面已隐藏，事件管理器仍然活跃');
            // 如果需要，可以在这里添加暂停逻辑
        }
    });
}

console.log('EventManager已加载，可通过window.pageEventManager访问全局实例');
