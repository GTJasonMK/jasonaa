/**
 * 英语词汇练习模块
 * 提供词汇书选择、随机抽词、练习统计等功能
 */

// 词汇书配置
const VOCABULARY_BOOKS = [
    {
        id: 'cet4_edited',
        name: '大学英语四级（AI增强版）',
        file: 'CET4_edited.txt',
        description: '约4544词，含AI生成的同义词辨析和短语搭配'
    },
    {
        id: 'cet6_edited',
        name: '大学英语六级（AI增强版）',
        file: 'CET6_edited.txt',
        description: '约2000词，含AI生成的同义词辨析和短语搭配'
    },
    {
        id: 'toefl',
        name: '托福词汇（AI增强版）',
        file: 'TOEFL.txt',
        description: '约4516词，含AI生成的同义词辨析和短语搭配'
    },
    {
        id: 'gre_8000_words',
        name: 'GRE词汇（AI增强版）',
        file: 'GRE_8000_Words.txt',
        description: '约7732词，含AI生成的同义词辨析和短语搭配'
    }
];

/**
 * 单词历史管理器
 * 维护最近50个单词的历史记录及其AI对话
 */
class WordHistoryManager {
    /**
     * @param {number} maxSize - 最大历史记录数量
     */
    constructor(maxSize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxSize = maxSize;
    }

    /**
     * 添加单词到历史
     * @param {Object} wordData - 单词数据
     * @param {Array} aiResponses - AI回复列表
     */
    addWord(wordData, aiResponses = []) {
        const historyItem = {
            word: { ...wordData },
            aiResponses: aiResponses.map(r => ({ ...r })),
            timestamp: Date.now()
        };

        // 如果不在历史末尾，截断后续历史（类似浏览器历史）
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // 添加新单词
        this.history.push(historyItem);
        this.currentIndex = this.history.length - 1;

        // 维护最大大小限制
        if (this.history.length > this.maxSize) {
            this.history.shift();
            this.currentIndex--;
        }
    }

    /**
     * 导航到指定方向
     * @param {number} direction - 方向 (1: 下一个, -1: 上一个)
     * @returns {Object|null} {success, wordData, aiResponses, position, total}
     */
    navigate(direction) {
        const newIndex = this.currentIndex + direction;

        if (newIndex < 0 || newIndex >= this.history.length) {
            return {
                success: false,
                position: this.currentIndex + 1,
                total: this.history.length
            };
        }

        this.currentIndex = newIndex;
        const item = this.history[this.currentIndex];

        return {
            success: true,
            wordData: item.word,
            aiResponses: item.aiResponses,
            position: this.currentIndex + 1,
            total: this.history.length
        };
    }

    /**
     * 获取当前单词
     * @returns {Object|null}
     */
    getCurrentWord() {
        if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
            return null;
        }
        const item = this.history[this.currentIndex];
        return {
            wordData: item.word,
            aiResponses: item.aiResponses,
            position: this.currentIndex + 1,
            total: this.history.length
        };
    }

    /**
     * 更新当前单词的AI回复
     * @param {Array} aiResponses - 新的AI回复列表
     */
    updateCurrentAIResponses(aiResponses) {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            this.history[this.currentIndex].aiResponses = aiResponses.map(r => ({ ...r }));
        }
    }

    /**
     * 是否在历史末尾
     * @returns {boolean}
     */
    isAtEnd() {
        return this.currentIndex === this.history.length - 1;
    }

    /**
     * 是否在历史开始
     * @returns {boolean}
     */
    isAtStart() {
        return this.currentIndex === 0;
    }

    /**
     * 获取历史信息
     * @returns {Object}
     */
    getInfo() {
        return {
            position: this.currentIndex + 1,
            total: this.history.length,
            isAtStart: this.isAtStart(),
            isAtEnd: this.isAtEnd()
        };
    }

    /**
     * 重置历史
     */
    reset() {
        this.history = [];
        this.currentIndex = -1;
    }
}

/**
 * 词汇加载器
 * 负责从txt文件加载和解析词汇数据
 */
class VocabularyLoader {
    /**
     * 加载词汇书
     * @param {string} fileName - 词汇书文件名
     * @returns {Promise<Array>} 词汇数组
     */
    async loadBook(fileName) {
        try {
            const response = await fetch(`wordlists/${fileName}`);
            if (!response.ok) {
                throw new Error(`加载失败: ${response.status}`);
            }

            const text = await response.text();
            return this.parseVocabulary(text);
        } catch (error) {
            console.error('加载词汇书失败:', error);
            throw error;
        }
    }

    /**
     * 解析词汇文本
     * @param {string} text - 原始文本
     * @returns {Array} 解析后的词汇数组
     */
    parseVocabulary(text) {
        const lines = text.split('\n');
        const vocabulary = [];

        // 正则表达式匹配：单词 [音标] 剩余部分
        const pattern = /^(\S+)\s+\[([^\]]+)\]\s+(.+)$/;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.length < 3) continue;

            // 跳过标题行和分隔行
            if (trimmed.match(/^[A-Z\s]+$/) || trimmed.match(/^[（）\d]+$/)) {
                continue;
            }

            const match = trimmed.match(pattern);
            if (match) {
                const [, word, phonetic, definition] = match;
                vocabulary.push({
                    word: word.trim(),
                    phonetic: phonetic.trim(),
                    definition: definition.trim()
                });
            }
        }

        console.log(`成功加载 ${vocabulary.length} 个单词`);
        return vocabulary;
    }
}

