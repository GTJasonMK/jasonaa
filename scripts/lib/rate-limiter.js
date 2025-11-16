/**
 * RateLimiter - 速率限制器
 * 自适应API速率控制，支持指数退避
 */

class RateLimiter {
    /**
     * @param {number} rpm - 每分钟请求数限制
     */
    constructor(rpm = 60) {
        this.rpm = rpm;
        this.minDelay = 1000; // 最小延迟1秒
        this.maxDelay = 60000; // 最大延迟60秒
        this.currentDelay = Math.max(this.minDelay, 60000 / rpm); // 初始延迟
        this.lastRequestTime = 0;
        this.requestWindow = []; // 滑动窗口：记录最近60秒的请求时间戳
        this.consecutiveSuccesses = 0;
        this.consecutiveFailures = 0;
    }

    /**
     * 等待直到可以发送下一个请求
     */
    async wait() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        // 清理滑动窗口中60秒之前的记录
        this.requestWindow = this.requestWindow.filter(time => now - time < 60000);

        // 如果窗口内请求数达到限制，计算需要等待的时间
        if (this.requestWindow.length >= this.rpm) {
            const oldestRequest = this.requestWindow[0];
            const waitTime = 60000 - (now - oldestRequest) + 100; // 多等100ms缓冲
            if (waitTime > 0) {
                console.log(`[RateLimiter] 达到速率限制，等待 ${(waitTime / 1000).toFixed(1)} 秒...`);
                await this.sleep(waitTime);
            }
        }

        // 基于当前延迟等待
        if (timeSinceLastRequest < this.currentDelay) {
            const waitTime = this.currentDelay - timeSinceLastRequest;
            await this.sleep(waitTime);
        }

        this.lastRequestTime = Date.now();
        this.requestWindow.push(this.lastRequestTime);
    }

    /**
     * 记录成功请求
     */
    recordSuccess() {
        this.consecutiveSuccesses++;
        this.consecutiveFailures = 0;

        // 连续10次成功后，尝试减少延迟（加速）
        if (this.consecutiveSuccesses >= 10) {
            this.currentDelay = Math.max(this.minDelay, this.currentDelay * 0.9);
            this.consecutiveSuccesses = 0;
            console.log(`[RateLimiter] 连续成功，减少延迟至 ${(this.currentDelay / 1000).toFixed(2)} 秒`);
        }
    }

    /**
     * 记录失败请求（429速率限制错误）
     * @param {number} retryAfter - Retry-After头的值（秒）
     */
    recordFailure(retryAfter = null) {
        this.consecutiveFailures++;
        this.consecutiveSuccesses = 0;

        if (retryAfter) {
            // 使用服务器指定的等待时间
            this.currentDelay = Math.min(this.maxDelay, retryAfter * 1000);
            console.log(`[RateLimiter] 收到Retry-After: ${retryAfter}秒，调整延迟`);
        } else {
            // 指数退避
            this.currentDelay = Math.min(this.maxDelay, this.currentDelay * 2);
            console.log(`[RateLimiter] 速率限制触发，延迟增加至 ${(this.currentDelay / 1000).toFixed(2)} 秒`);
        }
    }

    /**
     * 记录其他错误（网络错误、超时等）
     */
    recordError() {
        // 其他错误不调整速率，只重置成功计数
        this.consecutiveSuccesses = 0;
    }

    /**
     * 获取当前延迟
     */
    getCurrentDelay() {
        return this.currentDelay;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            rpm: this.rpm,
            currentDelay: this.currentDelay,
            recentRequests: this.requestWindow.length,
            consecutiveSuccesses: this.consecutiveSuccesses,
            consecutiveFailures: this.consecutiveFailures
        };
    }

    /**
     * 睡眠指定毫秒数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 重置限制器状态
     */
    reset() {
        this.currentDelay = Math.max(this.minDelay, 60000 / this.rpm);
        this.consecutiveSuccesses = 0;
        this.consecutiveFailures = 0;
        this.requestWindow = [];
    }
}

module.exports = RateLimiter;
