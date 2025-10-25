/**
 * Forum主入口 - 模块化架构
 * 协调所有功能模块
 */

import { getRepoConfig, initAdminUsers } from './modules/config.js';
import auth from './modules/auth.js';
import ui from './modules/ui.js';
import issues from './modules/issues.js';
import comments from './modules/comments.js';
import reactions from './modules/reactions.js';
import profile from './modules/profile.js';
import { getRateLimitStatus } from './modules/github-api.js';

// 应用状态
const appState = {
    repoOwner: '',
    repoName: '',
    adminUsers: [],
    currentIssueNumber: null
};

/**
 * 初始化应用
 */
async function init() {
    // 获取仓库配置
    const repoConfig = getRepoConfig();
    appState.repoOwner = repoConfig.owner;
    appState.repoName = repoConfig.name;

    // 显示仓库信息
    displayRepoInfo();

    // 初始化UI
    ui.initUI();

    // 加载认证数据
    const hasAuth = auth.loadAuthData();

    if (hasAuth && auth.isAuthenticated()) {
        // 已登录，显示论坛内容
        const userData = auth.getAuthData();
        appState.adminUsers = initAdminUsers(appState.repoOwner);

        // 检查是否为管理员
        userData.isAdmin = appState.adminUsers.includes(userData.username);

        ui.showForumContent(userData);

        // 加载用户资料
        try {
            await profile.loadUserProfile();
        } catch (error) {
            console.error('加载用户资料失败:', error);
        }

        // 加载Issues列表
        try {
            await issues.loadIssuesList();
        } catch (error) {
            console.error('加载Issues失败:', error);
        }

        // 显示权限警告（如果没有gist权限）
        if (!auth.hasGistPermission()) {
            ui.showPermissionWarning();
        }
    } else {
        // 未登录，显示登录表单
        ui.showLoginForm();
    }

    // 设置事件监听器
    setupEventListeners();
}

/**
 * 显示仓库信息
 */
function displayRepoInfo() {
    const repoInfoElement = document.createElement('div');
    repoInfoElement.className = 'repo-info';
    repoInfoElement.innerHTML = `
        当前连接: ${appState.repoOwner}/${appState.repoName}
        <button id="change-repo-btn" title="更改仓库">⚙️</button>
    `;

    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(repoInfoElement, container.firstChild);
    }

    // 更改仓库按钮事件
    const changeRepoBtn = document.getElementById('change-repo-btn');
    if (changeRepoBtn) {
        changeRepoBtn.addEventListener('click', () => {
            const newOwner = prompt('请输入GitHub用户名:', appState.repoOwner);
            if (newOwner) {
                const newRepo = prompt('请输入仓库名:', appState.repoName);
                if (newRepo) {
                    localStorage.setItem('forum_repo_owner', newOwner);
                    localStorage.setItem('forum_repo_name', newRepo);
                    window.location.reload();
                }
            }
        });
    }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 登录表单提交
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // 登出按钮
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // 标签页切换
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            ui.showTab(tabId);
        });
    });

    // 创建Issue表单
    const createIssueForm = document.getElementById('create-issue-form');
    if (createIssueForm) {
        createIssueForm.addEventListener('submit', handleCreateIssue);
    }

    // 返回列表按钮
    const backToListButton = document.getElementById('back-to-list');
    if (backToListButton) {
        backToListButton.addEventListener('click', () => {
            ui.backToList();
            appState.currentIssueNumber = null;
        });
    }

    // 评论表单
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', handleSubmitComment);
    }

    // 搜索按钮
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    // 标签过滤
    const filterLabel = document.getElementById('filter-label');
    if (filterLabel) {
        filterLabel.addEventListener('change', handleLabelFilter);
    }

    // Issue点击事件（自定义事件）
    window.addEventListener('issueClick', async (e) => {
        const { issueNumber } = e.detail;
        await handleIssueClick(issueNumber);
    });

    // 评论点赞事件（自定义事件）
    window.addEventListener('commentLikeClick', async (e) => {
        const { commentId, button } = e.detail;
        try {
            await reactions.toggleCommentLike(commentId, button);
        } catch (error) {
            console.error('点赞失败:', error);
        }
    });
}

