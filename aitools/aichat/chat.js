// AI聊天室 - 核心逻辑
class AIChatRoom {
    constructor() {
        this.messages = [];
        this.config = this.loadConfig();
        this.isProcessing = false;
        this.initUI();
        this.bindEvents();
        this.loadHistory();
    }

    // 加载配置
    loadConfig() {
        const saved = localStorage.getItem('aichat_config');
        const defaultConfig = {
            enabled: true,
            apiUrl: '',
            apiKey: '',
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

    // 加载历史对话
    loadHistory() {
        const saved = localStorage.getItem('aichat_history');
        if (saved) {
            this.messages = JSON.parse(saved);
            this.renderMessages();
        }
    }

    // 保存历史对话
    saveHistory() {
        // 只保存最近50条消息
        const toSave = this.messages.slice(-50);
        localStorage.setItem('aichat_history', JSON.stringify(toSave));
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
    }

    // 绑定事件
    bindEvents() {
        // 设置面板切换
        document.getElementById('toggleSettings').addEventListener('click', () => {
            document.getElementById('settingsPanel').classList.toggle('hidden');
        });

        // 清空对话
        document.getElementById('clearChat').addEventListener('click', () => {
            if (confirm('确定要清空所有对话记录吗？')) {
                this.clearChat();
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
            input.style.height = Math.min(input.scrollHeight, 150) + 'px';
        });
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

        // 添加用户消息
        this.addMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        // 显示输入状态
        this.setStatus('AI正在思考...');
        this.isProcessing = true;
        document.getElementById('sendButton').disabled = true;

        // 显示打字动画
        this.showTypingIndicator();

        try {
            // 获取上下文（最近10条消息）
            const context = this.messages.slice(-10);

            // 调用API
            const response = await this.callAPI(message, context);

            // 移除打字动画
            this.removeTypingIndicator();

            // 添加AI回复
            this.addMessage('ai', response);
            this.setStatus('');
        } catch (error) {
            this.removeTypingIndicator();
            this.setStatus('');

            const errorMsg = `抱歉，发生错误：\n${error.message}`;
            this.addMessage('ai', errorMsg);

            console.error('[AIChatRoom] 发送消息失败:', error);
        } finally {
            this.isProcessing = false;
            document.getElementById('sendButton').disabled = false;
            input.focus();
        }
    }

    // 调用API
    async callAPI(userMessage, context) {
        // URL处理：自动补全endpoint
        let apiUrl = this.config.apiUrl;

        if (!apiUrl) {
            throw new Error('请先配置API地址');
        }

        // 自动补全endpoint
        if (!apiUrl.includes('/chat/completions')) {
            const baseUrl = apiUrl.replace(/\/$/, '');
            if (baseUrl.endsWith('/v1')) {
                apiUrl = baseUrl + '/chat/completions';
            } else {
                apiUrl = baseUrl + '/v1/chat/completions';
            }
            console.log('[AIChatRoom] 自动补全URL:', this.config.apiUrl, '→', apiUrl);
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

        const requestBody = {
            model: this.config.model,
            messages: messages,
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens
        };

        console.log('[AIChatRoom] ========== API请求详情 ==========');
        console.log('[AIChatRoom] 请求URL:', apiUrl);
        console.log('[AIChatRoom] 请求模型:', requestBody.model);
        console.log('[AIChatRoom] 消息数量:', messages.length);
        console.log('[AIChatRoom] Temperature:', requestBody.temperature);
        console.log('[AIChatRoom] Max Tokens:', requestBody.max_tokens);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('[AIChatRoom] 响应状态:', response.status, response.statusText);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || errorData.message || response.statusText;
                console.error('[AIChatRoom] API返回错误:', errorData);
                throw new Error(`API错误 (${response.status}): ${errorMsg}`);
            }

            const data = await response.json();
            console.log('[AIChatRoom] 请求成功，返回内容长度:', data.choices?.[0]?.message?.content?.length || 0);

            return data.choices[0].message.content;

        } catch (error) {
            console.error('[AIChatRoom] ========== 请求失败详情 ==========');
            console.error('[AIChatRoom] 错误类型:', error.name);
            console.error('[AIChatRoom] 错误信息:', error.message);

            // 检测CORS错误
            if (error.message.includes('CORS') ||
                error.message.includes('Failed to fetch') ||
                error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(`网络请求失败（CORS跨域问题）

可能的原因：
1. API服务器未配置CORS允许跨域访问
2. 请求的URL：${apiUrl}

解决方案：
- New API：添加环境变量 ALLOWED_ORIGIN="*"
- 检查API地址是否正确
- 查看浏览器Console了解详细错误

详细错误: ${error.message}`);
            }

            throw error;
        }
    }

    // 添加消息
    addMessage(role, content) {
        const message = {
            role: role,
            content: content,
            timestamp: Date.now()
        };

        this.messages.push(message);
        this.saveHistory();
        this.renderMessage(message);
        this.scrollToBottom();
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

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        const time = new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        bubble.innerHTML = `
            <div class="message-header">${message.role === 'user' ? '👤 你' : '🤖 AI'}</div>
            <div class="message-content">${this.formatContent(message.content)}</div>
            <div class="message-time">${time}</div>
        `;

        messageDiv.appendChild(bubble);
        container.appendChild(messageDiv);
    }

    // 渲染所有消息
    renderMessages() {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="welcome-message">
                    <h2>👋 欢迎使用AI聊天室</h2>
                    <p>这是一个轻量级的AI对话工具，支持各种OpenAI兼容的API</p>
                    <div class="quick-tips">
                        <h4>💡 快速开始：</h4>
                        <ul>
                            <li>点击左上角⚙️配置您的API信息</li>
                            <li>支持New API、OpenAI、DeepSeek等服务</li>
                            <li>只需填写base URL，系统会自动补全</li>
                            <li>对话历史自动保存到本地</li>
                            <li>支持多轮上下文对话</li>
                        </ul>
                    </div>
                </div>
            `;
        } else {
            this.messages.forEach(msg => this.renderMessage(msg));
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

    // 清空对话
    clearChat() {
        this.messages = [];
        localStorage.removeItem('aichat_history');
        this.renderMessages();
    }
}

// 初始化
let chatRoom;

document.addEventListener('DOMContentLoaded', () => {
    chatRoom = new AIChatRoom();
    console.log('[AIChatRoom] 初始化完成');
});
