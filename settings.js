/**
 * 设置页面管理脚本
 * 处理用户配置界面交互和保存/加载设置
 */
document.addEventListener('DOMContentLoaded', () => {
    // 检查配置是否已加载
    if (!window.appConfig || !window.configManager) {
        console.error('配置管理器未加载，请先加载config.js');
        return;
    }

    const { appConfig, configManager } = window;
    
    // 初始化各种设置控件
    function initSettingsControls() {
        // 音频设置
        initRangeControl('volume-slider', appConfig.audio.volume, val => {
            configManager.updateConfig('audio', 'volume', parseFloat(val));
        });
        
        initRangeControl('note-delay-slider', appConfig.audio.noteDelay, val => {
            configManager.updateConfig('audio', 'noteDelay', parseInt(val));
        });
        
        initRangeControl('answer-delay-slider', appConfig.audio.correctAnswerDelay, val => {
            configManager.updateConfig('audio', 'correctAnswerDelay', parseInt(val));
        });
        
        initCheckbox('auto-play-next', appConfig.audio.autoPlayNextNote, val => {
            configManager.updateConfig('audio', 'autoPlayNextNote', val);
        });
        
        // 游戏设置
        initSelect('starting-difficulty', appConfig.game.startingDifficulty, val => {
            configManager.updateConfig('game', 'startingDifficulty', parseInt(val));
        });
        
        initSelect('melody-length', appConfig.game.defaultMelodyLength, val => {
            configManager.updateConfig('game', 'defaultMelodyLength', parseInt(val));
        });
        
        initRangeControl('points-per-correct', appConfig.game.pointsPerCorrect, val => {
            configManager.updateConfig('game', 'pointsPerCorrect', parseInt(val));
        });
        
        initCheckbox('show-hints', appConfig.game.showHints, val => {
            configManager.updateConfig('game', 'showHints', val);
        });
        
        // UI设置
        initSelect('theme-select', appConfig.ui.theme, val => {
            configManager.updateConfig('ui', 'theme', val);
            applyTheme(val);
        });
        
        initSelect('font-size', appConfig.ui.fontSize, val => {
            configManager.updateConfig('ui', 'fontSize', val);
            applyFontSize(val);
        });
        
        initCheckbox('compact-mode', appConfig.ui.compactMode, val => {
            configManager.updateConfig('ui', 'compactMode', val);
            applyCompactMode(val);
        });
        
        initCheckbox('animations-enabled', appConfig.ui.animationsEnabled, val => {
            configManager.updateConfig('ui', 'animationsEnabled', val);
            applyAnimations(val);
        });
        
        // 辅助功能设置
        initCheckbox('color-blind-mode', appConfig.accessibility.colorBlindMode, val => {
            configManager.updateConfig('accessibility', 'colorBlindMode', val);
            applyColorBlindMode(val);
        });
        
        initCheckbox('high-contrast', appConfig.accessibility.highContrast, val => {
            configManager.updateConfig('accessibility', 'highContrast', val);
            applyHighContrast(val);
        });
        
        initCheckbox('keyboard-shortcuts', appConfig.accessibility.keyboardShortcuts, val => {
            configManager.updateConfig('accessibility', 'keyboardShortcuts', val);
        });
        
        // 按钮设置
        const resetButton = document.getElementById('reset-settings');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (confirm('确定要重置所有设置到默认值吗？')) {
                    const newConfig = configManager.resetConfig();
                    initSettingsControls(); // 重新初始化所有控件
                    applyAllSettings(newConfig);
                    
                    // 显示成功消息
                    showMessage('设置已重置为默认值', 'success');
                }
            });
        }
        
        const saveButton = document.getElementById('save-settings');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                configManager.saveConfig();
                // 显示成功消息并刷新页面
                showMessage('设置已保存！3秒后将刷新页面应用所有设置...', 'success');
                
                // 3秒后刷新页面以确保所有设置生效
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            });
        }
    }
    
    // 显示消息提示
    function showMessage(message, type = 'info') {
        // 如果已有消息，则移除
        const existingMsg = document.querySelector('.settings-message');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        // 创建新消息元素
        const msgEl = document.createElement('div');
        msgEl.className = `settings-message ${type}`;
        msgEl.textContent = message;
        
        // 添加到页面
        const container = document.querySelector('.settings-container');
        if (container) {
            container.insertBefore(msgEl, container.firstChild);
            
            // 5秒后自动移除
            setTimeout(() => {
                msgEl.classList.add('fade-out');
                setTimeout(() => msgEl.remove(), 500);
            }, 5000);
        }
    }
    
    // ===== 辅助函数 ===== //
    
    // 初始化滑块控件
    function initRangeControl(id, value, onChange) {
        const control = document.getElementById(id);
        if (!control) return;
        
        control.value = value;
        
        // 更新显示的值（如果有）
        const valueDisplay = document.getElementById(`${id}-value`);
        if (valueDisplay) {
            valueDisplay.textContent = value;
        }
        
        control.addEventListener('input', e => {
            const newValue = e.target.value;
            if (valueDisplay) {
                valueDisplay.textContent = newValue;
            }
            onChange(newValue);
        });
    }
    
    // 初始化复选框
    function initCheckbox(id, checked, onChange) {
        const control = document.getElementById(id);
        if (!control) return;
        
        control.checked = checked;
        
        control.addEventListener('change', e => {
            onChange(e.target.checked);
        });
    }
    
    // 初始化下拉选择框
    function initSelect(id, value, onChange) {
        const control = document.getElementById(id);
        if (!control) return;
        
        control.value = value;
        
        control.addEventListener('change', e => {
            onChange(e.target.value);
        });
    }
    
    // ===== 设置应用函数 ===== //
    
    // 应用主题
    function applyTheme(theme) {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
    }
    
    // 应用字体大小
    function applyFontSize(size) {
        document.body.classList.remove('font-small', 'font-medium', 'font-large');
        document.body.classList.add(`font-${size}`);
    }
    
    // 应用紧凑模式
    function applyCompactMode(enabled) {
        document.body.classList.toggle('compact-mode', enabled);
    }
    
    // 应用动画设置
    function applyAnimations(enabled) {
        document.body.classList.toggle('no-animations', !enabled);
    }
    
    // 应用色盲模式
    function applyColorBlindMode(enabled) {
        document.body.classList.toggle('color-blind-mode', enabled);
    }
    
    // 应用高对比度
    function applyHighContrast(enabled) {
        document.body.classList.toggle('high-contrast', enabled);
    }
    
    // 应用所有设置
    function applyAllSettings(config) {
        applyTheme(config.ui.theme);
        applyFontSize(config.ui.fontSize);
        applyCompactMode(config.ui.compactMode);
        applyAnimations(config.ui.animationsEnabled);
        applyColorBlindMode(config.accessibility.colorBlindMode);
        applyHighContrast(config.accessibility.highContrast);
    }
    
    // 添加消息样式
    const messageStyle = document.createElement('style');
    messageStyle.textContent = `
        .settings-message {
            padding: 12px 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            font-weight: bold;
            animation: slide-in 0.5s ease;
        }
        
        .settings-message.success {
            background-color: #4CAF50;
            color: white;
        }
        
        .settings-message.info {
            background-color: #2196F3;
            color: white;
        }
        
        .settings-message.error {
            background-color: #F44336;
            color: white;
        }
        
        .settings-message.fade-out {
            opacity: 0;
            transition: opacity 0.5s;
        }
        
        @keyframes slide-in {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(messageStyle);
    
    // 初始化设置页面
    initSettingsControls();
    
    // 应用当前设置
    applyAllSettings(appConfig);
}); 