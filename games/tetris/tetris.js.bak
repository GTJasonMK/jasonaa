// 俄罗斯方块游戏核心逻辑

// 全局变量
let board = [];
let score = 0;
let level = 1;
let lines = 0;
let gameStarted = false;
let gamePaused = false;
let gameOver = false;
let currentPiece = null;
let dropInterval = null;
let dropSpeed = 1000;
let nextPiece = null;

// 游戏常量
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

// 方块定义
const PIECES = {
    'I': [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ],
    'O': [
        [[0,0,0,0], [0,1,1,0], [0,1,1,0], [0,0,0,0]]
    ],
    'T': [
        [[0,1,0], [1,1,1], [0,0,0]],
        [[0,1,0], [0,1,1], [0,1,0]],
        [[0,0,0], [1,1,1], [0,1,0]],
        [[0,1,0], [1,1,0], [0,1,0]]
    ]
};

// DOM元素
let boardElement;
let scoreElement;
let levelElement;
let linesElement;
let startButton;
let pauseButton;
let resetButton;

// 初始化游戏
function init() {
    // 获取DOM元素
    boardElement = document.getElementById('tetris-board');
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    linesElement = document.getElementById('lines');
    startButton = document.getElementById('start-btn');
    pauseButton = document.getElementById('pause-btn');
    resetButton = document.getElementById('reset-btn');
    
    if (!boardElement) {
        console.error('找不到游戏板元素');
        return;
    }
    
    // 初始化游戏板
    initBoard();
    
    // 设置按钮事件
    if (startButton) {
        startButton.onclick = startGame;
    }
    
    if (pauseButton) {
        pauseButton.onclick = togglePause;
        pauseButton.disabled = true;
    }
    
    if (resetButton) {
        resetButton.onclick = resetGame;
    }
    
    // 设置键盘事件 - 使用window级别而不是document级别，确保捕获所有键盘事件
    window.addEventListener('keydown', handleKeyDown);
    
    // 设置游戏结束后的重新开始按钮
    const restartButton = document.getElementById('restart-btn');
    if (restartButton) {
        restartButton.onclick = function() {
            const gameOverElement = document.getElementById('game-over');
            if (gameOverElement) {
                gameOverElement.style.display = 'none';
            }
            resetGame();
            startGame();
        };
    }
}

// 初始化游戏板
function initBoard() {
    if (!boardElement) return;
    
    board = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        board[y] = [];
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }
    
    // 创建视觉元素
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

// 创建新方块
function createPiece() {
    const types = Object.keys(PIECES);
    const type = types[Math.floor(Math.random() * types.length)];
    const shape = PIECES[type][0];
    
    // 计算起始位置（居中）
    const pieceWidth = shape[0].length;
    const x = Math.floor((BOARD_WIDTH - pieceWidth) / 2);
    
    return {
        type: type,
        shape: shape,
        x: x,
        y: 0
    };
}

// 绘制当前方块
function drawCurrentPiece() {
    if (!currentPiece) return;
    
    // 先清除所有临时方块
    clearPieces();
    
    // 绘制当前方块
    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                
                if (boardY >= 0) { // 只绘制可见区域
                    const cell = getCellAt(boardX, boardY);
                    if (cell) {
                        cell.className = `tetris-cell piece-${currentPiece.type}`;
                    }
                }
            }
        }
    }
}

// 获取特定位置的单元格
function getCellAt(x, y) {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) return null;
    const index = y * BOARD_WIDTH + x;
    return boardElement.children[index];
}

// 清除临时方块
function clearPieces() {
    const cells = boardElement.querySelectorAll('.tetris-cell');
    cells.forEach(cell => {
        // 保留固定的方块，清除临时方块
        if (!cell.hasAttribute('data-fixed')) {
            cell.className = 'tetris-cell';
        }
    });
}

// 绘制整个游戏板
function drawBoard() {
    if (!boardElement) return;
    
    const cells = boardElement.querySelectorAll('.tetris-cell');
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            const index = y * BOARD_WIDTH + x;
            const value = board[y][x];
            
            cells[index].className = 'tetris-cell';
            cells[index].removeAttribute('data-fixed');
            
            if (value) {
                cells[index].classList.add(`piece-${value}`);
                cells[index].setAttribute('data-fixed', 'true');
            }
        }
    }
}