/**
 * 单词选择器
 * 负责随机选择单词，避免短期内重复
 */
class WordSelector {
    /**
     * @param {Array} words - 词汇数组
     */
    constructor(words) {
        this.words = words;
        this.indices = this.shuffle([...Array(words.length).keys()]);
        this.currentIndex = 0;
    }

    /**
     * 洗牌算法 (Fisher-Yates)
     * @param {Array} array - 要洗牌的数组
     * @returns {Array} 洗牌后的数组
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * 获取下一个单词
     * @returns {Object} 单词对象
     */
    getNext() {
        // 如果所有单词都遍历完，重新洗牌
        if (this.currentIndex >= this.indices.length) {
            console.log('所有单词已遍历完，重新洗牌');
            this.indices = this.shuffle(this.indices);
            this.currentIndex = 0;
        }

        const wordIndex = this.indices[this.currentIndex];
        this.currentIndex++;
        return this.words[wordIndex];
    }

    /**
     * 重置选择器
     */
    reset() {
        this.indices = this.shuffle([...Array(this.words.length).keys()]);
        this.currentIndex = 0;
    }
}

/**
 * 练习管理器
 * 负责统计和进度管理
 */
class PracticeManager {
    /**
     * @param {string} bookId - 词汇书ID
     */
    constructor(bookId) {
        this.bookId = bookId;
        this.stats = {
            seen: 0,
            known: 0
        };
        this.loadProgress();
    }

    /**
     * 标记为认识
     */
    markKnown() {
        this.stats.known++;
        this.stats.seen++;
        this.saveProgress();
    }

    /**
     * 标记为不认识
     */
    markUnknown() {
        this.stats.seen++;
        this.saveProgress();
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计对象
     */
    getStats() {
        const percent = this.stats.seen > 0
            ? Math.round((this.stats.known / this.stats.seen) * 100)
            : 0;

        return {
            known: this.stats.known,
            seen: this.stats.seen,
            percent: percent
        };
    }

    /**
     * 保存进度到localStorage
     */
    saveProgress() {
        const key = `english_practice_${this.bookId}_progress`;
        const data = {
            ...this.stats,
            lastDate: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(data));
    }

    /**
     * 从localStorage加载进度
     */
    loadProgress() {
        const key = `english_practice_${this.bookId}_progress`;
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.stats.seen = data.seen || 0;
                this.stats.known = data.known || 0;
                console.log(`加载进度: ${this.stats.known}/${this.stats.seen}`);
            } catch (error) {
                console.error('加载进度失败:', error);
            }
        }
    }

    /**
     * 重置进度
     */
    reset() {
        this.stats = { seen: 0, known: 0 };
        this.saveProgress();
    }
}

/**
 * AI助手类
 * 负责AI查询、历史管理和UI更新
 */
// 查询状态枚举
const QueryState = {
    UNQUERIED: 'unqueried',        // 从未查询
    PREGENERATED: 'pregenerated',  // 显示预生成内容
    LOADING_LATEST: 'loading',     // 正在查询最新内容
    LATEST: 'latest',              // 显示最新内容
    ERROR: 'error'                 // 查询失败
};

class AIAssistant {
    constructor(bookId = null) {
        this.responseHistory = [];
        this.currentIndex = -1;
        this.currentWord = null;
        this.cache = new Map();
        this.llmClient = null;

        // 状态管理
        this.queryStates = new Map();  // 跟踪每个单词+类型的查询状态
        this.latestCache = new Map();  // Tier 2最新查询的缓存
        this.pregeneratedLoader = null; // 预生成数据加载器

        // 初始化预生成加载器
        if (bookId && typeof PregeneratedDataLoader !== 'undefined') {
            this.pregeneratedLoader = new PregeneratedDataLoader(bookId, 'english');
            console.log(`[AIAssistant] 预生成加载器已初始化: ${bookId}`);
        }

        // 配置marked.js用于markdown渲染
        this.setupMarked();

        // DOM元素
        this.container = document.getElementById('ai-output-container');
        this.outputBox = document.getElementById('ai-output-box');
        this.outputLabel = document.getElementById('ai-output-label');
        this.responseIndex = document.getElementById('ai-response-index');
        this.prevBtn = document.getElementById('ai-nav-prev');
        this.nextBtn = document.getElementById('ai-nav-next');
        this.aiButtons = document.querySelectorAll('.ai-btn[data-type]');

        // 按钮文本配置
        this.buttonTexts = {
            synonyms: {
                default: '相近释义及区别',
                hasPregenerated: '查询最新释义变化',
                hasLatest: '查看预生成内容'
            },
            phrases: {
                default: '短语及用法',
                hasPregenerated: '查询最新短语搭配',
                hasLatest: '查看预生成内容'
            }
        };

        // 提示词模板
        this.templates = {
            // Tier 1: 详细预生成版本
            synonyms: (word, definition) =>
                `请详细分析"${word}"（${definition}）的同义词及其区别。

要求：
1. 列出3-5个主要同义词，每个包含：
   - 音标
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
   - 完整的短语表达
   - 详细的中文翻译
   - 至少一个地道的例句（附中文翻译）
   - 使用场景说明（口语/书面语、正式/非正式）
3. 如有固定搭配的介词或冠词，需特别标注

使用markdown列表格式，确保内容详尽。`,

            // Tier 2: 时效性查询版本
            synonyms_latest: (word, definition) =>
                `关于单词"${word}"（${definition}），用户已有详细的同义词分析。

请只补充最新的用法变化（2023-2024年）：
1. 是否在网络流行语中有新含义？
2. 社交媒体上是否出现新的使用场景？
3. 是否因文化事件产生新的引申义？
4. 与同义词的使用偏好是否有变化趋势？

如果该词用法稳定，没有明显新变化，请直接说明。保持简洁。`,

            phrases_latest: (word, definition) =>
                `关于单词"${word}"（${definition}），用户已有详细的短语搭配说明。

请只补充最新出现的搭配和用法（2023-2024年）：
1. 新的流行搭配
2. 最近媒体/社交平台上的热门用法
3. 新兴语境中的特殊用法

如果没有明显的新搭配出现，请直接说明。保持简洁。`,

            custom: (word, question) =>
                `关于单词"${word}"：${question}。请简洁回答。`
        };
    }

