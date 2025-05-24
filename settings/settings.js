/**
 * 设置页面管理脚本
 * 处理用户配置界面交互和保存/加载设置
 */
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素 - 通用设置
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontSizeValue = document.getElementById('font-size-slider-value');
    const animationToggle = document.getElementById('animation-toggle');
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    
    // 获取DOM元素 - 音频设置
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-slider-value');
    const noteDelaySlider = document.getElementById('note-delay-slider');
    const noteDelayValue = document.getElementById('note-delay-slider-value');
    const answerDelaySlider = document.getElementById('answer-delay-slider');
    const answerDelayValue = document.getElementById('answer-delay-slider-value');
    const autoPlayNext = document.getElementById('auto-play-next');
    
    // 获取DOM元素 - 音乐模块设置
    const startingDifficulty = document.getElementById('starting-difficulty');
    const melodyLength = document.getElementById('melody-length');
    const pointsPerCorrect = document.getElementById('points-per-correct');
    const pointsPerCorrectValue = document.getElementById('points-per-correct-value');
    const showHints = document.getElementById('show-hints');
    
    // 获取DOM元素 - 游戏模块设置
    const gameSpeedSlider = document.getElementById('game-speed-slider');
    const gameSpeedValue = document.getElementById('game-speed-slider-value');
    const soundEffectsToggle = document.getElementById('sound-effects-toggle');
    const vibrationFeedbackToggle = document.getElementById('vibration-feedback-toggle');
    const snakeColorSelect = document.getElementById('snake-color-select');
    const tetrisRotationToggle = document.getElementById('tetris-rotation-toggle');
    
    // 获取DOM元素 - 论坛模块设置
    const showAvatarsToggle = document.getElementById('show-avatars-toggle');
    const commentsPerPageSelect = document.getElementById('comments-per-page');
    const defaultSortSelect = document.getElementById('default-sort');
    
    // 获取按钮元素
    const saveButton = document.getElementById('save-settings');
    const resetButton = document.getElementById('reset-settings');
    
    // 默认设置
    const defaultSettings = {
        ui: {
            theme: 'dark',
            fontSize: 16,
            animations: true,
            highContrast: false
        },
        audio: {
            volume: 0.8,
            noteDelay: 400,
            answerDelay: 1000,
            autoPlayNext: true,
            soundEffects: true
        },
        music: {
            startingDifficulty: 0,
            melodyLength: 3,
            pointsPerCorrect: 10,
            showHints: true
        },
        games: {
            gameSpeed: 5,
            vibrationFeedback: true,
            snakeColor: 'green',
            tetrisRotationSystem: 'classic'
        },
        forum: {
            showAvatars: true,
            commentsPerPage: 10,
            defaultSort: 'newest'
        }
    };
    
    // 加载设置
    function loadSettings() {
        // 尝试从localStorage加载设置
        let settings = localStorage.getItem('userSettings');
        
        if (settings) {
            try {
                settings = JSON.parse(settings);
                
                // UI设置
                themeSelect.value = settings.ui.theme || defaultSettings.ui.theme;
                document.body.classList.toggle('light-theme', settings.ui.theme === 'light');
                
                fontSizeSlider.value = settings.ui.fontSize || defaultSettings.ui.fontSize;
                fontSizeValue.textContent = settings.ui.fontSize || defaultSettings.ui.fontSize;
                
                animationToggle.checked = settings.ui.animations !== undefined ? settings.ui.animations : defaultSettings.ui.animations;
                highContrastToggle.checked = settings.ui.highContrast !== undefined ? settings.ui.highContrast : defaultSettings.ui.highContrast;
                
                if (settings.ui.highContrast) {
                    document.body.classList.add('high-contrast');
                }
                
                // 音频设置
                volumeSlider.value = settings.audio.volume !== undefined ? settings.audio.volume : defaultSettings.audio.volume;
                volumeValue.textContent = settings.audio.volume !== undefined ? settings.audio.volume : defaultSettings.audio.volume;
                
                noteDelaySlider.value = settings.audio.noteDelay || defaultSettings.audio.noteDelay;
                noteDelayValue.textContent = settings.audio.noteDelay || defaultSettings.audio.noteDelay;
                
                answerDelaySlider.value = settings.audio.answerDelay || defaultSettings.audio.answerDelay;
                answerDelayValue.textContent = settings.audio.answerDelay || defaultSettings.audio.answerDelay;
                
                autoPlayNext.checked = settings.audio.autoPlayNext !== undefined ? settings.audio.autoPlayNext : defaultSettings.audio.autoPlayNext;
                
                // 音乐模块设置
                startingDifficulty.value = settings.music.startingDifficulty !== undefined ? settings.music.startingDifficulty : defaultSettings.music.startingDifficulty;
                melodyLength.value = settings.music.melodyLength || defaultSettings.music.melodyLength;
                
                pointsPerCorrect.value = settings.music.pointsPerCorrect || defaultSettings.music.pointsPerCorrect;
                pointsPerCorrectValue.textContent = settings.music.pointsPerCorrect || defaultSettings.music.pointsPerCorrect;
                
                showHints.checked = settings.music.showHints !== undefined ? settings.music.showHints : defaultSettings.music.showHints;
                
                // 游戏模块设置
                if (gameSpeedSlider) {
                    gameSpeedSlider.value = settings.games.gameSpeed || defaultSettings.games.gameSpeed;
                    gameSpeedValue.textContent = settings.games.gameSpeed || defaultSettings.games.gameSpeed;
                }
                
                if (soundEffectsToggle) {
                    soundEffectsToggle.checked = settings.audio.soundEffects !== undefined ? settings.audio.soundEffects : defaultSettings.audio.soundEffects;
                }
                
                if (vibrationFeedbackToggle) {
                    vibrationFeedbackToggle.checked = settings.games.vibrationFeedback !== undefined ? settings.games.vibrationFeedback : defaultSettings.games.vibrationFeedback;
                }
                
                if (snakeColorSelect) {
                    snakeColorSelect.value = settings.games.snakeColor || defaultSettings.games.snakeColor;
                }
                
                if (tetrisRotationToggle) {
                    tetrisRotationToggle.checked = settings.games.tetrisRotationSystem === 'modern';
                }
                
                // 论坛模块设置
                if (showAvatarsToggle) {
                    showAvatarsToggle.checked = settings.forum.showAvatars !== undefined ? settings.forum.showAvatars : defaultSettings.forum.showAvatars;
                }
                
                if (commentsPerPageSelect) {
                    commentsPerPageSelect.value = settings.forum.commentsPerPage || defaultSettings.forum.commentsPerPage;
                }
                
                if (defaultSortSelect) {
                    defaultSortSelect.value = settings.forum.defaultSort || defaultSettings.forum.defaultSort;
                }
                
            } catch (e) {
                console.error('Error loading settings:', e);
                resetToDefaults();
            }
        } else {
            resetToDefaults();
        }
    }
    
    // 重置为默认设置
    function resetToDefaults() {
        // UI设置
        themeSelect.value = defaultSettings.ui.theme;
        document.body.classList.toggle('light-theme', defaultSettings.ui.theme === 'light');
        
        fontSizeSlider.value = defaultSettings.ui.fontSize;
        fontSizeValue.textContent = defaultSettings.ui.fontSize;
        
        animationToggle.checked = defaultSettings.ui.animations;
        highContrastToggle.checked = defaultSettings.ui.highContrast;
        
        document.body.classList.toggle('high-contrast', defaultSettings.ui.highContrast);
        
        // 音频设置
        volumeSlider.value = defaultSettings.audio.volume;
        volumeValue.textContent = defaultSettings.audio.volume;
        
        noteDelaySlider.value = defaultSettings.audio.noteDelay;
        noteDelayValue.textContent = defaultSettings.audio.noteDelay;
        
        answerDelaySlider.value = defaultSettings.audio.answerDelay;
        answerDelayValue.textContent = defaultSettings.audio.answerDelay;
        
        autoPlayNext.checked = defaultSettings.audio.autoPlayNext;
        
        // 音乐模块设置
        startingDifficulty.value = defaultSettings.music.startingDifficulty;
        melodyLength.value = defaultSettings.music.melodyLength;
        
        pointsPerCorrect.value = defaultSettings.music.pointsPerCorrect;
        pointsPerCorrectValue.textContent = defaultSettings.music.pointsPerCorrect;
        
        showHints.checked = defaultSettings.music.showHints;
        
        // 游戏模块设置
        if (gameSpeedSlider) {
            gameSpeedSlider.value = defaultSettings.games.gameSpeed;
            gameSpeedValue.textContent = defaultSettings.games.gameSpeed;
        }
        
        if (soundEffectsToggle) {
            soundEffectsToggle.checked = defaultSettings.audio.soundEffects;
        }
        
        if (vibrationFeedbackToggle) {
            vibrationFeedbackToggle.checked = defaultSettings.games.vibrationFeedback;
        }
        
        if (snakeColorSelect) {
            snakeColorSelect.value = defaultSettings.games.snakeColor;
        }
        
        if (tetrisRotationToggle) {
            tetrisRotationToggle.checked = defaultSettings.games.tetrisRotationSystem === 'modern';
        }
        
        // 论坛模块设置
        if (showAvatarsToggle) {
            showAvatarsToggle.checked = defaultSettings.forum.showAvatars;
        }
        
        if (commentsPerPageSelect) {
            commentsPerPageSelect.value = defaultSettings.forum.commentsPerPage;
        }
        
        if (defaultSortSelect) {
            defaultSortSelect.value = defaultSettings.forum.defaultSort;
        }
    }
    
    // 保存设置
    function saveSettings() {
        const settings = {
            ui: {
                theme: themeSelect.value,
                fontSize: parseInt(fontSizeSlider.value),
                animations: animationToggle.checked,
                highContrast: highContrastToggle.checked
            },
            audio: {
                volume: parseFloat(volumeSlider.value),
                noteDelay: parseInt(noteDelaySlider.value),
                answerDelay: parseInt(answerDelaySlider.value),
                autoPlayNext: autoPlayNext.checked,
                soundEffects: soundEffectsToggle ? soundEffectsToggle.checked : defaultSettings.audio.soundEffects
            },
            music: {
                startingDifficulty: parseInt(startingDifficulty.value),
                melodyLength: parseInt(melodyLength.value),
                pointsPerCorrect: parseInt(pointsPerCorrect.value),
                showHints: showHints.checked
            },
            games: {
                gameSpeed: gameSpeedSlider ? parseInt(gameSpeedSlider.value) : defaultSettings.games.gameSpeed,
                vibrationFeedback: vibrationFeedbackToggle ? vibrationFeedbackToggle.checked : defaultSettings.games.vibrationFeedback,
                snakeColor: snakeColorSelect ? snakeColorSelect.value : defaultSettings.games.snakeColor,
                tetrisRotationSystem: tetrisRotationToggle && tetrisRotationToggle.checked ? 'modern' : 'classic'
            },
            forum: {
                showAvatars: showAvatarsToggle ? showAvatarsToggle.checked : defaultSettings.forum.showAvatars,
                commentsPerPage: commentsPerPageSelect ? parseInt(commentsPerPageSelect.value) : defaultSettings.forum.commentsPerPage,
                defaultSort: defaultSortSelect ? defaultSortSelect.value : defaultSettings.forum.defaultSort
            }
        };
        
        // 保存到localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));
        
        // 应用主题和高对比度设置
        document.body.classList.toggle('light-theme', settings.ui.theme === 'light');
        document.body.classList.toggle('high-contrast', settings.ui.highContrast);
        
        // 应用字体大小
        document.documentElement.style.fontSize = settings.ui.fontSize + 'px';
        
        // 显示保存成功提示
        showNotification('设置已保存');
    }
    
    // 显示通知
    function showNotification(message) {
        // 检查是否已有通知元素
        let notification = document.querySelector('.settings-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'settings-notification';
            document.body.appendChild(notification);
        }
        
        // 设置消息并显示
        notification.textContent = message;
        notification.classList.add('show');
        
        // 3秒后隐藏
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // 设置滑块值更新
    volumeSlider.addEventListener('input', function() {
        volumeValue.textContent = this.value;
    });
    
    noteDelaySlider.addEventListener('input', function() {
        noteDelayValue.textContent = this.value;
    });
    
    answerDelaySlider.addEventListener('input', function() {
        answerDelayValue.textContent = this.value;
    });
    
    pointsPerCorrect.addEventListener('input', function() {
        pointsPerCorrectValue.textContent = this.value;
    });
    
    fontSizeSlider.addEventListener('input', function() {
        fontSizeValue.textContent = this.value;
        document.documentElement.style.fontSize = this.value + 'px';
    });
    
    // 游戏速度滑块
    if (gameSpeedSlider) {
        gameSpeedSlider.addEventListener('input', function() {
            gameSpeedValue.textContent = this.value;
        });
    }
    
    // 保存按钮点击事件
    saveButton.addEventListener('click', saveSettings);
    
    // 重置按钮点击事件
    resetButton.addEventListener('click', function() {
        if (confirm('确定要恢复所有设置到默认值吗？')) {
            resetToDefaults();
            saveSettings();
        }
    });
    
    // 主题选择变化
    themeSelect.addEventListener('change', function() {
        document.body.classList.toggle('light-theme', this.value === 'light');
    });
    
    // 高对比度切换
    highContrastToggle.addEventListener('change', function() {
        document.body.classList.toggle('high-contrast', this.checked);
    });
    
    // 模块选项卡事件
    const settingsTabs = document.querySelectorAll('.settings-tabs .tab-button');
    if (settingsTabs.length > 0) {
        settingsTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                
                // 移除所有激活状态
                document.querySelectorAll('.settings-tabs .tab-button').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
                
                // 激活当前选项卡
                this.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });
        
        // 默认显示第一个选项卡
        settingsTabs[0].click();
    }
    
    // 加载设置
    loadSettings();
    
    // 添加通知样式
    const style = document.createElement('style');
    style.textContent = `
        .settings-notification {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background-color: var(--primary-color);
            color: white;
            padding: 12px 25px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .settings-notification.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        
        .high-contrast {
            --text-color: #ffffff;
            --bg-color: #000000;
            --container-bg: #1a1a1a;
            --card-bg: #1a1a1a;
            --header-color: #ffffff;
            --primary-color: #ff9500;
            --secondary-color: #ff3b30;
            --link-color: #ff9500;
            --link-hover: #ff3b30;
            --button-bg: #ff9500;
            --button-hover: #ff3b30;
            --box-shadow-color: rgba(0, 0, 0, 0.5);
        }
        
        /* 设置标签页样式 */
        .settings-tabs {
            display: flex;
            border-bottom: 1px solid var(--box-shadow-color);
            margin-bottom: 20px;
            overflow-x: auto;
            white-space: nowrap;
        }
        
        .settings-tabs .tab-button {
            padding: 10px 20px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            color: var(--text-color);
            position: relative;
        }
        
        .settings-tabs .tab-button.active {
            color: var(--primary-color);
        }
        
        .settings-tabs .tab-button.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 100%;
            height: 3px;
            background-color: var(--primary-color);
        }
        
        .settings-section {
            display: none;
        }
        
        .settings-section.active {
            display: block;
        }
        
        @media (max-width: 600px) {
            .settings-tabs {
                padding-bottom: 10px;
            }
        }
    `;
    document.head.appendChild(style);
}); 