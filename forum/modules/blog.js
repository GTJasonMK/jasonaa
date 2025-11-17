/**
 * 博客模块 - 支持分类和密码保护
 * 处理本地博客文章的加载和展示
 */

// 博客密码（实际使用时请修改）
const DIARY_PASSWORD = 'your-secret-password-123';

// 博客状态
const blogState = {
    posts: [],
    categories: {},
    currentPost: null,
    currentCategory: 'all', // 当前筛选的分类
    authenticated: false    // 是否已通过密码验证
};

/**
 * 初始化Markdown渲染器
 */
async function initMarkdown() {
    if (typeof marked === 'undefined') {
        await loadScript('https://cdn.jsdelivr.net/npm/marked@11.0.0/marked.min.js');
    }

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
 * 检查密码验证状态
 */
function isAuthenticated() {
    // 从sessionStorage检查（关闭浏览器后失效）
    return sessionStorage.getItem('blog_authenticated') === 'true';
}

/**
 * 验证密码
 */
function verifyPassword(password) {
    if (password === DIARY_PASSWORD) {
        sessionStorage.setItem('blog_authenticated', 'true');
        return true;
    }
    return false;
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
        console.log('Blog: 开始加载 ../blog/posts.json');
        const response = await fetch('../blog/posts.json');

        if (!response.ok) {
            throw new Error(`加载失败: ${response.status}`);
        }

        const data = await response.json();
        console.log('Blog: 成功加载文章数据', data);

        blogState.posts = data.posts || [];
        blogState.categories = data.categories || {};

        if (blogState.posts.length === 0) {
            renderNoPosts();
        } else {
            renderCategoryFilter();
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
 * 渲染分类筛选器
 */
function renderCategoryFilter() {
    const issuesList = document.getElementById('issues-list');
    const filterHTML = `
        <div class="blog-category-filter">
            <button class="category-btn ${blogState.currentCategory === 'all' ? 'active' : ''}"
                    data-category="all">
                📖 全部 (${blogState.posts.length})
            </button>
            ${Object.entries(blogState.categories).map(([key, config]) => {
                const count = blogState.posts.filter(p => p.category === key).length;
                return `
                    <button class="category-btn ${blogState.currentCategory === key ? 'active' : ''}"
                            data-category="${key}">
                        ${config.icon} ${config.name} (${count})
                    </button>
                `;
            }).join('')}
        </div>
        <div id="blog-posts-container"></div>
    `;

    issuesList.innerHTML = filterHTML;

    // 绑定筛选事件
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            blogState.currentCategory = category;
            renderBlogList();
        });
    });
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

        // 检查是否需要密码
        if (post.protected && !isAuthenticated()) {
            showPasswordPrompt(postId);
            return;
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
 * 显示密码输入提示
 */
function showPasswordPrompt(postId) {
    const issuesList = document.getElementById('issues-list');
    const post = blogState.posts.find(p => p.id === postId);

    issuesList.innerHTML = `
        <div class="password-prompt">
            <div class="password-card">
                <div class="password-icon">🔒</div>
                <h2>受保护的内容</h2>
                <p>这篇日志需要密码才能查看</p>
                <p class="post-title">${escapeHtml(post.title)}</p>
                <form id="password-form" class="password-form">
                    <input type="password"
                           id="password-input"
                           placeholder="请输入密码"
                           class="password-input"
                           autofocus>
                    <div class="password-actions">
                        <button type="submit" class="primary-button">解锁</button>
                        <button type="button"
                                class="secondary-button"
                                onclick="window.blogModule.backToList()">返回</button>
                    </div>
                    <div id="password-error" class="password-error"></div>
                </form>
            </div>
        </div>
    `;

    // 绑定表单提交
    document.getElementById('password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('password-input').value;
        const errorEl = document.getElementById('password-error');

        if (verifyPassword(password)) {
            loadBlogPost(postId);
        } else {
            errorEl.textContent = '密码错误，请重试';
            document.getElementById('password-input').value = '';
            document.getElementById('password-input').focus();
        }
    });
}

/**
 * 渲染博客文章详情
 */
async function renderBlogPost() {
    const issuesList = document.getElementById('issues-list');
    if (!issuesList || !blogState.currentPost) return;

    await initMarkdown();

    const post = blogState.currentPost;
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
                <div class="category-badge">
                    ${post.categoryIcon} ${post.categoryName}
                    ${post.protected ? ' 🔒' : ''}
                </div>
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 返回文章列表
 */
function backToList() {
    blogState.currentPost = null;
    renderCategoryFilter();
    renderBlogList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 渲染无文章提示
 */
function renderNoPosts() {
    const container = document.getElementById('blog-posts-container') ||
                     document.getElementById('issues-list');

    container.innerHTML = `
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
    const container = document.getElementById('blog-posts-container') ||
                     document.getElementById('issues-list');

    // 筛选文章
    let filteredPosts = blogState.posts;
    if (blogState.currentCategory !== 'all') {
        filteredPosts = blogState.posts.filter(p => p.category === blogState.currentCategory);
    }

    if (filteredPosts.length === 0) {
        container.innerHTML = `
            <div class="blog-empty">
                <p>该分类下暂无文章</p>
            </div>
        `;
        return;
    }

    // 更新筛选按钮状态
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === blogState.currentCategory);
    });

    const blogCards = filteredPosts.map(post => createBlogCard(post)).join('');

    container.innerHTML = `
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

    const categoryLabel = `${post.categoryIcon} ${post.categoryName}`;
    const protectedIcon = post.protected ? ' 🔒' : '';

    return `
        <article class="blog-card ${post.protected ? 'protected' : ''}" data-post-id="${post.id}">
            <div class="blog-card-header">
                <div class="blog-card-category">${categoryLabel}${protectedIcon}</div>
                <h3 class="blog-title">${escapeHtml(post.title)}</h3>
            </div>
            <div class="blog-excerpt">
                ${escapeHtml(post.excerpt)}
            </div>
            <div class="blog-meta">
                <span class="blog-date">📅 ${formattedDate}</span>
                <span class="blog-reading-time">⏱️ ${post.readingTime} 分钟</span>
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

window.blogModule = blogModule;

export default blogModule;