/**
 * 处理登录
 */
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const token = document.getElementById('login-token').value.trim();
    const loginMessage = ui.getElement('loginMessage');

    if (!username || !token) {
        ui.showMessage(loginMessage, '请提供用户名和访问令牌', 'error');
        return;
    }

    ui.showMessage(loginMessage, '正在验证...', '');

    try {
        const result = await auth.login(username, token);

        ui.showMessage(loginMessage, '登录成功！正在加载论坛...', 'success');

        // 延迟显示论坛内容
        setTimeout(() => {
            const userData = auth.getAuthData();
            userData.isAdmin = appState.adminUsers.includes(userData.username);
            ui.showForumContent(userData);
            issues.loadIssuesList();

            // 显示权限警告
            if (!result.hasGistPermission) {
                ui.showPermissionWarning();
            }
        }, 1000);
    } catch (error) {
        ui.showMessage(loginMessage, '登录失败: ' + error.message, 'error');
    }
}

/**
 * 处理登出
 */
function handleLogout() {
    if (confirm('确定要登出吗？')) {
        auth.logout();
        ui.showLoginForm();
        reactions.clearReactionCache();
    }
}

/**
 * 处理创建Issue
 */
async function handleCreateIssue(e) {
    e.preventDefault();

    const title = document.getElementById('issue-title').value.trim();
    const body = document.getElementById('issue-body').value.trim();
    const label = document.getElementById('issue-label').value;

    if (!title || !body) {
        alert('请填写标题和内容');
        return;
    }

    try {
        // 在内容中添加标签标记
        const bodyWithLabel = `<!-- category:${label} -->\n\n${body}`;

        const issueData = {
            title,
            body: bodyWithLabel,
            labels: [label]
        };

        await issues.createIssue(issueData);

        alert('发布成功！');

        // 清空表单
        e.target.reset();

        // 切换到列表标签页并刷新
        ui.showTab('discussions');
        await issues.loadIssuesList();
    } catch (error) {
        alert('发布失败: ' + error.message);
    }
}

/**
 * 处理Issue点击
 */
async function handleIssueClick(issueNumber) {
    appState.currentIssueNumber = issueNumber;

    ui.showIssueDetail();

    try {
        // 加载Issue详情
        const issue = await issues.loadIssueDetail(issueNumber);

        // 加载评论
        await comments.loadComments(issueNumber);

        // 加载点赞（如果有相关按钮）
        const likeButton = document.querySelector(`[data-issue-number="${issueNumber}"] .like-issue-btn`);
        if (likeButton) {
            await reactions.loadIssueLikes(issueNumber, likeButton);
        }
    } catch (error) {
        console.error('加载Issue详情失败:', error);
        alert('加载失败: ' + error.message);
    }
}

/**
 * 处理提交评论
 */
async function handleSubmitComment(e) {
    e.preventDefault();

    if (!appState.currentIssueNumber) {
        alert('无效的Issue');
        return;
    }

    const commentBody = document.getElementById('comment-body').value.trim();

    if (!commentBody) {
        alert('请输入评论内容');
        return;
    }

    try {
        await comments.submitComment(appState.currentIssueNumber, commentBody);

        // 清空表单
        e.target.reset();

        // 重新加载评论
        await comments.loadComments(appState.currentIssueNumber);

        alert('评论成功！');
    } catch (error) {
        alert('评论失败: ' + error.message);
    }
}

/**
 * 处理搜索
 */
async function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput ? searchInput.value.trim() : '';

    try {
        await issues.loadIssuesList({ searchQuery: query });
    } catch (error) {
        console.error('搜索失败:', error);
    }
}

/**
 * 处理标签过滤
 */
async function handleLabelFilter(e) {
    const label = e.target.value;

    try {
        await issues.loadIssuesList({ label });
    } catch (error) {
        console.error('过滤失败:', error);
    }
}

/**
 * 检查速率限制并显示警告
 */
function checkAndShowRateLimit() {
    const status = getRateLimitStatus();

    if (status.remaining !== null && status.remaining < 20) {
        const resetDate = status.resetDate;
        const message = `API请求次数即将用尽（剩余${status.remaining}次），将在 ${resetDate ? resetDate.toLocaleString() : '稍后'} 重置。`;
        ui.showRateLimitWarning(message, 'error');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 定期检查速率限制
setInterval(checkAndShowRateLimit, 60000); // 每分钟检查一次
