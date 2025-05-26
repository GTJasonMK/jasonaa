document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const scoreElement = document.getElementById('score');
    
    // 创建等级显示元素
    const levelDisplay = document.createElement('div');
    levelDisplay.className = 'level-display';
    levelDisplay.innerHTML = '<span>等级: </span><span id="level">1</span>';
    
    // 将等级显示添加到分数容器之后
    const scoreContainer = document.querySelector('.score-container');
    scoreContainer.appendChild(levelDisplay);
    
    const levelElement = document.getElementById('level');
    
    // 检测是否为移动设备
    const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 || 
                           navigator.msMaxTouchPoints > 0;
    
    // 等级系统配置
    const levelConfig = {
        1: { scoreThreshold: 0, speed: 150 },
        2: { scoreThreshold: 50, speed: 130 },
        3: { scoreThreshold: 100, speed: 110 },
        4: { scoreThreshold: 200, speed: 90 },
        5: { scoreThreshold: 350, speed: 80 },
        6: { scoreThreshold: 500, speed: 70 },
        7: { scoreThreshold: 700, speed: 60 },
        8: { scoreThreshold: 1000, speed: 50 },
        9: { scoreThreshold: 1500, speed: 45 },
        10: { scoreThreshold: 2000, speed: 40 }
    };
    
    // 游戏配置
    const gridSize = 20; // 网格大小
    
    // 游戏状态
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let level = 1;
    let gameInterval;
    let isRunning = false;
    
    // 触摸控制变量
    let touchStartX = 0;
    let touchStartY = 0;

    // 颜色
    const colors = {
        background: '#eee',
        snake: '#4CAF50',
        snakeHead: '#2E7D32',
        food: '#FF5722',
        border: '#ddd'
    };
    
    // 检查和更新等级
    function checkAndUpdateLevel() {
        let newLevel = 1;
        
        // 找到当前分数对应的最高等级
        for (let l = 10; l >= 1; l--) {
            if (score >= levelConfig[l].scoreThreshold) {
                newLevel = l;
                break;
            }
        }
        
        // 如果等级提高，显示提示并调整游戏速度
        if (newLevel > level) {
            level = newLevel;
            levelElement.textContent = level;
            
            // 更新游戏速度
            if (isRunning) {
                clearInterval(gameInterval);
                gameInterval = setInterval(moveSnake, levelConfig[level].speed);
            }
            
            // 显示等级提升提示
            showLevelUpMessage();
        }
    }
    
    // 显示等级提升消息
    function showLevelUpMessage() {
        const message = document.createElement('div');
        message.className = 'level-up-message';
        message.textContent = `升级到 ${level} 级!`;
        document.querySelector('.game-container').appendChild(message);
        
        // 添加CSS样式
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
        message.style.color = 'white';
        message.style.padding = '10px 20px';
        message.style.borderRadius = '5px';
        message.style.fontSize = '24px';
        message.style.fontWeight = 'bold';
        message.style.zIndex = '100';
        message.style.animation = 'fadeInOut 2s';
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                30% { transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // 2秒后删除消息
        setTimeout(() => {
            message.remove();
            style.remove();
        }, 2000);
    }

    // 加载游戏设置
    function loadGameSettings() {
        // 默认设置
        gameSpeed = 150; // 默认游戏速度（毫秒）
        snakeColor = '#4CAF50'; // 默认蛇身颜色
        snakeHeadColor = '#2E7D32'; // 默认蛇头颜色
        wallCollision = true; // 默认启用墙壁碰撞
        specialFoodChance = 0.1; // 特殊食物出现概率
        specialFoodMultiplier = 3; // 特殊食物倍率
        speedDecreasePerPoint = 2; // 每得分减少的速度值
        minSpeed = 50; // 最小速度限制
        
        // 尝试从settingsManager加载设置
        if (window.settingsManager) {
            try {
                console.log('尝试从settingsManager加载贪吃蛇游戏设置');
                // 检查设置是否有更新
                window.settingsManager.checkSettingsUpdated();
                const settings = window.settingsManager.settings;
                console.log('settingsManager返回的设置对象:', settings);
                
                // 加载通用游戏设置
                if (settings && settings.games) {
                    console.log('加载通用游戏设置, snakeColor = ', settings.games.snakeColor);
                    // 设置蛇的颜色
                    if (settings.games.snakeColor) {
                        switch (settings.games.snakeColor) {
                            case 'green':
                                snakeColor = '#4CAF50';
                                snakeHeadColor = '#2E7D32';
                                break;
                            case 'blue':
                                snakeColor = '#2196F3';
                                snakeHeadColor = '#0D47A1';
                                break;
                            case 'red':
                                snakeColor = '#F44336';
                                snakeHeadColor = '#B71C1C';
                                break;
                            case 'yellow':
                                snakeColor = '#FFC107';
                                snakeHeadColor = '#FF8F00';
                                break;
                            case 'rainbow':
                                snakeColor = 'rainbow'; // 特殊值，在绘制时处理
                                snakeHeadColor = '#FF5722';
                                break;
                            default:
                                // 使用默认颜色
                                break;
                        }
                    }
                }
                
                // 加载贪吃蛇专用设置
                if (settings && settings.snake) {
                    console.log('加载贪吃蛇专用设置:', settings.snake);
                    // 初始速度
                    gameSpeed = settings.snake.initialSpeed || gameSpeed;
                    console.log('设置游戏速度:', gameSpeed);
                    
                    // 速度衰减率
                    speedDecreasePerPoint = settings.snake.speedDecreasePerPoint || speedDecreasePerPoint;
                    console.log('设置速度衰减率:', speedDecreasePerPoint);
                    
                    // 最小速度限制
                    minSpeed = settings.snake.minSpeed || minSpeed;
                    console.log('设置最小速度:', minSpeed);
                    
                    // 墙壁碰撞
                    wallCollision = settings.snake.wallCollision !== undefined ? 
                        settings.snake.wallCollision : wallCollision;
                    console.log('设置墙壁碰撞:', wallCollision);
                        
                    // 特殊食物概率和倍率
                    specialFoodChance = settings.snake.specialFoodChance || specialFoodChance;
                    specialFoodMultiplier = settings.snake.specialFoodScoreMultiplier || specialFoodMultiplier;
                    console.log('设置特殊食物概率:', specialFoodChance, '特殊食物倍率:', specialFoodMultiplier);
                    
                    // 根据用户设置调整等级配置
                    for (let level in levelConfig) {
                        // 设置每个等级的分数阈值，保持相对比例
                        levelConfig[level].scoreThreshold = Math.round(levelConfig[level].scoreThreshold / 150 * gameSpeed);
                        
                        // 调整每级速度，保持相对差距
                        const levelRatio = (11 - parseInt(level)) / 10; // 级别越高，速度越快
                        levelConfig[level].speed = Math.max(
                            Math.round(gameSpeed * levelRatio),
                            minSpeed
                        );
                    }
                    
                    console.log('已从settingsManager加载贪吃蛇游戏设置');
                }
            } catch (e) {
                console.error('加载贪吃蛇游戏设置时出错:', e);
            }
        }
        
        // 更新颜色
        colors.snake = snakeColor;
        colors.snakeHead = snakeHeadColor;
    }
    
    // 初始化游戏
    function initGame() {
        // 加载最新设置
        loadGameSettings();
        
        clearInterval(gameInterval);
        isRunning = false;
        score = 0;
        level = 1;
        scoreElement.textContent = '0';
        levelElement.textContent = '1';
        direction = 'right';
        nextDirection = 'right';
        
        // 初始蛇的位置（3个格子长的蛇）
        snake = [
            {x: 5, y: 10},
            {x: 4, y: 10},
            {x: 3, y: 10}
        ];
        
        generateFood();
        drawGame();
        startBtn.textContent = '开始游戏';
    }

    // 生成食物
    function generateFood() {
        const maxX = canvas.width / gridSize - 1;
        const maxY = canvas.height / gridSize - 1;
        
        // 随机生成食物位置
        let newFood;
        let onSnake;
        
        do {
            onSnake = false;
            newFood = {
                x: Math.floor(Math.random() * maxX) + 1,
                y: Math.floor(Math.random() * maxY) + 1
            };

            // 确保食物不在蛇身上
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === newFood.x && snake[i].y === newFood.y) {
                    onSnake = true;
                    break;
                }
            }
        } while (onSnake);
        
        food = newFood;
        
        // 设置食物基础属性
        let baseValue = Math.min(level, 5) * 10; // 食物价值随等级提高
        
        // 判断是否生成特殊食物
        let isSpecial = Math.random() < specialFoodChance;
        
        // 设置食物类型和属性
        if (isSpecial) {
            // 特殊食物有更高的值和不同颜色
            food.color = '#FFEB3B'; // 特殊食物用黄色
            food.value = Math.floor(baseValue * specialFoodMultiplier);
            food.isSpecial = true;
            food.specialType = Math.floor(Math.random() * 3); // 0-2的特殊类型
        } else {
            // 普通食物
            const foodColors = ['#FF5722', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0'];
            food.color = foodColors[Math.min(level - 1, 4)];
            food.value = baseValue;
            food.isSpecial = false;
        }
    }

    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            // 根据配置选择蛇的颜色
            if (colors.snake === 'rainbow' && index !== 0) {
                // 彩虹模式：每个部分不同颜色
                const hue = (index * 30) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            } else {
                ctx.fillStyle = index === 0 ? colors.snakeHead : colors.snake;
            }
            
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            ctx.strokeStyle = colors.background;
            ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        });
        
        // 绘制食物
        ctx.fillStyle = food.color || colors.food;
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        ctx.strokeStyle = colors.background;
        ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        
        // 如果是特殊食物，添加闪光效果
        if (food.isSpecial) {
            // 添加闪光效果
            const time = Date.now() % 1000 / 1000;
            const glowSize = 2 + Math.sin(time * Math.PI * 2) * 2;
            
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                food.x * gridSize - glowSize, 
                food.y * gridSize - glowSize, 
                gridSize + glowSize * 2, 
                gridSize + glowSize * 2
            );
            
            // 恢复线宽
            ctx.lineWidth = 1;
        }
        
        // 在食物上显示其价值（如果不是基础值的话）
        if (food.value > 10) {
            ctx.font = '10px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(food.value, food.x * gridSize + gridSize/2, food.y * gridSize + gridSize/2 + 3);
        }
    }

    // 移动蛇
    function moveSnake() {
        // 更新方向
        direction = nextDirection;
        
        // 获取蛇头
        const head = Object.assign({}, snake[0]);
        
        // 根据方向移动
        switch (direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // 检查是否撞墙
        if (wallCollision) {
            // 启用墙壁碰撞时检查边界
            if (head.x < 0 || head.y < 0 || 
                head.x >= canvas.width / gridSize || 
                head.y >= canvas.height / gridSize) {
                gameOver();
                return;
            }
        } else {
            // 穿墙模式：从另一侧出现
            if (head.x < 0) head.x = Math.floor(canvas.width / gridSize) - 1;
            if (head.y < 0) head.y = Math.floor(canvas.height / gridSize) - 1;
            if (head.x >= canvas.width / gridSize) head.x = 0;
            if (head.y >= canvas.height / gridSize) head.y = 0;
        }
        
        // 检查是否撞到自己
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver();
                return;
            }
        }
        
        // 将新头部添加到蛇数组前面
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数，根据食物价值
            score += food.value || 10;
            scoreElement.textContent = score;
            
            // 检查等级
            checkAndUpdateLevel();
            
            // 生成新食物
            generateFood();
        } else {
            // 如果没有吃到食物，则移除尾部
            snake.pop();
        }
        
        // 更新游戏
        drawGame();
    }

    // 游戏结束
    function gameOver() {
        clearInterval(gameInterval);
        isRunning = false;
        startBtn.textContent = '开始新游戏';
        
        // 显示游戏结束消息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Microsoft YaHei';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`达到等级: ${level}`, canvas.width / 2, canvas.height / 2 + 30);
        
        // 保存最高分
        const highScore = localStorage.getItem('snake_high_score') || 0;
        if (score > highScore) {
            localStorage.setItem('snake_high_score', score);
            ctx.fillText('新纪录!', canvas.width / 2, canvas.height / 2 + 60);
        }
    }

    // 开始游戏
    function startGame() {
        if (isRunning) {
            clearInterval(gameInterval);
            isRunning = false;
            startBtn.textContent = '继续游戏';
        } else {
            isRunning = true;
            startBtn.textContent = '暂停游戏';
            gameInterval = setInterval(moveSnake, levelConfig[level].speed);
        }
    }
    
    // 更改方向
    function changeDirection(newDirection) {
        // 防止180度转弯（蛇不能直接掉头）
        if ((newDirection === 'up' && direction !== 'down') ||
            (newDirection === 'down' && direction !== 'up') ||
            (newDirection === 'left' && direction !== 'right') ||
            (newDirection === 'right' && direction !== 'left')) {
            nextDirection = newDirection;
        }
    }

    // 键盘事件监听
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                event.preventDefault(); // 阻止页面滚动
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                event.preventDefault(); // 阻止页面滚动
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                event.preventDefault(); // 阻止页面滚动
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                event.preventDefault(); // 阻止页面滚动
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ':
                event.preventDefault(); // 阻止页面滚动
                // 空格键暂停/继续游戏
                if (isRunning || startBtn.textContent === '继续游戏') {
                    startGame();
                }
                break;
        }
    });
    
    // 触摸事件 - 判断是否在游戏区域内
    function isInCanvas(e) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        return touchX >= 0 && touchX <= canvas.width && 
               touchY >= 0 && touchY <= canvas.height;
    }
    
    // 触摸事件监听 - 滑动控制
    if (isTouchDevice) {
    canvas.addEventListener('touchstart', (e) => {
            if (isInCanvas(e)) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault(); // 防止页面滚动
            }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY) return;
        
            if (isInCanvas(e)) {
        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // 判断滑动方向（水平或垂直滑动距离更大的方向）
                // 增加最小滑动距离阈值，避免意外触发
                const minSwipeDistance = 20;
                
                if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) {
                    return; // 滑动距离太小，可能是意外触摸
                }
                
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            changeDirection(dx > 0 ? 'right' : 'left');
        } else {
            // 垂直滑动
            changeDirection(dy > 0 ? 'down' : 'up');
        }
        
        // 重置起始点，允许在同一次触摸中多次改变方向
        touchStartX = touchEndX;
        touchStartY = touchEndY;
        e.preventDefault(); // 防止页面滚动
            }
    }, { passive: false });
    
        canvas.addEventListener('touchend', (e) => {
        touchStartX = 0;
        touchStartY = 0;
        e.preventDefault(); // 防止页面滚动
        }, { passive: false });
    }
    
    // 按钮通用事件处理函数
    function setupButton(button, clickHandler) {
        // 点击事件
        button.addEventListener('click', clickHandler);
        
        // 触摸设备额外处理
        if (isTouchDevice) {
            // 添加触摸反馈样式
            button.addEventListener('touchstart', () => {
                button.classList.add('touch-active');
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                button.classList.remove('touch-active');
                // 不在这里调用clickHandler，让系统的click事件处理
            }, { passive: true });
        }
    }
    
    // 设置开始/暂停按钮
    setupButton(startBtn, () => {
        console.log('开始/暂停按钮被点击');
        if (startBtn.textContent === '开始新游戏') {
            initGame();
        }
        startGame();
    });
    
    // 设置重置按钮
    setupButton(resetBtn, () => {
        console.log('重置按钮被点击');
            initGame();
    });

    // 调整画布大小，确保在不同设备上显示正确
    function resizeCanvas() {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        
        // 保持画布为正方形
        const size = Math.min(containerWidth, 400);
        
        canvas.width = size;
        canvas.height = size;
        
        // 重新绘制游戏
        drawGame();
    }
    
    // 窗口大小变化时调整画布
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化
    resizeCanvas();
    initGame();
}); 