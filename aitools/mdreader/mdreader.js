/**
 * Markdown阅读器核心逻辑
 * 功能：文件上传、markdown解析渲染、TOC生成、主题适配
 */

class MarkdownReader {
    constructor() {
        // DOM元素引用
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.selectFileBtn = document.getElementById('select-file-btn');
        this.markdownContent = document.getElementById('markdown-content');
        this.tocNav = document.getElementById('toc-nav');
        this.tocSidebar = document.getElementById('toc-sidebar');
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');

        // 工具栏按钮
        this.toggleTocBtn = document.getElementById('toggle-toc-btn');
        this.copyAllBtn = document.getElementById('copy-all-btn');
        this.exportHtmlBtn = document.getElementById('export-html-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.closeFileBtn = document.getElementById('close-file-btn');
        this.tocCloseBtn = document.getElementById('toc-close-btn');

        // 状态
        this.currentFile = null;
        this.currentMarkdown = '';
        this.tocVisible = true;

        // 初始化
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.setupMarked();
        this.setupEventListeners();
        this.setupTheme();
        this.loadFromStorage();
    }

    /**
     * 配置marked.js
     */
    setupMarked() {
        marked.setOptions({
            gfm: true,
            breaks: true,
            pedantic: false,
            sanitize: false,
            smartLists: true,
            smartypants: true,
            highlight: (code, lang) => {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('代码高亮失败:', err);
                    }
                }
                return hljs.highlightAuto(code).value;
            }
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 文件上传相关
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // 拖拽上传
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // 工具栏按钮
        this.toggleTocBtn.addEventListener('click', () => this.toggleToc());
        this.tocCloseBtn.addEventListener('click', () => this.toggleToc());
        this.copyAllBtn.addEventListener('click', () => this.copyAllContent());
        this.exportHtmlBtn.addEventListener('click', () => this.exportHtml());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.closeFileBtn.addEventListener('click', () => this.closeFile());

        // 滚动同步TOC高亮
        this.markdownContent.addEventListener('scroll', () => this.updateTocHighlight());
    }

    /**
     * 设置主题
     */
    setupTheme() {
        // 监听主题变化
        const observer = new MutationObserver(() => {
            this.updateCodeTheme();
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        this.updateCodeTheme();
    }

    /**
     * 更新代码高亮主题
     */
    updateCodeTheme() {
        const isDark = document.documentElement.classList.contains('dark-theme');
        const highlightTheme = document.getElementById('highlight-theme');

        if (isDark) {
            highlightTheme.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css';
        } else {
            highlightTheme.href = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css';
        }
    }

    /**
     * 处理拖拽悬停
     */
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadBox = this.uploadArea.querySelector('.upload-box');
        uploadBox.classList.add('dragover');
    }

    /**
     * 处理拖拽离开
     */
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        const uploadBox = this.uploadArea.querySelector('.upload-box');
        uploadBox.classList.remove('dragover');
    }

    /**
     * 处理文件拖放
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        const uploadBox = this.uploadArea.querySelector('.upload-box');
        uploadBox.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.loadFile(files[0]);
        }
    }

    /**
     * 处理文件选择
     */
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.loadFile(files[0]);
        }
    }

    /**
     * 加载文件
     */
    loadFile(file) {
        // 验证文件类型
        if (!file.name.match(/\.(md|markdown)$/i)) {
            alert('请选择.md或.markdown文件');
            return;
        }

        // 验证文件大小（最大10MB）
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('文件太大，请选择小于10MB的文件');
            return;
        }

        this.currentFile = file;

        // 读取文件
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentMarkdown = e.target.result;
            this.renderMarkdown(this.currentMarkdown);
            this.saveToStorage();
        };
        reader.onerror = () => {
            alert('文件读取失败');
        };
        reader.readAsText(file);
    }

    /**
     * 渲染Markdown
     */
    renderMarkdown(markdown) {
        try {
            // 使用marked解析
            let html = marked.parse(markdown);

            // 使用DOMPurify清理HTML防止XSS
            if (window.DOMPurify) {
                html = DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
                                   'blockquote', 'code', 'pre', 'strong', 'em', 'del', 'table',
                                   'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr', 'br', 'span', 'div'],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id']
                });
            }

            // 渲染HTML
            this.markdownContent.innerHTML = html;

            // 为代码块添加复制按钮
            this.addCopyButtons();

            // 生成TOC
            this.generateToc();

            // 显示内容，隐藏上传区
            this.uploadArea.style.display = 'none';
            this.markdownContent.style.display = 'block';
            this.fileInfo.style.display = 'flex';
            this.fileName.textContent = this.currentFile ? this.currentFile.name : '未命名文档';

            // 滚动到顶部
            this.markdownContent.scrollTop = 0;

        } catch (error) {
            console.error('Markdown渲染失败:', error);
            alert('Markdown渲染失败，请检查文件格式');
        }
    }

    /**
     * 为代码块添加复制按钮
     */
    addCopyButtons() {
        const codeBlocks = this.markdownContent.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock) => {
            const pre = codeBlock.parentElement;
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(pre);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.textContent = '复制';
            copyBtn.addEventListener('click', () => {
                this.copyCodeBlock(codeBlock, copyBtn);
            });

            wrapper.appendChild(copyBtn);
        });
    }

    /**
     * 复制代码块
     */
    copyCodeBlock(codeBlock, button) {
        const code = codeBlock.textContent;
        navigator.clipboard.writeText(code).then(() => {
            const originalText = button.textContent;
            button.textContent = '已复制';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(() => {
            alert('复制失败');
        });
    }

    /**
     * 生成目录
     */
    generateToc() {
        const headings = this.markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');

        if (headings.length === 0) {
            this.tocNav.innerHTML = '<p class="toc-empty">暂无目录</p>';
            return;
        }

        // 为标题添加ID
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }
        });

        // 构建TOC树
        const tocTree = this.buildTocTree(headings);
        this.tocNav.innerHTML = tocTree;

        // 添加点击事件
        const tocLinks = this.tocNav.querySelectorAll('a');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    this.markdownContent.scrollTo({
                        top: targetElement.offsetTop - 20,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /**
     * 构建TOC树
     */
    buildTocTree(headings) {
        let html = '<ul>';
        let currentLevel = 0;

        headings.forEach((heading) => {
            const level = parseInt(heading.tagName.substring(1));
            const text = heading.textContent;
            const id = heading.id;

            if (level > currentLevel) {
                html += '<ul>'.repeat(level - currentLevel);
            } else if (level < currentLevel) {
                html += '</ul>'.repeat(currentLevel - level);
            }

            html += `<li><a href="#${id}">${text}</a></li>`;
            currentLevel = level;
        });

        html += '</ul>'.repeat(currentLevel);
        return html;
    }

    /**
     * 更新TOC高亮
     */
    updateTocHighlight() {
        const headings = this.markdownContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const scrollTop = this.markdownContent.scrollTop;

        let activeHeading = null;
        headings.forEach((heading) => {
            if (heading.offsetTop <= scrollTop + 100) {
                activeHeading = heading;
            }
        });

        // 移除所有active类
        const tocLinks = this.tocNav.querySelectorAll('a');
        tocLinks.forEach(link => link.classList.remove('active'));

        // 添加active类到当前标题
        if (activeHeading) {
            const activeLink = this.tocNav.querySelector(`a[href="#${activeHeading.id}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    /**
     * 切换TOC显示
     */
    toggleToc() {
        this.tocVisible = !this.tocVisible;
        if (this.tocVisible) {
            this.tocSidebar.classList.remove('hidden');
        } else {
            this.tocSidebar.classList.add('hidden');
        }
    }

    /**
     * 复制全部内容
     */
    copyAllContent() {
        if (!this.currentMarkdown) {
            alert('没有内容可复制');
            return;
        }

        navigator.clipboard.writeText(this.currentMarkdown).then(() => {
            alert('内容已复制到剪贴板');
        }).catch(() => {
            alert('复制失败');
        });
    }

    /**
     * 导出HTML
     */
    exportHtml() {
        if (!this.currentMarkdown) {
            alert('没有内容可导出');
            return;
        }

        const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.currentFile ? this.currentFile.name : '文档'}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css">
    <style>
        body { max-width: 900px; margin: 2rem auto; padding: 0 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
        pre { background: #f6f8fa; padding: 1rem; border-radius: 6px; overflow-x: auto; }
        code { font-family: Consolas, Monaco, monospace; }
    </style>
</head>
<body>
${this.markdownContent.innerHTML}
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.currentFile ? this.currentFile.name.replace(/\.(md|markdown)$/i, '') : 'document') + '.html';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * 切换全屏
     */
    toggleFullscreen() {
        const container = document.querySelector('.container');
        container.classList.toggle('fullscreen');
    }

    /**
     * 关闭文件
     */
    closeFile() {
        this.currentFile = null;
        this.currentMarkdown = '';
        this.uploadArea.style.display = 'flex';
        this.markdownContent.style.display = 'none';
        this.fileInfo.style.display = 'none';
        this.markdownContent.innerHTML = '';
        this.tocNav.innerHTML = '<p class="toc-empty">暂无目录</p>';
        this.fileInput.value = '';
        this.clearStorage();
    }

    /**
     * 保存到LocalStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('mdreader_current', JSON.stringify({
                fileName: this.currentFile ? this.currentFile.name : '',
                markdown: this.currentMarkdown,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('保存到LocalStorage失败:', error);
        }
    }

    /**
     * 从LocalStorage加载
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('mdreader_current');
            if (saved) {
                const data = JSON.parse(saved);
                // 只在1小时内有效
                if (Date.now() - data.timestamp < 3600000) {
                    this.currentMarkdown = data.markdown;
                    this.currentFile = { name: data.fileName };
                    this.renderMarkdown(this.currentMarkdown);
                }
            }
        } catch (error) {
            console.error('从LocalStorage加载失败:', error);
        }
    }

    /**
     * 清除LocalStorage
     */
    clearStorage() {
        try {
            localStorage.removeItem('mdreader_current');
        } catch (error) {
            console.error('清除LocalStorage失败:', error);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const reader = new MarkdownReader();
    const projectManager = new ProjectManager(reader);
    console.log('Markdown阅读器已初始化');
});

/**
 * 项目管理器
 * 负责加载和管理文档项目
 */
class ProjectManager {
    constructor(reader) {
        this.reader = reader;
        this.projects = [];
        this.currentProject = null;
        this.currentProjectConfig = null;

        // DOM元素
        this.openProjectBtn = document.getElementById('open-project-btn');
        this.projectListModal = document.getElementById('project-list-modal');
        this.projectList = document.getElementById('project-list');
        this.passwordModal = document.getElementById('password-modal');
        this.passwordInput = document.getElementById('project-password-input');
        this.passwordSubmitBtn = document.getElementById('password-submit-btn');
        this.passwordCancelBtn = document.getElementById('password-cancel-btn');
        this.passwordError = document.getElementById('password-error');
        this.passwordProjectName = document.getElementById('password-project-name');

        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.setupEventListeners();
        this.loadProjects();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 打开项目按钮
        this.openProjectBtn.addEventListener('click', () => this.showProjectList());

        // 密码提交
        this.passwordSubmitBtn.addEventListener('click', () => this.verifyPassword());
        this.passwordCancelBtn.addEventListener('click', () => this.hidePasswordModal());

        // 回车提交密码
        this.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.verifyPassword();
            }
        });

        // 点击模态框外部关闭
        this.projectListModal.addEventListener('click', (e) => {
            if (e.target === this.projectListModal) {
                this.hideProjectList();
            }
        });

        this.passwordModal.addEventListener('click', (e) => {
            if (e.target === this.passwordModal) {
                this.hidePasswordModal();
            }
        });
    }

    /**
     * 加载项目列表
     */
    async loadProjects() {
        try {
            // 扫描project目录下的项目
            // 由于浏览器无法直接扫描目录，我们这里硬编码已知项目
            // 未来可以通过一个projects.json配置文件来管理
            this.projects = [
                { id: 'myctue', name: 'Myctue游戏设计文档', path: 'project/myctue' }
            ];
            console.log('项目列表加载成功:', this.projects);
        } catch (error) {
            console.error('加载项目列表失败:', error);
        }
    }

    /**
     * 显示项目列表
     */
    showProjectList() {
        // 生成项目卡片
        this.projectList.innerHTML = '';
        this.projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.innerHTML = `
                <h3>${project.name}</h3>
                <p>点击打开项目</p>
            `;
            card.addEventListener('click', () => this.selectProject(project));
            this.projectList.appendChild(card);
        });

        this.projectListModal.style.display = 'block';
    }

    /**
     * 隐藏项目列表
     */
    hideProjectList() {
        this.projectListModal.style.display = 'none';
    }

    /**
     * 选择项目
     */
    async selectProject(project) {
        this.hideProjectList();
        this.currentProject = project;

        // 检查是否已经验证过密码（SessionStorage）
        const verified = sessionStorage.getItem(`project_${project.id}_verified`);
        if (verified === 'true') {
            // 已验证，直接加载项目
            await this.loadProjectConfig(project);
            this.showProjectDocuments();
        } else {
            // 需要验证密码
            this.showPasswordModal(project);
        }
    }

    /**
     * 显示密码输入模态框
     */
    showPasswordModal(project) {
        this.passwordProjectName.textContent = `正在打开项目: ${project.name}`;
        this.passwordInput.value = '';
        this.passwordError.style.display = 'none';
        this.passwordModal.style.display = 'block';
        this.passwordInput.focus();
    }

    /**
     * 隐藏密码模态框
     */
    hidePasswordModal() {
        this.passwordModal.style.display = 'none';
        this.currentProject = null;
    }

    /**
     * 验证密码
     */
    async verifyPassword() {
        const password = this.passwordInput.value.trim();
        if (!password) {
            this.showPasswordError('请输入密码');
            return;
        }

        // 加载项目配置
        try {
            await this.loadProjectConfig(this.currentProject);

            // 验证密码
            if (password === this.currentProjectConfig.password) {
                // 密码正确
                sessionStorage.setItem(`project_${this.currentProject.id}_verified`, 'true');
                this.hidePasswordModal();
                this.showProjectDocuments();
            } else {
                // 密码错误
                this.showPasswordError('密码错误，请重试');
                this.passwordInput.value = '';
                this.passwordInput.focus();
            }
        } catch (error) {
            console.error('验证密码失败:', error);
            let errorMsg = '加载项目配置失败';
            if (error.message.includes('404')) {
                errorMsg = '配置文件不存在，请检查项目路径';
            } else if (error.message.includes('Failed to fetch')) {
                errorMsg = '无法连接到服务器，请确保HTTP服务器正在运行';
            } else if (error.name === 'SyntaxError') {
                errorMsg = '配置文件格式错误';
            }
            this.showPasswordError(errorMsg + '，详情请查看控制台');
        }
    }

    /**
     * 显示密码错误
     */
    showPasswordError(message) {
        this.passwordError.textContent = message;
        this.passwordError.style.display = 'block';
    }

    /**
     * 加载项目配置
     */
    async loadProjectConfig(project) {
        try {
            const configUrl = `${project.path}/config.json`;
            console.log('尝试加载配置文件:', configUrl);
            console.log('完整URL:', new URL(configUrl, window.location.href).href);

            const response = await fetch(configUrl);
            console.log('响应状态:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }

            const configText = await response.text();
            console.log('配置文件内容长度:', configText.length);

            this.currentProjectConfig = JSON.parse(configText);
            console.log('项目配置加载成功:', this.currentProjectConfig);
        } catch (error) {
            console.error('加载项目配置失败，详细错误:', error);
            console.error('错误类型:', error.name);
            console.error('错误信息:', error.message);
            throw error;
        }
    }

    /**
     * 显示项目文档列表
     */
    showProjectDocuments() {
        // 隐藏上传区
        this.reader.uploadArea.style.display = 'none';

        // 更新TOC为项目文档列表
        const tocNav = this.reader.tocNav;
        tocNav.innerHTML = '';

        // 添加项目头部
        const header = document.createElement('div');
        header.className = 'project-docs-header';
        header.innerHTML = `
            <h3>${this.currentProjectConfig.name}</h3>
            <button class="close-project-btn" id="close-project-btn">关闭项目</button>
        `;
        tocNav.appendChild(header);

        // 按类别组织文档
        const categories = {};
        this.currentProjectConfig.documents.forEach(doc => {
            const category = doc.category || '其他';
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(doc);
        });

        // 渲染文档列表
        Object.keys(categories).forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'doc-list-category';

            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'doc-list-category-title';
            categoryTitle.textContent = category;
            categoryDiv.appendChild(categoryTitle);

            categories[category].forEach(doc => {
                const docLink = document.createElement('a');
                docLink.href = '#';
                docLink.className = 'doc-list-item';
                docLink.textContent = doc.title;
                docLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.loadDocument(doc);
                });
                categoryDiv.appendChild(docLink);
            });

            tocNav.appendChild(categoryDiv);
        });

        // 关闭项目按钮事件
        document.getElementById('close-project-btn').addEventListener('click', () => {
            this.closeProject();
        });

        // 显示内容区
        this.reader.markdownContent.style.display = 'block';
        this.reader.markdownContent.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">请从左侧目录选择要查看的文档</div>';
    }

    /**
     * 加载文档
     */
    async loadDocument(doc) {
        try {
            const docPath = `${this.currentProject.path}/${doc.path}`;
            const response = await fetch(docPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const markdown = await response.text();

            // 使用reader的渲染方法
            this.reader.currentMarkdown = markdown;
            this.reader.currentFile = { name: doc.title };

            // 渲染markdown
            let html = marked.parse(markdown);
            if (window.DOMPurify) {
                html = DOMPurify.sanitize(html, {
                    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
                                   'blockquote', 'code', 'pre', 'strong', 'em', 'del', 'table',
                                   'thead', 'tbody', 'tr', 'th', 'td', 'img', 'hr', 'br', 'span', 'div'],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id']
                });
            }

            this.reader.markdownContent.innerHTML = html;
            this.reader.addCopyButtons();

            // 高亮当前文档
            const allDocLinks = this.reader.tocNav.querySelectorAll('.doc-list-item');
            allDocLinks.forEach(link => link.classList.remove('active'));
            event.target.classList.add('active');

            // 显示文件信息
            this.reader.fileInfo.style.display = 'flex';
            this.reader.fileName.textContent = doc.title;

            // 滚动到顶部
            this.reader.markdownContent.scrollTop = 0;

            console.log('文档加载成功:', doc.title);
        } catch (error) {
            console.error('加载文档失败:', error);
            alert(`加载文档失败: ${doc.title}`);
        }
    }

    /**
     * 关闭项目
     */
    closeProject() {
        this.currentProject = null;
        this.currentProjectConfig = null;

        // 恢复上传区
        this.reader.uploadArea.style.display = 'flex';
        this.reader.markdownContent.style.display = 'none';
        this.reader.fileInfo.style.display = 'none';
        this.reader.markdownContent.innerHTML = '';

        // 恢复TOC
        this.reader.tocNav.innerHTML = '<p class="toc-empty">暂无目录</p>';

        console.log('项目已关闭');
    }
}
