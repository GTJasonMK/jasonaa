/**
 * 2048游戏 - 基于GameBase v2.0架构的优化版
 *
 * 功能特性：
 * - 4x4网格系统
 * - 四向移动和合并逻辑
 * - 10级等级系统，使用GameBase统一的LevelSystem
 * - 撤销功能（moveHistory）
 * - 键盘和触摸控制
 * - 动画系统（可配置速度）
 * - 2048达成检测
 * - 使用GameBase的NotificationSystem显示通知
 * - 使用GameBase的StorageHelper管理数据
 */

class Game2048 extends GameBase {
    constructor() {
        super('game2048', { enableAutoCleanup: true, enableNotifications: true });

        // 游戏常量
        this.GRID_SIZE = 4;

        // 等级系统配置（默认值）
        this.DEFAULT_LEVEL_CONFIG = {
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

        // 当前游戏配置
        this.levelConfig = JSON.parse(JSON.stringify(this.DEFAULT_LEVEL_CONFIG));

        // 游戏设置（从settingsManager加载，否则使用默认值）
        this.animationSpeed = this.settings?.animationSpeed !== undefined ? this.settings.animationSpeed : 150;
        this.showAnimations = this.settings?.showAnimations !== undefined ? this.settings.showAnimations : true;
        this.tile4Probability = this.settings?.initialTile4Probability !== undefined ? this.settings.initialTile4Probability : 0.1;

        // 从设置中加载等级配置
        if (this.settings?.levelThresholds && Array.isArray(this.settings.levelThresholds)) {
            for (let i = 0; i < this.settings.levelThresholds.length && i < 10; i++) {
                this.levelConfig[i + 1].scoreThreshold = this.settings.levelThresholds[i];
            }
        }

        if (this.settings?.levelBonusMultipliers && Array.isArray(this.settings.levelBonusMultipliers)) {
            for (let i = 0; i < this.settings.levelBonusMultipliers.length && i < 10; i++) {
                this.levelConfig[i + 1].bonusMultiplier = this.settings.levelBonusMultipliers[i];
            }
        }

        // 设置等级系统
        this.setupLevelSystem(this.levelConfig);

        // 游戏状态
        this.grid = [];
        this.gameOver = false;
        this.gameWon = false;
        this.canContinue = false;
        this.moveHistory = [];

        // 触摸事件变量
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;

        // DOM元素
        this.gameBoard = document.getElementById('game2048-board');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameOverOverlay = document.getElementById('game-over');
        this.gameWinOverlay = document.getElementById('game-win');
        this.finalScoreElement = document.getElementById('final-score');
        this.winScoreElement = document.getElementById('win-score');
        this.startBtn = document.getElementById('start-btn');
        this.undoBtn = document.getElementById('undo-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.continueBtn = document.getElementById('continue-btn');
        this.newGameBtn = document.getElementById('new-game-btn');

        // 创建并添加等级显示
        this.createLevelDisplay();

        // 应用CSS动画速度设置
        document.documentElement.style.setProperty('--animation-speed', `${this.animationSpeed}ms`);

        // 如果不显示动画，添加no-animation类
        if (!this.showAnimations) {
            this.gameBoard.classList.add('no-animation');
        }

        // 加载最高分
        this.loadBestScore();

        // 初始化
        this.init();
    }

    /**
     * 创建等级显示元素
     */
    createLevelDisplay() {
        const statsContainer = document.querySelector('.stats');
        const levelContainer = document.createElement('div');
        levelContainer.className = 'stat-item';
        levelContainer.innerHTML = `
            <span>等级:</span>
            <span id="level">1</span>
        `;
        statsContainer.appendChild(levelContainer);
        this.levelElement = document.getElementById('level');
    }

    /**
     * 加载最高分
     */
    loadBestScore() {
        this.state.highScore = this.loadGameData('bestScore', 0);
        if (this.state.highScore > 0) {
            console.log(`已加载最高分: ${this.state.highScore}`);
        }
    }

    /**
     * 保存最高分
     */
    saveBestScore() {
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            this.saveGameData('bestScore', this.state.highScore);
            console.log(`新最高分已保存: ${this.state.highScore}`);
            return true;
        }
        return false;
    }

    /**
     * 初始化游戏
     */
    init() {
        // 创建空网格
        this.grid = Array(this.GRID_SIZE).fill().map(() => Array(this.GRID_SIZE).fill(0));

        // 清空游戏面板
        this.gameBoard.innerHTML = '';

        // 创建格子
        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = 0; j < this.GRID_SIZE; j++) {
                const cell = document.createElement('div');
                cell.classList.add('game2048-cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                this.gameBoard.appendChild(cell);
            }
        }

        // 重置游戏状态
        this.state.score = 0;
        this.state.level = 1;
        this.gameOver = false;
        this.gameWon = false;
        this.canContinue = false;
        this.moveHistory = [];

        // 更新界面
        this.updateScoreDisplay();
        this.updateLevelDisplay();

        // 添加两个初始数字
        this.addRandomNumber();
        this.addRandomNumber();

        // 更新网格显示
        this.updateGridDisplay();

        // 设置事件监听器
        this.setupEventListeners();

        console.log('2048游戏初始化完成（使用GameBase v2.0架构）');
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘控制
        this.on(document, 'keydown', (e) => this.handleKeyDown(e));

        // 触摸屏滑动操作
        this.on(this.gameBoard, 'touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.changedTouches[0].clientX;
            this.touchStartY = e.changedTouches[0].clientY;
        }, { passive: false });

