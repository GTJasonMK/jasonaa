/**
 * 博客模块
 * 处理本地博客文章的加载和展示
 */

// 博客状态
const blogState = {
    posts: [],
    currentPost: null,
    currentPage: 1,
    postsPerPage: 10
};

/**
 * 初始化Markdown渲染器
 */
async function initMarkdown() {
    // 检查marked是否已加载
    if (typeof marked === 'undefined') {
        // 动态加载marked.js
        await loadScript('https://cdn.jsdelivr.net/npm/marked@11.0.0/marked.min.js');
    }

    // 配置marked选项
    if (typeof marked !== 'undefined' && marked.setOptions) {
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        });
    }
}

/**
 * 动态加载脚本
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * 加载博客文章列表
 */
async function loadBlogPosts() {
    console.log('Blog: loadBlogPosts 被调用');
    const issuesList = document.getElementById('issues-list');
    if (!issuesList) {
        console.error('Blog: issues-list 元素未找到');
        return;
    }

    issuesList.innerHTML = '<div class="loading">加载博客文章中...</div>';

    try {
        // 从本地加载posts.json
        console.log('Blog: 开始加载 ../blog/posts.json');
        const response = await fetch('../blog/posts.json');

        if (!response.ok) {
            throw new Error(`加载失败: ${response.status}`);
        }

        const data = await response.json();
        console.log('Blog: 成功加载文章数据', data);
        blogState.posts = data.posts || [];

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
 * 加载单篇博客文章
 */
async function loadBlogPost(postId) {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList) return;

    issuesList.innerHTML = '<div class="loading">加载文章中...</div>';

    try {
        // 查找文章信息
        const post = blogState.posts.find(p => p.id === postId);
        if (!post) {
            throw new Error('文章不存在');
        }

        // 加载Markdown文件
        const response = await fetch(`../${post.file}`);
        if (!response.ok) {
            throw new Error(`加载失败: ${response.status}`);
        }

        const markdown = await response.text();
        blogState.currentPost = { ...post, content: markdown };

        // 渲染文章详情
        await renderBlogPost();
    } catch (error) {
        console.error('加载文章失败:', error);
        issuesList.innerHTML = `
            <div class="error-message">
                <p>加载失败: ${error.message}</p>
                <button onclick="window.blogModule.backToList()">返回列表</button>
            </div>
        `;
    }
}

/**
 * 渲染博客文章详情
 */
async function renderBlogPost() {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList || !blogState.currentPost) return;

    // 确保marked已加载
    await initMarkdown();

    const post = blogState.currentPost;

    // 渲染Markdown
    let htmlContent = post.content;
    if (typeof marked !== 'undefined') {
        htmlContent = marked.parse(post.content);
    }

    const formattedDate = new Date(post.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const categoryTags = post.tags
        .map(tag => `<span class="blog-tag">#${tag}</span>`)
        .join('');

    issuesList.innerHTML = `
        <div class="blog-detail">
            <div class="blog-detail-header">
                <button class="back-button" onclick="window.blogModule.backToList()">
                    ← 返回列表
                </button>
                <h1 class="blog-detail-title">${escapeHtml(post.title)}</h1>
                <div class="blog-detail-meta">
                    <span class="blog-author">✍️ ${escapeHtml(post.author)}</span>
                    <span class="blog-date">📅 ${formattedDate}</span>
                    <span class="blog-reading-time">⏱️ ${post.readingTime} 分钟</span>
                </div>
                ${categoryTags ? `<div class="blog-tags">${categoryTags}</div>` : ''}
            </div>
            <div class="blog-detail-content markdown-body">
                ${htmlContent}
            </div>
        </div>
    `;

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 返回文章列表
 */
function backToList() {
    blogState.currentPost = null;
    renderBlogList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 渲染无文章提示
 */
function renderNoPosts() {
    const issuesList = document.getElementById('issues-list');

    issuesList.innerHTML = `
        <div class="blog-empty">
            <div class="empty-icon">📝</div>
            <h3>暂无博客文章</h3>
            <p>作者还未发布任何文章，敬请期待！</p>
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
    const formattedDate = new Date(post.date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const categoryLabels = post.tags
        .map(tag => `<span class="blog-category">${tag}</span>`)
        .join('');

    return `
        <article class="blog-card" data-post-id="${post.id}">
            <div class="blog-card-header">
                <h3 class="blog-title">${escapeHtml(post.title)}</h3>
                ${categoryLabels ? `<div class="blog-categories">${categoryLabels}</div>` : ''}
            </div>
            <div class="blog-excerpt">
                ${escapeHtml(post.excerpt)}
            </div>
            <div class="blog-meta">
                <span class="blog-date">📅 ${formattedDate}</span>
                <span class="blog-reading-time">⏱️ ${post.readingTime} 分钟</span>
                <span class="blog-author">✍️ ${escapeHtml(post.author)}</span>
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
            const postId = card.dataset.postId;
            loadBlogPost(postId);
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
const blogModule = {
    loadBlogPosts,
    loadBlogPost,
    backToList
};

// 暴露到全局作用域供onclick使用
window.blogModule = blogModule;

export default blogModule;
