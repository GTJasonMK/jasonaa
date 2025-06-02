# 多功能娱乐平台

一个功能丰富的HTML5网页游戏和学习平台，包含经典游戏、音乐练习及社区论坛等多种模块。本项目采用纯前端技术栈实现，无需后端支持，可以轻松部署在任何静态网站托管服务上。

## 平台特色

- **丰富多样的游戏集合**：包含贪吃蛇、俄罗斯方块、2048、记忆游戏等经典休闲游戏
- **音乐练习模块**：提供音阶练习、单音辨听、多音辨听等音乐训练功能
- **社区论坛**：用户可以交流游戏攻略和音乐学习心得
- **主题切换**：支持深色/浅色主题切换，自动适应系统偏好
- **响应式设计**：适配桌面端和移动端，提供良好的跨设备体验
- **本地存储**：使用localStorage存储用户设置和游戏进度
- **完全离线支持**：所有功能均可在离线环境下运行

## 游戏模块

### 贪吃蛇
- 经典贪吃蛇游戏
- 支持键盘和触摸屏操控
- 随机生成食物，吃到食物后蛇身变长
- 碰到边界或自身游戏结束

### 俄罗斯方块
- 经典的俄罗斯方块游戏
- 支持键盘和触摸控制
- 方块旋转、移动和快速下落功能
- 消除完整行获得分数，难度随等级提升增加

### 2048
- 流行的数字合并游戏
- 使用方向键或滑动控制所有方块移动
- 相同数字相撞时合并为它们的和
- 支持撤销操作和游戏记录保存

### 画圆测π
- 趣味数学游戏，通过手绘圆形来近似计算π值
- 测试用户手绘精确度
- 提供实时反馈和评分

### 记忆游戏
- 经典的卡片匹配记忆游戏
- 翻转卡片找出匹配对
- 计时模式和计步模式
- 难度可调整

## 音乐练习模块

平台提供一系列音乐练习功能，帮助用户提升音乐素养和听力技能：

### 音阶练习
- 展示和播放各种音阶
- 可视化音阶组成
- 支持常见大调音阶

### 单音辨听
- 播放单个音符，用户进行识别
- 多种难度级别可选
- 实时反馈和统计

### 多音辨听
- 播放由多个音符组成的旋律
- 用户需要依次识别每个音符
- 提供即时反馈和计分系统

### 节奏训练（开发中）
- 跟随节奏模式练习
- 提升用户节奏感和音乐时值理解

## 操作说明

### 游戏通用操作
- 桌面设备：使用键盘（方向键、空格键等）控制
- 移动设备：使用触摸屏滑动和点击操作
- 部分游戏支持特殊按键，具体见游戏内说明

### 音乐模块操作
- 点击按钮播放音频
- 选择音符或音阶进行练习
- 调整难度和音域范围
- 查看统计和进度反馈

## 项目结构