// 检查碰撞
function checkCollision(shape, pieceX, pieceY) {
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = pieceX + x;
                const boardY = pieceY + y;
                
                // 检查边界
                if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
                    return true;
                }
                
                // 检查与其他方块碰撞（只检查在棋盘内的位置）
                if (boardY >= 0 && board[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 锁定当前方块
function lockPiece() {
    if (!currentPiece) return;
    
    const shape = currentPiece.shape;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardX = currentPiece.x + x;
                const boardY = currentPiece.y + y;
                
                if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
                    board[boardY][boardX] = currentPiece.type;
                }
            }
        }
    }
    
    // 检查并清除完整的行
    clearLines();
    
    // 更新游戏板
    drawBoard();
    
    // 使用下一个方块并创建新的下一个方块
    currentPiece = nextPiece;
    nextPiece = createPiece();
    
    // 绘制两个方块
    drawCurrentPiece();
    drawNextPiece();
    
    // 检查游戏是否结束
    if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
        endGame();
    }
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        let rowComplete = true;
        
        // 检查当前行是否全部填满
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (!board[y][x]) {
                rowComplete = false;
                break;
            }
        }
        
        if (rowComplete) {
            // 删除当前行
            for (let y2 = y; y2 > 0; y2--) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    board[y2][x] = board[y2-1][x];
                }
            }
            
            // 顶部添加新的空行
            for (let x = 0; x < BOARD_WIDTH; x++) {
                board[0][x] = 0;
            }
            
            linesCleared++;
            y++; // 重新检查当前行，因为上面的行已经下移
        }
    }
    
    if (linesCleared > 0) {
        // 更新分数
        score += linesCleared * 100 * level;
        lines += linesCleared;
        level = Math.floor(lines / 10) + 1;
        
        // 更新显示
        if (scoreElement) scoreElement.textContent = score;
        if (levelElement) levelElement.textContent = level;
        if (linesElement) linesElement.textContent = lines;
        
        // 更新下落速度
        dropSpeed = Math.max(100, 1000 - (level - 1) * 100);
        if (dropInterval) {
            clearInterval(dropInterval);
            dropInterval = setInterval(dropPiece, dropSpeed);
        }
    }
}

// 移动方块
function movePiece(dx, dy) {
    if (!currentPiece || gamePaused || gameOver) return false;
    
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    
    if (!checkCollision(currentPiece.shape, newX, newY)) {
        // 可以移动
        currentPiece.x = newX;
        currentPiece.y = newY;
        drawCurrentPiece();
        return true;
    }
    
    // 如果是向下移动但被阻止，则锁定方块
    if (dy > 0) {
        lockPiece();
    }
    
    return false;
}

// 自动下落
function dropPiece() {
    if (!gameStarted || gamePaused || gameOver) return;
    
    movePiece(0, 1);
}

