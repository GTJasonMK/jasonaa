# 🎮 多功能娱乐平台

> 一个纯前端的多功能娱乐平台，集成经典游戏、音乐练习和社区论坛功能

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## ✨ 功能特性

### 🎮 经典游戏模块
- **贪吃蛇 (Snake)** - 经典贪吃蛇游戏，支持键盘和触摸控制
- **俄罗斯方块 (Tetris)** - 支持方块旋转、消行计分，多种难度
- **2048** - 数字合并益智游戏
- **记忆翻牌 (Memory)** - 卡牌记忆配对游戏
- **画圆周率 (DrawPi)** - 创意绘图游戏

所有游戏均支持：
- ⌨️ 键盘控制
- 📱 触摸屏操作
- 🏆 本地最高分记录
- 🎨 深色/浅色主题切换
- 📊 实时计分系统

### 🎵 音乐练习模块
- **音阶练习** - 支持多种调式（C大调、G大调等）和音域范围
- **音程识别** - 训练音乐听力，识别不同音程
- **真实钢琴音色** - 使用MP3钢琴采样音频
- **Web Audio API** - 高质量音频播放和合成

### 💬 社区论坛模块
- 基于 **GitHub Issues API** 实现的轻量级论坛
- 支持发帖、评论、点赞功能
- 支持Markdown格式
- 用户资料存储（使用GitHub Gist同步）
- 搜索和标签过滤
- 分页浏览

### 🎨 全局功能
- **深色/浅色主题** - 自动检测系统偏好或手动切换
- **响应式设计** - 完美适配桌面、平板、手机
- **统一设置系统** - 集中管理所有模块的配置
- **纯前端实现** - 无需后端，可部署到任何静态托管服务

## 🚀 在线演示

