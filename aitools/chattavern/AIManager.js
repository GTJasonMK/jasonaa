/**
 * AI管理器 - 负责调用各种LLM API
 * 支持OpenAI、Claude等主流AI服务
 * 重构版：使用LLMClient统一封装，消除代码重复
 */
class AIManager {
    constructor() {
        this.config = this.loadConfig();
        this.llmClient = null;  // LLM客户端实例
    }

    /**
     * 从localStorage加载配置
     */
    loadConfig() {
        const saved = localStorage.getItem('chattavern_ai_config');
        const defaultConfig = {
            provider: 'custom',  // 使用custom provider以支持任何OpenAI兼容API
            apiKey: '',  // 空字符串，强制用户配置
            model: 'gpt-3.5-turbo',
            apiUrl: '',
            temperature: 0.9,  // 角色扮演建议使用较高的temperature
            maxTokens: 4000,   // 增大默认值，支持更长的回复
            enabled: true
        };

        if (saved) {
            try {
                return { ...defaultConfig, ...JSON.parse(saved) };
            } catch (error) {
                console.error('[AIManager] 配置加载失败:', error);
                return defaultConfig;
            }
        }

        return defaultConfig;
    }

    /**
     * 保存配置
     */
    saveConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        localStorage.setItem('chattavern_ai_config', JSON.stringify(this.config));
        console.log('[AIManager] 配置已保存:', this.config);

