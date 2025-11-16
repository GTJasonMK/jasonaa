#!/usr/bin/env node

/**
 * 单词书格式修复脚本
 * 将各种格式的单词书统一转换为标准格式：word [phonetic] definition
 */

const fs = require('fs').promises;
const path = require('path');

// 命令行参数
const args = process.argv.slice(2);
if (args.length < 2 || args.includes('--help')) {
    console.log(`
使用方法:
  node fix-wordlist-format.js <input.txt> <output.txt>

示例:
  node fix-wordlist-format.js CET4.txt CET4_fixed.txt
    `);
    process.exit(args.includes('--help') ? 0 : 1);
}

const [inputFile, outputFile] = args;

// 统计信息
const stats = {
    totalLines: 0,
    fixedLines: 0,
    skippedLines: 0,
    addedPhonetics: 0,
    normalizedPhonetics: 0,
    errors: []
};

/**
 * 修复单词行格式
 */
function fixWordLine(line, lineNumber) {
    const original = line;
    line = line.trim();

    // 跳过空行
    if (!line) {
        stats.skippedLines++;
        return null;
    }

    // 跳过注释和标题
    if (line.startsWith('#') ||
        line.startsWith('//') ||
        line.match(/^[（(].+[)）]$/) || // 纯括号的注释
        line.match(/^[A-Z\s]{10,}$/) || // 全大写标题
        line.includes('共') && line.includes('词')) { // "共XX词"
        stats.skippedLines++;
        return null;
    }

    try {
        // 情况1: 已经是标准格式 word [phonetic] definition
        const standardMatch = line.match(/^(\S+)\s+\[([^\]]+)\]\s+(.+)$/);
        if (standardMatch) {
            const [, word, phonetic, definition] = standardMatch;
            return `${word} [${phonetic.trim()}] ${definition.trim()}`;
        }

        // 情况2: 音标用方括号但格式不规范
        // 如: "hundred [ˈhʌndrid], num.百"（注意逗号）
        // 如: "instruct[ inˈstrʌkt] vt.教"（方括号前无空格）
        const bracketMatch = line.match(/^(\S+)\s*\[([^\]]+)\]\s*,?\s*(.+)$/);
        if (bracketMatch) {
            const [, word, phonetic, definition] = bracketMatch;
            stats.fixedLines++;
            return `${word} [${phonetic.trim()}] ${definition.trim()}`;
        }

        // 情况3: 缺少音标，直接是 word definition
        // 如: "a art.一(个)"
        // 如: "even a.均匀的"
        const noPhoneticMatch = line.match(/^(\S+)\s+(.+)$/);
        if (noPhoneticMatch) {
            const [, word, definition] = noPhoneticMatch;

            // 生成占位音标
            let phonetic = '';

            // 特殊词缀处理
            if (word.includes('.')) {
                // 缩写词 (a.m, B.C., P.M. etc.)
                phonetic = word;
            } else if (word.match(/^[A-Z][a-z]+$/)) {
                // 专有名词 (Mercury, etc.)
                phonetic = word.toLowerCase();
            } else {
                // 普通单词：使用单词本身作为占位
                phonetic = word;
            }

            stats.fixedLines++;
            stats.addedPhonetics++;
            return `${word} [${phonetic}] ${definition.trim()}`;
        }

        // 无法识别的格式
        stats.errors.push({
            line: lineNumber,
            content: original.substring(0, 50)
        });
        return null;

    } catch (error) {
        stats.errors.push({
            line: lineNumber,
            content: original.substring(0, 50),
            error: error.message
        });
        return null;
    }
}

/**
 * 处理重复单词
 */
function deduplicateWords(lines) {
    const seen = new Map();
    const result = [];

    for (const line of lines) {
        if (!line) continue;

        const wordMatch = line.match(/^(\S+)\s+\[/);
        if (!wordMatch) {
            result.push(line);
            continue;
        }

        const word = wordMatch[1];

        if (seen.has(word)) {
            // 重复单词：合并释义
            const existingLine = seen.get(word);
            const existingDef = existingLine.match(/\]\s+(.+)$/)[1];
            const newDef = line.match(/\]\s+(.+)$/)[1];

            // 合并释义（如果不同）
            if (existingDef !== newDef) {
                const merged = existingLine.replace(/\]\s+.+$/, `] ${existingDef}; ${newDef}`);
                seen.set(word, merged);

                // 更新result中的对应行
                const index = result.findIndex(l => l && l.startsWith(word + ' '));
                if (index !== -1) {
                    result[index] = merged;
                }
            }
            console.log(`  合并重复单词: ${word}`);
        } else {
            seen.set(word, line);
            result.push(line);
        }
    }

    return result;
}

/**
 * 主函数
 */
async function main() {
    console.log('='.repeat(60));
    console.log('单词书格式修复工具');
    console.log('='.repeat(60));
    console.log(`输入文件: ${inputFile}`);
    console.log(`输出文件: ${outputFile}`);
    console.log('='.repeat(60));

    // 读取文件
    console.log('\n[1/3] 读取文件...');
    let content;
    try {
        content = await fs.readFile(inputFile, 'utf-8');
    } catch (error) {
        console.error(`错误: 无法读取文件 - ${error.message}`);
        process.exit(1);
    }

    // 逐行处理
    console.log('[2/3] 修复格式...');
    const lines = content.split('\n');
    stats.totalLines = lines.length;

    const fixedLines = [];
    for (let i = 0; i < lines.length; i++) {
        const fixed = fixWordLine(lines[i], i + 1);
        if (fixed) {
            fixedLines.push(fixed);
        }
    }

    // 去重
    console.log('[3/3] 处理重复单词...');
    const dedupedLines = deduplicateWords(fixedLines);

    // 写入文件
    console.log('\n保存文件...');
    const outputContent = dedupedLines.join('\n') + '\n';
    await fs.writeFile(outputFile, outputContent, 'utf-8');

    // 打印统计
    console.log('\n' + '='.repeat(60));
    console.log('修复完成！');
    console.log('='.repeat(60));
    console.log(`总行数: ${stats.totalLines}`);
    console.log(`修复行数: ${stats.fixedLines}`);
    console.log(`跳过行数: ${stats.skippedLines}`);
    console.log(`添加音标: ${stats.addedPhonetics}`);
    console.log(`输出单词: ${dedupedLines.length}`);

    if (stats.errors.length > 0) {
        console.log(`\n警告: ${stats.errors.length} 行无法处理:`);
        stats.errors.slice(0, 10).forEach(err => {
            console.log(`  第${err.line}行: ${err.content}...`);
        });
        if (stats.errors.length > 10) {
            console.log(`  ... 还有 ${stats.errors.length - 10} 行`);
        }
    }

    console.log('\n✓ 格式修复完成！');
    console.log(`请检查输出文件: ${outputFile}`);
}

main().catch(error => {
    console.error('致命错误:', error);
    process.exit(1);
});
