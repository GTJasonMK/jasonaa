/**
 * 英语词汇练习模块
 * 提供词汇书选择、随机抽词、练习统计等功能
 */

// 词汇书配置
const VOCABULARY_BOOKS = [
    {
        id: 'cet4',
        name: '大学英语四级',
        file: 'CET4_edited.txt',
        description: '约4600词'
    },
    {
        id: 'cet6',
        name: '大学英语六级',
        file: 'CET6_edited.txt',
        description: '约2000词'
    },
    {
        id: 'toefl',
        name: '托福词汇',
        file: 'TOEFL.txt',
        description: '约3500词'
    },
    {
        id: 'gre',
        name: 'GRE词汇',
        file: 'GRE_8000_Words.txt',
        description: '约8000词'
    }
];

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
class AIAssistant {
    constructor() {
        this.responseHistory = [];
        this.currentIndex = -1;
        this.currentWord = null;
        this.cache = new Map();
        this.llmClient = null;

        // DOM元素
        this.container = document.getElementById('ai-output-container');
        this.outputBox = document.getElementById('ai-output-box');
        this.outputLabel = document.getElementById('ai-output-label');
        this.responseIndex = document.getElementById('ai-response-index');
        this.prevBtn = document.getElementById('ai-nav-prev');
        this.nextBtn = document.getElementById('ai-nav-next');

        // 提示词模板
        this.templates = {
            synonyms: (word, definition) =>
                `请解释英语单词"${word}"（${definition}）的相近同义词，并详细说明它们之间的区别和使用场景。请用简洁清晰的方式回答，使用markdown格式组织内容。`,

            phrases: (word, definition) =>
                `请列举英语单词"${word}"（${definition}）的常用短语搭配、固定用法和例句。请用简洁清晰的方式回答，使用markdown格式组织内容。每个例句请标注中文翻译。`,

            custom: (word, question) =>
                `关于英语单词"${word}"：${question}`
        };
    }

    /**
     * 设置当前单词
     */
    setCurrentWord(word) {
        this.currentWord = word;
    }

    /**
     * 查询AI
     */
    async query(type, customQuestion = '') {
        if (!this.currentWord) {
            this.showError('请先选择一个单词');
            return;
        }

        // 检查AI配置
        if (!await this.ensureAIClient()) {
            return;
        }

        // 构建提示词
        const prompt = this.buildPrompt(type, customQuestion);
        const cacheKey = this.getCacheKey(type, customQuestion);

        // 检查缓存
        if (this.cache.has(cacheKey)) {
            console.log('使用缓存的回复');
            const cached = this.cache.get(cacheKey);
            this.addToHistory(type, customQuestion, cached);
            this.displayCurrent();
            return;
        }

        // 显示加载状态
        this.showLoading(type);

        try {
            // 调用AI
            const messages = [
                {
                    role: 'system',
                    content: '你是一个专业的语言学习助手。请用简洁、清晰的方式回答问题，使用markdown格式组织内容。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ];

            // 使用streamAndCollect方法（与aichat一致）
            const result = await this.llmClient.streamAndCollect(messages, {
                timeout: 120,
                temperature: this.temperature,
                maxTokens: this.maxTokens,
                maxRetries: 2
            });

            const response = result.content;

            // 存储缓存
            this.cache.set(cacheKey, response);
            if (this.cache.size > 50) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            // 添加到历史
            this.addToHistory(type, customQuestion, response);
            this.displayCurrent();

        } catch (error) {
            console.error('AI查询失败:', error);
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

        if (!configStr) {
            this.showConfigPrompt();
            return false;
        }

        try {
            // 动态导入LLMClient
            const module = await import('../../aitools/aichat/llm-client.js');
            const config = JSON.parse(configStr);

            // 根据配置来源适配字段名
            const clientConfig = {
                apiKey: config.apiKey,
                baseUrl: configSource === 'aichat' ? config.apiUrl : config.baseUrl,
                model: config.model,
                simulateBrowser: true
            };

            this.llmClient = module.LLMClient.createFromConfig(clientConfig);
            this.temperature = config.temperature || 0.7;
            this.maxTokens = config.maxTokens || 2000;

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
     */
    addToHistory(type, question, response) {
        this.responseHistory.push({
            word: { ...this.currentWord },
            type: type,
            question: question,
            response: response,
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

        // 更新标签
        const typeLabels = {
            synonyms: '相近释义',
            phrases: '短语用法',
            custom: '自定义问题'
        };
        this.outputLabel.textContent = `${typeLabels[current.type]} | ${current.word.word}`;

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
        // 简单的换行处理
        return content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
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

        // 当前状态
        this.currentWord = null;
        this.vocabularyLoader = new VocabularyLoader();
        this.wordSelector = null;
        this.practiceManager = null;
        this.aiAssistant = new AIAssistant();
    }

    /**
     * 初始化界面
     */
    init() {
        this.renderBookList();
        this.bindEvents();
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
        this.currentWord = this.wordSelector.getNext();

        // 更新AI助手的当前单词
        this.aiAssistant.setCurrentWord(this.currentWord);

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
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UIController();
    ui.init();
});
