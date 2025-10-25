/**
 * 画圆测π游戏 - 基于GameBase v2.0架构的优化版
 *
 * 功能特性：
 * - Canvas绘图系统（鼠标和触摸支持）
 * - 路径自交检测自动闭合
 * - 圆形精确度计算（使用π = C²/4A公式）
 * - 7级精确度评级系统
 * - 使用GameBase的StorageHelper管理数据
 * - 使用GameBase的NotificationSystem显示通知
 * - 等级提升音效
 * - 响应式Canvas
 */

class DrawPiGame extends GameBase {
    constructor() {
        super('drawpi', { enableAutoCleanup: true, enableNotifications: true });

        // 等级定义
        this.ranks = [
            { minAccuracy: 0, name: '初学者', icon: '🔰', class: 'novice', description: '开始你的画圆之旅' },
            { minAccuracy: 70, name: '学徒', icon: '🌱', class: 'apprentice', description: '有了一些基础' },
            { minAccuracy: 80, name: '能手', icon: '🌟', class: 'skilled', description: '熟能生巧' },
            { minAccuracy: 85, name: '专家', icon: '✨', class: 'expert', description: '技巧精湛' },
            { minAccuracy: 90, name: '大师', icon: '🏆', class: 'master', description: '炉火纯青' },
            { minAccuracy: 95, name: '宗师', icon: '👑', class: 'grandmaster', description: '登峰造极' },
            { minAccuracy: 98, name: '传奇', icon: '💎', class: 'legend', description: '圆神' }
        ];

        // 游戏状态
        this.points = [];
        this.isDrawing = false;
        this.pathClosed = false;
        this.hasCalculated = false;
        this.userBestRankIndex = this.getUserBestRank();

        // DOM元素
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.piValueDisplay = document.getElementById('pi-value');
        this.accuracyDisplay = document.getElementById('accuracy');
        this.messageDisplay = document.getElementById('message');
        this.qualityMeterFill = document.getElementById('quality-meter-fill');
        this.qualityLabel = document.getElementById('quality-label');
        this.rankBadge = document.getElementById('rank-badge');
        this.rankIcon = this.rankBadge ? this.rankBadge.querySelector('.rank-icon') : null;
        this.rankTitle = this.rankBadge ? this.rankBadge.querySelector('.rank-title') : null;
        this.currentRank = document.getElementById('current-rank');
        this.bestRank = document.getElementById('best-rank');
        this.drawHint = document.querySelector('.draw-hint');

        // 画笔颜色
        this.drawColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#4caf50';

        // 初始化
        this.init();
    }

