#!/usr/bin/env node

/**
 * 预生成数据集生成器
 * 将单词书转换为预生成的AI内容JSON文件
 *
 * 使用方法：
 * node generate-pregenerated.js --input wordlist.txt --output output.json --bookId cet4 --language english
 */

const fs = require('fs').promises;
const path = require('path');
const ProgressManager = require('./lib/progress-manager.js');
const VocabularyParser = require('./lib/vocabulary-parser.js');
const RateLimiter = require('./lib/rate-limiter.js');
const Generator = require('./lib/generator.js');

// 命令行参数解析
const args = process.argv.slice(2);
const options = {
    input: null,
    output: null,
    bookId: null,
    language: 'english',
    config: null,
    rpm: 60,
    batchSize: 10,
    testMode: null,
    force: false,
    validate: false,
    dryRun: false
};

// 解析命令行参数
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--input' && nextArg) {
        options.input = nextArg;
        i++;
    } else if (arg === '--output' && nextArg) {
        options.output = nextArg;
        i++;
    } else if (arg === '--bookId' && nextArg) {
        options.bookId = nextArg;
        i++;
    } else if (arg === '--language' && nextArg) {
        options.language = nextArg;
        i++;
    } else if (arg === '--config' && nextArg) {
        options.config = nextArg;
        i++;
    } else if (arg === '--rpm' && nextArg) {
        options.rpm = parseInt(nextArg);
        i++;
    } else if (arg === '--batch-size' && nextArg) {
        options.batchSize = parseInt(nextArg);
        i++;
    } else if (arg === '--test-mode' && nextArg) {
        options.testMode = parseInt(nextArg);
        i++;
    } else if (arg === '--force') {
        options.force = true;
    } else if (arg === '--validate') {
        options.validate = true;
    } else if (arg === '--dry-run') {
        options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
        printHelp();
        process.exit(0);
    }
}

// 验证必需参数
if (!options.input || !options.output || !options.bookId) {
    console.error('错误: 缺少必需参数');
    console.error('使用 --help 查看帮助信息');
    process.exit(1);
}

// 全局状态
let progressManager;
let generator;
let outputData = {};
let gracefulShutdown = false;

/**
 * 打印帮助信息
 */
function printHelp() {
    console.log(`
预生成数据集生成器

使用方法:
  node generate-pregenerated.js [选项]

必需参数:
  --input <path>        单词书文件路径 (txt格式)
  --output <path>       输出JSON文件路径
  --bookId <id>         词汇书ID (如: cet4, cet6)

可选参数:
  --language <lang>     语言 (english/japanese, 默认: english)
  --config <path>       AI配置文件路径 (JSON格式)
  --rpm <number>        每分钟请求数限制 (默认: 60)
  --batch-size <number> 批次保存大小 (默认: 10)
  --test-mode <number>  测试模式，只处理前N个单词
  --force               强制从头开始，删除现有进度
  --validate            只验证单词书格式，不生成
  --dry-run             试运行，显示估算但不调用API
  --help, -h            显示此帮助信息

示例:
  # 基础用法
  node generate-pregenerated.js --input wordlist.txt --output output.json --bookId cet4

  # 测试模式（只处理前10个单词）
  node generate-pregenerated.js --input wordlist.txt --output output.json --bookId cet4 --test-mode 10

  # 使用自定义配置
  node generate-pregenerated.js --input wordlist.txt --output output.json --bookId cet4 --config my-config.json

  # 验证单词书格式
  node generate-pregenerated.js --input wordlist.txt --validate

环境变量:
  LLM_API_KEY          API密钥
  LLM_API_URL          API地址
  LLM_MODEL            模型名称
    `);
}

/**
 * 加载AI配置
 */
async function loadConfig() {
    let config = {};

    // 1. 尝试从文件加载
    if (options.config) {
        try {
            const content = await fs.readFile(options.config, 'utf-8');
            config = JSON.parse(content);
            console.log(`[Config] 从文件加载配置: ${options.config}`);
        } catch (error) {
            console.error(`[Config] 加载配置文件失败: ${error.message}`);
            process.exit(1);
        }
    }

    // 2. 从环境变量加载（优先级更高）
    if (process.env.LLM_API_KEY) {
        config.apiKey = process.env.LLM_API_KEY;
        console.log('[Config] 从环境变量加载 API Key');
    }
    if (process.env.LLM_API_URL) {
        config.apiUrl = process.env.LLM_API_URL;
        console.log('[Config] 从环境变量加载 API URL');
    }
    if (process.env.LLM_MODEL) {
        config.model = process.env.LLM_MODEL;
        console.log('[Config] 从环境变量加载模型');
    }

    // 3. 使用默认配置
    if (!config.apiKey) {
        config.apiKey = 'sk-hNzBNCvCa20ckdQ_M9FWWmMXdn100lEem8d-JaetF_qAFfn_0XjHXriUw6w';
        console.log('[Config] 使用默认 API Key（sk-JyBLag34EOuLlYb_W5gnhR_qf9z1ZBlmg2dhq4r8jYFPxvV2Iy9vaC8ql4o---）');
    }
    if (!config.apiUrl) {
        config.apiUrl = 'https://ai.hybgzs.com/v1';
        console.log('[Config] 使用默认 API URL（https://api.5202030.xyz/v1---https://ai.hybgzs.com/v1）');
    }
    if (!config.model) {
        config.model = 'deepseek-ai/DeepSeek-V3.2-Exp';
        console.log('[Config] 使用默认模型');
    }

    config.temperature = config.temperature || 0.7;
    config.maxTokens = config.maxTokens || 2000;

    return config;
}

