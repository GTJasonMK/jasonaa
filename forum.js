document.addEventListener('DOMContentLoaded', () => {
    // GitHub API配置
    const GITHUB_API_URL = 'https://api.github.com';
    
    // 您的GitHub仓库信息 - 用户需要更新这部分
    const REPO_OWNER = '13108387302'; // 需要更新为您的GitHub用户名
    const REPO_NAME = 'jasonaa'; // 需要更新为您的仓库名
    
    // 管理员用户名列表
    const ADMIN_USERS = ['13108387302']; // 这里添加管理员的GitHub用户名
    
    // 页面元素
    const authContainer = document.getElementById('auth-container');
    const forumContainer = document.getElementById('forum-container');
    const issueDetail = document.getElementById('issue-detail');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const logoutButton = document.getElementById('logout-button');
    
    // 讨论列表元素
    const issuesList = document.getElementById('issues-list');
    const pagination = document.getElementById('pagination');
    const filterLabel = document.getElementById('filter-label');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    // 标签页
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // 创建问题表单
    const createIssueForm = document.getElementById('create-issue-form');
    
    // 帖子详情元素
    const detailTitle = document.getElementById('detail-title');
    const detailAuthor = document.getElementById('detail-author');
    const detailDate = document.getElementById('detail-date');
    const detailLabel = document.getElementById('detail-label');
    const detailBody = document.getElementById('detail-body');
    const commentsList = document.getElementById('comments-list');
    const commentsCount = document.getElementById('comments-count');
    const commentForm = document.getElementById('comment-form');
    const backToListButton = document.getElementById('back-to-list');
    
    // 分页配置
    let currentPage = 1;
    const perPage = 10;
    
    // 搜索和过滤状态
    let currentLabel = '';
    let currentSearchQuery = '';
    
    // 当前查看的issue
    let currentIssueNumber = null;
    
    // 频率限制控制
    let rateLimitRemaining = null;
    let rateLimitReset = null;
    const MIN_RATE_LIMIT = 20; // 最低请求限制警告阈值
    
    // 用户认证数据
    let authData = {
        username: '',
        token: ''
    };
    
    // 初始化函数
    function init() {
        // 检查本地存储中是否有令牌
        loadAuthData();
        
        // 设置事件监听器
        setupEventListeners();
        
        // 如果已经认证，加载论坛内容
        if (isAuthenticated()) {
            showForumContent();
            loadIssues();
        } else {
            showLoginForm();
        }
    }
    
    // 登录表单提交
    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const token = document.getElementById('login-token').value.trim();
        
        if (!username || !token) {
            showMessage(loginMessage, '请提供用户名和访问令牌', 'error');
            return;
        }
        
        // 验证令牌
        authenticateUser(username, token);
    }
    
    // 验证用户
    function authenticateUser(username, token) {
        // 显示加载消息
        showMessage(loginMessage, '正在验证...', '');
        
        // 使用令牌验证GitHub API
        fetch(`${GITHUB_API_URL}/user`, {
            method: 'GET',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('认证失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.login.toLowerCase() === username.toLowerCase()) {
                // 保存认证数据
                authData = {
                    username: data.login,
                    token: token,
                    avatar_url: data.avatar_url
                };
                
                // 保存到本地存储
                saveAuthData();
                
                // 显示成功消息
                showMessage(loginMessage, '登录成功！正在加载论坛...', 'success');
                
                // 显示论坛内容
                setTimeout(() => {
                    showForumContent();
                    loadIssues();
                }, 1000);
            } else {
                throw new Error('令牌与用户名不匹配');
            }
        })
        .catch(error => {
            console.error('认证错误:', error);
            showMessage(loginMessage, '认证失败: ' + error.message, 'error');
        });
    }
    
    // 加载问题列表
    function loadIssues() {
        // 显示加载状态
        issuesList.innerHTML = '<div class="loading">加载中...</div>';
        
        // 构建查询参数
        let url = `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues`;
        let params = new URLSearchParams({
            state: 'open',
            per_page: perPage,
            page: currentPage
        });
        
        // 添加标签过滤
        if (currentLabel) {
            params.append('labels', currentLabel);
        }
        
        // 添加搜索查询
        if (currentSearchQuery) {
            // GitHub API的搜索格式: q=搜索词+repo:用户名/仓库名
            url = `${GITHUB_API_URL}/search/issues`;
            params = new URLSearchParams({
                q: `${currentSearchQuery}+repo:${REPO_OWNER}/${REPO_NAME}+is:issue`,
                per_page: perPage,
                page: currentPage
            });
        }
        
        // 发送请求
        fetch(`${url}?${params.toString()}`, {
            method: 'GET',
            headers: getRequestHeaders()
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('加载论坛内容失败');
            }
            // 保存headers信息
            const linkHeader = response.headers.get('Link');
            return response.json().then(data => {
                return { data, linkHeader }; // 返回数据和头信息
            });
        })
        .then(({ data, linkHeader }) => {
            // 如果是搜索结果，数据结构不同
            const issues = currentSearchQuery ? data.items : data;
            
            // 检查是否有结果
            if (issues.length === 0) {
                issuesList.innerHTML = '<div class="no-results">没有找到讨论</div>';
                pagination.innerHTML = '';
                return;
            }
            
            // 渲染问题列表
            renderIssuesList(issues);
            
            // 检查是否为搜索查询，以获取正确的总数
            if (currentSearchQuery) {
                const totalPages = Math.ceil(data.total_count / perPage);
                renderPagination(totalPages);
            } else {
                // 对于非搜索查询，我们需要计算总页数
                // 从Link头获取信息
                if (linkHeader) { // 使用保存的linkHeader
                    const totalPages = parseLinkHeader(linkHeader);
                    renderPagination(totalPages);
                } else {
                    // 如果没有Link头，说明只有一页
                    renderPagination(1);
                }
            }
        })
        .catch(error => {
            console.error('加载问题失败:', error);
            issuesList.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
        });
    }
    
    // 渲染问题列表
    function renderIssuesList(issues) {
        issuesList.innerHTML = '';
        
        issues.forEach(issue => {
            const issueElement = document.createElement('div');
            issueElement.className = 'issue-item';
            issueElement.setAttribute('data-issue-number', issue.number);
            
            // 获取标签
            let labelHTML = '';
            if (issue.labels && issue.labels.length > 0) {
                const label = issue.labels[0].name;
                labelHTML = `<span class="issue-label" data-label="${label}">${label}</span>`;
            }
            
            // 格式化日期
            const createdDate = new Date(issue.created_at);
            const formattedDate = createdDate.toLocaleDateString('zh-CN');
            
            // 添加删除帖子的按钮（仅管理员可见）
            const deleteButtonHTML = isAdmin() ? 
                `<button class="delete-issue-btn" data-issue-number="${issue.number}">删除</button>` : '';
            
            issueElement.innerHTML = `
                <h3>${issue.title}</h3>
                <div class="issue-meta">
                    <span>作者: ${issue.user.login}</span>
                    <span>发布于: ${formattedDate}</span>
                    ${labelHTML}
                    <span>评论: ${issue.comments}</span>
                    ${deleteButtonHTML}
                </div>
            `;
            
            // 添加点击事件
            issueElement.addEventListener('click', (e) => {
                // 如果点击的是删除按钮，则执行删除操作
                if (e.target.classList.contains('delete-issue-btn')) {
                    e.stopPropagation(); // 阻止事件冒泡
                    if (confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
                        deleteIssue(issue.number);
                    }
                } else {
                    loadIssueDetails(issue.number);
                }
            });
            
            issuesList.appendChild(issueElement);
        });
    }
    
    // 解析Link头获取总页数
    function parseLinkHeader(linkHeader) {
        if (!linkHeader) return 1;
        
        const links = linkHeader.split(',');
        let lastPage = 1;
        
        for (const link of links) {
            const [url, rel] = link.split(';');
            if (rel.includes('rel="last"')) {
                const match = url.match(/page=(\d+)/);
                if (match) {
                    lastPage = parseInt(match[1]);
                }
                break;
            }
        }
        
        return lastPage;
    }
    
    // 渲染分页控制
    function renderPagination(totalPages) {
        pagination.innerHTML = '';
        
        if (totalPages <= 1) {
            return;
        }
        
        // 生成分页按钮
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        // 第一页按钮
        if (startPage > 1) {
            addPageButton(1, '首页');
            if (startPage > 2) {
                pagination.appendChild(document.createTextNode('...'));
            }
        }
        
        // 页码按钮
        for (let i = startPage; i <= endPage; i++) {
            addPageButton(i);
        }
        
        // 最后一页按钮
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagination.appendChild(document.createTextNode('...'));
            }
            addPageButton(totalPages, '末页');
        }
    }
    
    // 添加分页按钮
    function addPageButton(pageNum, text) {
        const button = document.createElement('button');
        button.className = 'page-button';
        if (pageNum === currentPage) {
            button.classList.add('active');
        }
        button.textContent = text || pageNum;
        button.addEventListener('click', () => {
            currentPage = pageNum;
            loadIssues();
        });
        pagination.appendChild(button);
    }
    
    // 加载问题详情
    function loadIssueDetails(issueNumber) {
        // 显示详情面板
        showIssueDetail();
        
        // 记录当前查看的问题
        currentIssueNumber = issueNumber;
        
        // 显示加载状态
        detailBody.innerHTML = '<div class="loading">加载中...</div>';
        commentsList.innerHTML = '';
        
        // 加载问题详情
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`, {
            headers: getRequestHeaders()
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('加载问题详情失败');
            }
            return response.json();
        })
        .then(issue => {
            // 更新详情内容
            detailTitle.textContent = issue.title;
            detailAuthor.textContent = `作者: ${issue.user.login}`;
            
            // 格式化日期
            const createdDate = new Date(issue.created_at);
            detailDate.textContent = `发布于: ${createdDate.toLocaleDateString('zh-CN')}`;
            
            // 显示标签
            if (issue.labels && issue.labels.length > 0) {
                const label = issue.labels[0].name;
                detailLabel.innerHTML = `<span class="issue-label" data-label="${label}">${label}</span>`;
            } else {
                detailLabel.innerHTML = '';
            }
            
            // 转换Markdown(需要添加Markdown库)
            detailBody.innerHTML = issue.body;
            
            // 加载评论
            loadComments(issueNumber);
        })
        .catch(error => {
            console.error('加载问题详情失败:', error);
            detailBody.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
        });
    }
    
    // 加载评论
    function loadComments(issueNumber) {
        // 显示加载状态
        commentsList.innerHTML = '<div class="loading">加载评论中...</div>';
        
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/comments`, {
            headers: getRequestHeaders()
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('加载评论失败');
            }
            return response.json();
        })
        .then(comments => {
            // 更新评论数
            commentsCount.textContent = comments.length;
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<div class="no-comments">还没有评论</div>';
                return;
            }
            
            // 渲染评论
            commentsList.innerHTML = '';
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment-item';
                
                // 格式化日期
                const createdDate = new Date(comment.created_at);
                const formattedDate = createdDate.toLocaleDateString('zh-CN');
                
                // 添加删除评论按钮（仅管理员可见）
                const deleteButtonHTML = isAdmin() ? 
                    `<button class="delete-comment-btn" data-comment-id="${comment.id}">删除</button>` : '';
                
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <div class="comment-avatar" style="background-image: url(${comment.user.avatar_url})"></div>
                        <span class="comment-author">${comment.user.login}</span>
                        <span class="comment-date">${formattedDate}</span>
                        ${deleteButtonHTML}
                    </div>
                    <div class="comment-content">${comment.body}</div>
                `;
                
                // 添加删除评论的事件监听器
                const deleteButton = commentElement.querySelector('.delete-comment-btn');
                if (deleteButton) {
                    deleteButton.addEventListener('click', (e) => {
                        e.stopPropagation(); // 阻止事件冒泡
                        if (confirm('确定要删除这条评论吗？此操作不可撤销。')) {
                            deleteComment(comment.id);
                        }
                    });
                }
                
                commentsList.appendChild(commentElement);
            });
        })
        .catch(error => {
            console.error('加载评论失败:', error);
            commentsList.innerHTML = `<div class="error">加载评论失败: ${error.message}</div>`;
        });
    }
    
    // 发表评论
    function submitComment(e) {
        e.preventDefault();
        
        const commentBody = document.getElementById('comment-body').value.trim();
        if (!commentBody) {
            showRateLimitWarning(commentForm, '评论内容不能为空');
            return;
        }
        
        // 检查频率限制
        if (rateLimitRemaining !== null && rateLimitRemaining < MIN_RATE_LIMIT) {
            showRateLimitWarning(commentForm, `API请求配额不足，请稍后再试。剩余: ${rateLimitRemaining}`);
            return;
        }
        
        // 禁用按钮
        const submitButton = commentForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '提交中...';
        
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${currentIssueNumber}/comments`, {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({ body: commentBody })
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('提交评论失败');
            }
            return response.json();
        })
        .then(() => {
            // 清空表单
            document.getElementById('comment-body').value = '';
            
            // 重新加载评论
            loadComments(currentIssueNumber);
            
            // 恢复按钮
            submitButton.disabled = false;
            submitButton.textContent = '提交评论';
        })
        .catch(error => {
            console.error('提交评论失败:', error);
            showRateLimitWarning(commentForm, `提交失败: ${error.message}`);
            
            // 恢复按钮
            submitButton.disabled = false;
            submitButton.textContent = '提交评论';
        });
    }
    
    // 创建新问题
    function createNewIssue(e) {
        e.preventDefault();
        
        const title = document.getElementById('issue-title').value.trim();
        const body = document.getElementById('issue-body').value.trim();
        const label = document.getElementById('issue-label').value.trim();
        
        if (!title || !body) {
            showRateLimitWarning(createIssueForm, '标题和内容不能为空');
            return;
        }
        
        // 检查频率限制
        if (rateLimitRemaining !== null && rateLimitRemaining < MIN_RATE_LIMIT) {
            showRateLimitWarning(createIssueForm, `API请求配额不足，请稍后再试。剩余: ${rateLimitRemaining}`);
            return;
        }
        
        // 禁用按钮
        const submitButton = createIssueForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '发表中...';
        
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                title: title,
                body: body,
                labels: label ? [label] : []
            })
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('创建讨论失败');
            }
            return response.json();
        })
        .then(issue => {
            // 清空表单
            document.getElementById('issue-title').value = '';
            document.getElementById('issue-body').value = '';
            
            // 切换到讨论列表标签页
            showTabContent('discussions');
            
            // 重新加载讨论列表
            currentPage = 1;
            loadIssues();
            
            // 恢复按钮
            submitButton.disabled = false;
            submitButton.textContent = '发表';
            
            // 提示成功
            showRateLimitWarning(issuesList, '发表成功！', 'success');
        })
        .catch(error => {
            console.error('创建讨论失败:', error);
            showRateLimitWarning(createIssueForm, `创建失败: ${error.message}`);
            
            // 恢复按钮
            submitButton.disabled = false;
            submitButton.textContent = '发表';
        });
    }
    
    // 登出
    function logout() {
        // 清除认证数据
        authData = {
            username: '',
            token: ''
        };
        
        // 从本地存储移除
        localStorage.removeItem('forumAuthData');
        
        // 显示登录表单
        showLoginForm();
    }
    
    // 显示标签页内容
    function showTabContent(tabId) {
        // 更新按钮状态
        tabButtons.forEach(button => {
            if (button.getAttribute('data-tab') === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // 更新内容状态
        tabContents.forEach(content => {
            if (content.id === `${tabId}-tab`) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });
    }
    
    // 显示论坛内容
    function showForumContent() {
        authContainer.style.display = 'none';
        forumContainer.style.display = 'block';
        issueDetail.style.display = 'none';
        
        // 显示用户信息
        userName.textContent = authData.username;
        if (authData.avatar_url) {
            userAvatar.style.backgroundImage = `url(${authData.avatar_url})`;
        }
        
        // 显示用户信息区域
        userInfo.style.display = 'flex';
        
        // 显示管理员标识（如果是管理员）
        const adminBadge = document.getElementById('admin-badge');
        if (adminBadge) {
            if (isAdmin()) {
                adminBadge.style.display = 'inline-block';
            } else {
                adminBadge.style.display = 'none';
            }
        }
    }
    
    // 显示登录表单
    function showLoginForm() {
        authContainer.style.display = 'block';
        forumContainer.style.display = 'none';
        issueDetail.style.display = 'none';
        userInfo.style.display = 'none';
        
        // 清除登录表单
        loginForm.reset();
        loginMessage.innerHTML = '';
        loginMessage.className = 'auth-message';
    }
    
    // 显示问题详情
    function showIssueDetail() {
        authContainer.style.display = 'none';
        forumContainer.style.display = 'none';
        issueDetail.style.display = 'block';
    }
    
    // 返回列表
    function backToList() {
        showForumContent();
        currentIssueNumber = null;
    }
    
    // 显示消息
    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = 'auth-message';
        if (type) {
            element.classList.add(type);
        }
    }
    
    // 显示频率限制警告
    function showRateLimitWarning(element, message, type = 'error') {
        // 移除现有警告
        const existingWarning = element.querySelector('.rate-limit-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        // 创建新警告
        const warning = document.createElement('div');
        warning.className = 'rate-limit-warning';
        if (type === 'success') {
            warning.style.backgroundColor = '#e8f5e9';
            warning.style.borderColor = '#a5d6a7';
            warning.style.color = '#2e7d32';
        }
        warning.textContent = message;
        
        // 插入到元素前面
        element.insertAdjacentElement('beforebegin', warning);
        
        // 3秒后自动移除
        setTimeout(() => {
            warning.remove();
        }, 5000);
    }
    
    // 检查频率限制
    function checkRateLimit(response) {
        // 从响应头获取API速率限制信息
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        
        if (remaining !== null) {
            rateLimitRemaining = parseInt(remaining);
        }
        
        if (reset !== null) {
            rateLimitReset = parseInt(reset);
        }
        
        // 如果请求配额低于阈值，显示警告
        if (rateLimitRemaining !== null && rateLimitRemaining < MIN_RATE_LIMIT) {
            // 计算重置时间
            const resetDate = new Date(rateLimitReset * 1000);
            const now = new Date();
            const minutes = Math.ceil((resetDate - now) / (1000 * 60));
            
            // 显示在讨论页面顶部
            showRateLimitWarning(
                issuesList,
                `GitHub API请求配额不足，可能会限制某些操作。剩余: ${rateLimitRemaining}，将在约${minutes}分钟后重置。`
            );
        }
    }
    
    // 获取请求头
    function getRequestHeaders() {
        const headers = {
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (isAuthenticated()) {
            headers['Authorization'] = `token ${authData.token}`;
        }
        
        return headers;
    }
    
    // 检查是否已认证
    function isAuthenticated() {
        return authData.token && authData.username;
    }
    
    // 保存认证数据到本地存储
    function saveAuthData() {
        localStorage.setItem('forumAuthData', JSON.stringify(authData));
    }
    
    // 从本地存储加载认证数据
    function loadAuthData() {
        const storedData = localStorage.getItem('forumAuthData');
        if (storedData) {
            try {
                authData = JSON.parse(storedData);
            } catch (e) {
                console.error('解析认证数据失败:', e);
                localStorage.removeItem('forumAuthData');
            }
        }
    }
    
    // 设置事件监听器
    function setupEventListeners() {
        // 登录表单提交
        loginForm.addEventListener('submit', handleLogin);
        
        // 登出按钮
        logoutButton.addEventListener('click', logout);
        
        // 标签页切换
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                showTabContent(tabId);
            });
        });
        
        // 创建新问题
        createIssueForm.addEventListener('submit', createNewIssue);
        
        // 评论表单提交
        commentForm.addEventListener('submit', submitComment);
        
        // 返回列表按钮
        backToListButton.addEventListener('click', backToList);
        
        // 搜索按钮
        searchButton.addEventListener('click', () => {
            currentSearchQuery = searchInput.value.trim();
            currentPage = 1;
            loadIssues();
        });
        
        // 搜索输入框回车
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentSearchQuery = searchInput.value.trim();
                currentPage = 1;
                loadIssues();
            }
        });
        
        // 过滤标签
        filterLabel.addEventListener('change', () => {
            currentLabel = filterLabel.value;
            currentPage = 1;
            currentSearchQuery = ''; // 清除搜索条件
            searchInput.value = '';
            loadIssues();
        });
    }
    
    // 检查当前用户是否为管理员
    function isAdmin() {
        return isAuthenticated() && ADMIN_USERS.includes(authData.username);
    }
    
    // 删除帖子
    function deleteIssue(issueNumber) {
        if (!isAdmin()) {
            showRateLimitWarning(issuesList, '你没有权限执行此操作', 'error');
            return;
        }
        
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`, {
            method: 'PATCH',
            headers: getRequestHeaders(),
            body: JSON.stringify({ state: 'closed' })
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('删除帖子失败');
            }
            return response.json();
        })
        .then(() => {
            showRateLimitWarning(issuesList, '帖子已成功删除', 'success');
            loadIssues(); // 重新加载列表
        })
        .catch(error => {
            console.error('删除帖子失败:', error);
            showRateLimitWarning(issuesList, `删除失败: ${error.message}`, 'error');
        });
    }
    
    // 删除评论
    function deleteComment(commentId) {
        if (!isAdmin()) {
            showRateLimitWarning(commentsList, '你没有权限执行此操作', 'error');
            return;
        }
        
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/comments/${commentId}`, {
            method: 'DELETE',
            headers: getRequestHeaders()
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('删除评论失败');
            }
            showRateLimitWarning(commentsList, '评论已成功删除', 'success');
            loadComments(currentIssueNumber); // 重新加载评论
        })
        .catch(error => {
            console.error('删除评论失败:', error);
            showRateLimitWarning(commentsList, `删除失败: ${error.message}`, 'error');
        });
    }
    
    // 初始化
    init();
}); 