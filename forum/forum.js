document.addEventListener('DOMContentLoaded', () => {
    // GitHub API配置
    const GITHUB_API_URL = 'https://api.github.com';
    
    // 您的GitHub仓库信息 - 用户需要更新这部分
    const REPO_OWNER = '13108387302'; // 需要更新为您的GitHub用户名
    const REPO_NAME = 'jasonaa'; // 需要更新为您的仓库名
    
    // 管理员用户名列表 - 默认仓库所有者为管理员
    let ADMIN_USERS = [REPO_OWNER];
    
    // 配置Issue的标签和标题
    const CONFIG_ISSUE_LABEL = "forum-config";
    const CONFIG_ISSUE_TITLE = "Forum Configuration";
    
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
    
    // 用户个人资料
    let userProfile = {
        nickname: '',
        signature: '',
        avatarUrl: ''
    };
    
    // 初始化函数
    async function init() {
        // 检查本地存储中是否有令牌
        loadAuthData();
        
        // 加载用户个人资料
        loadUserProfile();
        
        // 加载管理员列表
        if (isAuthenticated()) {
            await loadAdminUsers();
        }
        
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
    
    // 提取帖子内容中的标签
    function extractLabelFromContent(body) {
        // 查找 "**分类**: 标签名" 格式的内容
        const labelMatch = body.match(/\*\*分类\*\*\s*:\s*([^\n]+)/);
        return labelMatch ? labelMatch[1].trim() : null;
    }
    
    // 修改加载问题列表函数，支持从内容中筛选标签和实现本地搜索
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
        
        // 添加标签过滤 - 如果选择了标签，我们需要获取所有issue然后在客户端筛选
        // 因为我们需要检查内容中的标签
        const selectedLabel = currentLabel;
        if (selectedLabel) {
            // 先尝试使用API过滤
            params.append('labels', selectedLabel);
        }
        
        // 如果有搜索查询但不太复杂，使用GitHub搜索API
        let useGitHubSearch = false;
        if (currentSearchQuery && !currentSearchQuery.includes(':')) {
            useGitHubSearch = true;
            // GitHub API的搜索格式
            url = `${GITHUB_API_URL}/search/issues`;
            params = new URLSearchParams({
                q: `${currentSearchQuery} repo:${REPO_OWNER}/${REPO_NAME} type:issue state:open`,
                per_page: perPage,
                page: currentPage
            });
        }
        
        // 如果是较复杂的搜索或者有筛选条件，采用本地搜索更可靠
        if (currentSearchQuery && (!useGitHubSearch || currentLabel)) {
            // 获取所有issue然后在本地过滤
            params = new URLSearchParams({
                state: 'open',
                per_page: 100, // 获取较大数量以便本地搜索
                page: 1
            });
            url = `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues`;
        }
        
        console.log("搜索URL:", `${url}?${params.toString()}`);
        
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
            let issues = [];
            let totalCount = 0;
            let usingLocalSearch = false;
            
            if (useGitHubSearch && !currentLabel) {
                // 搜索API返回的结构是 {total_count, incomplete_results, items}
                console.log("GitHub搜索返回结果:", data);
                if (data && Array.isArray(data.items)) {
                    issues = data.items;
                    totalCount = data.total_count || 0;
                } else {
                    console.error('搜索结果格式异常:', data);
                    issues = [];
                    totalCount = 0;
                }
                
                // 如果GitHub搜索没有结果，降级到本地搜索
                if (issues.length === 0 && currentSearchQuery) {
                    console.log("GitHub搜索无结果，降级到本地搜索");
                    return fetchAllIssuesForSearch();
                }
            } else if (currentSearchQuery) {
                // 本地搜索模式
                console.log("使用本地搜索模式");
                usingLocalSearch = true;
                if (Array.isArray(data)) {
                    issues = performLocalSearch(data, currentSearchQuery);
                    totalCount = issues.length;
                } else {
                    console.error('本地搜索数据格式异常:', data);
                    return fetchAllIssuesForSearch();
                }
            } else {
                // 普通API返回的就是issue数组
                if (Array.isArray(data)) {
                    issues = data;
                } else {
                    console.error('返回数据格式异常:', data);
                    issues = [];
                }
            }
            
            // 确保issues是数组
            if (!Array.isArray(issues)) {
                console.error('非预期的数据格式:', issues);
                issues = [];
            }
            
            // 过滤掉配置Issue
            issues = issues.filter(issue => {
                if (!issue) return false;
                
                // 检查是否有配置标签
                if (issue.labels && issue.labels.length > 0) {
                    return !issue.labels.some(label => label && label.name === CONFIG_ISSUE_LABEL);
                }
                // 检查标题是否匹配配置Issue标题
                return issue.title !== CONFIG_ISSUE_TITLE;
            });
            
            // 如果选择了标签，我们需要额外检查内容中的标签
            if (selectedLabel && issues.length === 0 && !currentSearchQuery) {
                // 如果API筛选没有结果，尝试获取所有issue并在客户端筛选
                return fetchAllIssuesForSearch().then(result => {
                    const { allIssues, newLinkHeader } = result;
                    
                    // 在客户端筛选标签，包括内容中的标签
                    const filteredIssues = filterIssuesByLabel(allIssues, selectedLabel);
                    
                    // 返回筛选后的issues和分页信息
                    return { 
                        issues: filteredIssues, 
                        linkHeader: newLinkHeader,
                        totalCount: filteredIssues.length,
                        usingLocalSearch: true
                    };
                });
            }
            
            // 如果不需要额外筛选，直接返回结果
            return { 
                issues, 
                linkHeader,
                totalCount,
                usingLocalSearch
            };
        })
        .then(({ issues, linkHeader, totalCount, usingLocalSearch }) => {
            // 确保issues是数组
            if (!Array.isArray(issues)) {
                console.error('非预期的数据格式:', issues);
                issues = [];
            }
            
            // 检查是否有结果
            if (issues.length === 0) {
                issuesList.innerHTML = '<div class="no-results">没有找到讨论</div>';
                pagination.innerHTML = '';
                return;
            }
            
            // 如果使用本地搜索，实现客户端分页
            if (usingLocalSearch) {
                const startIndex = (currentPage - 1) * perPage;
                const endIndex = startIndex + perPage;
                const pageIssues = issues.slice(startIndex, endIndex);
                
                // 计算总页数
                const totalPages = Math.ceil(issues.length / perPage);
                
                // 渲染问题列表
                renderIssuesList(pageIssues);
                renderPagination(totalPages);
                return;
            }
            
            // 渲染问题列表
            renderIssuesList(issues);
            
            // 检查是否为搜索查询，以获取正确的总数
            if (currentSearchQuery && totalCount > 0) {
                const totalPages = Math.ceil(totalCount / perPage);
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
    
    // 获取所有issue用于本地搜索
    function fetchAllIssuesForSearch() {
        return fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=open&per_page=100`, {
            method: 'GET',
            headers: getRequestHeaders()
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('加载论坛内容失败');
            }
            const newLinkHeader = response.headers.get('Link');
            return response.json().then(allIssues => {
                // 确保allIssues是数组
                if (!Array.isArray(allIssues)) {
                    console.error('非预期的数据格式:', allIssues);
                    allIssues = [];
                }
                
                // 过滤掉配置Issue
                allIssues = allIssues.filter(issue => {
                    if (!issue) return false;
                    
                    // 检查是否有配置标签
                    if (issue.labels && issue.labels.length > 0) {
                        return !issue.labels.some(label => label && label.name === CONFIG_ISSUE_LABEL);
                    }
                    // 检查标题是否匹配配置Issue标题
                    return issue.title !== CONFIG_ISSUE_TITLE;
                });
                
                // 如果存在搜索关键词，进行本地搜索
                let filteredIssues = allIssues;
                if (currentSearchQuery) {
                    filteredIssues = performLocalSearch(allIssues, currentSearchQuery);
                }
                
                return { 
                    allIssues,
                    filteredIssues, 
                    newLinkHeader 
                };
            });
        });
    }
    
    // 执行本地搜索
    function performLocalSearch(issues, query) {
        console.log(`执行本地搜索，关键词: "${query}"`);
        query = query.toLowerCase().trim();
        
        // 如果查询为空，返回原始数据
        if (!query) return issues;
        
        return issues.filter(issue => {
            if (!issue) return false;
            
            // 搜索标题
            if (issue.title && issue.title.toLowerCase().includes(query)) {
                return true;
            }
            
            // 搜索内容
            if (issue.body && issue.body.toLowerCase().includes(query)) {
                return true;
            }
            
            // 搜索评论数量 (例如 "0条评论")
            const commentStr = `${issue.comments}条评论`;
            if (commentStr.includes(query)) {
                return true;
            }
            
            // 搜索用户名
            if (issue.user && issue.user.login && 
                issue.user.login.toLowerCase().includes(query)) {
                return true;
            }
            
            return false;
        });
    }
    
    // 根据标签过滤issue
    function filterIssuesByLabel(allIssues, label) {
        return allIssues.filter(issue => {
            if (!issue) return false;
            
            // 检查API标签
            if (issue.labels && issue.labels.length > 0) {
                if (issue.labels.some(l => l && l.name === label)) {
                    return true;
                }
            }
            
            // 检查内容中的标签
            if (issue.body) {
                const contentLabel = extractLabelFromContent(issue.body);
                return contentLabel === label;
            }
            
            return false;
        });
    }
    
    // 渲染问题列表
    function renderIssuesList(issues) {
        issuesList.innerHTML = '';
        
        issues.forEach(issue => {
            const issueElement = document.createElement('div');
            issueElement.className = 'issue-item';
            issueElement.setAttribute('data-issue-number', issue.number);
            
            // 获取标签 - 先从labels中获取，如果没有则尝试从内容中提取
            let label = null;
            let labelHTML = '';
            
            if (issue.labels && issue.labels.length > 0) {
                label = issue.labels[0].name;
            } else if (issue.body) {
                // 尝试从内容中提取标签
                label = extractLabelFromContent(issue.body);
            }
            
            if (label) {
                labelHTML = `<span class="issue-label" data-label="${label}">${label}</span>`;
            }
            
            // 格式化日期
            const createdDate = new Date(issue.created_at);
            const formattedDate = createdDate.toLocaleDateString('zh-CN');
            
            // 添加删除帖子的按钮（仅管理员可见）
            const deleteButtonHTML = isAdmin() ? 
                `<button class="delete-issue-btn" data-issue-number="${issue.number}">删除</button>` : '';
            
            // 获取用户显示名称和签名
            const displayName = getDisplayName(issue.user.login);
            const signature = getUserSignature(issue.user.login);
            const signatureHTML = signature ? `<span class="user-signature">${signature}</span>` : '';
            
            // 如果显示名称与GitHub用户名不同，添加一个小标签显示GitHub用户名
            const usernameBadgeHTML = (displayName !== issue.user.login) ? 
                `<span class="user-badge">${issue.user.login}</span>` : '';
            
            issueElement.innerHTML = `
                <h3>${issue.title}</h3>
                <div class="issue-meta">
                    <span>作者: ${displayName}${usernameBadgeHTML}</span>
                    <span>发布于: ${formattedDate}</span>
                    ${labelHTML}
                    <span>评论: ${issue.comments}</span>
                    ${deleteButtonHTML}
                </div>
                ${signatureHTML}
            `;
            
            // 添加点赞功能
            const likeContainer = document.createElement('div');
            likeContainer.className = 'like-container';
            
            // 获取点赞数据，将在loadIssueLikes函数中填充
            const likeButton = document.createElement('button');
            likeButton.className = 'like-button';
            likeButton.innerHTML = `
                <span class="like-icon">👍</span>
                <span class="like-count">...</span>
            `;
            likeButton.setAttribute('data-issue-number', issue.number);
            
            // 添加点击事件，处理点赞
            likeButton.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止冒泡，防止触发帖子详情查看
                toggleIssueLike(issue.number, likeButton);
            });
            
            likeContainer.appendChild(likeButton);
            issueElement.appendChild(likeContainer);
            
            // 加载点赞状态和数量
            loadIssueLikes(issue.number, likeButton);
            
            // 添加点击事件
            issueElement.addEventListener('click', (e) => {
                // 如果点击的是删除按钮，则执行删除操作
                if (e.target.classList.contains('delete-issue-btn')) {
                    e.stopPropagation(); // 阻止事件冒泡
                    if (confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
                        deleteIssue(issue.number);
                    }
                } else if (!e.target.closest('.like-button')) {
                    // 如果点击的不是点赞按钮，则查看帖子详情
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
            // 获取自定义用户信息
            const displayName = getDisplayName(issue.user.login);
            const usernameBadgeHTML = (displayName !== issue.user.login) ? 
                `<span class="user-badge">${issue.user.login}</span>` : '';
            
            // 更新详情内容
            detailTitle.textContent = issue.title;
            detailAuthor.innerHTML = `作者: ${displayName}${usernameBadgeHTML}`;
            
            // 格式化日期
            const createdDate = new Date(issue.created_at);
            detailDate.textContent = `发布于: ${createdDate.toLocaleDateString('zh-CN')}`;
            
            // 显示标签 - 先从labels中获取，如果没有则尝试从内容中提取
            let label = null;
            if (issue.labels && issue.labels.length > 0) {
                label = issue.labels[0].name;
            } else if (issue.body) {
                // 尝试从内容中提取标签
                label = extractLabelFromContent(issue.body);
            }
            
            if (label) {
                detailLabel.innerHTML = `<span class="issue-label" data-label="${label}">${label}</span>`;
            } else {
                detailLabel.innerHTML = '';
            }
            
            // 转换Markdown(需要添加Markdown库)
            detailBody.innerHTML = issue.body;
            
            // 添加用户签名（如果有）
            const signature = getUserSignature(issue.user.login);
            if (signature) {
                const signatureElement = document.createElement('div');
                signatureElement.className = 'user-signature';
                signatureElement.textContent = signature;
                detailBody.insertAdjacentElement('beforebegin', signatureElement);
            }
            
            // 添加点赞功能到详情页面
            const detailContainer = document.querySelector('.issue-content');
            const existingLikeContainer = detailContainer.querySelector('.like-container');
            
            if (existingLikeContainer) {
                existingLikeContainer.remove(); // 移除已有的点赞容器（如果有）
            }
            
            const likeContainer = document.createElement('div');
            likeContainer.className = 'like-container';
            
            const likeButton = document.createElement('button');
            likeButton.className = 'like-button';
            likeButton.innerHTML = `
                <span class="like-icon">👍</span>
                <span class="like-count">...</span>
            `;
            likeButton.setAttribute('data-issue-number', issue.number);
            
            likeButton.addEventListener('click', () => {
                toggleIssueLike(issue.number, likeButton);
            });
            
            likeContainer.appendChild(likeButton);
            
            // 将点赞容器插入到帖子内容之后
            detailBody.insertAdjacentElement('afterend', likeContainer);
            
            // 加载点赞状态和数量
            loadIssueLikes(issue.number, likeButton);
            
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
                commentElement.setAttribute('data-comment-id', comment.id);
                
                // 获取自定义用户信息
                const displayName = getDisplayName(comment.user.login);
                const avatarUrl = getAvatarUrl(comment.user.login, comment.user.avatar_url);
                const signature = getUserSignature(comment.user.login);
                const usernameBadgeHTML = (displayName !== comment.user.login) ? 
                    `<span class="user-badge">${comment.user.login}</span>` : '';
                const signatureHTML = signature ? 
                    `<div class="user-signature">${signature}</div>` : '';
                
                // 格式化日期
                const createdDate = new Date(comment.created_at);
                const formattedDate = createdDate.toLocaleDateString('zh-CN');
                
                // 添加删除评论按钮（仅管理员可见）
                const deleteButtonHTML = isAdmin() ? 
                    `<button class="delete-comment-btn" data-comment-id="${comment.id}">删除</button>` : '';
                
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <div class="comment-avatar" style="background-image: url(${avatarUrl})"></div>
                        <span class="comment-author">${displayName}${usernameBadgeHTML}</span>
                        <span class="comment-date">${formattedDate}</span>
                        ${deleteButtonHTML}
                    </div>
                    ${signatureHTML}
                    <div class="comment-content">${comment.body}</div>
                `;
                
                // 添加点赞功能
                const likeContainer = document.createElement('div');
                likeContainer.className = 'like-container';
                
                const likeButton = document.createElement('button');
                likeButton.className = 'like-button';
                likeButton.innerHTML = `
                    <span class="like-icon">👍</span>
                    <span class="like-count">...</span>
                `;
                likeButton.setAttribute('data-comment-id', comment.id);
                
                // 添加点击事件
                likeButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleCommentLike(comment.id, likeButton);
                });
                
                likeContainer.appendChild(likeButton);
                commentElement.appendChild(likeContainer);
                
                // 加载点赞状态和数量
                loadCommentLikes(comment.id, likeButton);
                
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
        
        // 创建基本的issue数据
        const issueData = {
            title: title,
            body: body
        };
        
        // 先创建Issue，不包含标签
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify(issueData)
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('创建讨论失败');
            }
            return response.json();
        })
        .then(issue => {
            // 如果指定了标签，再添加标签
            if (label) {
                // 在描述中添加标签信息，即使无法直接添加标签
                const labelPart = `\n\n**分类**: ${label}`;
                
                // 更新Issue，添加标签信息到内容中
                return fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issue.number}`, {
                    method: 'PATCH',
                    headers: getRequestHeaders(),
                    body: JSON.stringify({
                        body: body + labelPart
                    })
                })
                .then(response => {
                    if (!response.ok) {
                        console.warn('更新标签信息失败，但帖子已创建');
                    }
                    return response.json();
                })
                .then(updatedIssue => {
                    // 如果用户是仓库所有者或管理员，尝试添加标签
                    if (authData.username === REPO_OWNER || isAdmin()) {
                        return fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issue.number}/labels`, {
                            method: 'POST',
                            headers: getRequestHeaders(),
                            body: JSON.stringify({ labels: [label] })
                        })
                        .then(response => {
                            if (!response.ok) {
                                console.warn('添加标签失败，但帖子已创建并更新');
                            }
                            return updatedIssue; // 返回更新后的issue
                        })
                        .catch(error => {
                            console.error('添加标签失败:', error);
                            return updatedIssue; // 返回更新后的issue
                        });
                    } else {
                        // 非管理员用户返回更新后的issue
                        return updatedIssue;
                    }
                });
            } else {
                // 如果没有标签，直接返回创建的issue
                return issue;
            }
        })
        .then(issue => {
            // 清空表单
            document.getElementById('issue-title').value = '';
            document.getElementById('issue-body').value = '';
            
            // 切换到讨论列表标签页
            showTabContent('discussions');
            
            // 恢复按钮
            submitButton.disabled = false;
            submitButton.textContent = '发表';
            
            // 提示成功
            showRateLimitWarning(issuesList, '发表成功！', 'success');
            
            // 移除"没有找到讨论"提示（如果存在）
            const noResults = issuesList.querySelector('.no-results');
            if (noResults) {
                noResults.remove();
            }
            
            // 将新帖子添加到列表顶部，无需重新加载整个列表
            addNewIssueToList(issue);
        })
        .catch(error => {
            console.error('创建讨论失败:', error);
            showRateLimitWarning(createIssueForm, `创建失败: ${error.message}`);
            
            // 恢复按钮
            submitButton.disabled = false;
            submitButton.textContent = '发表';
        });
    }
    
    // 将新发布的帖子添加到列表顶部
    function addNewIssueToList(issue) {
        const issueElement = document.createElement('div');
        issueElement.className = 'issue-item';
        issueElement.setAttribute('data-issue-number', issue.number);
        
        // 获取标签 - 先从labels中获取，如果没有则尝试从内容中提取
        let label = null;
        let labelHTML = '';
        
        if (issue.labels && issue.labels.length > 0) {
            label = issue.labels[0].name;
        } else if (issue.body) {
            // 尝试从内容中提取标签
            label = extractLabelFromContent(issue.body);
        }
        
        if (label) {
            labelHTML = `<span class="issue-label" data-label="${label}">${label}</span>`;
        }
        
        // 格式化日期
        const createdDate = new Date(issue.created_at);
        const formattedDate = createdDate.toLocaleDateString('zh-CN');
        
        // 添加删除帖子的按钮（仅管理员可见）
        const deleteButtonHTML = isAdmin() ? 
            `<button class="delete-issue-btn" data-issue-number="${issue.number}">删除</button>` : '';
        
        // 获取用户显示名称和签名
        const displayName = getDisplayName(issue.user.login);
        const signature = getUserSignature(issue.user.login);
        const signatureHTML = signature ? `<span class="user-signature">${signature}</span>` : '';
        
        // 如果显示名称与GitHub用户名不同，添加一个小标签显示GitHub用户名
        const usernameBadgeHTML = (displayName !== issue.user.login) ? 
            `<span class="user-badge">${issue.user.login}</span>` : '';
        
        issueElement.innerHTML = `
            <h3>${issue.title}</h3>
            <div class="issue-meta">
                <span>作者: ${displayName}${usernameBadgeHTML}</span>
                <span>发布于: ${formattedDate}</span>
                ${labelHTML}
                <span>评论: ${issue.comments}</span>
                ${deleteButtonHTML}
            </div>
            ${signatureHTML}
        `;
        
        // 添加点赞功能
        const likeContainer = document.createElement('div');
        likeContainer.className = 'like-container';
        
        // 获取点赞数据，将在loadIssueLikes函数中填充
        const likeButton = document.createElement('button');
        likeButton.className = 'like-button';
        likeButton.innerHTML = `
            <span class="like-icon">👍</span>
            <span class="like-count">...</span>
        `;
        likeButton.setAttribute('data-issue-number', issue.number);
        
        // 添加点击事件，处理点赞
        likeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止冒泡，防止触发帖子详情查看
            toggleIssueLike(issue.number, likeButton);
        });
        
        likeContainer.appendChild(likeButton);
        issueElement.appendChild(likeContainer);
        
        // 加载点赞状态和数量
        loadIssueLikes(issue.number, likeButton);
        
        // 添加点击事件
        issueElement.addEventListener('click', (e) => {
            // 如果点击的是删除按钮，则执行删除操作
            if (e.target.classList.contains('delete-issue-btn')) {
                e.stopPropagation(); // 阻止事件冒泡
                if (confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
                    deleteIssue(issue.number);
                }
            } else if (!e.target.closest('.like-button')) {
                // 如果点击的不是点赞按钮，则查看帖子详情
                loadIssueDetails(issue.number);
            }
        });
        
        // 设置初始状态（为添加动画做准备）
        issueElement.style.opacity = '0';
        issueElement.style.maxHeight = '0';
        issueElement.style.overflow = 'hidden';
        issueElement.style.transition = 'all 0.5s ease';
        
        // 将新帖子添加到列表顶部
        if (issuesList.firstChild) {
            issuesList.insertBefore(issueElement, issuesList.firstChild);
        } else {
            issuesList.appendChild(issueElement);
        }
        
        // 触发渲染并应用动画
        setTimeout(() => {
            issueElement.style.opacity = '1';
            issueElement.style.maxHeight = '500px'; // 足够大的高度以适应内容
        }, 50);
    }
    
    // 登出
    function logout() {
        // 清除认证数据
        authData = {
            username: '',
            token: ''
        };
        
        // 清空用户个人资料显示
        userProfile = {
            nickname: '',
            signature: '',
            avatarUrl: ''
        };
        
        // 重置管理员列表为默认值
        ADMIN_USERS = [REPO_OWNER];
        
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
    
    // 加载用户个人资料
    function loadUserProfile() {
        if (!isAuthenticated()) return;
        
        const storedProfile = localStorage.getItem(`userProfile_${authData.username}`);
        if (storedProfile) {
            try {
                userProfile = JSON.parse(storedProfile);
                
                // 填充个人资料表单
                const nicknameInput = document.getElementById('user-nickname');
                const signatureInput = document.getElementById('user-signature');
                const avatarUrlInput = document.getElementById('user-avatar-url');
                const avatarPreview = document.getElementById('avatar-preview');
                
                if (nicknameInput) {
                    nicknameInput.value = userProfile.nickname || '';
                }
                
                if (signatureInput) {
                    signatureInput.value = userProfile.signature || '';
                }
                
                if (avatarUrlInput) {
                    avatarUrlInput.value = userProfile.avatarUrl || '';
                }
                
                if (avatarPreview) {
                    const avatarUrl = userProfile.avatarUrl || authData.avatar_url;
                    avatarPreview.style.backgroundImage = avatarUrl ? `url(${avatarUrl})` : 'none';
                }
            } catch (e) {
                console.error('解析用户资料失败:', e);
                localStorage.removeItem(`userProfile_${authData.username}`);
            }
        }
    }
    
    // 保存用户个人资料
    function saveUserProfile() {
        if (!isAuthenticated()) return;
        
        localStorage.setItem(`userProfile_${authData.username}`, JSON.stringify(userProfile));
    }
    
    // 处理个人资料表单提交
    async function handleProfileSubmit(e) {
        e.preventDefault();
        
        const nicknameInput = document.getElementById('user-nickname');
        const signatureInput = document.getElementById('user-signature');
        const avatarUrlInput = document.getElementById('user-avatar-url');
        
        userProfile = {
            nickname: nicknameInput.value.trim(),
            signature: signatureInput.value.trim(),
            avatarUrl: avatarUrlInput.value.trim()
        };
        
        // 保存个人资料
        saveUserProfile();
        
        // 处理管理员设置（如果存在）
        const adminUsernameInput = document.getElementById('admin-username');
        if (adminUsernameInput && isAdmin()) {
            const adminUsername = adminUsernameInput.value.trim();
            if (adminUsername) {
                // 显示加载指示器
                const submitButton = document.querySelector('#admin-form button[type="submit"]');
                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.innerText = '添加中...';
                }
                
                // 如果输入了用户名，则添加为管理员
                if (await addAdmin(adminUsername)) {
                    showRateLimitWarning(document.getElementById('admin-form'), `已添加 ${adminUsername} 为管理员`, 'success');
                    // 更新管理员列表显示
                    updateAdminsList();
                } else {
                    showRateLimitWarning(document.getElementById('admin-form'), `用户 ${adminUsername} 已经是管理员或添加失败`, 'error');
                }
                // 清空输入框
                adminUsernameInput.value = '';
                
                // 恢复按钮状态
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerText = '添加';
                }
            }
        }
        
        // 显示成功消息
        showRateLimitWarning(document.getElementById('profile-form'), '个人资料已更新', 'success');
    }
    
    // 获取用户显示名称
    function getDisplayName(username) {
        // 如果是当前用户，且设置了昵称，则使用昵称
        if (isAuthenticated() && authData.username === username && userProfile.nickname) {
            return userProfile.nickname;
        }
        
        // 获取存储的其他用户资料
        const storedProfile = localStorage.getItem(`userProfile_${username}`);
        if (storedProfile) {
            try {
                const profile = JSON.parse(storedProfile);
                if (profile.nickname) {
                    return profile.nickname;
                }
            } catch (e) {
                console.error('解析其他用户资料失败:', e);
            }
        }
        
        // 默认返回GitHub用户名
        return username;
    }
    
    // 获取用户头像URL
    function getAvatarUrl(username, defaultUrl) {
        // 如果是当前用户，且设置了头像，则使用自定义头像
        if (isAuthenticated() && authData.username === username && userProfile.avatarUrl) {
            return userProfile.avatarUrl;
        }
        
        // 获取存储的其他用户资料
        const storedProfile = localStorage.getItem(`userProfile_${username}`);
        if (storedProfile) {
            try {
                const profile = JSON.parse(storedProfile);
                if (profile.avatarUrl) {
                    return profile.avatarUrl;
                }
            } catch (e) {
                console.error('解析其他用户头像失败:', e);
            }
        }
        
        // 默认返回GitHub头像
        return defaultUrl;
    }
    
    // 获取用户签名
    function getUserSignature(username) {
        // 如果是当前用户，且设置了签名，则使用签名
        if (isAuthenticated() && authData.username === username && userProfile.signature) {
            return userProfile.signature;
        }
        
        // 获取存储的其他用户资料
        const storedProfile = localStorage.getItem(`userProfile_${username}`);
        if (storedProfile) {
            try {
                const profile = JSON.parse(storedProfile);
                if (profile.signature) {
                    return profile.signature;
                }
            } catch (e) {
                console.error('解析其他用户签名失败:', e);
            }
        }
        
        return '';
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
                
                // 如果切换到个人资料页并且是管理员，显示管理员设置
                if (tabId === 'profile' && isAdmin()) {
                    showAdminSettings();
                }
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
        
        // 个人资料表单提交
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', handleProfileSubmit);
        }
        
        // 头像URL输入框实时预览
        const avatarUrlInput = document.getElementById('user-avatar-url');
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarUrlInput && avatarPreview) {
            avatarUrlInput.addEventListener('input', () => {
                const url = avatarUrlInput.value.trim();
                if (url) {
                    avatarPreview.style.backgroundImage = `url(${url})`;
                } else {
                    // 使用GitHub头像作为默认值
                    avatarPreview.style.backgroundImage = authData.avatar_url ? 
                        `url(${authData.avatar_url})` : 'none';
                }
            });
        }
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
        
        // 显示删除中状态
        const issueElement = document.querySelector(`.issue-item[data-issue-number="${issueNumber}"]`);
        if (issueElement) {
            issueElement.style.opacity = '0.5';
            issueElement.style.pointerEvents = 'none';
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
            
            // 从DOM中移除这个帖子元素，实现即时视觉反馈
            if (issueElement) {
                issueElement.style.height = `${issueElement.offsetHeight}px`; // 设置高度，准备动画
                
                // 添加过渡动画
                issueElement.style.transition = 'all 0.3s ease';
                issueElement.style.opacity = '0';
                issueElement.style.height = '0';
                issueElement.style.marginBottom = '0';
                issueElement.style.padding = '0';
                issueElement.style.overflow = 'hidden';
                
                // 等待动画完成后移除元素
                setTimeout(() => {
                    issueElement.remove();
                    
                    // 如果列表为空，显示提示信息
                    if (issuesList.children.length === 0) {
                        issuesList.innerHTML = '<div class="no-results">没有找到讨论</div>';
                        pagination.innerHTML = '';
                    }
                }, 300);
            } else {
                // 如果找不到元素，则重新加载整个列表
                loadIssues();
            }
        })
        .catch(error => {
            console.error('删除帖子失败:', error);
            showRateLimitWarning(issuesList, `删除失败: ${error.message}`, 'error');
            
            // 恢复元素状态
            if (issueElement) {
                issueElement.style.opacity = '1';
                issueElement.style.pointerEvents = 'auto';
            }
        });
    }
    
    // 删除评论
    function deleteComment(commentId) {
        if (!isAdmin()) {
            showRateLimitWarning(commentsList, '你没有权限执行此操作', 'error');
            return;
        }
        
        // 找到要删除的评论元素
        const commentElement = document.querySelector(`.delete-comment-btn[data-comment-id="${commentId}"]`).closest('.comment-item');
        if (commentElement) {
            // 显示删除中状态
            commentElement.style.opacity = '0.5';
            commentElement.style.pointerEvents = 'none';
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
            
            // 从DOM中移除这个评论元素，实现即时视觉反馈
            if (commentElement) {
                // 先更新评论计数
                const currentCount = parseInt(commentsCount.textContent) || 0;
                commentsCount.textContent = Math.max(0, currentCount - 1);
                
                // 添加过渡动画
                commentElement.style.height = `${commentElement.offsetHeight}px`; // 设置初始高度
                commentElement.style.transition = 'all 0.3s ease';
                commentElement.style.opacity = '0';
                commentElement.style.height = '0';
                commentElement.style.marginBottom = '0';
                commentElement.style.padding = '0';
                commentElement.style.overflow = 'hidden';
                
                // 等待动画完成后移除元素
                setTimeout(() => {
                    commentElement.remove();
                    
                    // 如果评论列表为空，显示提示信息
                    if (commentsList.children.length === 0) {
                        commentsList.innerHTML = '<div class="no-comments">还没有评论</div>';
                    }
                }, 300);
            } else {
                // 如果找不到元素，则重新加载所有评论
                loadComments(currentIssueNumber);
            }
        })
        .catch(error => {
            console.error('删除评论失败:', error);
            showRateLimitWarning(commentsList, `删除失败: ${error.message}`, 'error');
            
            // 恢复元素状态
            if (commentElement) {
                commentElement.style.opacity = '1';
                commentElement.style.pointerEvents = 'auto';
            }
        });
    }
    
    // 加载帖子点赞状态和数量
    function loadIssueLikes(issueNumber, buttonElement) {
        // 获取点赞计数元素
        const countElement = buttonElement.querySelector('.like-count');
        
        // 获取帖子的reactions
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/reactions`, {
            method: 'GET',
            headers: {
                ...getRequestHeaders(),
                'Accept': 'application/vnd.github.squirrel-girl-preview+json' // 需要特定的预览头部
            }
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('加载点赞数据失败');
            }
            return response.json();
        })
        .then(reactions => {
            // 筛选出thumbs_up类型的reactions
            const thumbsUp = reactions.filter(reaction => reaction.content === '+1');
            
            // 更新计数
            countElement.textContent = thumbsUp.length;
            
            // 检查当前用户是否已点赞
            if (isAuthenticated()) {
                const userLiked = thumbsUp.some(reaction => reaction.user.login === authData.username);
                if (userLiked) {
                    buttonElement.classList.add('active');
                } else {
                    buttonElement.classList.remove('active');
                }
            }
        })
        .catch(error => {
            console.error(`加载点赞数据失败 (Issue #${issueNumber}):`, error);
            countElement.textContent = '-';
        });
    }
    
    // 点赞或取消点赞帖子
    function toggleIssueLike(issueNumber, buttonElement) {
        // 如果用户未登录，则提示登录
        if (!isAuthenticated()) {
            showRateLimitWarning(issuesList, '请先登录后再点赞', 'error');
            return;
        }
        
        // 禁用按钮，防止重复点击
        buttonElement.disabled = true;
        
        // 检查用户是否已点赞
        const isAlreadyLiked = buttonElement.classList.contains('active');
        const countElement = buttonElement.querySelector('.like-count');
        const currentCount = parseInt(countElement.textContent) || 0;
        
        // 根据当前状态决定操作：点赞或取消点赞
        if (isAlreadyLiked) {
            // 取消点赞需要先获取reaction ID
            getReactionId(issueNumber).then(reactionId => {
                if (!reactionId) {
                    buttonElement.disabled = false;
                    return;
                }
                
                // 发送删除reaction请求
                fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/reactions/${reactionId}`, {
                    method: 'DELETE',
                    headers: {
                        ...getRequestHeaders(),
                        'Accept': 'application/vnd.github.squirrel-girl-preview+json'
                    }
                })
                .then(response => {
                    checkRateLimit(response);
                    if (!response.ok) {
                        throw new Error('取消点赞失败');
                    }
                    
                    // 更新UI
                    buttonElement.classList.remove('active');
                    countElement.textContent = Math.max(0, currentCount - 1);
                    buttonElement.disabled = false;
                })
                .catch(error => {
                    console.error('取消点赞失败:', error);
                    buttonElement.disabled = false;
                });
            });
        } else {
            // 点赞操作
            fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/reactions`, {
                method: 'POST',
                headers: {
                    ...getRequestHeaders(),
                    'Accept': 'application/vnd.github.squirrel-girl-preview+json'
                },
                body: JSON.stringify({ content: '+1' }) // +1 表示点赞
            })
            .then(response => {
                checkRateLimit(response);
                if (!response.ok) {
                    throw new Error('点赞失败');
                }
                return response.json();
            })
            .then(() => {
                // 更新UI
                buttonElement.classList.add('active');
                countElement.textContent = currentCount + 1;
                buttonElement.disabled = false;
            })
            .catch(error => {
                console.error('点赞失败:', error);
                buttonElement.disabled = false;
            });
        }
    }
    
    // 获取用户对指定issue的reaction ID
    function getReactionId(issueNumber) {
        return fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}/reactions`, {
            method: 'GET',
            headers: {
                ...getRequestHeaders(),
                'Accept': 'application/vnd.github.squirrel-girl-preview+json'
            }
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('获取reactions失败');
            }
            return response.json();
        })
        .then(reactions => {
            // 查找当前用户的点赞reaction
            const userReaction = reactions.find(
                reaction => reaction.user.login === authData.username && reaction.content === '+1'
            );
            
            return userReaction ? userReaction.id : null;
        })
        .catch(error => {
            console.error('获取reaction ID失败:', error);
            return null;
        });
    }
    
    // 加载评论点赞状态和数量
    function loadCommentLikes(commentId, buttonElement) {
        // 获取点赞计数元素
        const countElement = buttonElement.querySelector('.like-count');
        
        // 获取评论的reactions
        fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/comments/${commentId}/reactions`, {
            method: 'GET',
            headers: {
                ...getRequestHeaders(),
                'Accept': 'application/vnd.github.squirrel-girl-preview+json'
            }
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('加载评论点赞数据失败');
            }
            return response.json();
        })
        .then(reactions => {
            // 筛选出thumbs_up类型的reactions
            const thumbsUp = reactions.filter(reaction => reaction.content === '+1');
            
            // 更新计数
            countElement.textContent = thumbsUp.length;
            
            // 检查当前用户是否已点赞
            if (isAuthenticated()) {
                const userLiked = thumbsUp.some(reaction => reaction.user.login === authData.username);
                if (userLiked) {
                    buttonElement.classList.add('active');
                } else {
                    buttonElement.classList.remove('active');
                }
            }
        })
        .catch(error => {
            console.error(`加载评论点赞数据失败 (Comment #${commentId}):`, error);
            countElement.textContent = '-';
        });
    }
    
    // 点赞或取消点赞评论
    function toggleCommentLike(commentId, buttonElement) {
        // 如果用户未登录，则提示登录
        if (!isAuthenticated()) {
            showRateLimitWarning(commentsList, '请先登录后再点赞', 'error');
            return;
        }
        
        // 禁用按钮，防止重复点击
        buttonElement.disabled = true;
        
        // 检查用户是否已点赞
        const isAlreadyLiked = buttonElement.classList.contains('active');
        const countElement = buttonElement.querySelector('.like-count');
        const currentCount = parseInt(countElement.textContent) || 0;
        
        // 根据当前状态决定操作：点赞或取消点赞
        if (isAlreadyLiked) {
            // 取消点赞需要先获取reaction ID
            getCommentReactionId(commentId).then(reactionId => {
                if (!reactionId) {
                    buttonElement.disabled = false;
                    return;
                }
                
                // 发送删除reaction请求
                fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/comments/${commentId}/reactions/${reactionId}`, {
                    method: 'DELETE',
                    headers: {
                        ...getRequestHeaders(),
                        'Accept': 'application/vnd.github.squirrel-girl-preview+json'
                    }
                })
                .then(response => {
                    checkRateLimit(response);
                    if (!response.ok) {
                        throw new Error('取消评论点赞失败');
                    }
                    
                    // 更新UI
                    buttonElement.classList.remove('active');
                    countElement.textContent = Math.max(0, currentCount - 1);
                    buttonElement.disabled = false;
                })
                .catch(error => {
                    console.error('取消评论点赞失败:', error);
                    buttonElement.disabled = false;
                });
            });
        } else {
            // 点赞操作
            fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/comments/${commentId}/reactions`, {
                method: 'POST',
                headers: {
                    ...getRequestHeaders(),
                    'Accept': 'application/vnd.github.squirrel-girl-preview+json'
                },
                body: JSON.stringify({ content: '+1' })
            })
            .then(response => {
                checkRateLimit(response);
                if (!response.ok) {
                    throw new Error('评论点赞失败');
                }
                return response.json();
            })
            .then(() => {
                // 更新UI
                buttonElement.classList.add('active');
                countElement.textContent = currentCount + 1;
                buttonElement.disabled = false;
            })
            .catch(error => {
                console.error('评论点赞失败:', error);
                buttonElement.disabled = false;
            });
        }
    }
    
    // 获取用户对指定评论的reaction ID
    function getCommentReactionId(commentId) {
        return fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/comments/${commentId}/reactions`, {
            method: 'GET',
            headers: {
                ...getRequestHeaders(),
                'Accept': 'application/vnd.github.squirrel-girl-preview+json'
            }
        })
        .then(response => {
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('获取评论reactions失败');
            }
            return response.json();
        })
        .then(reactions => {
            // 查找当前用户的点赞reaction
            const userReaction = reactions.find(
                reaction => reaction.user.login === authData.username && reaction.content === '+1'
            );
            
            return userReaction ? userReaction.id : null;
        })
        .catch(error => {
            console.error('获取评论reaction ID失败:', error);
            return null;
        });
    }
    
    // 加载管理员列表
    async function loadAdminUsers() {
        // 首先尝试查找配置Issue
        const configIssue = await findConfigIssue();
        
        if (configIssue && configIssue.body) {
            try {
                // 尝试解析配置Issue的内容
                const config = JSON.parse(configIssue.body);
                
                // 确保仓库所有者始终是管理员
                if (config.admins && Array.isArray(config.admins)) {
                    ADMIN_USERS = config.admins;
                    if (!ADMIN_USERS.includes(REPO_OWNER)) {
                        ADMIN_USERS.push(REPO_OWNER);
                    }
                } else {
                    ADMIN_USERS = [REPO_OWNER];
                }
            } catch (e) {
                console.error('解析管理员数据失败:', e);
                ADMIN_USERS = [REPO_OWNER];
                
                // 配置错误时更新配置
                await saveAdminUsers();
            }
        } else {
            // 如果不存在配置Issue，创建一个
            ADMIN_USERS = [REPO_OWNER];
            await saveAdminUsers();
        }
        
        // 更新界面中的管理员列表
        updateAdminsList();
    }
    
    // 保存管理员列表
    async function saveAdminUsers() {
        // 确保仓库所有者始终是管理员
        if (!ADMIN_USERS.includes(REPO_OWNER)) {
            ADMIN_USERS.push(REPO_OWNER);
        }
        
        // 准备配置数据
        const configData = JSON.stringify({ admins: ADMIN_USERS });
        
        // 查找是否已存在配置Issue
        const configIssue = await findConfigIssue();
        
        if (configIssue) {
            // 更新配置Issue
            await updateIssue(configIssue.number, configData);
        } else {
            // 创建新配置Issue
            await createConfigIssue(configData);
        }
    }
    
    // 添加管理员
    async function addAdmin(username) {
        if (!username || !isAdmin()) return false;
        
        // 检查用户名是否已存在
        if (!ADMIN_USERS.includes(username)) {
            ADMIN_USERS.push(username);
            await saveAdminUsers();
            return true;
        }
        return false;
    }
    
    // 移除管理员
    async function removeAdmin(username) {
        if (!username || !isAdmin() || username === REPO_OWNER) return false;
        
        const index = ADMIN_USERS.indexOf(username);
        if (index !== -1) {
            ADMIN_USERS.splice(index, 1);
            await saveAdminUsers();
            return true;
        }
        return false;
    }
    
    // 更新管理员列表显示
    function updateAdminsList() {
        const adminsList = document.getElementById('admins-list');
        if (!adminsList || !isAdmin()) return;
        
        adminsList.innerHTML = '';
        
        ADMIN_USERS.forEach(admin => {
            const adminItem = document.createElement('div');
            adminItem.className = 'admin-item';
            
            // 仓库所有者不能被移除
            if (admin === REPO_OWNER) {
                adminItem.innerHTML = `
                    <span class="admin-name">${admin}</span>
                    <span class="admin-owner-badge">站长</span>
                `;
            } else {
                adminItem.innerHTML = `
                    <span class="admin-name">${admin}</span>
                    <button class="remove-admin-btn" data-username="${admin}">移除</button>
                `;
            }
            
            adminsList.appendChild(adminItem);
        });
        
        // 添加移除管理员的事件监听
        const removeButtons = adminsList.querySelectorAll('.remove-admin-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const username = button.getAttribute('data-username');
                if (confirm(`确定要移除管理员 ${username} 吗？`)) {
                    // 禁用按钮并显示加载状态
                    button.disabled = true;
                    button.innerText = '移除中...';
                    
                    if (await removeAdmin(username)) {
                        updateAdminsList();
                        showRateLimitWarning(document.getElementById('admin-form'), `已移除管理员 ${username}`, 'success');
                    } else {
                        button.disabled = false;
                        button.innerText = '移除';
                        showRateLimitWarning(document.getElementById('admin-form'), `移除管理员 ${username} 失败`, 'error');
                    }
                }
            });
        });
    }
    
    // 显示管理员设置
    function showAdminSettings() {
        // 检查是否已有管理员设置区域
        let adminSection = document.querySelector('.admin-settings');
        if (adminSection) {
            // 已存在，仅更新列表
            updateAdminsList();
            return;
        }
        
        // 如果不存在且用户是管理员，创建设置区域
        if (isAdmin()) {
            const profileContainer = document.querySelector('.profile-container');
            if (!profileContainer) return;
            
            // 创建管理员设置区域
            adminSection = document.createElement('div');
            adminSection.className = 'admin-settings';
            adminSection.innerHTML = `
                <h3>管理员设置</h3>
                <form id="admin-form">
                    <div class="form-group">
                        <label for="admin-username">添加管理员:</label>
                        <input type="text" id="admin-username" placeholder="输入GitHub用户名">
                        <button type="submit" class="primary-button">添加</button>
                    </div>
                    <div class="form-group">
                        <label>当前管理员列表:</label>
                        <div id="admins-list" class="admins-list"></div>
                    </div>
                    <small>管理员设置通过GitHub Issue同步，所有用户都能看到最新的管理员列表</small>
                </form>
            `;
            
            // 将管理员设置添加到个人资料页面
            profileContainer.appendChild(adminSection);
            
            // 更新管理员列表
            updateAdminsList();
            
            // 添加表单提交事件
            const adminForm = document.getElementById('admin-form');
            adminForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleProfileSubmit(e);
            });
        }
    }
    
    // 查找配置Issue
    async function findConfigIssue() {
        try {
            // 构建查询参数
            const params = new URLSearchParams({
                labels: CONFIG_ISSUE_LABEL,
                state: 'open',
                creator: REPO_OWNER
            });
            
            // 发起请求
            const response = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues?${params.toString()}`, {
                method: 'GET',
                headers: getRequestHeaders()
            });
            
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('查找配置失败');
            }
            
            const issues = await response.json();
            return issues.length > 0 ? issues[0] : null;
        } catch (error) {
            console.error('查找配置Issue失败:', error);
            return null;
        }
    }
    
    // 创建配置Issue
    async function createConfigIssue(configData) {
        try {
            const response = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({
                    title: CONFIG_ISSUE_TITLE,
                    body: configData,
                    labels: [CONFIG_ISSUE_LABEL],
                    // 添加一个随机字符，使配置Issue看起来像一个加密内容
                    // 这只是一种视觉提示，表明这是系统配置
                    body: `<!-- SYSTEM_CONFIG DO NOT MODIFY MANUALLY -->\n${configData}\n<!-- END_OF_CONFIG -->`
                })
            });
            
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('创建配置失败');
            }
            
            return await response.json();
        } catch (error) {
            console.error('创建配置Issue失败:', error);
            return null;
        }
    }
    
    // 更新Issue内容
    async function updateIssue(issueNumber, issueBody) {
        try {
            const response = await fetch(`${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`, {
                method: 'PATCH',
                headers: getRequestHeaders(),
                body: JSON.stringify({ 
                    body: `<!-- SYSTEM_CONFIG DO NOT MODIFY MANUALLY -->\n${issueBody}\n<!-- END_OF_CONFIG -->`
                })
            });
            
            checkRateLimit(response);
            if (!response.ok) {
                throw new Error('更新配置失败');
            }
            
            return await response.json();
        } catch (error) {
            console.error('更新Issue失败:', error);
            return null;
        }
    }
    
    // 初始化
    init();
}); 