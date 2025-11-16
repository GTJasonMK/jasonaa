/**
 * ProgressManager - 进度管理器
 * 负责中断恢复的核心功能：进度文件的读写、状态跟踪
 */

const fs = require('fs').promises;
const path = require('path');

class ProgressManager {
    /**
     * @param {string} progressFilePath - 进度文件路径
     * @param {Object} metadata - 元数据（bookId、language等）
     */
    constructor(progressFilePath, metadata = {}) {
        this.progressFilePath = progressFilePath;
        this.metadata = metadata;
        this.progress = null;
    }

    /**
     * 初始化进度文件
     */
    async init() {
        try {
            // 尝试加载现有进度文件
            const data = await fs.readFile(this.progressFilePath, 'utf-8');
            this.progress = JSON.parse(data);
            console.log(`[ProgressManager] 加载现有进度: ${this.progress.completedWords}/${this.progress.totalWords} 单词已完成`);
        } catch (error) {
            // 进度文件不存在，创建新的
            console.log('[ProgressManager] 创建新的进度文件');
            this.progress = {
                version: '1.0',
                bookId: this.metadata.bookId || 'unknown',
                language: this.metadata.language || 'english',
                startTime: new Date().toISOString(),
                lastUpdateTime: new Date().toISOString(),
                totalWords: 0,
                completedWords: 0,
                failedWords: [],
                wordStatus: {}, // { "word": { "synonyms": "completed", "phrases": "pending" } }
                statistics: {
                    successCount: 0,
                    failureCount: 0,
                    totalAPIRequests: 0,
                    totalTokensUsed: 0,
                    estimatedCost: 0
                }
            };
        }
    }

    /**
     * 设置总单词数
     */
    setTotalWords(count) {
        this.progress.totalWords = count;
    }

    /**
     * 检查单词的某个查询是否已完成
     * @param {string} word - 单词
     * @param {string} type - 查询类型（synonyms/phrases）
     * @returns {boolean}
     */
    isQueryCompleted(word, type) {
        return this.progress.wordStatus[word]?.[type] === 'completed';
    }

    /**
     * 标记单词的某个查询为已完成
     * @param {string} word - 单词
     * @param {string} type - 查询类型
     * @param {Object} stats - 统计信息（tokens、cost等）
     */
    markQueryCompleted(word, type, stats = {}) {
        if (!this.progress.wordStatus[word]) {
            this.progress.wordStatus[word] = {};
        }

        this.progress.wordStatus[word][type] = 'completed';
        this.progress.wordStatus[word][`${type}_timestamp`] = new Date().toISOString();

        // 更新统计
        this.progress.statistics.successCount++;
        this.progress.statistics.totalAPIRequests++;
        if (stats.tokens) {
            this.progress.statistics.totalTokensUsed += stats.tokens;
            // 假设每1K tokens成本$0.0001
            this.progress.statistics.estimatedCost += (stats.tokens / 1000) * 0.0001;
        }

        // 检查该单词是否全部完成
        if (this.progress.wordStatus[word].synonyms === 'completed' &&
            this.progress.wordStatus[word].phrases === 'completed') {
            this.progress.completedWords++;
        }

        this.progress.lastUpdateTime = new Date().toISOString();
    }

    /**
     * 标记单词的某个查询失败
     * @param {string} word - 单词
     * @param {string} type - 查询类型
     * @param {string} error - 错误信息
     */
    markQueryFailed(word, type, error) {
        if (!this.progress.wordStatus[word]) {
            this.progress.wordStatus[word] = {};
        }

        this.progress.wordStatus[word][type] = 'failed';
        this.progress.wordStatus[word][`${type}_error`] = error;

        // 添加到失败列表（去重）
        const failedKey = `${word}:${type}`;
        if (!this.progress.failedWords.includes(failedKey)) {
            this.progress.failedWords.push(failedKey);
        }

        this.progress.statistics.failureCount++;
        this.progress.lastUpdateTime = new Date().toISOString();
    }

    /**
     * 保存进度文件
     */
    async save() {
        try {
            // 确保目录存在
            const dir = path.dirname(this.progressFilePath);
            await fs.mkdir(dir, { recursive: true });

            // 原子写入：先写入临时文件，再重命名
            const tempPath = `${this.progressFilePath}.tmp`;
            await fs.writeFile(tempPath, JSON.stringify(this.progress, null, 2), 'utf-8');
            await fs.rename(tempPath, this.progressFilePath);
        } catch (error) {
            console.error('[ProgressManager] 保存进度文件失败:', error.message);
            throw error;
        }
    }

    /**
     * 获取需要处理的单词列表
     * @param {Array} allWords - 所有单词
     * @returns {Array} 待处理的单词列表
     */
    getWordsToProcess(allWords) {
        return allWords.filter(word => {
            const status = this.progress.wordStatus[word.word];
            if (!status) return true; // 未处理过

            // 检查是否有未完成的查询
            const synonymsIncomplete = status.synonyms !== 'completed';
            const phrasesIncomplete = status.phrases !== 'completed';

            return synonymsIncomplete || phrasesIncomplete;
        });
    }

    /**
     * 获取单词的待处理查询类型
     * @param {string} word - 单词
     * @returns {Array} 查询类型列表
     */
    getPendingQueries(word) {
        const status = this.progress.wordStatus[word];
        const pending = [];

        if (!status || status.synonyms !== 'completed') {
            pending.push('synonyms');
        }
        if (!status || status.phrases !== 'completed') {
            pending.push('phrases');
        }

        return pending;
    }

    /**
     * 获取进度统计
     */
    getStatistics() {
        const { completedWords, totalWords, statistics } = this.progress;
        const percent = totalWords > 0 ? (completedWords / totalWords * 100).toFixed(1) : 0;

        return {
            completed: completedWords,
            total: totalWords,
            percent,
            failed: this.progress.failedWords.length,
            ...statistics
        };
    }

    /**
     * 获取原始进度对象
     */
    getRawProgress() {
        return this.progress;
    }
}

module.exports = ProgressManager;
