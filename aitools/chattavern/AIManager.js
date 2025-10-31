/**
 * AI管理器 - 负责调用各种LLM API
 * 支持OpenAI、Claude等主流AI服务
 */
class AIManager {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * 从localStorage加载配置
     */
    loadConfig() {
        const saved = localStorage.getItem('chattavern_ai_config');
        const defaultConfig = {
            provider: 'openai',  // 'openai' | 'claude' | 'deepseek' | 'custom'
            apiKey: '',
            model: 'gpt-3.5-turbo',
            apiUrl: '',  // 自定义API地址（可选）
            temperature: 0.9,  // 角色扮演建议使用较高的temperature
            maxTokens: 2000,   // 增大默认值，支持更长的回复
            enabled: false
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
    }

    /**
     * 检查AI是否可用
     */
    async isAvailable() {
        return this.config.enabled && this.config.apiKey && this.config.apiKey.length > 0;
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
                    response = await this.callOpenAI(userMessage, context, character);
                    break;
                case 'claude':
                    response = await this.callClaude(userMessage, context, character);
                    break;
                case 'deepseek':
                    response = await this.callDeepSeek(userMessage, context, character);
                    break;
                case 'custom':
                    response = await this.callCustomAPI(userMessage, context, character);
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
     * 调用OpenAI API
     */
    async callOpenAI(userMessage, context, character) {
        // URL处理：自动补全endpoint
        let apiUrl = this.config.apiUrl || 'https://api.openai.com/v1/chat/completions';

        // 如果URL不包含/chat/completions，自动补全（用于New API等服务）
        if (this.config.apiUrl && !this.config.apiUrl.includes('/chat/completions')) {
            // 移除末尾的斜杠
            const baseUrl = this.config.apiUrl.replace(/\/$/, '');
            // 如果URL已经包含/v1，直接加/chat/completions
            if (baseUrl.endsWith('/v1')) {
                apiUrl = baseUrl + '/chat/completions';
            } else {
                // 否则加/v1/chat/completions
                apiUrl = baseUrl + '/v1/chat/completions';
            }
            console.log('[AIManager] 自动补全URL:', this.config.apiUrl, '→', apiUrl);
        }

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

        const requestBody = {
            model: this.config.model,
            messages: messages,
            temperature: character?.temperature || this.config.temperature,
            max_tokens: character?.max_tokens || this.config.maxTokens
        };

        console.log('[AIManager] ========== API请求详情 ==========');
        console.log('[AIManager] 请求URL:', apiUrl);
        console.log('[AIManager] 请求模型:', requestBody.model);
        console.log('[AIManager] 消息数量:', messages.length);
        console.log('[AIManager] Temperature:', requestBody.temperature);
        console.log('[AIManager] Max Tokens:', requestBody.max_tokens);
        console.log('[AIManager] API Key前缀:', this.config.apiKey.substring(0, 15) + '...');

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                mode: 'cors', // 明确指定CORS模式
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('[AIManager] 响应状态:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || errorData.message || response.statusText;
                console.error('[AIManager] API返回错误:', errorData);
                throw new Error(`API错误 (${response.status}): ${errorMsg}`);
            }

            const data = await response.json();
            console.log('[AIManager] 请求成功，返回内容长度:', data.choices?.[0]?.message?.content?.length || 0);
            return data.choices[0].message.content;

        } catch (error) {
            console.error('[AIManager] ========== 请求失败详情 ==========');
            console.error('[AIManager] 错误类型:', error.name);
            console.error('[AIManager] 错误信息:', error.message);

            // 检测CORS错误
            if (error.message.includes('CORS') ||
                error.message.includes('Failed to fetch') ||
                error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(`❌ 网络请求失败（CORS跨域问题）

可能的原因：
1. API服务器未配置CORS允许跨域访问
2. 请求的URL：${apiUrl}

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
     * 调用DeepSeek API
     */
    async callDeepSeek(userMessage, context, character) {
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';

        // 构建消息数组（与OpenAI格式相同）
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

        console.log('[AIManager] DeepSeek请求消息数:', messages.length);

        const requestBody = {
            model: this.config.model || 'deepseek-chat',
            messages: messages,
            temperature: character?.temperature || this.config.temperature,
            max_tokens: character?.max_tokens || this.config.maxTokens
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`DeepSeek API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * 调用自定义API（兼容OpenAI格式）
     */
    async callCustomAPI(userMessage, context, character) {
        if (!this.config.apiUrl) {
            throw new Error('未配置自定义API地址');
        }

        // 使用OpenAI格式，但发送到自定义URL
        return this.callOpenAI(userMessage, context, character);
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