/**
 * 加载现有的输出JSON文件
 */
async function loadExistingOutput() {
    try {
        const content = await fs.readFile(options.output, 'utf-8');
        outputData = JSON.parse(content);
        console.log(`[Output] 加载现有输出文件: ${Object.keys(outputData).length} 个单词`);
    } catch (error) {
        // 文件不存在，从空对象开始
        outputData = {};
        console.log('[Output] 创建新的输出文件');
    }
}

/**
 * 保存输出JSON文件
 */
async function saveOutput() {
    try {
        // 确保目录存在
        const dir = path.dirname(options.output);
        await fs.mkdir(dir, { recursive: true });

        // 原子写入
        const tempPath = `${options.output}.tmp`;
        await fs.writeFile(tempPath, JSON.stringify(outputData, null, 2), 'utf-8');
        await fs.rename(tempPath, options.output);
    } catch (error) {
        console.error('[Output] 保存输出文件失败:', error.message);
        throw error;
    }
}

/**
 * 添加单词数据到输出
 */
function addWordToOutput(word, data) {
    if (!outputData[word]) {
        outputData[word] = {};
    }

    // 合并数据
    Object.assign(outputData[word], data);
}

/**
 * 格式化时间（秒转为可读格式）
 */
function formatTime(seconds) {
    if (seconds < 60) return `${seconds.toFixed(0)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${(seconds % 60).toFixed(0)}秒`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
}

/**
 * 显示进度
 */
function displayProgress(current, total, startTime) {
    const percent = (current / total * 100).toFixed(1);
    const elapsed = (Date.now() - startTime) / 1000;
    const avgTime = elapsed / current;
    const remaining = (total - current) * avgTime;

    const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));

    console.log(`[进度] [${bar}] ${current}/${total} (${percent}%) | 已用: ${formatTime(elapsed)} | 剩余: ${formatTime(remaining)}`);
}

/**
 * 主函数
 */
