document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('start-btn');
    const scoreElement = document.getElementById('score');

    // 游戏配置
    const gridSize = 20; // 网格大小
    const gameSpeed = 150; // 初始游戏速度（毫秒）
    
    // 游戏状态
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let score = 0;
    let gameInterval;
    let isRunning = false;

    // 颜色
    const colors = {
        background: '#eee',
        snake: '#4CAF50',
        snakeHead: '#2E7D32',
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
            startBtn.textContent = '继续游戏';
        } else {
            isRunning = true;
            startBtn.textContent = '暂停游戏';
            gameInterval = setInterval(moveSnake, gameSpeed);
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

    // 按钮点击事件
    startBtn.addEventListener('click', () => {
        if (startBtn.textContent === '重新开始') {
            initGame();
        }
        startGame();
    });

    // 初始化游戏
    initGame();
}); 