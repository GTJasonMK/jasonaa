/**
 * 贪吃蛇游戏 - 基于GameBase v2.0架构的优化版
 *
 * 功能特性：
 * - 10级等级系统（使用LevelSystem自动管理）
 * - 特殊食物（黄色闪光，价值倍增）
 * - 彩虹蛇模式
 * - 墙壁碰撞/穿墙模式
 * - 响应式画布
 * - 统一触摸手势控制（TouchGestureHandler）
 * - 统一通知系统（NotificationSystem）
 * - 完整的键盘控制
 * - 暂停/继续功能
 */

class SnakeGame extends GameBase {
    constructor() {
        super('snake', {
            enableAutoCleanup: true,
            enableNotifications: true
        });

        // 游戏配置（从设置加载或使用默认值）
        this.config = {
            gridSize: 20,
            initialSpeed: this.settings.initialSpeed || 150,
            minSpeed: this.settings.minSpeed || 50,
            speedDecreasePerPoint: this.settings.speedDecreasePerPoint || 2,
            wallCollision: this.settings.wallCollision !== undefined ?
                           this.settings.wallCollision : true,
            specialFoodChance: this.settings.specialFoodChance || 0.1,
            specialFoodMultiplier: this.settings.specialFoodScoreMultiplier || 3
        };

        // 等级配置
        this.levelConfig = this.generateLevelConfig();

        // 设置等级系统（使用 GameBase v2.0 的 LevelSystem）
        this.setupLevelSystem(this.levelConfig, {
            onLevelUp: (oldLevel, newLevel) => {
                // 显示等级提升通知
                this.notify.levelUp(newLevel, 2000);

                // 更新游戏速度
                if (this.state.isRunning && this.gameLoopInterval) {
                    this.resourceManager.clearInterval(this.gameLoopInterval);
                    const newSpeed = this.levelConfig[newLevel].speed;
                    this.gameLoopInterval = this.setInterval(() => {
                        if (!this.state.isPaused) {
                            this.gameLoop();
                        }
                    }, newSpeed);
                }
            }
        });

        // 游戏状态
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.nextDirection = 'right';
        this.gameLoopInterval = null;
        this.isGameStarted = false;

        // 颜色配置
        this.colors = this.loadColorConfig();

        // 获取DOM元素
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.scoreElement = document.getElementById('score');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');

        // 创建等级显示元素
        this.createLevelDisplay();

        // 初始化游戏
        this.init();
    }

    /**
     * 创建等级显示元素
     */
    createLevelDisplay() {
        const levelDisplay = document.createElement('div');
        levelDisplay.className = 'level-display';
        levelDisplay.innerHTML = '<span>等级: </span><span id="level">1</span>';

        const scoreContainer = document.querySelector('.score-container');
        if (scoreContainer) {
            scoreContainer.appendChild(levelDisplay);
        }

        this.levelElement = document.getElementById('level');
    }

    /**
     * 生成等级配置
     */
    generateLevelConfig() {
        const config = {};
        const baseSpeed = this.config.initialSpeed;
        const minSpeed = this.config.minSpeed;

        for (let level = 1; level <= 10; level++) {
            const scoreThreshold = [0, 50, 100, 200, 350, 500, 700, 1000, 1500, 2000][level - 1];
            const levelRatio = (11 - level) / 10;
            const speed = Math.max(
                Math.round(baseSpeed * levelRatio),
                minSpeed
            );

            config[level] = {
                scoreThreshold,
                speed
            };
        }

        return config;
    }

    /**
     * 加载颜色配置
     */
    loadColorConfig() {
        const defaultColors = {
            background: '#eee',
            snake: '#4CAF50',
            snakeHead: '#2E7D32',
            food: '#FF5722',
            border: '#ddd'
        };

        // 从设置加载颜色
        const colorSetting = this.settings.snakeColor ||
                            (window.settingsManager?.settings?.games?.snakeColor);

        if (colorSetting) {
            switch (colorSetting) {
                case 'blue':
                    defaultColors.snake = '#2196F3';
                    defaultColors.snakeHead = '#0D47A1';
                    break;
                case 'red':
                    defaultColors.snake = '#F44336';
                    defaultColors.snakeHead = '#B71C1C';
                    break;
                case 'yellow':
                    defaultColors.snake = '#FFC107';
                    defaultColors.snakeHead = '#FF8F00';
                    break;
                case 'rainbow':
                    defaultColors.snake = 'rainbow';
                    defaultColors.snakeHead = '#FF5722';
                    break;
            }
        }

        return defaultColors;
    }

