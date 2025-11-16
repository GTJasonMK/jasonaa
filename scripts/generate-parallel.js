#!/usr/bin/env node

/**
 * 并发生成脚本
 * 同时运行多个generate-pregenerated.js进程，加速预生成数据集的生成
 *
 * 使用方法：
 * node generate-parallel.js --book-id cet4 --language english --concurrency 8
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// 命令行参数解析
const args = process.argv.slice(2);
const options = {
    bookId: null,
    language: 'english',
    concurrency: 8,
    rpm: 60,
    testMode: null,
    force: false
};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--book-id' && nextArg) {
        options.bookId = nextArg;
        i++;
    } else if (arg === '--language' && nextArg) {
        options.language = nextArg;
        i++;
    } else if (arg === '--concurrency' && nextArg) {
        options.concurrency = parseInt(nextArg);
        i++;
    } else if (arg === '--rpm' && nextArg) {
        options.rpm = parseInt(nextArg);
        i++;
    } else if (arg === '--test-mode' && nextArg) {
        options.testMode = parseInt(nextArg);
        i++;
    } else if (arg === '--force') {
        options.force = true;
    } else if (arg === '--help' || arg === '-h') {
        printHelp();
        process.exit(0);
    }
}

// 验证参数
if (!options.bookId) {
    console.error('错误: 缺少必需参数 --book-id');
    process.exit(1);
}

// 全局状态
let processes = [];
let completedCount = 0;
let failedCount = 0;
let startTime = Date.now();

function printHelp() {
    console.log(`
并发生成预生成数据集

使用方法:
  node generate-parallel.js [选项]

必需参数:
  --book-id <id>           词汇书ID (如: cet4, cet6)

可选参数:
  --language <lang>        语言 (english/japanese, 默认: english)
  --concurrency <number>   并发进程数 (默认: 8)
  --rpm <number>           总RPM限制 (默认: 60)
  --test-mode <number>     测试模式，只处理前N个分片
  --force                  强制从头开始，删除现有进度
  --help, -h               显示此帮助信息

示例:
  # 基础用法（8个并发）
  node generate-parallel.js --book-id cet4

  # 10个并发
  node generate-parallel.js --book-id cet4 --concurrency 10

  # 测试模式（只处理前2个分片）
  node generate-parallel.js --book-id cet4 --test-mode 2
    `);
}

/**
 * 读取索引文件
 */
async function loadIndex() {
    // 优先尝试从子目录加载（新结构）
    let indexPath = path.resolve(__dirname, `../languagelearning/${options.language}/data/${options.bookId}/${options.bookId}_index.json`);

    try {
        const content = await fs.readFile(indexPath, 'utf-8');
        const index = JSON.parse(content);
        console.log(`[索引] 加载索引文件: ${index.totalParts} 个分片`);
        return index;
    } catch (error) {
        // 尝试旧路径（向后兼容）
        indexPath = path.resolve(__dirname, `../languagelearning/${options.language}/data/${options.bookId}_index.json`);

        try {
            const content = await fs.readFile(indexPath, 'utf-8');
            const index = JSON.parse(content);
            console.log(`[索引] 加载索引文件（旧格式）: ${index.totalParts} 个分片`);
            return index;
        } catch (fallbackError) {
            console.error(`[错误] 无法读取索引文件: ${indexPath}`);
            console.error(`请先运行分片工具: node split-wordlist.js --input <wordlist.txt>`);
            throw fallbackError;
        }
    }
}

/**
 * 启动单个生成进程
 */
