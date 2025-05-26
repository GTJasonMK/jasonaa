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

// 等级系统配置
const LEVEL_CONFIG = {
    1: { 
        speed: 1000, 
        scoreMultiplier: 1, 
        specialPieceChance: 0
    },
    2: { 
        speed: 900, 
        scoreMultiplier: 1.1, 
        specialPieceChance: 0
    },
    3: { 
        speed: 800, 
        scoreMultiplier: 1.2, 
        specialPieceChance: 0.05
    },
    4: { 
        speed: 700, 
        scoreMultiplier: 1.3, 
        specialPieceChance: 0.05
    },
    5: { 
        speed: 600, 
        scoreMultiplier: 1.4, 
        specialPieceChance: 0.1
    },
    6: { 
        speed: 500, 
        scoreMultiplier: 1.5, 
        specialPieceChance: 0.1
    },
    7: { 
        speed: 400, 
        scoreMultiplier: 1.6, 
        specialPieceChance: 0.15
    },
    8: { 
        speed: 300, 
        scoreMultiplier: 1.7, 
        specialPieceChance: 0.15
    },
    9: { 
        speed: 200, 
        scoreMultiplier: 1.8, 
        specialPieceChance: 0.2
    },
    10: { 
        speed: 100, 
        scoreMultiplier: 2, 
        specialPieceChance: 0.2
    }
};

// 连击能力配置
const COMBO_ABILITIES = {
    8: {
        name: "行消除",
        description: "消除游戏板底部一行",
        action: clearBottomLine,
        icon: "🧹"
    },
    12: {
        name: "时间减缓",
        description: "暂时减缓方块下落速度",
        action: slowDownTime,
        icon: "⏱️"
    },
    16: {
        name: "方块变形",
        description: "将当前方块变为I形方块",
        action: transformToIShape,
        icon: "🔄"
    }
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
let gameSpeed = LEVEL_CONFIG[1].speed;
let isGameOver = false;
let isMobile = false;
let combo = 0; // 连击次数
let isSpecialPiece = false; // 是否是特殊方块
let activeAbilities = []; // 当前激活的能力
let slowTimeEffect = null; // 减缓时间效果的计时器

// DOM 元素引用
let boardElement, nextPieceElement, scoreElement, levelElement, linesElement, gameOverElement, comboElement, abilitiesElement;

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
    
    // 创建连击显示元素
    const statsContainer = document.querySelector('.stats');
    if (statsContainer && !document.getElementById('combo')) {
        const comboContainer = document.createElement('div');
        comboContainer.className = 'stat-item';
        comboContainer.innerHTML = '<span>连击:</span><span id="combo">0</span>';
        statsContainer.appendChild(comboContainer);
        comboElement = document.getElementById('combo');
    } else {
        comboElement = document.getElementById('combo');
    }
    
    // 创建能力显示区域
    if (!document.getElementById('abilities')) {
        const abilitiesContainer = document.createElement('div');
        abilitiesContainer.id = 'abilities';
        abilitiesContainer.className = 'abilities-container';
        abilitiesContainer.innerHTML = '<h3>特殊能力</h3><div class="abilities-list"></div>';
        
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.appendChild(abilitiesContainer);
        }
        
        abilitiesElement = document.querySelector('.abilities-list');
    } else {
        abilitiesElement = document.querySelector('.abilities-list');
    }
    
    // 重置游戏状态
    combo = 0;
    if (comboElement) comboElement.textContent = '0';
    activeAbilities = [];
    if (abilitiesElement) abilitiesElement.innerHTML = '';
    
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
    
    // 根据等级随机生成特殊方块
    isSpecialPiece = Math.random() < LEVEL_CONFIG[level].specialPieceChance;
    
    return {
        shape: randomPiece,
        matrix: SHAPES[randomPiece],
        color: getPieceColor(randomPiece),
        isSpecial: isSpecialPiece
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
    
    // 特殊方块使用特殊颜色
    if (isSpecialPiece) {
        return colors[shape] + ' special-block';
    }
    
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
                    
                    // 如果是特殊方块，添加闪烁动画
                    if (nextPiece.isSpecial) {
                        previewCells[index].style.animation = 'specialBlockGlow 1.5s infinite';
                    } else {
                        previewCells[index].style.animation = '';
                    }
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
            
            // 添加行消除动画
            showLineClearEffect(y);
            
            y++; // 检查同一行（现在是新行）
        }
    }
    
    if (linesCleared > 0) {
        // 更新连击
        combo++;
        if (comboElement) {
            comboElement.textContent = combo;
            comboElement.setAttribute('data-value', Math.min(combo, 20).toString());
            
            // 添加连击动画
            comboElement.style.animation = '';
            setTimeout(() => {
                comboElement.style.animation = 'pulse 0.3s';
            }, 10);
            
            // 连击奖励系统
            checkComboRewards();
        }
        
        // 更新分数
        const linePoints = [0, 100, 300, 500, 800]; // 0,1,2,3,4行的得分
        let earnedScore = linePoints[linesCleared] * level;
        
        // 应用等级乘数
        earnedScore = Math.floor(earnedScore * LEVEL_CONFIG[level].scoreMultiplier);
        
        // 应用连击加成
        const comboMultiplier = Math.min(1 + (combo * 0.1), 2); // 最高2倍连击加成
        earnedScore = Math.floor(earnedScore * comboMultiplier);
        
        // 特殊方块加成
        if (currentPiece.isSpecial) {
            earnedScore *= 2;
            showSpecialScoreEffect(earnedScore);
        }
        
        score += earnedScore;
        lines += linesCleared;
        
        // 显示得分动画
        showScoreEffect(earnedScore);
        
        // 检查是否升级
        const oldLevel = level;
        level = Math.floor(lines / 10) + 1;
        level = Math.min(level, 10); // 最高10级
        
        // 如果升级，显示升级动画
        if (level > oldLevel) {
            showLevelUpEffect(oldLevel, level);
        }
        
        // 更新游戏速度
        gameSpeed = LEVEL_CONFIG[level].speed;
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        // 更新统计显示
        updateStats();
    } else {
        // 重置连击
        combo = 0;
        if (comboElement) {
            comboElement.textContent = combo;
            comboElement.setAttribute('data-value', '0');
        }
    }
}

