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
    
    // 获取DOM元素 - 游戏特定设置
    // 俄罗斯方块设置
    const tetrisBaseSpeed = document.getElementById('tetris-base-speed');
    const tetrisBaseSpeedValue = document.getElementById('tetris-base-speed-value');
    const tetrisSpeedDecrease = document.getElementById('tetris-speed-decrease');
    const tetrisSpeedDecreaseValue = document.getElementById('tetris-speed-decrease-value');
    const tetrisScoreMultiplier = document.getElementById('tetris-score-multiplier');
    const tetrisScoreMultiplierValue = document.getElementById('tetris-score-multiplier-value');
    const tetrisComboMultiplier = document.getElementById('tetris-combo-multiplier');
    const tetrisComboMultiplierValue = document.getElementById('tetris-combo-multiplier-value');
    const tetrisAbilityThreshold = document.getElementById('tetris-ability-threshold');
    const tetrisAbilityThresholdValue = document.getElementById('tetris-ability-threshold-value');
    const tetrisSpecialPiece = document.getElementById('tetris-special-piece');
    const tetrisSpecialPieceValue = document.getElementById('tetris-special-piece-value');

    // 贪吃蛇设置
    const snakeInitialSpeed = document.getElementById('snake-initial-speed');
    const snakeInitialSpeedValue = document.getElementById('snake-initial-speed-value');
    const snakeSpeedDecrease = document.getElementById('snake-speed-decrease');
    const snakeSpeedDecreaseValue = document.getElementById('snake-speed-decrease-value');
    const snakeSpecialFood = document.getElementById('snake-special-food');
    const snakeSpecialFoodValue = document.getElementById('snake-special-food-value');
    const snakeFoodMultiplier = document.getElementById('snake-food-multiplier');
    const snakeFoodMultiplierValue = document.getElementById('snake-food-multiplier-value');
    const snakeWallCollision = document.getElementById('snake-wall-collision');

    // 2048游戏设置
    const game2048AnimationSpeed = document.getElementById('2048-animation-speed');
    const game2048AnimationSpeedValue = document.getElementById('2048-animation-speed-value');
    const game2048LevelBonus = document.getElementById('2048-level-bonus');
    const game2048LevelBonusValue = document.getElementById('2048-level-bonus-value');
    const game2048Tile4Probability = document.getElementById('2048-tile4-probability');
    const game2048Tile4ProbabilityValue = document.getElementById('2048-tile4-probability-value');
    const game2048AnimationsToggle = document.getElementById('2048-animations-toggle');

    // 记忆游戏设置
    const memoryDefaultDifficulty = document.getElementById('memory-default-difficulty');
    const memoryCardDuration = document.getElementById('memory-card-duration');
    const memoryCardDurationValue = document.getElementById('memory-card-duration-value');
    const memoryMatchBonus = document.getElementById('memory-match-bonus');
    const memoryMatchBonusValue = document.getElementById('memory-match-bonus-value');
    const memoryWrongPenalty = document.getElementById('memory-wrong-penalty');
    const memoryWrongPenaltyValue = document.getElementById('memory-wrong-penalty-value');
    const memoryTimerPenalty = document.getElementById('memory-timer-penalty');
    const memoryTimerPenaltyValue = document.getElementById('memory-timer-penalty-value');
    
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
        },
        tetris: {
            baseLevelSpeed: 1,
            speedDecreasePerLevel: 0.1,
            minSpeed: 0.5,
            scoreMultiplierBase: 1,
            scoreMultiplierIncrement: 0.1,
            maxScoreMultiplier: 10,
            comboMaxMultiplier: 2,
            comboMultiplierStep: 0.1,
            comboRewards: 100,
            abilityThresholdAdjustment: 0,
            abilityUnlockThresholds: {
                lineClear: 0,
                slowTime: 0,
                shapeTransform: 0
            },
            slowTimeEffectDuration: 1000,
            specialPieceChanceBase: 0.1,
            specialPieceChanceIncrement: 0.01,
            maxSpecialPieceChance: 0.5
        },
        snake: {
            initialSpeed: 10,
            minSpeed: 0.5,
            speedDecreasePerPoint: 0.1,
            gridSize: 10,
            boardWidth: 10,
            boardHeight: 10,
            specialFoodChance: 0.1,
            specialFoodScoreMultiplier: 2,
            specialFoodDuration: 1000,
            wallCollision: true,
            growthPerFood: 1
        },
        game2048: {
            levelThresholds: [1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000],
            levelBonusMultipliers: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5],
            levelBonusStep: 0.5,
            initialTile4Probability: 0.1,
            tile4ProbabilityIncrement: 0.01,
            maxTile4Probability: 0.5,
            animationSpeed: 500,
            showAnimations: true
        },
        memory: {
            difficulties: ['Easy', 'Medium', 'Hard'],
            cardShowDuration: 5000,
            timerPenaltyPerSecond: 1,
            consecutiveMatchBonus: 100,
            wrongMatchPenalty: 500,
            defaultDifficulty: 'Medium'
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
                
                // 游戏特定设置
                // 俄罗斯方块设置
                if (tetrisBaseSpeed) {
                    tetrisBaseSpeed.value = settings.tetris?.baseLevelSpeed || defaultSettings.tetris.baseLevelSpeed;
                    tetrisBaseSpeedValue.textContent = settings.tetris?.baseLevelSpeed || defaultSettings.tetris.baseLevelSpeed;
                }
                
                if (tetrisSpeedDecrease) {
                    tetrisSpeedDecrease.value = settings.tetris?.speedDecreasePerLevel || defaultSettings.tetris.speedDecreasePerLevel;
                    tetrisSpeedDecreaseValue.textContent = settings.tetris?.speedDecreasePerLevel || defaultSettings.tetris.speedDecreasePerLevel;
                }
                
                if (tetrisScoreMultiplier) {
                    tetrisScoreMultiplier.value = settings.tetris?.scoreMultiplierIncrement || defaultSettings.tetris.scoreMultiplierIncrement;
                    tetrisScoreMultiplierValue.textContent = settings.tetris?.scoreMultiplierIncrement || defaultSettings.tetris.scoreMultiplierIncrement;
                }
                
                if (tetrisComboMultiplier) {
                    tetrisComboMultiplier.value = settings.tetris?.comboMaxMultiplier || defaultSettings.tetris.comboMaxMultiplier;
                    tetrisComboMultiplierValue.textContent = settings.tetris?.comboMaxMultiplier || defaultSettings.tetris.comboMaxMultiplier;
                }
                
                if (tetrisAbilityThreshold) {
                    tetrisAbilityThreshold.value = settings.tetris?.abilityThresholdAdjustment || 0;
                    tetrisAbilityThresholdValue.textContent = settings.tetris?.abilityThresholdAdjustment || 0;
                }
                
                if (tetrisSpecialPiece) {
                    tetrisSpecialPiece.value = settings.tetris?.maxSpecialPieceChance || defaultSettings.tetris.maxSpecialPieceChance;
                    tetrisSpecialPieceValue.textContent = settings.tetris?.maxSpecialPieceChance || defaultSettings.tetris.maxSpecialPieceChance;
                }

                // 贪吃蛇设置
                if (snakeInitialSpeed) {
                    snakeInitialSpeed.value = settings.snake?.initialSpeed || defaultSettings.snake.initialSpeed;
                    snakeInitialSpeedValue.textContent = settings.snake?.initialSpeed || defaultSettings.snake.initialSpeed;
                }
                
                if (snakeSpeedDecrease) {
                    snakeSpeedDecrease.value = settings.snake?.speedDecreasePerPoint || defaultSettings.snake.speedDecreasePerPoint;
                    snakeSpeedDecreaseValue.textContent = settings.snake?.speedDecreasePerPoint || defaultSettings.snake.speedDecreasePerPoint;
                }
                
                if (snakeSpecialFood) {
                    snakeSpecialFood.value = settings.snake?.specialFoodChance || defaultSettings.snake.specialFoodChance;
                    snakeSpecialFoodValue.textContent = settings.snake?.specialFoodChance || defaultSettings.snake.specialFoodChance;
                }
                
                if (snakeFoodMultiplier) {
                    snakeFoodMultiplier.value = settings.snake?.specialFoodScoreMultiplier || defaultSettings.snake.specialFoodScoreMultiplier;
                    snakeFoodMultiplierValue.textContent = settings.snake?.specialFoodScoreMultiplier || defaultSettings.snake.specialFoodScoreMultiplier;
                }
                
                if (snakeWallCollision) {
                    snakeWallCollision.checked = settings.snake?.wallCollision !== undefined ? settings.snake.wallCollision : defaultSettings.snake.wallCollision;
                }
                
                // 2048游戏设置
                if (game2048AnimationSpeed) {
                    game2048AnimationSpeed.value = settings.game2048?.animationSpeed || defaultSettings.game2048.animationSpeed;
                    game2048AnimationSpeedValue.textContent = settings.game2048?.animationSpeed || defaultSettings.game2048.animationSpeed;
                }
                
                if (game2048LevelBonus) {
                    game2048LevelBonus.value = settings.game2048?.levelBonusStep || defaultSettings.game2048.levelBonusMultipliers[1] - defaultSettings.game2048.levelBonusMultipliers[0];
                    game2048LevelBonusValue.textContent = settings.game2048?.levelBonusStep || defaultSettings.game2048.levelBonusMultipliers[1] - defaultSettings.game2048.levelBonusMultipliers[0];
                }
                
                if (game2048Tile4Probability) {
                    game2048Tile4Probability.value = settings.game2048?.initialTile4Probability || defaultSettings.game2048.initialTile4Probability;
                    game2048Tile4ProbabilityValue.textContent = settings.game2048?.initialTile4Probability || defaultSettings.game2048.initialTile4Probability;
                }
                
                if (game2048AnimationsToggle) {
                    game2048AnimationsToggle.checked = settings.game2048?.showAnimations !== undefined ? settings.game2048.showAnimations : defaultSettings.game2048.showAnimations;
                }
                
                // 记忆游戏设置
                if (memoryDefaultDifficulty) {
                    memoryDefaultDifficulty.value = settings.memory?.defaultDifficulty || defaultSettings.memory.defaultDifficulty;
                }
                
                if (memoryCardDuration) {
                    memoryCardDuration.value = settings.memory?.cardShowDuration || defaultSettings.memory.cardShowDuration;
                    memoryCardDurationValue.textContent = settings.memory?.cardShowDuration || defaultSettings.memory.cardShowDuration;
                }
                
                if (memoryMatchBonus) {
                    memoryMatchBonus.value = settings.memory?.consecutiveMatchBonus || defaultSettings.memory.consecutiveMatchBonus;
                    memoryMatchBonusValue.textContent = settings.memory?.consecutiveMatchBonus || defaultSettings.memory.consecutiveMatchBonus;
                }
                
                if (memoryWrongPenalty) {
                    memoryWrongPenalty.value = settings.memory?.wrongMatchPenalty || defaultSettings.memory.wrongMatchPenalty;
                    memoryWrongPenaltyValue.textContent = settings.memory?.wrongMatchPenalty || defaultSettings.memory.wrongMatchPenalty;
                }
                
                if (memoryTimerPenalty) {
                    memoryTimerPenalty.value = settings.memory?.timerPenaltyPerSecond || defaultSettings.memory.timerPenaltyPerSecond;
                    memoryTimerPenaltyValue.textContent = settings.memory?.timerPenaltyPerSecond || defaultSettings.memory.timerPenaltyPerSecond;
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
        
        // 游戏特定设置
        // 俄罗斯方块设置
        if (tetrisBaseSpeed) {
            tetrisBaseSpeed.value = defaultSettings.tetris.baseLevelSpeed;
            tetrisBaseSpeedValue.textContent = defaultSettings.tetris.baseLevelSpeed;
        }
        
        if (tetrisSpeedDecrease) {
            tetrisSpeedDecrease.value = defaultSettings.tetris.speedDecreasePerLevel;
            tetrisSpeedDecreaseValue.textContent = defaultSettings.tetris.speedDecreasePerLevel;
        }
        
        if (tetrisScoreMultiplier) {
            tetrisScoreMultiplier.value = defaultSettings.tetris.scoreMultiplierIncrement;
            tetrisScoreMultiplierValue.textContent = defaultSettings.tetris.scoreMultiplierIncrement;
        }
        
        if (tetrisComboMultiplier) {
            tetrisComboMultiplier.value = defaultSettings.tetris.comboMaxMultiplier;
            tetrisComboMultiplierValue.textContent = defaultSettings.tetris.comboMaxMultiplier;
        }
        
        if (tetrisAbilityThreshold) {
            tetrisAbilityThreshold.value = 0;
            tetrisAbilityThresholdValue.textContent = 0;
        }
        
        if (tetrisSpecialPiece) {
            tetrisSpecialPiece.value = defaultSettings.tetris.maxSpecialPieceChance;
            tetrisSpecialPieceValue.textContent = defaultSettings.tetris.maxSpecialPieceChance;
        }

        // 贪吃蛇设置
        if (snakeInitialSpeed) {
            snakeInitialSpeed.value = defaultSettings.snake.initialSpeed;
            snakeInitialSpeedValue.textContent = defaultSettings.snake.initialSpeed;
        }
        
        if (snakeSpeedDecrease) {
            snakeSpeedDecrease.value = defaultSettings.snake.speedDecreasePerPoint;
            snakeSpeedDecreaseValue.textContent = defaultSettings.snake.speedDecreasePerPoint;
        }
        
        if (snakeSpecialFood) {
            snakeSpecialFood.value = defaultSettings.snake.specialFoodChance;
            snakeSpecialFoodValue.textContent = defaultSettings.snake.specialFoodChance;
        }
        
        if (snakeFoodMultiplier) {
            snakeFoodMultiplier.value = defaultSettings.snake.specialFoodScoreMultiplier;
            snakeFoodMultiplierValue.textContent = defaultSettings.snake.specialFoodScoreMultiplier;
        }
        
        if (snakeWallCollision) {
            snakeWallCollision.checked = defaultSettings.snake.wallCollision;
        }
        
        // 2048游戏设置
        if (game2048AnimationSpeed) {
            game2048AnimationSpeed.value = defaultSettings.game2048.animationSpeed;
            game2048AnimationSpeedValue.textContent = defaultSettings.game2048.animationSpeed;
        }
        
        if (game2048LevelBonus) {
            game2048LevelBonus.value = defaultSettings.game2048.levelBonusMultipliers[1] - defaultSettings.game2048.levelBonusMultipliers[0];
            game2048LevelBonusValue.textContent = defaultSettings.game2048.levelBonusMultipliers[1] - defaultSettings.game2048.levelBonusMultipliers[0];
        }
        
        if (game2048Tile4Probability) {
            game2048Tile4Probability.value = defaultSettings.game2048.initialTile4Probability;
            game2048Tile4ProbabilityValue.textContent = defaultSettings.game2048.initialTile4Probability;
        }
        
        if (game2048AnimationsToggle) {
            game2048AnimationsToggle.checked = defaultSettings.game2048.showAnimations;
        }
        
        // 记忆游戏设置
        if (memoryDefaultDifficulty) {
            memoryDefaultDifficulty.value = defaultSettings.memory.defaultDifficulty;
        }
        
        if (memoryCardDuration) {
            memoryCardDuration.value = defaultSettings.memory.cardShowDuration;
            memoryCardDurationValue.textContent = defaultSettings.memory.cardShowDuration;
        }
        
        if (memoryMatchBonus) {
            memoryMatchBonus.value = defaultSettings.memory.consecutiveMatchBonus;
            memoryMatchBonusValue.textContent = defaultSettings.memory.consecutiveMatchBonus;
        }
        
        if (memoryWrongPenalty) {
            memoryWrongPenalty.value = defaultSettings.memory.wrongMatchPenalty;
            memoryWrongPenaltyValue.textContent = defaultSettings.memory.wrongMatchPenalty;
        }
        
        if (memoryTimerPenalty) {
            memoryTimerPenalty.value = defaultSettings.memory.timerPenaltyPerSecond;
            memoryTimerPenaltyValue.textContent = defaultSettings.memory.timerPenaltyPerSecond;
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
            },
            tetris: {
                baseLevelSpeed: tetrisBaseSpeed ? parseInt(tetrisBaseSpeed.value) : defaultSettings.tetris.baseLevelSpeed,
                speedDecreasePerLevel: tetrisSpeedDecrease ? parseInt(tetrisSpeedDecrease.value) : defaultSettings.tetris.speedDecreasePerLevel,
                minSpeed: defaultSettings.tetris.minSpeed,
                scoreMultiplierBase: defaultSettings.tetris.scoreMultiplierBase,
                scoreMultiplierIncrement: tetrisScoreMultiplier ? parseFloat(tetrisScoreMultiplier.value) : defaultSettings.tetris.scoreMultiplierIncrement,
                maxScoreMultiplier: defaultSettings.tetris.maxScoreMultiplier,
                comboMaxMultiplier: tetrisComboMultiplier ? parseFloat(tetrisComboMultiplier.value) : defaultSettings.tetris.comboMaxMultiplier,
                comboMultiplierStep: defaultSettings.tetris.comboMultiplierStep,
                comboRewards: defaultSettings.tetris.comboRewards,
                abilityThresholdAdjustment: tetrisAbilityThreshold ? parseInt(tetrisAbilityThreshold.value) : 0,
                abilityUnlockThresholds: {
                    lineClear: defaultSettings.tetris.abilityUnlockThresholds.lineClear + (tetrisAbilityThreshold ? parseInt(tetrisAbilityThreshold.value) : 0),
                    slowTime: defaultSettings.tetris.abilityUnlockThresholds.slowTime + (tetrisAbilityThreshold ? parseInt(tetrisAbilityThreshold.value) : 0),
                    shapeTransform: defaultSettings.tetris.abilityUnlockThresholds.shapeTransform + (tetrisAbilityThreshold ? parseInt(tetrisAbilityThreshold.value) : 0)
                },
                slowTimeEffectDuration: defaultSettings.tetris.slowTimeEffectDuration,
                specialPieceChanceBase: defaultSettings.tetris.specialPieceChanceBase,
                specialPieceChanceIncrement: defaultSettings.tetris.specialPieceChanceIncrement,
                maxSpecialPieceChance: tetrisSpecialPiece ? parseFloat(tetrisSpecialPiece.value) : defaultSettings.tetris.maxSpecialPieceChance
            },
            snake: {
                initialSpeed: snakeInitialSpeed ? parseInt(snakeInitialSpeed.value) : defaultSettings.snake.initialSpeed,
                minSpeed: defaultSettings.snake.minSpeed,
                speedDecreasePerPoint: snakeSpeedDecrease ? parseFloat(snakeSpeedDecrease.value) : defaultSettings.snake.speedDecreasePerPoint,
                gridSize: defaultSettings.snake.gridSize,
                boardWidth: defaultSettings.snake.boardWidth,
                boardHeight: defaultSettings.snake.boardHeight,
                specialFoodChance: snakeSpecialFood ? parseFloat(snakeSpecialFood.value) : defaultSettings.snake.specialFoodChance,
                specialFoodScoreMultiplier: snakeFoodMultiplier ? parseFloat(snakeFoodMultiplier.value) : defaultSettings.snake.specialFoodScoreMultiplier,
                specialFoodDuration: defaultSettings.snake.specialFoodDuration,
                wallCollision: snakeWallCollision ? snakeWallCollision.checked : defaultSettings.snake.wallCollision,
                growthPerFood: defaultSettings.snake.growthPerFood
            },
            game2048: {
                levelThresholds: defaultSettings.game2048.levelThresholds,
                // 根据用户设置的增长率生成倍率数组
                levelBonusMultipliers: generateBonusMultipliers(
                    game2048LevelBonus ? parseFloat(game2048LevelBonus.value) : defaultSettings.game2048.levelBonusMultipliers[1] - defaultSettings.game2048.levelBonusMultipliers[0]
                ),
                levelBonusStep: game2048LevelBonus ? parseFloat(game2048LevelBonus.value) : defaultSettings.game2048.levelBonusMultipliers[1] - defaultSettings.game2048.levelBonusMultipliers[0],
                initialTile4Probability: game2048Tile4Probability ? parseFloat(game2048Tile4Probability.value) : defaultSettings.game2048.initialTile4Probability,
                tile4ProbabilityIncrement: defaultSettings.game2048.tile4ProbabilityIncrement,
                maxTile4Probability: defaultSettings.game2048.maxTile4Probability,
                animationSpeed: game2048AnimationSpeed ? parseInt(game2048AnimationSpeed.value) : defaultSettings.game2048.animationSpeed,
                showAnimations: game2048AnimationsToggle ? game2048AnimationsToggle.checked : defaultSettings.game2048.showAnimations
            },
            memory: {
                difficulties: defaultSettings.memory.difficulties,
                cardShowDuration: memoryCardDuration ? parseInt(memoryCardDuration.value) : defaultSettings.memory.cardShowDuration,
                timerPenaltyPerSecond: memoryTimerPenalty ? parseInt(memoryTimerPenalty.value) : defaultSettings.memory.timerPenaltyPerSecond,
                consecutiveMatchBonus: memoryMatchBonus ? parseInt(memoryMatchBonus.value) : defaultSettings.memory.consecutiveMatchBonus,
                wrongMatchPenalty: memoryWrongPenalty ? parseInt(memoryWrongPenalty.value) : defaultSettings.memory.wrongMatchPenalty,
                defaultDifficulty: memoryDefaultDifficulty ? memoryDefaultDifficulty.value : defaultSettings.memory.defaultDifficulty
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
    
    // 生成2048游戏级别倍率数组的辅助函数
    function generateBonusMultipliers(stepValue) {
        const multipliers = [1]; // 第一级总是1倍
        for (let i = 1; i < 10; i++) {
            multipliers.push(parseFloat((1 + i * stepValue).toFixed(1)));
        }
        return multipliers;
    }
    
    // 游戏子选项卡事件
    const gamesSubtabs = document.querySelectorAll('.games-subtabs .subtab-button');
    if (gamesSubtabs.length > 0) {
        gamesSubtabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                
                // 移除所有激活状态
                document.querySelectorAll('.games-subtabs .subtab-button').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.games-subsection').forEach(s => s.classList.remove('active'));
                
                // 激活当前选项卡
                this.classList.add('active');
                document.getElementById(targetId).classList.add('active');
            });
        });
    }
    
    // 添加新滑块值更新事件
    // 俄罗斯方块设置
    if (tetrisBaseSpeed) {
        tetrisBaseSpeed.addEventListener('input', function() {
            tetrisBaseSpeedValue.textContent = this.value;
        });
    }
    
    if (tetrisSpeedDecrease) {
        tetrisSpeedDecrease.addEventListener('input', function() {
            tetrisSpeedDecreaseValue.textContent = this.value;
        });
    }
    
    if (tetrisScoreMultiplier) {
        tetrisScoreMultiplier.addEventListener('input', function() {
            tetrisScoreMultiplierValue.textContent = this.value;
        });
    }
    
    if (tetrisComboMultiplier) {
        tetrisComboMultiplier.addEventListener('input', function() {
            tetrisComboMultiplierValue.textContent = this.value;
        });
    }
    
    if (tetrisAbilityThreshold) {
        tetrisAbilityThreshold.addEventListener('input', function() {
            tetrisAbilityThresholdValue.textContent = this.value;
        });
    }
    
    if (tetrisSpecialPiece) {
        tetrisSpecialPiece.addEventListener('input', function() {
            tetrisSpecialPieceValue.textContent = this.value;
        });
    }
    
    // 贪吃蛇设置
    if (snakeInitialSpeed) {
        snakeInitialSpeed.addEventListener('input', function() {
            snakeInitialSpeedValue.textContent = this.value;
        });
    }
    
    if (snakeSpeedDecrease) {
        snakeSpeedDecrease.addEventListener('input', function() {
            snakeSpeedDecreaseValue.textContent = this.value;
        });
    }
    
    if (snakeSpecialFood) {
        snakeSpecialFood.addEventListener('input', function() {
            snakeSpecialFoodValue.textContent = this.value;
        });
    }
    
    if (snakeFoodMultiplier) {
        snakeFoodMultiplier.addEventListener('input', function() {
            snakeFoodMultiplierValue.textContent = this.value;
        });
    }
    
    // 2048游戏设置
    if (game2048AnimationSpeed) {
        game2048AnimationSpeed.addEventListener('input', function() {
            game2048AnimationSpeedValue.textContent = this.value;
        });
    }
    
    if (game2048LevelBonus) {
        game2048LevelBonus.addEventListener('input', function() {
            game2048LevelBonusValue.textContent = this.value;
        });
    }
    
    if (game2048Tile4Probability) {
        game2048Tile4Probability.addEventListener('input', function() {
            game2048Tile4ProbabilityValue.textContent = this.value;
        });
    }
    
    // 记忆游戏设置
    if (memoryCardDuration) {
        memoryCardDuration.addEventListener('input', function() {
            memoryCardDurationValue.textContent = this.value;
        });
    }
    
    if (memoryMatchBonus) {
        memoryMatchBonus.addEventListener('input', function() {
            memoryMatchBonusValue.textContent = this.value;
        });
    }
    
    if (memoryWrongPenalty) {
        memoryWrongPenalty.addEventListener('input', function() {
            memoryWrongPenaltyValue.textContent = this.value;
        });
    }
    
    if (memoryTimerPenalty) {
        memoryTimerPenalty.addEventListener('input', function() {
            memoryTimerPenaltyValue.textContent = this.value;
        });
    }

    // 添加游戏设置子选项卡样式
    const gameSubtabsStyle = `
        .games-subtabs {
            display: flex;
            flex-wrap: wrap;
            margin: 15px 0;
            padding: 5px 0;
            border-bottom: 1px solid var(--box-shadow-color);
        }
        
        .subtab-button {
            background: none;
            border: none;
            padding: 8px 15px;
            margin-right: 5px;
            margin-bottom: 5px;
            border-radius: 5px;
            cursor: pointer;
            color: var(--text-color);
            transition: all 0.2s;
        }
        
        .subtab-button.active {
            background-color: var(--primary-color);
            color: white;
        }
        
        .games-subsection {
            display: none;
            padding-top: 10px;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .games-subsection.active {
            display: block;
            opacity: 1;
        }
        
        .games-subsection h3 {
            margin-top: 0;
            color: var(--header-color);
        }
    `;
    
    // 添加样式到头部
    const styleElement = document.createElement('style');
    styleElement.textContent += gameSubtabsStyle;
    document.head.appendChild(styleElement);
    
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