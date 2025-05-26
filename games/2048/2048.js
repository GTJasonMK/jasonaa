/**
 * 2048游戏主要脚本
 */
document.addEventListener('DOMContentLoaded', () => {
    // 游戏状态变量
    const GRID_SIZE = 4;
    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('2048-best-score') || 0;
    let gameOver = false;
    let gameWon = false;
    let canContinue = false;
    let moveHistory = [];
    let level = 1; // 玩家当前等级
    
    // 等级系统配置
    const levelConfig = {
        1: { scoreThreshold: 0, bonusMultiplier: 1.0 },
        2: { scoreThreshold: 500, bonusMultiplier: 1.2 },
        3: { scoreThreshold: 1500, bonusMultiplier: 1.4 },
        4: { scoreThreshold: 3000, bonusMultiplier: 1.6 },
        5: { scoreThreshold: 6000, bonusMultiplier: 1.8 },
        6: { scoreThreshold: 9000, bonusMultiplier: 2.0 },
        7: { scoreThreshold: 15000, bonusMultiplier: 2.5 },
        8: { scoreThreshold: 25000, bonusMultiplier: 3.0 },
        9: { scoreThreshold: 40000, bonusMultiplier: 3.5 },
        10: { scoreThreshold: 60000, bonusMultiplier: 4.0 }
    };
    
    // DOM 元素
    const gameBoard = document.getElementById('game2048-board');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const gameOverOverlay = document.getElementById('game-over');
    const gameWinOverlay = document.getElementById('game-win');
    const finalScoreElement = document.getElementById('final-score');
    const winScoreElement = document.getElementById('win-score');
    const startBtn = document.getElementById('start-btn');
    const undoBtn = document.getElementById('undo-btn');
    const restartBtn = document.getElementById('restart-btn');
    const continueBtn = document.getElementById('continue-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    
    // 创建等级显示元素
    const statsContainer = document.querySelector('.stats');
    const levelContainer = document.createElement('div');
    levelContainer.className = 'stat-item';
    levelContainer.innerHTML = `
        <span>等级:</span>
        <span id="level">1</span>
    `;
    statsContainer.appendChild(levelContainer);
    const levelElement = document.getElementById('level');
    
    // 初始化游戏
    function initGame() {
        // 创建空网格
        grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        
        // 清空游戏面板
        gameBoard.innerHTML = '';
        
        // 创建格子
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                const cell = document.createElement('div');
                cell.classList.add('game2048-cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                gameBoard.appendChild(cell);
            }
        }
        
        // 重置游戏状态
        score = 0;
        level = 1;
        gameOver = false;
        gameWon = false;
        canContinue = false;
        moveHistory = [];
        
        // 更新界面
        updateScoreDisplay();
        updateLevelDisplay();
        
        // 添加两个初始数字
        addRandomNumber();
        addRandomNumber();
        
        // 更新网格显示
        updateGridDisplay();
    }
    
    // 更新分数显示
    function updateScoreDisplay() {
        scoreElement.textContent = score;
        bestScoreElement.textContent = bestScore;
    }
    
    // 更新等级显示
    function updateLevelDisplay() {
        levelElement.textContent = level;
    }
    
    // 检查并更新等级
    function checkAndUpdateLevel() {
        let newLevel = 1;
        
        // 找到当前分数对应的最高等级
        for (let l = 10; l >= 1; l--) {
            if (score >= levelConfig[l].scoreThreshold) {
                newLevel = l;
                break;
            }
        }
        
        // 如果等级提高，显示提示
        if (newLevel > level) {
            level = newLevel;
            updateLevelDisplay();
            showLevelUpMessage();
        }
    }
    
    // 显示等级提升消息
    function showLevelUpMessage() {
        const message = document.createElement('div');
        message.className = 'level-up-message';
        message.textContent = `升级到 ${level} 级!`;
        document.querySelector('.game2048-container').appendChild(message);
        
        // 添加CSS样式
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = 'rgba(237, 194, 46, 0.9)';
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
    
    // 在空格处随机添加数字（90%几率出现2，10%几率出现4）
    function addRandomNumber() {
        const emptyCells = [];
        
        // 找出所有空格子
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (grid[i][j] === 0) {
                    emptyCells.push({ row: i, col: j });
                }
            }
        }
        
        // 如果没有空格子，直接返回
        if (emptyCells.length === 0) return false;
        
        // 随机选择一个空格子
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        // 根据等级提高生成大数字的概率
        let newValue;
        const randomValue = Math.random();
        if (level >= 5 && randomValue < 0.05) {
            newValue = 8; // 5级及以上有5%概率生成8
        } else if (level >= 3 && randomValue < 0.15) {
            newValue = 4; // 3级及以上有15%概率生成4
        } else {
            newValue = 2; // 其余情况生成2
        }
        
        grid[randomCell.row][randomCell.col] = newValue;
        
        // 给新出现的数字添加动画
        const cellElement = document.querySelector(`.game2048-cell[data-row="${randomCell.row}"][data-col="${randomCell.col}"]`);
        if (cellElement) {
            cellElement.classList.add('new');
            setTimeout(() => {
                cellElement.classList.remove('new');
            }, 300);
        }
        
        return true;
    }
    
    // 更新网格显示
    function updateGridDisplay() {
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                const value = grid[i][j];
                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                
                // 清除所有可能的类名
                cellElement.className = 'game2048-cell';
                
                // 添加对应数字的类名
                if (value > 0) {
                    cellElement.classList.add(`game2048-cell-${value}`);
                    cellElement.textContent = value;
                    
                    // 超过2048的数字使用特殊样式
                    if (value > 2048) {
                        cellElement.classList.add('game2048-cell-super');
                    }
                } else {
                    cellElement.textContent = '';
                }
            }
        }
    }
    
    // 保存当前状态进入历史记录
    function saveState() {
        const gridCopy = grid.map(row => [...row]);
        moveHistory.push({
            grid: gridCopy,
            score: score
        });
        
        // 限制历史记录长度，防止内存占用过多
        if (moveHistory.length > 20) {
            moveHistory.shift();
        }
    }
    
    // 撤销上一步
    function undoMove() {
        if (moveHistory.length === 0) return;
        
        const lastState = moveHistory.pop();
        grid = lastState.grid;
        score = lastState.score;
        
        updateScoreDisplay();
        updateGridDisplay();
        
        // 取消游戏结束状态
        if (gameOver) {
            gameOver = false;
            gameOverOverlay.style.display = 'none';
        }
    }
    
    // 检查游戏是否结束
    function checkGameOver() {
        // 检查是否有空格子
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (grid[i][j] === 0) return false;
            }
        }
        
        // 检查横向是否可以合并
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE - 1; j++) {
                if (grid[i][j] === grid[i][j + 1]) return false;
            }
        }
        
        // 检查纵向是否可以合并
        for (let i = 0; i < GRID_SIZE - 1; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (grid[i][j] === grid[i + 1][j]) return false;
            }
        }
        
        // 如果都不满足，游戏结束
        return true;
    }
    
    // 检查是否已经达到2048
    function checkWin() {
        if (gameWon && canContinue) return false;
        
        for (let i = 0; i < GRID_SIZE; i++) {
            for (let j = 0; j < GRID_SIZE; j++) {
                if (grid[i][j] === 2048) return true;
            }
        }
        
        return false;
    }
    
    // 移动处理函数
    function move(direction) {
        if (gameOver || (gameWon && !canContinue)) return false;
        
        // 保存移动前状态
        saveState();
        
        let moved = false;
        
        switch (direction) {
            case 'up':
                moved = moveUp();
                break;
            case 'down':
                moved = moveDown();
                break;
            case 'left':
                moved = moveLeft();
                break;
            case 'right':
                moved = moveRight();
                break;
        }
        
        if (moved) {
            // 添加新数字
            addRandomNumber();
            
            // 检查并更新等级
            checkAndUpdateLevel();
            
            // 更新分数
            updateScoreDisplay();
            
            // 更新网格显示
            updateGridDisplay();
            
            // 检查游戏胜利
            if (checkWin()) {
                showGameWin();
                return;
            }
            
            // 检查游戏结束
            if (checkGameOver()) {
                showGameOver();
            }
            
            // 保存最高分
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem('2048-best-score', bestScore);
                bestScoreElement.textContent = bestScore;
            }
            
            return true;
        }
        
        // 如果没有移动，删除之前保存的状态
        moveHistory.pop();
        return false;
    }
    
    // 向上移动
    function moveUp() {
        let moved = false;
        
        for (let j = 0; j < GRID_SIZE; j++) {
            // 合并相同的数字
            for (let i = 0; i < GRID_SIZE; i++) {
                if (grid[i][j] !== 0) {
                    let k = i + 1;
                    while (k < GRID_SIZE) {
                        if (grid[k][j] !== 0) {
                            if (grid[i][j] === grid[k][j]) {
                                // 合并相同的数字
                                grid[i][j] *= 2;
                                grid[k][j] = 0;
                                // 根据等级增加分数奖励
                                const bonusMultiplier = levelConfig[level].bonusMultiplier;
                                score += Math.floor(grid[i][j] * bonusMultiplier);
                                moved = true;
                                
                                // 添加合并动画
                                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                                if (cellElement) {
                                    cellElement.classList.add('merged');
                                    setTimeout(() => {
                                        cellElement.classList.remove('merged');
                                    }, 300);
                                }
                            }
                            break;
                        }
                        k++;
                    }
                }
            }
            
            // 移动所有数字
            for (let i = 0; i < GRID_SIZE; i++) {
                if (grid[i][j] === 0) {
                    for (let k = i + 1; k < GRID_SIZE; k++) {
                        if (grid[k][j] !== 0) {
                            grid[i][j] = grid[k][j];
                            grid[k][j] = 0;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }
        
        return moved;
    }
    
    // 向下移动
    function moveDown() {
        let moved = false;
        
        for (let j = 0; j < GRID_SIZE; j++) {
            // 合并相同的数字
            for (let i = GRID_SIZE - 1; i >= 0; i--) {
                if (grid[i][j] !== 0) {
                    let k = i - 1;
                    while (k >= 0) {
                        if (grid[k][j] !== 0) {
                            if (grid[i][j] === grid[k][j]) {
                                // 合并相同的数字
                                grid[i][j] *= 2;
                                grid[k][j] = 0;
                                // 根据等级增加分数奖励
                                const bonusMultiplier = levelConfig[level].bonusMultiplier;
                                score += Math.floor(grid[i][j] * bonusMultiplier);
                                moved = true;
                                
                                // 添加合并动画
                                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                                if (cellElement) {
                                    cellElement.classList.add('merged');
                                    setTimeout(() => {
                                        cellElement.classList.remove('merged');
                                    }, 300);
                                }
                            }
                            break;
                        }
                        k--;
                    }
                }
            }
            
            // 移动所有数字
            for (let i = GRID_SIZE - 1; i >= 0; i--) {
                if (grid[i][j] === 0) {
                    for (let k = i - 1; k >= 0; k--) {
                        if (grid[k][j] !== 0) {
                            grid[i][j] = grid[k][j];
                            grid[k][j] = 0;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }
        
        return moved;
    }
    
    // 向左移动
    function moveLeft() {
        let moved = false;
        
        for (let i = 0; i < GRID_SIZE; i++) {
            // 合并相同的数字
            for (let j = 0; j < GRID_SIZE; j++) {
                if (grid[i][j] !== 0) {
                    let k = j + 1;
                    while (k < GRID_SIZE) {
                        if (grid[i][k] !== 0) {
                            if (grid[i][j] === grid[i][k]) {
                                // 合并相同的数字
                                grid[i][j] *= 2;
                                grid[i][k] = 0;
                                // 根据等级增加分数奖励
                                const bonusMultiplier = levelConfig[level].bonusMultiplier;
                                score += Math.floor(grid[i][j] * bonusMultiplier);
                                moved = true;
                                
                                // 添加合并动画
                                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                                if (cellElement) {
                                    cellElement.classList.add('merged');
                                    setTimeout(() => {
                                        cellElement.classList.remove('merged');
                                    }, 300);
                                }
                            }
                            break;
                        }
                        k++;
                    }
                }
            }
            
            // 移动所有数字
            for (let j = 0; j < GRID_SIZE; j++) {
                if (grid[i][j] === 0) {
                    for (let k = j + 1; k < GRID_SIZE; k++) {
                        if (grid[i][k] !== 0) {
                            grid[i][j] = grid[i][k];
                            grid[i][k] = 0;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }
        
        return moved;
    }
    
    // 向右移动
    function moveRight() {
        let moved = false;
        
        for (let i = 0; i < GRID_SIZE; i++) {
            // 合并相同的数字
            for (let j = GRID_SIZE - 1; j >= 0; j--) {
                if (grid[i][j] !== 0) {
                    let k = j - 1;
                    while (k >= 0) {
                        if (grid[i][k] !== 0) {
                            if (grid[i][j] === grid[i][k]) {
                                // 合并相同的数字
                                grid[i][j] *= 2;
                                grid[i][k] = 0;
                                // 根据等级增加分数奖励
                                const bonusMultiplier = levelConfig[level].bonusMultiplier;
                                score += Math.floor(grid[i][j] * bonusMultiplier);
                                moved = true;
                                
                                // 添加合并动画
                                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                                if (cellElement) {
                                    cellElement.classList.add('merged');
                                    setTimeout(() => {
                                        cellElement.classList.remove('merged');
                                    }, 300);
                                }
                            }
                            break;
                        }
                        k--;
                    }
                }
            }
            
            // 移动所有数字
            for (let j = GRID_SIZE - 1; j >= 0; j--) {
                if (grid[i][j] === 0) {
                    for (let k = j - 1; k >= 0; k--) {
                        if (grid[i][k] !== 0) {
                            grid[i][j] = grid[i][k];
                            grid[i][k] = 0;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }
        
        return moved;
    }
    
    // 事件监听
    
    // 键盘控制
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                move('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                move('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                move('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                move('right');
                break;
            case 'z':
            case 'Z':
                e.preventDefault();
                undoMove();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                initGame();
                break;
        }
    });
    
    // 触摸屏滑动操作
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    gameBoard.addEventListener('touchstart', function(e) {
        e.preventDefault(); // 防止页面滚动
        touchStartX = e.changedTouches[0].clientX;
        touchStartY = e.changedTouches[0].clientY;
    }, { passive: false });
    
    gameBoard.addEventListener('touchmove', function(e) {
        e.preventDefault(); // 防止页面滚动
    }, { passive: false });
    
    gameBoard.addEventListener('touchend', function(e) {
        e.preventDefault(); // 防止页面滚动
        touchEndX = e.changedTouches[0].clientX;
        touchEndY = e.changedTouches[0].clientY;
        
        handleSwipe();
        
        // 重置触摸起始点
        touchStartX = 0;
        touchStartY = 0;
    }, { passive: false });
    
    // 防止整个文档的滑动导致页面滚动
    document.addEventListener('touchmove', function(e) {
        const target = e.target;
        // 检查触摸目标是否在游戏区域内
        if (gameBoard.contains(target)) {
            e.preventDefault();
        }
    }, { passive: false });
    
    function handleSwipe() {
        const xDiff = touchEndX - touchStartX;
        const yDiff = touchEndY - touchStartY;
        
        // 设置最小滑动距离，防止意外触发
        const minSwipeDistance = 30;
        
        // 确定主要方向（水平或垂直）
        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > minSwipeDistance) {
            if (xDiff > 0) {
                move('right');
            } else {
                move('left');
            }
        } else if (Math.abs(yDiff) > minSwipeDistance) {
            if (yDiff > 0) {
                move('down');
            } else {
                move('up');
            }
        }
    }
    
    // 按钮事件
    startBtn.addEventListener('click', initGame);
    undoBtn.addEventListener('click', undoMove);
    restartBtn.addEventListener('click', () => {
        gameOverOverlay.style.display = 'none';
        initGame();
    });
    
    // 游戏胜利后继续玩
    continueBtn.addEventListener('click', () => {
        gameWinOverlay.style.display = 'none';
        canContinue = true;
    });
    
    // 游戏胜利后开始新游戏
    newGameBtn.addEventListener('click', () => {
        gameWinOverlay.style.display = 'none';
        initGame();
    });
    
    // 游戏结束
    function showGameOver() {
        gameOver = true;
        finalScoreElement.textContent = score;
        gameOverOverlay.style.display = 'flex';
        
        // 添加等级信息
        const levelInfo = document.createElement('div');
        levelInfo.className = 'level-info';
        levelInfo.textContent = `达到等级: ${level}`;
        levelInfo.style.fontSize = '20px';
        levelInfo.style.marginTop = '10px';
        
        // 检查是否已经有等级信息
        const existingLevelInfo = gameOverOverlay.querySelector('.level-info');
        if (existingLevelInfo) {
            existingLevelInfo.textContent = `达到等级: ${level}`;
        } else {
            gameOverOverlay.appendChild(levelInfo);
        }
    }
    
    // 显示游戏胜利界面
    function showGameWin() {
        gameWon = true;
        winScoreElement.textContent = score;
        gameWinOverlay.style.display = 'flex';
        
        // 添加等级信息
        const levelInfo = document.createElement('div');
        levelInfo.className = 'level-info';
        levelInfo.textContent = `当前等级: ${level}`;
        levelInfo.style.fontSize = '20px';
        levelInfo.style.marginTop = '10px';
        
        // 检查是否已经有等级信息
        const existingLevelInfo = gameWinOverlay.querySelector('.level-info');
        if (existingLevelInfo) {
            existingLevelInfo.textContent = `当前等级: ${level}`;
        } else {
            gameWinOverlay.appendChild(levelInfo);
        }
    }
    
    // 初始化游戏
    initGame();
}); 