    /**
     * 初始化游戏
     */
    init() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas元素未找到');
            return;
        }

        // 设置控制
        this.setupControls();

        // 调整画布大小
        this.resizeCanvas();

        // 监听窗口大小变化
        this.on(window, 'resize', () => this.resizeCanvas());

        // 重置游戏状态
        this.resetGame();
    }

    /**
     * 设置控制
     */
    setupControls() {
        // 键盘控制
        this.on(document, 'keydown', (e) => this.handleKeyDown(e));

        // 移动端触摸控制（使用 GameBase v2.0 的 TouchGestureHandler）
        if (this.deviceInfo.hasTouch) {
            const touchHandler = new TouchGestureHandler(this.canvas, {
                minSwipeDistance: 20
            });

            touchHandler.enableSwipe((gesture) => {
                const direction = gesture.direction; // 'up', 'down', 'left', 'right'
                this.changeDirection(direction);
            });
        }

        // 按钮控制
        if (this.startBtn) {
            this.on(this.startBtn, 'click', () => this.handleStartButton());
            if (this.deviceInfo.hasTouch) {
                this.on(this.startBtn, 'touchstart', () => {
                    this.startBtn.classList.add('touch-active');
                }, { passive: true });
                this.on(this.startBtn, 'touchend', () => {
                    this.startBtn.classList.remove('touch-active');
                }, { passive: true });
            }
        }

        if (this.resetBtn) {
            this.on(this.resetBtn, 'click', () => this.resetGame());
            if (this.deviceInfo.hasTouch) {
                this.on(this.resetBtn, 'touchstart', () => {
                    this.resetBtn.classList.add('touch-active');
                }, { passive: true });
                this.on(this.resetBtn, 'touchend', () => {
                    this.resetBtn.classList.remove('touch-active');
                }, { passive: true });
            }
        }
    }

    /**
     * 处理键盘输入
     */
    handleKeyDown(e) {
        const directionMap = {
            'ArrowUp': 'up', 'w': 'up', 'W': 'up',
            'ArrowDown': 'down', 's': 'down', 'S': 'down',
            'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
            'ArrowRight': 'right', 'd': 'right', 'D': 'right'
        };

        const newDirection = directionMap[e.key];

        if (newDirection) {
            e.preventDefault();
            this.changeDirection(newDirection);
        }

        // 空格键暂停/继续
        if (e.key === ' ') {
            e.preventDefault();
            // 只有游戏已开始（无论运行还是暂停）才能用空格键切换
            if (this.isGameStarted) {
                this.toggleGame();
            }
        }
    }

    /**
     * 改变方向
     */
    changeDirection(newDirection) {
        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[newDirection] !== this.direction) {
            this.nextDirection = newDirection;
        }
    }

    /**
     * 处理开始按钮
     */
    handleStartButton() {
        if (this.startBtn.textContent === '开始新游戏') {
            this.resetGame();
        }
        this.toggleGame();
    }

    /**
     * 切换游戏状态
     */
    toggleGame() {
        // 如果游戏已暂停，则恢复游戏
        if (this.state.isPaused) {
            this.startGame();
        }
        // 如果游戏正在运行（未暂停），则暂停游戏
        else if (this.state.isRunning) {
            this.pauseGame();
        }
        // 如果游戏未开始，则开始游戏
        else {
            this.startGame();
        }
    }

    /**
     * 开始游戏
     */
    startGame() {
        // 如果已经在运行且只是暂停，则恢复游戏
        if (this.state.isRunning && this.state.isPaused) {
            super.resume();

            if (this.startBtn) {
                this.startBtn.textContent = '暂停游戏';
            }

            // 重新启动游戏循环
            const speed = this.levelConfig[this.state.level].speed;
            this.gameLoopInterval = this.setInterval(() => {
                if (!this.state.isPaused) {
                    this.gameLoop();
                }
            }, speed);
            return;
        }

        // 如果已经在运行且未暂停，直接返回
        if (this.state.isRunning) return;

        // 开始新游戏
        super.start();
        this.isGameStarted = true;

        if (this.startBtn) {
            this.startBtn.textContent = '暂停游戏';
        }

        const speed = this.levelConfig[this.state.level].speed;
        this.gameLoopInterval = this.setInterval(() => {
            if (!this.state.isPaused) {
                this.gameLoop();
            }
        }, speed);
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        super.pause();

        if (this.gameLoopInterval) {
            this.resourceManager.clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }

        if (this.startBtn) {
            this.startBtn.textContent = '继续游戏';
        }
    }

    /**
     * 重置游戏
     */
    resetGame() {
        // 清除旧的游戏循环
        if (this.gameLoopInterval) {
            this.resourceManager.clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }

        // 调用父类reset
        super.reset();

        this.isGameStarted = false;
        this.direction = 'right';
        this.nextDirection = 'right';

        // 初始化蛇
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];

        // 生成食物
        this.generateFood();

        // 更新UI
        this.updateUI();
        this.draw();

        if (this.startBtn) {
            this.startBtn.textContent = '开始游戏';
        }
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        this.direction = this.nextDirection;
        this.moveSnake();
        this.checkCollisions();
        this.draw();
    }

    /**
     * 移动蛇
     */
    moveSnake() {
        const head = { ...this.snake[0] };

        // 根据方向移动
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // 处理边界
        const maxX = Math.floor(this.canvas.width / this.config.gridSize);
        const maxY = Math.floor(this.canvas.height / this.config.gridSize);

        if (this.config.wallCollision) {
            // 撞墙结束
            if (head.x < 0 || head.y < 0 || head.x >= maxX || head.y >= maxY) {
                this.endGame();
                return;
            }
        } else {
            // 穿墙模式
            if (head.x < 0) head.x = maxX - 1;
            if (head.y < 0) head.y = maxY - 1;
            if (head.x >= maxX) head.x = 0;
            if (head.y >= maxY) head.y = 0;
        }

        // 添加新头部
        this.snake.unshift(head);

        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
        }
    }

    /**
     * 检查碰撞
     */
    checkCollisions() {
        const head = this.snake[0];

        // 检查自身碰撞
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.endGame();
                return;
            }
        }
    }

    /**
     * 吃到食物
     */
    eatFood() {
        // 更新分数
        const points = this.food.value || 10;
        this.updateScore(points);

        // 自动检查等级提升（使用 GameBase v2.0 的 LevelSystem）
        this.autoUpdateLevel();

        // 生成新食物
        this.generateFood();

        // 更新UI
        this.updateUI();
    }

    /**
     * 生成食物
     */
    generateFood() {
        const maxX = Math.floor(this.canvas.width / this.config.gridSize) - 1;
        const maxY = Math.floor(this.canvas.height / this.config.gridSize) - 1;

        let newFood;
        let onSnake;

        do {
            onSnake = false;
            newFood = {
                x: Math.floor(Math.random() * maxX) + 1,
                y: Math.floor(Math.random() * maxY) + 1
            };

            for (let segment of this.snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    onSnake = true;
                    break;
                }
            }
        } while (onSnake);

        // 设置食物属性
        const baseValue = Math.min(this.state.level, 5) * 10;
        const isSpecial = Math.random() < this.config.specialFoodChance;

        if (isSpecial) {
            newFood.color = '#FFEB3B';
            newFood.value = Math.floor(baseValue * this.config.specialFoodMultiplier);
            newFood.isSpecial = true;
        } else {
            const foodColors = ['#FF5722', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0'];
            newFood.color = foodColors[Math.min(this.state.level - 1, 4)];
            newFood.value = baseValue;
            newFood.isSpecial = false;
        }

        this.food = newFood;
    }

    /**
     * 绘制游戏
     */
    draw() {
        if (!this.ctx) return;

        // 清空画布
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制蛇
        this.snake.forEach((segment, index) => {
            if (this.colors.snake === 'rainbow' && index !== 0) {
                const hue = (index * 30) % 360;
                this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            } else {
                this.ctx.fillStyle = index === 0 ? this.colors.snakeHead : this.colors.snake;
            }

            this.ctx.fillRect(
                segment.x * this.config.gridSize,
                segment.y * this.config.gridSize,
                this.config.gridSize,
                this.config.gridSize
            );

            this.ctx.strokeStyle = this.colors.background;
            this.ctx.strokeRect(
                segment.x * this.config.gridSize,
                segment.y * this.config.gridSize,
                this.config.gridSize,
                this.config.gridSize
            );
        });

        // 绘制食物
        this.ctx.fillStyle = this.food.color || this.colors.food;
        this.ctx.fillRect(
            this.food.x * this.config.gridSize,
            this.food.y * this.config.gridSize,
            this.config.gridSize,
            this.config.gridSize
        );

        this.ctx.strokeStyle = this.colors.background;
        this.ctx.strokeRect(
            this.food.x * this.config.gridSize,
            this.food.y * this.config.gridSize,
            this.config.gridSize,
            this.config.gridSize
        );

        // 特殊食物闪光效果
        if (this.food.isSpecial) {
            const time = Date.now() % 1000 / 1000;
            const glowSize = 2 + Math.sin(time * Math.PI * 2) * 2;

            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                this.food.x * this.config.gridSize - glowSize,
                this.food.y * this.config.gridSize - glowSize,
                this.config.gridSize + glowSize * 2,
                this.config.gridSize + glowSize * 2
            );
            this.ctx.lineWidth = 1;
        }

        // 显示食物价值
        if (this.food.value > 10) {
            this.ctx.font = '10px Arial';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                this.food.value,
                this.food.x * this.config.gridSize + this.config.gridSize / 2,
                this.food.y * this.config.gridSize + this.config.gridSize / 2 + 3
            );
        }
    }

    /**
     * 更新UI
     */
    updateUI() {
        if (this.scoreElement) {
            this.scoreElement.textContent = this.state.score;
        }
        if (this.levelElement) {
            this.levelElement.textContent = this.state.level;
        }
    }

    /**
     * 结束游戏
     */
    endGame() {
        // 清除游戏循环
        if (this.gameLoopInterval) {
            this.resourceManager.clearInterval(this.gameLoopInterval);
            this.gameLoopInterval = null;
        }

        // 调用父类gameOver（自动保存最高分）
        super.gameOver();

        if (this.startBtn) {
            this.startBtn.textContent = '开始新游戏';
        }

        // 显示游戏结束界面
        this.drawGameOver();
    }

    /**
     * 绘制游戏结束界面
     */
    drawGameOver() {
        if (!this.ctx) return;

        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.font = '30px Microsoft YaHei';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏结束!', this.canvas.width / 2, this.canvas.height / 2 - 50);

        this.ctx.font = '20px Microsoft YaHei';
        this.ctx.fillText(`最终得分: ${this.state.score}`, this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.fillText(`达到等级: ${this.state.level}`, this.canvas.width / 2, this.canvas.height / 2 + 30);

        if (this.state.score === this.state.highScore && this.state.score > 0) {
            this.ctx.fillText('新纪录!', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
    }

    /**
     * 调整画布大小
     */
    resizeCanvas() {
        if (!this.canvas) return;

        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const size = Math.min(containerWidth, 400);

        this.canvas.width = size;
        this.canvas.height = size;

        this.draw();
    }
}

/**
 * 初始化游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    // 等待依赖加载
    if (typeof GameBase === 'undefined') {
        console.error('GameBase未加载！请确保已引入GameBase.js');
        return;
    }

    // 创建游戏实例
    window.snakeGame = new SnakeGame();

    console.log('贪吃蛇游戏已初始化（使用GameBase架构）');
    console.log('游戏统计:', window.snakeGame.getStats());
});
