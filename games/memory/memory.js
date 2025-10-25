/**
 * 记忆翻牌游戏 - 基于GameBase v2.0架构的优化版
 *
 * 功能特性：
 * - 三种难度等级（简单4x4、中等6x4、困难6x6）
 * - 10级等级系统，使用GameBase统一的LevelSystem
 * - 连击系统，连续匹配获得额外分数奖励
 * - 计时器和步数统计
 * - 触摸和鼠标双重支持
 * - 响应式布局，支持横竖屏自动适配
 * - 使用GameBase的NotificationSystem显示通知
 * - 使用GameBase的StorageHelper管理数据
 */

class MemoryGame extends GameBase {
    constructor() {
        super('memory', { enableAutoCleanup: true, enableNotifications: true });

        // 游戏难度配置
        this.difficulties = {
            easy: { rows: 4, cols: 4, symbols: 8 },
            medium: { rows: 4, cols: 6, symbols: 12 },
            hard: { rows: 6, cols: 6, symbols: 18 }
        };

        // 卡片图案（使用Emoji）
        this.cardSymbols = [
            '🍎', '🍌', '🍒', '🍇', '🍉', '🍋', '🍊', '🍍',
            '🍓', '🍑', '🍐', '🥝', '🍈', '🫐', '🍏', '🥥',
            '🥭', '🍅', '🥑', '🌽', '🥕', '🫑', '🌶️', '🍄',
            '🐱', '🐶', '🐼', '🐨', '🦊', '🦁', '🐯', '🐵'
        ];

        // 等级系统配置（默认值）
        this.DEFAULT_LEVEL_CONFIG = {
            1: { requiredScore: 0, memoryTime: 1000, comboBonus: 1 },
            2: { requiredScore: 50, memoryTime: 900, comboBonus: 1.2 },
            3: { requiredScore: 150, memoryTime: 800, comboBonus: 1.4 },
            4: { requiredScore: 300, memoryTime: 700, comboBonus: 1.6 },
            5: { requiredScore: 500, memoryTime: 600, comboBonus: 1.8 },
            6: { requiredScore: 800, memoryTime: 500, comboBonus: 2 },
            7: { requiredScore: 1200, memoryTime: 400, comboBonus: 2.5 },
            8: { requiredScore: 2000, memoryTime: 300, comboBonus: 3 },
            9: { requiredScore: 3000, memoryTime: 200, comboBonus: 3.5 },
            10: { requiredScore: 5000, memoryTime: 100, comboBonus: 4 }
        };

        // 当前使用的配置
        this.levelConfig = JSON.parse(JSON.stringify(this.DEFAULT_LEVEL_CONFIG));

        // 游戏设置（从settingsManager加载，否则使用默认值）
        this.defaultDifficulty = this.settings?.defaultDifficulty || 'medium';
        this.memoryTime = this.settings?.cardShowDuration !== undefined ? this.settings.cardShowDuration : 1000;
        this.comboMatchBonus = this.settings?.consecutiveMatchBonus !== undefined ? this.settings.consecutiveMatchBonus : 10;
        this.incorrectPenalty = this.settings?.wrongMatchPenalty !== undefined ? this.settings.wrongMatchPenalty : 0;
        this.timePenalty = this.settings?.timerPenaltyPerSecond !== undefined ? this.settings.timerPenaltyPerSecond : 0;

        // 更新等级配置
        for (let i = 1; i <= 10; i++) {
            if (this.levelConfig[i]) {
                this.levelConfig[i].memoryTime = Math.max(100, this.memoryTime - (i - 1) * 100);
            }
        }

        // 设置等级系统
        this.setupLevelSystem(this.levelConfig);

        // 游戏状态
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 8;
        this.moves = 0;
        this.gameStarted = false;
        this.timerInterval = null;
        this.startTime = null;
        this.canFlip = false;
        this.comboMatches = 0;

        // 触摸事件变量
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.touchElement = null;
        this.touchDebounce = false;
        this.lastTouchTime = 0;

        // DOM元素
        this.memoryBoard = document.getElementById('memory-board');
        this.difficultySelect = document.getElementById('difficulty');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.movesDisplay = document.getElementById('moves');
        this.timeDisplay = document.getElementById('time');
        this.matchedPairsDisplay = document.getElementById('matched-pairs');
        this.totalPairsDisplay = document.getElementById('total-pairs');
        this.gameResult = document.getElementById('game-result');
        this.resultTimeDisplay = document.getElementById('result-time');
        this.resultMovesDisplay = document.getElementById('result-moves');

        // 创建并添加等级和分数显示
        this.createStatsDisplay();

        // 根据设备类型调整体验
        if (this.deviceInfo.isMobile) {
            document.body.classList.add('mobile-device');
        }
        if (this.deviceInfo.isIOS) {
            document.body.classList.add('ios-device');
        }

        // 初始化
        this.init();
    }

