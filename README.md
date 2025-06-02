# 网页游戏平台

一个简洁的HTML5网页游戏平台，目前包含俄罗斯方块游戏和2048游戏。

## 游戏特点

### 俄罗斯方块
- 使用方向键控制方块移动和旋转
- 空格键使方块直接下落到底部
- 消除完整的行获得分数
- 支持PC端和移动端
- 游戏速度随等级提升而加快
- 显示下一个方块预览

### 2048
- 使用方向键移动所有方块
- 相同数字相撞时合并为它们的和
- 每次移动后增加一个新的数字方块（2或4）
- 当无法移动时游戏结束
- 达到2048时获胜，可以选择继续游戏
- 支持撤销操作，随时恢复上一步
- 支持触摸滑动操作

## 操作说明

### 俄罗斯方块
- ← → 键: 左右移动方块
- ↑ 键: 旋转方块
- ↓ 键: 加速下落
- 空格键: 直接落到底部
- P 键: 暂停/继续游戏

### 2048
- ← → ↑ ↓ 键: 移动所有方块
- Z 键: 撤销上一步
- R 键: 重新开始游戏

## 如何在GitHub Pages上部署

1. 将此项目推送到您的GitHub仓库

   ```bash
   git add .
   git commit -m "初始提交网页游戏平台"
   git push
   ```

2. 在GitHub仓库页面，点击"Settings"标签

3. 在左侧菜单中找到"Pages"选项

4. 在"Source"部分，选择"main"分支和"/(root)"文件夹

5. 点击"Save"按钮

6. 等待几分钟后，您的网站将在`https://[用户名].github.io/[仓库名]`上可用

## 项目结构

```
/
├── index.html          # 主页
├── main.js             # 主要JavaScript逻辑
├── main.css            # 主要样式表
├── config.js           # 配置文件
├── games.css           # 游戏通用样式
├── games/              # 游戏模块目录
│   ├── tetris/         # 俄罗斯方块游戏
│   │   ├── tetris.html
│   │   ├── tetris.js
│   │   └── tetris_styles.css
│   ├── 2048/           # 2048游戏
│   │   ├── 2048.html
│   │   ├── 2048.js
│   │   └── 2048_styles.css
│   └── snake/          # 贪吃蛇游戏
│       ├── snake.html
│       └── snake.js
├── music/              # 音乐练习模块
│   ├── music.js
│   └── music.css
├── forum/              # 论坛模块
│   ├── forum.html
│   ├── forum.js
│   └── forum.css
├── settings/           # 设置模块
│   ├── settings.html
│   └── settings.js
├── images/             # 图片资源
└── sounds/             # 音频资源
```

## 本地运行

只需用浏览器打开`index.html`文件即可在本地运行游戏平台。

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)

## 主题切换功能

我们的平台实现了完整的深色/浅色主题切换功能，用户可以根据自己的偏好选择适合的界面风格。主题切换系统具有以下特性：

1. **自动检测系统偏好**：首次访问网站时，会自动检测用户操作系统的主题设置，并应用相应的主题。
2. **用户偏好保存**：用户手动切换主题后，会将偏好保存在浏览器本地存储中，下次访问时自动应用。
3. **跨页面同步**：所有页面共享同一主题设置，确保一致的用户体验。
4. **响应式设计**：所有页面在不同主题下都能保持良好的可读性和视觉效果。

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

3. **支持iframe通信**：如果页面包含iframe，主题切换脚本会自动处理同源iframe的主题同步。

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

### 示例

下面是一个使用主题变量的简单例子：

```css
.music-player {
    background-color: var(--music-card-bg);
    color: var(--text-color);
    border-radius: 8px;
    box-shadow: 0 2px 5px var(--box-shadow-color);
    padding: 15px;
}

.play-button {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 20px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.play-button:hover {
    background-color: var(--button-hover);
    transform: translateY(-2px);
}
```

## 音乐模块移动端适配优化
### 2023.11.15更新
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
   - 防止默认触摸行为导致的延迟和双击缩放问题

这些优化确保音乐模块在移动设备上运行流畅，操作便捷，视觉体验与桌面端一致。
