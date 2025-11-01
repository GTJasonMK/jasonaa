/**
 * Markdown阅读器核心逻辑
 * 功能：文件上传、markdown解析渲染、TOC生成、主题适配
 */

class MarkdownReader {
    constructor() {
        // DOM元素引用
        this.uploadArea = document.getElementById('upload-area');
        this.fileInput = document.getElementById('file-input');
        this.directoryInput = document.getElementById('directory-input');
        this.selectFileBtn = document.getElementById('select-file-btn');
        this.markdownContent = document.getElementById('markdown-content');
        this.tocNav = document.getElementById('toc-nav');
        this.tocSidebar = document.getElementById('toc-sidebar');
        this.tocOverlay = document.getElementById('toc-overlay');
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');

        // 工具栏按钮
        this.toggleTocBtn = document.getElementById('toggle-toc-btn');
        this.copyAllBtn = document.getElementById('copy-all-btn');
        this.exportHtmlBtn = document.getElementById('export-html-btn');
        this.closeFileBtn = document.getElementById('close-file-btn');
        this.tocCloseBtn = document.getElementById('toc-close-btn');
        this.openProjectBtn = document.getElementById('open-project-btn');
        this.fontSizeIncreaseBtn = document.getElementById('font-size-increase-btn');
        this.fontSizeDecreaseBtn = document.getElementById('font-size-decrease-btn');

        // 阅读进度条
        this.progressBar = document.getElementById('reading-progress-bar');
        this.progressThumb = document.getElementById('progress-thumb');
        this.progressPercentage = document.getElementById('progress-percentage');
        this.progressTrack = this.progressBar?.querySelector('.progress-track');

        // 状态
        this.currentFile = null;
        this.currentMarkdown = '';
        this.tocVisible = true;
        this.isDraggingProgress = false;
        this.fontSize = 16; // 默认字体大小

        // 设备类型检测（基于触摸能力而非窗口宽度）
        this.isTouchDevice = this.detectTouchDevice();

        // 初始化
        this.init();
    }

    /**
     * 检测是否为触摸设备
     */
    detectTouchDevice() {
        // 综合判断：触摸点数量 + 触摸事件支持 + 窗口宽度
        const hasTouchPoints = navigator.maxTouchPoints > 0;
        const hasTouchEvent = 'ontouchstart' in window;
        const isNarrowScreen = window.innerWidth <= 768;

        // 有触摸点或触摸事件支持，且屏幕较窄，判定为触摸设备
        const isTouchDevice = (hasTouchPoints || hasTouchEvent) && isNarrowScreen;

        console.log('[设备检测]', {
            maxTouchPoints: navigator.maxTouchPoints,
            hasTouchEvent,
            windowWidth: window.innerWidth,
            判定结果: isTouchDevice ? '触摸设备（移动端）' : '鼠标设备（桌面端）'
        });

        return isTouchDevice;
    }

    /**
     * 动态检测实际滚动容器
     * 解决CSS @media和JS设备判断不一致的问题
     */
    getScrollContainer() {
        // 检查 markdownContent 是否可以滚动
        if (this.markdownContent) {
            const canScroll = this.markdownContent.scrollHeight > this.markdownContent.clientHeight;
            const hasOverflow = window.getComputedStyle(this.markdownContent).overflowY !== 'visible';

            if (canScroll && hasOverflow) {
                return 'element'; // 使用元素滚动
            }
        }
        return 'window'; // 使用window滚动
    }

