# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个纯前端的多功能娱乐平台,集成了经典游戏、AI对话工具、音乐练习和社区论坛功能。项目使用原生HTML5/CSS3/JavaScript开发,采用ES6模块化架构,无需后端服务器即可部署到任何静态托管服务。

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

项目包含三个AI工具:

1. **aitools/aichat/** - 轻量级AI聊天室
   - 支持多种AI服务商(OpenAI、DeepSeek、New API等)
   - 简单的对话界面
   - 位置: `aitools/aichat/index.html`

2. **aitools/chattavern/** - AI角色对话系统
   - 兼容SillyTavern角色卡格式
   - `AIManager.js` - AI接口管理器
   - 支持多种LLM提供商:
     - OpenAI (gpt-3.5-turbo, gpt-4)
     - Claude (通过CORS代理)
     - DeepSeek
     - 自定义API (Ollama、LM Studio等本地模型)
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

断点设置:
- `768px` - 平板和小屏设备
- `480px` - 手机设备

移动端优化策略:
- 最小可点击区域: 44px × 44px
- 触摸反馈效果(`:active`状态)
- 滚动优化(`-webkit-overflow-scrolling: touch`)
- 双重事件绑定(touch + click)处理兼容性

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

## 常见任务

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
- `chattavern_ai_config` - ChatTavern AI配置
- `github_token`, `github_username` - 论坛认证信息

**注意**: LocalStorage并非完全安全,不应存储高度敏感信息。公共设备使用后应清除数据。

### 音频资源
钢琴音频文件位于`music/piano/`,共17个MP3文件,对应不同音符。使用Web Audio API加载和播放。

## 架构演进历史

### v2.0架构重构
- 统一配置系统(settingsManager)
- 游戏基类(GameBase)引入
- 论坛模块化重构(8+1架构)
- 触摸手势统一处理

### 遗留问题
- `musicAppConfig`旧配置键(已废弃,但暂未删除以防回滚需要)
- 部分游戏尚未完全迁移到GameBase基类

## 技术债务与注意事项

1. **配置系统**: 确保所有新功能使用`settingsManager`,不要创建独立的配置存储
2. **CORS限制**: AI功能在纯静态部署时受CORS限制,需要代理或本地模型
3. **GitHub API限制**: 论坛功能依赖GitHub API,注意速率限制
4. **浏览器兼容性**: 不支持IE,ES6+语法不做降级处理
5. **音频自动播放**: 移动端浏览器限制音频自动播放,需用户交互触发

## Git工作流

- 主分支: `main`
- 直接提交到主分支(小型项目,无需复杂分支策略)
- 提交信息使用中文,简洁描述改动内容
- 已设置`.gitignore`忽略`node_modules/`等常见临时文件
