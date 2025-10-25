/**
 * Forum配置模块
 * 集中管理所有配置常量
 */

// GitHub API基础URL
export const GITHUB_API_URL = 'https://api.github.com';

// 从URL或localStorage获取仓库信息
export function getRepoConfig() {
    const urlParams = new URLSearchParams(window.location.search);

    const owner = localStorage.getItem('forum_repo_owner') ||
                  urlParams.get('owner') ||
                  '13108387302';

    const name = localStorage.getItem('forum_repo_name') ||
                 urlParams.get('repo') ||
                 'jasonaa';

    // 如果URL中有参数，保存到localStorage
    if (urlParams.get('owner')) {
        localStorage.setItem('forum_repo_owner', urlParams.get('owner'));
    }
    if (urlParams.get('repo')) {
        localStorage.setItem('forum_repo_name', urlParams.get('repo'));
    }

    return { owner, name };
}

// 配置Issue的标签和标题
export const CONFIG_ISSUE_LABEL = "forum-config";
export const CONFIG_ISSUE_TITLE = "Forum Configuration";

// 分页配置
export const PER_PAGE = 10;

// 频率限制配置
export const MIN_RATE_LIMIT = 20; // 最低请求限制警告阈值

// 管理员用户列表初始化
export function initAdminUsers(repoOwner) {
    return [repoOwner]; // 默认仓库所有者为管理员
}

// 导出配置对象
export const config = {
    GITHUB_API_URL,
    CONFIG_ISSUE_LABEL,
    CONFIG_ISSUE_TITLE,
    PER_PAGE,
    MIN_RATE_LIMIT
};
