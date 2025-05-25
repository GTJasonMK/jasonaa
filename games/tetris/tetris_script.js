// 游戏常量
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const SHAPES = {
    'I': [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    'O': [
        [1,1],
        [1,1]
    ],
    'T': [
        [0,1,0],
        [1,1,1],
        [0,0,0]
    ],
    'L': [
        [0,0,1],
        [1,1,1],
        [0,0,0]
    ],
    'J': [
        [1,0,0],
        [1,1,1],
        [0,0,0]
    ],
    'S': [
        [0,1,1],
        [1,1,0],
        [0,0,0]
    ],
    'Z': [
        [1,1,0],
        [0,1,1],
        [0,0,0]
    ]
};

// 游戏状态
let tetrisBoard = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
let currentPiece = null;
let currentPiecePosition = {x: 0, y: 0};
let nextPiece = null;
let gameInterval = null;
let isPaused = false;
let score = 0;
let level = 1;
let lines = 0;
let gameSpeed = 1000;
let isGameOver = false;
let isMobile = false;

// DOM 元素引用
let boardElement, nextPieceElement, scoreElement, levelElement, linesElement, gameOverElement;

// 检测移动设备
function detectMobile() {
    return window.innerWidth <= 768 || ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

// 初始化游戏
function initGame() {
    boardElement = document.querySelector('.tetris-board');
    nextPieceElement = document.querySelector('.next-piece');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    linesElement = document.getElementById('lines');
    gameOverElement = document.querySelector('.game-over-overlay');
    
    // 检测是否为移动设备
    isMobile = detectMobile();
    if (isMobile) {
        setupMobileControls();
    }
    
    // 初始化游戏板
    createBoard();
    
    // 初始化下一个方块预览区
    createNextPiecePreview();
    
    // 生成第一个方块
    nextPiece = generateRandomPiece();
    spawnNewPiece();
    
    // 设置键盘控制
    setupKeyboardControls();
    
    // 更新分数显示
    updateStats();
}

// 创建游戏板
function createBoard() {
    boardElement.innerHTML = '';
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const cell = document.createElement('div');
            cell.className = 'tetris-cell';
            cell.setAttribute('data-x', x);
            cell.setAttribute('data-y', y);
            boardElement.appendChild(cell);
        }
    }
}

// 创建下一个方块预览区
function createNextPiecePreview() {
    nextPieceElement.innerHTML = '';
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const cell = document.createElement('div');
            cell.className = 'tetris-cell';
            nextPieceElement.appendChild(cell);
        }
    }
}

// 生成随机方块
function generateRandomPiece() {
    const pieces = Object.keys(SHAPES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
        shape: randomPiece,
        matrix: SHAPES[randomPiece],
        color: getPieceColor(randomPiece),
    };
}

// 获取方块颜色
function getPieceColor(shape) {
    const colors = {
        'I': 'i-block',
        'O': 'o-block',
        'T': 't-block',
        'L': 'l-block',
        'J': 'j-block',
        'S': 's-block',
        'Z': 'z-block'
    };
    return colors[shape] || '';
}

// 生成新方块
function spawnNewPiece() {
    currentPiece = nextPiece;
    nextPiece = generateRandomPiece();
    
    // 计算X坐标，使方块居中出现
    const pieceWidth = currentPiece.matrix[0].length;
    currentPiecePosition = {
        x: Math.floor((BOARD_WIDTH - pieceWidth) / 2),
        y: 0
    };
    
    // 如果新方块一生成就发生碰撞，则游戏结束
    if (checkCollision(currentPiecePosition.x, currentPiecePosition.y, currentPiece.matrix)) {
        gameOver();
        return;
    }
    
    // 更新游戏板和预览区
    drawBoard();
    updateNextPiecePreview();
}

// 更新下一个方块预览
function updateNextPiecePreview() {
    const previewCells = nextPieceElement.querySelectorAll('.tetris-cell');
    
    // 先清空所有单元格
    previewCells.forEach(cell => {
        cell.className = 'tetris-cell';
    });
    
    // 绘制下一个方块
    const matrix = nextPiece.matrix;
    const color = nextPiece.color;
    
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x]) {
                const index = y * 4 + x;
                if (previewCells[index]) {
                    previewCells[index].className = `tetris-cell ${color}`;
                }
            }
        }
    }
}

