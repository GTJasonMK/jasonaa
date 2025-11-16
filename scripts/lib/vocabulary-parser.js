/**
 * VocabularyParser - 词汇书解析器
 * 负责解析txt格式的单词书
 */

const fs = require('fs').promises;

class VocabularyParser {
    constructor() {
        this.words = [];
        this.statistics = {
            totalLines: 0,
            validWords: 0,
            skippedLines: 0,
            errorLines: 0,
            duplicates: 0
        };
    }

    /**
     * 解析单词书文件
     * @param {string} filePath - 文件路径
     * @returns {Promise<Array>} 单词数组
     */
    async parseFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return this.parseContent(content);
        } catch (error) {
            console.error(`[VocabularyParser] 读取文件失败: ${error.message}`);
            throw error;
        }
    }

    /**
     * 解析单词书内容
     * @param {string} content - 文本内容
     * @returns {Array} 单词数组
     */
    parseContent(content) {
        const lines = content.split('\n');
        this.statistics.totalLines = lines.length;

        // 正则表达式匹配：单词 [音标/假名] 释义
        const pattern = /^(\S+)\s+\[([^\]]+)\]\s+(.+)$/;
        const seenWords = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // 跳过空行
            if (!line || line.length < 3) {
                this.statistics.skippedLines++;
                continue;
            }

            // 跳过注释行
            if (line.startsWith('#') || line.startsWith('//')) {
                this.statistics.skippedLines++;
                continue;
            }

            // 跳过标题行和分隔行
            if (line.match(/^[A-Z\s]+$/) || line.match(/^[（）\d]+$/)) {
                this.statistics.skippedLines++;
                continue;
            }

            // 尝试匹配标准格式
            const match = line.match(pattern);
            if (match) {
                const [, word, phonetic, definition] = match;

                // 检查重复
                if (seenWords.has(word)) {
                    console.warn(`[VocabularyParser] 第${i + 1}行: 重复单词 "${word}"，已跳过`);
                    this.statistics.duplicates++;
                    continue;
                }

                seenWords.add(word);
                this.words.push({
                    word: word.trim(),
                    phonetic: phonetic.trim(),
                    definition: definition.trim()
                });
                this.statistics.validWords++;
            } else {
                // 格式不匹配，记录错误
                console.warn(`[VocabularyParser] 第${i + 1}行格式错误: ${line.substring(0, 50)}...`);
                this.statistics.errorLines++;
            }
        }

        console.log('[VocabularyParser] 解析完成:');
        console.log(`  总行数: ${this.statistics.totalLines}`);
        console.log(`  有效单词: ${this.statistics.validWords}`);
        console.log(`  跳过行数: ${this.statistics.skippedLines}`);
        console.log(`  格式错误: ${this.statistics.errorLines}`);
        console.log(`  重复单词: ${this.statistics.duplicates}`);

        return this.words;
    }

    /**
     * 获取统计信息
     */
    getStatistics() {
        return { ...this.statistics };
    }

    /**
     * 获取单词列表
     */
    getWords() {
        return this.words;
    }

    /**
     * 验证单词书格式（不实际解析）
     * @param {string} filePath - 文件路径
     * @returns {Promise<Object>} 验证结果
     */
    async validate(filePath) {
        try {
            await this.parseFile(filePath);
            return {
                valid: true,
                statistics: this.statistics,
                message: `成功解析 ${this.statistics.validWords} 个单词`
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                message: `验证失败: ${error.message}`
            };
        }
    }
}

module.exports = VocabularyParser;
