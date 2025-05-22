// 音乐功能相关的核心代码
document.addEventListener('DOMContentLoaded', () => {
    // 音频资源管理
    const audioCache = {};
    let currentAudio = null;
    
    // 音符定义
    const NOTES = {
        'C4': 'C4',
        'C#4': 'C#4',
        'D4': 'D4',
        'D#4': 'D#4',
        'E4': 'E4',
        'F4': 'F4',
        'F#4': 'F#4',
        'G4': 'G4',
        'G#4': 'G#4',
        'A4': 'A4',
        'A#4': 'A#4',
        'B4': 'B4',
        'C5': 'C5'
    };
    
    // 音阶定义 - 根据main.py中的定义
    const SCALES = {
        '大调音阶': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
        'C大调': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'],
        'G大调': ['G4', 'A4', 'B4', 'C4', 'D4', 'E4', 'F#4'],
        'D大调': ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#4'],
        'A大调': ['A4', 'B4', 'C#4', 'D4', 'E4', 'F#4', 'G#4'],
        'E大调': ['E4', 'F#4', 'G#4', 'A4', 'B4', 'C#4', 'D#4'],
        'B大调': ['B4', 'C#4', 'D#4', 'E4', 'F#4', 'G#4', 'A#4'],
        '自然小调': ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'A5'],
        '五声音阶': ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
        '布鲁斯音阶': ['C4', 'E4', 'F4', 'F#4', 'G4', 'B4', 'C5']
    };
    
    // 和弦定义
    const CHORDS = {
        '大三和弦': [0, 4, 7],         // 大三和弦
        '小三和弦': [0, 3, 7],         // 小三和弦
        '属七和弦': [0, 4, 7, 10],     // 属七和弦
        '大七和弦': [0, 4, 7, 11],     // 大七和弦
        '小七和弦': [0, 3, 7, 10]      // 小七和弦
    };
    
    // 音域范围选项
    const RANGE_OPTIONS = [
        { name: "基础", notes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4"] },
        { name: "进阶", notes: ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4"] },
        { name: "扩展", notes: ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5"] }
    ];
    
    // 预加载音频文件
    function preloadAudio() {
        const notes = Object.keys(NOTES);
        notes.forEach(note => {
            loadAudio(note);
        });
    }
    
    // 加载单个音频文件
    function loadAudio(note) {
        if (audioCache[note]) return audioCache[note];
        
        // 尝试加载WAV文件，如果失败则尝试M4A文件
        const audio = new Audio();
        audio.preload = 'auto';
        
        // 先尝试加载WAV
        audio.src = `sounds/${note}.wav`;
        
        // 如果WAV加载失败，尝试加载M4A
        audio.onerror = () => {
            console.log(`无法加载WAV文件: ${note}.wav, 尝试M4A格式`);
            audio.src = `sounds/${note}.m4a`;
            
            audio.onerror = () => {
                console.error(`无法加载音频文件: ${note}`);
            };
        };
        
        audioCache[note] = audio;
        return audio;
    }
    
    // 播放单个音符
    function playNote(note, callback) {
        if (!audioCache[note]) {
            loadAudio(note);
        }
        
        const audio = audioCache[note];
        currentAudio = audio;
        
        // 设置音量（从配置中获取）
        audio.volume = window.appConfig ? window.appConfig.audio.volume : 0.8;
        
        // 移除播放结束回调逻辑，该功能已不再需要
        // 但为了向后兼容，保留callback参数
        if (callback) {
            // 设置一个短延迟，立即调用回调函数
            setTimeout(callback, 10);
        }
        
        // 从头开始播放
        audio.currentTime = 0;
        audio.play().catch(error => {
            console.error(`播放音频时出错: ${error}`);
        });
        
        return audio;
    }
    
    // 停止所有声音
    function stopAllSounds() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }
        
        // 遍历所有缓存的音频，确保全部停止
        Object.values(audioCache).forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }
    
    // 播放一个音阶
    function playScale(scaleName) {
        if (!SCALES[scaleName]) {
            console.error(`未知的音阶: ${scaleName}`);
            return;
        }
        
        stopAllSounds();
        
        const notes = SCALES[scaleName];
        // 从配置中获取延迟时间
        const delay = window.appConfig ? window.appConfig.audio.noteDelay : 600;
        playNotesSequence(notes, delay);
    }
    
    // 按顺序播放一组音符
    function playNotesSequence(notes, delay = 400) {
        // 如果有配置，则使用配置中的延迟时间
        if (window.appConfig) {
            delay = window.appConfig.audio.noteDelay;
        }
        
        let index = 0;
        
        function playNext() {
            if (index < notes.length) {
                const note = notes[index];
                index++;
                
                // 播放当前音符
                playNote(note);
                // 延迟后播放下一个，不等待当前音符播放完成
                setTimeout(playNext, delay);
            }
        }
        
        playNext();
    }
    
    // 同时播放多个音符（和弦）
    function playChord(rootNote, chordType) {
        if (!CHORDS[chordType]) {
            console.error(`未知的和弦类型: ${chordType}`);
            return;
        }
        
        stopAllSounds();
        
        // 计算和弦中的所有音符
        const allNotes = Object.keys(NOTES);
        const rootIndex = allNotes.indexOf(rootNote);
        
        if (rootIndex === -1) {
            console.error(`未找到音符: ${rootNote}`);
            return;
        }
        
        const chordNotes = [];
        CHORDS[chordType].forEach(semitones => {
            const noteIndex = (rootIndex + semitones) % allNotes.length;
            chordNotes.push(allNotes[noteIndex]);
        });
        
        // 同时播放和弦中的所有音符
        chordNotes.forEach(note => {
            const audio = loadAudio(note);
            // 设置音量
            audio.volume = window.appConfig ? window.appConfig.audio.volume : 0.8;
            audio.currentTime = 0;
            audio.play().catch(error => {
                console.error(`播放和弦音符时出错: ${error}`);
            });
        });
    }
    
    // 生成随机旋律
    function generateRandomMelody(range, length) {
        const notes = RANGE_OPTIONS[range].notes;
        const melody = [];
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * notes.length);
            melody.push(notes[randomIndex]);
        }
        
        return melody;
    }
    
    // 播放旋律
    function playMelody(melody, delay) {
        // 如果没有指定延迟时间，使用配置
        if (delay === undefined && window.appConfig) {
            delay = window.appConfig.audio.noteDelay;
        } else if (delay === undefined) {
            delay = 400; // 默认值
        }
        
        stopAllSounds();
        playNotesSequence(melody, delay);
    }
    
    // 初始化音频
    preloadAudio();
    
    // 导出函数供外部使用
    window.musicFunctions = {
        notes: NOTES,
        scales: SCALES,
        chords: CHORDS,
        rangeOptions: RANGE_OPTIONS,
        preloadAudio,
        playNote,
        stopAllSounds,
        playScale,
        playChord,
        generateRandomMelody,
        playMelody
    };
}); 