// 绘制游戏板
function drawBoard() {
    // 创建临时游戏板副本
    const tempBoard = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    
    // 复制当前固定的方块
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            tempBoard[y][x] = tetrisBoard[y][x];
        }
    }
    
    // 添加当前移动中的方块
    if (currentPiece) {
        const matrix = currentPiece.matrix;
        const pos = currentPiecePosition;
        
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] && pos.y + y >= 0) {
                    if (pos.y + y < BOARD_HEIGHT && pos.x + x < BOARD_WIDTH) {
                        tempBoard[pos.y + y][pos.x + x] = currentPiece.color;
                    }
                }
            }
        }
    }
    
    // 更新DOM
    const cells = boardElement.querySelectorAll('.tetris-cell');
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const index = y * BOARD_WIDTH + x;
            cells[index].className = 'tetris-cell';
            if (tempBoard[y][x]) {
                cells[index].className = `tetris-cell ${tempBoard[y][x]}`;
            }
        }
    }
}

// 移动方块
function movePiece(dx, dy) {
    if (isPaused || isGameOver) return;
    
    const newX = currentPiecePosition.x + dx;
    const newY = currentPiecePosition.y + dy;
    
    if (!checkCollision(newX, newY, currentPiece.matrix)) {
        currentPiecePosition.x = newX;
        currentPiecePosition.y = newY;
        drawBoard();
        return true;
    }
    
    // 如果是向下移动并且发生碰撞，则固定方块
    if (dy > 0) {
        fixPiece();
        return false;
    }
    
    return false;
}

// 旋转方块
function rotatePiece() {
    if (isPaused || isGameOver) return;
    
    const matrix = currentPiece.matrix;
    const n = matrix.length;
    const rotated = Array(n).fill().map(() => Array(n).fill(0));
    
    // 旋转矩阵（顺时针90度）
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            rotated[x][n - 1 - y] = matrix[y][x];
        }
    }
    
    // 检查旋转后是否发生碰撞
    if (!checkCollision(currentPiecePosition.x, currentPiecePosition.y, rotated)) {
        currentPiece.matrix = rotated;
        drawBoard();
        return true;
    }
    
    // 尝试偏移旋转（墙踢）
    const offsets = [
        {x: 1, y: 0},   // 右移
        {x: -1, y: 0},  // 左移
        {x: 0, y: -1},  // 上移
        {x: 2, y: 0},   // 右移两格
        {x: -2, y: 0},  // 左移两格
    ];
    
    for (const offset of offsets) {
        if (!checkCollision(currentPiecePosition.x + offset.x, currentPiecePosition.y + offset.y, rotated)) {
            currentPiece.matrix = rotated;
            currentPiecePosition.x += offset.x;
            currentPiecePosition.y += offset.y;
            drawBoard();
            return true;
        }
    }
    
    return false;
}

// 检查碰撞
function checkCollision(x, y, matrix) {
    for (let row = 0; row < matrix.length; row++) {
        for (let col = 0; col < matrix[row].length; col++) {
            if (matrix[row][col]) {
                const newX = x + col;
                const newY = y + row;
                
                // 检查是否超出边界
                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }
                
                // 检查是否与固定的方块重叠
                if (newY >= 0 && tetrisBoard[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 固定当前方块
function fixPiece() {
    const pos = currentPiecePosition;
    const matrix = currentPiece.matrix;
    
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] && pos.y + y >= 0) {
                tetrisBoard[pos.y + y][pos.x + x] = currentPiece.color;
            }
        }
    }
    
    // 检查并清除完整的行
    checkLines();
    
    // 生成下一个方块
    spawnNewPiece();
}

// 快速下落（硬降）
function hardDrop() {
    if (isPaused || isGameOver) return;
    
    while (movePiece(0, 1)) {
        // 继续下落直到碰撞
        score += 2;  // 硬降每下落一格得2分
    }
    updateStats();
}

// 检查并清除完整的行
function checkLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (tetrisBoard[y].every(cell => cell)) {
            // 整行都有方块，清除该行
            tetrisBoard.splice(y, 1);
            tetrisBoard.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++; // 检查同一行（现在是新行）
        }
    }
    
    if (linesCleared > 0) {
        // 更新分数
        const linePoints = [0, 100, 300, 500, 800]; // 0,1,2,3,4行的得分
        score += linePoints[linesCleared] * level;
        lines += linesCleared;
        
        // 更新级别
        level = Math.floor(lines / 10) + 1;
        
        // 增加游戏速度
        gameSpeed = Math.max(100, 1000 - (level - 1) * 100);
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        // 更新统计显示
        updateStats();
    }
}

// 更新统计信息
function updateStats() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// 游戏主循环
function gameLoop() {
    if (!isPaused && !isGameOver) {
        movePiece(0, 1);
    }
}