// 旋转当前方块
function rotatePiece() {
    if (!currentPiece || gamePaused || gameOver) return;
    
    console.log('旋转方块:', currentPiece.type);
    
    // 获取当前方块的所有可能旋转状态
    const rotations = PIECES[currentPiece.type];
    
    // 如果只有一种状态（如O方块），则不需要旋转
    if (rotations.length === 1) {
        console.log('此方块只有一种状态，无法旋转');
        return;
    }
    
    // 计算下一个旋转状态的索引
    let currentIndex = 0;
    for (let i = 0; i < rotations.length; i++) {
        // 通过比较形状的字符串来找到当前旋转状态
        if (JSON.stringify(rotations[i]) === JSON.stringify(currentPiece.shape)) {
            currentIndex = i;
            break;
        }
    }
    
    const nextRotationIndex = (currentIndex + 1) % rotations.length;
    const nextShape = rotations[nextRotationIndex];
    
    console.log('当前旋转状态:', currentIndex, '下一个旋转状态:', nextRotationIndex);
    
    // 检查旋转后是否会发生碰撞
    if (!checkCollision(nextShape, currentPiece.x, currentPiece.y)) {
        console.log('旋转成功');
        currentPiece.shape = nextShape;
        drawCurrentPiece();
    } else {
        console.log('尝试墙踢');
        // 尝试简单的墙踢（Wall Kick）- 左右移动一格再尝试旋转
        const kickOffsets = [
            { x: -1, y: 0 }, // 向左移动一格
            { x: 1, y: 0 },  // 向右移动一格
            { x: 0, y: -1 }  // 向上移动一格（用于某些特殊情况）
        ];
        
        let kickSuccess = false;
        for (const offset of kickOffsets) {
            if (!checkCollision(nextShape, currentPiece.x + offset.x, currentPiece.y + offset.y)) {
                currentPiece.shape = nextShape;
                currentPiece.x += offset.x;
                currentPiece.y += offset.y;
                drawCurrentPiece();
                console.log('墙踢成功:', offset);
                kickSuccess = true;
                break;
            }
        }
        
        if (!kickSuccess) {
            console.log('无法旋转，所有墙踢尝试都失败');
        }
    }
}

// 处理键盘输入
function handleKeyDown(e) {
    // 确保事件不被重复处理
    if (e.defaultPrevented) {
        return;
    }
    
    if (!gameStarted || gameOver) return;
    
    console.log('键盘按键:', e.key); // 添加日志以便调试
    
    // 方向键和空格键需要阻止默认行为（避免页面滚动）
    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault(); // 阻止默认行为
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault(); // 阻止默认行为
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            e.preventDefault(); // 阻止默认行为
            movePiece(0, 1);
            break;
        case 'ArrowUp':
            e.preventDefault(); // 阻止默认行为
            rotatePiece();
            console.log('尝试旋转方块'); // 添加旋转操作日志
            break;
        case ' ':
            e.preventDefault(); // 阻止默认行为
            hardDrop();
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
}

// 硬下落 - 直接将方块放到最底部
function hardDrop() {
    if (!currentPiece || gamePaused || gameOver) return;
    
    // 找到方块可以下落的最大距离
    let dropDistance = 0;
    while (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + dropDistance + 1)) {
        dropDistance++;
    }
    
    if (dropDistance > 0) {
        currentPiece.y += dropDistance;
        drawCurrentPiece();
    }
    
    // 锁定方块
    lockPiece();
}

// 开始游戏
function startGame() {
    if (gameStarted) return;
    
    // 初始化游戏状态
    resetBoard();
    
    // 创建第一个方块和下一个方块
    currentPiece = createPiece();
    nextPiece = createPiece();
    
    // 绘制当前方块和下一个方块
    drawCurrentPiece();
    drawNextPiece();
    
    // 更新按钮状态
    if (startButton) startButton.disabled = true;
    if (pauseButton) pauseButton.disabled = false;
    
    // 开始游戏循环
    gameStarted = true;
    dropInterval = setInterval(dropPiece, dropSpeed);
}

// 重置游戏板
function resetBoard() {
    // 清空游戏板
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            board[y][x] = 0;
        }
    }
    
    // 重置分数
    score = 0;
    level = 1;
    lines = 0;
    
    // 更新显示
    if (scoreElement) scoreElement.textContent = score;
    if (levelElement) levelElement.textContent = level;
    if (linesElement) linesElement.textContent = lines;
    
    // 绘制空游戏板
    drawBoard();
}

// 暂停/继续游戏
function togglePause() {
    if (!gameStarted || gameOver) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        // 暂停游戏
        clearInterval(dropInterval);
        if (pauseButton) pauseButton.textContent = '继续';
    } else {
        // 继续游戏
        dropInterval = setInterval(dropPiece, dropSpeed);
        if (pauseButton) pauseButton.textContent = '暂停';
    }
}

// 重置游戏
function resetGame() {
    // 停止游戏循环
    if (dropInterval) {
        clearInterval(dropInterval);
    }
    
    // 重置游戏状态
    gameStarted = false;
    gamePaused = false;
    gameOver = false;
    
    // 重置游戏板
    resetBoard();
    
    // 重置按钮状态
    if (startButton) startButton.disabled = false;
    if (pauseButton) {
        pauseButton.disabled = true;
        pauseButton.textContent = '暂停';
    }
}

