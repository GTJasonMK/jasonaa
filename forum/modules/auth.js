/**
 * 认证模块
 * 管理用户认证状态和登录/登出逻辑
 */

import { authAPI } from './github-api.js';

// 认证数据
let authData = {
    username: '',
    token: '',
    avatar_url: '',
    hasGistPermission: false
};

// 认证状态变更回调
let onAuthChangeCallback = null;

/**
 * 设置认证状态变更监听器
 */
export function onAuthChange(callback) {
    onAuthChangeCallback = callback;
}

/**
 * 触发认证状态变更
 */
function triggerAuthChange(isAuthenticated) {
    if (onAuthChangeCallback) {
        onAuthChangeCallback(isAuthenticated, authData);
    }
}

/**
 * 检查是否已认证
 */
export function isAuthenticated() {
    return !!(authData.username && authData.token);
}

/**
 * 获取当前认证数据
 */
export function getAuthData() {
    return { ...authData };
}

/**
 * 保存认证数据到localStorage
 */
export function saveAuthData() {
    const dataToSave = {
        username: authData.username,
        token: authData.token,
        avatar_url: authData.avatar_url,
        hasGistPermission: authData.hasGistPermission
    };
    localStorage.setItem('forumAuthData', JSON.stringify(dataToSave));
}

/**
 * 从localStorage加载认证数据
 */
export function loadAuthData() {
    const savedData = localStorage.getItem('forumAuthData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            authData = {
                username: parsed.username || '',
                token: parsed.token || '',
                avatar_url: parsed.avatar_url || '',
                hasGistPermission: parsed.hasGistPermission || false
            };
            return true;
        } catch (e) {
            console.error('加载认证数据失败:', e);
            return false;
        }
    }
    return false;
}

/**
 * 用户登录
 */
export async function login(username, token) {
    try {
        // 步骤1: 验证token
        const userData = await authAPI.getUser(token);

        if (userData.login.toLowerCase() !== username.toLowerCase()) {
            throw new Error('令牌与用户名似乎不相配');
        }

        // 步骤2: 检查gist权限
        const hasGistPermission = await authAPI.checkGistPermission(token);

        // 步骤3: 保存认证数据
        authData = {
            username: userData.login,
            token: token,
            avatar_url: userData.avatar_url,
            hasGistPermission
        };

        saveAuthData();
        triggerAuthChange(true);

        return {
            success: true,
            hasGistPermission,
            user: userData
        };
    } catch (error) {
        console.error('认证错误:', error);
        throw error;
    }
}

/**
 * 用户登出
 */
export function logout() {
    authData = {
        username: '',
        token: '',
        avatar_url: '',
        hasGistPermission: false
    };

    localStorage.removeItem('forumAuthData');
    triggerAuthChange(false);
}

/**
 * 获取用户头像URL
 */
export function getAvatarUrl() {
    return authData.avatar_url || '';
}

/**
 * 获取用户名
 */
export function getUsername() {
    return authData.username || '';
}

/**
 * 获取Token
 */
export function getToken() {
    return authData.token || '';
}

/**
 * 检查是否有Gist权限
 */
export function hasGistPermission() {
    return authData.hasGistPermission;
}

// 导出认证模块
export default {
    isAuthenticated,
    getAuthData,
    login,
    logout,
    loadAuthData,
    saveAuthData,
    onAuthChange,
    getAvatarUrl,
    getUsername,
    getToken,
    hasGistPermission
};