// 检查连击奖励
function checkComboRewards() {
    // 连击奖励阈值
    const comboRewards = {
        5: { points: 500, message: "连击 x5! +500分" },
        10: { points: 1000, message: "连击 x10! +1000分" },
        15: { points: 2000, message: "连击 x15! +2000分" },
        20: { points: 5000, message: "连击 x20! 大师级! +5000分" }
    };
    
    // 检查是否达到奖励阈值
    if (comboRewards[combo]) {
        const reward = comboRewards[combo];
        score += reward.points;
        
        // 显示连击奖励消息
        showComboRewardEffect(reward.message, reward.points);
    }
    
    // 检查是否获得特殊能力
    for (const comboThreshold in COMBO_ABILITIES) {
        if (combo === parseInt(comboThreshold)) {
            // 添加特殊能力
            addAbility(COMBO_ABILITIES[comboThreshold]);
            break;
        }
    }
}

// 显示连击奖励效果
function showComboRewardEffect(message, points) {
    const rewardPopup = document.createElement('div');
    rewardPopup.className = 'combo-reward-popup';
    rewardPopup.textContent = message;
    rewardPopup.style.position = 'absolute';
    rewardPopup.style.top = '30%';
    rewardPopup.style.left = '50%';
    rewardPopup.style.transform = 'translate(-50%, -50%)';
    rewardPopup.style.color = '#FFD700';
    rewardPopup.style.fontSize = '28px';
    rewardPopup.style.fontWeight = 'bold';
    rewardPopup.style.zIndex = '102';
    rewardPopup.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.8)';
    rewardPopup.style.animation = 'comboRewardPopup 2s forwards';
    
    // 添加CSS动画
    if (!document.getElementById('combo-reward-style')) {
        const style = document.createElement('style');
        style.id = 'combo-reward-style';
        style.textContent = `
            @keyframes comboRewardPopup {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
            }
        `;
        document.head.appendChild(style);
    }
    
    boardElement.appendChild(rewardPopup);
    
    // 播放声音（可选）
    try {
        const sound = new Audio('../../assets/sounds/combo-reward.mp3');
        sound.volume = 0.6;
        sound.play().catch(e => console.log('无法播放音效:', e));
    } catch (error) {
        console.log('音效播放失败:', error);
    }
    
    // 移除动画元素
    setTimeout(() => {
        rewardPopup.remove();
    }, 2000);
}

