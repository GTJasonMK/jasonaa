#!/usr/bin/env node

/**
 * 单词书分片工具
 * 将大型单词书分割成多个小文件，便于并发生成和GitHub上传
 *
 * 使用方法：
 * node split-wordlist.js --input CET4_fixed.txt --output-dir wordlists --parts 10
 */

const fs = require('fs').promises;
const path = require('path');

// 命令行参数解析
const args = process.argv.slice(2);
const options = {
    input: null,
    outputDir: null,
    parts: 10,
    wordsPerPart: null,
    bookId: null
};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--input' && nextArg) {
        options.input = nextArg;
        i++;
    } else if (arg === '--output-dir' && nextArg) {
        options.outputDir = nextArg;
        i++;
    } else if (arg === '--parts' && nextArg) {
        options.parts = parseInt(nextArg);
        i++;
    } else if (arg === '--words-per-part' && nextArg) {
        options.wordsPerPart = parseInt(nextArg);
        i++;
    } else if (arg === '--book-id' && nextArg) {
        options.bookId = nextArg;
        i++;
    } else if (arg === '--help' || arg === '-h') {
        printHelp();
        process.exit(0);
    }
}

// 验证参数
if (!options.input) {
    console.error('错误: 缺少必需参数 --input');
    process.exit(1);
}

// 从输入文件名推断bookId
if (!options.bookId) {
    const basename = path.basename(options.input, path.extname(options.input));
    options.bookId = basename.replace(/_fixed$/, '').toLowerCase();
}

// 默认输出目录为输入文件所在目录
if (!options.outputDir) {
    options.outputDir = path.dirname(options.input);
}

function printHelp() {
    console.log(`
单词书分片工具

使用方法:
  node split-wordlist.js [选项]

必需参数:
  --input <path>           输入单词书文件路径

可选参数:
  --output-dir <path>      输出目录 (默认: 输入文件所在目录)
  --parts <number>         分片数量 (默认: 10)
  --words-per-part <number> 每个分片的单词数 (优先于parts)
  --book-id <id>           词汇书ID (默认: 从文件名推断)
  --help, -h               显示此帮助信息

示例:
  # 分成10个分片
  node split-wordlist.js --input ../languagelearning/english/wordlists/CET4_fixed.txt

  # 每个分片500个单词
  node split-wordlist.js --input CET4_fixed.txt --words-per-part 500

  # 指定输出目录
  node split-wordlist.js --input CET4_fixed.txt --output-dir ./parts
    `);
}

/**
 * 读取并解析单词书
 */
async function parseWordlist(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    const words = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // 验证格式: word [phonetic] definition
        const match = trimmed.match(/^(\S+)\s+\[([^\]]+)\]\s+(.+)$/);
        if (match) {
            const [, word, phonetic, definition] = match;
            words.push({ word, phonetic, definition, original: trimmed });
        }
    }

    return words;
}

/**
 * 分割单词列表
 */
function splitWords(words, partsCount, wordsPerPart) {
    const parts = [];
    let actualWordsPerPart;

    if (wordsPerPart) {
        // 按每片单词数分割
        actualWordsPerPart = wordsPerPart;
        partsCount = Math.ceil(words.length / wordsPerPart);
    } else {
        // 按分片数量平均分割
        actualWordsPerPart = Math.ceil(words.length / partsCount);
    }

    for (let i = 0; i < partsCount; i++) {
        const start = i * actualWordsPerPart;
        const end = Math.min((i + 1) * actualWordsPerPart, words.length);

        if (start >= words.length) break;

        const partWords = words.slice(start, end);
        parts.push({
            partId: i + 1,
            words: partWords,
            wordCount: partWords.length,
            startIndex: start + 1,
            endIndex: end,
            firstWord: partWords[0].word,
            lastWord: partWords[partWords.length - 1].word
        });
    }

    return parts;
}

/**
 * 保存分片文件
 */