    /**
     * 初始化游戏
     */
    init() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas元素未找到');
            return;
        }

        // 提示淡出效果
        if (this.drawHint) {
            this.setTimeout(() => {
                this.drawHint.classList.add('fade-out');
            }, 5000);
        }

        // 更新最佳等级显示
        this.updateBestRankDisplay(this.userBestRankIndex);

        // 设置canvas和事件
        this.resizeCanvas();
        this.initCanvas();
        this.setupEventListeners();

        // 监听窗口大小变化
        this.on(window, 'resize', () => this.resizeCanvas());

        this.updateMessage('开始画圆，尽量画得圆一些');
    }

    /**
     * 设置画布大小
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

        this.canvas.width = width;
        this.canvas.height = height;

        this.clearCanvas();
    }

    /**
     * 初始化画布样式
     */
    initCanvas() {
        this.clearCanvas();
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = this.drawColor;
    }

    /**
     * 清除画布
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.points = [];
        this.pathClosed = false;
        this.hasCalculated = false;
        this.updateStatus();
        this.resetQualityMeter();
        this.resetRankDisplay();
    }

    /**
     * 重置质量计
     */
    resetQualityMeter() {
        if (this.qualityMeterFill) {
            this.qualityMeterFill.style.width = "0%";
        }
        if (this.qualityLabel) {
            this.qualityLabel.textContent = "画一个圆看看你的水平";
            this.qualityLabel.className = "quality-label";
        }
    }

    /**
     * 重置等级显示
     */
    resetRankDisplay() {
        if (this.rankBadge) this.rankBadge.className = "rank-badge";
        if (this.rankIcon) this.rankIcon.textContent = "?";
        if (this.rankTitle) this.rankTitle.textContent = "未评级";
        if (this.currentRank) this.currentRank.textContent = "未评级";
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        if (!this.deviceInfo.hasTouch) {
            // 鼠标事件
            this.on(this.canvas, 'mousedown', (e) => this.startDrawing(e));
            this.on(this.canvas, 'mousemove', (e) => this.draw(e));
            this.on(this.canvas, 'mouseup', (e) => this.stopDrawing(e));
            this.on(this.canvas, 'mouseout', (e) => this.stopDrawing(e));
        } else {
            // 触摸事件
            this.on(this.canvas, 'touchstart', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const touchX = e.touches[0].clientX - rect.left;
                const touchY = e.touches[0].clientY - rect.top;

                if (touchX >= 0 && touchX <= this.canvas.width && touchY >= 0 && touchY <= this.canvas.height) {
                    this.startDrawing(e);
                }
            }, { passive: false });

            this.on(this.canvas, 'touchmove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const touchX = e.touches[0].clientX - rect.left;
                const touchY = e.touches[0].clientY - rect.top;

                if (touchX >= 0 && touchX <= this.canvas.width && touchY >= 0 && touchY <= this.canvas.height) {
                    this.draw(e);
                }
            }, { passive: false });

            this.on(this.canvas, 'touchend', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const touchX = e.changedTouches[0].clientX - rect.left;
                const touchY = e.changedTouches[0].clientY - rect.top;

                if (touchX >= 0 && touchX <= this.canvas.width && touchY >= 0 && touchY <= this.canvas.height) {
                    this.stopDrawing(e);
                }
            }, { passive: true });
        }
    }

    /**
     * 开始绘制
     */
    startDrawing(e) {
        if (e.type !== 'mousedown') {
            e.preventDefault();
        }

        // 如果已计算过或存在路径，先清除
        if (this.points.length > 0 || this.pathClosed || this.hasCalculated) {
            this.clearCanvas();
        }

        this.isDrawing = true;
        this.points = [];

        const point = this.getEventPoint(e);
        this.points.push(point);

        // 绘制起点
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = this.drawColor;
        this.ctx.fill();

        // 准备绘制线条
        this.ctx.beginPath();
        this.ctx.moveTo(point.x, point.y);

        this.updateMessage('正在画圆...');
    }

    /**
     * 绘制中
     */
    draw(e) {
        if (e.type !== 'mousemove') {
            e.preventDefault();
        }

        if (!this.isDrawing) return;

        const point = this.getEventPoint(e);
        this.points.push(point);

        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
    }

    /**
     * 结束绘制
     */
    stopDrawing(e) {
        if (e.type !== 'mouseup' && e.type !== 'mouseout') {
            e.preventDefault();
        }

        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.points.length < 10) {
            this.updateMessage('路径太短，无法形成有效的圆形');
            return;
        }

        // 检查路径是否有自交点
        if (this.hasIntersections(this.points)) {
            this.pathClosed = true;
            this.updateMessage('正在计算...');

            // 自动计算π值
            this.setTimeout(() => {
                this.calculatePi();
            }, 300);
        } else {
            this.updateMessage('图形未闭合');
        }
    }

    /**
     * 获取事件坐标点
     */
    getEventPoint(e) {
        let x, y;

        if (this.deviceInfo.hasTouch) {
            const touch = e.touches[0] || e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }

        return { x, y };
    }

    /**
     * 检测路径是否有自交点
     */
    hasIntersections(points) {
        if (points.length < 4) return false;

        for (let i = 0; i < points.length - 2; i++) {
            const line1Start = points[i];
            const line1End = points[i + 1];

            for (let j = i + 2; j < points.length - 1; j++) {
                if (i === 0 && j === points.length - 2) continue;

                const line2Start = points[j];
                const line2End = points[j + 1];

                if (this.doLinesIntersect(line1Start, line1End, line2Start, line2End)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * 检查两条线段是否相交
     */
    doLinesIntersect(p1, p2, p3, p4) {
        const direction = (a, b, c) => {
            return (c.y - a.y) * (b.x - a.x) - (b.y - a.y) * (c.x - a.x);
        };

        const onSegment = (p, q, r) => {
            return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
                   q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
        };

        const d1 = direction(p3, p4, p1);
        const d2 = direction(p3, p4, p2);
        const d3 = direction(p1, p2, p3);
        const d4 = direction(p1, p2, p4);

        if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
            ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
            return true;
        }

        if (d1 === 0 && onSegment(p3, p1, p4)) return true;
        if (d2 === 0 && onSegment(p3, p2, p4)) return true;
        if (d3 === 0 && onSegment(p1, p3, p2)) return true;
        if (d4 === 0 && onSegment(p1, p4, p2)) return true;

        return false;
    }

    /**
     * 计算两点距离
     */
    calculateDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    /**
     * 计算路径周长
     */
    calculatePerimeter() {
        if (this.points.length < 3) return 0;

        let perimeter = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            perimeter += this.calculateDistance(this.points[i], this.points[i + 1]);
        }

        if (this.pathClosed) {
            perimeter += this.calculateDistance(this.points[this.points.length - 1], this.points[0]);
        }

        return perimeter;
    }

    /**
     * 计算多边形面积（鞋带公式）
     */
    calculateArea() {
        if (this.points.length < 3) return 0;

        let area = 0;
        const n = this.pathClosed ? this.points.length : this.points.length - 1;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % this.points.length;
            area += this.points[i].x * this.points[j].y;
            area -= this.points[j].x * this.points[i].y;
        }

        return Math.abs(area / 2);
    }

    /**
     * 计算π值
     */
    calculatePi() {
        if (!this.pathClosed) {
            this.updateMessage('请先画一个闭合图形', 'error');
            return;
        }

        if (this.points.length < 10) {
            this.updateMessage('请先画一个近似圆形', 'error');
            return;
        }

        this.hasCalculated = true;

        // 计算周长和面积
        const perimeter = this.calculatePerimeter();
        const area = this.calculateArea();

        // 使用公式 π = C²/4A 计算π值
        const calculatedPi = Math.pow(perimeter, 2) / (4 * area);

        // 计算精确度
        const actualPi = Math.PI;
        const difference = Math.abs((calculatedPi - actualPi) / actualPi) * 100;
        const accuracy = Math.max(0, 100 - difference).toFixed(2);

        // 更新显示
        if (this.piValueDisplay) this.piValueDisplay.textContent = calculatedPi.toFixed(6);
        if (this.accuracyDisplay) this.accuracyDisplay.textContent = `${accuracy}%`;

        // 更新质量计
        this.updateQualityMeter(parseFloat(accuracy));

        // 计算并更新等级
        const rankIndex = this.determineRank(parseFloat(accuracy));
        this.updateRankDisplay(rankIndex, parseFloat(accuracy));

        // 根据精确度显示不同消息
        let message, type;

        if (accuracy > 98) {
            message = '太完美了！您画的圆几乎是完美的！';
            type = 'success';
            this.playSuccessSound();
        } else if (accuracy > 95) {
            message = '非常好！您画的圆非常接近完美！';
            type = 'success';
            this.playSuccessSound();
        } else if (accuracy > 90) {
            message = '很好！您的圆形相当圆！';
            type = 'success';
            this.playSuccessSound();
        } else if (accuracy > 80) {
            message = '不错！可以再接再厉！';
            type = '';
        } else {
            message = '继续练习，尝试画得更圆些！点击重新开始';
            type = '';
        }

        this.updateMessage(message, type);
    }

    /**
     * 根据精度确定等级
     */
    determineRank(accuracy) {
        let rankIndex = 0;
        for (let i = this.ranks.length - 1; i >= 0; i--) {
            if (accuracy >= this.ranks[i].minAccuracy) {
                rankIndex = i;
                break;
            }
        }
        return rankIndex;
    }

    /**
     * 更新等级显示
     */
    updateRankDisplay(rankIndex, accuracy) {
        const rank = this.ranks[rankIndex];

        if (this.rankBadge) {
            this.rankBadge.className = "rank-badge";
            this.rankBadge.classList.add(rank.class);
        }

        if (this.rankIcon) this.rankIcon.textContent = rank.icon;
        if (this.rankTitle) this.rankTitle.textContent = rank.name;
        if (this.currentRank) this.currentRank.textContent = rank.name;

        // 检查是否打破记录
        const previousBest = this.userBestRankIndex;
        if (rankIndex > previousBest) {
            this.userBestRankIndex = rankIndex;
            this.saveUserBestRank(rankIndex);
            this.updateBestRankDisplay(rankIndex);

            if (this.rankBadge) {
                this.rankBadge.classList.add('level-up');
                this.setTimeout(() => {
                    this.rankBadge.classList.remove('level-up');
                }, 1000);
            }

            // 使用GameBase的通知系统
            this.notify.success(`等级提升：${rank.name}！`, 2500);

            this.playRankUpSound();
        }
    }

    /**
     * 更新最佳等级显示
     */
    updateBestRankDisplay(rankIndex) {
        if (this.bestRank) {
            if (rankIndex >= 0 && rankIndex < this.ranks.length) {
                this.bestRank.textContent = this.ranks[rankIndex].name;
            } else {
                this.bestRank.textContent = "未评级";
            }
        }
    }

    /**
     * 更新质量计
     */
    updateQualityMeter(accuracy) {
        if (this.qualityMeterFill) {
            this.qualityMeterFill.style.width = (100 - accuracy) + "%";
        }

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

        if (this.qualityLabel) {
            this.qualityLabel.textContent = labelText;
            this.qualityLabel.className = "quality-label " + labelClass;
        }
    }

    /**
     * 保存用户最佳等级（使用GameBase的StorageHelper）
     */
    saveUserBestRank(rankIndex) {
        this.saveGameData('bestRank', rankIndex);
    }

    /**
     * 获取用户最佳等级（使用GameBase的StorageHelper）
     */
    getUserBestRank() {
        return this.loadGameData('bestRank', -1);
    }

    /**
     * 播放等级提升音效
     */
    playRankUpSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            const oscillator1 = audioCtx.createOscillator();
            const oscillator2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator1.type = 'sine';
            oscillator2.type = 'triangle';

            oscillator1.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator1.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.3);

            oscillator2.frequency.setValueAtTime(587.33, audioCtx.currentTime + 0.1);
            oscillator2.frequency.linearRampToValueAtTime(1174.66, audioCtx.currentTime + 0.4);

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);

            oscillator1.start();
            oscillator2.start(audioCtx.currentTime + 0.05);

            oscillator1.stop(audioCtx.currentTime + 0.6);
            oscillator2.stop(audioCtx.currentTime + 0.6);
        } catch (e) {
            console.log('音频API不支持:', e);
        }
    }

    /**
     * 播放成功音效
     */
    playSuccessSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);

            gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 1);
        } catch (e) {
            console.log('音频API不支持:', e);
        }
    }

    /**
     * 更新状态显示
     */
    updateStatus() {
        if (this.piValueDisplay) this.piValueDisplay.textContent = '-';
        if (this.accuracyDisplay) this.accuracyDisplay.textContent = '-';
    }

    /**
     * 更新消息
     */
    updateMessage(msg, type = '') {
        if (this.messageDisplay) {
            this.messageDisplay.textContent = msg;
            this.messageDisplay.className = 'message';
            if (type) {
                this.messageDisplay.classList.add(type);
            }
        }
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

    window.drawPiGame = new DrawPiGame();
    console.log('画圆测π游戏已初始化（使用GameBase v2.0架构）');
    console.log('游戏统计:', window.drawPiGame.getStats());
});
