/**
 * 博客模块
 * 处理博客文章的加载和展示
 */

import { getRepoConfig } from './config.js';
import { fetchFromGitHub } from './github-api.js';
import auth from './auth.js';

// 博客状态
const blogState = {
    posts: [],
    currentPage: 1,
    postsPerPage: 10
};

/**
 * 加载博客文章列表
 */
async function loadBlogPosts() {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList) return;

    issuesList.innerHTML = '<div class="loading">加载博客文章中...</div>';

    try {
        const repoConfig = getRepoConfig();
        const authData = auth.getAuthData();

        // 获取所有Issues
        const endpoint = `/repos/${repoConfig.owner}/${repoConfig.name}/issues`;
        const params = new URLSearchParams({
            state: 'open',
            sort: 'created',
            direction: 'desc',
            per_page: '100'
        });

        const response = await fetchFromGitHub(
            `${endpoint}?${params}`,
            authData.token
        );

        if (!response.ok) {
            throw new Error(`加载失败: ${response.status}`);
        }

        const allIssues = await response.json();

        // 过滤出带blog标签的Issue
        blogState.posts = allIssues.filter(issue =>
            issue.labels.some(label => label.name === 'blog')
        );

        if (blogState.posts.length === 0) {
            renderNoPosts();
        } else {
            renderBlogList();
        }
    } catch (error) {
        console.error('加载博客文章失败:', error);
        issuesList.innerHTML = `
            <div class="error-message">
                <p>加载失败: ${error.message}</p>
                <button onclick="location.reload()">重试</button>
            </div>
        `;
    }
}

/**
 * 渲染无文章提示
 */
function renderNoPosts() {
    const issuesList = document.getElementById('issues-list');
    const authData = auth.getAuthData();
    const repoConfig = getRepoConfig();
    const isAuthor = authData && authData.username === repoConfig.owner;

    issuesList.innerHTML = `
        <div class="blog-empty">
            <div class="empty-icon">📝</div>
            <h3>暂无博客文章</h3>
            ${isAuthor ? `
                <p>作为仓库主人，您可以开始创建您的第一篇博客文章了！</p>
                <div class="empty-tips">
                    <h4>如何发布博客文章：</h4>
                    <ol>
                        <li>在GitHub仓库中创建新Issue</li>
                        <li>添加 <code>blog</code> 标签</li>
                        <li>可选：添加其他分类标签（如"技术"、"生活"等）</li>
                        <li>发布后即可在此页面显示</li>
                    </ol>
                </div>
            ` : `
                <p>作者还未发布任何文章，敬请期待！</p>
            `}
        </div>
    `;
}

/**
 * 渲染博客列表
 */
function renderBlogList() {
    const issuesList = document.getElementById('issues-list');

    const blogCards = blogState.posts.map(post => createBlogCard(post)).join('');

    issuesList.innerHTML = `
        <div class="blog-grid">
            ${blogCards}
        </div>
    `;

    // 绑定点击事件
    bindBlogCardEvents();
}

/**
 * 创建博客卡片HTML
 */
function createBlogCard(post) {
    const createdDate = new Date(post.created_at);
    const formattedDate = createdDate.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // 提取摘要（前150个字符）
    const excerpt = post.body
        ? post.body.substring(0, 150).replace(/\n/g, ' ') + '...'
        : '暂无内容';

    // 获取非blog标签（作为文章分类）
    const categoryLabels = post.labels
        .filter(label => label.name !== 'blog')
        .map(label => `<span class="blog-category" style="background: #${label.color}">${label.name}</span>`)
        .join('');

    // 计算阅读时间（假设每分钟阅读300字）
    const wordCount = post.body ? post.body.length : 0;
    const readingTime = Math.max(1, Math.ceil(wordCount / 300));

    return `
        <article class="blog-card" data-issue-number="${post.number}">
            <div class="blog-card-header">
                <h3 class="blog-title">${escapeHtml(post.title)}</h3>
                ${categoryLabels ? `<div class="blog-categories">${categoryLabels}</div>` : ''}
            </div>
            <div class="blog-excerpt">
                ${escapeHtml(excerpt)}
            </div>
            <div class="blog-meta">
                <span class="blog-date">📅 ${formattedDate}</span>
                <span class="blog-reading-time">⏱️ ${readingTime} 分钟</span>
                <span class="blog-comments">💬 ${post.comments} 评论</span>
            </div>
        </article>
    `;
}

/**
 * 绑定博客卡片点击事件
 */
function bindBlogCardEvents() {
    const blogCards = document.querySelectorAll('.blog-card');
    blogCards.forEach(card => {
        card.addEventListener('click', () => {
            const issueNumber = parseInt(card.dataset.issueNumber);
            // 触发Issue点击事件（复用现有的详情展示）
            window.dispatchEvent(new CustomEvent('issueClick', {
                detail: { issueNumber }
            }));
        });
    });
}

/**
 * HTML转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 导出模块
export default {
    loadBlogPosts
};
