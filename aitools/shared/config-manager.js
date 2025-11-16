/**
 * AI配置管理器
 * 统一管理所有AI工具的配置，提供向后兼容和自动迁移功能
 */

/**
 * 配置优先级：
 * 1. ai_config（新统一键名）
 * 2. aichat_config（向后兼容）
 * 3. chattavern_ai_config（向后兼容）
 */
export class AIConfigManager {
    /**
     * 配置键名
     */
    static CONFIG_KEYS = {
        NEW: 'ai_config',           // 新统一键名
        AICHAT: 'aichat_config',    // aichat旧键名
        CHATTAVERN: 'chattavern_ai_config'  // chattavern旧键名
    };

    /**
     * 默认配置（不包含API key）
     */
    static DEFAULT_CONFIG = {
        enabled: true,
        apiUrl: '',
        apiKey: '',  // 空字符串，强制用户配置
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: ''
    };

    /**
     * 获取配置（按优先级读取并自动迁移）
     * @returns {Object|null} 配置对象，如果没有配置返回null
     */
    static getConfig() {
        // 优先读取新键名
        let configStr = localStorage.getItem(this.CONFIG_KEYS.NEW);
        let source = 'ai_config';

        // 如果新键名不存在，尝试读取aichat配置并迁移
        if (!configStr) {
            configStr = localStorage.getItem(this.CONFIG_KEYS.AICHAT);
            if (configStr) {
                console.log('[AIConfigManager] 检测到aichat_config，自动迁移到ai_config');
                source = 'aichat_config';
                // 迁移到新键名
                localStorage.setItem(this.CONFIG_KEYS.NEW, configStr);
            }
        }

        // 如果还是不存在，尝试读取chattavern配置并迁移
        if (!configStr) {
            configStr = localStorage.getItem(this.CONFIG_KEYS.CHATTAVERN);
            if (configStr) {
                console.log('[AIConfigManager] 检测到chattavern_ai_config，自动迁移到ai_config');
                source = 'chattavern_ai_config';
                // 迁移到新键名
                localStorage.setItem(this.CONFIG_KEYS.NEW, configStr);
            }
        }

        if (!configStr) {
            return null;
        }

        try {
            const config = JSON.parse(configStr);
            console.log(`[AIConfigManager] 配置加载成功（来源：${source}）`);
            return config;
        } catch (error) {
            console.error('[AIConfigManager] 配置解析失败:', error);
            return null;
        }
    }

    /**
     * 获取配置并合并默认值
     * @returns {Object} 完整的配置对象
     */
    static getConfigWithDefaults() {
        const config = this.getConfig();
        return config ? { ...this.DEFAULT_CONFIG, ...config } : { ...this.DEFAULT_CONFIG };
    }

    /**
     * 保存配置
     * @param {Object} config 配置对象
     */
    static saveConfig(config) {
        // 保存到新键名
        localStorage.setItem(this.CONFIG_KEYS.NEW, JSON.stringify(config));
        console.log('[AIConfigManager] 配置已保存到ai_config');

        // 为了向后兼容，同时保存到旧键名
        // 这样即使用户回退到旧版本代码也能继续使用
        localStorage.setItem(this.CONFIG_KEYS.AICHAT, JSON.stringify(config));
        localStorage.setItem(this.CONFIG_KEYS.CHATTAVERN, JSON.stringify(config));
    }

    /**
     * 验证配置是否完整
     * @param {Object} config 配置对象
     * @returns {{valid: boolean, message: string}}
     */
    static validateConfig(config) {
        if (!config) {
            return { valid: false, message: '配置不存在' };
        }

        if (!config.apiKey || config.apiKey.trim() === '') {
            return { valid: false, message: '请配置API Key' };
        }

        if (!config.apiUrl || config.apiUrl.trim() === '') {
            return { valid: false, message: '请配置API URL' };
        }

        if (!config.model || config.model.trim() === '') {
            return { valid: false, message: '请选择模型' };
        }

        return { valid: true, message: '配置有效' };
    }

    /**
     * 检查API是否已配置且可用
     * @returns {boolean}
     */
    static isAPIConfigured() {
        const config = this.getConfig();
        if (!config) {
            return false;
        }

        const validation = this.validateConfig(config);
        return validation.valid;
    }

    /**
     * 清除所有配置（包括新旧键名）
     */
    static clearAllConfigs() {
        localStorage.removeItem(this.CONFIG_KEYS.NEW);
        localStorage.removeItem(this.CONFIG_KEYS.AICHAT);
        localStorage.removeItem(this.CONFIG_KEYS.CHATTAVERN);
        console.log('[AIConfigManager] 所有AI配置已清除');
    }

    /**
     * 获取配置摘要（用于调试）
     * @returns {Object}
     */
    static getConfigSummary() {
        const config = this.getConfig();
        if (!config) {
            return { configured: false };
        }

        return {
            configured: true,
            hasApiKey: !!config.apiKey && config.apiKey.length > 0,
            hasApiUrl: !!config.apiUrl && config.apiUrl.length > 0,
            model: config.model,
            apiKeyPrefix: config.apiKey ? config.apiKey.substring(0, 10) + '...' : '(未设置)',
            validation: this.validateConfig(config)
        };
    }
}

// 默认导出
export default AIConfigManager;