    /**
     * 初始化
     */
    init() {
        this.setupMarked();
        this.setupEventListeners();
        this.setupTheme();
        this.loadFontSizeFromStorage();
        this.loadFromStorage();

        // 触摸设备默认隐藏TOC和overlay，避免灰屏
        if (this.isTouchDevice) {
            this.tocVisible = false;
            this.tocSidebar.classList.add('hidden');
            if (this.tocOverlay) {
                this.tocOverlay.classList.remove('active');
            }
        }
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
        console.log('开始设置事件监听器...');

        // 文件上传相关
        if (this.selectFileBtn && this.fileInput) {
            this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            console.log('文件上传事件已绑定');
        } else {
            console.warn('文件上传按钮或输入框不存在');
        }

        // 拖拽上传
        if (this.uploadArea) {
            this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
            console.log('拖拽上传事件已绑定');
        } else {
            console.warn('上传区域不存在');
        }

        // 工具栏按钮
        if (this.toggleTocBtn) {
            this.toggleTocBtn.addEventListener('click', () => this.toggleToc());
            console.log('TOC切换按钮已绑定');
        }

        if (this.tocCloseBtn) {
            this.tocCloseBtn.addEventListener('click', () => this.toggleToc());
            console.log('TOC关闭按钮已绑定');
        }

        // TOC遮罩层点击关闭（如果存在）
        if (this.tocOverlay) {
            this.tocOverlay.addEventListener('click', () => this.toggleToc());
            console.log('TOC遮罩层已绑定');
        }

        if (this.copyAllBtn) {
            this.copyAllBtn.addEventListener('click', () => this.copyAllContent());
            console.log('复制按钮已绑定');
        }

        if (this.exportHtmlBtn) {
            this.exportHtmlBtn.addEventListener('click', () => this.exportHtml());
            console.log('导出按钮已绑定');
        }

        if (this.closeFileBtn) {
            this.closeFileBtn.addEventListener('click', () => this.closeFile());
            console.log('关闭文件按钮已绑定');
        }

        // 字体大小调整按钮
        if (this.fontSizeIncreaseBtn) {
            this.fontSizeIncreaseBtn.addEventListener('click', () => this.increaseFontSize());
            console.log('增大字体按钮已绑定');
        }

        if (this.fontSizeDecreaseBtn) {
            this.fontSizeDecreaseBtn.addEventListener('click', () => this.decreaseFontSize());
            console.log('减小字体按钮已绑定');
        }

        // 打开项目按钮触发目录选择，由ProjectManager处理

        // 滚动同步TOC高亮和进度条
        // 同时监听window和markdownContent的滚动，函数内部根据设备类型判断
        const scrollHandler = () => {
            this.updateTocHighlight();
            this.updateProgressBar();
        };

        window.addEventListener('scroll', scrollHandler);
        if (this.markdownContent) {
            this.markdownContent.addEventListener('scroll', scrollHandler);
        }
        console.log('滚动事件已绑定(window + markdownContent)');

        // 进度条拖动事件
        this.setupProgressBarDrag();

        console.log('事件监听器设置完成');
    }

