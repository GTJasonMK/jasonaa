/**
 * 预生成数据加载器
 * 负责从JSON文件加载预生成的AI内容
 */
class PregeneratedDataLoader {
    /**
     * @param {string} bookId - 词汇书ID（如'cet4'）
     * @param {string} language - 语言代码（如'english'）
     */
    constructor(bookId, language = 'english') {
        this.bookId = bookId;
        this.language = language;
        this.data = null;
        this.loading = false;
        this.loadPromise = null;
    }

    /**
     * 初始化加载器（懒加载）
     */
    async init() {
        if (this.loading) {
            return this.loadPromise;
        }
        if (this.data) {
            return;
        }

        this.loading = true;
        this.loadPromise = this.loadData();

        try {
            await this.loadPromise;
        } finally {
            this.loading = false;
        }
    }

    /**
     * 从服务器加载预生成数据（支持多文件分片）
     */
    async loadData() {
        try {
            // 优先尝试从子目录加载索引文件（新结构）
            let indexUrl = `data/${this.bookId}/${this.bookId}_index.json`;
            let indexResponse = await fetch(indexUrl);

            // 如果子目录不存在，尝试旧路径（向后兼容）
            if (!indexResponse.ok) {
                indexUrl = `data/${this.bookId}_index.json`;
                indexResponse = await fetch(indexUrl);
            }

            if (indexResponse.ok) {
                // 索引文件存在，使用多文件模式
                console.log(`[PregeneratedDataLoader] 使用索引文件: ${indexUrl}`);
                await this.loadMultipleFiles(indexResponse);
            } else {
                // 索引文件不存在，回退到单文件模式（向后兼容）
                console.log('[PregeneratedDataLoader] 索引文件不存在，使用单文件模式');
                await this.loadSingleFile();
            }
        } catch (error) {
            console.error('[PregeneratedDataLoader] 加载失败:', error);
            // 降级：设置为空对象，不阻塞功能
            this.data = {};
        }
    }

    /**
     * 加载单个文件（向后兼容）
     */
    async loadSingleFile() {
        const url = `data/${this.bookId}_pregenerated.json`;
        console.log(`[PregeneratedDataLoader] 开始加载单文件: ${url}`);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        this.data = await response.json();
        const wordCount = Object.keys(this.data).length;
        console.log(`[PregeneratedDataLoader] 成功加载 ${wordCount} 个单词的预生成数据`);
    }

    /**
     * 加载多个分片文件
     */
    async loadMultipleFiles(indexResponse) {
        const index = await indexResponse.json();
        console.log(`[PregeneratedDataLoader] 发现索引文件: ${index.totalParts}个分片, 共${index.totalWords}个单词`);

        // 并发加载所有分片
        const loadPromises = index.parts.map((part, idx) =>
            this.loadPart(part, idx + 1, index.totalParts)
        );

        const parts = await Promise.all(loadPromises);

        // 合并所有分片
        this.data = Object.assign({}, ...parts);

        const wordCount = Object.keys(this.data).length;
        console.log(`[PregeneratedDataLoader] 成功加载 ${wordCount} 个单词的预生成数据（来自${index.totalParts}个分片）`);
    }

    /**
     * 加载单个分片
     */
    async loadPart(partInfo, currentPart, totalParts) {
        const url = partInfo.outputFile;
        console.log(`[PregeneratedDataLoader] 加载分片 ${currentPart}/${totalParts}: ${partInfo.outputFile}`);

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`[PregeneratedDataLoader] 分片${currentPart}加载失败: ${response.status}`);
            return {};
        }

        return await response.json();
    }

    /**
     * 获取单词的预生成数据
     * @param {string} word - 单词
     * @returns {Promise<Object|null>} 单词数据或null
     */
    async getWord(word) {
        await this.init();
        return this.data[word] || null;
    }

    /**
     * 检查是否有指定单词的数据
     * @param {string} word - 单词
     * @returns {boolean}
     */
    hasWord(word) {
        return this.data && this.data[word] !== undefined;
    }

    /**
     * 获取已加载的单词数量
     * @returns {number}
     */
    getWordCount() {
        return this.data ? Object.keys(this.data).length : 0;
    }

    /**
     * 检查是否已初始化
     * @returns {boolean}
     */
    isReady() {
        return this.data !== null;
    }
}

// 导出供其他模块使用
if (typeof window !== 'undefined') {
    window.PregeneratedDataLoader = PregeneratedDataLoader;
}