// 开始游戏
function startGame() {
    if (isGameOver) {
        // 重新开始游戏
        resetGame();
    }
    
    if (!gameInterval) {
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
    
    document.getElementById('start-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    isPaused = false;
}

// 暂停游戏
function pauseGame() {
    if (gameInterval && !isGameOver) {
        if (isPaused) {
            // 恢复游戏
            document.getElementById('pause-btn').textContent = '暂停';
            isPaused = false;
        } else {
            // 暂停游戏
            document.getElementById('pause-btn').textContent = '继续';
            isPaused = true;
        }
    }
}

// 重置游戏
function resetGame() {
    // 清除游戏计时器
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    // 重置游戏状态
    tetrisBoard = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    currentPiece = null;
    nextPiece = generateRandomPiece();
    score = 0;
    level = 1;
    lines = 0;
    gameSpeed = 1000;
    isPaused = false;
    isGameOver = false;
    
    // 重置DOM元素
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('pause-btn').textContent = '暂停';
    
    // 隐藏游戏结束界面
    gameOverElement.style.display = 'none';
    
    // 重新初始化游戏板
    createBoard();
    
    // 重新初始化下一个方块预览区
    createNextPiecePreview();
    
    // 生成第一个方块
    spawnNewPiece();
    
    // 更新分数显示
    updateStats();
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    
    gameOverElement.style.display = 'flex';
    document.querySelector('.game-over-overlay .final-score').textContent = score;
}

// 设置键盘控制
function setupKeyboardControls() {
    document.addEventListener('keydown', function(event) {
        if (isGameOver) return;
        
        switch (event.keyCode) {
            case 37: // 左箭头
                movePiece(-1, 0);
                event.preventDefault();
                break;
            case 39: // 右箭头
                movePiece(1, 0);
                event.preventDefault();
                break;
            case 40: // 下箭头
                movePiece(0, 1);
                event.preventDefault();
                break;
            case 38: // 上箭头
                rotatePiece();
                event.preventDefault();
                break;
            case 32: // 空格
                hardDrop();
                event.preventDefault(); // 阻止空格键导致页面滚动
                break;
            case 80: // P键
                pauseGame();
                event.preventDefault();
                break;
        }
    });
}

// 设置移动端控制
function setupMobileControls() {
    // 触摸滑动控制
    let touchStartX, touchStartY;
    let touchStartTime;
    let lastTapTime = 0;
    
    boardElement.addEventListener('touchstart', function(e) {
        const rect = boardElement.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;
        
        // 只在游戏区域内阻止默认行为
        if (touchX >= 0 && touchX <= boardElement.offsetWidth && touchY >= 0 && touchY <= boardElement.offsetHeight) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = new Date().getTime();
            e.preventDefault(); // 防止页面滚动
        }
    }, { passive: false });
    
    boardElement.addEventListener('touchmove', function(e) {
        if (!touchStartX || !touchStartY) return;
        
        const rect = boardElement.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;
        
        // 只在游戏区域内阻止默认行为
        if (touchX >= 0 && touchX <= boardElement.offsetWidth && touchY >= 0 && touchY <= boardElement.offsetHeight) {
            e.preventDefault(); // 防止页面滚动
        }
    }, { passive: false });
    
    boardElement.addEventListener('touchend', function(e) {
        if (!touchStartX || !touchStartY) return;
        
        const rect = boardElement.getBoundingClientRect();
        const touchX = e.changedTouches[0].clientX - rect.left;
        const touchY = e.changedTouches[0].clientY - rect.top;
        
        // 只在游戏区域内处理触摸结束事件
        if (touchX >= 0 && touchX <= boardElement.offsetWidth && touchY >= 0 && touchY <= boardElement.offsetHeight) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndTime = new Date().getTime();
            
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;
            
            // 判断是否是快速点击（双击用于硬降）
            const tapLength = touchEndTime - touchStartTime;
            if (tapLength < 200 && Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
                // 检查是否是双击
                const currentTime = new Date().getTime();
                const tapInterval = currentTime - lastTapTime;
                if (tapInterval < 300) {
                    // 双击实现硬降
                    hardDrop();
                    lastTapTime = 0;
                } else {
                    lastTapTime = currentTime;
                }
                touchStartX = null;
                touchStartY = null;
                return;
            }
            
            // 需要的最小滑动距离
            const minSwipeDistance = 30;
            
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // 水平滑动
                if (Math.abs(diffX) > minSwipeDistance) {
                    if (diffX > 0) {
                        // 向右滑动
                        movePiece(1, 0);
                    } else {
                        // 向左滑动
                        movePiece(-1, 0);
                    }
                }
            } else {
                // 垂直滑动
                if (Math.abs(diffY) > minSwipeDistance) {
                    if (diffY > 0) {
                        // 向下滑动
                        movePiece(0, 1);
                    } else {
                        // 向上滑动
                        rotatePiece();
                    }
                }
            }
        }
        
        touchStartX = null;
        touchStartY = null;
    }, { passive: true });
}

// 窗口加载完毕后初始化游戏
window.addEventListener('DOMContentLoaded', function() {
    initGame();
    
    // 绑定按钮事件
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.querySelector('.game-over-overlay button').addEventListener('click', resetGame);
}); 