        // 清空LLM客户端实例，下次调用时会重新创建
        this.llmClient = null;
    }

    /**
     * 检查AI是否可用
     */
    async isAvailable() {
        return this.config.enabled && this.config.apiKey && this.config.apiKey.length > 0;
    }

    /**
     * 初始化LLM客户端
     */
    async initializeLLMClient() {
        if (this.llmClient) {
            return this.llmClient;
        }

        // 动态导入LLMClient
        const { LLMClient } = await import('../aichat/llm-client.js');

        this.llmClient = LLMClient.createFromConfig({
            apiKey: this.config.apiKey,
            baseUrl: this.config.apiUrl,
            model: this.config.model,
            simulateBrowser: true  // 启用浏览器模拟，绕过Cloudflare
        });

        console.log('[AIManager] LLMClient已初始化');
        return this.llmClient;
    }

    /**
     * 获取AI回复
     * @param {string} characterId 角色ID
     * @param {string} userMessage 用户消息
     * @param {Array} context 对话上下文
     * @param {Object} character 角色卡对象
     */
    async getResponse(characterId, userMessage, context, character) {
        if (!await this.isAvailable()) {
            throw new Error('AI未配置或未启用');
        }

        console.log('[AIManager] 开始获取AI回复');
        console.log('[AIManager] 使用提供商:', this.config.provider);
        console.log('[AIManager] 模型:', this.config.model);

        try {
            let response;

            switch (this.config.provider) {
                case 'openai':
                case 'deepseek':
                case 'custom':
                    // OpenAI兼容API统一使用LLMClient
                    response = await this.callOpenAI(userMessage, context, character);
                    break;
                case 'claude':
                    // Claude API格式不同，保留独立实现
                    response = await this.callClaude(userMessage, context, character);
                    break;
                default:
                    throw new Error('不支持的AI提供商: ' + this.config.provider);
            }

            console.log('[AIManager] AI回复成功:', response.substring(0, 50) + '...');
            return response;

        } catch (error) {
            console.error('[AIManager] AI调用失败:', error);
            throw error;
        }
    }

    /**
     * 调用OpenAI API（使用LLMClient统一封装）
     * 重构版：删除约150行重复代码，使用LLMClient.stream()
     */
    async callOpenAI(userMessage, context, character) {
        // 确保LLM客户端已初始化
        await this.initializeLLMClient();

        // 构建消息数组
        const messages = [];

        // 系统提示词（角色设定）
        if (character) {
            const systemPrompt = character.getSystemPrompt();
            messages.push({
                role: 'system',
                content: systemPrompt
            });
        }

        // 对话历史（最近的几条）
        if (context && context.length > 0) {
            context.forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }

        // 当前用户消息
        messages.push({
            role: 'user',
            content: userMessage
        });

        console.log('[AIManager] ========== API请求详情 ==========');
        console.log('[AIManager] 使用LLMClient统一封装');
        console.log('[AIManager] 模型:', this.config.model);
        console.log('[AIManager] 消息数量:', messages.length);
        console.log('[AIManager] Temperature:', character?.temperature || this.config.temperature);
        console.log('[AIManager] Max Tokens:', character?.max_tokens || this.config.maxTokens);

        try {
            // 使用LLMClient的流式收集方法
            const result = await this.llmClient.streamAndCollect(messages, {
                timeout: 120,  // 超时120秒
                temperature: character?.temperature || this.config.temperature,
                maxTokens: character?.max_tokens || this.config.maxTokens,
                maxRetries: 2  // 最多重试2次
            });

            console.log('[AIManager] 请求成功');
            console.log('[AIManager] 返回内容长度:', result.content.length);
            console.log('[AIManager] Chunks数量:', result.chunkCount);

            // 如果有reasoning内容（DeepSeek R1等），记录到日志
            if (result.reasoning) {
                console.log('[AIManager] Reasoning长度:', result.reasoning.length);
            }

            return result.content;

        } catch (error) {
            console.error('[AIManager] ========== 请求失败详情 ==========');
            console.error('[AIManager] 错误信息:', error.message);

            // LLMClient已经处理了大部分错误，这里只需要添加特定的提示
            if (error.message.includes('网络连接失败')) {
                throw new Error(`❌ 网络请求失败（CORS跨域问题）

可能的原因：
1. API服务器未配置CORS允许跨域访问
2. 请求的URL：${this.config.apiUrl || '(未设置)'}

🔧 New API解决方案：
在docker run命令中添加环境变量：
-e ALLOWED_ORIGIN="*"

或在.env文件中添加：
ALLOWED_ORIGIN=*

详细错误: ${error.message}`);
            }

            throw error;
        }
    }

    /**
     * 调用Claude API
     * 保留独立实现，因为Claude API格式与OpenAI不同
     */
    async callClaude(userMessage, context, character) {
        const apiUrl = this.config.apiUrl || 'https://api.anthropic.com/v1/messages';

        // 构建消息数组
        const messages = [];

        // Claude的system参数是独立的，不在messages数组中
        let systemPrompt = '';
        if (character) {
            systemPrompt = character.getSystemPrompt();
        }

        // 对话历史
        if (context && context.length > 0) {
            context.forEach(msg => {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                });
            });
        }

        // 当前用户消息
        messages.push({
            role: 'user',
            content: userMessage
        });

        console.log('[AIManager] Claude请求消息数:', messages.length);

        const requestBody = {
            model: this.config.model || 'claude-3-sonnet-20240229',
            max_tokens: character?.max_tokens || this.config.maxTokens,
            temperature: character?.temperature || this.config.temperature,
            messages: messages
        };

        // 添加系统提示词
        if (systemPrompt) {
            requestBody.system = systemPrompt;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Claude API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    /**
     * 获取当前配置（用于UI显示）
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * 测试API连接
     */
    async testConnection() {
        if (!this.config.apiKey) {
            return { success: false, message: '请先输入API Key' };
        }

        try {
            console.log('[AIManager] 测试API连接...');

            const testMessage = '你好';
            const testContext = [];
            const testCharacter = {
                getSystemPrompt: () => '你是一个友好的助手',
                temperature: this.config.temperature,
                max_tokens: 100  // 测试时使用少量token以节省成本
            };

            await this.getResponse('test', testMessage, testContext, testCharacter);

            return { success: true, message: 'API连接成功！' };

        } catch (error) {
            console.error('[AIManager] 测试失败:', error);
            return { success: false, message: error.message };
        }
    }
}

// 全局实例
if (typeof window !== 'undefined') {
    window.AIManager = AIManager;
}