// 显示行消除动画效果
function showLineClearEffect(lineY) {
    const cells = boardElement.querySelectorAll(`.tetris-cell[data-y="${lineY}"]`);
    cells.forEach(cell => {
        cell.style.animation = 'lineClearEffect 0.3s';
    });
}

// 显示得分动画效果
function showScoreEffect(points) {
    const scorePopup = document.createElement('div');
    scorePopup.className = 'score-popup';
    scorePopup.textContent = `+${points}`;
    scorePopup.style.position = 'absolute';
    scorePopup.style.top = '50%';
    scorePopup.style.left = '50%';
    scorePopup.style.transform = 'translate(-50%, -50%)';
    scorePopup.style.color = '#FFD700';
    scorePopup.style.fontSize = '24px';
    scorePopup.style.fontWeight = 'bold';
    scorePopup.style.zIndex = '100';
    scorePopup.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
    scorePopup.style.animation = 'scorePopup 1s forwards';
    
    // 添加CSS动画
    if (!document.getElementById('score-popup-style')) {
        const style = document.createElement('style');
        style.id = 'score-popup-style';
        style.textContent = `
            @keyframes scorePopup {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                80% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -150%) scale(0.8); }
            }
            @keyframes lineClearEffect {
                0% { transform: scale(1); filter: brightness(1); }
                50% { transform: scale(1.1); filter: brightness(1.5); }
                100% { transform: scale(1); filter: brightness(1); }
            }
            @keyframes specialBlockGlow {
                0% { filter: brightness(1); }
                50% { filter: brightness(1.5) drop-shadow(0 0 5px gold); }
                100% { filter: brightness(1); }
            }
            @keyframes levelUpAnimation {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                10% { opacity: 1; transform: translate(-50%, -50%) scale(1.2) rotate(-5deg); }
                20% { transform: translate(-50%, -50%) scale(1.2) rotate(5deg); }
                30% { transform: translate(-50%, -50%) scale(1.2) rotate(-3deg); }
                40% { transform: translate(-50%, -50%) scale(1.2) rotate(3deg); }
                50% { transform: translate(-50%, -50%) scale(1.2) rotate(0); }
                70% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }
    
    boardElement.appendChild(scorePopup);
    
    // 移除动画元素
    setTimeout(() => {
        scorePopup.remove();
    }, 1000);
}

// 显示特殊方块得分效果
function showSpecialScoreEffect(points) {
    const specialPopup = document.createElement('div');
    specialPopup.className = 'special-popup';
    specialPopup.textContent = `特殊方块加成! +${points}`;
    specialPopup.style.position = 'absolute';
    specialPopup.style.top = '40%';
    specialPopup.style.left = '50%';
    specialPopup.style.transform = 'translate(-50%, -50%)';
    specialPopup.style.color = '#FF00FF';
    specialPopup.style.fontSize = '28px';
    specialPopup.style.fontWeight = 'bold';
    specialPopup.style.zIndex = '101';
    specialPopup.style.textShadow = '0 0 10px rgba(255,0,255,0.7)';
    specialPopup.style.animation = 'scorePopup 1.5s forwards';
    
    boardElement.appendChild(specialPopup);
    
    // 移除动画元素
    setTimeout(() => {
        specialPopup.remove();
    }, 1500);
}

// 显示等级提升效果
function showLevelUpEffect(oldLevel, newLevel) {
    // 创建等级提升消息
    const levelUpMessage = document.createElement('div');
    levelUpMessage.className = 'level-up-message';
    levelUpMessage.textContent = `等级提升! ${oldLevel} → ${newLevel}`;
    levelUpMessage.style.position = 'absolute';
    levelUpMessage.style.top = '50%';
    levelUpMessage.style.left = '50%';
    levelUpMessage.style.transform = 'translate(-50%, -50%)';
    levelUpMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
    levelUpMessage.style.color = 'white';
    levelUpMessage.style.padding = '15px 30px';
    levelUpMessage.style.borderRadius = '10px';
    levelUpMessage.style.fontSize = '28px';
    levelUpMessage.style.fontWeight = 'bold';
    levelUpMessage.style.zIndex = '1000';
    levelUpMessage.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)';
    levelUpMessage.style.animation = 'levelUpAnimation 2.5s ease-out forwards';
    
    // 添加到游戏板
    const container = boardElement.parentElement;
    container.appendChild(levelUpMessage);
    
    // 创建闪光效果
    const flash = document.createElement('div');
    flash.className = 'level-up-flash';
    flash.style.position = 'absolute';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    flash.style.zIndex = '99';
    flash.style.animation = 'flashEffect 1s ease-out forwards';
    
    // 添加CSS动画
    if (!document.getElementById('flash-effect-style')) {
        const style = document.createElement('style');
        style.id = 'flash-effect-style';
        style.textContent = `
            @keyframes flashEffect {
                0% { opacity: 0.8; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    container.appendChild(flash);
    
    // 播放声音（可选）
    try {
        const sound = new Audio('../../assets/sounds/level-up.mp3');
        sound.volume = 0.5;
        sound.play().catch(e => console.log('无法播放音效:', e));
    } catch (error) {
        console.log('音效播放失败:', error);
    }
    
    // 移除闪光效果
    setTimeout(() => {
        flash.remove();
    }, 1000);
    
    // 移除消息
    setTimeout(() => {
        levelUpMessage.remove();
    }, 2500);
}

// 更新统计信息
function updateStats() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    if (comboElement) {
        comboElement.textContent = combo;
        comboElement.setAttribute('data-value', Math.min(combo, 20).toString());
    }
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
    
    // 清除特殊效果计时器
    if (slowTimeEffect) {
        clearTimeout(slowTimeEffect);
        slowTimeEffect = null;
    }
    
    // 重置游戏状态
    tetrisBoard = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    currentPiece = null;
    nextPiece = generateRandomPiece();
    score = 0;
    level = 1;
    lines = 0;
    gameSpeed = LEVEL_CONFIG[1].speed;
    isPaused = false;
    isGameOver = false;
    combo = 0;
    activeAbilities = [];
    
    // 重置DOM元素
    document.getElementById('start-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
    document.getElementById('pause-btn').textContent = '暂停';
    
    // 清除特殊能力显示
    if (abilitiesElement) {
        abilitiesElement.innerHTML = '';
    }
    
    // 移除所有特效元素
    const effects = document.querySelectorAll('.ability-effect, .slow-time-indicator, .score-popup, .combo-reward-popup, .ability-popup');
    effects.forEach(effect => effect.remove());
    
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
    
    // 更新游戏结束界面
    gameOverElement.style.display = 'flex';
    document.querySelector('.game-over-overlay .final-score').textContent = score;
    
    // 添加等级信息
    let levelInfo = gameOverElement.querySelector('.level-info');
    if (!levelInfo) {
        levelInfo = document.createElement('p');
        levelInfo.className = 'level-info';
        gameOverElement.querySelector('p').after(levelInfo);
    }
    levelInfo.textContent = `达到等级: ${level}`;
    
    // 添加最高分记录
    const highScore = localStorage.getItem('tetris_high_score') || 0;
    if (score > highScore) {
        localStorage.setItem('tetris_high_score', score);
        
        let newRecordElement = gameOverElement.querySelector('.new-record');
        if (!newRecordElement) {
            newRecordElement = document.createElement('p');
            newRecordElement.className = 'new-record';
            newRecordElement.style.color = '#FFD700';
            newRecordElement.style.fontSize = '24px';
            newRecordElement.style.fontWeight = 'bold';
            levelInfo.after(newRecordElement);
        }
        newRecordElement.textContent = '新纪录!';
    }
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
        e.preventDefault(); // 防止页面滚动
        const rect = boardElement.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;
        
        // 只在游戏区域内处理触摸事件
        if (touchX >= 0 && touchX <= boardElement.offsetWidth && touchY >= 0 && touchY <= boardElement.offsetHeight) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = new Date().getTime();
        }
    }, { passive: false });
    
    boardElement.addEventListener('touchmove', function(e) {
        e.preventDefault(); // 防止页面滚动
        if (!touchStartX || !touchStartY) return;
    }, { passive: false });
    
    boardElement.addEventListener('touchend', function(e) {
        e.preventDefault(); // 防止页面滚动
        if (!touchStartX || !touchStartY) return;
        
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
        
        // 需要的最小滑动距离 - 调低以提高灵敏度
        const minSwipeDistance = 20;
        
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
        
        touchStartX = null;
        touchStartY = null;
    }, { passive: false });
    
    // 防止整个文档的滑动导致页面滚动
    document.addEventListener('touchmove', function(e) {
        if (!isGameOver && !isPaused) {
            const target = e.target;
            // 检查触摸目标是否在游戏区域内
            if (boardElement.contains(target)) {
                e.preventDefault();
            }
        }
    }, { passive: false });
}

