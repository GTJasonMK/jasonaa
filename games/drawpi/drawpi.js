document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const clearBtn = document.getElementById('clear-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const piValueDisplay = document.getElementById('pi-value');
    const accuracyDisplay = document.getElementById('accuracy');
    const messageDisplay = document.getElementById('message');
    const qualityMeterFill = document.getElementById('quality-meter-fill');
    const qualityLabel = document.getElementById('quality-label');
    const rankBadge = document.getElementById('rank-badge');
    const rankIcon = rankBadge.querySelector('.rank-icon');
    const rankTitle = rankBadge.querySelector('.rank-title');
    const currentRank = document.getElementById('current-rank');
    const bestRank = document.getElementById('best-rank');
    const drawHint = document.querySelector('.draw-hint');
    
    // 提示淡出效果
    setTimeout(() => {
        drawHint.classList.add('fade-out');
    }, 5000); // 5秒后提示淡出
    
    // 等级定义
    const ranks = [
        { 
            minAccuracy: 0, 
            name: '初学者', 
            icon: '🔰', 
            class: 'novice',
            description: '开始你的画圆之旅' 
        },
        { 
            minAccuracy: 70, 
            name: '学徒', 
            icon: '🌱', 
            class: 'apprentice',
            description: '有了一些基础' 
        },
        { 
            minAccuracy: 80, 
            name: '能手', 
            icon: '🌟', 
            class: 'skilled',
            description: '熟能生巧' 
        },
        { 
            minAccuracy: 85, 
            name: '专家', 
            icon: '✨', 
            class: 'expert',
            description: '技巧精湛' 
        },
        { 
            minAccuracy: 90, 
            name: '大师', 
            icon: '🏆', 
            class: 'master',
            description: '炉火纯青' 
        },
        { 
            minAccuracy: 95, 
            name: '宗师', 
            icon: '👑', 
            class: 'grandmaster',
            description: '登峰造极' 
        },
        { 
            minAccuracy: 98, 
            name: '传奇', 
            icon: '💎', 
            class: 'legend',
            description: '圆神' 
        }
    ];
    
    // 获取用户历史最高等级
    let userBestRankIndex = getUserBestRank();
    updateBestRankDisplay(userBestRankIndex);
    
    // 设置画布大小
    function resizeCanvas() {
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        // 设置画布尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 清除画布
        clearCanvas();
    }
    
    // 用户绘图相关变量
    let isDrawing = false;
    let points = [];
    let pathClosed = false;
    let hasCalculated = false; // 标记是否已计算过
    
    // 设备相关变量
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // 加载用户设置
    let settings = {};
    if (window.settingsManager) {
        settings = window.settingsManager.loadUserSettings().games || {};
    }
    
    // 画笔颜色
    const drawColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4caf50';
    
    // 初始化画布
    function initCanvas() {
        // 重置状态
        clearCanvas();
        
        // 设置画布样式
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = drawColor;
    }
    
    // 清除画布
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        points = [];
        pathClosed = false;
        hasCalculated = false;
        updateStatus();
        resetQualityMeter();
        resetRankDisplay();
    }
    
    // 重置质量计
    function resetQualityMeter() {
        qualityMeterFill.style.width = "0%";
        qualityLabel.textContent = "画一个圆看看你的水平";
        qualityLabel.className = "quality-label";
    }
    
    // 重置等级显示
    function resetRankDisplay() {
        rankBadge.className = "rank-badge";
        rankIcon.textContent = "?";
        rankTitle.textContent = "未评级";
        currentRank.textContent = "未评级";
    }
    
    // 根据精度确定等级
    function determineRank(accuracy) {
        let rankIndex = 0;
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (accuracy >= ranks[i].minAccuracy) {
                rankIndex = i;
                break;
            }
        }
        return rankIndex;
    }
    
    // 更新等级显示
    function updateRankDisplay(rankIndex, accuracy) {
        const rank = ranks[rankIndex];
        
        // 移除所有可能的类
        rankBadge.className = "rank-badge";
        
        // 添加当前等级类
        rankBadge.classList.add(rank.class);
        
        // 设置图标和标题
        rankIcon.textContent = rank.icon;
        rankTitle.textContent = rank.name;
        currentRank.textContent = rank.name;
        
        // 播放等级提升动画
        const previousBest = userBestRankIndex;
        if (rankIndex > previousBest) {
            userBestRankIndex = rankIndex;
            saveUserBestRank(rankIndex);
            updateBestRankDisplay(rankIndex);
            rankBadge.classList.add('level-up');
            setTimeout(() => {
                rankBadge.classList.remove('level-up');
            }, 1000);
            
            // 如果是新的最高等级，播放特殊音效
            playRankUpSound();
        }
    }
    
    // 更新最佳等级显示
    function updateBestRankDisplay(rankIndex) {
        if (rankIndex >= 0 && rankIndex < ranks.length) {
            bestRank.textContent = ranks[rankIndex].name;
        } else {
            bestRank.textContent = "未评级";
        }
    }
    
    // 播放等级提升音效
    function playRankUpSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建振荡器和增益节点
            const oscillator1 = audioCtx.createOscillator();
            const oscillator2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // 连接节点
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            // 设置振荡器参数
            oscillator1.type = 'sine';
            oscillator2.type = 'triangle';
            
            // 上升的音阶
            oscillator1.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator1.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.3);
            
            oscillator2.frequency.setValueAtTime(587.33, audioCtx.currentTime + 0.1);
            oscillator2.frequency.linearRampToValueAtTime(1174.66, audioCtx.currentTime + 0.4);
            
            // 设置音量
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
            
            // 播放音效
            oscillator1.start();
            oscillator2.start(audioCtx.currentTime + 0.05);
            
            oscillator1.stop(audioCtx.currentTime + 0.6);
            oscillator2.stop(audioCtx.currentTime + 0.6);
        } catch (e) {
            console.log('音频API不支持:', e);
        }
    }
    
    // 保存用户最佳等级
    function saveUserBestRank(rankIndex) {
        try {
            localStorage.setItem('drawpi_best_rank', rankIndex.toString());
        } catch (e) {
            console.log('无法保存等级:', e);
        }
    }
    
    // 获取用户最佳等级
    function getUserBestRank() {
        try {
            const saved = localStorage.getItem('drawpi_best_rank');
            return saved !== null ? parseInt(saved, 10) : -1;
        } catch (e) {
            console.log('无法获取等级:', e);
            return -1;
        }
    }
    
    // 根据精度更新质量计
    function updateQualityMeter(accuracy) {
        // 动画更新质量计填充
        qualityMeterFill.style.width = (100 - accuracy) + "%";
        
        let labelText, labelClass;
        
        if (accuracy > 98) {
            labelText = "完美！你是画圆大师！";
            labelClass = "perfect";
        } else if (accuracy > 95) {
            labelText = "非常棒！接近完美的圆！";
            labelClass = "excellent";
        } else if (accuracy > 90) {
            labelText = "很好！这是个不错的圆！";
            labelClass = "good";
        } else if (accuracy > 80) {
            labelText = "还行，继续练习！";
            labelClass = "average";
        } else {
            labelText = "需要更多练习，再来一次！";
            labelClass = "poor";
        }
        
        qualityLabel.textContent = labelText;
        qualityLabel.className = "quality-label " + labelClass;
    }
    
    // 开始绘制
    function startDrawing(e) {
        if (e.type !== 'mousedown') { // 对于触摸事件已经在外部处理了preventDefault
            e.preventDefault();
        }
        
        // 如果已计算过结果或存在路径，先清除画布
        if (points.length > 0 || pathClosed || hasCalculated) {
            clearCanvas();
        }
        
        isDrawing = true;
        points = []; // 清除之前的点
        
        // 获取点坐标
        const point = getEventPoint(e);
        points.push(point);
        
        // 绘制起点
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = drawColor;
        ctx.fill();
        
        // 准备绘制线条
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        
        updateMessage('正在画圆...');
    }
    
    // 绘制中
    function draw(e) {
        if (e.type !== 'mousemove') { // 对于触摸事件已经在外部处理了preventDefault
            e.preventDefault();
        }
        
        if (!isDrawing) return;
        
        // 获取当前点坐标
        const point = getEventPoint(e);
        points.push(point);
        
        // 绘制线条
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
    }
    
    // 结束绘制
    function stopDrawing(e) {
        if (e.type !== 'mouseup' && e.type !== 'mouseout') { // 对于触摸事件已经在外部处理了preventDefault
            e.preventDefault();
        }
        
        if (!isDrawing) return;
        isDrawing = false;
        
        // 如果点数太少，不处理
        if (points.length < 10) {
            updateMessage('路径太短，无法形成有效的圆形');
            return;
        }
        
        // 检查路径是否有自交点，如果有则视为闭合
        if (hasIntersections(points)) {
            pathClosed = true;
            updateMessage('正在计算...');
            
            // 自动计算π值
            setTimeout(() => {
                calculatePi();
            }, 300); // 小延迟让用户看到闭合状态
        } else {
            updateMessage('图形未闭合');
        }
    }
    
    // 检测路径是否有自交点
    function hasIntersections(points) {
        if (points.length < 4) return false;
        
        // 检查所有不相邻的线段对
        for (let i = 0; i < points.length - 2; i++) {
            const line1Start = points[i];
            const line1End = points[i + 1];
            
            // 从i+2开始，避免检查相邻线段
            for (let j = i + 2; j < points.length - 1; j++) {
                // 对于最后一条线段与第一条线段，如果它们相邻则跳过
                if (i === 0 && j === points.length - 2) continue;
                
                const line2Start = points[j];
                const line2End = points[j + 1];
                
                if (doLinesIntersect(line1Start, line1End, line2Start, line2End)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 检查两条线段是否相交
    function doLinesIntersect(p1, p2, p3, p4) {
        // 计算方向
        function direction(a, b, c) {
            return (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
        }
        
        // 检查点是否在线段上
        function onSegment(p, q, r) {
            return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
                   q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
        }
        
        const d1 = direction(p3, p4, p1);
        const d2 = direction(p3, p4, p2);
        const d3 = direction(p1, p2, p3);
        const d4 = direction(p1, p2, p4);
        
        // 普通相交情况
        if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && 
            ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
            return true;
        }
        
        // 特殊情况：某个点在线段上
        if (d1 === 0 && onSegment(p3, p1, p4)) return true;
        if (d2 === 0 && onSegment(p3, p2, p4)) return true;
        if (d3 === 0 && onSegment(p1, p3, p2)) return true;
        if (d4 === 0 && onSegment(p1, p4, p2)) return true;
        
        return false;
    }
    
    // 获取事件坐标点
    function getEventPoint(e) {
        let x, y;
        
        if (isTouchDevice) {
            const touch = e.touches[0] || e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }
        
        return { x, y };
    }
    
    // 计算两点之间距离
    function calculateDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    
    // 计算路径的周长
    function calculatePerimeter() {
        if (points.length < 3) return 0;
        
        let perimeter = 0;
        for (let i = 0; i < points.length - 1; i++) {
            perimeter += calculateDistance(points[i], points[i + 1]);
        }
        
        // 如果路径闭合，加上最后一点到第一点的距离
        if (pathClosed) {
            perimeter += calculateDistance(points[points.length - 1], points[0]);
        }
        
        return perimeter;
    }
    
    // 计算多边形面积（使用鞋带公式/Shoelace formula）
    function calculateArea() {
        if (points.length < 3) return 0;
        
        let area = 0;
        const n = pathClosed ? points.length : points.length - 1;
        
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }
        
        return Math.abs(area / 2);
    }
    
    // 计算π值
    function calculatePi() {
        if (!pathClosed) {
            updateMessage('请先画一个闭合图形', 'error');
            return;
        }
        
        if (points.length < 10) {
            updateMessage('请先画一个近似圆形', 'error');
            return;
        }
        
        // 标记为已计算
        hasCalculated = true;
        
        // 计算周长和面积
        const perimeter = calculatePerimeter();
        const area = calculateArea();
        
        // 使用公式 π = C²/4A 计算π值
        const calculatedPi = Math.pow(perimeter, 2) / (4 * area);
        
        // 计算与实际π值的差距百分比
        const actualPi = Math.PI;
        const difference = Math.abs((calculatedPi - actualPi) / actualPi) * 100;
        const accuracy = Math.max(0, 100 - difference).toFixed(2);
        
        // 更新显示
        piValueDisplay.textContent = calculatedPi.toFixed(6);
        accuracyDisplay.textContent = `${accuracy}%`;
        
        // 更新质量计
        updateQualityMeter(parseFloat(accuracy));
        
        // 计算并更新等级
        const rankIndex = determineRank(parseFloat(accuracy));
        updateRankDisplay(rankIndex, parseFloat(accuracy));
        
        // 根据精确度显示不同消息
        let message;
        let type;
        
        if (accuracy > 98) {
            message = '太完美了！您画的圆几乎是完美的！';
            type = 'success';
            playSuccessSound();
        } else if (accuracy > 95) {
            message = '非常好！您画的圆非常接近完美！';
            type = 'success';
            playSuccessSound();
        } else if (accuracy > 90) {
            message = '很好！您的圆形相当圆！';
            type = 'success';
            playSuccessSound();
        } else if (accuracy > 80) {
            message = '不错！可以再接再厉！';
            type = '';
        } else {
            message = '继续练习，尝试画得更圆些！点击重新开始';
            type = '';
        }
        
        updateMessage(message, type);
        
        // 在消息后添加提示，点击画布再次开始
        setTimeout(() => {
            messageDisplay.textContent += '';
        }, 2000);
    }
    
    // 播放成功音效
    function playSuccessSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // 创建振荡器
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            
            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 1);
        } catch (e) {
            console.log('音频API不支持:', e);
        }
    }
    
    // 更新状态显示
    function updateStatus() {
        piValueDisplay.textContent = '-';
        accuracyDisplay.textContent = '-';
    }
    
    // 更新消息
    function updateMessage(msg, type = '') {
        messageDisplay.textContent = msg;
        messageDisplay.className = 'message';
        if (type) {
            messageDisplay.classList.add(type);
        }
    }
    
    // 添加事件监听器
    function setupEventListeners() {
        // 鼠标事件
        if (!isTouchDevice) {
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
        } else {
            // 触摸事件
            canvas.addEventListener('touchstart', (e) => {
                const rect = canvas.getBoundingClientRect();
                const touchX = e.touches[0].clientX - rect.left;
                const touchY = e.touches[0].clientY - rect.top;
                
                // 只在画布区域内阻止默认行为
                if (touchX >= 0 && touchX <= canvas.width && touchY >= 0 && touchY <= canvas.height) {
                    startDrawing(e);
                }
            }, { passive: false });
            
            canvas.addEventListener('touchmove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const touchX = e.touches[0].clientX - rect.left;
                const touchY = e.touches[0].clientY - rect.top;
                
                // 只在画布区域内阻止默认行为
                if (touchX >= 0 && touchX <= canvas.width && touchY >= 0 && touchY <= canvas.height) {
                    draw(e);
                }
            }, { passive: false });
            
            canvas.addEventListener('touchend', (e) => {
                const rect = canvas.getBoundingClientRect();
                const touchX = e.changedTouches[0].clientX - rect.left;
                const touchY = e.changedTouches[0].clientY - rect.top;
                
                // 只在画布区域内处理触摸结束事件
                if (touchX >= 0 && touchX <= canvas.width && touchY >= 0 && touchY <= canvas.height) {
                    stopDrawing(e);
                }
            }, { passive: true });
        }
        
        // 移除按钮事件，因为我们已经隐藏了按钮
        // clearBtn.addEventListener('click', clearCanvas);
        // calculateBtn.addEventListener('click', calculatePi);
        
        // 窗口大小改变事件
        window.addEventListener('resize', resizeCanvas);
    }
    
    // 初始化
    function init() {
        resizeCanvas();
        initCanvas();
        setupEventListeners();
        updateMessage('开始画圆，尽量画得圆一些');
    }
    
    // 启动游戏
    init();
}); 