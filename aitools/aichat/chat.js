// 导入LLMClient和SessionManager
import { LLMClient } from './llm-client.js';
import { SessionManager } from './session-manager.js';

// AI聊天室 - 核心逻辑（支持多会话管理）
class AIChatRoom {
    constructor() {
        this.sessionManager = new SessionManager();
        this.config = this.loadConfig();
        this.isProcessing = false;

        // 触摸手势相关
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchMoveX = 0;

        this.initUI();
        this.bindEvents();
        this.loadCurrentSession();
    }

    // 加载配置
    loadConfig() {
        const saved = localStorage.getItem('aichat_config');
        const defaultConfig = {
            enabled: true,
            apiUrl: '',
            apiKey: '',  // 空字符串，强制用户配置
            model: 'gpt-3.5-turbo',
            systemPrompt: '',
            temperature: 0.7,
            maxTokens: 2000
        };
        return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    }

    // 保存配置
    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('aichat_config', JSON.stringify(this.config));
        console.log('[AIChatRoom] 配置已保存:', this.config);
    }

    // 加载当前会话
    loadCurrentSession() {
        const session = this.sessionManager.getCurrentSession();
        if (session) {
            this.renderMessages(session.messages);
        }
        this.renderSessionsList();
    }

    // 初始化UI
    initUI() {
        // 加载配置到表单
        document.getElementById('enableAI').checked = this.config.enabled;
        document.getElementById('apiUrl').value = this.config.apiUrl;
        document.getElementById('apiKey').value = this.config.apiKey;
        document.getElementById('systemPrompt').value = this.config.systemPrompt;
        document.getElementById('temperature').value = this.config.temperature;
        document.getElementById('maxTokens').value = this.config.maxTokens;

        // 设置模型
        const modelSelect = document.getElementById('modelSelect');
        const isCustomModel = !Array.from(modelSelect.options).some(opt => opt.value === this.config.model);
        if (isCustomModel && this.config.model) {
            modelSelect.value = 'custom';
            document.getElementById('customModel').value = this.config.model;
            document.getElementById('customModel').style.display = 'block';
        } else {
            modelSelect.value = this.config.model;
        }

        // 更新滑块显示
        document.getElementById('tempValue').textContent = this.config.temperature;
        document.getElementById('tokensValue').textContent = this.config.maxTokens;

        // 默认隐藏设置面板
        document.getElementById('settingsPanel').classList.add('hidden');
    }

    // 绑定事件
    bindEvents() {
        // 设置面板切换
        document.getElementById('toggleSettings').addEventListener('click', () => {
            const panel = document.getElementById('settingsPanel');
            const sidebar = document.getElementById('sessionsSidebar');

            // 切换设置面板
            panel.classList.toggle('hidden');

            // 如果设置面板显示，关闭会话侧边栏（避免重叠）
            if (!panel.classList.contains('hidden')) {
                this.closeSidebar();
            }
        });

        // 新对话按钮
        document.getElementById('newChatButton').addEventListener('click', () => {
            this.createNewChat();
        });

        // 清空当前会话
        document.getElementById('clearChat').addEventListener('click', () => {
            if (confirm('确定要清空当前对话记录吗？')) {
                this.clearCurrentChat();
            }
        });

        // 关闭侧边栏按钮（移动端）
        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.closeSidebar();
        });

        // 遮罩层点击关闭侧边栏
        document.getElementById('sidebarOverlay').addEventListener('click', () => {
            this.closeSidebar();
        });

        // 触摸手势 - 左滑显示侧边栏（仅移动端）
        const chatArea = document.querySelector('.chat-area');
        chatArea.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        chatArea.addEventListener('touchmove', (e) => {
            this.touchMoveX = e.touches[0].clientX;
        }, { passive: true });

        chatArea.addEventListener('touchend', (e) => {
            const deltaX = this.touchMoveX - this.touchStartX;
            const deltaY = Math.abs(this.touchMoveX - this.touchStartY);

            // 如果是向右滑动且滑动距离>50px，且垂直滑动距离<30px（排除滚动）
            if (deltaX > 50 && deltaY < 30 && this.touchStartX < 50) {
                this.openSidebar();
            }
        });

        // 保存配置
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveConfigFromForm();
        });

        // 测试连接
        document.getElementById('testConnection').addEventListener('click', () => {
            this.testConnection();
        });

        // 模型选择
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            const customInput = document.getElementById('customModel');
            if (e.target.value === 'custom') {
                customInput.style.display = 'block';
            } else {
                customInput.style.display = 'none';
            }
        });

        // 滑块值显示
        document.getElementById('temperature').addEventListener('input', (e) => {
            document.getElementById('tempValue').textContent = e.target.value;
        });

        document.getElementById('maxTokens').addEventListener('input', (e) => {
            document.getElementById('tokensValue').textContent = e.target.value;
        });

        // 发送消息
        document.getElementById('sendButton').addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框回车发送
        const input = document.getElementById('messageInput');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 输入框自动调整高度
        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 200) + 'px';
        });
    }

    // 侧边栏控制
    openSidebar() {
        const sidebar = document.getElementById('sessionsSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const settingsPanel = document.getElementById('settingsPanel');

        // 关闭设置面板
        settingsPanel.classList.add('hidden');

        // 显示侧边栏
        sidebar.classList.add('active');
        overlay.classList.add('active');
    }

    closeSidebar() {
        const sidebar = document.getElementById('sessionsSidebar');
        const overlay = document.getElementById('sidebarOverlay');

        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }

    // 创建新对话
    createNewChat() {
        this.sessionManager.createSession();
        this.renderSessionsList();
        this.loadCurrentSession();
        this.closeSidebar();
    }

    // 切换会话
    switchSession(sessionId) {
        const session = this.sessionManager.switchSession(sessionId);
        if (session) {
            this.renderMessages(session.messages);
            this.renderSessionsList();
            this.closeSidebar();
        }
    }

    // 删除会话
    deleteSession(sessionId) {
        if (confirm('确定要删除这个对话吗？')) {
            this.sessionManager.deleteSession(sessionId);
            this.renderSessionsList();
            this.loadCurrentSession();
        }
    }

    // 清空当前会话
    clearCurrentChat() {
        this.sessionManager.clearCurrentSession();
        this.loadCurrentSession();
    }

    // 渲染会话列表
    renderSessionsList() {
        const container = document.getElementById('sessionsList');
        const sessions = this.sessionManager.getSessionsSummary();

        if (sessions.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.5;">暂无对话历史</div>';
            return;
        }

        container.innerHTML = sessions.map(session => {
            const date = new Date(session.lastUpdated);
            const timeStr = this.formatTime(date);
            const activeClass = session.isCurrent ? 'active' : '';

            return `
                <div class="session-item ${activeClass}" data-session-id="${session.id}">
                    <div class="session-content">
                        <div class="session-title">${this.escapeHtml(session.title)}</div>
                        <div class="session-time">${timeStr} · ${session.messageCount}条消息</div>
                    </div>
                    <div class="session-actions">
                        <button class="session-btn btn-delete" data-session-id="${session.id}" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        // 绑定会话项点击事件
        container.querySelectorAll('.session-item').forEach(item => {
            const sessionId = item.dataset.sessionId;

            item.addEventListener('click', (e) => {
                // 如果点击的是删除按钮，不触发切换
                if (!e.target.classList.contains('btn-delete') && !e.target.closest('.btn-delete')) {
                    this.switchSession(sessionId);
                }
            });
        });

        // 绑定删除按钮事件
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = btn.dataset.sessionId;
                this.deleteSession(sessionId);
            });
        });
    }

    // 格式化时间
    formatTime(date) {
        const now = new Date();
        const diff = now - date;

        // 1分钟内
        if (diff < 60000) {
            return '刚刚';
        }

        // 1小时内
        if (diff < 3600000) {
            return Math.floor(diff / 60000) + '分钟前';
        }

        // 今天
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }

        // 昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return '昨天';
        }

        // 一周内
        if (diff < 7 * 24 * 3600000) {
            const days = ['日', '一', '二', '三', '四', '五', '六'];
            return '周' + days[date.getDay()];
        }

        // 更早
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 从表单保存配置
    saveConfigFromForm() {
        const modelSelect = document.getElementById('modelSelect');
        let model = modelSelect.value;
        if (model === 'custom') {
            model = document.getElementById('customModel').value.trim();
        }

        const config = {
            enabled: document.getElementById('enableAI').checked,
            apiUrl: document.getElementById('apiUrl').value.trim(),
            apiKey: document.getElementById('apiKey').value.trim(),
            model: model,
            systemPrompt: document.getElementById('systemPrompt').value.trim(),
            temperature: parseFloat(document.getElementById('temperature').value),
            maxTokens: parseInt(document.getElementById('maxTokens').value)
        };

        this.saveConfig(config);
        alert('✅ 配置已保存！');
    }

    // 测试连接
    async testConnection() {
        if (!this.config.apiKey) {
            alert('⚠️ 请先输入API Key');
            return;
        }

        const button = document.getElementById('testConnection');
        button.disabled = true;
        button.textContent = '⏳ 测试中...';

        try {
            const testMessage = '你好，请简短回复';
            const response = await this.callAPI(testMessage, []);

            alert('✅ API连接成功！\n\n回复：' + response.substring(0, 50) + '...');
        } catch (error) {
            alert('❌ 连接失败：\n\n' + error.message);
        } finally {
            button.disabled = false;
            button.textContent = '🔗 测试连接';
        }
    }

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message || this.isProcessing) {
            return;
        }

        if (!this.config.enabled || !this.config.apiKey) {
            alert('⚠️ 请先配置API信息');
            return;
        }

        // 添加用户消息到当前会话
        this.sessionManager.addMessageToCurrentSession({
            role: 'user',
            content: message,
            timestamp: Date.now()
        });

        input.value = '';
        input.style.height = 'auto';

        // 重新渲染消息和会话列表
        const currentSession = this.sessionManager.getCurrentSession();
        this.renderMessages(currentSession.messages);
        this.renderSessionsList();

        // 显示输入状态
        this.setStatus('AI正在思考...');
        this.isProcessing = true;
        document.getElementById('sendButton').disabled = true;

        // 显示打字动画
        this.showTypingIndicator();

        try {
            // 获取上下文（最近10条消息）
            const context = currentSession.messages.slice(-10);

            // 调用API
            const response = await this.callAPI(message, context);

            // 移除打字动画
            this.removeTypingIndicator();

            // 添加AI回复到当前会话
            this.sessionManager.addMessageToCurrentSession({
                role: 'ai',
                content: response,
                timestamp: Date.now()
            });

            // 重新渲染
            const updatedSession = this.sessionManager.getCurrentSession();
            this.renderMessages(updatedSession.messages);
            this.renderSessionsList();

            this.setStatus('');
        } catch (error) {
            this.removeTypingIndicator();
            this.setStatus('');

            const errorMsg = `抱歉，发生错误：\n${error.message}`;

            this.sessionManager.addMessageToCurrentSession({
                role: 'ai',
                content: errorMsg,
                timestamp: Date.now()
            });

            const updatedSession = this.sessionManager.getCurrentSession();
            this.renderMessages(updatedSession.messages);

            console.error('[AIChatRoom] 发送消息失败:', error);
        } finally {
            this.isProcessing = false;
            document.getElementById('sendButton').disabled = false;
            input.focus();
        }
    }

    // 调用API（使用新的LLMClient）
    async callAPI(userMessage, context) {
        if (!this.config.apiKey) {
            throw new Error('请先配置API Key');
        }

        // 构建消息数组
        const messages = [];

        // 添加system prompt
        if (this.config.systemPrompt) {
            messages.push({
                role: 'system',
                content: this.config.systemPrompt
            });
        }

        // 添加历史对话
        context.forEach(msg => {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        });

        // 添加当前消息
        messages.push({
            role: 'user',
            content: userMessage
        });

        // 创建LLM客户端
        const client = LLMClient.createFromConfig({
            apiKey: this.config.apiKey,
            baseUrl: this.config.apiUrl,
            model: this.config.model,
            simulateBrowser: true  // 启用浏览器模拟，绕过Cloudflare
        });

        console.log('[AIChatRoom] ========== API请求详情 ==========');
        console.log('[AIChatRoom] 使用LLMClient统一封装');
        console.log('[AIChatRoom] 模型:', this.config.model);
        console.log('[AIChatRoom] 消息数量:', messages.length);
        console.log('[AIChatRoom] Temperature:', this.config.temperature);
        console.log('[AIChatRoom] Max Tokens:', this.config.maxTokens);

        try {
            // 使用流式收集方法
            const result = await client.streamAndCollect(messages, {
                timeout: 120,  // 超时120秒
                temperature: this.config.temperature,
                maxTokens: this.config.maxTokens,
                maxRetries: 2  // 最多重试2次
            });

            console.log('[AIChatRoom] 请求成功');
            console.log('[AIChatRoom] 返回内容长度:', result.content.length);
            console.log('[AIChatRoom] Chunks数量:', result.chunkCount);

            // 如果有reasoning内容（DeepSeek R1等），可以选择性显示
            if (result.reasoning) {
                console.log('[AIChatRoom] Reasoning长度:', result.reasoning.length);
                // 可以在这里决定是否将reasoning也返回给用户
            }

            return result.content;

        } catch (error) {
            console.error('[AIChatRoom] ========== 请求失败详情 ==========');
            console.error('[AIChatRoom] 错误信息:', error.message);

            // LLMClient已经处理了大部分错误，这里只需要添加用户友好的提示
            if (error.message.includes('网络连接失败')) {
                throw new Error(`网络连接失败

可能的原因：
1. API服务器未配置CORS允许跨域访问
2. API地址不正确: ${this.config.apiUrl || '(未设置)'}
3. 网络连接问题

解决方案：
- New API：添加环境变量 ALLOWED_ORIGIN="*"
- 检查API地址是否正确
- 检查网络连接是否正常
- 查看浏览器Console了解详细错误

详细错误: ${error.message}`);
            }

            throw error;
        }
    }

    // 渲染消息
    renderMessage(message) {
        const container = document.getElementById('messagesContainer');

        // 移除欢迎消息
        const welcome = container.querySelector('.welcome-message');
        if (welcome) {
            welcome.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;

        // 创建头像
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = message.role === 'user' ? '👤' : '🤖';

        // 创建气泡（只包含内容）
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.innerHTML = this.formatContent(message.content);

        // 创建时间戳
        const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const timeEl = document.createElement('div');
        timeEl.className = 'message-time';
        timeEl.textContent = time;

        // 组装
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(timeEl);

        container.appendChild(messageDiv);
    }

    // 渲染所有消息
    renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="welcome-message">
                    <h2>👋 欢迎使用AI聊天室</h2>
                    <p>这是一个轻量级的AI对话工具，支持各种OpenAI兼容的API</p>
                    <div class="quick-tips">
                        <h4>💡 快速开始：</h4>
                        <ul>
                            <li>点击右上角⚙️配置您的API信息</li>
                            <li>支持New API、OpenAI、DeepSeek等服务</li>
                            <li>只需填写base URL，系统会自动补全</li>
                            <li>对话历史自动保存到本地</li>
                            <li>支持多轮上下文对话</li>
                            <li>支持多会话管理，左侧查看历史对话</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            messages.forEach(msg => this.renderMessage(msg));
        }

        this.scrollToBottom();
    }

    // 格式化内容（支持换行）
    formatContent(content) {
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
    }

    // 显示打字动画
    showTypingIndicator() {
        const container = document.getElementById('messagesContainer');
        const indicator = document.createElement('div');
        indicator.className = 'message ai';
        indicator.id = 'typingIndicator';
        indicator.innerHTML = `
            <div class="message-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        container.appendChild(indicator);
        this.scrollToBottom();
    }

    // 移除打字动画
    removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 设置状态文本
    setStatus(text) {
        document.getElementById('inputStatus').textContent = text;
    }

    // 滚动到底部
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }
}

// 初始化
let chatRoom;

document.addEventListener('DOMContentLoaded', () => {
    chatRoom = new AIChatRoom();
    console.log('[AIChatRoom] 初始化完成 - 支持多会话管理');
});