    /**
     * 创建统计信息显示
     */
    createStatsDisplay() {
        const statsContainer = document.createElement('div');
        statsContainer.className = 'stats-container';
        statsContainer.innerHTML = `
            <div class="stat-item">
                <span>分数:</span>
                <span id="score-display">0</span>
            </div>
            <div class="stat-item">
                <span>等级:</span>
                <span id="level-display">1</span>
            </div>
            <div class="stat-item">
                <span>连击:</span>
                <span id="combo-display">0</span>
            </div>
        `;

        const gameInfo = document.querySelector('.game-info');
        if (gameInfo) {
            gameInfo.appendChild(statsContainer);
        } else {
            const container = document.querySelector('.memory-container') || document.querySelector('.container');
            const firstChild = container.firstChild;
            container.insertBefore(statsContainer, firstChild);
        }

        this.scoreDisplay = document.getElementById('score-display');
        this.levelDisplay = document.getElementById('level-display');
        this.comboDisplay = document.getElementById('combo-display');
    }

    /**
     * 初始化游戏
     */
    init() {
        // 清除之前的卡片
        this.clearOldCards();

        // 重置游戏状态
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.state.score = 0;
        this.state.level = 1;
        this.comboMatches = 0;
        this.gameStarted = false;
        this.canFlip = false;

        // 清除计时器
        if (this.timerInterval) {
            this.resourceManager.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // 设置布局
        const difficulty = this.difficulties[this.difficultySelect.value];
        this.totalPairs = difficulty.symbols;

        // 设置网格大小
        this.memoryBoard.style.gridTemplateColumns = `repeat(${difficulty.cols}, 1fr)`;
        this.memoryBoard.style.gridTemplateRows = `repeat(${difficulty.rows}, 1fr)`;

        // 根据难度和屏幕方向调整布局
        this.memoryBoard.className = `memory-board ${this.difficultySelect.value}`;
        this.adjustForOrientation();

        // 更新UI
        this.movesDisplay.textContent = '0';
        this.timeDisplay.textContent = '00:00';
        this.matchedPairsDisplay.textContent = '0';
        this.totalPairsDisplay.textContent = this.totalPairs.toString();
        this.scoreDisplay.textContent = '0';
        this.levelDisplay.textContent = '1';
        this.comboDisplay.textContent = '0';

        // 隐藏结果
        this.gameResult.classList.remove('show');

        // 创建卡片
        this.createCards(difficulty);

        // 设置事件监听器
        this.setupEventListeners();

        console.log('记忆游戏初始化完成（使用GameBase v2.0架构）');
    }

    /**
     * 清除旧卡片
     */
    clearOldCards() {
        const oldCards = document.querySelectorAll('.memory-card');
        oldCards.forEach(card => {
            if (card.handleClick) {
                card.removeEventListener('click', card.handleClick);
            }
            card.removeEventListener('touchstart', this.handleTouchStart);
            card.removeEventListener('touchmove', this.handleTouchMove);
            card.removeEventListener('touchend', this.handleTouchEnd);
            card.remove();
        });
        this.memoryBoard.innerHTML = '';
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 按钮事件
        this.on(this.startBtn, 'click', () => this.startGame());
        this.on(this.resetBtn, 'click', () => this.resetGame());
        this.on(this.playAgainBtn, 'click', () => this.startGame());
        this.on(this.difficultySelect, 'change', () => this.init());

        // 屏幕方向和尺寸变化事件
        this.on(window, 'orientationchange', () => this.adjustForOrientation());
        this.on(window, 'resize', this.debounce(() => this.adjustForOrientation(), 250));
    }

    /**
     * 防抖函数
     */
    debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = this.setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * 屏幕方向调整
     */
    adjustForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);