// 游戏结束
function endGame() {
    gameOver = true;
    if (dropInterval) {
        clearInterval(dropInterval);
    }
    
    // 在游戏界面显示游戏结束信息
    const gameOverMessage = document.getElementById('game-over');
    const finalScoreElement = document.getElementById('final-score');
    if (gameOverMessage && finalScoreElement) {
        finalScoreElement.textContent = score;
        gameOverMessage.style.display = 'flex';
    }
    
    // 更新按钮状态
    if (startButton) startButton.disabled = false;
    if (pauseButton) pauseButton.disabled = true;
}

// 绘制下一个方块
function drawNextPiece() {
    if (!nextPiece) return;
    
    // 获取下一个方块预览区域
    const nextPieceElement = document.getElementById('next-piece');
    if (!nextPieceElement) {
        return;
    }
    
    // 清空预览区域
    nextPieceElement.innerHTML = '';
    
    // 创建4x4的网格
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const cell = document.createElement('div');
            cell.className = 'tetris-cell';
            cell.setAttribute('data-x', x);
            cell.setAttribute('data-y', y);
            nextPieceElement.appendChild(cell);
        }
    }
    
    // 获取方块形状
    const shape = nextPiece.shape;
    
    // 特别处理I形方块（这种方块通常是4x4或4x1）
    if (nextPiece.type === 'I') {
        // 对于水平的I形方块，居中显示
        const cells = nextPieceElement.querySelectorAll('.tetris-cell');
        // 根据形状确定是水平还是垂直的I
        const isHorizontal = shape.some(row => row.filter(cell => cell === 1).length === 4);
        
        if (isHorizontal) {
            // 找到包含四个1的那一行
            let rowIndex = 0;
            for (let y = 0; y < shape.length; y++) {
                if (shape[y].filter(cell => cell === 1).length === 4) {
                    rowIndex = y;
                    break;
                }
            }
            // 在第2行（索引1）居中显示
            const displayY = 1;
            for (let x = 0; x < 4; x++) {
                const index = displayY * 4 + x;
                if (cells[index] && shape[rowIndex][x]) {
                    cells[index].classList.add(`piece-${nextPiece.type}`);
                }
            }
        } else {
            // 垂直I形方块，使用第1列和第2列（索引0和1）
            const displayX = 1;
            for (let y = 0; y < 4; y++) {
                // 找到方块中为1的位置
                if (y < shape.length && shape[y].some(cell => cell === 1)) {
                    const x = shape[y].findIndex(cell => cell === 1);
                    const index = y * 4 + displayX;
                    if (cells[index]) {
                        cells[index].classList.add(`piece-${nextPiece.type}`);
                    }
                }
            }
        }
        return;
    }
    
    // 对于其他形状的方块，使用计算居中方法
    // 找出方块的实际范围
    let minX = 4, maxX = 0, minY = 4, maxY = 0;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    
    // 计算实际尺寸
    const shapeWidth = maxX - minX + 1;
    const shapeHeight = maxY - minY + 1;
    
    // 计算居中偏移量
    const offsetX = Math.floor((4 - shapeWidth) / 2);
    const offsetY = Math.floor((4 - shapeHeight) / 2);
    
    // 绘制方块，居中显示
    for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
            if (shape[y][x]) {
                const displayX = offsetX + (x - minX);
                const displayY = offsetY + (y - minY);
                const index = displayY * 4 + displayX;
                
                const cells = nextPieceElement.querySelectorAll('.tetris-cell');
                if (cells[index]) {
                    cells[index].classList.add(`piece-${nextPiece.type}`);
                }
            }
        }
    }
}

// 当页面加载完成时初始化游戏
document.addEventListener('DOMContentLoaded', init);

// 添加一个立即尝试初始化的函数，以处理可能的DOM已经加载的情况
(function tryInitNow() {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        init();
    }
})(); 