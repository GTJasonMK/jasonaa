/**
 * LLM API 统一客户端
 * 兼容 OpenAI、DeepSeek、New API 等所有 OpenAI 兼容服务
 *
 * 核心特性：
 * - 流式响应处理（SSE）
 * - 浏览器请求头模拟（绕过Cloudflare）
 * - 超时控制（AbortController）
 * - 自动重试机制（网络错误）
 * - 支持DeepSeek R1 reasoning字段
 */

class LLMClient {
    /**
     * 创建LLM客户端
     * @param {Object} config - 配置对象
     * @param {string} config.apiKey - API密钥
     * @param {string} config.baseUrl - API基础URL（可选）
     * @param {string} config.model - 模型名称（可选）
     * @param {boolean} config.simulateBrowser - 是否模拟浏览器请求头
     */
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || null;
        this.model = config.model || 'gpt-3.5-turbo';
        this.simulateBrowser = config.simulateBrowser !== false; // 默认开启
    }

    /**
     * 工厂方法：从配置创建客户端
     * @param {Object} config - 配置对象
     * @returns {LLMClient}
     */
    static createFromConfig(config) {
        return new LLMClient(config);
    }

    /**
     * 构建完整的API URL
     * @param {string} baseUrl - 基础URL
     * @returns {string} 完整的endpoint URL
     */
    _buildApiUrl(baseUrl) {
        if (!baseUrl) {
            // 没有baseUrl时，使用OpenAI默认地址
            return 'https://api.openai.com/v1/chat/completions';
        }

        // 自动补全endpoint（兼容New API等服务）
        if (!baseUrl.includes('/chat/completions')) {
            const cleanUrl = baseUrl.replace(/\/$/, '');
            if (cleanUrl.endsWith('/v1')) {
                return cleanUrl + '/chat/completions';
            } else {
                return cleanUrl + '/v1/chat/completions';
            }
        }

        return baseUrl;
    }

    /**
     * 获取请求头
     * @returns {Object} HTTP请求头
     */
    _getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };

        // 模拟浏览器请求头（绕过Cloudflare等防护）
        if (this.simulateBrowser) {
            Object.assign(headers, {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'DNT': '1',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            });
        }

        return headers;
    }

    /**
     * 流式请求并收集完整响应
     * @param {Array} messages - 消息数组 [{role, content}]
     * @param {Object} options - 请求选项
     * @param {number} options.timeout - 超时时间（秒）
     * @param {number} options.temperature - 温度参数
     * @param {number} options.maxTokens - 最大tokens
     * @param {string} options.responseFormat - 响应格式
     * @param {number} options.maxRetries - 最大重试次数
     * @returns {Promise<Object>} 收集结果 {content, reasoning, finishReason}
     */
    async streamAndCollect(messages, options = {}) {
        const {
            timeout = 120,
            temperature = 0.7,
            maxTokens = null,
            responseFormat = null,
            maxRetries = 2
        } = options;

        let lastError = null;

        // 重试循环
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`[LLMClient] 重试第 ${attempt} 次...`);
                    // 指数退避：第1次等2秒，第2次等4秒
                    const waitTime = Math.pow(2, attempt) * 1000;
                    await this._sleep(waitTime);
                }

                const result = await this._doStreamRequest(messages, {
                    timeout,
                    temperature,
                    maxTokens,
                    responseFormat
                });

                console.log(`[LLMClient] 请求成功: chunks=${result.chunkCount}, content=${result.content.length}字符`);
                return result;

            } catch (error) {
                lastError = error;

                // 判断是否应该重试
                if (this._shouldRetry(error) && attempt < maxRetries) {
                    console.warn(`[LLMClient] 请求失败，准备重试: ${error.message}`);
                    continue;
                }

                // 不应重试或已达最大重试次数，抛出错误
                throw error;
            }
        }

        // 理论上不应到达这里
        throw lastError || new Error('未知错误');
    }

    /**
     * 执行流式请求（内部方法）
     * @private
     */
    async _doStreamRequest(messages, options) {
        const { timeout, temperature, maxTokens, responseFormat } = options;

        // 构建请求体
        const requestBody = {
            model: this.model,
            messages: messages,
            temperature: temperature,
            stream: true
        };

        if (maxTokens) {
            requestBody.max_tokens = maxTokens;
        }

        if (responseFormat) {
            requestBody.response_format = { type: responseFormat };
        }

        // 注意：timeout不放在requestBody中！
        // 使用AbortController实现超时控制

        const apiUrl = this._buildApiUrl(this.baseUrl);
        console.log(`[LLMClient] 请求URL: ${apiUrl}`);
        console.log(`[LLMClient] 模型: ${this.model}`);
        console.log(`[LLMClient] 消息数: ${messages.length}`);

        // 创建AbortController用于超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout * 1000);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: this._getHeaders(),
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || errorData.message || response.statusText;
                throw new Error(`API错误 (${response.status}): ${errorMsg}`);
            }

            // 解析SSE流式响应
            return await this._parseStreamResponse(response);

        } catch (error) {
            clearTimeout(timeoutId);

            // 处理超时
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }

            // 处理网络错误
            if (error.message.includes('Failed to fetch') ||
                error.message.includes('NetworkError')) {
                throw new Error('网络连接失败，请检查API地址和网络连接');
            }

            throw error;
        }
    }

    /**
     * 解析SSE流式响应
     * @private
     */
    async _parseStreamResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let content = '';
        let reasoning = '';
        let finishReason = null;
        let chunkCount = 0;

        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                // 解码chunk
                buffer += decoder.decode(value, { stream: true });

                // 按行分割
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // 保留不完整的行

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') {
                        continue;
                    }

                    // 解析SSE格式: data: {...}
                    if (trimmed.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmed.slice(6);
                            const data = JSON.parse(jsonStr);

                            if (!data.choices || data.choices.length === 0) {
                                continue;
                            }

                            const choice = data.choices[0];
                            const delta = choice.delta;

                            chunkCount++;

                            // 收集content
                            if (delta.content) {
                                content += delta.content;
                            }

                            // 收集reasoning_content（DeepSeek R1特有）
                            if (delta.reasoning_content) {
                                reasoning += delta.reasoning_content;
                            }

                            // 记录完成原因
                            if (choice.finish_reason) {
                                finishReason = choice.finish_reason;
                            }

                        } catch (parseError) {
                            console.warn('[LLMClient] 解析chunk失败:', parseError.message);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        // 检查是否收到有效响应
        if (chunkCount === 0 || (!content && !reasoning)) {
            throw new Error('未收到有效响应');
        }

        // 检查是否被截断
        if (finishReason === 'length') {
            throw new Error('响应被截断，请缩短输入或增加max_tokens');
        }

        return {
            content,
            reasoning,
            finishReason,
            chunkCount
        };
    }

    /**
     * 判断错误是否应该重试
     * @private
     */
    _shouldRetry(error) {
        const message = error.message || '';

        // 网络错误应该重试
        if (message.includes('网络连接失败') ||
            message.includes('Failed to fetch') ||
            message.includes('NetworkError')) {
            return true;
        }

        // 超时应该重试
        if (message.includes('超时') || message.includes('timeout')) {
            return true;
        }

        // 服务器错误（5xx）应该重试
        if (message.includes('503') || message.includes('502') || message.includes('500')) {
            return true;
        }

        // 其他错误不重试（如认证错误、参数错误等）
        return false;
    }

    /**
     * 延迟工具函数
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 导出（如果使用ES6模块）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMClient;
}

// ES6模块导出（用于浏览器动态import）
export { LLMClient };