function startGenerationProcess(part, rpmPerProcess) {
    return new Promise((resolve, reject) => {
        const wordlistPath = path.resolve(__dirname, `../languagelearning/${options.language}/${part.wordlistFile}`);
        const outputPath = path.resolve(__dirname, `../languagelearning/${options.language}/${part.outputFile}`);

        const args = [
            'generate-pregenerated.js',
            '--input', wordlistPath,
            '--output', outputPath,
            '--bookId', options.bookId,
            '--language', options.language,
            '--rpm', String(rpmPerProcess)
        ];

        if (options.force) {
            args.push('--force');
        }

        console.log(`[Part ${part.partId}] 启动进程: ${part.wordCount} 个单词, RPM=${rpmPerProcess}`);

        const child = spawn('node', args, {
            cwd: __dirname,
            stdio: ['inherit', 'pipe', 'pipe']
        });

        // 输出缓冲区（用于捕获完整行）
        let stdoutBuffer = '';
        let stderrBuffer = '';

        // 处理标准输出
        child.stdout.on('data', (data) => {
            stdoutBuffer += data.toString();
            const lines = stdoutBuffer.split('\n');
            stdoutBuffer = lines.pop() || '';

            lines.forEach(line => {
                if (line.trim()) {
                    console.log(`[Part ${part.partId}] ${line}`);
                }
            });
        });

        // 处理错误输出
        child.stderr.on('data', (data) => {
            stderrBuffer += data.toString();
            const lines = stderrBuffer.split('\n');
            stderrBuffer = lines.pop() || '';

            lines.forEach(line => {
                if (line.trim() && !line.includes('.bashrc')) {
                    console.error(`[Part ${part.partId}] ${line}`);
                }
            });
        });

        // 处理进程退出
        child.on('exit', (code) => {
            if (code === 0) {
                completedCount++;
                console.log(`[Part ${part.partId}] ✓ 完成 (${completedCount}/${processes.length})`);
                resolve({ partId: part.partId, success: true });
            } else {
                failedCount++;
                console.error(`[Part ${part.partId}] ✗ 失败 (退出代码: ${code})`);
                resolve({ partId: part.partId, success: false, exitCode: code });
            }
        });

        child.on('error', (error) => {
            failedCount++;
            console.error(`[Part ${part.partId}] ✗ 错误: ${error.message}`);
            resolve({ partId: part.partId, success: false, error: error.message });
        });

        processes.push({ part, child });
    });
}

/**
 * 格式化时间
 */
function formatTime(seconds) {
    if (seconds < 60) return `${seconds.toFixed(0)}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${(seconds % 60).toFixed(0)}秒`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
}

/**
 * 主函数
 */
async function main() {
    console.log('='.repeat(60));
    console.log('并发生成预生成数据集');
    console.log('='.repeat(60));
    console.log(`词汇书ID: ${options.bookId}`);
    console.log(`语言: ${options.language}`);
    console.log(`并发数: ${options.concurrency}`);
    console.log(`总RPM限制: ${options.rpm}`);
    console.log('='.repeat(60));

    // 1. 加载索引
    console.log('\n[步骤 1/2] 加载索引文件...');
    const index = await loadIndex();

    // 测试模式
    let parts = index.parts;
    if (options.testMode) {
        parts = parts.slice(0, options.testMode);
        console.log(`[测试模式] 只处理前 ${parts.length} 个分片`);
    }

    // 计算每个进程的RPM
    const actualConcurrency = Math.min(options.concurrency, parts.length);
    const rpmPerProcess = Math.floor(options.rpm / actualConcurrency);

    console.log(`实际并发数: ${actualConcurrency}`);
    console.log(`每进程RPM: ${rpmPerProcess}`);

    // 2. 启动所有进程
    console.log('\n[步骤 2/2] 启动并发生成...');
    console.log('按 Ctrl+C 可停止所有进程\n');

    const promises = parts.map(part => startGenerationProcess(part, rpmPerProcess));

    // 等待所有进程完成
    const results = await Promise.all(promises);

    // 3. 打印统计
    const elapsed = (Date.now() - startTime) / 1000;

    console.log('\n' + '='.repeat(60));
    console.log('生成完成！');
    console.log('='.repeat(60));
    console.log(`总耗时: ${formatTime(elapsed)}`);
    console.log(`成功分片: ${completedCount}/${parts.length}`);
    console.log(`失败分片: ${failedCount}/${parts.length}`);

    if (failedCount > 0) {
        console.log('\n失败的分片:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`  Part ${r.partId}: ${r.error || `退出代码 ${r.exitCode}`}`);
        });
    }

    console.log('\n下一步: 检查生成的文件');
    console.log(`  ls -lh ../languagelearning/${options.language}/data/${options.bookId}_pregenerated_part*.json`);

    process.exit(failedCount > 0 ? 1 : 0);
}

/**
 * 优雅退出处理
 */
process.on('SIGINT', () => {
    console.log('\n\n收到中断信号，正在停止所有进程...');

    processes.forEach(({ part, child }) => {
        if (!child.killed) {
            console.log(`[Part ${part.partId}] 停止进程...`);
            child.kill('SIGINT');
        }
    });

    setTimeout(() => {
        console.log('所有进程已停止');
        process.exit(1);
    }, 2000);
});

// 运行主函数
main().catch(error => {
    console.error('\n致命错误:', error);
    process.exit(1);
});