        this.on(this.gameBoard, 'touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.on(this.gameBoard, 'touchend', (e) => {
            e.preventDefault();
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;

            this.handleSwipe();

            // 重置触摸起始点
            this.touchStartX = 0;
            this.touchStartY = 0;
        }, { passive: false });

        // 防止整个文档的滑动导致页面滚动
        this.on(document, 'touchmove', (e) => {
            const target = e.target;
            if (this.gameBoard.contains(target)) {
                e.preventDefault();
            }
        }, { passive: false });

        // 按钮事件
        this.on(this.startBtn, 'click', () => this.init());
        this.on(this.undoBtn, 'click', () => this.undoMove());
        this.on(this.restartBtn, 'click', () => {
            this.gameOverOverlay.style.display = 'none';
            this.init();
        });
        this.on(this.continueBtn, 'click', () => {
            this.gameWinOverlay.style.display = 'none';
            this.canContinue = true;
        });
        this.on(this.newGameBtn, 'click', () => {
            this.gameWinOverlay.style.display = 'none';
            this.init();
        });
    }

    /**
     * 处理键盘按键
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.move('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.move('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.move('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.move('right');
                break;
            case 'z':
            case 'Z':
                e.preventDefault();
                this.undoMove();
                break;
            case 'r':
            case 'R':
                e.preventDefault();
                this.init();
                break;
        }
    }

    /**
     * 处理滑动操作
     */
    handleSwipe() {
        const xDiff = this.touchEndX - this.touchStartX;
        const yDiff = this.touchEndY - this.touchStartY;

        const minSwipeDistance = 30;

        if (this.touchStartX === 0 && this.touchStartY === 0) {
            return;
        }

        if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > minSwipeDistance) {
            if (xDiff > 0) {
                this.move('right');
            } else {
                this.move('left');
            }
        } else if (Math.abs(yDiff) > minSwipeDistance) {
            if (yDiff > 0) {
                this.move('down');
            } else {
                this.move('up');
            }
        }
    }

    /**
     * 更新分数显示
     */
    updateScoreDisplay() {
        this.scoreElement.textContent = this.state.score;
        this.bestScoreElement.textContent = this.state.highScore;
    }

    /**
     * 更新等级显示
     */
    updateLevelDisplay() {
        this.levelElement.textContent = this.state.level;
    }

    /**
     * 添加随机数字到网格
     */
    addRandomNumber() {
        const emptyCells = [];

        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = 0; j < this.GRID_SIZE; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({ i, j });
                }
            }
        }

        if (emptyCells.length === 0) return;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

        // 根据当前等级调整生成4的概率
        const increment = this.settings?.tile4ProbabilityIncrement || 0.05;
        const maxProb = this.settings?.maxTile4Probability || 0.4;
        const levelAdjustedProbability = Math.min(
            this.tile4Probability + (this.state.level - 1) * increment,
            maxProb
        );

        this.grid[randomCell.i][randomCell.j] = Math.random() < levelAdjustedProbability ? 4 : 2;

        // 添加新数字的动画效果
        const cellElement = document.querySelector(`.game2048-cell[data-row="${randomCell.i}"][data-col="${randomCell.j}"]`);
        if (cellElement && this.showAnimations) {
            cellElement.classList.add('new-tile');
            this.setTimeout(() => {
                cellElement.classList.remove('new-tile');
            }, this.animationSpeed);
        }
    }

    /**
     * 更新网格显示
     */
    updateGridDisplay() {
        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = 0; j < this.GRID_SIZE; j++) {
                const value = this.grid[i][j];
                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);

                cellElement.className = 'game2048-cell';

                if (value > 0) {
                    cellElement.classList.add(`game2048-cell-${value}`);
                    cellElement.textContent = value;

                    if (value > 2048) {
                        cellElement.classList.add('game2048-cell-super');
                    }
                } else {
                    cellElement.textContent = '';
                }
            }
        }
    }

    /**
     * 保存当前状态进入历史记录
     */
    saveState() {
        const gridCopy = this.grid.map(row => [...row]);
        this.moveHistory.push({
            grid: gridCopy,
            score: this.state.score
        });

        if (this.moveHistory.length > 20) {
            this.moveHistory.shift();
        }
    }

    /**
     * 撤销上一步
     */
    undoMove() {
        if (this.moveHistory.length === 0) return;

        const lastState = this.moveHistory.pop();
        this.grid = lastState.grid;
        this.state.score = lastState.score;

        this.updateScoreDisplay();
        this.updateGridDisplay();

        if (this.gameOver) {
            this.gameOver = false;
            this.gameOverOverlay.style.display = 'none';
        }
    }

    /**
     * 检查游戏是否结束
     */
    checkGameOver() {
        // 检查是否有空格子
        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = 0; j < this.GRID_SIZE; j++) {
                if (this.grid[i][j] === 0) return false;
            }
        }

        // 检查横向是否可以合并
        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = 0; j < this.GRID_SIZE - 1; j++) {
                if (this.grid[i][j] === this.grid[i][j + 1]) return false;
            }
        }

        // 检查纵向是否可以合并
        for (let i = 0; i < this.GRID_SIZE - 1; i++) {
            for (let j = 0; j < this.GRID_SIZE; j++) {
                if (this.grid[i][j] === this.grid[i + 1][j]) return false;
            }
        }

        return true;
    }

    /**
     * 检查是否已经达到2048
     */
    checkWin() {
        if (this.gameWon && this.canContinue) return false;

        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = 0; j < this.GRID_SIZE; j++) {
                if (this.grid[i][j] === 2048) return true;
            }
        }

        return false;
    }

    /**
     * 移动处理函数
     */
    move(direction) {
        if (this.gameOver || (this.gameWon && !this.canContinue)) return false;

        this.saveState();

        let moved = false;

        switch (direction) {
            case 'up':
                moved = this.moveUp();
                break;
            case 'down':
                moved = this.moveDown();
                break;
            case 'left':
                moved = this.moveLeft();
                break;
            case 'right':
                moved = this.moveRight();
                break;
        }

        if (moved) {
            this.addRandomNumber();

            // 使用GameBase的自动等级更新
            if (this.autoUpdateLevel()) {
                this.updateLevelDisplay();
            }

            this.updateScoreDisplay();
            this.updateGridDisplay();

            if (this.checkWin()) {
                this.showGameWin();
                return;
            }

            if (this.checkGameOver()) {
                this.showGameOver();
            }

            if (this.saveBestScore()) {
                this.bestScoreElement.textContent = this.state.highScore;
            }

            return true;
        }

        this.moveHistory.pop();
        return false;
    }

    /**
     * 向上移动
     */
    moveUp() {
        let moved = false;

        for (let j = 0; j < this.GRID_SIZE; j++) {
            // 合并相同的数字
            for (let i = 0; i < this.GRID_SIZE; i++) {
                if (this.grid[i][j] !== 0) {
                    let k = i + 1;
                    while (k < this.GRID_SIZE) {
                        if (this.grid[k][j] !== 0) {
                            if (this.grid[i][j] === this.grid[k][j]) {
                                this.grid[i][j] *= 2;
                                this.grid[k][j] = 0;
                                const bonusMultiplier = this.levelConfig[this.state.level].bonusMultiplier;
                                this.state.score += Math.floor(this.grid[i][j] * bonusMultiplier);
                                moved = true;

                                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                                if (cellElement) {
                                    cellElement.classList.add('merged');
                                    this.setTimeout(() => {
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
            for (let i = 0; i < this.GRID_SIZE; i++) {
                if (this.grid[i][j] === 0) {
                    for (let k = i + 1; k < this.GRID_SIZE; k++) {
                        if (this.grid[k][j] !== 0) {
                            this.grid[i][j] = this.grid[k][j];
                            this.grid[k][j] = 0;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }

        return moved;
    }

    /**
     * 向下移动
     */
    moveDown() {
        let moved = false;

        for (let j = 0; j < this.GRID_SIZE; j++) {
            for (let i = this.GRID_SIZE - 1; i >= 0; i--) {
                if (this.grid[i][j] !== 0) {
                    let k = i - 1;
                    while (k >= 0) {
                        if (this.grid[k][j] !== 0) {
                            if (this.grid[i][j] === this.grid[k][j]) {
                                this.grid[i][j] *= 2;
                                this.grid[k][j] = 0;
                                const bonusMultiplier = this.levelConfig[this.state.level].bonusMultiplier;
                                this.state.score += Math.floor(this.grid[i][j] * bonusMultiplier);
                                moved = true;

                                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                                if (cellElement) {
                                    cellElement.classList.add('merged');
                                    this.setTimeout(() => {
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

            for (let i = this.GRID_SIZE - 1; i >= 0; i--) {
                if (this.grid[i][j] === 0) {
                    for (let k = i - 1; k >= 0; k--) {
                        if (this.grid[k][j] !== 0) {
                            this.grid[i][j] = this.grid[k][j];
                            this.grid[k][j] = 0;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }

        return moved;
    }

    /**
     * 向左移动
     */
    moveLeft() {
        let moved = false;

        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = 0; j < this.GRID_SIZE; j++) {
                if (this.grid[i][j] !== 0) {
                    let k = j + 1;
                    while (k < this.GRID_SIZE) {
                        if (this.grid[i][k] !== 0) {
                            if (this.grid[i][j] === this.grid[i][k]) {
                                this.grid[i][j] *= 2;
                                this.grid[i][k] = 0;
                                const bonusMultiplier = this.levelConfig[this.state.level].bonusMultiplier;
                                this.state.score += Math.floor(this.grid[i][j] * bonusMultiplier);
                                moved = true;

                                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                                if (cellElement) {
                                    cellElement.classList.add('merged');
                                    this.setTimeout(() => {
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

            for (let j = 0; j < this.GRID_SIZE; j++) {
                if (this.grid[i][j] === 0) {
                    for (let k = j + 1; k < this.GRID_SIZE; k++) {
                        if (this.grid[i][k] !== 0) {
                            this.grid[i][j] = this.grid[i][k];
                            this.grid[i][k] = 0;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }

        return moved;
    }

    /**
     * 向右移动
     */
    moveRight() {
        let moved = false;

        for (let i = 0; i < this.GRID_SIZE; i++) {
            for (let j = this.GRID_SIZE - 1; j >= 0; j--) {
                if (this.grid[i][j] !== 0) {
                    let k = j - 1;
                    while (k >= 0) {
                        if (this.grid[i][k] !== 0) {
                            if (this.grid[i][j] === this.grid[i][k]) {
                                this.grid[i][j] *= 2;
                                this.grid[i][k] = 0;
                                const bonusMultiplier = this.levelConfig[this.state.level].bonusMultiplier;
                                this.state.score += Math.floor(this.grid[i][j] * bonusMultiplier);
                                moved = true;

                                const cellElement = document.querySelector(`.game2048-cell[data-row="${i}"][data-col="${j}"]`);
                                if (cellElement) {
                                    cellElement.classList.add('merged');
                                    this.setTimeout(() => {
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

            for (let j = this.GRID_SIZE - 1; j >= 0; j--) {
                if (this.grid[i][j] === 0) {
                    for (let k = j - 1; k >= 0; k--) {
                        if (this.grid[i][k] !== 0) {
                            this.grid[i][j] = this.grid[i][k];
                            this.grid[i][k] = 0;
                            moved = true;
                            break;
                        }
                    }
                }
            }
        }

        return moved;
    }

    /**
     * 游戏结束
     */
    showGameOver() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.state.score;
        this.gameOverOverlay.style.display = 'flex';

        const levelInfo = document.createElement('div');
        levelInfo.className = 'level-info';
        levelInfo.textContent = `达到等级: ${this.state.level}`;
        levelInfo.style.fontSize = '20px';
        levelInfo.style.marginTop = '10px';

        const existingLevelInfo = this.gameOverOverlay.querySelector('.level-info');
        if (existingLevelInfo) {
            existingLevelInfo.textContent = `达到等级: ${this.state.level}`;
        } else {
            this.gameOverOverlay.appendChild(levelInfo);
        }
    }

    /**
     * 显示游戏胜利界面
     */
    showGameWin() {
        this.gameWon = true;
        this.winScoreElement.textContent = this.state.score;
        this.gameWinOverlay.style.display = 'flex';

        const levelInfo = document.createElement('div');
        levelInfo.className = 'level-info';
        levelInfo.textContent = `当前等级: ${this.state.level}`;
        levelInfo.style.fontSize = '20px';
        levelInfo.style.marginTop = '10px';

        const existingLevelInfo = this.gameWinOverlay.querySelector('.level-info');
        if (existingLevelInfo) {
            existingLevelInfo.textContent = `当前等级: ${this.state.level}`;
        } else {
            this.gameWinOverlay.appendChild(levelInfo);
        }

        // 使用GameBase的通知系统
        this.notify.success('恭喜达到2048！', 3000);
    }
}

/**
 * 初始化游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof GameBase === 'undefined') {
        console.error('GameBase未加载！请确保已引入GameBase.js');
        return;
    }

    window.game2048 = new Game2048();
    console.log('2048游戏已初始化（使用GameBase v2.0架构）');
    console.log('游戏统计:', window.game2048.getStats());
});