        this.updateLayoutForOrientation();
    }

    /**
     * 根据屏幕方向更新布局
     */
    updateLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const difficulty = this.difficulties[this.difficultySelect.value];

        if (isLandscape) {
            const maxHeight = window.innerHeight * 0.7;
            const cardSize = Math.min(maxHeight / difficulty.rows, (window.innerWidth * 0.7) / difficulty.cols);
            document.documentElement.style.setProperty('--memory-card-size', cardSize + 'px');
        } else {
            const cardSize = Math.min(80, (window.innerWidth - 40) / difficulty.cols);
            document.documentElement.style.setProperty('--memory-card-size', cardSize + 'px');
        }
    }

    /**
     * 创建游戏卡片
     */
    createCards(config) {
        // 创建卡片对
        for (let i = 0; i < config.symbols; i++) {
            this.cards.push(
                { symbol: this.cardSymbols[i], matched: false },
                { symbol: this.cardSymbols[i], matched: false }
            );
        }

        // 随机排序卡片
        this.shuffleCards(this.cards);

        // 创建DOM元素
        this.cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.index = index;

            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back"></div>
                    <div class="card-face card-front">${card.symbol}</div>
                </div>
            `;

            // 添加点击事件
            const handleClick = () => this.flipCard(cardElement, index);
            cardElement.addEventListener('click', handleClick);
            cardElement.handleClick = handleClick;

            // 添加触摸事件
            cardElement.addEventListener('touchstart', (e) => this.handleTouchStart(e), false);
            cardElement.addEventListener('touchmove', (e) => this.handleTouchMove(e), false);
            cardElement.addEventListener('touchend', (e) => this.handleTouchEnd(e), false);

            this.memoryBoard.appendChild(cardElement);
        });
    }

    /**
     * 洗牌算法
     */
    shuffleCards(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * 处理触摸开始事件
     */
    handleTouchStart(e) {
        e.preventDefault();

        const now = Date.now();
        if (now - this.lastTouchTime < 300) {
            return;
        }
        this.lastTouchTime = now;

        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchElement = e.currentTarget;

        this.touchElement.classList.add('touch-active');
    }

    /**
     * 处理触摸移动事件
     */
    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchElement) return;

        const touch = e.touches[0];
        const touchMoveX = touch.clientX;
        const touchMoveY = touch.clientY;

        const diffX = touchMoveX - this.touchStartX;
        const diffY = touchMoveY - this.touchStartY;

        const moveThreshold = 20;
        if (Math.abs(diffX) > moveThreshold || Math.abs(diffY) > moveThreshold) {
            this.touchElement.classList.remove('touch-active');
            this.touchDebounce = true;
        }
    }

    /**
     * 处理触摸结束事件
     */
    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.touchElement) return;

        this.touchElement.classList.remove('touch-active');

        if (this.touchDebounce) {
            this.touchDebounce = false;
            this.touchElement = null;
            return;
        }

        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.lastTouchTime;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - this.touchStartX;
        const diffY = touchEndY - this.touchStartY;

        const tapThreshold = 10;
        if (touchDuration < 1000 && Math.abs(diffX) < tapThreshold && Math.abs(diffY) < tapThreshold) {
            const index = parseInt(this.touchElement.dataset.index);
            this.flipCard(this.touchElement, index);
        }

        this.touchElement = null;
    }

    /**
     * 翻转卡片
     */
    flipCard(cardElement, index) {
        if (!this.gameStarted || this.cards[index].matched || !this.canFlip || this.flippedCards.length >= 2) {
            return;
        }

        if (this.flippedCards.length === 1 && this.flippedCards[0].index === index) {
            return;
        }

        cardElement.classList.add('flipped');

        this.flippedCards.push({
            element: cardElement,
            index: index
        });

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.movesDisplay.textContent = this.moves.toString();
            this.canFlip = false;

            const card1 = this.flippedCards[0];
            const card2 = this.flippedCards[1];

            if (this.cards[card1.index].symbol === this.cards[card2.index].symbol) {
                // 匹配成功
                this.setTimeout(() => {
                    card1.element.classList.add('matched');
                    card2.element.classList.add('matched');

                    this.cards[card1.index].matched = true;
                    this.cards[card2.index].matched = true;

                    this.matchedPairs++;
                    this.matchedPairsDisplay.textContent = this.matchedPairs.toString();

                    // 更新连击和分数
                    this.comboMatches++;
                    this.comboDisplay.textContent = this.comboMatches.toString();

                    const baseScore = 10;
                    const timeBonus = this.calculateTimeBonus();
                    const comboScore = Math.min(this.comboMatches * this.comboMatchBonus, 100);
                    const levelMultiplier = this.levelConfig[this.state.level].comboBonus;
                    const earnedScore = Math.floor((baseScore + comboScore) * levelMultiplier * timeBonus);

                    this.updateScore(earnedScore);
                    this.scoreDisplay.textContent = this.state.score.toString();

                    this.showScoreAnimation(earnedScore, card1.element);

                    // 使用GameBase的自动等级更新
                    if (this.autoUpdateLevel()) {
                        this.levelDisplay.textContent = this.state.level.toString();
                    }

                    this.flippedCards = [];
                    this.canFlip = true;

                    if (this.matchedPairs === this.totalPairs) {
                        this.endGame();
                    }
                }, this.levelConfig[this.state.level].memoryTime / 2);
            } else {
                // 匹配失败
                this.setTimeout(() => {
                    card1.element.classList.remove('flipped');
                    card2.element.classList.remove('flipped');

                    this.flippedCards = [];
                    this.canFlip = true;

                    this.comboMatches = 0;
                    this.comboDisplay.textContent = '0';

                    if (this.incorrectPenalty > 0) {
                        this.state.score = Math.max(0, this.state.score - this.incorrectPenalty);
                        this.scoreDisplay.textContent = this.state.score.toString();
                        this.showPenaltyAnimation(this.incorrectPenalty, card1.element);
                    }
                }, this.levelConfig[this.state.level].memoryTime);
            }

            // 添加锁，防止在计时器结束前翻卡
            document.querySelectorAll('.memory-card').forEach(card => {
                card.style.pointerEvents = 'none';
            });

            this.setTimeout(() => {
                if (this.gameStarted && this.canFlip) {
                    document.querySelectorAll('.memory-card:not(.matched)').forEach(card => {
                        card.style.pointerEvents = 'auto';
                    });
                }
            }, this.levelConfig[this.state.level].memoryTime);
        }
    }

    /**
     * 计算时间奖励
     */
    calculateTimeBonus() {
        if (!this.startTime) return 1;

        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        if (elapsedSeconds < 30) return 1;

        return Math.max(0.5, 1 - (elapsedSeconds - 30) / 300);
    }

    /**
     * 显示得分动画
     */
    showScoreAnimation(points, element) {
        const animation = document.createElement('div');
        animation.className = 'score-animation';
        animation.textContent = `+${points}`;

        const rect = element.getBoundingClientRect();
        const boardRect = this.memoryBoard.getBoundingClientRect();

        animation.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
        animation.style.top = `${rect.top - boardRect.top}px`;

        this.memoryBoard.appendChild(animation);

        this.setTimeout(() => {
            animation.remove();
        }, 1000);
    }

    /**
     * 显示惩罚动画
     */
    showPenaltyAnimation(points, element) {
        const animation = document.createElement('div');
        animation.className = 'penalty-animation';
        animation.textContent = `-${points}`;

        const rect = element.getBoundingClientRect();
        const boardRect = this.memoryBoard.getBoundingClientRect();

        animation.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
        animation.style.top = `${rect.top - boardRect.top}px`;

        this.memoryBoard.appendChild(animation);

        this.setTimeout(() => {
            animation.remove();
        }, 1000);
    }

    /**
     * 开始游戏
     */
    startGame() {
        console.log('开始新游戏，重新初始化...');
        this.init();

        this.gameStarted = true;
        this.canFlip = true;

        this.startBtn.textContent = '游戏进行中';
        this.startBtn.disabled = true;

        this.startTime = Date.now();
        this.timerInterval = this.setInterval(() => this.updateTimer(), 1000);

        this.difficultySelect.disabled = true;

        console.log('记忆游戏已开始，可以翻转卡片');
    }

    /**
     * 更新计时器
     */
    updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;

        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (this.timePenalty > 0 && elapsedSeconds > 30) {
            this.state.score = Math.max(0, this.state.score - this.timePenalty);
            this.scoreDisplay.textContent = this.state.score.toString();
        }
    }

    /**
     * 结束游戏
     */
    endGame() {
        if (this.timerInterval) {
            this.resourceManager.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.gameStarted = false;

        // 添加等级奖励
        const levelBonus = this.state.level * 50;
        this.state.score += levelBonus;
        this.scoreDisplay.textContent = this.state.score.toString();

        // 显示结果
        this.resultTimeDisplay.textContent = this.timeDisplay.textContent;
        this.resultMovesDisplay.textContent = this.moves.toString();

        const resultContent = this.gameResult.querySelector('.result-content') || this.gameResult;

        let scoreElement = resultContent.querySelector('.result-score');
        let levelElement = resultContent.querySelector('.result-level');

        if (!scoreElement) {
            scoreElement = document.createElement('p');
            scoreElement.className = 'result-score';
            resultContent.appendChild(scoreElement);
        }

        if (!levelElement) {
            levelElement = document.createElement('p');
            levelElement.className = 'result-level';
            resultContent.appendChild(levelElement);
        }

        scoreElement.textContent = `最终得分: ${this.state.score}`;
        levelElement.textContent = `达到等级: ${this.state.level}`;

        let bonusElement = resultContent.querySelector('.result-bonus');
        if (!bonusElement) {
            bonusElement = document.createElement('p');
            bonusElement.className = 'result-bonus';
            resultContent.appendChild(bonusElement);
        }

        bonusElement.textContent = `等级奖励: +${levelBonus}`;
        bonusElement.style.color = '#FFD700';

        // 使用GameBase的存储API检查和保存最高分
        const highScore = this.loadGameData('highScore', 0);
        if (this.state.score > highScore) {
            this.saveGameData('highScore', this.state.score);

            let newRecordElement = resultContent.querySelector('.new-record');
            if (!newRecordElement) {
                newRecordElement = document.createElement('p');
                newRecordElement.className = 'new-record';
                resultContent.appendChild(newRecordElement);
            }

            newRecordElement.textContent = '新纪录!';
            newRecordElement.style.color = '#FFD700';
            newRecordElement.style.fontSize = '24px';
            newRecordElement.style.fontWeight = 'bold';

            // 使用GameBase的通知系统
            this.notify.success('恭喜！创造新纪录！', 3000);
        }

        this.setTimeout(() => {
            this.gameResult.classList.add('show');
        }, 500);

        this.difficultySelect.disabled = false;
        this.startBtn.disabled = false;
        this.startBtn.textContent = '开始游戏';
    }

    /**
     * 重置游戏
     */
    resetGame() {
        console.log('重置游戏...');

        if (this.timerInterval) {
            this.resourceManager.clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.difficultySelect.disabled = false;
        this.startBtn.disabled = false;
        this.startBtn.textContent = '开始游戏';

        this.gameResult.classList.remove('show');

        this.init();
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

    window.memoryGame = new MemoryGame();
    console.log('记忆翻牌游戏已初始化（使用GameBase v2.0架构）');
    console.log('游戏统计:', window.memoryGame.getStats());
});
