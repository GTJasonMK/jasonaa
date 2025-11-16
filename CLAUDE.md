# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个纯前端的多功能娱乐平台,集成了经典游戏、AI对话工具、多语言学习、音乐练习和社区论坛功能。项目使用原生HTML5/CSS3/JavaScript开发,采用ES6模块化架构,无需后端服务器即可部署到任何静态托管服务。

## 开发环境设置

### 本地运行要求
项目必须通过HTTP服务器访问,不能直接双击HTML文件打开,因为ES6模块和音频加载需要HTTP(S)协议支持。

启动本地服务器:
```bash
# 使用Python 3
python -m http.server 8080

# 或使用Node.js
npx http-server -p 8080
```

访问地址: `http://localhost:8080`

### 常用开发命令

**本地开发服务器**:
```bash
# Python方式（推荐）
python -m http.server 8080

# Node.js方式
npx http-server -p 8080
```

**更新版本信息**（提交前必须执行）:
```bash
bash update-version.sh
```

**生成预生成词汇数据**:
```bash
cd scripts
npm run generate -- --input ../languagelearning/english/wordlists/CET4_edited.txt --output ../languagelearning/english/data/cet4_pregenerated.json --bookId cet4
```

**测试模式生成（仅处理前5个单词）**:
```bash
cd scripts
npm test
```

**验证词库格式**:
```bash
cd scripts
npm run validate -- --input ../languagelearning/english/wordlists/CET4_edited.txt
```

### 浏览器要求
- Chrome 60+、Firefox 55+、Safari 11+、Edge 79+
- 不支持IE浏览器
- 依赖ES6+特性、Web Audio API、CSS Custom Properties、LocalStorage API

## 核心架构

### 模块化设计

项目采用三层架构设计:

1. **全局层** - 跨模块共享的基础设施
   - `config.js` - 全局配置代理,委托给settingsManager
   - `js/settings-loader.js` - 统一的设置管理系统(DEFAULT_SETTINGS)
   - `js/theme.js` - 主题系统(CSS变量驱动)
   - `js/event-manager.js` - 事件管理器
   - `js/resource-manager.js` - 资源管理器

2. **功能模块层** - 独立的功能模块
   - `games/` - 游戏模块
   - `aitools/` - AI工具集合
     - `aitools/aichat/` - 轻量级AI聊天室
     - `aitools/chattavern/` - AI角色对话系统
     - `aitools/mdreader/` - Markdown阅读器
   - `languagelearning/` - 多语言学习平台
     - `languagelearning/english/` - 英语学习模块
     - `languagelearning/japanese/` - 日语学习模块（预留）
   - `music/` - 音乐练习模块
   - `forum/` - 社区论坛模块
   - `settings/` - 设置管理界面

3. **UI层** - 用户界面
   - `index.html` - 主页入口
   - `css/` - 全局样式

### 游戏模块架构

所有游戏继承自`games/GameBase.js`基类,该基类提供:

- **TouchGestureHandler** - 触摸手势处理器
  - 滑动、点击、长按、双击检测
  - 统一的移动端交互接口

- **LevelSystem** - 等级系统
  - 经验值计算
  - 等级晋升逻辑
  - 难度调整机制

- **NotificationSystem** - 通知系统
  - 游戏内提示
  - 成就解锁通知

- **StorageHelper** - 存储助手
  - LocalStorage封装
  - 最高分记录管理

游戏实现时应:
1. 继承`GameBase`类
2. 重写关键生命周期方法
3. 调用基类提供的工具方法
4. 使用统一的存储键名格式: `game_${gameName}_highScore`

### 论坛模块架构

论坛采用8+1模块化架构,位于`forum/modules/`:

1. `config.js` - 配置管理(仓库信息、API URL)
2. `github-api.js` - GitHub API封装层
3. `auth.js` - 认证模块(Token管理)
4. `ui.js` - UI控制器
5. `issues.js` - Issue管理(帖子CRUD)
6. `comments.js` - 评论系统
7. `reactions.js` - 点赞功能
8. `profile.js` - 用户资料(使用Gist同步)
9. `utils.js` - 工具函数

