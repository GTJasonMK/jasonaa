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
    
    // 等级系统配置
    const levelConfig = {
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
    
    let score = 0; // 游戏得分
    
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

    // 初始化游戏
    function initGame() {
        // 重置游戏状态
        cards = [];
        flippedCards = [];
        matchedPairs = 0;
        moves = 0;
        gameStarted = false;
        clearInterval(timerInterval);
        level = 1;
        score = 0;
        comboMatches = 0;
        
        // 更新显示
        movesDisplay.textContent = '0';
        timeDisplay.textContent = '00:00';
        matchedPairsDisplay.textContent = '0';
        scoreDisplay.textContent = '0';
        levelDisplay.textContent = '1';
        comboDisplay.textContent = '0';
        memoryBoard.innerHTML = '';
        
        // 隐藏结果弹窗
        gameResult.classList.remove('show');
        
        // 根据选择的难度设置游戏
        const difficulty = difficultySelect.value;
        const config = difficulties[difficulty];
        memoryBoard.className = `memory-board ${difficulty}`;
        
        if (difficulty === 'easy') {
            memoryBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
            memoryBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
        } else if (difficulty === 'medium') {
            memoryBoard.style.gridTemplateColumns = 'repeat(6, 1fr)';
            memoryBoard.style.gridTemplateRows = 'repeat(4, 1fr)';
        } else if (difficulty === 'hard') {
            memoryBoard.style.gridTemplateColumns = 'repeat(6, 1fr)';
            memoryBoard.style.gridTemplateRows = 'repeat(6, 1fr)';
        }
        
        // 创建卡片
        totalPairs = config.symbols;
        totalPairsDisplay.textContent = totalPairs.toString();
        createCards(config);
    }

    // 创建游戏卡片
    function createCards(config) {
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
            
            // 添加点击事件
            cardElement.addEventListener('click', () => flipCard(cardElement, index));
            
            // 添加触摸事件
            cardElement.addEventListener('touchstart', handleTouchStart, false);
            cardElement.addEventListener('touchmove', handleTouchMove, false);
            cardElement.addEventListener('touchend', handleTouchEnd, false);
            
            memoryBoard.appendChild(cardElement);
        });
    }

    // 处理触摸开始事件
    function handleTouchStart(e) {
        e.preventDefault(); // 防止页面滚动
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchElement = this;
    }
    
    // 处理触摸移动事件
    function handleTouchMove(e) {
        e.preventDefault(); // 防止页面滚动
        if (!touchElement) return;
        
        touchEndX = e.touches[0].clientX;
        touchEndY = e.touches[0].clientY;
    }
    
    // 处理触摸结束事件
    function handleTouchEnd(e) {
        e.preventDefault(); // 防止页面滚动
        if (!touchElement) return;
        
        // 计算滑动距离
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // 如果滑动距离很小，视为点击
        if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
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
        if (!gameStarted || cards[index].matched || !canFlip || flippedCards.length >= 2) return;
        
        // 忽略点击已经翻转的卡片
        if (flippedCards.some(card => card.index === index)) return;
        
        // 翻转卡片
        cardElement.classList.add('flipped');
        
        // 添加到翻转的卡片数组
        flippedCards.push({ element: cardElement, index: index });
        
        // 如果翻转了两张卡片，检查是否匹配
        if (flippedCards.length === 2) {
            moves++;
            movesDisplay.textContent = moves.toString();
            canFlip = false;
            
            const [card1, card2] = flippedCards;
            
            // 检查卡片是否匹配
            if (cards[card1.index].symbol === cards[card2.index].symbol) {
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
                    
                    // 计算得分，基础分10分，乘以等级加成
                    const baseScore = 10;
                    const timeBonus = calculateTimeBonus();
                    const comboBonus = levelConfig[level].comboBonus * Math.min(comboMatches, 10);
                    const earnedScore = Math.floor(baseScore * comboBonus * timeBonus);
                    
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
                // 不匹配，翻回去
                setTimeout(() => {
                    card1.element.classList.remove('flipped');
                    card2.element.classList.remove('flipped');
                    flippedCards = [];
                    canFlip = true;
                    
                    // 重置连击
                    comboMatches = 0;
                    comboDisplay.textContent = '0';
                }, levelConfig[level].memoryTime);
            }
        }
    }
    
    // 计算时间奖励分数
    function calculateTimeBonus() {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        // 游戏开始后前30秒有额外奖励，随着时间推移奖励降低
        const timeMultiplier = Math.max(1, 3 - Math.floor(elapsedSeconds / 30));
        return timeMultiplier;
    }
    
    // 显示得分动画
    function showScoreAnimation(points, element) {
        const scorePopup = document.createElement('div');
        scorePopup.className = 'score-popup';
        scorePopup.textContent = `+${points}`;
        
        // 获取卡片在页面中的位置
        const rect = element.getBoundingClientRect();
        const boardRect = memoryBoard.getBoundingClientRect();
        
        // 设置弹出框位置
        scorePopup.style.position = 'absolute';
        scorePopup.style.left = `${rect.left - boardRect.left + rect.width/2}px`;
        scorePopup.style.top = `${rect.top - boardRect.top}px`;
        scorePopup.style.transform = 'translate(-50%, -100%)';
        scorePopup.style.color = '#FFD700';
        scorePopup.style.fontSize = '24px';
        scorePopup.style.fontWeight = 'bold';
        scorePopup.style.textShadow = '0 0 5px rgba(0,0,0,0.5)';
        scorePopup.style.zIndex = '100';
        scorePopup.style.animation = 'scorePopup 1s ease-out forwards';
        
        // 添加CSS动画
        if (!document.getElementById('score-popup-style')) {
            const style = document.createElement('style');
            style.id = 'score-popup-style';
            style.textContent = `
                @keyframes scorePopup {
                    0% { opacity: 0; transform: translate(-50%, -100%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -150%) scale(1.2); }
                    80% { opacity: 1; transform: translate(-50%, -200%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -250%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }
        
        memoryBoard.appendChild(scorePopup);
        
        // 移除动画元素
        setTimeout(() => {
            scorePopup.remove();
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
        initGame();
        gameStarted = true;
        canFlip = true;
        
        // 启动计时器
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        
        // 禁用难度选择和开始按钮
        difficultySelect.disabled = true;
        startBtn.disabled = true;
    }

    // 更新计时器
    function updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    resetBtn.addEventListener('click', initGame);
    playAgainBtn.addEventListener('click', startGame);
    difficultySelect.addEventListener('change', initGame);

    // 初始设置
    initGame();
}); 