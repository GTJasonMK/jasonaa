// 获取当前配置
const config = window.appConfig || {
    audio: { correctAnswerDelay: 1000, autoPlayNextNote: true },
    game: { startingDifficulty: 0, defaultMelodyLength: 3 }
};

document.addEventListener('DOMContentLoaded', () => {
    // 获取当前配置
    const config = window.appConfig || {
        audio: { correctAnswerDelay: 1000, autoPlayNextNote: true },
        game: { startingDifficulty: 0, defaultMelodyLength: 3 }
    };
    
    // 导航切换
    const navLinks = document.querySelectorAll('nav a');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // 获取链接地址
            const href = link.getAttribute('href');
            
            // 检查是否是页内导航 (#开头)
            if (href.startsWith('#')) {
                e.preventDefault();
                
                // 移除所有活跃状态
                navLinks.forEach(item => item.classList.remove('active'));
                sections.forEach(section => section.classList.remove('active'));
                
                // 添加活跃状态到当前项
                link.classList.add('active');
                const targetId = href.substring(1);
                document.getElementById(targetId).classList.add('active');
            }
            // 如果不是页内导航，则使用默认行为导航到新页面
        });
    });
    
    // 游戏卡片点击事件
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        if (!card.classList.contains('coming-soon')) {
            card.addEventListener('click', () => {
                const game = card.getAttribute('data-game');
                window.location.href = `${game}.html`;
            });
        }
    });
    
    // 音乐练习选项点击事件
    const musicCards = document.querySelectorAll('.music-card');
    const musicContainer = document.getElementById('music-app');
    
    musicCards.forEach(card => {
        card.addEventListener('click', () => {
            // 移除所有卡片的活跃状态
            musicCards.forEach(c => c.classList.remove('active'));
            
            // 添加活跃状态到当前卡片
            card.classList.add('active');
            
            // 显示音乐应用容器
            musicContainer.classList.add('active');
            
            // 加载相应的音乐练习内容
            const mode = card.getAttribute('data-mode');
            loadMusicApp(mode);
        });
    });
    
    // 加载音乐应用
    function loadMusicApp(mode) {
        // 停止所有声音
        if (window.musicFunctions && window.musicFunctions.stopAllSounds) {
            window.musicFunctions.stopAllSounds();
        }
        
        // 清空音乐容器
        musicContainer.innerHTML = '';
        
        switch(mode) {
            case 'scales':
                loadScalesTraining();
                break;
            case 'single-note':
                loadSingleNoteTraining();
                break;
            case 'multi-note':
                loadMultiNoteTraining();
                break;
            default:
                musicContainer.innerHTML = '<p>请选择一个练习模式</p>';
        }
    }
    
    // 音阶练习模块
    function loadScalesTraining() {
        const scalesApp = document.createElement('div');
        scalesApp.className = 'scales-app';
        
        // 获取音阶列表
        const scaleNames = Object.keys(window.musicFunctions.scales);
        
        scalesApp.innerHTML = `
            <h3>音阶练习</h3>
            <div class="compact-container">
                <div class="left-panel">
                    <div class="scale-instructions">
                        <p>选择一个音阶，然后点击"播放"按钮来聆听</p>
                    </div>
                    <div class="scale-buttons">
                        ${scaleNames.map(name => 
                            `<div class="scale-button" data-scale="${name}">
                                <div class="scale-name">${name}</div>
                                <div class="scale-controls">
                                    <button class="play-button" data-scale="${name}">播放</button>
                                    <button class="info-button" data-scale="${name}">查看音符</button>
                                </div>
                            </div>`
                        ).join('')}
                    </div>
                </div>
                <div class="right-panel">
                    <div class="scale-detail">
                        <h4 id="current-scale-name"></h4>
                        <div class="scale-notes" id="scale-notes"></div>
                    </div>
                </div>
            </div>
        `;
        
        musicContainer.appendChild(scalesApp);
        
        // 添加事件监听
        const playButtons = scalesApp.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const scaleName = e.target.getAttribute('data-scale');
                playScale(scaleName);
                
                // 高亮当前选中的音阶按钮
                const scaleButtons = scalesApp.querySelectorAll('.scale-button');
                scaleButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-scale') === scaleName) {
                        btn.classList.add('active');
                    }
                });
            });
        });
        
        const infoButtons = scalesApp.querySelectorAll('.info-button');
        infoButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const scaleName = e.target.getAttribute('data-scale');
                document.getElementById('current-scale-name').textContent = scaleName;
                showScaleNotes(scaleName);
                
                // 高亮当前选中的音阶按钮
                const scaleButtons = scalesApp.querySelectorAll('.scale-button');
                scaleButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-scale') === scaleName) {
                        btn.classList.add('active');
                    }
                });
            });
        });
        
        // 默认显示第一个音阶的信息
        if (scaleNames.length > 0) {
            document.getElementById('current-scale-name').textContent = scaleNames[0];
            showScaleNotes(scaleNames[0]);
        }
    }
    
    // 单音辨听训练
    function loadSingleNoteTraining() {
        const singleNoteApp = document.createElement('div');
        singleNoteApp.className = 'single-note-app';
        
        singleNoteApp.innerHTML = `
            <h3>单音辨听训练</h3>
            <div class="compact-container">
                <div class="left-panel">
                    <div class="game-settings">
                        <div class="difficulty-selection">
                            <label>难度:</label>
                            <select id="difficulty">
                                <option value="0">基础</option>
                                <option value="1">进阶</option>
                                <option value="2">扩展</option>
                            </select>
                        </div>
                    </div>
                    <div class="note-play-section">
                        <button id="play-note" class="play-button">播放音符</button>
                        <p class="note-instructions">聆听音符，然后选择正确的音符名称</p>
                    </div>
                    <div class="game-stats">
                        <div class="stats-item">
                            <span>正确:</span>
                            <span id="correct-count">0</span>
                        </div>
                        <div class="stats-item">
                            <span>错误:</span>
                            <span id="error-count">0</span>
                        </div>
                        <div class="stats-item">
                            <span>准确率:</span>
                            <span id="accuracy">0%</span>
                        </div>
                    </div>
                </div>
                <div class="right-panel">
                    <div class="notes-section">
                        <h4>选择答案</h4>
                        <div id="notes-grid" class="notes-grid">
                            <!-- 音符选项将在这里生成 -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        musicContainer.appendChild(singleNoteApp);
        
        // 初始化音符按钮
        initNoteButtons();
        
        // 单音辨听状态
        let currentNote = null;
        let correctCount = 0;
        let errorCount = 0;
        
        // 更新统计信息
        function updateStats() {
            document.getElementById('correct-count').textContent = correctCount;
            document.getElementById('error-count').textContent = errorCount;
            const totalAttempts = correctCount + errorCount;
            const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
            document.getElementById('accuracy').textContent = `${accuracy}%`;
        }
        
        // 初始化音符按钮
        function initNoteButtons() {
            const notesGrid = document.getElementById('notes-grid');
            if (!notesGrid) return;
            
            // 清空现有内容
            notesGrid.innerHTML = '';
            
            // 获取当前难度的可用音符
            const difficultyIndex = parseInt(document.getElementById('difficulty').value);
            const availableNotes = window.musicFunctions.rangeOptions[difficultyIndex].notes;
            
            // 创建音符按钮
            availableNotes.forEach(note => {
                const noteButton = document.createElement('div');
                noteButton.className = 'note-button';
                noteButton.textContent = note;
                noteButton.addEventListener('click', () => {
                    if (currentNote) {
                        // 检查是否选择了正确的音符
                        if (note === currentNote) {
                            correctCount++;
                            noteButton.classList.add('correct');
                            setTimeout(() => {
                                // 成功后自动播放下一个音符
                                noteButton.classList.remove('correct');
                                if (config.audio.autoPlayNextNote) {
                                    playRandomNote();
                                }
                            }, config.audio.correctAnswerDelay);
                        } else {
                            errorCount++;
                            noteButton.classList.add('incorrect');
                            setTimeout(() => {
                                noteButton.classList.remove('incorrect');
                            }, config.audio.correctAnswerDelay);
                        }
                        updateStats();
                    } else {
                        // 如果没有当前音符，直接播放
                        window.musicFunctions.playNote(note);
                    }
                });
                
                notesGrid.appendChild(noteButton);
            });
        }
        
        // 播放随机音符
        function playRandomNote() {
            const difficultyIndex = parseInt(document.getElementById('difficulty').value);
            const availableNotes = window.musicFunctions.rangeOptions[difficultyIndex].notes;
            const randomIndex = Math.floor(Math.random() * availableNotes.length);
            currentNote = availableNotes[randomIndex];
            
            // 清除所有高亮
            const noteButtons = document.querySelectorAll('.note-button');
            noteButtons.forEach(button => {
                button.classList.remove('correct');
                button.classList.remove('incorrect');
            });
            
            window.musicFunctions.playNote(currentNote);
        }
        
        // 难度变化时重新生成音符按钮
        document.getElementById('difficulty').addEventListener('change', () => {
            initNoteButtons();
            currentNote = null;
        });
        
        // 初始化播放按钮
        document.getElementById('play-note').addEventListener('click', () => {
            if (currentNote) {
                window.musicFunctions.playNote(currentNote);
            } else {
                playRandomNote();
            }
        });
    }
    
    // 多音辨听训练
    function loadMultiNoteTraining() {
        const multiNoteApp = document.createElement('div');
        multiNoteApp.className = 'multi-note-app';
        
        multiNoteApp.innerHTML = `
            <h3>多音辨听训练</h3>
            <div class="game-settings">
                <div class="difficulty-selection">
                    <label>旋律长度:</label>
                    <select id="melody-length">
                        <option value="3">3个音符</option>
                        <option value="4">4个音符</option>
                        <option value="5">5个音符</option>
                        <option value="7">7个音符</option>
                        <option value="9">9个音符</option>
                    </select>
                </div>
                <div class="difficulty-selection">
                    <label>音域难度:</label>
                    <select id="melody-range">
                        <option value="0">基础</option>
                        <option value="1">进阶</option>
                        <option value="2">扩展</option>
                    </select>
                </div>
            </div>
            <div class="compact-container">
                <div class="left-panel">
                    <div class="melody-play-section">
                        <button id="play-melody" class="play-button">播放旋律</button>
                        <div id="melody-display" class="melody-display">
                            <!-- 旋律将在这里显示 -->
                        </div>
                    </div>
                    <div class="melody-answer-section">
                        <h4>您的答案</h4>
                        <div id="user-selection" class="user-selection">
                            <!-- 用户的选择会在这里显示 -->
                        </div>
                    </div>
                    <div id="melody-controls" class="controls">
                        <button id="check-melody">检查答案</button>
                        <button id="new-melody">新旋律</button>
                    </div>
                    <div class="game-stats">
                        <div class="stats-item">
                            <span>得分:</span>
                            <span id="melody-score">0</span>
                        </div>
                        <div class="stats-item">
                            <span>最高分:</span>
                            <span id="high-score">0</span>
                        </div>
                    </div>
                </div>
                <div class="right-panel">
                    <div class="notes-section">
                        <h4>可选音符</h4>
                        <div id="notes-selection" class="notes-grid">
                            <!-- 音符选择将在这里生成 -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        musicContainer.appendChild(multiNoteApp);
        
        // 初始化多音辨听练习
        initMelodyPractice();
    }
    
    // 多音辨听练习初始化
    function initMelodyPractice() {
        // 旋律状态
        let currentMelody = [];
        let userSelection = [];
        let melodyScore = 0;
        let highScore = 0;
        
        // 获取DOM元素
        const melodyLengthSelect = document.getElementById('melody-length');
        const melodyRangeSelect = document.getElementById('melody-range');
        const playMelodyBtn = document.getElementById('play-melody');
        const checkMelodyBtn = document.getElementById('check-melody');
        const newMelodyBtn = document.getElementById('new-melody');
        const melodyDisplay = document.getElementById('melody-display');
        const userSelectionDiv = document.getElementById('user-selection');
        const notesSelectionDiv = document.getElementById('notes-selection');
        const scoreDisplay = document.getElementById('melody-score');
        const highScoreDisplay = document.getElementById('high-score');
        
        // 设置初始难度和旋律长度
        if (config && config.game) {
            if (melodyRangeSelect) {
                melodyRangeSelect.value = config.game.startingDifficulty;
            }
            if (melodyLengthSelect) {
                melodyLengthSelect.value = config.game.defaultMelodyLength;
            }
        }
        
        // 生成新旋律
        function generateNewMelody() {
            const melodyLength = parseInt(melodyLengthSelect.value);
            const melodyRange = parseInt(melodyRangeSelect.value);
            
            currentMelody = window.musicFunctions.generateRandomMelody(melodyRange, melodyLength);
            userSelection = [];
            
            // 更新显示
            updateMelodyDisplay();
            updateUserSelection();
            // 更新音符选择按钮
            updateNotesSelection();
        }
        
        // 播放当前旋律
        function playCurrentMelody() {
            if (currentMelody.length > 0) {
                window.musicFunctions.playMelody(currentMelody);
            }
        }
        
        // 更新旋律显示
        function updateMelodyDisplay() {
            melodyDisplay.innerHTML = '';
            for (let i = 0; i < currentMelody.length; i++) {
                const noteSlot = document.createElement('div');
                noteSlot.className = 'note-slot';
                noteSlot.textContent = '?';
                melodyDisplay.appendChild(noteSlot);
            }
        }
        
        // 更新用户选择显示
        function updateUserSelection() {
            userSelectionDiv.innerHTML = '';
            
            if (userSelection.length === 0) {
                const emptyMsg = document.createElement('p');
                emptyMsg.className = 'empty-selection';
                emptyMsg.textContent = '请选择音符来完成旋律';
                userSelectionDiv.appendChild(emptyMsg);
                return;
            }
            
            for (let i = 0; i < userSelection.length; i++) {
                const noteElement = document.createElement('div');
                noteElement.className = 'selected-note';
                noteElement.textContent = userSelection[i];
                
                // 添加删除按钮
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-note';
                deleteBtn.textContent = '×';
                deleteBtn.onclick = () => {
                    userSelection.splice(i, 1);
                    updateUserSelection();
                };
                
                noteElement.appendChild(deleteBtn);
                userSelectionDiv.appendChild(noteElement);
            }
        }
        
        // 更新音符选择按钮
        function updateNotesSelection() {
            notesSelectionDiv.innerHTML = '';
            
            // 获取当前难度的可用音符
            const melodyRange = parseInt(melodyRangeSelect.value);
            const availableNotes = window.musicFunctions.rangeOptions[melodyRange].notes;
            
            // 创建音符按钮
            availableNotes.forEach(note => {
                const noteButton = document.createElement('div');
                noteButton.className = 'note-button';
                noteButton.textContent = note;
                noteButton.addEventListener('click', () => {
                    // 播放音符
                    window.musicFunctions.playNote(note);
                    
                    // 如果当前旋律已满，不再添加
                    if (userSelection.length < currentMelody.length) {
                        userSelection.push(note);
                        updateUserSelection();
                    }
                });
                
                notesSelectionDiv.appendChild(noteButton);
            });
        }
        
        // 检查答案
        function checkAnswer() {
            if (userSelection.length !== currentMelody.length) {
                alert('请选择所有音符！');
                return;
            }
            
            // 计算正确数量
            let correctCount = 0;
            for (let i = 0; i < currentMelody.length; i++) {
                if (userSelection[i] === currentMelody[i]) {
                    correctCount++;
                }
            }
            
            // 计算分数
            const pointsPerCorrect = config.game.pointsPerCorrect || 10;
            const newScore = correctCount * pointsPerCorrect;
            melodyScore += newScore;
            
            // 更新最高分
            if (melodyScore > highScore) {
                highScore = melodyScore;
                highScoreDisplay.textContent = highScore;
            }
            
            // 更新分数显示
            scoreDisplay.textContent = melodyScore;
            
            // 显示正确答案
            showAnswer();
            
            // 显示结果信息
            if (correctCount === currentMelody.length) {
                alert(`太棒了! 全部正确! 得分: ${newScore}`);
                
                // 答对后自动生成并播放新旋律
                setTimeout(() => {
                    generateNewMelody();
                    setTimeout(() => {
                        playCurrentMelody();
                    }, 500); // 等待半秒后播放，让用户有时间准备
                }, config.audio.correctAnswerDelay || 1000);
            } else {
                alert(`回答正确: ${correctCount}/${currentMelody.length}. 得分: ${newScore}`);
            }
        }
        
        // 显示正确答案
        function showAnswer() {
            melodyDisplay.innerHTML = '';
            for (let i = 0; i < currentMelody.length; i++) {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-slot correct';
                noteElement.textContent = currentMelody[i];
                
                if (userSelection[i] === currentMelody[i]) {
                    noteElement.classList.add('user-correct');
                }
                
                melodyDisplay.appendChild(noteElement);
            }
        }
        
        // 事件监听
        melodyRangeSelect.addEventListener('change', () => {
            updateNotesSelection();
            // 自动生成新旋律
            generateNewMelody();
        });
        
        // 添加旋律长度变化的事件监听，自动生成新旋律
        melodyLengthSelect.addEventListener('change', () => {
            generateNewMelody();
        });
        
        // 添加事件监听
        playMelodyBtn.addEventListener('click', playCurrentMelody);
        checkMelodyBtn.addEventListener('click', checkAnswer);
        newMelodyBtn.addEventListener('click', generateNewMelody);
        
        // 初始生成一个旋律
        generateNewMelody();
    }
    
    // 播放音阶
    function playScale(scaleName) {
        if (window.musicFunctions && window.musicFunctions.playScale) {
            window.musicFunctions.playScale(scaleName);
        }
    }
    
    // 显示音阶音符
    function showScaleNotes(scaleName) {
        const scaleNotesContainer = document.getElementById('scale-notes');
        if (!scaleNotesContainer) return;
        
        // 清空容器
        scaleNotesContainer.innerHTML = '';
        
        // 获取音阶音符
        const scaleNotes = window.musicFunctions.scales[scaleName];
        
        // 创建音符显示
        scaleNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'scale-note';
            noteElement.textContent = note;
            noteElement.addEventListener('click', () => {
                window.musicFunctions.playNote(note);
                
                // 高亮点击的音符
                noteElement.classList.add('active');
                setTimeout(() => {
                    noteElement.classList.remove('active');
                }, config.audio.highlightDuration || 500);
            });
            
            scaleNotesContainer.appendChild(noteElement);
        });
    }
}); 