论坛主入口: `forum/forum.js`

**重要**: 论坛基于GitHub Issues API实现,需要用户提供GitHub Personal Access Token(public_repo和gist权限)。

### AI工具架构

**目录组织**: 所有AI工具统一放在`aitools/`目录下,便于管理和扩展。

**架构重构（2025-11）**：
- 创建统一配置管理器 `aitools/shared/config-manager.js`
- 所有AI工具使用统一的配置键名 `ai_config`
- AIManager重构使用LLMClient，消除约150行代码重复
- 移除所有硬编码API密钥，提升安全性
- 详见：`aitools/REFACTORING_TEST_GUIDE.md`

**共享模块**：

1. **aitools/shared/config-manager.js** - 统一配置管理器
   - 管理所有AI工具的配置
   - 自动迁移旧配置（aichat_config、chattavern_ai_config → ai_config）
   - 配置验证和默认值管理
   - 向后兼容性保证

2. **aitools/aichat/llm-client.js** - LLM客户端统一封装
   - 支持所有OpenAI兼容API
   - SSE流式解析
   - 自动重试机制（最多3次）
   - 超时控制（可配置）
   - 浏览器header模拟

**AI工具列表**：

项目包含三个AI工具:

1. **aitools/aichat/** - 轻量级AI聊天室
   - 支持多种AI服务商(OpenAI、DeepSeek、New API等)
   - 简单的对话界面
   - 位置: `aitools/aichat/index.html`

2. **aitools/chattavern/** - AI角色对话系统
   - 兼容SillyTavern角色卡格式
   - `AIManager.js` - AI接口管理器（重构版：使用LLMClient统一封装）
   - 支持多种LLM提供商:
     - OpenAI、DeepSeek、自定义API（通过LLMClient）
     - Claude（独立实现，API格式不同）
   - 自动初始化LLMClient，享有重试、超时等高级特性
   - `ai-config-examples.json` - 配置示例文件(位于根目录)
   - `NEW_API_GUIDE.md` - New API配置指南
   - 位置: `aitools/chattavern/chattavern.html`

3. **aitools/mdreader/** - Markdown阅读器
   - 纯前端文档阅读器
   - 位置: `aitools/mdreader/index.html`
   - 详细架构见下节

**CORS处理**:
- Claude API需要CORS代理
- New API本地服务需要配置CORS允许头
- 详细解决方案见`aitools/chattavern/NEW_API_GUIDE.md`

### Markdown阅读器架构

纯前端文档阅读器,位于`aitools/mdreader/`:

**核心功能**:
- 文件上传: 支持拖拽和点击选择
- Markdown解析: 使用marked.js(v11.0.0)
- 代码高亮: 使用highlight.js(v11.9.0)
- XSS防护: 使用DOMPurify(v3.0.0)
- TOC生成: 自动提取标题构建目录树
- 主题集成: 与全局主题系统同步

**核心类**: `MarkdownReader`
- FileHandler: 处理文件上传和验证
- MarkdownRenderer: 解析和渲染markdown
- TOCGenerator: 生成可点击目录
- ThemeManager: 主题适配
- ToolbarActions: 导出、全屏、复制等操作

**数据存储**:
- 键名: `mdreader_current`
- 保存当前文档内容和滚动位置
- 有效期1小时,刷新页面自动恢复

**文件限制**:
- 支持格式: .md, .markdown
- 最大大小: 10MB
- 字符编码: UTF-8

**依赖的CDN资源**:
- marked.js - Markdown解析
- highlight.js - 代码高亮
- DOMPurify - XSS防护

### 多语言学习模块架构

多语言学习平台，位于`languagelearning/`，支持扩展多种语言的词汇学习功能。

**目录组织**：所有语言模块统一放在`languagelearning/`目录下，便于管理和扩展。

**目录结构**：
```
languagelearning/
├── index.html          (语言选择页)
├── style.css           (语言选择页样式)
├── english/
│   ├── index.html      (英语学习主页)
│   ├── style.css       (英语模块样式)
│   ├── english.js      (英语模块逻辑)
│   └── wordlists/      (英语词库)
│       ├── CET4_edited.txt
│       ├── CET6_edited.txt
│       ├── TOEFL.txt
│       └── GRE_8000_Words.txt
└── japanese/
    ├── index.html      (日语学习主页)
    ├── style.css       (日语模块样式)
    ├── japanese.js     (日语模块逻辑)
    └── wordlists/      (日语词库，预留)
        └── README.md   (词库格式说明)
```

**核心功能**：
- 语言选择页：展示可用语言，卡片式布局
- 词汇书选择：每种语言支持多个词库
- 随机抽词练习：Fisher-Yates洗牌算法
- 学习进度跟踪：LocalStorage持久化
- "认识/不认识"判断：简单高效的记忆检验
- **AI助手功能**：集成AI辅助学习，提供单词深度学习支持

**AI助手架构**：

练习页面集成了AI助手面板，提供三种查询功能：

1. **相近释义及区别**：查询当前单词的同义词及使用场景
2. **短语及用法**：查询常用短语搭配和例句
3. **自定义问题**：用户可输入任何关于当前单词的问题

**AI助手类（AIAssistant）**：
- 位置：`languagelearning/english/english.js`（第243-529行）
- 位置：`languagelearning/japanese/japanese.js`（第226-512行）

核心特性：
- **响应历史管理**：保存所有AI回复，支持前后导航
- **智能缓存**：使用Map缓存最近50条查询结果
- **配置兼容**：优先使用aichat配置，向后兼容chattavern配置
- **动态导入**：运行时导入`aitools/aichat/llm-client.js`
- **提示词模板**：针对不同查询类型优化的提示词

配置要求：
- 需要在`aitools/aichat/`中配置AI服务
- 配置存储在LocalStorage的`aichat_config`键
- 支持所有OpenAI兼容API（OpenAI、DeepSeek、New API等）

UI布局：
- 顶部控制区：左侧为退出按钮和统计，右侧为AI面板
- AI面板：固定在右上角，包含3个功能按钮和自定义问题输入框
- AI输出容器：位于页面底部，显示AI回复，支持前后导航
- 响应式设计：移动端AI面板和输出容器垂直排列

LocalStorage键名：
- `aichat_config`：AI配置信息（优先）
- `chattavern_ai_config`：旧版AI配置（向后兼容）

API调用流程：
1. 检查AI配置是否存在
2. 动态导入llm-client.js模块
3. 使用LLMClient.createFromConfig()创建客户端
4. 调用streamAndCollect()方法发送请求
5. 缓存响应并添加到历史记录
6. 更新UI显示

**词库格式要求**（英语）：
```
word [phonetic] definition
例：hello [həˈləʊ] 你好
```

**词库格式要求**（日语）：
```
単語 [reading] 释义
例：こんにちは [konnichiha] 你好
```

**LocalStorage键名规范**：
- 英语：`english_practice_{bookId}_progress`
- 日语：`japanese_practice_{bookId}_progress`
- 格式：`{language}_practice_{bookId}_progress`

**添加新语言模块**：
1. 在`languagelearning/`下创建语言目录（如`french/`）
2. 复制现有模块文件作为模板
3. 修改标题、提示文本为目标语言
4. 更新`VOCABULARY_BOOKS`数组
5. 调整词库格式解析逻辑（如需要）
6. 修改LocalStorage键名前缀
7. 在`languagelearning/index.html`中添加语言卡片
8. 添加词库文件到`wordlists/`目录

**路径兼容性**：
- 旧路径`englishlearning/english.html`保留重定向文件
- 自动跳转到`languagelearning/english/index.html`
- 用户书签和历史记录仍可用

**预生成数据系统**：

为提升AI助手响应速度和降低API成本,项目使用预生成数据系统:

- **数据生成工具**: `scripts/generate-pregenerated.js`
- **存储格式**: JSON分片存储（每片约3.1MB,符合GitHub 25MB限制）
- **数据目录**: `languagelearning/english/data/{bookId}/`
- **加载器**: `languagelearning/english/pregenerated-loader.js`

数据结构:
```json
{
  "word": {
    "synonyms": {
      "content": "Markdown格式的同义词分析",
      "generated": "2025-11-05T12:00:00.000Z"
    },
    "phrases": {
      "content": "Markdown格式的短语搭配",
      "generated": "2025-11-05T12:01:00.000Z"
    }
  }
}
```

生成流程:
1. 配置AI服务（在`scripts/config.json`中）
2. 运行生成脚本（支持中断恢复）
3. 自动分片保存到data目录
4. 前端自动并发加载所有分片并合并

**重要特性**:
- **中断恢复**: 使用`.progress.json`文件记录进度,任何时候中断都可恢复
- **速率控制**: 自适应速率限制,避免触发API限制
- **部分完成**: synonyms和phrases独立处理,一个失败不影响另一个
- **实时进度**: 显示进度、预估时间、token使用量、成本估算

详细文档见: `scripts/README.md`

### 设置系统架构

**核心原则**: 所有配置统一由`settingsManager`管理,避免数据不一致。

- `js/settings-loader.js`中定义`DEFAULT_SETTINGS`常量
- `config.js`作为便捷访问层,代理到`settingsManager`
- 所有模块应通过`window.settingsManager`或`window.appConfig`访问配置
- 配置保存在LocalStorage的`appSettings`键

配置类别:
- `ui` - 主题、字体大小、动画开关、高对比度
- `audio` - 音量、延迟、自动播放、音效
- `music` - 音乐练习相关设置
- `games` - 游戏通用设置(速度、震动反馈等)
- `tetris`, `snake` - 各游戏特定设置
- `forum` - 论坛显示选项

### 主题系统

使用CSS Custom Properties实现动态主题切换:

```css
/* 浅色主题 */
--bg-color: #f0f4f8;
--text-color: #2d3748;

