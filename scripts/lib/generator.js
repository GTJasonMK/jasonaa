/**
 * Generator - AI内容生成器
 * 负责调用LLM生成预生成内容
 */

const fs = require('fs').promises;
const path = require('path');

class Generator {
    /**
     * @param {Object} config - AI配置
     * @param {string} language - 语言（english/japanese）
     * @param {Object} rateLimiter - 速率限制器实例
     */
    constructor(config, language, rateLimiter) {
        this.config = config;
        this.language = language;
        this.rateLimiter = rateLimiter;
        this.llmClient = null;
        this.templates = this.getTemplates(language);
    }

    /**
     * 初始化LLM客户端
     */
    async init() {
        try {
            // 动态导入LLMClient
            const modulePath = path.resolve(__dirname, '../../aitools/aichat/llm-client.js');
            const { LLMClient } = await import(`file://${modulePath}`);

            // 创建客户端实例
            this.llmClient = LLMClient.createFromConfig({
                apiKey: this.config.apiKey,
                baseUrl: this.config.apiUrl,
                model: this.config.model,
                simulateBrowser: true
            });

            console.log('[Generator] LLM客户端初始化成功');
            console.log(`  模型: ${this.config.model}`);
            console.log(`  API: ${this.config.apiUrl}`);
        } catch (error) {
            console.error('[Generator] 初始化LLM客户端失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取语言特定的提示词模板
     */
    getTemplates(language) {
        const phoneticTerm = language === 'japanese' ? '假名' : '音标';

        return {
            synonyms: (word, definition) =>
                `请详细分析"${word}"（${definition}）的同义词及其区别。

要求：
1. 列出3-5个主要同义词，每个包含：
   - ${phoneticTerm}
   - 与"${word}"的核心区别（使用场景、语气、正式程度）
   - 例句对比（用${word}和同义词分别造句）
2. 用表格形式对比关键差异
3. 总结使用建议

使用markdown格式，确保内容详尽。`,

            phrases: (word, definition) =>
                `请详细列出"${word}"（${definition}）的常用短语搭配和用法。

要求：
1. 列出5-8个最常用的短语搭配
2. 每个短语包含：
   - 完整的短语表达（${phoneticTerm}标注）
   - 详细的中文翻译
   - 至少一个地道的例句（附${phoneticTerm}和中文翻译）
   - 使用场景说明（口语/书面语、正式/非正式）
3. 如有固定搭配的助词，需特别标注

使用markdown列表格式，确保内容详尽。`
        };
    }

    /**
     * 生成单个查询的内容
     * @param {Object} wordData - 单词数据 { word, phonetic, definition }
     * @param {string} type - 查询类型 (synonyms/phrases)
     * @param {number} maxRetries - 最大重试次数
     * @returns {Promise<Object>} { content, tokens, finishReason }
     */
    async generateQuery(wordData, type, maxRetries = 3) {
        const prompt = this.templates[type](wordData.word, wordData.definition);

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // 等待速率限制
                await this.rateLimiter.wait();

                console.log(`[Generator] 生成 ${wordData.word} - ${type} (尝试 ${attempt}/${maxRetries})`);

                // 调用LLM
                const messages = [
                    {
                        role: 'system',
                        content: '你是一个专业的语言学习助手。请用详细、清晰的方式回答，使用markdown格式组织内容。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ];

                const result = await this.llmClient.streamAndCollect(messages, {
                    timeout: 120,
                    temperature: this.config.temperature || 0.7,
                    maxTokens: this.config.maxTokens || 2000,
                    maxRetries: 0 // 禁用llmClient内部重试，由我们控制
                });

                // 成功记录
                this.rateLimiter.recordSuccess();

                // 估算token数量（流式API不提供usage字段）
                // 简单估算：中文字符 * 2 + 英文单词数 * 1.3
                const estimatedTokens = this.estimateTokens(result.content);

                return {
                    content: result.content,
                    tokens: estimatedTokens,
                    finishReason: result.finishReason || 'stop'
                };

            } catch (error) {
                console.error(`[Generator] 生成失败 (尝试 ${attempt}/${maxRetries}):`, error.message);

                // 错误分类
                if (error.status === 429) {
                    // 速率限制错误
                    const retryAfter = error.headers?.['retry-after'];
                    this.rateLimiter.recordFailure(retryAfter ? parseInt(retryAfter) : null);

                    if (attempt < maxRetries) {
                        const delay = this.rateLimiter.getCurrentDelay();
                        console.log(`[Generator] 等待 ${(delay / 1000).toFixed(1)} 秒后重试...`);
                        await this.rateLimiter.sleep(delay);
                        continue;
                    }
                } else if (error.status === 401 || error.status === 403) {
                    // 认证错误，不可重试
                    throw new Error(`认证失败: ${error.message}`);
                } else {
                    // 其他错误（网络、超时等），可重试
                    this.rateLimiter.recordError();

                    if (attempt < maxRetries) {
                        console.log(`[Generator] ${Math.min(5, attempt * 2)} 秒后重试...`);
                        await this.rateLimiter.sleep(Math.min(5000, attempt * 2000));
                        continue;
                    }
                }

                // 所有重试都失败
                throw error;
            }
        }
    }

    /**
     * 生成单词的完整数据（synonyms + phrases）
     * @param {Object} wordData - 单词数据
     * @param {Array} pendingQueries - 待处理的查询类型
     * @returns {Promise<Object>} 生成结果
     */
    async generateWord(wordData, pendingQueries = ['synonyms', 'phrases']) {
        const result = {};

        for (const type of pendingQueries) {
            try {
                const queryResult = await this.generateQuery(wordData, type);
                result[type] = {
                    content: queryResult.content,
                    generated: new Date().toISOString(),
                    tokens: queryResult.tokens,
                    finishReason: queryResult.finishReason
                };
            } catch (error) {
                result[type] = {
                    error: error.message,
                    generated: new Date().toISOString()
                };
                throw error; // 向上传播错误
            }
        }

        return result;
    }

    /**
     * 估算文本的token数量
     * @param {string} text - 文本内容
     * @returns {number} 估算的token数量
     */
    estimateTokens(text) {
        if (!text) return 0;

        // 分离中文字符和英文单词
        const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
        const englishWords = text.match(/[a-zA-Z]+/g) || [];

        // 估算规则：
        // - 中文字符：每个字符约1.5 tokens
        // - 英文单词：每个单词约1.3 tokens
        // - 标点和空格：按字符数的0.5倍
        const chineseTokens = chineseChars.length * 1.5;
        const englishTokens = englishWords.length * 1.3;
        const otherTokens = (text.length - chineseChars.length - englishWords.join('').length) * 0.5;

        return Math.ceil(chineseTokens + englishTokens + otherTokens);
    }

    /**
     * 获取速率限制器统计
     */
    getRateLimiterStats() {
        return this.rateLimiter.getStats();
    }
}

module.exports = Generator;