// 添加特殊能力
function addAbility(ability) {
    // 添加到激活能力列表
    activeAbilities.push(ability);
    
    // 创建能力按钮
    const abilityButton = document.createElement('button');
    abilityButton.className = 'ability-button';
    abilityButton.innerHTML = `${ability.icon} ${ability.name}`;
    abilityButton.title = ability.description;
    abilityButton.dataset.abilityName = ability.name;
    
    // 添加点击事件
    abilityButton.addEventListener('click', () => {
        // 使用能力
        ability.action();
        
        // 从激活能力列表中移除
        activeAbilities = activeAbilities.filter(a => a.name !== ability.name);
        
        // 移除按钮
        abilityButton.remove();
        
        // 显示能力使用效果
        showAbilityEffect(ability.name);
    });
    
    // 添加到DOM
    if (abilitiesElement) {
        abilitiesElement.appendChild(abilityButton);
    }
    
    // 显示获得能力的消息
    showAbilityAcquiredEffect(ability);
}

// 显示获得能力的效果
function showAbilityAcquiredEffect(ability) {
    const abilityPopup = document.createElement('div');
    abilityPopup.className = 'ability-popup';
    abilityPopup.innerHTML = `获得特殊能力: <strong>${ability.icon} ${ability.name}</strong>!`;
    abilityPopup.style.position = 'absolute';
    abilityPopup.style.top = '40%';
    abilityPopup.style.left = '50%';
    abilityPopup.style.transform = 'translate(-50%, -50%)';
    abilityPopup.style.color = '#00FFFF';
    abilityPopup.style.fontSize = '24px';
    abilityPopup.style.fontWeight = 'bold';
    abilityPopup.style.zIndex = '103';
    abilityPopup.style.textShadow = '0 0 10px rgba(0, 255, 255, 0.8)';
    abilityPopup.style.animation = 'abilityPopup 2.5s forwards';
    
    // 添加CSS动画
    if (!document.getElementById('ability-popup-style')) {
        const style = document.createElement('style');
        style.id = 'ability-popup-style';
        style.textContent = `
            @keyframes abilityPopup {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                30% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
            
            .abilities-container {
                margin-top: 20px;
                text-align: center;
                width: 100%;
            }
            
            .abilities-list {
                display: flex;
                justify-content: center;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 10px;
            }
            
            .ability-button {
                padding: 8px 12px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s;
            }
            
            .ability-button:hover {
                background-color: #45a049;
                transform: scale(1.05);
            }
            
            .ability-effect {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 50;
            }
        `;
        document.head.appendChild(style);
    }
    
    boardElement.appendChild(abilityPopup);
    
    // 播放声音（可选）
    try {
        const sound = new Audio('../../assets/sounds/ability-acquired.mp3');
        sound.volume = 0.6;
        sound.play().catch(e => console.log('无法播放音效:', e));
    } catch (error) {
        console.log('音效播放失败:', error);
    }
    
    // 移除动画元素
    setTimeout(() => {
        abilityPopup.remove();
    }, 2500);
}