/* 深色主题 */
--bg-color: #1a202c;
--text-color: #e2e8f0;
```

特性:
- 自动检测系统主题偏好(`prefers-color-scheme`)
- 手动切换深色/浅色模式
- iframe内嵌页面主题同步
- 主题设置持久化到LocalStorage

主题控制器: `js/theme.js`

### 响应式设计

项目采用统一的断点规范和移动优先设计策略，所有断点定义集中在`css/breakpoints.css`中。

**统一断点系统**（`css/breakpoints.css`）：

断点设置（使用CSS自定义属性）:
- `--breakpoint-xs: 320px` - 极小屏手机（iPhone SE等）
- `--breakpoint-sm: 480px` - 小屏手机
- `--breakpoint-md: 768px` - 平板竖屏
- `--breakpoint-lg: 1024px` - 平板横屏/小笔记本
- `--breakpoint-xl: 1280px` - 桌面
- `--breakpoint-xxl: 1920px` - 大屏桌面

**移动端优化策略**（已实施）:

1. **触摸目标尺寸**（`css/theme.css`）:
   - 所有按钮最小尺寸: 44px × 44px（Apple标准）
   - 复选框/单选框: 24px × 24px
   - 触摸目标间距: 至少8px
   - 应用范围: button, .btn, input[type="button/submit"], select等

2. **输入框字体大小**（防止iOS自动缩放）:
   - 所有文本输入框: 16px最小字体
   - 应用位置: `theme.css`, `chattavern.css`
   - 影响元素: input[type="text/email/password等"], textarea, select

3. **响应式布局断点**:
   - **< 480px**（手机）: 单列布局，减小间距，简化动画
   - **481-768px**（大屏手机/小平板）: 2列布局
   - **> 768px**（平板/桌面）: auto-fill或多列布局

4. **性能优化**（`css/style.css`性能优化section）:
   - GPU加速: `will-change: transform`, `translateZ(0)`
   - 图片懒加载: `loading="lazy"` + shimmer占位动画
   - 内容可见性: `content-visibility: auto`（现代浏览器）
   - 移动端动画简化: 减少位移量和阴影复杂度
   - iOS平滑滚动: `-webkit-overflow-scrolling: touch`

5. **触摸设备专用优化**（`css/theme.css`）:
   - 触摸反馈: `:active`状态scale(0.98) + opacity(0.9)
   - 移除hover残留: 触摸设备禁用hover transform
   - 媒体查询: `@media (hover: none) and (pointer: coarse)`

6. **无障碍支持**:
   - Reduced motion: `@media (prefers-reduced-motion: reduce)`
   - 禁用所有动画和过渡（仅0.01ms）
   - 应用范围: 全局通配符选择器

**网络自适应加载**（`languagelearning/english/pregenerated-loader.js`）:

预生成数据加载器支持网络检测和自适应策略:
- **Network Information API**: 检测2g/3g/4g/slow-2g
- **加载策略**:
  - `lazy`: 按需加载（2g及以下推荐）
  - `eager`: 立即全量加载（4g推荐）
  - `auto`: 根据网络自动选择
- **并发控制**:
  - slow-2g: 并发数1
  - 2g: 并发数2
  - 3g: 并发数3
  - 4g: 并发数10
- **使用方法**:
  ```javascript
  const loader = new PregeneratedDataLoader('cet4', 'english', {
      loadStrategy: 'auto',  // 或 'eager', 'lazy'
      maxConcurrency: null   // null表示自动根据网络决定
  });
  ```

**模块适配状态**:
- ✅ `aitools/chattavern/` - 新增480px断点，完整移动端优化
- ✅ `languagelearning/english/` - 已有480px，新增性能优化
- ✅ `css/style.css` - 游戏网格2列/1列控制，性能优化section
- ✅ `css/theme.css` - 全局触摸优化，输入框16px
- ✅ `aitools/aichat/` - 已有完善的移动端支持（参考实现）

**开发建议**:
1. 新模块应导入`css/breakpoints.css`并使用定义的断点
2. 优先使用CSS自定义属性而非硬编码像素值
3. 遵循移动优先原则（默认样式适配移动端）
4. 所有交互元素确保44x44px最小尺寸
5. 输入框使用16px字体防止iOS缩放
6. 使用`content-visibility`优化屏幕外内容渲染

## 开发规范

### 代码风格
- 所有注释必须使用中文
- 变量和函数使用驼峰命名(camelCase)
- 常量使用全大写蛇形命名(UPPER_SNAKE_CASE)
- **严禁在项目代码中使用emoji防止编码错误**
- 使用ES6+语法(箭头函数、模板字符串、Promise、async/await)

### 配置修改规范
修改配置时必须:
1. 在`js/settings-loader.js`的`DEFAULT_SETTINGS`中定义默认值
2. 在`config.js`的代理对象中添加访问路径(如有必要)
3. 在`settings/settings.html`中添加对应的UI控制项
4. 确保向后兼容,旧配置能正常迁移

### 游戏开发规范
开发新游戏时:
1. 在`games/`下创建独立目录
2. 继承`GameBase.js`基类
3. 实现触摸和键盘双输入支持
4. 使用`StorageHelper`保存最高分
5. 在`index.html`的游戏网格中添加卡片链接
6. 添加游戏图标到`images/`目录(SVG格式)

### API集成规范
集成新的AI API时:
1. 在`AIManager.js`中添加新的provider case分支
2. 实现对应的API调用方法
3. 在`ai-config-examples.json`中添加配置示例
4. 更新相关文档说明CORS处理方案
5. 添加详细的错误日志便于调试

### 论坛扩展规范
修改论坛功能时:
- 遵循模块化原则,修改对应的模块文件
- 所有GitHub API调用必须通过`github-api.js`
- 注意GitHub API速率限制(认证用户5000请求/小时)
- 测试时使用非生产仓库避免污染数据

### 预生成数据开发规范
生成新的词汇预生成数据时:
1. 确保词库格式正确（使用`--validate`参数验证）
2. 先使用`--test-mode 5`测试少量单词
3. 检查`scripts/config.json`中的AI配置
4. 使用中断恢复机制,无需一次性完成
5. 生成的JSON文件必须分片（单文件不超过10MB）
6. 更新对应的`{bookId}_index.json`索引文件
7. 在前端`VOCABULARY_BOOKS`中添加预生成数据配置

## 常见任务

### 提交代码前的检查清单
1. 运行`bash update-version.sh`更新版本信息
2. 添加版本文件: `git add js/version.js`
3. 提交所有更改并推送
4. 部署后打开网站F12查看控制台,确认版本号

### 添加新的设置项
1. 在`js/settings-loader.js`的`DEFAULT_SETTINGS`中添加
2. 在`settings/settings.js`中添加保存/加载逻辑
3. 在`settings/settings.html`中添加UI控件
4. 在对应功能模块中读取并应用设置

### 调试音频问题
- 确保使用HTTP服务器访问
- 检查浏览器控制台的音频加载错误
- 验证音频文件路径正确性(`music/piano/*.mp3`)
- 移动设备需要用户交互后才能播放音频(Web Audio API限制)

### 调试AI集成问题
1. 打开浏览器开发者工具(F12)查看Console
2. `AIManager`会打印详细的请求/响应日志
3. 常见问题:
   - CORS错误: 参考`NEW_API_GUIDE.md`配置服务器CORS头
   - 401错误: 检查API Key是否正确
   - 429错误: API速率限制,降低请求频率
   - 网络错误: 检查API URL和网络连接

### 生成新的词汇预生成数据
1. 准备词库文件（格式: `word [phonetic] definition`）
2. 配置AI服务（编辑`scripts/config.json`）
3. 验证词库格式:
   ```bash
   cd scripts
   node generate-pregenerated.js --input ../path/to/wordlist.txt --validate
   ```
4. 测试生成（前5个单词）:
   ```bash
   npm run test -- --input ../path/to/wordlist.txt --output test.json --bookId test
   ```
5. 正式生成（支持中断恢复）:
   ```bash
   npm run generate -- --input ../path/to/wordlist.txt --output ../languagelearning/english/data/bookId_pregenerated.json --bookId bookId
   ```
6. 如需中断,直接Ctrl+C,下次重新运行相同命令会自动恢复
7. 生成完成后,检查`.progress.json`中的失败单词
8. 将生成的JSON文件分片（如需要）并移动到对应目录
9. 更新索引文件`{bookId}_index.json`
10. 在前端`english.js`的`VOCABULARY_BOOKS`中添加配置

### 部署到GitHub Pages
1. 推送代码到GitHub仓库
2. 进入仓库Settings → Pages
3. Source选择`main`分支,目录选择`/`(root)
4. 等待1-2分钟部署完成
5. 访问`https://用户名.github.io/仓库名`

自定义域名(可选):
1. 修改根目录`CNAME`文件,写入域名
2. 在域名DNS设置中添加CNAME记录指向`用户名.github.io`
3. 在GitHub Pages设置中填入自定义域名

## 数据存储

### LocalStorage使用
项目大量使用LocalStorage存储用户数据:

- `appSettings` - 全局设置(由settingsManager管理)
- `game_*_highScore` - 各游戏最高分
- `forum_repo_owner`, `forum_repo_name` - 论坛仓库配置
- `aichat_config` - AI聊天配置（优先）
- `chattavern_ai_config` - ChatTavern AI配置（向后兼容）
- `github_token`, `github_username` - 论坛认证信息
- `{language}_practice_{bookId}_progress` - 语言学习进度
- `mdreader_current` - Markdown阅读器当前文档

**注意**: LocalStorage并非完全安全,不应存储高度敏感信息。公共设备使用后应清除数据。

### 音频资源
钢琴音频文件位于`music/piano/`,共17个MP3文件,对应不同音符。使用Web Audio API加载和播放。

### 预生成数据
词汇预生成数据位于`languagelearning/english/data/`:
- 每个词库分成10个分片,每片约3.1MB
- 使用索引文件`{bookId}_index.json`记录分片信息
- 前端使用`pregenerated-loader.js`并发加载并合并
- 支持按需加载或全量加载策略

## 架构演进历史

### v2.0架构重构
- 统一配置系统(settingsManager)
- 游戏基类(GameBase)引入
- 论坛模块化重构(8+1架构)
- 触摸手势统一处理

### AI工具模块重构（2025-11）
- **统一配置管理**: 创建`aitools/shared/config-manager.js`，统一管理所有AI配置
- **配置键名统一**: 从`aichat_config`和`chattavern_ai_config`迁移到`ai_config`
- **消除代码重复**: AIManager重构使用LLMClient，删除约150行重复代码
- **安全性提升**: 移除所有硬编码API密钥
- **架构优化**: 建立清晰的依赖关系，所有OpenAI兼容API统一通过LLMClient
- **向后兼容**: 自动迁移旧配置，用户无感知升级
- **性能提升**: AIManager获得LLMClient的重试、超时等高级特性

### 语言学习模块扩展
- 从单一英语学习模块重构为多语言学习平台
- 目录从`englishlearning/`迁移到`languagelearning/`
- 添加AI助手集成（同义词、短语、自定义查询）
- 引入预生成数据系统提升性能
- 统一使用AIConfigManager管理AI配置

### 版本管理系统
- 添加`js/version.js`自动生成脚本
- 在主页控制台显示部署版本信息
- 便于确认GitHub Pages部署状态

### 遗留问题
- `musicAppConfig`旧配置键(已废弃,但暂未删除以防回滚需要)
- 部分游戏尚未完全迁移到GameBase基类

## 技术债务与注意事项

1. **配置系统**: 确保所有新功能使用`settingsManager`,不要创建独立的配置存储
2. **CORS限制**: AI功能在纯静态部署时受CORS限制,需要代理或本地模型
3. **GitHub API限制**: 论坛功能依赖GitHub API,注意速率限制
4. **浏览器兼容性**: 不支持IE,ES6+语法不做降级处理
5. **音频自动播放**: 移动端浏览器限制音频自动播放,需用户交互触发
6. **预生成数据大小**: 单个JSON分片不应超过10MB,避免GitHub仓库体积过大
7. **AI配置统一**: 所有AI工具统一使用`ai_config`键名，由AIConfigManager管理，自动兼容旧配置

## 项目文件结构补充

### scripts目录（数据生成工具）
```
scripts/
├── package.json                    # npm配置和脚本
├── config.json                     # AI服务配置（需自行创建）
├── config.example.json            # 配置示例
├── generate-pregenerated.js       # 主生成脚本
├── generate-parallel.js           # 并行生成脚本
├── split-wordlist.js             # 词库分割工具
├── fix-wordlist-format.js        # 词库格式修复工具
├── test-loader.js                # 加载器测试脚本
├── README.md                     # 详细使用文档
├── README_PARALLEL_GENERATION.md # 并行生成文档
└── lib/                          # 工具库
    ├── generator.js              # AI内容生成器
    ├── progress-manager.js       # 进度管理器
    ├── rate-limiter.js           # 速率限制器
    └── vocabulary-parser.js      # 词库解析器
```

### 版本管理文件
- `js/version.js` - 自动生成的版本信息（不要手动编辑）
- `update-version.sh` - 版本更新脚本（每次提交前运行）

### AI工具配置文件
- `ai-config-examples.json` - AI配置示例（根目录）
- `scripts/config.json` - 数据生成脚本的AI配置（需自行创建）

## Git工作流

- 主分支: `main`
- 直接提交到主分支(小型项目,无需复杂分支策略)
- 提交信息使用中文,简洁描述改动内容
- 已设置`.gitignore`忽略`node_modules/`等常见临时文件