```
/
├── index.html              # 主页
├── main.js                 # 主页JavaScript逻辑
├── config.js               # 全局配置文件
├── CNAME                   # 域名配置文件
├── css/                    # 全局样式
│   ├── style.css           # 主要样式表
│   └── theme.css           # 主题相关样式
├── js/                     # 全局JavaScript
│   ├── settings-loader.js  # 设置加载器
│   └── theme.js            # 主题切换功能
├── games/                  # 游戏模块目录
│   ├── responsive_games.css# 游戏通用响应式样式
│   ├── tetris/             # 俄罗斯方块游戏
│   │   ├── tetris.html
│   │   ├── tetris_script.js
│   │   └── tetris_styles.css
│   ├── 2048/               # 2048游戏
│   │   ├── 2048.html
│   │   ├── 2048.js
│   │   └── 2048_styles.css
│   ├── snake/              # 贪吃蛇游戏
│   │   ├── snake.html
│   │   ├── snake.js
│   │   └── snake_styles.css
│   ├── drawpi/             # 画圆测π游戏
│   │   ├── drawpi.html
│   │   ├── drawpi.js
│   │   └── drawpi_styles.css
│   └── memory/             # 记忆游戏
│       ├── memory.html
│       ├── memory.js
│       └── memory_styles.css
├── music/                  # 音乐练习模块
│   ├── music.html          # 音乐练习页面
│   ├── music.js            # 音乐练习逻辑
│   ├── music.css           # 音乐练习样式
│   └── piano/              # 钢琴音频文件
│       ├── A0.mp3          # 钢琴A0音符
│       ├── A4.mp3          # 钢琴A4音符
│       └── ...             # 其他钢琴音符
├── forum/                  # 论坛模块
│   ├── forum.html          # 论坛页面
│   ├── forum.js            # 论坛逻辑
│   └── forum.css           # 论坛样式
├── settings/               # 设置模块
│   ├── settings.html       # 设置页面
│   ├── settings.js         # 设置逻辑
│   └── settings.css        # 设置样式
├── images/                 # 图片资源
│   ├── snake.svg           # 游戏图标
│   ├── tetris.svg          # 游戏图标
│   └── ...                 # 其他图片资源
└── sounds/                 # 音频资源
    ├── click.mp3           # 点击音效
    ├── success.mp3         # 成功音效
    └── ...                 # 其他音效
```

## 开发环境设置

### 本地开发

1. 克隆仓库
   ```bash
   git clone https://github.com/username/entertainment-platform.git
   cd entertainment-platform
   ```

2. 启动本地服务器（推荐，避免音频文件加载问题）
   ```bash
   # 使用Python启动简易HTTP服务器
   python -m http.server 8080
   
   # 或使用Node.js的http-server（需要先安装）
   npx http-server -p 8080
   ```

3. 访问 `http://localhost:8080` 开始开发

### 注意事项

- 由于浏览器安全限制，某些功能（如音频播放）在直接打开HTML文件时可能无法正常工作，建议使用本地服务器
- 项目使用了ES6+特性，请使用现代浏览器进行开发和测试
- 本项目完全由前端技术实现，无需配置后端服务

## 部署指南

### GitHub Pages部署

1. 将此项目推送到您的GitHub仓库
   ```bash
   git remote set-url origin https://github.com/您的用户名/您的仓库名.git
   git push -u origin main
   ```

2. 在GitHub仓库页面，点击"Settings"标签
3. 在左侧菜单中找到"Pages"选项
4. 在"Source"部分，选择"main"分支和"/(root)"文件夹
5. 点击"Save"按钮
6. 几分钟后，您的网站将在`https://[用户名].github.io/[仓库名]`上可用

### 自定义域名部署

1. 在DNS提供商处创建CNAME记录，指向`[用户名].github.io`
2. 在项目根目录创建`CNAME`文件，文件内容为您的自定义域名
3. 提交并推送更改到GitHub
4. 在GitHub Pages设置中勾选"Enforce HTTPS"选项（如可用）

## 主题切换功能

本平台实现了完整的深色/浅色主题切换功能，用户可以根据自己的偏好选择适合的界面风格：

1. **自动检测系统偏好**：首次访问网站时，会自动检测用户操作系统的主题设置，并应用相应的主题
2. **用户偏好保存**：用户手动切换主题后，会将偏好保存在浏览器本地存储中，下次访问时自动应用
3. **跨页面同步**：所有页面共享同一主题设置，确保一致的用户体验
4. **响应式设计**：所有页面在不同主题下都能保持良好的可读性和视觉效果

### 为新页面添加主题切换支持

如果你需要创建新页面并支持主题切换功能，请按照以下步骤操作：

1. **引入必要文件**：在HTML头部引入主题CSS文件和主题切换脚本

```html
<head>
    <!-- 其他标签 -->
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/theme.css">
    <!-- 页面特定样式 -->
    <script src="../js/theme.js"></script>
</head>
```

2. **使用CSS变量**：在编写CSS时，使用主题变量而不是硬编码颜色值

```css
.your-element {
    background-color: var(--container-bg);
    color: var(--text-color);
    border: 1px solid var(--box-shadow-color);
}

.your-button {
    background-color: var(--primary-color);
    color: white;
}

.your-button:hover {
    background-color: var(--button-hover);
}
```

