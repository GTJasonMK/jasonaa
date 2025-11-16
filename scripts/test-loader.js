#!/usr/bin/env node

/**
 * 测试预生成数据加载器的多文件加载功能
 */

const fs = require('fs').promises;
const path = require('path');

class PregeneratedDataLoaderTest {
    constructor(bookId, language = 'english') {
        this.bookId = bookId;
        this.language = language;
        this.data = null;
        this.basePath = path.resolve(__dirname, `../languagelearning/${language}`);
    }

    async loadData() {
        try {
            // 首先尝试加载索引文件（多文件模式）
            const indexPath = path.join(this.basePath, `data/${this.bookId}_index.json`);

            try {
                const indexContent = await fs.readFile(indexPath, 'utf-8');
                const index = JSON.parse(indexContent);
                console.log(`[测试] 发现索引文件: ${index.totalParts}个分片, 共${index.totalWords}个单词`);

                // 加载所有分片
                await this.loadMultipleFiles(index);
            } catch (error) {
                // 索引文件不存在，回退到单文件模式
                console.log('[测试] 索引文件不存在，使用单文件模式');
                await this.loadSingleFile();
            }
        } catch (error) {
            console.error('[测试] 加载失败:', error);
            this.data = {};
        }
    }

    async loadSingleFile() {
        const filePath = path.join(this.basePath, `data/${this.bookId}_pregenerated.json`);
        console.log(`[测试] 开始加载单文件: ${filePath}`);

        const content = await fs.readFile(filePath, 'utf-8');
        this.data = JSON.parse(content);

        const wordCount = Object.keys(this.data).length;
        console.log(`[测试] 成功加载 ${wordCount} 个单词的预生成数据`);
    }

    async loadMultipleFiles(index) {
        console.log(`[测试] 开始加载 ${index.totalParts} 个分片...`);

        const loadPromises = index.parts.map((part, idx) =>
            this.loadPart(part, idx + 1, index.totalParts)
        );

        const parts = await Promise.all(loadPromises);

        // 合并所有分片
        this.data = Object.assign({}, ...parts);

        const wordCount = Object.keys(this.data).length;
        console.log(`[测试] 成功加载 ${wordCount} 个单词的预生成数据（来自${index.totalParts}个分片）`);
    }

    async loadPart(partInfo, currentPart, totalParts) {
        const filePath = path.join(this.basePath, partInfo.outputFile);
        console.log(`[测试] 加载分片 ${currentPart}/${totalParts}: ${partInfo.outputFile}`);

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);

            const wordCount = Object.keys(data).length;
            console.log(`[测试] 分片 ${currentPart} 包含 ${wordCount} 个单词`);

            return data;
        } catch (error) {
            console.warn(`[测试] 分片${currentPart}加载失败: ${error.message}`);
            return {};
        }
    }

    getWord(word) {
        return this.data[word] || null;
    }

    getWordCount() {
        return this.data ? Object.keys(this.data).length : 0;
    }
}

async function main() {
    console.log('='.repeat(60));
    console.log('预生成数据加载器测试');
    console.log('='.repeat(60));

    const bookId = 'cet4_edited';
    const language = 'english';

    console.log(`测试配置:`);
    console.log(`  词汇书ID: ${bookId}`);
    console.log(`  语言: ${language}`);
    console.log('='.repeat(60));
    console.log();

    const loader = new PregeneratedDataLoaderTest(bookId, language);

    console.log('[步骤 1/3] 加载数据...');
    await loader.loadData();

    console.log();
    console.log('[步骤 2/3] 验证数据...');
    const totalWords = loader.getWordCount();
    console.log(`总单词数: ${totalWords}`);

    // 测试随机单词
    const testWords = ['a', 'abandon', 'ability', 'able', 'abnormal', 'loosen', 'lord', 'lorry', 'lose', 'loss'];
    console.log();
    console.log('[步骤 3/3] 测试随机单词...');

    for (const word of testWords) {
        const data = loader.getWord(word);
        if (data) {
            const hassynonym = data.synonyms && data.synonyms.content;
            const hasPhrases = data.phrases && data.phrases.content;
            console.log(`  ✓ ${word}: synonyms=${hassynonym ? '有' : '无'}, phrases=${hasPhrases ? '有' : '无'}`);
        } else {
            console.log(`  ✗ ${word}: 未找到数据`);
        }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('测试完成！');
    console.log('='.repeat(60));
}

main().catch(error => {
    console.error('\n致命错误:', error);
    process.exit(1);
});