    /**
     * 配置marked.js
     */
    setupMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                gfm: true,
                breaks: true,
                pedantic: false,
                sanitize: false,
                smartLists: true,
                smartypants: true,
                highlight: (code, lang) => {
                    if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(code, { language: lang }).value;
                        } catch (err) {
                            console.error('代码高亮失败:', err);
                        }
                    }
                    return typeof hljs !== 'undefined' ? hljs.highlightAuto(code).value : code;
                }
            });
            console.log('[AIAssistant] Marked配置完成');
        }
    }

    /**
     * 设置当前单词
     */
    setCurrentWord(word) {
        this.currentWord = word;
        this.updateButtonStates(); // 更新按钮显示状态
    }

    /**
     * 获取状态键
     */
    getStateKey(type) {
        if (!this.currentWord) return null;
        return `${this.currentWord.word}_${type}`;
    }

    /**
     * 获取当前查询状态
     */
    getQueryState(type) {
        const key = this.getStateKey(type);
        return this.queryStates.get(key) || QueryState.UNQUERIED;
    }

    /**
     * 设置查询状态
     */
    setQueryState(type, state) {
        const key = this.getStateKey(type);
        if (key) {
            this.queryStates.set(key, state);
            this.updateButtonStates();
        }
    }

    /**
     * 更新所有AI按钮的显示状态
     */
    updateButtonStates() {
        this.aiButtons.forEach(btn => {
            const type = btn.dataset.type;
            if (!type || !this.buttonTexts[type]) return;

            const state = this.getQueryState(type);
            const textSpan = btn.querySelector('.ai-btn-text');
            if (!textSpan) return;

            const config = this.buttonTexts[type];
            let newText = config.default;
            let title = btn.getAttribute('title').split('\n')[0]; // 保留原始title的第一行

            switch (state) {
                case QueryState.UNQUERIED:
                    newText = config.default;
                    break;

                case QueryState.PREGENERATED:
                    newText = config.hasPregenerated;
                    title = title + '\n(将调用AI生成最新内容)';
                    break;

                case QueryState.LATEST:
                    newText = config.hasLatest;
                    break;

                case QueryState.LOADING_LATEST:
                    newText = '生成中...';
                    break;

                case QueryState.ERROR:
                    newText = '重试';
                    break;
            }

            textSpan.textContent = newText;
            btn.setAttribute('title', title);
        });
    }

    /**
     * 加载预生成内容
     * @param {string} type - 查询类型
     * @returns {Promise<boolean>} 是否成功加载
     */
    async loadPregenerated(type) {
        if (!this.pregeneratedLoader) {
            console.log('[AIAssistant] 预生成加载器未初始化，降级到实时查询');
            return false;
        }

        try {
            const wordData = await this.pregeneratedLoader.getWord(this.currentWord.word);

            if (!wordData || !wordData[type]) {
                console.log(`[AIAssistant] 未找到单词"${this.currentWord.word}"的预生成${type}数据`);
                return false;
            }

            const content = wordData[type].content;

            // 添加到历史
            this.addToHistory(type, '', content, 'pregenerated');

            // 更新状态
            this.setQueryState(type, QueryState.PREGENERATED);

            // 显示内容
            this.displayCurrent();

            console.log(`[AIAssistant] 成功加载预生成内容: ${type}`);
            return true;
        } catch (error) {
            console.error('[AIAssistant] 加载预生成内容失败:', error);
            return false;
        }
    }

    /**
     * 加载最新内容
     * @param {string} type - 查询类型
     * @param {string} customQuestion - 自定义问题（可选）
     */
    async loadLatest(type, customQuestion = '') {
        // 检查缓存
        const cacheKey = this.getCacheKey(type + '_latest', customQuestion);
        if (this.latestCache.has(cacheKey)) {
            console.log('[AIAssistant] 使用缓存的最新内容');
            const cached = this.latestCache.get(cacheKey);
            this.addToHistory(type, customQuestion, cached, 'latest');
            this.setQueryState(type, QueryState.LATEST);
            this.displayCurrent();
            return;
        }

        // 显示加载状态
        this.setQueryState(type, QueryState.LOADING_LATEST);
        this.showStreamingLoading(type, '查询最新内容中...');

        try {
            // 调用API获取最新内容
            const prompt = this.buildPrompt(type + '_latest', customQuestion);
            const response = await this.queryFromAPI(prompt);

            // 缓存响应
            this.latestCache.set(cacheKey, response);

            // 限制缓存大小
            if (this.latestCache.size > 50) {
                const firstKey = this.latestCache.keys().next().value;
                this.latestCache.delete(firstKey);
            }

            // 添加到历史
            this.addToHistory(type, customQuestion, response, 'latest');

            // 更新状态
            this.setQueryState(type, QueryState.LATEST);

            // 显示内容
            this.displayCurrent();

            console.log(`[AIAssistant] 成功获取最新内容: ${type}`);
        } catch (error) {
            console.error('[AIAssistant] 加载最新内容失败:', error);
            this.setQueryState(type, QueryState.ERROR);
            this.showError(`查询失败: ${error.message}`);
        }
    }

    /**
     * 从API查询
     * @param {string} prompt - 提示词
     * @returns {Promise<string>} 响应内容
     */
    async queryFromAPI(prompt) {
        // 检查AI配置
        if (!await this.ensureAIClient()) {
            throw new Error('AI客户端未初始化');
        }

        const messages = [
            {
                role: 'system',
                content: '你是一个专业的语言学习助手。请用简洁、清晰的方式回答，避免冗余。使用markdown格式组织内容，保持精练。'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        // 流式输出
        let accumulatedContent = '';
        let lastUpdateTime = 0;

        const onChunk = ({ type: chunkType, text }) => {
            if (chunkType === 'content') {
                accumulatedContent += text;

                const now = Date.now();
                if (now - lastUpdateTime >= 30) {
                    lastUpdateTime = now;
                    this.updateStreamingContentFast(accumulatedContent);
                }
            }
        };

        const result = await this.llmClient.stream(messages, {
            timeout: 120,
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            maxRetries: 2
        }, onChunk);

        const response = result.content;

        // 最终渲染
        if (result.finishReason === 'length') {
            const warningHtml = '<div class="ai-truncation-warning"><strong>提示：</strong>回复因长度限制被截断，以下是部分内容。</div>';
            this.outputBox.innerHTML = warningHtml + this.formatResponse(response);
            this.outputBox.scrollTop = this.outputBox.scrollHeight;
        } else {
            this.updateStreamingContent(response);
        }

        return response;
    }

    /**
     * 加载历史AI回复
     * @param {Array} aiResponses - AI回复历史
     */
    loadHistory(aiResponses) {
        this.responseHistory = aiResponses.map(r => ({
            word: { ...r.word },
            type: r.type,
            question: r.question,
            response: r.response,
            timestamp: r.timestamp
        }));
        this.currentIndex = this.responseHistory.length > 0 ? this.responseHistory.length - 1 : -1;
    }

    /**
     * 查询AI（重构版：两层查询+状态机）
     * @param {string} type - 查询类型
     * @param {string} customQuestion - 自定义问题（可选）
     */
    async query(type, customQuestion = '') {
        if (!this.currentWord) {
            this.showError('请先选择一个单词');
            return;
        }

        // 自定义问题：直接调用API，不使用预生成
        if (type === 'custom') {
            await this.handleCustomQuery(customQuestion);
            return;
        }

        // 获取当前状态
        const currentState = this.getQueryState(type);
        console.log(`[AIAssistant] 当前状态: ${currentState}, 类型: ${type}`);

        // 状态机逻辑
        switch (currentState) {
            case QueryState.UNQUERIED:
                // 第一次点击：尝试加载预生成内容
                const pregeneratedLoaded = await this.loadPregenerated(type);
                if (!pregeneratedLoaded) {
                    // 预生成失败，降级到实时查询
                    console.log('[AIAssistant] 预生成内容不可用，降级到实时查询');
                    await this.loadLatest(type);
                }
                break;

            case QueryState.PREGENERATED:
                // 第二次点击：查询最新内容
                await this.loadLatest(type);
                break;

            case QueryState.LATEST:
                // 第三次点击：切换回预生成内容
                if (this.pregeneratedLoader) {
                    await this.loadPregenerated(type);
                } else {
                    console.log('[AIAssistant] 无预生成内容，保持最新状态');
                }
                break;

            case QueryState.ERROR:
                // 错误状态：重试加载预生成或最新
                const retryLoaded = await this.loadPregenerated(type);
                if (!retryLoaded) {
                    await this.loadLatest(type);
                }
                break;

            case QueryState.LOADING_LATEST:
                // 正在加载中，忽略重复点击
                console.log('[AIAssistant] 正在加载中，请稍候...');
                break;
        }
    }

    /**
     * 处理自定义问题查询
     * @param {string} question - 用户问题
     */
    async handleCustomQuery(question) {
        // 检查AI配置
        if (!await this.ensureAIClient()) {
            return;
        }

        // 构建提示词
        const prompt = this.templates.custom(this.currentWord.word, question);

        // 显示加载状态
        this.showStreamingLoading('custom', '查询中...');

        try {
            // 调用API
            const response = await this.queryFromAPI(prompt);

            // 添加到历史
            this.addToHistory('custom', question, response, 'custom');

            // 显示内容
            this.displayCurrent();

        } catch (error) {
            console.error('[AIAssistant] 自定义问题查询失败:', error);
            this.showError(`查询失败: ${error.message}`);
        }
    }

    /**
     * 确保AI客户端已初始化
     */
    async ensureAIClient() {
        if (this.llmClient) {
            return true;
        }

        // 优先检查aichat配置，再检查chattavern配置（向后兼容）
        let configStr = localStorage.getItem('aichat_config');
        let configSource = 'aichat';

        if (!configStr) {
            configStr = localStorage.getItem('chattavern_ai_config');
            configSource = 'chattavern';
        }

        // 如果没有配置，使用默认配置
        let config;
        if (!configStr) {
            console.log('[AIAssistant] 未找到用户配置，使用默认LLM配置');
            config = {
                apiKey: 'sk-JyBLag34EOuLlYb_W5gnhR_qf9z1ZBlmg2dhq4r8jYFPxvV2Iy9vaC8ql4o',
                apiUrl: 'https://api.5202030.xyz/v1',
                model: 'deepseek/deepseek-v3.2-exp',
                temperature: 0.7,
                maxTokens: 4000
            };
            configSource = 'default';
        } else {
            config = JSON.parse(configStr);
        }

        try {
            // 动态导入LLMClient（使用ES6命名导出）
            const { LLMClient } = await import('../../aitools/aichat/llm-client.js');

            // 根据配置来源适配字段名
            const clientConfig = {
                apiKey: config.apiKey,
                baseUrl: configSource === 'aichat' || configSource === 'default'
                    ? config.apiUrl
                    : config.baseUrl,
                model: config.model,
                simulateBrowser: true
            };

            this.llmClient = LLMClient.createFromConfig(clientConfig);
            this.temperature = config.temperature || 0.7;
            this.maxTokens = config.maxTokens || 4000;

            console.log(`AI客户端初始化成功（使用${configSource}配置）`);
            return true;
        } catch (error) {
            console.error('初始化AI客户端失败:', error);
            this.showError(`初始化失败: ${error.message}`);
            return false;
        }
    }

    /**
     * 构建提示词
     */
    buildPrompt(type, customQuestion) {
        if (type === 'custom') {
            return this.templates.custom(this.currentWord.word, customQuestion);
        } else {
            // 支持 _latest 后缀
            const templateName = type.replace('_latest', '_latest');
            if (this.templates[templateName]) {
                return this.templates[templateName](this.currentWord.word, this.currentWord.definition);
            }
            return this.templates[type](this.currentWord.word, this.currentWord.definition);
        }
    }

    /**
     * 获取缓存键
     */
    getCacheKey(type, question) {
        return `${this.currentWord.word}_${type}_${question || ''}`;
    }

    /**
     * 添加到历史
     * @param {string} type - 查询类型
     * @param {string} question - 问题
     * @param {string} response - 响应内容
     * @param {string} source - 内容来源（pregenerated/latest/custom）
     */
    addToHistory(type, question, response, source = 'unknown') {
        this.responseHistory.push({
            word: { ...this.currentWord },
            type: type,
            question: question,
            response: response,
            source: source,
            timestamp: Date.now()
        });

        this.currentIndex = this.responseHistory.length - 1;
    }

    /**
     * 显示当前回复
     */
    displayCurrent() {
        if (this.currentIndex < 0 || this.currentIndex >= this.responseHistory.length) {
            return;
        }

        const current = this.responseHistory[this.currentIndex];

        // 显示容器
        this.container.style.display = 'flex';

        // 更新标签（使用data-source属性）
        const typeLabels = {
            synonyms: '相近释义',
            phrases: '短语用法',
            custom: '自定义问题'
        };

        const typeLabel = typeLabels[current.type] || current.type;
        this.outputLabel.textContent = `${typeLabel} | ${current.word.word}`;

        // 设置data-source属性用于CSS样式
        if (current.source) {
            this.outputLabel.setAttribute('data-source', current.source);
        } else {
            this.outputLabel.removeAttribute('data-source');
        }

        // 更新索引
        this.responseIndex.textContent = `${this.currentIndex + 1}/${this.responseHistory.length}`;

        // 更新内容
        this.outputBox.innerHTML = this.formatResponse(current.response);

        // 更新导航按钮状态
        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex === this.responseHistory.length - 1;
    }

    /**
     * 格式化响应内容
     */
    formatResponse(content) {
        try {
            // 移除外层的markdown代码块标记（如果存在）
            content = content.trim();
            if (content.startsWith('```markdown\n') && content.endsWith('```')) {
                content = content.slice(12, -3).trim();
            } else if (content.startsWith('```\n') && content.endsWith('```')) {
                content = content.slice(4, -3).trim();
            }

            // 使用marked解析markdown
            if (typeof marked !== 'undefined') {
                let html = marked.parse(content);

                // 使用DOMPurify清理HTML防止XSS
                if (typeof DOMPurify !== 'undefined') {
                    html = DOMPurify.sanitize(html, {
                        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
                                     'strong', 'em', 'code', 'pre', 'blockquote', 'br', 'hr',
                                     'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'],
                        ALLOWED_ATTR: ['href', 'class', 'id']
                    });
                }

                return html;
            }

            // 降级方案：简单的换行处理
            return content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        } catch (error) {
            console.error('格式化响应失败:', error);
            return content.replace(/\n/g, '<br>');
        }
    }

    /**
     * 导航到上一条/下一条
     */
    navigate(direction) {
        if (direction === 'prev' && this.currentIndex > 0) {
            this.currentIndex--;
            this.displayCurrent();
        } else if (direction === 'next' && this.currentIndex < this.responseHistory.length - 1) {
            this.currentIndex++;
            this.displayCurrent();
        }
    }

    /**
     * 显示加载状态
     */
    showLoading(type) {
        const typeLabels = {
            synonyms: '相近释义',
            phrases: '短语用法',
            custom: '自定义问题'
        };

        this.container.style.display = 'flex';
        this.outputLabel.textContent = `${typeLabels[type]} | ${this.currentWord.word}`;
        this.outputBox.innerHTML = '<div class="ai-loading">查询中，请稍候...</div>';
        this.prevBtn.disabled = true;
        this.nextBtn.disabled = true;
    }

    /**
     * 显示流式加��状态
     * @param {string} type - 查询类型
     * @param {string} message - 自定义加载信息（可选）
     */
    showStreamingLoading(type, message = '生成中...') {
        const typeLabels = {
            synonyms: '相近释义',
            phrases: '短语用法',
            custom: '自定义问题'
        };

        this.container.style.display = 'flex';
        this.outputLabel.textContent = `${typeLabels[type] || type} | ${this.currentWord.word}`;
        this.outputBox.innerHTML = `<div class="ai-loading">${message}</div>`;
        this.prevBtn.disabled = true;
        this.nextBtn.disabled = true;
        this.responseIndex.textContent = '加载中';
    }

    /**
     * 快速更新流式内容（流式过程中使用，只做简单文本处理）
     */
    updateStreamingContentFast(content) {
        // 流式过程中只做HTML转义和换行处理，避免重复解析markdown
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\n/g, '<br>');

        this.outputBox.innerHTML = escaped;

        // 自动滚动到底部
        this.outputBox.scrollTop = this.outputBox.scrollHeight;
    }

    /**
     * 更新流式内容（流式结束后使用，完整markdown渲染）
     */
    updateStreamingContent(content) {
        // 渲染markdown内容
        const html = this.formatResponse(content);
        this.outputBox.innerHTML = html;

        // 自动滚动到底部
        this.outputBox.scrollTop = this.outputBox.scrollHeight;
    }

    /**
     * 显示错误
     */
    showError(message) {
        this.container.style.display = 'flex';
        this.outputBox.innerHTML = `
            <div class="ai-error">
                <div>${message}</div>
            </div>
        `;
    }

    /**
     * 显示配置提示
     */
    showConfigPrompt() {
        this.container.style.display = 'flex';
        this.outputLabel.textContent = '未配置AI服务';
        this.outputBox.innerHTML = `
            <div class="ai-error">
                <div>未配置AI服务</div>
                <div class="ai-error-actions">
                    <button class="ai-error-btn" onclick="window.location.href='../../aitools/aichat/index.html'">
                        前往配置
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * UI控制器
 * 负责界面更新和用户交互
 */
class UIController {
    constructor() {
        this.selectView = document.getElementById('select-view');
        this.practiceView = document.getElementById('practice-view');
        this.bookList = document.getElementById('book-list');
        this.loading = document.getElementById('loading');

        // 练习视图元素
        this.wordText = document.getElementById('word-text');
        this.phoneticText = document.getElementById('phonetic-text');
        this.definitionText = document.getElementById('definition-text');
        this.statsText = document.getElementById('stats-text');
        this.statsPercent = document.getElementById('stats-percent');

        // 按钮
        this.exitBtn = document.getElementById('exit-btn');
        this.knowBtn = document.getElementById('know-btn');
        this.unknownBtn = document.getElementById('unknown-btn');
        this.nextBtn = document.getElementById('next-btn');

        // AI按钮
        this.aiButtons = document.querySelectorAll('.ai-btn');
        this.customQuestionInput = document.getElementById('custom-question-input');
        this.customQuestionBtn = document.getElementById('custom-question-btn');

        // 单词导航元素
        this.wordNavPrevBtn = document.getElementById('word-nav-prev');
        this.wordNavNextBtn = document.getElementById('word-nav-next');
        this.wordPosition = document.getElementById('word-position');

        // 当前状态
        this.currentWord = null;
        this.isInHistoryMode = false; // 是否在历史浏览模式
        this.vocabularyLoader = new VocabularyLoader();
        this.wordSelector = null;
        this.practiceManager = null;
        this.wordHistoryManager = new WordHistoryManager(50);
        this.aiAssistant = null; // 将在startPractice中初始化
    }

    /**
     * 初始化界面
     */
    init() {
        this.migrateOldProgressData();
        this.renderBookList();
        this.bindEvents();
    }

    /**
     * 迁移旧的进度数据
     * 将旧ID的进度数据迁移到新ID
     */
    migrateOldProgressData() {
        const migrations = [
            { oldId: 'cet6', newId: 'cet6_edited' }
            // 未来如果有其他需要迁移的，可以在这里添加
        ];

        migrations.forEach(({ oldId, newId }) => {
            const oldKey = `english_practice_${oldId}_progress`;
            const newKey = `english_practice_${newId}_progress`;

            const oldData = localStorage.getItem(oldKey);
            const newData = localStorage.getItem(newKey);

            // 只有当旧数据存在且新数据不存在时才迁移
            if (oldData && !newData) {
                console.log(`[迁移] 将进度数据从 ${oldId} 迁移到 ${newId}`);
                localStorage.setItem(newKey, oldData);
                // 不删除旧数据，以防万一需要回滚
                console.log(`[迁移] 迁移完成，旧数据已保留`);
            }
        });
    }

    /**
     * 渲染词汇书列表
     */
    renderBookList() {
        this.bookList.innerHTML = '';

        VOCABULARY_BOOKS.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.bookId = book.id;

            // 获取历史进度
            const progress = this.getBookProgress(book.id);

            card.innerHTML = `
                <div class="book-name">${book.name}</div>
                <div class="book-count">${book.description}</div>
                ${progress ? `
                    <div class="book-progress">
                        已练习: ${progress.known}/${progress.seen} (${Math.round(progress.known/progress.seen*100)}%)
                    </div>
                ` : `
                    <div class="book-start-hint">点击开始练习</div>
                `}
            `;

            card.addEventListener('click', () => this.startPractice(book));
            this.bookList.appendChild(card);
        });
    }

    /**
     * 获取词汇书进度
     * @param {string} bookId - 词汇书ID
     * @returns {Object|null} 进度对象
     */
    getBookProgress(bookId) {
        const key = `english_practice_${bookId}_progress`;
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                return null;
            }
        }
        return null;
    }

    /**
     * 开始练习
     * @param {Object} book - 词汇书对象
     */
    async startPractice(book) {
        this.showLoading();

        try {
            // 加载词汇
            const words = await this.vocabularyLoader.loadBook(book.file);

            if (words.length === 0) {
                alert('词汇书为空或格式错误');
                this.hideLoading();
                return;
            }

            // 初始化选择器和管理器
            this.wordSelector = new WordSelector(words);
            this.practiceManager = new PracticeManager(book.id);

            // 初始化AI助手（传入bookId）
            this.aiAssistant = new AIAssistant(book.id);

            // 切换到练习视图
            this.switchToPracticeView();
            this.hideLoading();

            // 显示第一个单词
            this.showNextWord();

        } catch (error) {
            console.error('启动练习失败:', error);
            alert('加载词汇书失败，请检查文件是否存在');
            this.hideLoading();
        }
    }

    /**
     * 显示加载状态
     */
    showLoading() {
        this.loading.style.display = 'block';
        this.bookList.style.display = 'none';
    }

    /**
     * 隐藏加载状态
     */
    hideLoading() {
        this.loading.style.display = 'none';
        this.bookList.style.display = 'grid';
    }

    /**
     * 切换到练习视图
     */
    switchToPracticeView() {
        this.selectView.classList.remove('active');
        this.practiceView.classList.add('active');
        this.updateStats();
    }

    /**
     * 切换到选择视图
     */
    switchToSelectView() {
        this.practiceView.classList.remove('active');
        this.selectView.classList.add('active');
        this.renderBookList(); // 刷新列表以显示最新进度
    }

    /**
     * 显示下一个单词
     */
    showNextWord() {
        // 保存当前单词到历史（如果存在且不在历史浏览模式）
        if (this.currentWord && !this.isInHistoryMode) {
            this.wordHistoryManager.addWord(
                this.currentWord,
                this.aiAssistant.responseHistory
            );
        }

        // 退出历史浏览模式
        this.isInHistoryMode = false;

        // 获取新单词
        this.currentWord = this.wordSelector.getNext();

        // 更新AI助手的当前单词
        this.aiAssistant.setCurrentWord(this.currentWord);
        // 清空AI助手的历史（新单词，新的AI对话）
        this.aiAssistant.responseHistory = [];
        this.aiAssistant.currentIndex = -1;

        // 更新显示
        this.wordText.textContent = this.currentWord.word;
        this.phoneticText.textContent = `[${this.currentWord.phonetic}]`;
        this.definitionText.textContent = this.currentWord.definition;

        // 隐藏释义
        this.definitionText.style.display = 'none';

        // 显示认识/不认识按钮，隐藏下一个按钮
        this.knowBtn.style.display = 'block';
        this.unknownBtn.style.display = 'block';
        this.nextBtn.style.display = 'none';

        // 更新导航按钮状态
        this.updateWordNavigationState();
    }

    /**
     * 处理"认识"按钮点击
     */
    handleKnown() {
        this.practiceManager.markKnown();
        this.updateStats();
        this.showNextWord();
    }

    /**
     * 处理"不认识"按钮点击
     */
    handleUnknown() {
        this.practiceManager.markUnknown();
        this.updateStats();

        // 显示释义
        this.definitionText.style.display = 'block';

        // 隐藏认识/不认识按钮，显示下一个按钮
        this.knowBtn.style.display = 'none';
        this.unknownBtn.style.display = 'none';
        this.nextBtn.style.display = 'block';
    }

    /**
     * 处理"下一个"按钮点击
     */
    handleNext() {
        this.showNextWord();
    }

    /**
     * 更新统计显示
     */
    updateStats() {
        const stats = this.practiceManager.getStats();
        this.statsText.textContent = `${stats.known}/${stats.seen}`;
        this.statsPercent.textContent = `(${stats.percent}%)`;
    }

    /**
     * 处理退出按钮点击
     */
    handleExit() {
        const confirmExit = confirm('确定要退出练习吗？进度已自动保存。');
        if (confirmExit) {
            this.switchToSelectView();
        }
    }

    /**
     * 导航到上一个或下一个单词
     * @param {number} direction - 方向 (-1: 上一个, 1: 下一个)
     */
    navigateWord(direction) {
        // 如果是从当前学习单词第一次回退，需要先保存当前单词
        if (!this.isInHistoryMode && direction === -1 && this.currentWord) {
            this.wordHistoryManager.addWord(
                this.currentWord,
                this.aiAssistant.responseHistory
            );
        }

        // 执行导航
        const result = this.wordHistoryManager.navigate(direction);

        if (!result.success) {
            console.log('已到达历史边界');
            return;
        }

        // 进入历史浏览模式
        this.isInHistoryMode = true;

        // 更新当前单词
        this.currentWord = result.wordData;

        // 恢复AI助手的状态
        this.aiAssistant.setCurrentWord(this.currentWord);
        this.aiAssistant.loadHistory(result.aiResponses);

        // 更新单词卡片显示
        this.wordText.textContent = this.currentWord.word;
        this.phoneticText.textContent = `[${this.currentWord.phonetic}]`;
        this.definitionText.textContent = this.currentWord.definition;
        this.definitionText.style.display = 'block'; // 历史单词直接显示释义

        // 在历史浏览模式中，修改按钮显示
        this.knowBtn.style.display = 'none';
        this.unknownBtn.style.display = 'none';
        this.nextBtn.style.display = 'block';
        this.nextBtn.textContent = '继续学习新单词';

        // 更新导航按钮状态
        this.updateWordNavigationState();

        // 如果有AI回复，显示最后一条
        if (result.aiResponses.length > 0) {
            this.aiAssistant.displayCurrent();
        }
    }

    /**
     * 更新单词导航按钮状态
     */
    updateWordNavigationState() {
        const info = this.wordHistoryManager.getInfo();

        // 更新位置显示
        if (info.total === 0) {
            this.wordPosition.textContent = '--';
        } else {
            this.wordPosition.textContent = `${info.position}/${info.total}`;
        }

        // 更新按钮禁用状态
        this.wordNavPrevBtn.disabled = info.total === 0 || info.isAtStart;
        this.wordNavNextBtn.disabled = info.total === 0 || info.isAtEnd;
    }

    /**
     * 处理单词导航按钮点击
     */
    handleWordNavigation(direction) {
        this.navigateWord(direction);
    }

    /**
     * 处理AI按钮点击
     */
    handleAIQuery(type) {
        // 禁用所有AI按钮
        this.setAIButtonsDisabled(true);

        this.aiAssistant.query(type).finally(() => {
            // 重新启用AI按钮
            this.setAIButtonsDisabled(false);
        });
    }

    /**
     * 处理自定义问题
     */
    handleCustomQuestion() {
        const question = this.customQuestionInput.value.trim();
        if (!question) {
            alert('请输入问题');
            return;
        }

        // 禁用输入和按钮
        this.customQuestionInput.disabled = true;
        this.customQuestionBtn.disabled = true;
        this.setAIButtonsDisabled(true);

        this.aiAssistant.query('custom', question).finally(() => {
            // 清空输入框
            this.customQuestionInput.value = '';
            // 重新启用
            this.customQuestionInput.disabled = false;
            this.customQuestionBtn.disabled = false;
            this.setAIButtonsDisabled(false);
        });
    }

    /**
     * 设置AI按钮禁用状态
     */
    setAIButtonsDisabled(disabled) {
        this.aiButtons.forEach(btn => btn.disabled = disabled);
        this.customQuestionBtn.disabled = disabled;
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        this.exitBtn.addEventListener('click', () => this.handleExit());
        this.knowBtn.addEventListener('click', () => this.handleKnown());
        this.unknownBtn.addEventListener('click', () => this.handleUnknown());
        this.nextBtn.addEventListener('click', () => this.handleNext());

        // 绑定AI按钮事件
        this.aiButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.handleAIQuery(type);
            });
        });

        // 绑定自定义问题事件
        this.customQuestionBtn.addEventListener('click', () => this.handleCustomQuestion());
        this.customQuestionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleCustomQuestion();
            }
        });

        // 绑定AI导航事件
        document.getElementById('ai-nav-prev').addEventListener('click', () => {
            this.aiAssistant.navigate('prev');
        });
        document.getElementById('ai-nav-next').addEventListener('click', () => {
            this.aiAssistant.navigate('next');
        });

        // 绑定单词导航事件
        this.wordNavPrevBtn.addEventListener('click', () => {
            this.handleWordNavigation(-1);
        });
        this.wordNavNextBtn.addEventListener('click', () => {
            this.handleWordNavigation(1);
        });

        // 绑定AI配置按钮事件
        const configBtn = document.getElementById('ai-config-btn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                window.location.href = '../../aitools/aichat/index.html';
            });
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIController();
    ui.init();
});
