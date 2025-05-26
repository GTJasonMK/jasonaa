/**
 * 音乐练习模块
 * 实现音阶练习、单音辨听和多音辨听功能
 */

// 全局音乐功能命名空间
window.musicFunctions = (function() {
    // 音符频率定义（以A4=440Hz为基准）
    const NOTE_FREQUENCIES = {
        "C4": 261.63,  // C4
        "C#4": 277.18,
        "D4": 293.66,
        "D#4": 311.13,
        "E4": 329.63,
        "F4": 349.23,
        "F#4": 369.99,
        "G4": 392.00,
        "G#4": 415.30,
        "A4": 440.00,
        "A#4": 466.16,
        "B4": 493.88,
        "C5": 523.25
    };

    // 音符名称映射（处理#号问题）
    const NOTE_MAPPING = {
        "C#4": "Cs4",
        "D#4": "Ds4",
        "F#4": "Fs4",
        "G#4": "Gs4",
        "A#4": "As4"
    };

    // 需要预加载的音符列表
    const NOTES_TO_PRELOAD = [
        "C4", "C#4", "D4", "D#4", "E4", 
        "F4", "F#4", "G4", "G#4", "A4", 
        "A#4", "B4", "C5"
    ];

    // 音阶定义
    const SCALES = {
        "C大调": ["C4", "D4", "E4", "F4", "G4", "A4", "B4"],
        "G大调": ["G4", "A4", "B4", "C4", "D4", "E4", "F#4"],
        "D大调": ["D4", "E4", "F#4", "G4", "A4", "B4", "C#4"],
        "A大调": ["A4", "B4", "C#4", "D4", "E4", "F#4", "G#4"],
        "E大调": ["E4", "F#4", "G#4", "A4", "B4", "C#4", "D#4"],
        "B大调": ["B4", "C#4", "D#4", "E4", "F#4", "G#4", "A#4"],
        "F#大调": ["F#4", "G#4", "A#4", "B4", "C#4", "D#4", "E#4"],
        "C#大调": ["C#4", "D#4", "E#4", "F#4", "G#4", "A#4", "B#4"]
    };

    // 音域范围选项
    const RANGE_OPTIONS = [
        {name: "基础", notes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4"]},
        {name: "进阶", notes: ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4"]},
        {name: "扩展", notes: ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5"]}
    ];

    // 旋律长度选项
    const MELODY_LENGTH_OPTIONS = [3, 4, 5, 7, 9];

    // 音频上下文和音频缓存
    let audioContext = null;
    const audioBufferCache = {};
    let currentPlayingSource = null;

    // 调试模式
    const DEBUG = true;
    
    // 增强型日志
    function debugLog(...args) {
        if (DEBUG) {
            console.log('[音乐模块]', ...args);
        }
    }
    
    function debugError(...args) {
        console.error('[音乐模块错误]', ...args);
    }
    
    function debugWarn(...args) {
        console.warn('[音乐模块警告]', ...args);
    }

    // 检查是否使用了file://协议
    function isFileProtocol() {
        return window.location.protocol === 'file:';
    }
    
    // 显示协议警告
    function showProtocolWarning() {
        debugWarn("检测到通过file://协议访问，音频文件可能无法正常加载，请使用HTTP服务器");
        
        // 创建警告元素
        const warningDiv = document.createElement('div');
        warningDiv.style.position = 'fixed';
        warningDiv.style.top = '0';
        warningDiv.style.left = '0';
        warningDiv.style.right = '0';
        warningDiv.style.padding = '10px';
        warningDiv.style.backgroundColor = '#fff3cd';
        warningDiv.style.color = '#856404';
        warningDiv.style.textAlign = 'center';
        warningDiv.style.zIndex = '10000';
        warningDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        warningDiv.innerHTML = `
            <strong>注意!</strong> 通过直接打开文件的方式访问可能导致音频无法加载。
            <br>请通过HTTP服务器访问此页面(例如使用http-server或其他本地服务器)。
            <button id="close-warning" style="margin-left:10px;border:none;background:#ffeeba;padding:3px 8px;border-radius:3px;cursor:pointer">
                我知道了
            </button>
            <button id="use-synth" style="margin-left:10px;border:none;background:#c3e6cb;padding:3px 8px;border-radius:3px;cursor:pointer">
                继续使用合成音频
            </button>
        `;
        
        document.body.prepend(warningDiv);
        
        // 添加关闭按钮事件
        document.getElementById('close-warning').addEventListener('click', () => {
            warningDiv.style.display = 'none';
        });
        
        // 添加使用合成音频的按钮事件
        document.getElementById('use-synth').addEventListener('click', () => {
            localStorage.setItem('useSynthAudio', 'true');
            warningDiv.style.display = 'none';
            location.reload();
        });
    }
    
    // 确定是否应该使用合成音频
    let useSynthAudio = localStorage.getItem('useSynthAudio') === 'true' || false;

    // 初始化音频上下文
    function initAudioContext() {
        if (audioContext === null) {
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                audioContext = new AudioContext();
                debugLog('音频上下文初始化成功');
                return true;
            } catch(e) {
                debugError("Web Audio API 不受支持。请使用现代浏览器。", e);
                alert("您的浏览器不支持Web Audio API，音乐功能可能无法正常工作。请使用Chrome或Firefox等现代浏览器。");
                return false;
            }
        }
        return true;
    }

    // 获取基础路径，处理不同环境下的路径问题
    function getBasePath() {
        // 尝试确定当前脚本的路径
        const scripts = document.getElementsByTagName('script');
        let scriptPath = '';
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src && src.includes('music.js')) {
                // 找到当前脚本
                scriptPath = src;
                break;
            }
        }
        
        // 如果找到脚本路径
        if (scriptPath) {
            // 提取目录部分
            const scriptDir = scriptPath.substring(0, scriptPath.lastIndexOf('/') + 1);
            debugLog('检测到脚本路径:', scriptDir);
            return scriptDir;
        }
        
        // 如果无法确定脚本路径，则根据当前页面URL推断
        const pageUrl = window.location.href;
        const isMusic = pageUrl.includes('/music/');
        
        if (isMusic) {
            // 当前在音乐模块内
            return window.location.href.substring(0, pageUrl.lastIndexOf('/') + 1);
        }
        
        // 默认回退到相对路径
        debugLog('无法确定基础路径，使用相对路径');
        return '';
    }
    
    // 计算音频文件的路径
    function getAudioPath(note) {
        const fileNote = NOTE_MAPPING[note] || note;
        const basePath = getBasePath();
        
        // 优先尝试使用相对于脚本的路径
        if (basePath) {
            return `${basePath}piano/${fileNote}.mp3`;
        }
        
        // 备选方案1: 相对于当前页面的路径
        if (window.location.href.includes('/music/')) {
            return `piano/${fileNote}.mp3`;
        }
        
        // 备选方案2: 从根路径加载
        return `/music/piano/${fileNote}.mp3`;
    }

    // 检查URL是否可访问
    function checkUrl(url) {
        return fetch(url, { method: 'HEAD' })
            .then(response => response.ok)
            .catch(() => false);
    }

    // 加载音频文件
    function loadPianoSound(note) {
        if (!initAudioContext()) return Promise.reject("AudioContext初始化失败");
        
        // 如果用户选择使用合成音频或者检测到file://协议，直接使用合成音频
        if (useSynthAudio || (isFileProtocol() && !localStorage.getItem('ignoreSynthWarning'))) {
            debugLog(`使用合成音频: ${note}`);
            const synthBuffer = createSynthSound(note);
            if (synthBuffer) {
                return Promise.resolve(synthBuffer);
            }
            return Promise.reject("无法创建合成音频");
        }
        
        return new Promise((resolve, reject) => {
            try {
                const fileNote = NOTE_MAPPING[note] || note;
                
                // 尝试多个可能的路径
                const possiblePaths = [
                    getAudioPath(note),         // 动态路径
                    `piano/${fileNote}.mp3`,    // 相对路径
                    `/music/piano/${fileNote}.mp3`, // 绝对路径
                    `/piano/${fileNote}.mp3`,   // 备选绝对路径
                    `../music/piano/${fileNote}.mp3` // 向上一级目录
                ];
                
                debugLog(`将尝试以下路径加载音频 ${note}:`, possiblePaths);
                
                // 显示加载状态
                showAudioStatus(`正在加载音符: ${note}`, 'loading');
                
                // 尝试所有可能的路径
                tryLoadFromMultiplePaths(possiblePaths)
                    .then(result => {
                        showAudioStatus(`音符 ${note} 加载成功`, 'success');
                        resolve(result.buffer);
                    })
                    .catch(error => {
                        showAudioStatus(`音符 ${note} 加载失败，使用合成音频`, 'error');
                        debugError(`所有路径尝试失败: ${note}`, error);
                        
                        // 尝试合成音频作为最后的备选
                        const synthBuffer = createSynthSound(note);
                        if (synthBuffer) {
                            resolve(synthBuffer);
                        } else {
                            reject(error);
                        }
                    });
            } catch (err) {
                debugError(`加载过程中出现异常: ${note}`, err);
                reject(err);
            }
        });
    }
    
    // 依次尝试多个路径加载音频
    function tryLoadFromMultiplePaths(paths) {
        // 递归尝试所有路径
        function tryPath(index) {
            if (index >= paths.length) {
                return Promise.reject(new Error("所有路径尝试失败"));
            }
            
            const path = paths[index];
            debugLog(`尝试路径 ${index + 1}/${paths.length}: ${path}`);
            
            return fetch(path)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`路径 ${path} 返回状态码: ${response.status}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    debugLog(`音频文件已加载成功: ${path}, 大小: ${arrayBuffer.byteLength} 字节`);
                    return audioContext.decodeAudioData(arrayBuffer);
                })
                .then(audioBuffer => {
                    debugLog(`音频解码成功: ${path}`);
                    return {
                        buffer: audioBuffer,
                        path: path
                    };
                })
                .catch(error => {
                    debugWarn(`路径 ${path} 加载失败: ${error.message}`);
                    // 尝试下一个路径
                    return tryPath(index + 1);
                });
        }
        
        return tryPath(0);
    }
    
    // 显示音频状态指示器
    function showAudioStatus(message, type = 'info') {
        // 创建或更新状态栏
        let statusBar = document.getElementById('audio-status-bar');
        if (!statusBar) {
            statusBar = document.createElement('div');
            statusBar.id = 'audio-status-bar';
            statusBar.style.position = 'fixed';
            statusBar.style.bottom = '10px';
            statusBar.style.left = '10px';
            statusBar.style.padding = '5px 10px';
            statusBar.style.borderRadius = '5px';
            statusBar.style.fontSize = '14px';
            statusBar.style.zIndex = '1000';
            statusBar.style.opacity = '0.9';
            statusBar.style.transition = 'opacity 0.3s';
            document.body.appendChild(statusBar);
        }
        
        // 设置样式和内容
        switch(type) {
            case 'loading':
                statusBar.style.backgroundColor = '#e9f5fe';
                statusBar.style.color = '#0078d4';
                statusBar.innerHTML = `⏳ ${message}`;
                break;
            case 'success':
                statusBar.style.backgroundColor = '#e6f7e6';
                statusBar.style.color = '#107c10';
                statusBar.innerHTML = `✓ ${message}`;
                setTimeout(() => { statusBar.style.opacity = '0'; }, 2000);
                break;
            case 'error':
                statusBar.style.backgroundColor = '#fde7e9';
                statusBar.style.color = '#d13438';
                statusBar.innerHTML = `✗ ${message}`;
                break;
            default:
                statusBar.style.backgroundColor = '#f9f9f9';
                statusBar.style.color = '#333';
                statusBar.innerHTML = `ℹ ${message}`;
        }
        
        // 确保状态栏可见
        statusBar.style.opacity = '0.9';
    }

    // 创建合成音频作为备选
    function createSynthSound(note) {
        try {
            if (!NOTE_FREQUENCIES[note]) {
                debugError(`无法为音符生成合成音频: ${note} - 频率未定义`);
                return null;
            }
            
            const frequency = NOTE_FREQUENCIES[note];
            const duration = 2.0; // 2秒
            const sampleRate = audioContext.sampleRate;
            const bufferSize = duration * sampleRate;
            
            const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
            const data = buffer.getChannelData(0);
            
            // 生成简单的正弦波
            for (let i = 0; i < bufferSize; i++) {
                // 添加包络，使声音更自然
                const envelope = i < 0.1 * bufferSize 
                    ? i / (0.1 * bufferSize) // 淡入
                    : Math.max(0, 1 - (i - 0.1 * bufferSize) / (0.9 * bufferSize)); // 淡出
                    
                data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * envelope * 0.5;
            }
            
            debugLog(`已为音符创建合成音频: ${note}`);
            return buffer;
        } catch (err) {
            debugError(`创建合成音频失败: ${note}`, err);
            return null;
        }
    }

    // 预加载所有音符
    function preloadAllNotes() {
        console.log("开始预加载所有音符...");
        
        const loadPromises = NOTES_TO_PRELOAD.map(note => {
            return loadPianoSound(note)
                .then(buffer => {
                    audioBufferCache[note] = buffer;
                    console.log(`预加载音符成功: ${note}`);
                })
                .catch(err => {
                    console.warn(`预加载音符失败: ${note}`, err);
                });
        });
        
        Promise.all(loadPromises)
            .then(() => console.log("所有音符预加载完成"))
            .catch(err => console.error("预加载过程中出现错误", err));
    }

    // 播放音符
    function playNote(note) {
        if (!initAudioContext()) return;
        
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        // 停止当前正在播放的声音
        if (currentPlayingSource) {
            try {
                currentPlayingSource.stop();
            } catch (err) {
                debugWarn("停止当前播放源时出错", err);
            }
        }
        
        // 检查缓存
        if (!audioBufferCache[note]) {
            // 如果缓存中没有，则尝试加载
            debugLog(`缓存中未找到音符 ${note}, 正在加载...`);
            loadPianoSound(note)
                .then(audioBuffer => {
                    // 保存到缓存
                    audioBufferCache[note] = audioBuffer;
                    debugLog(`音符加载完成并已缓存: ${note}`);
                    
                    // 播放
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(audioContext.destination);
                    
                    try {
                        source.start();
                        currentPlayingSource = source;
                        debugLog(`正在播放音符: ${note}`);
                    } catch (err) {
                        debugError(`开始播放音符时出错: ${note}`, err);
                    }
                })
                .catch(error => {
                    debugError(`播放音符失败: ${note}`, error);
                    alert(`无法播放音符 ${note}, 请检查控制台获取详细信息。`);
                });
            return;
        }
        
        // 如果缓存中已有，直接播放
        try {
            const source = audioContext.createBufferSource();
            source.buffer = audioBufferCache[note];
            source.connect(audioContext.destination);
            source.start();
            currentPlayingSource = source;
            debugLog(`从缓存播放音符: ${note}`);
            return source;
        } catch (err) {
            debugError(`播放缓存的音符时出错: ${note}`, err);
            // 尝试重新加载
            delete audioBufferCache[note];
            debugLog(`已从缓存中移除损坏的音符: ${note}, 将重新加载`);
            playNote(note);
        }
    }

    // 播放音阶
    function playScale(scaleName) {
        if (!SCALES[scaleName]) {
            console.error(`未知音阶: ${scaleName}`);
            return;
        }
        
        // 获取用户设置
        const settings = loadUserSettings();
        const audioSettings = settings.audio || { noteDelay: 400 };
        const delay = audioSettings.noteDelay || 400;
        
        // 依次播放音阶中的每个音符
        const notes = SCALES[scaleName];
        notes.forEach((note, index) => {
            setTimeout(() => {
                playNote(note);
            }, index * delay);
        });
    }

    // 播放旋律
    function playMelody(melody) {
        if (!Array.isArray(melody) || melody.length === 0) {
            console.error("无效的旋律序列");
            return;
        }
        
        // 获取用户设置
        const settings = loadUserSettings();
        const audioSettings = settings.audio || { noteDelay: 400 };
        const delay = audioSettings.noteDelay || 400;
        
        // 依次播放旋律中的每个音符
        melody.forEach((note, index) => {
            setTimeout(() => {
                playNote(note);
            }, index * delay);
        });
    }
    
    // 停止所有声音
    function stopAllSounds() {
        if (currentPlayingSource) {
            currentPlayingSource.stop();
            currentPlayingSource = null;
        }
    }

    // 生成随机旋律
    function generateRandomMelody(rangeIndex, length) {
        const availableNotes = RANGE_OPTIONS[rangeIndex].notes;
        const melody = [];
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * availableNotes.length);
            melody.push(availableNotes[randomIndex]);
        }
        
        return melody;
    }

    // 加载用户设置
    function loadUserSettings() {
        // 首先检查是否有全局设置管理器
        if (window.settingsManager) {
            try {
                const settings = window.settingsManager.loadUserSettings();
                if (settings) {
                    // 需要将music.* 映射到 game.* 以兼容当前代码
                    return {
                        audio: settings.audio || { 
                            volume: 0.8, 
                            noteDelay: 400, 
                            answerDelay: 1000, 
                            autoPlayNext: true 
                        },
                        game: { 
                            startingDifficulty: settings.music.startingDifficulty || 0, 
                            melodyLength: settings.music.melodyLength || 3, 
                            pointsPerCorrect: settings.music.pointsPerCorrect || 10, 
                            showHints: settings.music.showHints || true 
                        },
                        ui: settings.ui || { 
                            theme: 'dark',
                            fontSize: 16,
                            animations: true,
                            highContrast: false 
                        }
                    };
                }
            } catch (e) {
                console.error('Error loading settings from settingsManager:', e);
            }
        }
        
        // 如果没有settingsManager或加载失败，尝试从localStorage直接加载
        let settings = localStorage.getItem('userSettings');
        
        if (settings) {
            try {
                return JSON.parse(settings);
            } catch (e) {
                console.error('Error loading settings from localStorage:', e);
            }
        }
        
        // 默认设置
        return {
            audio: { 
                volume: 0.8, 
                noteDelay: 400, 
                answerDelay: 1000, 
                autoPlayNext: true 
            },
            game: { 
                startingDifficulty: 0, 
                melodyLength: 3, 
                pointsPerCorrect: 10, 
                showHints: true 
            },
            ui: { 
                theme: 'dark',
                fontSize: 16,
                animations: true,
                highContrast: false 
            }
        };
    }

    // 加载音乐练习内容
    function loadMusicContent(moduleId) {
        // 初始化音频环境
        initAudioContext();
        
        const container = document.getElementById(`${moduleId}-container`);
        if (!container) return;
        
        // 清空容器
        container.innerHTML = '';
        
        switch(moduleId) {
            case 'scales-training':
                container.innerHTML = createScalesTrainingUI();
                initScalesTrainingListeners();
                break;
            case 'single-note':
                container.innerHTML = createSingleNoteTrainingUI();
                initSingleNoteTrainingListeners();
                break;
            case 'multi-note':
                container.innerHTML = createMultiNoteTrainingUI();
                initMultiNoteTrainingListeners();
                break;
            case 'rhythm-training':
                container.innerHTML = `
                    <h3>节奏训练</h3>
                    <div class="music-exercise">
                        <p>通过这个练习，您可以提高您的节奏感和音乐时值理解能力。</p>
                        <div class="controls">
                            <button class="play-button">播放节奏</button>
                            <button class="practice-button">开始练习</button>
                        </div>
                        <div class="rhythm-display">
                            <div class="rhythm-notation">
                                <!-- 这里将显示节奏符号 -->
                            </div>
                        </div>
                    </div>
                `;
                initDevelopingFeatureListeners();
                break;
            default:
                container.innerHTML = '<p>请选择一个练习模式</p>';
        }
    }

    // 创建音阶练习UI
    function createScalesTrainingUI() {
        const scaleNames = Object.keys(SCALES);
        
        return `
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
    }

    // 初始化音阶练习事件监听器
    function initScalesTrainingListeners() {
        const playButtons = document.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const scaleName = e.target.getAttribute('data-scale');
                playScale(scaleName);
                
                // 高亮当前选中的音阶按钮
                const scaleButtons = document.querySelectorAll('.scale-button');
                scaleButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-scale') === scaleName) {
                        btn.classList.add('active');
                    }
                });
            });
        });
        
        const infoButtons = document.querySelectorAll('.info-button');
        infoButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const scaleName = e.target.getAttribute('data-scale');
                document.getElementById('current-scale-name').textContent = scaleName;
                showScaleNotes(scaleName);
                
                // 高亮当前选中的音阶按钮
                const scaleButtons = document.querySelectorAll('.scale-button');
                scaleButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-scale') === scaleName) {
                        btn.classList.add('active');
                    }
                });
            });
        });
        
        // 默认显示第一个音阶的信息
        const scaleNames = Object.keys(SCALES);
        if (scaleNames.length > 0) {
            document.getElementById('current-scale-name').textContent = scaleNames[0];
            showScaleNotes(scaleNames[0]);
        }
    }

    // 显示音阶音符
    function showScaleNotes(scaleName) {
        const scaleNotesContainer = document.getElementById('scale-notes');
        if (!scaleNotesContainer) return;
        
        // 清空容器
        scaleNotesContainer.innerHTML = '';
        
        // 获取音阶音符
        const scaleNotes = SCALES[scaleName];
        
        // 创建音符显示
        scaleNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'scale-note';
            noteElement.textContent = note;
            noteElement.addEventListener('click', () => {
                playNote(note);
                
                // 高亮点击的音符
                noteElement.classList.add('active');
                setTimeout(() => {
                    noteElement.classList.remove('active');
                }, 500);
            });
            
            scaleNotesContainer.appendChild(noteElement);
        });
    }

    // 创建单音辨听训练UI
    function createSingleNoteTrainingUI() {
        const settings = loadUserSettings();
        // 确保settings.game存在，如果不存在则使用默认值
        const gameSettings = settings.game || { startingDifficulty: 0 };
        const defaultDifficulty = gameSettings.startingDifficulty || 0;
        
        return `
            <h3>单音辨听训练</h3>
            <div class="compact-container">
                <div class="left-panel">
                    <div class="game-settings">
                        <div class="difficulty-selection">
                            <label>难度:</label>
                            <select id="note-difficulty">
                                <option value="0" ${defaultDifficulty === 0 ? 'selected' : ''}>基础</option>
                                <option value="1" ${defaultDifficulty === 1 ? 'selected' : ''}>进阶</option>
                                <option value="2" ${defaultDifficulty === 2 ? 'selected' : ''}>扩展</option>
                            </select>
                        </div>
                    </div>
                    <div class="note-play-section">
                        <button id="play-single-note" class="play-button">播放音符</button>
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
    }

    // 初始化单音辨听训练事件监听器
    function initSingleNoteTrainingListeners() {
        // 单音辨听状态
        let currentNote = null;
        let correctCount = 0;
        let errorCount = 0;
        
        // 初始化音符按钮
        initNoteButtons();
        
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
            const difficultyIndex = parseInt(document.getElementById('note-difficulty').value);
            const availableNotes = RANGE_OPTIONS[difficultyIndex].notes;
            
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
                            
                            // 获取用户设置
                            const settings = loadUserSettings();
                            const audioSettings = settings.audio || { autoPlayNext: true, answerDelay: 1000 };
                            
                            setTimeout(() => {
                                // 成功后自动播放下一个音符
                                noteButton.classList.remove('correct');
                                if (audioSettings.autoPlayNext) {
                                    playRandomNote();
                                }
                            }, audioSettings.answerDelay || 1000);
                        } else {
                            errorCount++;
                            noteButton.classList.add('incorrect');
                            setTimeout(() => {
                                noteButton.classList.remove('incorrect');
                            }, 1000);
                        }
                        updateStats();
                    } else {
                        // 如果没有当前音符，直接播放
                        playNote(note);
                    }
                });
                
                notesGrid.appendChild(noteButton);
            });
        }
        
        // 播放随机音符
        function playRandomNote() {
            const difficultyIndex = parseInt(document.getElementById('note-difficulty').value);
            const availableNotes = RANGE_OPTIONS[difficultyIndex].notes;
            const randomIndex = Math.floor(Math.random() * availableNotes.length);
            currentNote = availableNotes[randomIndex];
            
            // 清除所有高亮
            const noteButtons = document.querySelectorAll('.note-button');
            noteButtons.forEach(button => {
                button.classList.remove('correct');
                button.classList.remove('incorrect');
            });
            
            playNote(currentNote);
        }
        
        // 难度变化时重新生成音符按钮
        document.getElementById('note-difficulty').addEventListener('change', () => {
            initNoteButtons();
            currentNote = null;
        });
        
        // 初始化播放按钮
        document.getElementById('play-single-note').addEventListener('click', () => {
            if (currentNote) {
                playNote(currentNote);
            } else {
                playRandomNote();
            }
        });
    }

    // 创建多音辨听训练UI
    function createMultiNoteTrainingUI() {
        const settings = loadUserSettings();
        // 确保settings.game存在，如果不存在则使用默认值
        const gameSettings = settings.game || { melodyLength: 3, startingDifficulty: 0 };
        const defaultMelodyLength = gameSettings.melodyLength || 3;
        const defaultDifficulty = gameSettings.startingDifficulty || 0;
        
        return `
            <h3>多音辨听训练</h3>
            <div class="game-settings">
                <div class="difficulty-selection">
                    <label>旋律长度:</label>
                    <select id="melody-length">
                        ${MELODY_LENGTH_OPTIONS.map(length => 
                            `<option value="${length}" ${length === defaultMelodyLength ? 'selected' : ''}>${length}个音符</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="difficulty-selection">
                    <label>音域难度:</label>
                    <select id="melody-range">
                        <option value="0" ${defaultDifficulty === 0 ? 'selected' : ''}>基础</option>
                        <option value="1" ${defaultDifficulty === 1 ? 'selected' : ''}>进阶</option>
                        <option value="2" ${defaultDifficulty === 2 ? 'selected' : ''}>扩展</option>
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
    }

    // 初始化多音辨听训练事件监听器
    function initMultiNoteTrainingListeners() {
        // 旋律状态
        let currentMelody = [];
        let userSelection = [];
        let melodyScore = 0;
        let highScore = localStorage.getItem('melodyHighScore') || 0;
        
        // 显示最高分
        document.getElementById('high-score').textContent = highScore;
        
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
        
        // 生成新旋律
        function generateNewMelody() {
            const melodyLength = parseInt(melodyLengthSelect.value);
            const melodyRange = parseInt(melodyRangeSelect.value);
            
            currentMelody = generateRandomMelody(melodyRange, melodyLength);
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
                playMelody(currentMelody);
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
            const availableNotes = RANGE_OPTIONS[melodyRange].notes;
            
            // 创建音符按钮
            availableNotes.forEach(note => {
                const noteButton = document.createElement('div');
                noteButton.className = 'note-button';
                noteButton.textContent = note;
                noteButton.addEventListener('click', () => {
                    // 播放音符
                    playNote(note);
                    
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
            
            // 获取设置
            const settings = loadUserSettings();
            const audioSettings = settings.audio || { answerDelay: 1000 };
            const gameSettings = settings.game || { pointsPerCorrect: 10 };
            
            // 计算分数
            const pointsPerCorrect = gameSettings.pointsPerCorrect || 10;
            const newScore = correctCount * pointsPerCorrect;
            melodyScore += newScore;
            
            // 更新最高分
            if (melodyScore > highScore) {
                highScore = melodyScore;
                localStorage.setItem('melodyHighScore', highScore);
                document.getElementById('high-score').textContent = highScore;
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
                }, audioSettings.answerDelay || 1000);
            } else {
                alert(`回答正确: ${correctCount}/${currentMelody.length}. 得分: ${newScore}`);
                // 答错，分数归零
                if (correctCount < currentMelody.length) {
                    melodyScore = 0;
                    scoreDisplay.textContent = melodyScore;
                }
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
    
    // 为尚在开发的功能添加事件监听器
    function initDevelopingFeatureListeners() {
        const buttons = document.querySelectorAll('.music-exercise button');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                alert('此功能正在开发中，敬请期待！');
            });
        });
    }

    // 尝试预加载基本音符
    function preloadBasicNotes() {
        if (!initAudioContext()) return;
        
        debugLog('开始预加载基本音符');
        // 基本的C大调音阶
        const basicNotes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
        
        // 创建加载进度追踪
        let loaded = 0;
        let total = basicNotes.length;
        
        // 显示加载进度
        function updateLoadingStatus() {
            debugLog(`音符加载进度: ${loaded}/${total}`);
        }
        
        // 为每个音符创建加载Promise
        const loadPromises = basicNotes.map(note => {
            return loadPianoSound(note)
                .then(buffer => {
                    audioBufferCache[note] = buffer;
                    loaded++;
                    debugLog(`预加载音符成功: ${note}`);
                    updateLoadingStatus();
                    return {note, success: true};
                })
                .catch(err => {
                    debugWarn(`预加载音符失败: ${note}`, err);
                    loaded++;
                    updateLoadingStatus();
                    return {note, success: false, error: err};
                });
        });
        
        // 返回所有加载Promise的组合
        return Promise.allSettled(loadPromises)
            .then(results => {
                // 统计成功和失败的数量
                const success = results.filter(r => r.value && r.value.success).length;
                const failed = total - success;
                
                if (failed > 0) {
                    debugWarn(`音符预加载完成: ${success}成功, ${failed}失败`);
                } else {
                    debugLog(`所有音符(${total}个)预加载成功!`);
                }
                
                return {
                    total,
                    success,
                    failed
                };
            });
    }

    // 初始化音乐应用
    document.addEventListener('DOMContentLoaded', function() {
        debugLog('音乐模块初始化开始');
        
        // 检查是否通过file://协议访问
        if (isFileProtocol() && !useSynthAudio) {
            showProtocolWarning();
        }
        
        // 初始化音频上下文
        if (initAudioContext()) {
            // 预加载基本音符
            preloadBasicNotes()
                .then(result => {
                    debugLog(`基本音符预加载完成: ${result.success}/${result.total} 成功`);
                })
                .catch(err => {
                    debugError('预加载音符失败', err);
                });
        }
        
        // 初始化音频设置
        const useSynthAudioCheckbox = document.getElementById('use-synth-audio');
        if (useSynthAudioCheckbox) {
            // 设置初始状态
            useSynthAudioCheckbox.checked = useSynthAudio;
            
            // 添加切换事件
            useSynthAudioCheckbox.addEventListener('change', function() {
                localStorage.setItem('useSynthAudio', this.checked);
                debugLog(`音频类型已切换为${this.checked ? '合成音频' : '真实钢琴音频'}`);
                
                // 清空缓存，强制重新加载
                Object.keys(audioBufferCache).forEach(key => {
                    delete audioBufferCache[key];
                });
                
                // 预加载音符
                preloadBasicNotes();
            });
        }
        
        // 重置音频选择按钮
        const resetAudioChoiceBtn = document.getElementById('reset-audio-choice');
        if (resetAudioChoiceBtn) {
            resetAudioChoiceBtn.addEventListener('click', function() {
                localStorage.removeItem('useSynthAudio');
                localStorage.removeItem('ignoreSynthWarning');
                debugLog('音频选择已重置');
                location.reload();
            });
        }
        
        // 为音乐练习选项卡添加事件监听器
        const musicCards = document.querySelectorAll('.music-card');
        const musicContainers = document.querySelectorAll('.music-container');
        
        musicCards.forEach(card => {
            card.addEventListener('click', function() {
                const id = this.getAttribute('id');
                
                // 移除所有卡片的活跃状态
                musicCards.forEach(c => c.classList.remove('active'));
                
                // 隐藏所有音乐容器
                musicContainers.forEach(container => container.style.display = 'none');
                
                // 添加活跃状态到当前卡片
                this.classList.add('active');
                
                // 显示对应的音乐容器
                if (id) {
                    const targetContainer = document.getElementById(`${id}-container`);
                    if (targetContainer) {
                        targetContainer.style.display = 'block';
                        // 加载相应的音乐练习内容
                        debugLog(`加载音乐练习内容: ${id}`);
                        loadMusicContent(id);
                    }
                }
            });
        });
        
        debugLog('音乐模块初始化完成');
    });

    // 返回公共API
    return {
        // 暴露的变量
        scales: SCALES,
        rangeOptions: RANGE_OPTIONS,
        
        // 暴露的方法
        playNote: playNote,
        playScale: playScale,
        playMelody: playMelody,
        stopAllSounds: stopAllSounds,
        generateRandomMelody: generateRandomMelody,
        loadMusicContent: loadMusicContent,
        // 调试函数
        preloadBasicNotes: preloadBasicNotes,
        debug: {
            getAudioContext: () => audioContext,
            getAudioCache: () => audioBufferCache,
            testAudioPath: (path) => {
                debugLog(`测试音频路径: ${path}`);
                return fetch(path)
                    .then(res => {
                        debugLog(`路径测试结果: ${path} - ${res.ok ? '成功' : '失败'} - 状态码: ${res.status}`);
                        return res.ok;
                    })
                    .catch(err => {
                        debugError(`路径测试错误: ${path}`, err);
                        return false;
                    });
            }
        }
    };
})(); 