async function saveParts(parts, outputDir, bookId) {
    // 为当前词汇书创建专属子目录
    const bookDir = path.join(outputDir, bookId);
    await fs.mkdir(bookDir, { recursive: true });

    const savedParts = [];

    for (const part of parts) {
        const filename = `part${part.partId}.txt`;
        const filepath = path.join(bookDir, filename);

        // 组装内容
        const lines = part.words.map(w => w.original);
        const content = lines.join('\n') + '\n';

        // 保存文件
        await fs.writeFile(filepath, content, 'utf-8');

        console.log(`[Part ${part.partId}] 已保存: ${bookId}/${filename} (${part.wordCount} 个单词)`);

        savedParts.push({
            partId: part.partId,
            wordlistFile: `wordlists/${bookId}/part${part.partId}.txt`,
            outputFile: `data/${bookId}/${bookId}_pregenerated_part${part.partId}.json`,
            wordCount: part.wordCount,
            wordRange: {
                start: part.startIndex,
                end: part.endIndex,
                firstWord: part.firstWord,
                lastWord: part.lastWord
            }
        });
    }

    return savedParts;
}

/**
 * 生成索引文件
 */
async function generateIndex(bookId, language, totalWords, parts, outputDir) {
    // 索引文件保存在 data/${bookId}/ 子目录中
    const dataDir = path.join(outputDir, '..', 'data', bookId);
    await fs.mkdir(dataDir, { recursive: true });

    const indexFile = path.join(dataDir, `${bookId}_index.json`);

    const index = {
        version: '1.0',
        bookId: bookId,
        language: language,
        totalWords: totalWords,
        totalParts: parts.length,
        generated: new Date().toISOString(),
        parts: parts
    };

    await fs.writeFile(indexFile, JSON.stringify(index, null, 2), 'utf-8');

    console.log(`\n[索引文件] 已生成: ${indexFile}`);

    return indexFile;
}

/**
 * 主函数
 */
async function main() {
    console.log('='.repeat(60));
    console.log('单词书分片工具');
    console.log('='.repeat(60));
    console.log(`输入文件: ${options.input}`);
    console.log(`输出目录: ${options.outputDir}`);
    console.log(`词汇书ID: ${options.bookId}`);
    console.log('='.repeat(60));

    // 1. 读取单词书
    console.log('\n[步骤 1/3] 读取单词书...');
    const words = await parseWordlist(options.input);
    console.log(`解析到 ${words.length} 个单词`);

    // 2. 分割单词
    console.log('\n[步骤 2/3] 分割单词...');
    const parts = splitWords(words, options.parts, options.wordsPerPart);
    console.log(`分成 ${parts.length} 个分片`);

    // 3. 保存分片
    console.log('\n[步骤 3/3] 保存分片文件...');
    const savedParts = await saveParts(parts, options.outputDir, options.bookId);

    // 4. 生成索引文件
    const language = options.input.includes('japanese') ? 'japanese' : 'english';
    await generateIndex(options.bookId, language, words.length, savedParts, options.outputDir);

    // 5. 打印统计
    console.log('\n' + '='.repeat(60));
    console.log('分片完成！');
    console.log('='.repeat(60));
    console.log(`总单词数: ${words.length}`);
    console.log(`分片数量: ${parts.length}`);
    console.log(`平均每片: ${Math.ceil(words.length / parts.length)} 个单词`);

    console.log('\n分片详情:');
    for (const part of savedParts) {
        const range = part.wordRange;
        console.log(`  Part ${part.partId}: ${range.start}-${range.end} (${part.wordCount}词) ${range.firstWord} ~ ${range.lastWord}`);
    }

    console.log('\n下一步: 使用并发生成脚本');
    console.log(`  node generate-parallel.js --book-id ${options.bookId}`);
}

main().catch(error => {
    console.error('\n致命错误:', error);
    process.exit(1);
});