3. **支持iframe通信**：如果页面包含iframe，主题切换脚本会自动处理同源iframe的主题同步

### 可用主题变量

主题系统提供了丰富的CSS变量，可以在任何样式文件中使用：

#### 基础颜色变量
- `--bg-color`: 页面背景色
- `--container-bg`: 容器背景色
- `--primary-color`: 主色调
- `--secondary-color`: 辅助色
- `--text-color`: 文本颜色
- `--header-color`: 标题文字颜色
- `--link-color`: 链接颜色
- `--link-hover`: 链接悬停颜色
- `--button-bg`: 按钮背景色
- `--button-hover`: 按钮悬停背景色
- `--card-bg`: 卡片背景色
- `--box-shadow-color`: 阴影颜色

#### 半透明颜色变量
- `--primary-color-transparent`: 半透明主色
- `--secondary-color-transparent`: 半透明辅助色
- `--accent-color`: 强调色
- `--accent-color-transparent`: 半透明强调色

#### 模块特定颜色变量
根据功能模块，我们还提供了特定的颜色变量：

**游戏模块**
- `--tetris-board-bg`, `--tetris-board-border`, `--tetris-cell-bg`, 等

**音乐模块**
- `--music-card-bg`, `--music-card-active`, `--note-correct`, `--note-incorrect`, 等

**论坛模块**
- `--forum-container-bg`, `--forum-card-bg`, `--forum-input-bg`, 等

## 音乐模块移动端适配优化
### 2023.11.16更新
为提升移动设备上的用户体验，完成了以下优化：

1. **响应式布局增强**:
   - 添加针对不同屏幕尺寸(768px和480px)的详细媒体查询
   - 优化组件大小和间距，确保在小屏幕上合理显示
   - 调整文字大小和按钮尺寸，提高可读性和可点击性

2. **触摸体验优化**:
   - 添加触摸反馈效果(.touch-active类)
   - 确保所有可交互元素符合最小44px×44px的可点击区域标准
   - 替换hover效果为active效果，更适合触摸设备
   - 优化滚动体验，添加-webkit-overflow-scrolling:touch

3. **设备适应性**:
   - 添加设备类型检测功能(isMobileDevice)
   - 针对不同设备类型自动应用不同UI策略
   - 优化音频控制元素在移动设备上的位置和大小

4. **事件处理增强**:
   - 添加对触摸事件的全面支持
   - 实现统一的事件处理逻辑，同时支持点击和触摸
   - 修复移动端触摸事件问题，确保交互流畅
   - 解决了移动设备上的音频播放限制问题

5. **音频体验优化**:
   - 改进了音频上下文初始化过程
   - 增强了错误处理和用户反馈
   - 为移动设备添加了特殊的音频状态指示
   - 解决了iOS设备上的AudioContext限制问题

这些优化确保音乐模块在移动设备上运行流畅，操作便捷，视觉体验与桌面端一致。

## 技术栈

- **HTML5**: 页面结构和Canvas绘图
- **CSS3**: 样式和动画，包括Flexbox和Grid布局
- **JavaScript (ES6+)**: 核心功能实现
- **Web Audio API**: 音频播放和处理
- **LocalStorage API**: 本地数据存储
- **Media Queries**: 响应式设计
- **Touch Events API**: 移动设备触摸支持

## 未来计划

1. 增加更多游戏类型
2. 改进音乐练习模块的教学功能
3. 增加更多的主题选项
4. 引入多语言支持
5. 优化移动端体验
6. 添加键盘快捷键列表
7. 增加本地用户配置文件功能
8. 增强可访问性支持

## 贡献指南

欢迎提交Pull Request或Issue来改进这个项目。请确保您的代码符合以下要求：

1. 保持代码风格一致
2. 添加适当的注释
3. 确保在主要浏览器中测试通过
4. 对于新功能，请先提交Issue讨论

## 许可证

本项目采用MIT许可证。详情请见LICENSE文件。
