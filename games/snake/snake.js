document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const scoreElement = document.getElementById('score');
    
    // 从设置管理器加载设置
    let gameSpeed = 150; // 默认游戏速度（毫秒）
    let snakeColor = '#4CAF50'; // 默认蛇身颜色
    let snakeHeadColor = '#2E7D32'; // 默认蛇头颜色
    
    // 尝试从settingsManager加载设置
    if (window.settingsManager) {
        try {
            const settings = window.settingsManager.loadUserSettings();
            if (settings && settings.games) {
                // 游戏速度: 1-10，值越大速度越快，转换为实际速度: 200-50ms
                const speedValue = settings.games.gameSpeed || 5;
                gameSpeed = Math.round(200 - (speedValue * 15));
                
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
                        case 'purple':
                            snakeColor = '#9C27B0';
                            snakeHeadColor = '#4A148C';
                            break;
                        case 'orange':
                            snakeColor = '#FF9800';
                            snakeHeadColor = '#E65100';
                            break;
                        default:
                            // 使用默认颜色
                            break;
                    }
                }
                
                console.log('已从settingsManager加载Snake游戏设置');
            }
        } catch (e) {
            console.error('加载Snake游戏设置时出错:', e);
        }
    }

    // 游戏配置
    const gridSize = 20; // 网格大小
    
    // 游戏状态
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let gameInterval;
    let isRunning = false;
    
    // 触摸控制变量
    let touchStartX = 0;
    let touchStartY = 0;

    // 颜色
    const colors = {
        background: '#eee',
        snake: snakeColor,
        snakeHead: snakeHeadColor,
        food: '#FF5722',
        border: '#ddd'
    };

    // 初始化游戏
    function initGame() {
        clearInterval(gameInterval);
        isRunning = false;
        score = 0;
        scoreElement.textContent = '0';
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
    }

    // 绘制游戏
    function drawGame() {
        // 清空画布
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? colors.snakeHead : colors.snake;
            ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
            ctx.strokeStyle = colors.background;
            ctx.strokeRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
        });
        
        // 绘制食物
        ctx.fillStyle = colors.food;
        ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
        ctx.strokeStyle = colors.background;
        ctx.strokeRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
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
        if (head.x < 0 || head.y < 0 || 
            head.x >= canvas.width / gridSize || 
            head.y >= canvas.height / gridSize) {
            gameOver();
            return;
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
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
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
        startBtn.textContent = '重新开始';
        
        // 显示游戏结束消息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Microsoft YaHei';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    }

    // 开始游戏
    function startGame() {
        if (isRunning) {
            clearInterval(gameInterval);
            isRunning = false;
            startBtn.textContent = '暂停游戏';
        } else {
            isRunning = true;
            startBtn.textContent = '暂停游戏';
            gameInterval = setInterval(moveSnake, gameSpeed);
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
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ':
                // 空格键暂停/继续游戏
                if (isRunning || startBtn.textContent === '继续游戏') {
                    startGame();
                }
                break;
        }
    });
    
    // 触摸事件监听 - 滑动控制
    canvas.addEventListener('touchstart', (e) => {
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;
        
        // 只有当触摸在Canvas区域内时才阻止默认行为
        if (touchX >= 0 && touchX <= canvas.width && touchY >= 0 && touchY <= canvas.height) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault(); // 防止页面滚动
        }
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        try {
            const rect = canvas.getBoundingClientRect();
            const touchX = e.touches[0].clientX - rect.left;
            const touchY = e.touches[0].clientY - rect.top;
            
            // 只有当触摸在Canvas区域内时才阻止默认行为
            if (touchX >= 0 && touchX <= canvas.width && touchY >= 0 && touchY <= canvas.height) {
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
        } catch (error) {
            console.error('处理触摸事件时出错:', error);
        }
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        touchStartX = 0;
        touchStartY = 0;
    }, { passive: true });
    
    // 按钮点击事件
    startBtn.addEventListener('click', function() {
        console.log('点击开始按钮');
        if (startBtn.textContent === '重新开始') {
            initGame();
        }
        startGame();
    });
    
    // 为开始按钮也添加touchend事件，因为在移动设备上可能触发不了click事件
    startBtn.addEventListener('touchend', function() {
        console.log('触摸开始按钮');
        if (startBtn.textContent === '重新开始') {
            initGame();
        }
        startGame();
    }, { passive: true });

    // 初始化游戏
    initGame();
}); 