document.addEventListener('DOMContentLoaded', function() {
    // 游戏元素
    const memoryBoard = document.getElementById('memory-board');
    const difficultySelect = document.getElementById('difficulty');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const movesDisplay = document.getElementById('moves');
    const timeDisplay = document.getElementById('time');
    const matchedPairsDisplay = document.getElementById('matched-pairs');
    const totalPairsDisplay = document.getElementById('total-pairs');
    const gameResult = document.getElementById('game-result');
    const resultTimeDisplay = document.getElementById('result-time');
    const resultMovesDisplay = document.getElementById('result-moves');

    // 游戏状态
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let totalPairs = 8;
    let moves = 0;
    let gameStarted = false;
    let timerInterval;
    let startTime;
    let canFlip = false;
    let level = 1; // 当前等级
    let comboMatches = 0; // 连续匹配次数
    let score = 0;
    
    // 游戏设置默认值
    let defaultDifficulty = 'medium';
    let memoryTime = 1000; // 默认卡片展示时间（毫秒）
    let comboMatchBonus = 10; // 连续匹配得分奖励
    let incorrectPenalty = 0; // 错误匹配的惩罚
    let timePenalty = 0; // 时间惩罚（每秒扣分）
    
    // 等级系统配置（默认值）
    const DEFAULT_LEVEL_CONFIG = {
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
    let levelConfig = JSON.parse(JSON.stringify(DEFAULT_LEVEL_CONFIG));
    
    // 从设置管理器加载用户设置
    function loadUserSettings() {
        console.log('开始加载记忆游戏设置...');
        // 重置为默认值
        defaultDifficulty = 'medium';
        memoryTime = 1000;
        comboMatchBonus = 10;
        incorrectPenalty = 0;
        timePenalty = 0;
        levelConfig = JSON.parse(JSON.stringify(DEFAULT_LEVEL_CONFIG));
        
        // 尝试从settingsManager加载设置
        if (window.settingsManager) {
            try {
                let settings;
                // 检查设置是否有更新
                const updatedSettings = window.settingsManager.checkSettingsUpdated();
                if (updatedSettings) {
                    console.log('检测到设置已更新，应用新设置');
                    settings = updatedSettings;
                } else {
                    // 否则获取当前设置
                    settings = window.settingsManager.settings;
                }
                
                console.log('记忆游戏设置对象:', settings);
                
                if (settings && settings.memory) {
                    console.log('读取记忆游戏设置:', settings.memory);
                    
                    // 默认难度
                    if (settings.memory.defaultDifficulty) {
                        defaultDifficulty = settings.memory.defaultDifficulty;
                        difficultySelect.value = defaultDifficulty;
                        console.log('设置默认难度:', defaultDifficulty);
                    }
                    
                    // 卡片展示时间
                    if (settings.memory.cardShowDuration !== undefined) {
                        memoryTime = settings.memory.cardShowDuration;
                        console.log('设置卡片展示时间:', memoryTime);
                    }
                    
                    // 连续匹配奖励
                    if (settings.memory.consecutiveMatchBonus !== undefined) {
                        comboMatchBonus = settings.memory.consecutiveMatchBonus;
                        console.log('设置连续匹配奖励:', comboMatchBonus);
                    }
                    
                    // 错误匹配惩罚
                    if (settings.memory.wrongMatchPenalty !== undefined) {
                        incorrectPenalty = settings.memory.wrongMatchPenalty;
                        console.log('设置错误匹配惩罚:', incorrectPenalty);
                    }
                    
                    // 时间惩罚
                    if (settings.memory.timerPenaltyPerSecond !== undefined) {
                        timePenalty = settings.memory.timerPenaltyPerSecond;
                        console.log('设置时间惩罚:', timePenalty);
                    }
                    
                    // 更新等级配置
                    for (let i = 1; i <= 10; i++) {
                        if (levelConfig[i]) {
                            levelConfig[i].memoryTime = Math.max(100, memoryTime - (i - 1) * 100);
                        }
                    }
                    
                    console.log('已应用记忆游戏设置, 等级配置:', levelConfig);
                } else {
                    console.warn('未找到记忆游戏设置，使用默认值');
                }
            } catch (e) {
                console.error('加载记忆游戏设置时出错:', e);
            }
        } else {
            console.warn('settingsManager不可用，使用默认设置');
        }
    }
    
    // 创建等级和分数显示
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
    
    // 在匹配对数显示后插入统计信息
    const gameInfo = document.querySelector('.game-info');
    if (gameInfo) {
        gameInfo.appendChild(statsContainer);
    } else {
        // 如果找不到.game-info，则在其他合适位置插入
        const container = document.querySelector('.memory-container') || document.querySelector('.container');
        const firstChild = container.firstChild;
        container.insertBefore(statsContainer, firstChild);
    }
    
    const scoreDisplay = document.getElementById('score-display');
    const levelDisplay = document.getElementById('level-display');
    const comboDisplay = document.getElementById('combo-display');
    
    // 触摸事件变量
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let touchElement = null;
    
    // 游戏难度配置
    const difficulties = {
        easy: { rows: 4, cols: 4, symbols: 8 },
        medium: { rows: 4, cols: 6, symbols: 12 },
        hard: { rows: 6, cols: 6, symbols: 18 }
    };
    
    // 卡片图案（使用Emoji）
    const cardSymbols = [
        '🍎', '🍌', '🍒', '🍇', '🍉', '🍋', '🍊', '🍍',
        '🍓', '🍑', '🍐', '🥝', '🍈', '🫐', '🍏', '🥥',
        '🥭', '🍅', '🥑', '🌽', '🥕', '🫑', '🌶️', '🍄',
        '🐱', '🐶', '🐼', '🐨', '🦊', '🦁', '🐯', '🐵'
    ];

    // 防抖变量
    let touchDebounce = false;
    let lastTouchTime = 0;
    
    // 检测设备类型
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 根据设备类型调整体验
    if (isMobile) {
        document.body.classList.add('mobile-device');
    }
    if (isIOS) {
        document.body.classList.add('ios-device');
    }
    
    // 监听屏幕方向变化
    window.addEventListener('orientationchange', adjustForOrientation);
    window.addEventListener('resize', debounce(adjustForOrientation, 250));
    
    // 屏幕方向调整
    function adjustForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape', isLandscape);
        document.body.classList.toggle('portrait', !isLandscape);
        
        // 重新调整游戏布局
        updateLayoutForOrientation();
    }
    
    // 根据屏幕方向更新布局
    function updateLayoutForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        const difficulty = difficulties[difficultySelect.value];
        
        // 调整卡片尺寸和板布局
        if (isLandscape) {
            // 横屏优化 - 卡片较小，布局更横向
            const maxHeight = window.innerHeight * 0.7;
            const cardSize = Math.min(maxHeight / difficulty.rows, (window.innerWidth * 0.7) / difficulty.cols);
            document.documentElement.style.setProperty('--memory-card-size', cardSize + 'px');
        } else {
            // 竖屏优化 - 默认布局
            const cardSize = Math.min(80, (window.innerWidth - 40) / difficulty.cols);
            document.documentElement.style.setProperty('--memory-card-size', cardSize + 'px');
        }
    }
    
    // 防抖函数
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    // 初始化游戏
    function initGame() {
        // 加载最新用户设置
        loadUserSettings();
        
        // 清除之前的卡片和事件监听器
        const oldCards = document.querySelectorAll('.memory-card');
        oldCards.forEach(card => {
            // 移除所有事件监听器，使用存储的引用
            if (card.handleClick) {
                card.removeEventListener('click', card.handleClick);
            }
            card.removeEventListener('touchstart', handleTouchStart);
            card.removeEventListener('touchmove', handleTouchMove);
            card.removeEventListener('touchend', handleTouchEnd);
            // 从DOM中移除
            card.remove();
        });
        
        // 清空记忆板
        memoryBoard.innerHTML = '';
        
        // 重置游戏状态
        cards = [];
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        score = 0;
        level = 1;
        comboMatches = 0;
        gameStarted = false;
        canFlip = false;
        
        // 清除计时器
        clearInterval(timerInterval);
        
        // 设置布局
        const difficulty = difficulties[difficultySelect.value];
        totalPairs = difficulty.symbols;
        
        // 设置网格大小
        memoryBoard.style.gridTemplateColumns = `repeat(${difficulty.cols}, 1fr)`;
        memoryBoard.style.gridTemplateRows = `repeat(${difficulty.rows}, 1fr)`;
        
        // 根据难度和屏幕方向调整布局
        memoryBoard.className = `memory-board ${difficultySelect.value}`;
        adjustForOrientation();
        
        // 更新UI
        movesDisplay.textContent = '0';
        timeDisplay.textContent = '00:00';
        matchedPairsDisplay.textContent = '0';
        totalPairsDisplay.textContent = totalPairs.toString();
        scoreDisplay.textContent = '0';
        levelDisplay.textContent = '1';
        comboDisplay.textContent = '0';
        
        // 隐藏结果
        gameResult.classList.remove('show');
        
        // 创建卡片
        createCards(difficulty);
        
        console.log('游戏初始化完成，等待开始...');
    }

    // 创建游戏卡片
    function createCards(config) {
        console.log('创建卡片，配置:', config);
        // 创建卡片对
        for (let i = 0; i < config.symbols; i++) {
            cards.push(
                { symbol: cardSymbols[i], matched: false },
                { symbol: cardSymbols[i], matched: false }
            );
        }
        
        // 随机排序卡片
        shuffleCards(cards);
        
        // 创建DOM元素
        cards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'memory-card';
            cardElement.dataset.index = index;
            
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back"></div>
                    <div class="card-face card-front">${card.symbol}</div>
                </div>
            `;
            
            // 添加点击事件 - 使用箭头函数以便保留this上下文和index
            const handleClick = () => flipCard(cardElement, index);
            cardElement.addEventListener('click', handleClick);
            // 存储事件处理函数的引用以便后续移除
            cardElement.handleClick = handleClick;
            
            // 添加触摸事件
            cardElement.addEventListener('touchstart', handleTouchStart, false);
            cardElement.addEventListener('touchmove', handleTouchMove, false);
            cardElement.addEventListener('touchend', handleTouchEnd, false);
            
            memoryBoard.appendChild(cardElement);
        });
        
        console.log(`已创建 ${cards.length} 张卡片`);
    }

    // 处理触摸开始事件
    function handleTouchStart(e) {
        e.preventDefault(); // 防止页面滚动
        
        // 防止快速连续点击
        const now = Date.now();
        if (now - lastTouchTime < 300) { // 300ms内的点击被视为重复点击
            return;
        }
        lastTouchTime = now;
        
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchElement = this;
        
        // 添加触摸反馈效果
        this.classList.add('touch-active');
    }
    
    // 处理触摸移动事件
    function handleTouchMove(e) {
        e.preventDefault(); // 防止页面滚动
        if (!touchElement) return;
        
        const touch = e.touches[0];
        const touchMoveX = touch.clientX;
        const touchMoveY = touch.clientY;
        
        // 计算移动距离
        const diffX = touchMoveX - touchStartX;
        const diffY = touchMoveY - touchStartY;
        
        // 如果移动距离超过阈值，取消点击效果并标记为拖动而非点击
        const moveThreshold = 20;
        if (Math.abs(diffX) > moveThreshold || Math.abs(diffY) > moveThreshold) {
            touchElement.classList.remove('touch-active');
            touchDebounce = true; // 标记为拖动，防止触发点击
        }
    }
    
    // 处理触摸结束事件
    function handleTouchEnd(e) {
        e.preventDefault(); // 防止页面滚动
        if (!touchElement) return;
        
        // 移除触摸反馈效果
        touchElement.classList.remove('touch-active');
        
        // 如果是拖动而非点击，则重置状态并返回
        if (touchDebounce) {
            touchDebounce = false;
            touchElement = null;
            return;
        }
        
        // 计算触摸时长，过长的触摸可能是意外触发
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - lastTouchTime;
        
        // 计算触摸位置变化
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // 如果触摸时长合理且移动距离小，才视为有效点击
        const tapThreshold = 10;
        if (touchDuration < 1000 && Math.abs(diffX) < tapThreshold && Math.abs(diffY) < tapThreshold) {
            const index = parseInt(touchElement.dataset.index);
            flipCard(touchElement, index);
        }
        
        // 重置触摸状态
        touchElement = null;
    }

    // 洗牌算法
    function shuffleCards(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 翻转卡片
    function flipCard(cardElement, index) {
        // 如果游戏未开始或卡片已匹配或不能翻转，则忽略点击
        if (!gameStarted || cards[index].matched || !canFlip || flippedCards.length >= 2) {
            console.log('卡片点击被忽略:', 
                !gameStarted ? '游戏未开始' : 
                cards[index].matched ? '卡片已匹配' : 
                !canFlip ? '当前不能翻转' : 
                '已翻开两张卡片');
            return;
        }
        
        // 防止重复点击同一张卡
        if (flippedCards.length === 1 && flippedCards[0].index === index) {
            console.log('忽略重复点击同一张卡');
            return;
        }
        
        // 翻转卡片
        cardElement.classList.add('flipped');
        console.log(`翻转卡片 ${index}:`, cards[index].symbol);
        
        // 添加到已翻转数组
        flippedCards.push({
            element: cardElement,
            index: index
        });
        
        // 如果翻转了两张卡片
        if (flippedCards.length === 2) {
            // 增加移动步数
            moves++;
            movesDisplay.textContent = moves.toString();
            canFlip = false;
            
            const card1 = flippedCards[0];
            const card2 = flippedCards[1];
            
            // 检查卡片是否匹配
            if (cards[card1.index].symbol === cards[card2.index].symbol) {
                console.log('匹配成功!');
                // 匹配成功
                setTimeout(() => {
                    card1.element.classList.add('matched');
                    card2.element.classList.add('matched');
                    
                    cards[card1.index].matched = true;
                    cards[card2.index].matched = true;
                    
                    matchedPairs++;
                    matchedPairsDisplay.textContent = matchedPairs.toString();
                    
                    // 更新连击和分数
                    comboMatches++;
                    comboDisplay.textContent = comboMatches.toString();
                    
                    // 计算得分，基础分加上连击奖励，乘以等级加成
                    const baseScore = 10;
                    const timeBonus = calculateTimeBonus();
                    // 使用设置中的连击奖励值和等级加成
                    const comboScore = Math.min(comboMatches * comboMatchBonus, 100);
                    const levelMultiplier = levelConfig[level].comboBonus;
                    const earnedScore = Math.floor((baseScore + comboScore) * levelMultiplier * timeBonus);
                    
                    score += earnedScore;
                    scoreDisplay.textContent = score.toString();
                    
                    // 显示得分动画
                    showScoreAnimation(earnedScore, card1.element);
                    
                    // 检查等级
                    checkAndUpdateLevel();
                    
                    // 重置翻转状态
                    flippedCards = [];
                    canFlip = true;
                    
                    // 检查是否完成游戏
                    if (matchedPairs === totalPairs) {
                        endGame();
                    }
                }, levelConfig[level].memoryTime / 2);
            } else {
                console.log('匹配失败');
                // 匹配失败
                setTimeout(() => {
                    card1.element.classList.remove('flipped');
                    card2.element.classList.remove('flipped');
                    
                    // 重置翻转状态
                    flippedCards = [];
                    canFlip = true;
                    
                    // 重置连击
                    comboMatches = 0;
                    comboDisplay.textContent = '0';
                    
                    // 应用错误匹配惩罚，如果设置了的话
                    if (incorrectPenalty > 0) {
                        score = Math.max(0, score - incorrectPenalty);
                        scoreDisplay.textContent = score.toString();
                        showPenaltyAnimation(incorrectPenalty, card1.element);
                    }
                }, levelConfig[level].memoryTime);
            }
            
            // 添加一个锁，防止在计时器结束前翻卡
            document.querySelectorAll('.memory-card').forEach(card => {
                card.style.pointerEvents = 'none';
            });
            
            // 待计时器结束后恢复可点击状态
            setTimeout(() => {
                if (gameStarted && canFlip) { // 确保游戏仍在运行且可以翻卡
                    document.querySelectorAll('.memory-card:not(.matched)').forEach(card => {
                        card.style.pointerEvents = 'auto';
                    });
                }
            }, levelConfig[level].memoryTime);
        }
    }
    
    // 计算时间奖励
    function calculateTimeBonus() {
        if (!startTime) return 1;
        
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        // 前30秒没有时间惩罚
        if (elapsedSeconds < 30) return 1;
        
        // 每超过30秒，奖励系数减少10%，最低0.5
        return Math.max(0.5, 1 - (elapsedSeconds - 30) / 300);
    }
    
    // 显示得分动画
    function showScoreAnimation(points, element) {
        const animation = document.createElement('div');
        animation.className = 'score-animation';
        animation.textContent = `+${points}`;
        
        // 设置动画位置
        const rect = element.getBoundingClientRect();
        const boardRect = memoryBoard.getBoundingClientRect();
        
        animation.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
        animation.style.top = `${rect.top - boardRect.top}px`;
        
        memoryBoard.appendChild(animation);
        
        // 移除动画
        setTimeout(() => {
            animation.remove();
        }, 1000);
    }
    
    // 显示惩罚动画
    function showPenaltyAnimation(points, element) {
        const animation = document.createElement('div');
        animation.className = 'penalty-animation';
        animation.textContent = `-${points}`;
        
        // 设置动画位置
        const rect = element.getBoundingClientRect();
        const boardRect = memoryBoard.getBoundingClientRect();
        
        animation.style.left = `${rect.left - boardRect.left + rect.width / 2}px`;
        animation.style.top = `${rect.top - boardRect.top}px`;
        
        memoryBoard.appendChild(animation);
        
        // 移除动画
        setTimeout(() => {
            animation.remove();
        }, 1000);
    }
    
    // 检查和更新等级
    function checkAndUpdateLevel() {
        let newLevel = 1;
        
        // 找出当前分数对应的最高等级
        for (let i = 10; i >= 1; i--) {
            if (score >= levelConfig[i].requiredScore) {
                newLevel = i;
                break;
            }
        }
        
        // 如果等级提高，显示提示
        if (newLevel > level) {
            const oldLevel = level;
            level = newLevel;
            levelDisplay.textContent = level.toString();
            showLevelUpMessage(oldLevel, level);
        }
    }
    
    // 显示等级提升消息
    function showLevelUpMessage(oldLevel, newLevel) {
        const message = document.createElement('div');
        message.className = 'level-up-message';
        message.textContent = `等级提升! ${oldLevel} → ${newLevel}`;
        
        // 设置样式
        message.style.position = 'absolute';
        message.style.top = '50%';
        message.style.left = '50%';
        message.style.transform = 'translate(-50%, -50%)';
        message.style.backgroundColor = 'rgba(76, 175, 80, 0.9)';
        message.style.color = 'white';
        message.style.padding = '15px 30px';
        message.style.borderRadius = '10px';
        message.style.fontSize = '28px';
        message.style.fontWeight = 'bold';
        message.style.zIndex = '1000';
        message.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.3)';
        message.style.animation = 'levelUpAnimation 2.5s ease-out forwards';
        
        // 添加动画
        if (!document.getElementById('level-up-style')) {
            const style = document.createElement('style');
            style.id = 'level-up-style';
            style.textContent = `
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
        
        // 添加到游戏板
        const container = document.querySelector('.memory-container') || memoryBoard.parentElement;
        container.appendChild(message);
        
        // 播放声音（可选）
        playLevelUpSound();
        
        // 创建闪光效果
        createLevelUpEffect(container);
        
        // 移除消息
        setTimeout(() => {
            message.remove();
        }, 2500);
    }
    
    // 播放等级提升音效
    function playLevelUpSound() {
        try {
            const sound = new Audio('../../assets/sounds/level-up.mp3');
            sound.volume = 0.5;
            sound.play().catch(e => console.log('无法播放音效:', e));
        } catch (error) {
            console.log('音效播放失败:', error);
        }
    }
    
    // 创建等级提升视觉效果
    function createLevelUpEffect(container) {
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
        
        // 移除闪光效果
        setTimeout(() => {
            flash.remove();
        }, 1000);
        
        // 对所有卡片添加特效
        memoryBoard.querySelectorAll('.memory-card').forEach(card => {
            card.style.animation = 'cardWave 0.8s ease-in-out';
            
            if (!document.getElementById('card-wave-style')) {
                const style = document.createElement('style');
                style.id = 'card-wave-style';
                style.textContent = `
                    @keyframes cardWave {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                    }
                `;
                document.head.appendChild(style);
            }
            
            setTimeout(() => {
                card.style.animation = '';
            }, 800);
        });
    }

    // 开始游戏
    function startGame() {
        // 确保每次重新开始游戏时都重新初始化
        console.log('开始新游戏，重新初始化...');
        initGame();
        
        // 标记游戏已开始
        gameStarted = true;
        canFlip = true;
        
        // 更新UI状态
        startBtn.textContent = '游戏进行中';
        startBtn.disabled = true;
        
        // 启动计时器
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        
        // 禁用难度选择和开始按钮
        difficultySelect.disabled = true;
        
        console.log('游戏已开始，可以翻转卡片');
    }

    // 更新计时器
    function updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 如果设置了时间惩罚，则每秒扣分
        if (timePenalty > 0 && elapsedSeconds > 30) {
            // 30秒后开始计时惩罚
            score = Math.max(0, score - timePenalty);
            scoreDisplay.textContent = score.toString();
        }
    }

    // 结束游戏
    function endGame() {
        clearInterval(timerInterval);
        gameStarted = false;
        
        // 添加等级奖励
        const levelBonus = level * 50;
        score += levelBonus;
        scoreDisplay.textContent = score.toString();
        
        // 显示结果
        resultTimeDisplay.textContent = timeDisplay.textContent;
        resultMovesDisplay.textContent = moves.toString();
        
        // 更新结果界面，显示等级和分数
        const resultContent = gameResult.querySelector('.result-content') || gameResult;
        
        // 检查是否已存在等级和分数信息
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
        
        scoreElement.textContent = `最终得分: ${score}`;
        levelElement.textContent = `达到等级: ${level}`;
        
        // 显示奖励信息
        let bonusElement = resultContent.querySelector('.result-bonus');
        if (!bonusElement) {
            bonusElement = document.createElement('p');
            bonusElement.className = 'result-bonus';
            resultContent.appendChild(bonusElement);
        }
        
        bonusElement.textContent = `等级奖励: +${levelBonus}`;
        bonusElement.style.color = '#FFD700';
        
        // 添加或更新最高分
        const highScore = localStorage.getItem('memory_high_score') || 0;
        if (score > highScore) {
            localStorage.setItem('memory_high_score', score);
            
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
        }
        
        // 显示结果弹窗
        setTimeout(() => {
            gameResult.classList.add('show');
        }, 500);
        
        // 启用难度选择和开始按钮
        difficultySelect.disabled = false;
        startBtn.disabled = false;
    }

    // 事件监听器
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', startGame);
    difficultySelect.addEventListener('change', initGame);
    
    // 新增重置游戏函数，与初始化游戏分开
    function resetGame() {
        console.log('重置游戏...');
        // 停止计时器
        clearInterval(timerInterval);
        
        // 显示难度选择和开始按钮
        difficultySelect.disabled = false;
        startBtn.disabled = false;
        startBtn.textContent = '开始游戏';
        
        // 隐藏结果页面
        gameResult.classList.remove('show');
        
        // 初始化游戏
        initGame();
    }

    // 初始设置
    initGame();
}); 