    /**
     * 设置进度条拖动功能
     */
    setupProgressBarDrag() {
        console.log('[进度条] ========== 开始初始化 ==========');
        console.log('[进度条] progressBar:', this.progressBar);
        console.log('[进度条] progressThumb:', this.progressThumb);
        console.log('[进度条] progressTrack:', this.progressTrack);

        if (!this.progressThumb || !this.progressTrack) {
            console.error('[进度条] ❌ 进度条元素不存在！无法初始化');
            return;
        }

        console.log('[进度条] ✅ 元素存在，继续初始化');

        // 强制显示进度条并添加明显的视觉标记
        if (this.progressBar) {
            this.progressBar.style.display = 'block';
            this.progressBar.style.backgroundColor = 'rgba(255, 0, 0, 0.3)'; // 红色半透明背景用于调试
            this.progressBar.style.border = '3px solid red'; // 红色边框
            console.log('[进度条] 已添加红色边框用于视觉定位');
        }

        // 让小球变成明显的绿色
        this.progressThumb.style.backgroundColor = '#00ff00';
        this.progressThumb.style.width = '50px';
        this.progressThumb.style.height = '50px';
        console.log('[进度条] 小球已改为绿色50px');

        // 输出元素位置信息进行诊断
        setTimeout(() => {
            const thumbRect = this.progressThumb.getBoundingClientRect();
            const trackRect = this.progressTrack.getBoundingClientRect();
            const barRect = this.progressBar.getBoundingClientRect();

            console.log('[进度条] ========== 元素诊断信息 ==========');
            console.log('[进度条] 进度条容器:', {
                left: Math.round(barRect.left),
                top: Math.round(barRect.top),
                width: Math.round(barRect.width),
                height: Math.round(barRect.height),
                right: Math.round(barRect.right),
                bottom: Math.round(barRect.bottom),
                zIndex: window.getComputedStyle(this.progressBar).zIndex,
                display: window.getComputedStyle(this.progressBar).display,
                position: window.getComputedStyle(this.progressBar).position,
                visibility: window.getComputedStyle(this.progressBar).visibility,
                opacity: window.getComputedStyle(this.progressBar).opacity
            });
            console.log('[进度条] 轨道:', {
                left: Math.round(trackRect.left),
                top: Math.round(trackRect.top),
                width: Math.round(trackRect.width),
                height: Math.round(trackRect.height)
            });
            console.log('[进度条] 小球:', {
                left: Math.round(thumbRect.left),
                top: Math.round(thumbRect.top),
                width: Math.round(thumbRect.width),
                height: Math.round(thumbRect.height)
            });
            console.log('[进度条] 屏幕尺寸:', {
                width: window.innerWidth,
                height: window.innerHeight
            });

            // 检查是否在屏幕内
            const isVisible = barRect.right > 0 && barRect.left < window.innerWidth &&
                            barRect.bottom > 0 && barRect.top < window.innerHeight;
            console.log('[进度条] 元素在屏幕内?', isVisible);
        }, 500);

        // 添加触摸测试 - 看能否触发基本触摸事件
        console.log('[进度条] 正在绑定测试监听器...');

        this.progressTrack.addEventListener('touchstart', (e) => {
            console.log('[进度条-测试] 🎉🎉🎉 轨道touchstart成功! touches:', e.touches.length);
        }, { passive: true });

        this.progressThumb.addEventListener('touchstart', (e) => {
            console.log('[进度条-测试] 🎉🎉🎉 小球touchstart成功! touches:', e.touches.length);
        }, { passive: true });

        console.log('[进度条] 测试监听器已绑定');

        // 点击轨道跳转
        this.progressTrack.addEventListener('click', (e) => {
            if (e.target === this.progressThumb) return;
            const rect = this.progressTrack.getBoundingClientRect();
            const clickY = e.clientY - rect.top;
            const percentage = clickY / rect.height;
            console.log('[进度条] 点击轨道跳转:', Math.round(percentage * 100) + '%');
            this.scrollToPercentage(percentage);
        });

        // 触摸轨道跳转（移动端）
        this.progressTrack.addEventListener('touchend', (e) => {
            if (this.isDraggingProgress) return; // 如果是拖动则忽略
            if (e.target === this.progressThumb) return;
            const rect = this.progressTrack.getBoundingClientRect();
            const touch = e.changedTouches[0];
            const touchY = touch.clientY - rect.top;
            const percentage = touchY / rect.height;
            console.log('[进度条] 触摸轨道跳转:', Math.round(percentage * 100) + '%');
            this.scrollToPercentage(percentage);
        });

        // 拖动滑块
        this.progressThumb.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.isDraggingProgress = true;
            document.body.style.userSelect = 'none';

            const handleMouseMove = (e) => {
                if (!this.isDraggingProgress) return;
                const rect = this.progressTrack.getBoundingClientRect();
                const mouseY = e.clientY - rect.top;
                const percentage = Math.max(0, Math.min(1, mouseY / rect.height));

                // 直接更新滑块视觉位置
                const trackHeight = this.progressTrack.offsetHeight;
                const thumbY = percentage * (trackHeight - 24);
                this.progressThumb.style.top = `${thumbY}px`;
                this.progressPercentage.textContent = `${Math.round(percentage * 100)}%`;

                // 滚动内容
                this.scrollToPercentage(percentage);
            };

            const handleMouseUp = () => {
                this.isDraggingProgress = false;
                document.body.style.userSelect = '';
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        // 触摸支持
        this.progressThumb.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDraggingProgress = true;
            console.log('[进度条] ====== 触摸开始拖动 ======');
            console.log('[进度条] 触摸点数:', e.touches.length);

            const handleTouchMove = (e) => {
                if (!this.isDraggingProgress) return;
                e.preventDefault(); // 阻止滚动
                const rect = this.progressTrack.getBoundingClientRect();
                const touch = e.touches[0];
                const touchY = touch.clientY - rect.top;
                const percentage = Math.max(0, Math.min(1, touchY / rect.height));

                console.log('[进度条] 触摸移动:', {
                    touchY,
                    trackHeight: rect.height,
                    percentage: Math.round(percentage * 100) + '%'
                });

                // 直接更新滑块视觉位置
                const trackHeight = this.progressTrack.offsetHeight;
                const thumbY = percentage * (trackHeight - 40);
                this.progressThumb.style.top = `${thumbY}px`;
                if (this.progressPercentage) {
                    this.progressPercentage.textContent = `${Math.round(percentage * 100)}%`;
                }

                // 滚动内容
                console.log('[进度条] 准备跳转到:', Math.round(percentage * 100) + '%');
                this.scrollToPercentage(percentage);
            };

            const handleTouchEnd = () => {
                this.isDraggingProgress = false;
                console.log('[进度条] ====== 触摸拖动结束 ======');
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            };

            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
        }, { passive: false });
    }

    /**
     * 更新进度条位置
     */
    updateProgressBar() {
        if (!this.progressBar || !this.progressThumb || !this.progressPercentage) return;
        if (this.isDraggingProgress) return;

        // 动态检测实际滚动容器
        const scrollContainer = this.getScrollContainer();
        let scrollTop, scrollHeight;

        if (scrollContainer === 'window') {
            scrollTop = window.scrollY || window.pageYOffset;
            scrollHeight = document.body.scrollHeight - window.innerHeight;
        } else {
            scrollTop = this.markdownContent.scrollTop;
            scrollHeight = this.markdownContent.scrollHeight - this.markdownContent.clientHeight;
        }

        const percentage = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

        const trackHeight = this.progressTrack.offsetHeight;
        const thumbY = percentage * (trackHeight - (this.isTouchDevice ? 40 : 24));

        this.progressThumb.style.top = `${thumbY}px`;
        this.progressPercentage.textContent = `${Math.round(percentage * 100)}%`;

        // 调试日志（仅当滚动位置>0时输出，避免刷屏）
        if (scrollTop > 10) {
            console.log(`[进度条] 滚动更新 (${scrollContainer}):`, {
                scrollTop: Math.round(scrollTop),
                scrollHeight,
                percentage: Math.round(percentage * 100) + '%',
                设备: this.isTouchDevice ? '触摸设备' : '桌面端'
            });
        }
    }

    /**
     * 滚动到指定百分比位置
     */
    scrollToPercentage(percentage) {
        const scrollContainer = this.getScrollContainer();
        console.log('[进度条] >>>>>> 开始跳转 <<<<<<');
        console.log('[进度条] 跳转到', Math.round(percentage * 100) + '%', `(${scrollContainer}容器)`);

        if (scrollContainer === 'window') {
            const scrollHeight = document.body.scrollHeight - window.innerHeight;
            const targetScroll = percentage * scrollHeight;
            const beforeScroll = window.scrollY || window.pageYOffset;

            console.log('[进度条] Window跳转详情:', {
                当前位置: beforeScroll,
                目标位置: Math.round(targetScroll),
                总滚动高度: scrollHeight,
                body高度: document.body.scrollHeight,
                窗口高度: window.innerHeight
            });

            window.scrollTo({
                top: targetScroll,
                behavior: 'smooth'
            });

            // 检查跳转是否生效
            setTimeout(() => {
                const afterScroll = window.scrollY || window.pageYOffset;
                console.log('[进度条] 跳转结果:', {
                    跳转前: beforeScroll,
                    跳转后: afterScroll,
                    变化: afterScroll - beforeScroll,
                    成功: Math.abs(afterScroll - targetScroll) < 10
                });
            }, 100);
        } else {
            const scrollHeight = this.markdownContent.scrollHeight - this.markdownContent.clientHeight;
            const targetScroll = percentage * scrollHeight;
            const beforeScroll = this.markdownContent.scrollTop;

            console.log('[进度条] Element跳转详情:', {
                当前位置: beforeScroll,
                目标位置: Math.round(targetScroll),
                总滚动高度: scrollHeight
            });

            this.markdownContent.scrollTop = targetScroll;

            setTimeout(() => {
                const afterScroll = this.markdownContent.scrollTop;
                console.log('[进度条] 跳转结果:', {
                    跳转前: beforeScroll,
                    跳转后: afterScroll,
                    变化: afterScroll - beforeScroll,
                    成功: Math.abs(afterScroll - targetScroll) < 10
                });
            }, 100);
        }
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

            // 显示阅读进度条
            if (this.progressBar) {
                this.progressBar.style.display = 'block';
                setTimeout(() => {
                    this.updateProgressBar();
                    // 输出滚动容器检测结果
                    const container = this.getScrollContainer();
                    console.log('[滚动容器检测]', {
                        使用容器: container,
                        设备类型: this.isTouchDevice ? '触摸设备' : '桌面端',
                        markdownContent滚动高度: this.markdownContent.scrollHeight,
                        markdownContent客户端高度: this.markdownContent.clientHeight,
                        overflowY: window.getComputedStyle(this.markdownContent).overflowY
                    });
                }, 100);
            }

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

        // 动态检测实际滚动容器
        const scrollContainer = this.getScrollContainer();
        let scrollTop;

        if (scrollContainer === 'window') {
            scrollTop = window.scrollY || window.pageYOffset;
        } else {
            scrollTop = this.markdownContent.scrollTop;
        }

        let activeHeading = null;
        headings.forEach((heading) => {
            const headingTop = scrollContainer === 'window'
                ? heading.getBoundingClientRect().top + scrollTop
                : heading.offsetTop;

            if (headingTop <= scrollTop + 100) {
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
            if (this.tocOverlay) {
                this.tocOverlay.classList.add('active');
            }
        } else {
            this.tocSidebar.classList.add('hidden');
            if (this.tocOverlay) {
                this.tocOverlay.classList.remove('active');
            }
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

        // 隐藏阅读进度条
        if (this.progressBar) {
            this.progressBar.style.display = 'none';
        }

        this.clearStorage();
    }

    /**
     * 增大字体
     */
    increaseFontSize() {
        if (this.fontSize < 24) {
            this.fontSize += 2;
            this.applyFontSize();
            this.saveFontSizeToStorage();
        }
    }

    /**
     * 减小字体
     */
    decreaseFontSize() {
        if (this.fontSize > 12) {
            this.fontSize -= 2;
            this.applyFontSize();
            this.saveFontSizeToStorage();
        }
    }

    /**
     * 应用字体大小
     */
    applyFontSize() {
        if (this.markdownContent) {
            this.markdownContent.style.fontSize = `${this.fontSize}px`;
        }
    }

    /**
     * 保存字体大小到LocalStorage
     */
    saveFontSizeToStorage() {
        try {
            localStorage.setItem('mdreader_font_size', this.fontSize.toString());
        } catch (error) {
            console.error('保存字体大小失败:', error);
        }
    }

    /**
     * 从LocalStorage加载字体大小
     */
    loadFontSizeFromStorage() {
        try {
            const saved = localStorage.getItem('mdreader_font_size');
            if (saved) {
                this.fontSize = parseInt(saved, 10);
                if (isNaN(this.fontSize) || this.fontSize < 12 || this.fontSize > 24) {
                    this.fontSize = 16; // 恢复默认值
                }
                this.applyFontSize();
            }
        } catch (error) {
            console.error('加载字体大小失败:', error);
        }
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
    try {
        console.log('开始初始化Markdown阅读器...');
        const reader = new MarkdownReader();
        console.log('MarkdownReader初始化成功');

        const projectManager = new ProjectManager(reader);
        console.log('ProjectManager初始化成功');

        console.log('Markdown阅读器已初始化');
    } catch (error) {
        console.error('初始化失败:', error);
        console.error('错误堆栈:', error.stack);
    }
});

/**
 * 项目管理器
 * 负责管理文档项目（本地项目和内置加密项目）
 */
class ProjectManager {
    constructor(reader) {
        this.reader = reader;
        this.currentProject = null;
        this.currentProjectConfig = null;
        this.projectSource = null; // 'local' 或 'builtin'
        this.localProjectFiles = new Map(); // 本地项目的文件映射

        // 内置项目信息
        this.builtInProject = {
            id: 'myctue',
            name: 'Myctue游戏设计文档',
            path: 'project/myctue'
        };

        // DOM元素
        this.openProjectBtn = this.reader.openProjectBtn;
        this.directoryInput = this.reader.directoryInput;
        this.secretBtn = document.getElementById('secret-project-btn');
        this.passwordModal = document.getElementById('password-modal');
        this.passwordInput = document.getElementById('project-password-input');
        this.passwordSubmitBtn = document.getElementById('password-submit-btn');
        this.passwordCancelBtn = document.getElementById('password-cancel-btn');
        this.passwordError = document.getElementById('password-error');

        // 检查必要的DOM元素
        if (!this.openProjectBtn) {
            console.error('未找到打开项目按钮元素');
        }
        if (!this.directoryInput) {
            console.error('未找到目录选择输入元素');
        }
        if (!this.secretBtn) {
            console.error('未找到隐秘按钮元素');
        }
        if (!this.passwordModal) {
            console.error('未找到密码模态框元素');
        }

        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        console.log('设置项目管理器事件监听器...');
        console.log('openProjectBtn:', this.openProjectBtn ? '存在' : '不存在');
        console.log('directoryInput:', this.directoryInput ? '存在' : '不存在');
        console.log('secretBtn:', this.secretBtn ? '存在' : '不存在');
        console.log('passwordModal:', this.passwordModal ? '存在' : '不存在');

        // 打开项目按钮 - 触发本地目录选择
        if (this.openProjectBtn && this.directoryInput) {
            this.openProjectBtn.addEventListener('click', () => this.directoryInput.click());
            console.log('打开项目按钮事件已绑定');
        } else {
            console.warn('打开项目按钮或目录输入框不存在，跳过绑定');
        }

        // 目录选择
        if (this.directoryInput) {
            this.directoryInput.addEventListener('change', (e) => this.handleDirectorySelect(e));
            console.log('目录选择事件已绑定');
        }

        // 隐秘按钮 - 打开内置项目
        if (this.secretBtn) {
            this.secretBtn.addEventListener('click', () => this.openBuiltInProject());
            console.log('隐秘按钮事件已绑定');
        } else {
            console.warn('隐秘按钮不存在，跳过绑定');
        }

        // 密码提交
        if (this.passwordSubmitBtn) {
            this.passwordSubmitBtn.addEventListener('click', () => this.verifyPassword());
        }
        if (this.passwordCancelBtn) {
            this.passwordCancelBtn.addEventListener('click', () => this.cancelPasswordInput());
        }

        // 回车提交密码
        if (this.passwordInput) {
            this.passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verifyPassword();
                }
            });
        }

        // 点击模态框外部关闭
        if (this.passwordModal) {
            this.passwordModal.addEventListener('click', (e) => {
                if (e.target === this.passwordModal) {
                    this.cancelPasswordInput();
                }
            });
        }

        console.log('项目管理器事件监听器设置完成');
    }

    /**
     * 处理目录选择（本地项目）
     */
    async handleDirectorySelect(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        console.log('选择了目录，包含文件数:', files.length);

        // 构建文件映射
        this.localProjectFiles.clear();
        files.forEach(file => {
            // 获取相对路径（从选中目录开始）
            const relativePath = file.webkitRelativePath.split('/').slice(1).join('/');
            this.localProjectFiles.set(relativePath, file);
            console.log('文件映射:', relativePath);
        });

        // 查找config.json
        const configFile = this.localProjectFiles.get('config.json');
        if (!configFile) {
            alert('未找到config.json配置文件，请确保选择了正确的项目目录');
            return;
        }

        // 读取配置文件
        try {
            const configText = await this.readFileAsText(configFile);
            this.currentProjectConfig = JSON.parse(configText);

            // 设置当前项目
            this.currentProject = {
                id: 'local_' + Date.now(),
                name: this.currentProjectConfig.name,
                path: '' // 本地项目没有path，使用File对象
            };
            this.projectSource = 'local';

            console.log('本地项目配置加载成功:', this.currentProjectConfig);

            // 检查是否需要密码
            if (this.currentProjectConfig.password) {
                this.showPasswordModal();
            } else {
                this.showProjectDocuments();
            }
        } catch (error) {
            console.error('加载配置文件失败:', error);
            alert('配置文件格式错误: ' + error.message);
        }
    }

    /**
     * 读取文件为文本
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * 打开内置项目
     */
    openBuiltInProject() {
        this.currentProject = this.builtInProject;
        this.projectSource = 'builtin';
        this.showPasswordModal();
    }

    /**
     * 显示密码输入模态框
     */
    showPasswordModal() {
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
        this.passwordInput.value = '';
        this.passwordError.style.display = 'none';
    }

    /**
     * 取消密码输入
     */
    cancelPasswordInput() {
        this.hidePasswordModal();
        this.currentProject = null;
        this.currentProjectConfig = null;
        this.projectSource = null;
        this.localProjectFiles.clear();
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

        try {
            // 如果是内置项目，需要先加载配置
            if (this.projectSource === 'builtin') {
                await this.loadBuiltInProjectConfig();
            }

            // 验证密码
            if (password === this.currentProjectConfig.password) {
                // 密码正确
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
     * 加载内置项目配置
     */
    async loadBuiltInProjectConfig() {
        try {
            const configUrl = `${this.currentProject.path}/config.json`;
            console.log('尝试加载内置项目配置:', configUrl);

            const response = await fetch(configUrl);
            console.log('响应状态:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }

            const configText = await response.text();
            this.currentProjectConfig = JSON.parse(configText);
            console.log('内置项目配置加载成功:', this.currentProjectConfig);
        } catch (error) {
            console.error('加载内置项目配置失败:', error);
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
                    this.loadDocument(doc, docLink);
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

        // 显示阅读进度条
        if (this.reader.progressBar) {
            this.reader.progressBar.style.display = 'block';
        }

        // 自动打开第一个文档
        if (this.currentProjectConfig.documents && this.currentProjectConfig.documents.length > 0) {
            const firstDoc = this.currentProjectConfig.documents[0];
            const firstDocLink = tocNav.querySelector('.doc-list-item');
            if (firstDocLink) {
                // 延迟加载，确保DOM已完全渲染
                setTimeout(() => {
                    this.loadDocument(firstDoc, firstDocLink);
                }, 100);
            }
        }
    }

    /**
     * 加载文档
     */
    async loadDocument(doc, clickedLink) {
        try {
            let markdown;

            // 根据项目来源使用不同的加载方式
            if (this.projectSource === 'local') {
                // 从本地File对象读取
                const file = this.localProjectFiles.get(doc.path);
                if (!file) {
                    throw new Error(`文件不存在: ${doc.path}`);
                }
                markdown = await this.readFileAsText(file);
                console.log('从本地文件读取:', doc.path);
            } else {
                // 从服务器fetch
                // 对路径的各个部分分别进行URL编码，避免中文路径问题
                const pathParts = doc.path.split('/');
                const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
                const docPath = `${this.currentProject.path}/${encodedPath}`;
                console.log('请求路径:', docPath);

                const response = await fetch(docPath);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                markdown = await response.text();
                console.log('从服务器读取成功:', doc.title);
            }

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
            if (clickedLink) {
                clickedLink.classList.add('active');
            }

            // 显示文件信息
            this.reader.fileInfo.style.display = 'flex';
            this.reader.fileName.textContent = doc.title;

            // 滚动到顶部
            this.reader.markdownContent.scrollTop = 0;

            console.log('文档加载成功:', doc.title);
        } catch (error) {
            console.error('加载文档失败:', error);
            alert(`加载文档失败: ${doc.title}\n${error.message}`);
        }
    }

    /**
     * 关闭项目
     */
    closeProject() {
        this.currentProject = null;
        this.currentProjectConfig = null;
        this.projectSource = null;
        this.localProjectFiles.clear();

        // 恢复上传区
        this.reader.uploadArea.style.display = 'flex';
        this.reader.markdownContent.style.display = 'none';
        this.reader.fileInfo.style.display = 'none';
        this.reader.markdownContent.innerHTML = '';

        // 恢复TOC
        this.reader.tocNav.innerHTML = '<p class="toc-empty">暂无目录</p>';

        // 隐藏阅读进度条
        if (this.reader.progressBar) {
            this.reader.progressBar.style.display = 'none';
        }

        console.log('项目已关闭');
    }
}
