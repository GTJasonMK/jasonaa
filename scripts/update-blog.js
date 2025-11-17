#!/usr/bin/env node
/**
 * 博客文章自动扫描脚本
 * 扫描essays/diary/notes目录，自动生成posts.json
 *
 * 使用方法：
 * node scripts/update-blog.js
 * 或
 * npm run update-blog
 */

const fs = require('fs');
const path = require('path');

// 配置
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const OUTPUT_FILE = path.join(BLOG_DIR, 'posts.json');

// 分类配置
const CATEGORIES = {
    essays: {
        name: '光阴手札',
        protected: false,
        icon: '🖋️'
    },
    diary: {
        name: '私语时光',
        protected: true,  // 密码保护
        icon: '🗝️'
    },
    notes: {
        name: '拾遗录',
        protected: false,
        icon: '📖'
    }
};

/**
 * 解析Markdown Front Matter
 */
function parseFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontMatterRegex);

    if (!match) {
        return { metadata: {}, body: content };
    }

    const frontMatter = match[1];
    const body = content.slice(match[0].length);
    const metadata = {};

    // 解析YAML格式的元数据
    // 统一处理各种换行符
    const lines = frontMatter.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) {
            i++;
            continue;
        }

        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();

        // 处理tasks数组（多行YAML数组）
        if (key === 'tasks' && value === '') {
            const tasks = [];
            i++;
            while (i < lines.length) {
                const taskLine = lines[i];
                const trimmed = taskLine.trim();

                // 如果不是以 - 开头，说明tasks数组结束
                if (!trimmed.startsWith('-')) break;

                // 解析任务对象
                const task = {};

                // 检查 - 后面是否直接跟了第一个属性
                const firstPropMatch = taskLine.match(/^\s+-\s+(\w+):\s*(.+)$/);
                if (firstPropMatch) {
                    const propKey = firstPropMatch[1];
                    let propValue = firstPropMatch[2].trim();

                    // 处理布尔值
                    if (propValue === 'true') propValue = true;
                    else if (propValue === 'false') propValue = false;
                    // 移除引号
                    else if ((propValue.startsWith('"') && propValue.endsWith('"')) ||
                             (propValue.startsWith("'") && propValue.endsWith("'"))) {
                        propValue = propValue.slice(1, -1);
                    }

                    task[propKey] = propValue;
                }

                i++; // 移动到下一行

                // 读取后续的属性（缩进更深的行）
                while (i < lines.length) {
                    const propLine = lines[i];
                    const propTrimmed = propLine.trim();

                    // 如果是空行、新的任务项或缩进不够，结束当前任务
                    if (!propTrimmed || propTrimmed.startsWith('-')) break;

                    const propMatch = propLine.match(/^\s+(\w+):\s*(.+)$/);
                    if (propMatch) {
                        const propKey = propMatch[1];
                        let propValue = propMatch[2].trim();

                        // 处理布尔值
                        if (propValue === 'true') propValue = true;
                        else if (propValue === 'false') propValue = false;
                        // 移除引号
                        else if ((propValue.startsWith('"') && propValue.endsWith('"')) ||
                                 (propValue.startsWith("'") && propValue.endsWith("'"))) {
                            propValue = propValue.slice(1, -1);
                        }

                        task[propKey] = propValue;
                        i++;
                    } else {
                        break;
                    }
                }

                tasks.push(task);
            }
            metadata[key] = tasks;
            continue;
        }

        // 处理普通数组格式 [tag1, tag2]
        if (value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1)
                .split(',')
                .map(s => s.trim().replace(/['"]/g, ''))
                .filter(s => s);
        }
        // 处理引号包裹的字符串
        else if ((value.startsWith('"') && value.endsWith('"')) ||
                 (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        metadata[key] = value;
        i++;
    }

    return { metadata, body };
}

/**
 * 从文件名提取日期和标题
 * 格式：YYYY-MM-DD-标题.md 或 标题.md
 */
function parseFileName(fileName) {
    const name = fileName.replace('.md', '');
    const dateMatch = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);

    if (dateMatch) {
        return {
            date: dateMatch[1],
            title: dateMatch[2].replace(/-/g, ' ')
        };
    }

    return {
        date: null,
        title: name
    };
}

/**
 * 计算阅读时间（假设每分钟300字）
 */
function calculateReadingTime(text) {
    const charCount = text.length;
    return Math.max(1, Math.ceil(charCount / 300));
}

/**
 * 生成文章摘要
 */
function generateExcerpt(body, maxLength = 150) {
    // 移除Markdown语法
    const plainText = body
        .replace(/#+\s+/g, '')           // 移除标题标记
        .replace(/\*\*|__/g, '')          // 移除粗体
        .replace(/\*|_/g, '')             // 移除斜体
        .replace(/`{1,3}[^`]*`{1,3}/g, '') // 移除代码
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接转文字
        .replace(/\n+/g, ' ')             // 换行转空格
        .trim();

    if (plainText.length <= maxLength) {
        return plainText;
    }

    return plainText.slice(0, maxLength) + '...';
}

/**
 * 扫描指定目录的文章
 */
function scanCategory(categoryKey) {
    const categoryDir = path.join(BLOG_DIR, categoryKey);
    const categoryConfig = CATEGORIES[categoryKey];
    const posts = [];

    // 检查目录是否存在
    if (!fs.existsSync(categoryDir)) {
        console.log(`  目录不存在，跳过: ${categoryKey}/`);
        return posts;
    }

    // 获取所有.md文件
    const files = fs.readdirSync(categoryDir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse(); // 最新的在前

    console.log(`  发现 ${files.length} 篇 ${categoryConfig.name}`);

    for (const file of files) {
        const filePath = path.join(categoryDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { metadata, body } = parseFrontMatter(content);
        const fileInfo = parseFileName(file);

        // 合并信息（Front Matter优先）
        const post = {
            id: `${categoryKey}-${file.replace('.md', '')}`,
            title: metadata.title || fileInfo.title,
            date: metadata.date || fileInfo.date || new Date().toISOString().split('T')[0],
            category: categoryKey,
            categoryName: categoryConfig.name,
            categoryIcon: categoryConfig.icon,
            tags: metadata.tags || [],
            excerpt: metadata.excerpt || generateExcerpt(body),
            file: `blog/${categoryKey}/${file}`,
            author: metadata.author || '作者',
            readingTime: calculateReadingTime(body),
            protected: categoryConfig.protected
        };

        // 如果是日志分类且有tasks数组，计算任务统计
        if (categoryKey === 'diary' && metadata.tasks && Array.isArray(metadata.tasks)) {
            const tasks = metadata.tasks;
            const completedTasks = tasks.filter(t => t.completed === true).length;
            const totalTasks = tasks.length;

            post.tasks = tasks;
            post.taskStats = {
                total: totalTasks,
                completed: completedTasks,
                pending: totalTasks - completedTasks,
                progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            };
        }

        posts.push(post);
        console.log(`    + ${post.title} (${post.date})`);
    }

    return posts;
}

/**
 * 主函数
 */
function main() {
    console.log('====================================');
    console.log('  博客文章自动扫描工具');
    console.log('====================================\n');

    console.log('扫描目录...\n');

    const allPosts = [];

    // 扫描每个分类
    for (const categoryKey of Object.keys(CATEGORIES)) {
        console.log(`[${CATEGORIES[categoryKey].icon}] ${CATEGORIES[categoryKey].name} (${categoryKey}/)`);
        const posts = scanCategory(categoryKey);
        allPosts.push(...posts);
        console.log('');
    }

    // 按日期排序（最新在前）
    allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 生成输出
    const output = {
        generated: new Date().toISOString(),
        totalPosts: allPosts.length,
        categories: CATEGORIES,
        posts: allPosts
    };

    // 写入文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

    console.log('====================================');
    console.log(`  生成完成！`);
    console.log(`  总计: ${allPosts.length} 篇文章`);
    console.log(`  输出: ${OUTPUT_FILE}`);
    console.log('====================================\n');

    // 统计信息
    const stats = {};
    for (const key of Object.keys(CATEGORIES)) {
        stats[key] = allPosts.filter(p => p.category === key).length;
    }

    console.log('分类统计:');
    for (const [key, count] of Object.entries(stats)) {
        console.log(`  ${CATEGORIES[key].icon} ${CATEGORIES[key].name}: ${count} 篇`);
    }
    console.log('');

    console.log('下一步操作:');
    console.log('  git add blog/');
    console.log('  git commit -m "更新博客文章"');
    console.log('  git push');
}

main();