访问地址：[在线演示](https://你的域名)

## 🛠️ 技术栈

- **前端框架**: 纯原生 HTML5、CSS3、JavaScript (ES6+)
- **模块化**: ES6 Modules
- **音频处理**: Web Audio API
- **数据存储**: LocalStorage API
- **API集成**: GitHub REST API (Issues, Gists, Reactions)
- **主题系统**: CSS Custom Properties (CSS变量)
- **响应式**: Media Queries + Flexbox

## 📦 项目结构

```
jasonaa/
├── index.html              # 主页入口
├── config.js              # 全局配置
├── main.js                # 主页逻辑
├── .gitignore            # Git忽略规则
│
├── css/                  # 全局样式
│   ├── style.css        # 基础样式
│   └── theme.css        # 主题样式
│
├── js/                   # 全局脚本
│   ├── event-manager.js     # 事件管理器
│   ├── resource-manager.js  # 资源管理器
│   ├── settings-loader.js   # 设置加载器
│   └── theme.js            # 主题控制
│
├── games/                # 游戏模块
│   ├── GameBase.js      # 游戏基类（v2.0）
│   ├── 2048/           # 2048游戏
│   ├── snake/          # 贪吃蛇游戏
│   ├── tetris/         # 俄罗斯方块
│   ├── memory/         # 记忆翻牌
│   └── drawpi/         # 画圆周率
│
├── music/               # 音乐模块
│   ├── music.html      # 音乐练习页面
│   ├── music.js        # 音乐逻辑
│   ├── music.css       # 音乐样式
│   └── piano/          # 钢琴音频文件（17个MP3）
│
├── forum/               # 论坛模块
│   ├── forum.html      # 论坛页面
│   ├── forum.js        # 主入口（380行）
│   ├── forum.css       # 论坛样式
│   └── modules/        # 模块化架构
│       ├── config.js       # 配置管理
│       ├── github-api.js   # API封装
│       ├── auth.js         # 认证模块
│       ├── ui.js           # UI控制
│       ├── issues.js       # Issue管理
│       ├── comments.js     # 评论系统
│       ├── reactions.js    # 点赞功能
│       ├── profile.js      # 用户资料
│       └── utils.js        # 工具函数
│
├── settings/            # 设置模块
│   ├── settings.html   # 设置页面
│   ├── settings.js     # 设置逻辑
│   └── settings.css    # 设置样式
│
└── images/             # 图片资源
    └── *.svg          # 游戏图标
```

## 🔧 本地运行

### 前置要求

- 现代浏览器（Chrome 60+, Firefox 55+, Safari 11+, Edge 79+）
- Python 3.x 或 Node.js（用于启动本地服务器）

### 快速开始

**方式1：使用Python**

```bash
# 克隆仓库
git clone https://github.com/你的用户名/jasonaa.git
cd jasonaa

# 启动HTTP服务器
python -m http.server 8080

# 浏览器访问
# http://localhost:8080
```

**方式2：使用Node.js**

```bash
# 克隆仓库
git clone https://github.com/你的用户名/jasonaa.git
cd jasonaa

# 使用http-server（需要先安装）
npx http-server -p 8080

# 浏览器访问
# http://localhost:8080
```

⚠️ **重要提示**：
- 必须通过HTTP服务器访问，不能直接双击打开HTML文件
- ES6模块和音频加载需要HTTP(S)协议支持

## 📖 使用指南

### 游戏模块

1. 在主页点击任意游戏图标进入
2. 使用键盘方向键或触摸屏控制
3. 游戏分数会自动保存到本地

**贪吃蛇控制**：
- 方向键：控制移动方向
- 空格键：暂停/继续
- 触摸屏：滑动控制方向

**俄罗斯方块控制**：
- 左右方向键：移动方块
- 上方向键：旋转方块
- 下方向键：加速下落
- 空格键：快速下落
- P键：暂停/继续

### 音乐模块

1. 选择练习模式（音阶练习/音程识别）
2. 选择调式和音域范围
3. 点击"开始练习"按钮
4. 听音识别或弹奏音符

**音频问题排查**：
- 确保使用HTTP服务器访问（非file://协议）
- 检查浏览器是否允许音频自动播放
- 移动设备需要用户交互后才能播放音频

### 论坛模块

#### 首次使用配置

1. **获取GitHub Personal Access Token**：
   - 访问 [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - 点击 "Generate new token (classic)"
   - 勾选权限：`public_repo` 和 `gist`
   - 生成并复制Token

2. **登录论坛**：
   - 输入GitHub用户名
   - 粘贴上面生成的Token
   - 点击"登录"按钮

3. **使用功能**：
   - 发表新贴：切换到"发表新贴"标签页
   - 浏览讨论：在"讨论区"查看和搜索
   - 评论点赞：点击Issue查看详情
   - 个人资料：在"个人主页"设置昵称和签名

#### 切换仓库

默认使用`13108387302/jasonaa`仓库，可以通过URL参数切换：

```
http://localhost:8080/forum/forum.html?owner=你的用户名&repo=你的仓库名
```

### 设置模块

在任何页面点击右上角的齿轮图标⚙️进入设置：
- 主题设置：深色/浅色/跟随系统
- 游戏设置：速度、难度等
- 音乐设置：默认调式、音域等
- 论坛设置：显示选项等

所有设置自动保存到浏览器LocalStorage。

## 🌐 部署到GitHub Pages

1. **创建GitHub仓库**

```bash
# 初始化Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/jasonaa.git

# 推送
git push -u origin main
```

2. **启用GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source: `main` 分支
   - 目录: `/` (root)
   - 点击 Save

3. **访问网站**
   - 等待1-2分钟部署完成
   - 访问 `https://你的用户名.github.io/jasonaa`

### 自定义域名（可选）

如果有自定义域名：

1. 在域名DNS设置中添加CNAME记录：
   ```
   www  CNAME  你的用户名.github.io
   ```

2. 修改项目根目录的`CNAME`文件，写入你的域名：
   ```
   www.你的域名.com
   ```

3. 在GitHub Pages设置中填入自定义域名

## 🎯 核心特性说明

### 模块化架构

项目采用ES6模块化设计：

**游戏模块**：
- 所有游戏继承自`GameBase.js`基类
- 统一的生命周期管理
- 内置TouchGestureHandler（触摸手势）
- LevelSystem（等级系统）
- NotificationSystem（通知系统）
- StorageHelper（存储助手）

**论坛模块**：
- 采用8+1模块化架构
- 统一的GitHub API封装层
- 事件驱动的模块间通信
- 集中式状态管理

### 主题系统

使用CSS变量实现动态主题切换：

```css
/* 浅色主题 */
--bg-color: #f0f4f8;
--text-color: #2d3748;

/* 深色主题 */
--bg-color: #1a202c;
--text-color: #e2e8f0;
```

支持：
- 自动检测系统主题偏好
- 手动切换深色/浅色模式
- iframe内嵌页面主题同步
- 主题设置持久化

### 响应式设计

断点设置：
- `768px` - 平板和小屏设备
- `480px` - 手机设备

移动端优化：
- 最小可点击区域 44px × 44px
- 触摸反馈效果（:active）
- 滚动优化（-webkit-overflow-scrolling: touch）
- 双重事件绑定（touch + click）

## 🔍 浏览器兼容性

| 浏览器 | 最低版本 | 说明 |
|--------|---------|------|
| Chrome | 60+ | 推荐使用 |
| Firefox | 55+ | 完全支持 |
| Safari | 11+ | 完全支持 |
| Edge | 79+ | 基于Chromium |
| IE | ❌ 不支持 | 需要ES6+ |

**依赖的关键API**：
- ES6+ (箭头函数、模板字符串、Promise、async/await)
- Web Audio API
- CSS Custom Properties
- LocalStorage API
- Touch Events API
- Fetch API

## 🐛 常见问题

**Q: 音频文件无法加载？**
A: 确保使用HTTP服务器访问（http://localhost），而不是file://协议

**Q: 论坛登录失败？**
A: 检查GitHub Token是否正确，是否勾选了`public_repo`和`gist`权限

**Q: 游戏控制没反应？**
A: 确保游戏已开始，某些游戏需要先点击"开始"按钮

**Q: 主题切换后样式错乱？**
A: 尝试刷新页面，或清除浏览器缓存

**Q: 触摸控制不灵敏？**
A: 检查是否在移动设备上使用，或者浏览器DevTools的移动模拟模式

## 📄 开源协议

本项目采用 [MIT License](https://opensource.org/licenses/MIT) 开源协议

```
MIT License

Copyright (c) 2024 [你的名字]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

**贡献流程**：
1. Fork本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

**代码规范**：
- 所有注释使用中文
- 变量和函数使用驼峰命名
- 常量使用全大写蛇形命名
- 禁止在代码中使用emoji

## 📞 联系方式

- 项目主页: [GitHub](https://github.com/你的用户名/jasonaa)
- 问题反馈: [Issues](https://github.com/你的用户名/jasonaa/issues)

## 🙏 致谢

- 音频采样来自公共领域钢琴录音
- 图标使用SVG矢量格式
- 感谢所有贡献者

---

**⭐ 如果这个项目对你有帮助，请给个Star支持一下！**