async function main() {
    const startTime = Date.now();

    console.log('='.repeat(60));
    console.log('预生成数据集生成器');
    console.log('='.repeat(60));
    console.log(`输入: ${options.input}`);
    console.log(`输出: ${options.output}`);
    console.log(`词汇书ID: ${options.bookId}`);
    console.log(`语言: ${options.language}`);
    console.log('='.repeat(60));

    // 1. 解析单词书
    console.log('\n[步骤 1/4] 解析单词书...');
    const parser = new VocabularyParser();
    const words = await parser.parseFile(options.input);

    if (words.length === 0) {
        console.error('错误: 未解析到任何单词');
        process.exit(1);
    }

    // 验证模式：只验证格式
    if (options.validate) {
        console.log('\n验证完成！');
        process.exit(0);
    }

    // 测试模式：只处理前N个单词
    if (options.testMode) {
        words.splice(options.testMode);
        console.log(`\n[测试模式] 只处理前 ${words.length} 个单词`);
    }

    // Dry-run模式：估算成本
    if (options.dryRun) {
        console.log('\n[Dry-run模式] 估算信息:');
        const totalQueries = words.length * 2; // 每个单词2次查询
        const estimatedTokens = totalQueries * 1500; // 假设每次1500 tokens
        const estimatedCost = (estimatedTokens / 1000) * 0.0001;
        const estimatedTime = (totalQueries * 60) / options.rpm; // 基于RPM估算时间

        console.log(`  总单词数: ${words.length}`);
        console.log(`  总查询数: ${totalQueries}`);
        console.log(`  预估tokens: ${estimatedTokens.toLocaleString()}`);
        console.log(`  预估成本: $${estimatedCost.toFixed(4)}`);
        console.log(`  预估时间: ${formatTime(estimatedTime)}`);
        process.exit(0);
    }

    // 2. 初始化进度管理器
    console.log('\n[步骤 2/4] 初始化进度管理...');
    const progressFilePath = `${options.output}.progress.json`;

    // 强制模式：删除现有进度
    if (options.force) {
        try {
            await fs.unlink(progressFilePath);
            await fs.unlink(options.output);
            console.log('[强制模式] 已删除现有进度和输出文件');
        } catch (error) {
            // 文件不存在，忽略
        }
    }

    progressManager = new ProgressManager(progressFilePath, {
        bookId: options.bookId,
        language: options.language
    });
    await progressManager.init();
    progressManager.setTotalWords(words.length);

    // 加载现有输出文件
    await loadExistingOutput();

    // 3. 初始化   成器
    console.log('\n[步骤 3/4] 初始化AI生成器...');
    const config = await loadConfig();
    const rateLimiter = new RateLimiter(options.rpm);
    generator = new Generator(config, options.language, rateLimiter);
    await generator.init();

    // 4. 生成内容
    console.log('\n[步骤 4/4] 生成预生成内容...');
    console.log('按 Ctrl+C 可安全退出（进度会保存）\n');

    const wordsToProcess = progressManager.getWordsToProcess(words);
    console.log(`待处理单词: ${wordsToProcess.length}/${words.length}`);

    if (wordsToProcess.length === 0) {
        console.log('\n所有单词已完成！');
        printStatistics();
        process.exit(0);
    }

    let processedInBatch = 0;

    for (let i = 0; i < wordsToProcess.length; i++) {
        if (gracefulShutdown) {
            console.log('\n正在安全退出...');
            break;
        }

        const wordData = wordsToProcess[i];
        const pendingQueries = progressManager.getPendingQueries(wordData.word);

        console.log(`\n[${i + 1}/${wordsToProcess.length}] 处理单词: ${wordData.word}`);

        for (const type of pendingQueries) {
            if (gracefulShutdown) break;

            try {
                const result = await generator.generateQuery(wordData, type);

                // 添加到输出数据
                addWordToOutput(wordData.word, {
                    [type]: {
                        content: result.content,
                        generated: new Date().toISOString()
                    }
                });

                // 更新进度
                progressManager.markQueryCompleted(wordData.word, type, {
                    tokens: result.tokens
                });

                processedInBatch++;

                console.log(`  ✓ ${type} 完成 (${result.tokens} tokens)`);

            } catch (error) {
                console.error(`  ✗ ${type} 失败: ${error.message}`);
                progressManager.markQueryFailed(wordData.word, type, error.message);
            }
        }

        // 批次保存
        if (processedInBatch >= options.batchSize) {
            console.log('\n[批次保存] 保存进度和输出文件...');
            await progressManager.save();
            await saveOutput();
            processedInBatch = 0;
        }

        // 显示进度
        const stats = progressManager.getStatistics();
        displayProgress(stats.completed, stats.total, startTime);
    }

    // 最终保存
    console.log('\n[最终保存] 保存所有数据...');
    await progressManager.save();
    await saveOutput();

    // 打印统计
    console.log('\n' + '='.repeat(60));
    printStatistics();
    console.log('='.repeat(60));

    process.exit(0);
}

/**
 * 打印统计信息
 */
function printStatistics() {
    const stats = progressManager.getStatistics();
    console.log('\n最终统计:');
    console.log(`  完成单词: ${stats.completed}/${stats.total} (${stats.percent}%)`);
    console.log(`  成功查询: ${stats.successCount}`);
    console.log(`  失败查询: ${stats.failureCount}`);
    console.log(`  总tokens: ${stats.totalTokensUsed.toLocaleString()}`);
    console.log(`  估算成本: $${stats.estimatedCost.toFixed(4)}`);

    if (stats.failed > 0) {
        console.log(`\n警告: ${stats.failed} 个查询失败`);
        console.log('查看 .progress.json 文件中的 failedWords 字段');
    }
}

/**
 * 优雅退出处理
 */
process.on('SIGINT', async () => {
    if (gracefulShutdown) {
        console.log('\n强制退出...');
        process.exit(1);
    }

    console.log('\n\n收到中断信号，正在保存进度...');
    gracefulShutdown = true;

    try {
        if (progressManager) {
            await progressManager.save();
            console.log('进度已保存');
        }
        if (Object.keys(outputData).length > 0) {
            await saveOutput();
            console.log('输出文件已保存');
        }
        console.log('可以安全退出了。下次运行将从断点继续。');
    } catch (error) {
        console.error('保存失败:', error.message);
    }

    process.exit(0);
});

// 捕获未处理的错误
process.on('unhandledRejection', (error) => {
    console.error('\n未处理的错误:', error);
    process.exit(1);
});

// 运行主函数
main().catch((error) => {
    console.error('\n致命错误:', error);
    process.exit(1);
});