// 显示使用能力效果
function showAbilityEffect(abilityName) {
    const effectElement = document.createElement('div');
    effectElement.className = 'ability-effect';
    
    // 根据不同能力设置不同效果
    switch (abilityName) {
        case "行消除":
            effectElement.style.background = 'linear-gradient(to top, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)';
            effectElement.style.animation = 'fadeOut 1s forwards';
            break;
        case "时间减缓":
            effectElement.style.background = 'radial-gradient(circle, rgba(0,255,255,0.3) 0%, rgba(0,0,0,0) 70%)';
            effectElement.style.animation = 'pulseOut 2s forwards';
            break;
        case "方块变形":
            effectElement.style.background = 'radial-gradient(circle, rgba(255,255,0,0.3) 0%, rgba(0,0,0,0) 70%)';
            effectElement.style.animation = 'rotateOut 1s forwards';
            break;
    }
    
    // 添加CSS动画
    if (!document.getElementById('ability-effect-style')) {
        const style = document.createElement('style');
        style.id = 'ability-effect-style';
        style.textContent = `
            @keyframes fadeOut {
                0% { opacity: 0.8; }
                100% { opacity: 0; }
            }
            
            @keyframes pulseOut {
                0% { opacity: 0.8; transform: scale(0.8); }
                50% { opacity: 0.5; transform: scale(1.2); }
                100% { opacity: 0; transform: scale(1.5); }
            }
            
            @keyframes rotateOut {
                0% { opacity: 0.8; transform: rotate(0deg); }
                100% { opacity: 0; transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    boardElement.appendChild(effectElement);
    
    // 移除效果元素
    setTimeout(() => {
        effectElement.remove();
    }, 2000);
}

// 特殊能力：消除底部一行
function clearBottomLine() {
    // 移除底部一行
    tetrisBoard.pop();
    // 在顶部添加一行空行
    tetrisBoard.unshift(Array(BOARD_WIDTH).fill(0));
    
    // 更新分数
    score += 100 * level;
    
    // 显示效果
    showLineClearEffect(BOARD_HEIGHT - 1);
    
    // 更新游戏板
    drawBoard();
    
    // 更新统计
    updateStats();
}

// 特殊能力：减缓时间
function slowDownTime() {
    // 保存当前游戏速度
    const originalSpeed = gameSpeed;
    
    // 减缓速度（当前速度的2倍）
    gameSpeed = gameSpeed * 2;
    
    // 更新游戏间隔
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = setInterval(gameLoop, gameSpeed);
    }
    
    // 显示效果
    const slowTimeIndicator = document.createElement('div');
    slowTimeIndicator.className = 'slow-time-indicator';
    slowTimeIndicator.textContent = '时间减缓中...';
    slowTimeIndicator.style.position = 'absolute';
    slowTimeIndicator.style.top = '10px';
    slowTimeIndicator.style.left = '50%';
    slowTimeIndicator.style.transform = 'translateX(-50%)';
    slowTimeIndicator.style.color = '#00FFFF';
    slowTimeIndicator.style.fontWeight = 'bold';
    slowTimeIndicator.style.zIndex = '104';
    slowTimeIndicator.style.padding = '5px 10px';
    slowTimeIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    slowTimeIndicator.style.borderRadius = '5px';
    
    boardElement.appendChild(slowTimeIndicator);
    
    // 10秒后恢复正常速度
    slowTimeEffect = setTimeout(() => {
        gameSpeed = originalSpeed;
        if (gameInterval) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        // 移除指示器
        slowTimeIndicator.remove();
    }, 10000);
}

// 特殊能力：将当前方块变为I形方块
function transformToIShape() {
    // 保存当前位置
    const currentX = currentPiecePosition.x;
    const currentY = currentPiecePosition.y;
    
    // 创建I形方块
    currentPiece = {
        shape: 'I',
        matrix: SHAPES['I'],
        color: getPieceColor('I'),
        isSpecial: true
    };
    
    // 调整位置以避免碰撞
    let newX = currentX;
    let newY = currentY;
    
    // 检查是否会碰撞，如果会则尝试调整位置
    if (checkCollision(newX, newY, currentPiece.matrix)) {
        // 尝试不同的X位置
        const offsets = [-1, 1, -2, 2, 0];
        let validPosition = false;
        
        for (const offsetX of offsets) {
            if (!checkCollision(currentX + offsetX, currentY, currentPiece.matrix)) {
                newX = currentX + offsetX;
                validPosition = true;
                break;
            }
        }
        
        // 如果水平调整不行，尝试上移
        if (!validPosition && !checkCollision(currentX, currentY - 1, currentPiece.matrix)) {
            newY = currentY - 1;
            validPosition = true;
        }
        
        // 如果仍然不行，放弃变形
        if (!validPosition) {
            return;
        }
    }
    
    // 更新位置
    currentPiecePosition.x = newX;
    currentPiecePosition.y = newY;
    
    // 更新游戏板
    drawBoard();
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