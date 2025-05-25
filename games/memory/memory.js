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
        
        // 更新显示
        movesDisplay.textContent = '0';
        timeDisplay.textContent = '00:00';
        matchedPairsDisplay.textContent = '0';
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
            
            cardElement.addEventListener('click', () => flipCard(cardElement, index));
            memoryBoard.appendChild(cardElement);
        });
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
                    
                    // 重置翻转状态
                    flippedCards = [];
                    canFlip = true;
                    
                    // 检查是否完成游戏
                    if (matchedPairs === totalPairs) {
                        endGame();
                    }
                }, 500);
            } else {
                // 不匹配，翻回去
                setTimeout(() => {
                    card1.element.classList.remove('flipped');
                    card2.element.classList.remove('flipped');
                    flippedCards = [];
                    canFlip = true;
                }, 1000);
            }
        }
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
        
        // 显示结果
        resultTimeDisplay.textContent = timeDisplay.textContent;
        resultMovesDisplay.textContent = moves.toString();
        
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