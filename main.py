import pygame
import random
import numpy as np
from pygame import mixer
import os
import wave
import sys
import json
import logging
import traceback
try:
    from pydub import AudioSegment
except ImportError:
    print("pydub 模块未安装，请安装：pip install pydub")

# 主题设置相关函数
def load_theme_setting():
    """加载主题设置"""
    try:
        config_path = os.path.join('sounds', 'settings.json')
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                settings = json.load(f)
                return settings.get('is_dark_mode', True)
        return True  # 默认为夜间模式
    except Exception as e:
        print(f"加载主题设置失败: {e}")
        return True

def save_theme_setting(is_dark_mode):
    """保存主题设置"""
    try:
        config_path = os.path.join('sounds', 'settings.json')
        settings = {'is_dark_mode': is_dark_mode}
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(settings, f)
    except Exception as e:
        print(f"保存主题设置失败: {e}")

# 初始化Pygame
pygame.init()
mixer.init()

# 设置窗口
WINDOW_WIDTH = 1000
WINDOW_HEIGHT = 700
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("音阶练习")

# 颜色定义
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (100, 100, 100)
LIGHT_GRAY = (200, 200, 200)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
GOLD = (255, 215, 0)  # 金色

# 夜间模式颜色
DARK_MODE = {
    "BACKGROUND_COLOR": (30, 30, 30),
    "TITLE_COLOR": (220, 220, 220),  # 更浅的颜色，增加对比度
    "BUTTON_COLOR": (70, 130, 180),
    "BUTTON_HOVER_COLOR": (100, 160, 210),
    "NOTE_BUTTON_COLOR": (70, 90, 110),
    "NOTE_BUTTON_HOVER_COLOR": (90, 120, 150),
    "SUCCESS_COLOR": (50, 205, 50),
    "ERROR_COLOR": (220, 20, 60),
    "SHADOW_COLOR": (0, 0, 0, 100),
    "PANEL_COLOR": (50, 50, 55),  # 更深的面板颜色
    "TEXT_COLOR": (220, 220, 220),  # 文字颜色
    "SECONDARY_TEXT_COLOR": (180, 180, 190),  # 次要文字颜色
}

# 白天模式颜色
LIGHT_MODE = {
    "BACKGROUND_COLOR": (240, 240, 245),
    "TITLE_COLOR": (45, 45, 48),
    "BUTTON_COLOR": (70, 130, 180),
    "BUTTON_HOVER_COLOR": (100, 160, 210),
    "NOTE_BUTTON_COLOR": (65, 105, 225),
    "NOTE_BUTTON_HOVER_COLOR": (85, 125, 245),
    "SUCCESS_COLOR": (50, 205, 50),
    "ERROR_COLOR": (220, 20, 60),
    "SHADOW_COLOR": (0, 0, 0, 30),
    "PANEL_COLOR": (230, 230, 235),
    "TEXT_COLOR": (45, 45, 48),  # 文字颜色
    "SECONDARY_TEXT_COLOR": (90, 90, 100),  # 次要文字颜色
}

# 默认使用夜间模式
is_dark_mode = load_theme_setting()
current_theme = DARK_MODE if is_dark_mode else LIGHT_MODE

# 从当前主题获取颜色
BACKGROUND_COLOR = current_theme["BACKGROUND_COLOR"]
TITLE_COLOR = current_theme["TITLE_COLOR"]
BUTTON_COLOR = current_theme["BUTTON_COLOR"]
BUTTON_HOVER_COLOR = current_theme["BUTTON_HOVER_COLOR"]
NOTE_BUTTON_COLOR = current_theme["NOTE_BUTTON_COLOR"]
NOTE_BUTTON_HOVER_COLOR = current_theme["NOTE_BUTTON_HOVER_COLOR"]
SUCCESS_COLOR = current_theme["SUCCESS_COLOR"]
ERROR_COLOR = current_theme["ERROR_COLOR"]
SHADOW_COLOR = current_theme["SHADOW_COLOR"]
PANEL_COLOR = current_theme["PANEL_COLOR"]
TEXT_COLOR = current_theme["TEXT_COLOR"]
SECONDARY_TEXT_COLOR = current_theme["SECONDARY_TEXT_COLOR"]

# 布局常量
TOP_PADDING = 140  # 顶部标题下方空间，增大以避免文字重叠
SIDE_PADDING = 40  # 左右侧边距
CONTROL_PANEL_HEIGHT = 100  # 控制面板高度
BUTTON_SPACING = 20  # 按钮之间的间距
NOTE_BUTTON_SIZE = 90  # 音符按钮的大小

# 多音辨听的默认设置
MELODY_LENGTH_OPTIONS = [3, 4, 5, 7, 9]  # 旋律长度选项
DEFAULT_MELODY_LENGTH = 3  # 默认旋律长度

# 音域范围选项
RANGE_OPTIONS = [
    {"name": "基础", "notes": ["C4", "D4", "E4", "F4", "G4", "A4", "B4"]},
    {"name": "进阶", "notes": ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4"]},
    {"name": "扩展", "notes": ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5"]}
]
DEFAULT_RANGE = 0  # 默认音域范围索引

def get_system_font():
    """获取系统中文字体"""
    if sys.platform.startswith('win'):
        return "Microsoft YaHei"
    elif sys.platform.startswith('darwin'):
        return "PingFang SC"
    else:
        return "WenQuanYi Micro Hei"

def create_font(size):
    """创建指定大小的字体"""
    try:
        return pygame.font.SysFont(get_system_font(), size)
    except:
        return pygame.font.Font(None, size)

def setup_logging():
    """设置日志记录"""
    try:
        log_dir = os.path.join(os.path.expanduser("~"), "音阶练习")
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        log_file = os.path.join(log_dir, "app.log")
        logging.basicConfig(
            filename=log_file,
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
    except Exception as e:
        logging.basicConfig(level=logging.INFO)

# 设置日志
setup_logging()

def load_user_notes():
    """加载用户的音符配置"""
    try:
        config_path = os.path.join('sounds', 'user_notes.json')
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    except Exception as e:
        logging.error(f"加载用户音符配置失败: {e}")
        return {}

def save_user_notes(notes):
    """保存用户的音符配置"""
    try:
        config_path = os.path.join('sounds', 'user_notes.json')
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(notes, f, ensure_ascii=False, indent=4)
    except Exception as e:
        logging.error(f"保存用户音符配置失败: {e}")

def convert_m4a_to_wav(m4a_path, wav_path):
    """将m4a文件转换为wav格式"""
    try:
        audio = AudioSegment.from_file(m4a_path, format="m4a")
        audio.export(wav_path, format="wav")
        return True
    except Exception as e:
        logging.error(f"转换音频文件失败: {e}")
        return False

def add_new_note(note_name, frequency):
    """添加新的音符"""
    try:
        sounds_dir = 'sounds'
        if not os.path.exists(sounds_dir):
            os.makedirs(sounds_dir)
            
        # 检查是否已存在同名音符（区分大小写）
        if note_name in NOTE_FREQUENCIES:
            logging.warning(f"音符 {note_name} 已存在")
            return False
            
        m4a_path = os.path.join(sounds_dir, f'{note_name}.m4a')
        wav_path = os.path.join(sounds_dir, f'{note_name}.wav')
        
        # 如果存在m4a文件，转换为wav
        if os.path.exists(m4a_path):
            if not convert_m4a_to_wav(m4a_path, wav_path):
                return False
        else:
            # 如果没有m4a文件，生成wav文件
            wave_data = generate_guitar_sound(frequency)
            save_wav_file(wave_data, wav_path)
        
        # 更新用户音符配置
        user_notes = load_user_notes()
        user_notes[note_name] = frequency
        save_user_notes(user_notes)
        
        # 更新全局音符频率表
        NOTE_FREQUENCIES[note_name] = frequency
        
        logging.info(f"成功添加新音符: {note_name}")
        return True
    except Exception as e:
        logging.error(f"添加新音符失败: {e}")
        return False

def create_add_note_interface(screen):
    """创建添加音符的界面"""
    panel_width = 700
    panel_height = 350
    panel_x = WINDOW_WIDTH//2 - panel_width//2
    panel_y = 180
    
    # 创建标题
    title_font = create_font(36)
    title_text = title_font.render("添加新音符", True, TITLE_COLOR)
    title_rect = title_text.get_rect(center=(WINDOW_WIDTH//2, panel_y + 40))
    screen.blit(title_text, title_rect)
    
    # 创建说明文本
    info_font = create_font(18)
    info_text = info_font.render("请输入音符名称(如C4、F#4)和对应的频率(Hz)", True, TITLE_COLOR)
    info_rect = info_text.get_rect(center=(WINDOW_WIDTH//2, panel_y + 80))
    screen.blit(info_text, info_rect)
    
    # 创建输入框
    input_width = 300
    input_height = 60
    input_x = WINDOW_WIDTH//2 - input_width//2
    
    # 音符输入框
    note_label_font = create_font(24)
    note_label = note_label_font.render("音符名称:", True, TITLE_COLOR)
    note_label_rect = note_label.get_rect(right=input_x - 20, centery=panel_y + 150)
    screen.blit(note_label, note_label_rect)
    
    note_input_rect = pygame.Rect(input_x, panel_y + 120, input_width, input_height)
    pygame.draw.rect(screen, WHITE, note_input_rect, border_radius=10)
    pygame.draw.rect(screen, GRAY, note_input_rect, 2, border_radius=10)
    
    # 频率输入框
    freq_label = note_label_font.render("频率(Hz):", True, TITLE_COLOR)
    freq_label_rect = freq_label.get_rect(right=input_x - 20, centery=panel_y + 230)
    screen.blit(freq_label, freq_label_rect)
    
    freq_input_rect = pygame.Rect(input_x, panel_y + 200, input_width, input_height)
    pygame.draw.rect(screen, WHITE, freq_input_rect, border_radius=10)
    pygame.draw.rect(screen, GRAY, freq_input_rect, 2, border_radius=10)
    
    # 创建添加按钮
    add_button = Button(WINDOW_WIDTH//2 - 150, panel_y + 280, 300, 60, "添加音符", SUCCESS_COLOR, (80, 220, 100))
    add_button.handle_mouse(pygame.mouse.get_pos())
    add_button.draw(screen)
    
    # 添加帮助信息
    help_font = create_font(16)
    help_text = help_font.render("按回车键(Enter)可切换到下一个输入框", True, TITLE_COLOR)
    help_rect = help_text.get_rect(center=(WINDOW_WIDTH//2, panel_y + 350))
    screen.blit(help_text, help_rect)
    
    return note_input_rect, freq_input_rect, add_button

# 音符频率定义（以A4=440Hz为基准）
NOTE_FREQUENCIES = {
    "C4": 261.63,  # C4
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
}

# 音阶定义
SCALES = {
    "C大调": ["C4", "D4", "E4", "F4", "G4", "A4", "B4"],
    "G大调": ["G4", "A4", "B4", "C4", "D4", "E4", "F#4"],
    "D大调": ["D4", "E4", "F#4", "G4", "A4", "B4", "C#4"],
    "A大调": ["A4", "B4", "C#4", "D4", "E4", "F#4", "G#4"],
    "E大调": ["E4", "F#4", "G#4", "A4", "B4", "C#4", "D#4"],
    "B大调": ["B4", "C#4", "D#4", "E4", "F#4", "G#4", "A#4"],
    "F#大调": ["F#4", "G#4", "A#4", "B4", "C#4", "D#4", "F4"],
    "C#大调": ["C#4", "D#4", "F4", "F#4", "G#4", "A#4", "C5"]
}

# 吉他泛音系数（相对于基频的振幅）
GUITAR_HARMONICS = {
    1: 1.0,    # 基频
    2: 0.5,    # 第一泛音
    3: 0.3,    # 第二泛音
    4: 0.2,    # 第三泛音
    5: 0.1     # 第四泛音
}

def generate_guitar_sound(frequency, duration=0.5, sample_rate=44100):
    """生成模拟吉他音色的音频"""
    t = np.linspace(0, duration, int(sample_rate * duration))
    wave = np.zeros_like(t)
    
    # 叠加多个泛音
    for harmonic, amplitude in GUITAR_HARMONICS.items():
        wave += amplitude * np.sin(2 * np.pi * frequency * harmonic * t)
    
    # 添加淡入淡出效果
    fade_duration = int(0.1 * sample_rate)
    fade_in = np.linspace(0, 1, fade_duration)
    fade_out = np.linspace(1, 0, fade_duration)
    
    wave[:fade_duration] *= fade_in
    wave[-fade_duration:] *= fade_out
    
    # 添加轻微的失真效果
    wave = np.tanh(wave * 0.8)
    
    return wave

def save_wav_file(wave_data, filename, sample_rate=44100):
    """保存音频数据为WAV文件"""
    wave_data = (wave_data * 32767).astype(np.int16)
    
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(wave_data.tobytes())

def ensure_sounds_directory():
    """确保sounds目录存在"""
    if os.path.exists('sounds'):
        return 'sounds'
    sounds_dir = os.path.join(os.path.expanduser("~"), "音阶练习", "sounds")
    if not os.path.exists(sounds_dir):
        os.makedirs(sounds_dir)
    return sounds_dir

def generate_all_sounds():
    """生成所有需要的音频文件"""
    sounds_dir = ensure_sounds_directory()
    
    for note, frequency in NOTE_FREQUENCIES.items():
        filename = os.path.join(sounds_dir, f'{note}.wav')
        if not os.path.exists(filename):
            wave_data = generate_guitar_sound(frequency)
            save_wav_file(wave_data, filename)
            logging.info(f"已生成音符 {note} 的音频文件")

def load_sound(note):
    """加载音频文件"""
    try:
        if os.path.exists('sounds'):
            sounds_dir = 'sounds'
        else:
            sounds_dir = os.path.join(os.path.expanduser("~"), "音阶练习", "sounds")
        
        wav_path = os.path.join(sounds_dir, f"{note}.wav")
        m4a_path = os.path.join(sounds_dir, f"{note}.m4a")
        
        # 如果存在m4a文件但不存在wav文件，进行转换
        if os.path.exists(m4a_path) and not os.path.exists(wav_path):
            if convert_m4a_to_wav(m4a_path, wav_path):
                return mixer.Sound(wav_path)
            return None
        
        # 如果存在wav文件，直接加载
        if os.path.exists(wav_path):
            return mixer.Sound(wav_path)
        
        # 如果找不到完全匹配的文件，记录错误
        logging.warning(f"无法加载音符 {note} 的音频文件")
        return None
    except Exception as e:
        logging.error(f"加载音频文件时出错: {e}")
        return None

def show_error_message(message):
    """显示错误消息"""
    font = create_font(36)
    text = font.render(message, True, ERROR_COLOR)
    text_rect = text.get_rect(center=(WINDOW_WIDTH//2, WINDOW_HEIGHT//2))
    screen.blit(text, text_rect)
    pygame.display.flip()
    pygame.time.wait(5000)

class Button:
    def __init__(self, x, y, width, height, text, color, hover_color):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.color = color
        self.hover_color = hover_color
        self.current_color = color
        # 根据按钮大小动态设置字体大小
        self.font_size = min(36, max(18, int(min(width, height) * 0.4)))
        self.font = create_font(self.font_size)
        self.is_hovered = False
        self.is_active = False
        
    def draw(self, surface):
        # 绘制阴影
        shadow_rect = self.rect.copy()
        shadow_rect.x += 3
        shadow_rect.y += 3
        pygame.draw.rect(surface, SHADOW_COLOR, shadow_rect, border_radius=12)
        
        # 绘制按钮
        pygame.draw.rect(surface, self.current_color, self.rect, border_radius=12)
        
        # 绘制边框，激活状态下边框更粗
        border_width = 3 if self.is_active else 2
        border_color = SUCCESS_COLOR if self.is_active else WHITE
        pygame.draw.rect(surface, border_color, self.rect, border_width, border_radius=12)
        
        # 绘制文本 - 确保在不同背景下都清晰可见
        # 在按钮上，我们总是希望文字与背景有足够对比度
        # 深色按钮用白色文字，浅色按钮用黑色文字
        r, g, b = self.current_color[:3]
        brightness = (r * 299 + g * 587 + b * 114) / 1000
        text_color = WHITE if brightness < 128 else BLACK
            
        text_surface = self.font.render(self.text, True, text_color)
        text_rect = text_surface.get_rect(center=self.rect.center)
        surface.blit(text_surface, text_rect)
        
    def handle_mouse(self, pos):
        self.is_hovered = self.rect.collidepoint(pos)
        self.current_color = self.hover_color if self.is_hovered else self.color
        
    def is_clicked(self, pos):
        return self.rect.collidepoint(pos)
    
    def set_active(self, active):
        self.is_active = active
        if active:
            self.current_color = SUCCESS_COLOR
        else:
            self.current_color = self.color

def create_scale_buttons():
    """创建音阶按钮"""
    buttons = []
    scale_names = list(SCALES.keys())
    for i, scale_name in enumerate(scale_names):
        x = 150 + (i % 2) * 400
        y = 150 + (i // 2) * 100  # 调整起始位置
        buttons.append(Button(x, y, 300, 70, scale_name, BUTTON_COLOR, BUTTON_HOVER_COLOR))
    return buttons

def create_note_buttons(scale=None):
    """创建音符按钮"""
    buttons = []
    if scale:
        notes = SCALES[scale]
        # 计算适合窗口宽度的每行最大按钮数
        max_per_row = min(len(notes), 7)  # 最多7个按钮一行
        rows = (len(notes) + max_per_row - 1) // max_per_row
        
        # 计算按钮尺寸和间距，确保美观
        button_width = NOTE_BUTTON_SIZE
        button_height = NOTE_BUTTON_SIZE
        h_spacing = (WINDOW_WIDTH - 2 * SIDE_PADDING - max_per_row * button_width) // (max_per_row + 1)
        
        # 垂直居中排列
        total_height = rows * (button_height + BUTTON_SPACING) - BUTTON_SPACING
        start_y = WINDOW_HEIGHT - total_height - SIDE_PADDING * 2
        
        for i, note in enumerate(notes):
            row = i // max_per_row
            col = i % max_per_row
            
            # 计算水平居中的起始位置
            row_notes = min(max_per_row, len(notes) - row * max_per_row)
            row_width = row_notes * button_width + (row_notes - 1) * h_spacing
            start_x = (WINDOW_WIDTH - row_width) // 2
            
            x = start_x + col * (button_width + h_spacing)
            y = start_y + row * (button_height + BUTTON_SPACING)
            
            buttons.append(Button(x, y, button_width, button_height, note, NOTE_BUTTON_COLOR, NOTE_BUTTON_HOVER_COLOR))
    else:
        notes = list(NOTE_FREQUENCIES.keys())
        # 计算布局参数
        max_per_row = 7
        rows = (len(notes) + max_per_row - 1) // max_per_row
        
        button_width = NOTE_BUTTON_SIZE
        button_height = NOTE_BUTTON_SIZE
        h_spacing = (WINDOW_WIDTH - 2 * SIDE_PADDING - max_per_row * button_width) // (max_per_row + 1)
        
        # 垂直居中排列
        total_height = rows * (button_height + BUTTON_SPACING) - BUTTON_SPACING
        start_y = TOP_PADDING + (WINDOW_HEIGHT - TOP_PADDING - CONTROL_PANEL_HEIGHT - total_height) // 2
        
        for i, note in enumerate(notes):
            row = i // max_per_row
            col = i % max_per_row
            
            # 计算水平居中的起始位置
            row_notes = min(max_per_row, len(notes) - row * max_per_row)
            row_width = row_notes * button_width + (row_notes - 1) * h_spacing
            start_x = (WINDOW_WIDTH - row_width) // 2
            
            x = start_x + col * (button_width + h_spacing)
            y = start_y + row * (button_height + BUTTON_SPACING)
            
            buttons.append(Button(x, y, button_width, button_height, note, NOTE_BUTTON_COLOR, NOTE_BUTTON_HOVER_COLOR))
    return buttons

def draw_title(surface, text):
    """在窗口中央顶部绘制标题"""
    font = create_font(48)
    # 使用主题定义的标题颜色，确保在不同背景下都清晰可见
    title_surface = font.render(text, True, TEXT_COLOR)
    title_rect = title_surface.get_rect(center=(WINDOW_WIDTH // 2, TOP_PADDING // 2))
    surface.blit(title_surface, title_rect)

def get_theme_adjusted_color(color):
    """根据当前主题调整颜色，确保在不同背景下的可见度"""
    # 当颜色是主题中定义的颜色时，直接使用主题定义的颜色
    if color == TITLE_COLOR:
        return TEXT_COLOR
        
    # 在夜间模式下，确保浅色文字
    if is_dark_mode:
        # 如果是深色，转为浅色文字
        if isinstance(color, tuple) and len(color) >= 3:
            if color[0] < 100 and color[1] < 100 and color[2] < 100:
                return TEXT_COLOR  # 使用主题定义的文字颜色
        return color  # 保持原色
    else:
        # 白天模式下，确保深色文字
        if isinstance(color, tuple) and len(color) >= 3:
            if color[0] > 180 and color[1] > 180 and color[2] > 180:
                return TEXT_COLOR  # 使用主题定义的文字颜色
        return color  # 保持原色

def render_text(surface, text, x, y, color, font, center=False):
    """在指定位置渲染文本，可选是否居中"""
    # 使用调整后的颜色
    text_color = get_theme_adjusted_color(color)
        
    text_surface = font.render(text, True, text_color)
    if center:
        text_rect = text_surface.get_rect(center=(x, y))
    else:
        text_rect = text_surface.get_rect(topleft=(x, y))
    surface.blit(text_surface, text_rect)

def draw_control_panel(surface):
    """绘制控制面板"""
    # 绘制底部控制面板
    control_panel = pygame.Rect(0, WINDOW_HEIGHT - CONTROL_PANEL_HEIGHT, WINDOW_WIDTH, CONTROL_PANEL_HEIGHT)
    pygame.draw.rect(surface, PANEL_COLOR, control_panel)
    pygame.draw.line(surface, GRAY, (0, WINDOW_HEIGHT - CONTROL_PANEL_HEIGHT), (WINDOW_WIDTH, WINDOW_HEIGHT - CONTROL_PANEL_HEIGHT), 2)

def create_note_selection_buttons():
    """创建音符选择按钮"""
    buttons = []
    notes = list(NOTE_FREQUENCIES.keys())
    for i, note in enumerate(notes):
        x = 100 + (i % 6) * 140  # 增加水平间距
        y = 200 + (i // 6) * 140  # 增加垂直间距
        buttons.append(Button(x, y, 110, 110, note, NOTE_BUTTON_COLOR, NOTE_BUTTON_HOVER_COLOR))
    return buttons

def check_and_convert_audio_files():
    """检查并转换m4a文件为wav格式"""
    try:
        sounds_dir = 'sounds'
        if not os.path.exists(sounds_dir):
            os.makedirs(sounds_dir)
        
        # 获取sounds目录下所有的m4a文件
        m4a_files = [f for f in os.listdir(sounds_dir) if f.endswith('.m4a')]
        
        for m4a_file in m4a_files:
            note_name = os.path.splitext(m4a_file)[0]  # 获取不带扩展名的文件名
            m4a_path = os.path.join(sounds_dir, m4a_file)
            wav_path = os.path.join(sounds_dir, f"{note_name}.wav")
            
            # 如果存在m4a文件但不存在对应的wav文件，进行转换
            if not os.path.exists(wav_path):
                print(f"正在转换 {m4a_file} 为wav格式...")
                if convert_m4a_to_wav(m4a_path, wav_path):
                    print(f"转换 {m4a_file} 成功！")
                else:
                    print(f"转换 {m4a_file} 失败！")
        
        return True
    except Exception as e:
        logging.error(f"检查和转换音频文件时出错: {e}")
        return False

def load_high_score():
    """加载最高分"""
    try:
        if getattr(sys, 'frozen', False):
            config_path = os.path.join('sounds', 'high_score.json')
        else:
            config_path = os.path.join(os.path.expanduser("~"), "音阶练习", "sounds", 'high_score.json')
            
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return 0
    except Exception as e:
        logging.error(f"加载最高分失败: {e}")
        return 0

def save_high_score(score):
    """保存最高分"""
    try:
        if getattr(sys, 'frozen', False):
            config_path = os.path.join('sounds', 'high_score.json')
        else:
            config_path = os.path.join(os.path.expanduser("~"), "音阶练习", "sounds", 'high_score.json')
            
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(score, f)
    except Exception as e:
        logging.error(f"保存最高分失败: {e}")

def show_title_and_back_button(title_text, back_button, screen, font):
    """显示标题和返回按钮"""
    # 绘制标题
    font_big = create_font(36)
    title_surface = font_big.render(title_text, True, TEXT_COLOR)
    title_rect = title_surface.get_rect(center=(WINDOW_WIDTH // 2, TOP_PADDING // 2))
    screen.blit(title_surface, title_rect)
    
    # 绘制返回按钮
    back_button.handle_mouse(pygame.mouse.get_pos())
    back_button.draw(screen)

def generate_random_melody(notes, length):
    """生成随机旋律"""
    return [random.choice(notes) for _ in range(length)]

def play_melody(melody, current_sounds, delay=0.5):
    """播放旋律序列"""
    for note in melody:
        if note not in current_sounds:
            current_sounds[note] = load_sound(note)
        if current_sounds[note]:
            current_sounds[note].play()
            pygame.time.wait(int(delay * 1000))  # 转换为毫秒

def create_melody_interface(screen, melody_length, range_index):
    """创建多音辨听设置界面"""
    # 绘制设置面板背景
    settings_panel = pygame.Rect(WINDOW_WIDTH//2 - 400, 150, 800, 400)
    pygame.draw.rect(screen, PANEL_COLOR, settings_panel, border_radius=15)
    pygame.draw.rect(screen, GRAY, settings_panel, 2, border_radius=15)
    
    # 创建旋律长度选择按钮
    length_buttons = []
    length_label_y = 180
    length_buttons_y = 220
    
    # 显示说明文字
    font = create_font(32)
    length_text = font.render("选择旋律长度:", True, TITLE_COLOR)
    screen.blit(length_text, (WINDOW_WIDTH//2 - 350, length_label_y))
    
    # 显示当前选择的设置信息
    settings_font = create_font(24)
    current_length_text = settings_font.render(f"当前选择: {melody_length}个音符", True, SUCCESS_COLOR)
    screen.blit(current_length_text, (WINDOW_WIDTH//2 + 150, length_label_y))
    
    for i, length in enumerate(MELODY_LENGTH_OPTIONS):
        x = WINDOW_WIDTH//2 - 350 + i * 120
        y = length_buttons_y
        button = Button(x, y, 100, 60, f"{length}音", BUTTON_COLOR, BUTTON_HOVER_COLOR)
        if length == melody_length:
            button.set_active(True)
            # 为选中的按钮添加明显的边框
            pygame.draw.rect(screen, SUCCESS_COLOR, button.rect.inflate(10, 10), 3, border_radius=14)
        button.handle_mouse(pygame.mouse.get_pos())
        button.draw(screen)
        length_buttons.append(button)
    
    # 创建音域范围选择按钮
    range_buttons = []
    range_label_y = 320
    range_buttons_y = 360
    
    range_text = font.render("选择音域范围:", True, TITLE_COLOR)
    screen.blit(range_text, (WINDOW_WIDTH//2 - 350, range_label_y))
    
    current_range_text = settings_font.render(f"当前选择: {RANGE_OPTIONS[range_index]['name']}音域", True, SUCCESS_COLOR)
    screen.blit(current_range_text, (WINDOW_WIDTH//2 + 150, range_label_y))
    
    for i, range_opt in enumerate(RANGE_OPTIONS):
        x = WINDOW_WIDTH//2 - 280 + i * 180
        y = range_buttons_y
        button = Button(x, y, 160, 60, range_opt["name"], BUTTON_COLOR, BUTTON_HOVER_COLOR)
        if i == range_index:
            button.set_active(True)
            # 为选中的按钮添加明显的边框
            pygame.draw.rect(screen, SUCCESS_COLOR, button.rect.inflate(10, 10), 3, border_radius=14)
        button.handle_mouse(pygame.mouse.get_pos())
        button.draw(screen)
        range_buttons.append(button)
    
    # 添加难度指示器
    difficulty = melody_length * (range_index + 1)
    diff_y = 445
    diff_text = settings_font.render(f"难度系数: {difficulty}", True, TITLE_COLOR)
    diff_width = 300
    diff_height = 20
    diff_x = WINDOW_WIDTH//2 - diff_width//2
    
    # 绘制难度条背景
    pygame.draw.rect(screen, GRAY, (diff_x, diff_y, diff_width, diff_height), border_radius=10)
    
    # 计算难度百分比(最大难度为9*3=27)
    diff_percent = min(1.0, difficulty / 27)
    diff_fill_width = int(diff_width * diff_percent)
    
    # 确定难度颜色（从绿色到红色）
    diff_color = (
        int(255 * diff_percent),  # R
        int(255 * (1 - diff_percent)),  # G
        0  # B
    )
    
    # 绘制难度填充条
    if diff_fill_width > 0:
        pygame.draw.rect(screen, diff_color, 
                         (diff_x, diff_y, diff_fill_width, diff_height), 
                         border_radius=10)
    
    # 显示难度文本
    screen.blit(diff_text, (diff_x + diff_width + 20, diff_y - 2))
    
    # 创建开始练习按钮
    start_button = Button(WINDOW_WIDTH//2 - 125, 500, 250, 60, "开始练习", SUCCESS_COLOR, (100, 220, 100))
    start_button.handle_mouse(pygame.mouse.get_pos())
    start_button.draw(screen)
    
    return length_buttons, range_buttons, start_button

def create_melody_selection_interface(screen, melody_notes, available_notes, user_selection):
    """创建多音辨听用户选择界面"""
    # 绘制顶部选择区域面板
    selection_panel_height = 180 if len(melody_notes) > 8 else 140
    selection_panel = pygame.Rect(30, TOP_PADDING - 10, WINDOW_WIDTH - 60, selection_panel_height)
    pygame.draw.rect(screen, PANEL_COLOR, selection_panel, border_radius=15)
    pygame.draw.rect(screen, GRAY, selection_panel, 2, border_radius=15)
    
    # 显示已选择的音符标题
    font = create_font(32)
    selection_title_y = TOP_PADDING + 10
    selected_text = font.render("已选择:", True, TITLE_COLOR)
    screen.blit(selected_text, (50, selection_title_y))
    
    # 计算选择区域的布局参数
    button_width = 70  # 减小按钮尺寸
    button_height = 70
    button_h_spacing = 15
    button_v_spacing = 15
    max_buttons_per_row = 7  # 每行最多显示数量
    
    # 计算需要多少行来显示所有音符
    total_buttons = len(melody_notes)
    rows = (total_buttons + max_buttons_per_row - 1) // max_buttons_per_row
    
    # 计算起始位置
    selection_start_x = 150
    selection_start_y = selection_title_y
    
    # 显示用户已选择的音符按钮
    selected_buttons = []
    for i, note in enumerate(user_selection):
        if i >= total_buttons:  # 防止超出总数
            break
        
        # 计算按钮位置 - 使用行列布局
        row = i // max_buttons_per_row
        col = i % max_buttons_per_row
        
        x = selection_start_x + col * (button_width + button_h_spacing)
        y = selection_start_y + row * (button_height + button_v_spacing)
        
        # 为每个已选择的音符创建按钮
        button = Button(x, y, button_width, button_height, note, SUCCESS_COLOR, (100, 220, 100))
        button.handle_mouse(pygame.mouse.get_pos())
        button.draw(screen)
        
        # 在按钮下方添加小的删除提示
        delete_font = create_font(14)
        delete_text = delete_font.render("点击删除", True, WHITE)
        delete_rect = delete_text.get_rect(center=(x + button_width//2, y + button_height + 15))
        screen.blit(delete_text, delete_rect)
        
        selected_buttons.append(button)
    
    # 添加占位符按钮，显示还需选择几个音符
    for i in range(len(user_selection), min(len(melody_notes), total_buttons)):
        row = i // max_buttons_per_row
        col = i % max_buttons_per_row
        
        x = selection_start_x + col * (button_width + button_h_spacing)
        y = selection_start_y + row * (button_height + button_v_spacing)
        
        placeholder_rect = pygame.Rect(x, y, button_width, button_height)
        pygame.draw.rect(screen, GRAY, placeholder_rect, 2, border_radius=10)
        
        # 添加数字标签
        number_font = create_font(24)
        number_text = number_font.render(str(i+1), True, GRAY)
        number_rect = number_text.get_rect(center=placeholder_rect.center)
        screen.blit(number_text, number_rect)
    
    # 创建可用音符按钮 - 使用网格布局
    note_buttons = []
    available_start_y = TOP_PADDING + selection_panel_height + 20  # 调整起始位置
    max_per_row = 7
    button_h_spacing = 20  # 水平间距
    button_v_spacing = 20  # 垂直间距
    
    # 确定按钮尺寸和位置
    available_width = WINDOW_WIDTH - 2 * SIDE_PADDING
    button_size = NOTE_BUTTON_SIZE
    
    # 计算起始位置，实现水平居中
    rows = (len(available_notes) + max_per_row - 1) // max_per_row
    total_width = min(len(available_notes), max_per_row) * (button_size + button_h_spacing) - button_h_spacing
    start_x = (WINDOW_WIDTH - total_width) // 2
    
    for i, note in enumerate(available_notes):
        row = i // max_per_row
        col = i % max_per_row
        
        # 计算当前行按钮数，用于居中
        current_row_buttons = min(max_per_row, len(available_notes) - row * max_per_row)
        current_row_width = current_row_buttons * button_size + (current_row_buttons - 1) * button_h_spacing
        row_start_x = (WINDOW_WIDTH - current_row_width) // 2
        
        x = row_start_x + col * (button_size + button_h_spacing)
        y = available_start_y + row * (button_size + button_v_spacing)
        
        button = Button(x, y, button_size, button_size, note, NOTE_BUTTON_COLOR, NOTE_BUTTON_HOVER_COLOR)
        button.handle_mouse(pygame.mouse.get_pos())
        button.draw(screen)
        note_buttons.append(button)
    
    # 绘制底部控制面板
    draw_control_panel(screen)
    
    # 确保控制按钮适当间距排列
    control_panel_y = WINDOW_HEIGHT - CONTROL_PANEL_HEIGHT//2 - 30
    button_width = 180
    
    # 创建播放旋律按钮（左侧）
    play_button = Button(SIDE_PADDING, control_panel_y, button_width, 60, "播放旋律", BUTTON_COLOR, BUTTON_HOVER_COLOR)
    play_button.handle_mouse(pygame.mouse.get_pos())
    play_button.draw(screen)
    
    # 创建清除按钮（中间）
    clear_button = Button(WINDOW_WIDTH//2 - button_width//2, control_panel_y, button_width, 60, "清除所有", BUTTON_COLOR, BUTTON_HOVER_COLOR)
    clear_button.handle_mouse(pygame.mouse.get_pos())
    clear_button.draw(screen)
    
    # 创建提交按钮（右侧，仅当选择完整时显示）
    submit_button = None
    if len(user_selection) == len(melody_notes):
        submit_button = Button(WINDOW_WIDTH - SIDE_PADDING - button_width, control_panel_y, button_width, 60, "提交答案", SUCCESS_COLOR, (100, 255, 100))
        submit_button.handle_mouse(pygame.mouse.get_pos())
        submit_button.draw(screen)
    
    # 显示进度指示
    progress_font = create_font(20)
    progress_text = progress_font.render(f"已选择: {len(user_selection)}/{len(melody_notes)}", True, TITLE_COLOR)
    progress_rect = progress_text.get_rect(right=WINDOW_WIDTH - 50, centery=selection_title_y + 10)
    screen.blit(progress_text, progress_rect)
    
    return note_buttons, play_button, clear_button, submit_button, selected_buttons

def draw_melody_practice_ui(screen, melody_notes, available_notes, user_selection, score=0, high_score=0):
    """绘制多音练习UI界面"""
    # 绘制顶部选择区域面板
    selection_panel_height = 180 if len(melody_notes) > 8 else 140
    selection_panel = pygame.Rect(30, TOP_PADDING - 10, WINDOW_WIDTH - 60, selection_panel_height)
    pygame.draw.rect(screen, PANEL_COLOR, selection_panel, border_radius=15)
    pygame.draw.rect(screen, GRAY, selection_panel, 2, border_radius=15)
    
    # 显示已选择的音符标题
    font = create_font(32)
    selection_title_y = TOP_PADDING + 10
    selected_text = font.render("已选择:", True, TITLE_COLOR)
    screen.blit(selected_text, (50, selection_title_y))
    
    # 计算选择区域的布局参数
    button_width = 70  # 减小按钮尺寸
    button_height = 70
    button_h_spacing = 15
    button_v_spacing = 15
    max_buttons_per_row = 7  # 每行最多显示数量
    
    # 计算需要多少行来显示所有音符
    total_buttons = len(melody_notes)
    rows = (total_buttons + max_buttons_per_row - 1) // max_buttons_per_row
    
    # 计算起始位置
    selection_start_x = 150
    selection_start_y = selection_title_y
    
    # 显示用户已选择的音符按钮
    selected_buttons = []
    for i, note in enumerate(user_selection):
        if i >= total_buttons:  # 防止超出总数
            break
        
        # 计算按钮位置 - 使用行列布局
        row = i // max_buttons_per_row
        col = i % max_buttons_per_row
        
        x = selection_start_x + col * (button_width + button_h_spacing)
        y = selection_start_y + row * (button_height + button_v_spacing)
        
        # 为每个已选择的音符创建按钮
        button = Button(x, y, button_width, button_height, note, SUCCESS_COLOR, (100, 220, 100))
        button.handle_mouse(pygame.mouse.get_pos())
        button.draw(screen)
        
        # 在按钮下方添加小的删除提示
        delete_font = create_font(14)
        delete_text = delete_font.render("点击删除", True, WHITE)
        delete_rect = delete_text.get_rect(center=(x + button_width//2, y + button_height + 15))
        screen.blit(delete_text, delete_rect)
        
        selected_buttons.append(button)
    
    # 添加占位符按钮，显示还需选择几个音符
    for i in range(len(user_selection), min(len(melody_notes), total_buttons)):
        row = i // max_buttons_per_row
        col = i % max_buttons_per_row
        
        x = selection_start_x + col * (button_width + button_h_spacing)
        y = selection_start_y + row * (button_height + button_v_spacing)
        
        placeholder_rect = pygame.Rect(x, y, button_width, button_height)
        pygame.draw.rect(screen, GRAY, placeholder_rect, 2, border_radius=10)
        
        # 添加数字标签
        number_font = create_font(24)
        number_text = number_font.render(str(i+1), True, GRAY)
        number_rect = number_text.get_rect(center=placeholder_rect.center)
        screen.blit(number_text, number_rect)
    
    # 创建可用音符按钮 - 使用网格布局
    note_buttons = []
    available_start_y = TOP_PADDING + selection_panel_height + 20  # 调整起始位置
    max_per_row = 7
    button_h_spacing = 20  # 水平间距
    button_v_spacing = 20  # 垂直间距
    button_size = 70
    
    # 计算可用音符的总行数
    total_notes = len(available_notes)
    note_rows = (total_notes + max_per_row - 1) // max_per_row
    
    # 计算开始位置，使所有音符在屏幕中央
    total_width = min(total_notes, max_per_row) * (button_size + button_h_spacing) - button_h_spacing
    start_x = (WINDOW_WIDTH - total_width) // 2
    
    # 创建可用音符按钮
    for i, note in enumerate(available_notes):
        row = i // max_per_row
        col = i % max_per_row
        
        x = start_x + col * (button_size + button_h_spacing)
        y = available_start_y + row * (button_size + button_v_spacing)
        
        button = Button(x, y, button_size, button_size, note, NOTE_BUTTON_COLOR, NOTE_BUTTON_HOVER_COLOR)
        button.handle_mouse(pygame.mouse.get_pos())
        button.draw(screen)
        note_buttons.append(button)
    
    # 添加播放和提交按钮
    control_y = available_start_y + note_rows * (button_size + button_v_spacing) + 30
    control_width = 180
    button_spacing = 20
    
    # 播放旋律按钮
    play_button = Button(WINDOW_WIDTH//2 - control_width - button_spacing//2, control_y, 
                        control_width, 60, "播放旋律", BUTTON_COLOR, BUTTON_HOVER_COLOR)
    play_button.handle_mouse(pygame.mouse.get_pos())
    play_button.draw(screen)
    
    # 清除按钮
    clear_button = Button(WINDOW_WIDTH//2 + button_spacing//2, control_y, 
                        control_width, 60, "清除", BUTTON_COLOR, BUTTON_HOVER_COLOR)
    clear_button.handle_mouse(pygame.mouse.get_pos())
    clear_button.draw(screen)
    
    # 提交按钮（仅当用户选择了与旋律相同数量的音符时才显示）
    submit_button = None
    if len(user_selection) == len(melody_notes):
        submit_button = Button(WINDOW_WIDTH//2 - control_width//2, control_y + 80, 
                             control_width, 60, "提交", SUCCESS_COLOR, (100, 220, 100))
        submit_button.handle_mouse(pygame.mouse.get_pos())
        submit_button.draw(screen)
    
    # 显示分数
    score_font = create_font(32)
    score_text = score_font.render(f"分数: {score}", True, WHITE)
    high_score_text = score_font.render(f"最高分: {high_score}", True, GOLD)
    
    screen.blit(score_text, (50, WINDOW_HEIGHT - 100))
    screen.blit(high_score_text, (50, WINDOW_HEIGHT - 60))
    
    return note_buttons, play_button, clear_button, submit_button, selected_buttons

def main():
    try:
        # 加载最高分
        high_score = load_high_score()
        
        # 加载用户自定义音符
        user_notes = load_user_notes()
        NOTE_FREQUENCIES.update(user_notes)
        
        # 生成音频文件
        for note_name, freq in NOTE_FREQUENCIES.items():
            if not os.path.exists(f"sounds/{note_name}.wav"):
                wave_data = generate_guitar_sound(freq)
                save_wav_file(wave_data, f"sounds/{note_name}.wav")
        
        # 预加载所有音符的音频
        current_sounds = {}
        for note_name in NOTE_FREQUENCIES.keys():
            current_sounds[note_name] = load_sound(note_name)
        
        # 初始化游戏状态
        is_scale_mode = True  # 音阶模式
        is_selecting_notes = False  # 是否在选择音符
        selected_notes = set()  # 已选择的音符
        note_buttons = []  # 音符按钮列表
        score = 0  # 得分
        show_random_note = False  # 是否显示随机音符
        random_note = None  # 当前随机音符
        result_text = None  # 结果文本
        waiting_for_click = False  # 是否等待点击继续
        
        # 添加音符相关变量
        is_adding_note = False
        note_input_text = ""
        freq_input_text = ""
        input_active = None
        previous_mode = None
        
        # 多音辨听相关变量
        is_melody_mode = False  # 是否在多音辨听模式
        is_melody_setting = False  # 是否在设置多音辨听参数
        melody_length = DEFAULT_MELODY_LENGTH  # 旋律长度
        melody_range_index = DEFAULT_RANGE  # 音域范围索引
        melody_notes = []  # 当前旋律音符序列
        user_melody_selection = []  # 用户选择的音符序列
        melody_result = None  # 旋律辨听结果
        melody_high_score = load_high_score()  # 多音辨听最高分
        melody_waiting_for_click = False  # 等待用户点击继续下一题
        melody_first_question = True  # 是否是第一个题目
        
        # 游戏主循环
        running = True
        while running:
            screen.fill(BACKGROUND_COLOR)
            
            # 绘制标题
            if is_adding_note:
                draw_title(screen, "添加新音符")
            elif is_melody_mode:
                if is_melody_setting:
                    draw_title(screen, "多音辨听设置")
                else:
                    draw_title(screen, "多音辨听")
            elif is_scale_mode:
                draw_title(screen, "音阶练习")
            else:
                if is_selecting_notes:
                    draw_title(screen, "选择要练习的音符")
                else:
                    draw_title(screen, "单音辨听")
            
            # 绘制界面
            if is_adding_note:
                # 添加音符界面
                # 绘制背景面板
                add_note_panel = pygame.Rect(WINDOW_WIDTH//2 - 350, 180, 700, 350)
                pygame.draw.rect(screen, PANEL_COLOR, add_note_panel, border_radius=15)
                pygame.draw.rect(screen, GRAY, add_note_panel, 2, border_radius=15)
                
                # 绘制返回按钮（左上角）
                back_button = Button(20, 20, 120, 60, "返回", BUTTON_COLOR, BUTTON_HOVER_COLOR)
                back_button.handle_mouse(pygame.mouse.get_pos())
                back_button.draw(screen)
                
                # 绘制输入框和添加按钮
                note_input_rect, freq_input_rect, add_button = create_add_note_interface(screen)
                
                # 显示输入内容
                font = create_font(42)
                note_surface = font.render(note_input_text, True, TITLE_COLOR)
                freq_surface = font.render(freq_input_text, True, TITLE_COLOR)
                screen.blit(note_surface, (note_input_rect.x + 10, note_input_rect.y + 15))
                screen.blit(freq_surface, (freq_input_rect.x + 10, freq_input_rect.y + 15))
            else:
                # 主界面
                # 绘制顶部工具栏
                toolbar_rect = pygame.Rect(0, 0, WINDOW_WIDTH, TOP_PADDING - 40)
                pygame.draw.rect(screen, PANEL_COLOR, toolbar_rect)
                pygame.draw.line(screen, GRAY, (0, toolbar_rect.height), (WINDOW_WIDTH, toolbar_rect.height), 1)
                
                # 创建模式按钮组
                button_width = 120
                button_height = 50
                button_spacing = 10
                toolbar_y = TOP_PADDING - 40 - button_height - 10
                
                # 定义按钮状态
                scale_button = Button(SIDE_PADDING, toolbar_y, button_width, button_height, "音阶练习", 
                                   BUTTON_COLOR, BUTTON_HOVER_COLOR)
                single_button = Button(SIDE_PADDING + button_width + button_spacing, toolbar_y, 
                                    button_width, button_height, "单音辨听", BUTTON_COLOR, BUTTON_HOVER_COLOR)
                melody_button = Button(SIDE_PADDING + 2 * (button_width + button_spacing), toolbar_y, 
                                    button_width, button_height, "多音辨听", BUTTON_COLOR, BUTTON_HOVER_COLOR)
                
                # 添加主题切换按钮
                theme_button_text = "夜间模式" if not is_dark_mode else "白天模式"
                theme_button = Button(WINDOW_WIDTH - 980, toolbar_y+510, 120, button_height, theme_button_text, BUTTON_COLOR, BUTTON_HOVER_COLOR)
                
                # 设置活跃按钮状态
                if is_scale_mode:
                    scale_button.set_active(True)
                elif is_melody_mode:
                    melody_button.set_active(True)
                else:
                    single_button.set_active(True)
                
                # 绘制按钮
                scale_button.handle_mouse(pygame.mouse.get_pos())
                single_button.handle_mouse(pygame.mouse.get_pos())
                melody_button.handle_mouse(pygame.mouse.get_pos())
                theme_button.handle_mouse(pygame.mouse.get_pos())
                
                scale_button.draw(screen)
                single_button.draw(screen)
                melody_button.draw(screen)
                theme_button.draw(screen)
                
                # 各模式内容
                if is_melody_mode:
                    # 多音辨听模式
                    if is_melody_setting:
                        # 设置多音辨听参数
                        length_buttons, range_buttons, start_button = create_melody_interface(
                            screen, melody_length, melody_range_index)
                    else:
                        # 多音辨听练习界面
                        # 创建返回设置按钮
                        back_button = Button(SIDE_PADDING, toolbar_y, button_width, button_height, "返回设置", BUTTON_COLOR, BUTTON_HOVER_COLOR)
                        back_button.handle_mouse(pygame.mouse.get_pos())
                        back_button.draw(screen)
                        
                        # 显示当前分数和最高分
                        score_text_y = WINDOW_HEIGHT - CONTROL_PANEL_HEIGHT // 2 - 18
                        font = create_font(32)
                        score_text = font.render(f"得分: {score}", True, TITLE_COLOR)
                        high_score_text = font.render(f"最高分: {melody_high_score}", True, TITLE_COLOR)
                        
                        # 添加难度指示
                        difficulty_text = font.render(f"难度: {RANGE_OPTIONS[melody_range_index]['name']} {melody_length}音", True, TITLE_COLOR)
                        difficulty_rect = difficulty_text.get_rect(right=WINDOW_WIDTH - SIDE_PADDING, centery=score_text_y)
                        screen.blit(difficulty_text, difficulty_rect)
                        
                        # 准备多音符练习所需的参数
                        available_notes = RANGE_OPTIONS[melody_range_index]["notes"]
                        
                        # 显示多音符练习界面
                        # 显示标题和返回按钮
                        #show_title_and_back_button("多音符练习", back_button, screen, font)
                        
                        # 绘制音符选择区域和已选择的音符
                        note_buttons, play_button, clear_button, submit_button, selected_buttons = draw_melody_practice_ui(
                            screen, melody_notes, available_notes, user_melody_selection, score, melody_high_score)
                        
                        # 根据状态显示不同的界面内容
                        if melody_first_question:
                            # 创建字体
                            font_big = create_font(36)
                            
                            # 绘制半透明提示面板
                            prompt_panel = pygame.Surface((WINDOW_WIDTH - 100, 250), pygame.SRCALPHA)
                            prompt_panel.fill((0, 0, 0, 180))  # 半透明黑色
                            screen.blit(prompt_panel, (50, TOP_PADDING + 50))
                            
                            # 显示提示文字
                            instruction_text = f"即将播放{len(melody_notes)}个音符的旋律"
                            render_text(screen, instruction_text, WINDOW_WIDTH//2, TOP_PADDING + 100, 
                                       WHITE, font_big, True)
                            
                            instruction_text2 = "请听完后，从下方选择对应的音符"
                            render_text(screen, instruction_text2, WINDOW_WIDTH//2, TOP_PADDING + 140, 
                                       WHITE, font, True)
                            
                            # 显示开始第一题按钮
                            start_first_button = Button(WINDOW_WIDTH//2 - 120, TOP_PADDING + 190, 240, 50, 
                                                       "开始第一题", SUCCESS_COLOR, (100, 255, 100))
                            start_first_button.draw(screen)
                        
                        # 显示答题结果（只在非第一题状态且有结果时显示）
                        elif not melody_first_question and melody_result is not None:
                            # 创建半透明覆盖层
                            overlay = pygame.Surface((WINDOW_WIDTH, 100), pygame.SRCALPHA)
                            overlay.fill((0, 0, 0, 180))  # 半透明黑色
                            screen.blit(overlay, (0, TOP_PADDING))
                            
                            # 显示结果文本
                            result_color = SUCCESS_COLOR if melody_result == "正确" else ERROR_COLOR
                            result_text = "回答正确！" if melody_result == "正确" else "回答错误！"
                            result_font = create_font(48)
                            render_text(screen, result_text, WINDOW_WIDTH//2, TOP_PADDING + 50, 
                                      result_color, result_font, True)
                            
                            # 如果正确，显示点击继续提示
                            if melody_waiting_for_click and melody_result == "正确":
                                continue_font = create_font(24)
                                render_text(screen, "点击继续下一题", WINDOW_WIDTH//2, TOP_PADDING + 85,
                                          WHITE, continue_font, True)
                        
                
                elif is_scale_mode:
                    # 音阶模式
                    # 显示所有音阶按钮
                    scale_buttons = create_scale_buttons()
                    for button in scale_buttons:
                        button.handle_mouse(pygame.mouse.get_pos())
                        button.draw(screen)
                    
                    # 显示当前音阶的所有音符按钮
                    if note_buttons:
                        for button in note_buttons:
                            button.handle_mouse(pygame.mouse.get_pos())
                            button.draw(screen)
                else:
                    # 辨单音模式
                    if is_selecting_notes:
                        # 显示所有可选音符
                        if not note_buttons:
                            note_buttons = create_note_buttons()
                        for button in note_buttons:
                            button.handle_mouse(pygame.mouse.get_pos())
                            if button.text in selected_notes:
                                button.set_active(True)
                            else:
                                button.set_active(False)
                            button.draw(screen)
                        
                        # 绘制底部控制面板
                        draw_control_panel(screen)
                        
                        # 显示开始练习按钮和添加音符按钮
                        control_width = 180
                        button_y = WINDOW_HEIGHT - CONTROL_PANEL_HEIGHT//2 - 30
                        
                        if selected_notes:
                            # 左侧显示已选音符数量
                            selected_font = create_font(24)
                            selected_text = selected_font.render(f"已选择 {len(selected_notes)} 个音符", True, TITLE_COLOR)
                            screen.blit(selected_text, (SIDE_PADDING, button_y - 10))
                            
                            # 中间显示开始练习按钮
                            start_button = Button(WINDOW_WIDTH//2 - control_width//2, button_y, control_width, 60, 
                                               "开始练习", SUCCESS_COLOR, (100, 220, 100))
                            start_button.handle_mouse(pygame.mouse.get_pos())
                            start_button.draw(screen)
                            
                        # 右侧显示添加音符按钮
                        add_note_button = Button(WINDOW_WIDTH - SIDE_PADDING - control_width, button_y, control_width, 60, 
                                              "添加音符", BUTTON_COLOR, BUTTON_HOVER_COLOR)
                        add_note_button.handle_mouse(pygame.mouse.get_pos())
                        add_note_button.draw(screen)
                    else:
                        # 练习模式
                        # 显示重新选择按钮（左上角）
                        reselect_button = Button(20, 100, 180, 60, "重新选择", 
                                              BUTTON_COLOR, BUTTON_HOVER_COLOR)
                        reselect_button.handle_mouse(pygame.mouse.get_pos())
                        reselect_button.draw(screen)
                        
                        # 显示随机按钮（右上角）
                        random_button = Button(WINDOW_WIDTH - 200, 20, 180, 60, "随机音符", 
                                            BUTTON_COLOR, BUTTON_HOVER_COLOR)
                        random_button.handle_mouse(pygame.mouse.get_pos())
                        random_button.draw(screen)
                        
                        # 绘制底部控制面板 - 用于分数显示
                        draw_control_panel(screen)
                        
                        # 显示当前得分和最高分
                        font = create_font(36)
                        score_text = font.render(f"得分: {score}", True, TITLE_COLOR)
                        high_score_text = font.render(f"最高分: {high_score}", True, TITLE_COLOR)
                        score_x = SIDE_PADDING
                        score_y = WINDOW_HEIGHT - CONTROL_PANEL_HEIGHT//2 - 18
                        screen.blit(score_text, (score_x, score_y - 25))
                        screen.blit(high_score_text, (score_x, score_y + 15))
                        
                        # 显示练习用的音符按钮
                        if not note_buttons or len(note_buttons) != len(selected_notes):
                            # 重新创建音符按钮，均匀排列在中央区域
                            notes_list = list(selected_notes)
                            max_per_row = min(7, len(notes_list))
                            rows = (len(notes_list) + max_per_row - 1) // max_per_row
                            
                            button_size = NOTE_BUTTON_SIZE
                            spacing = BUTTON_SPACING
                            
                            # 计算垂直居中的起始位置
                            total_height = rows * (button_size + spacing) - spacing
                            center_y = TOP_PADDING + (WINDOW_HEIGHT - TOP_PADDING - CONTROL_PANEL_HEIGHT - total_height) // 2
                            
                            note_buttons = []
                            for i, note in enumerate(notes_list):
                                row = i // max_per_row
                                col = i % max_per_row
                                
                                # 计算水平居中的布局
                                row_items = min(max_per_row, len(notes_list) - row * max_per_row)
                                row_width = row_items * button_size + (row_items - 1) * spacing
                                start_x = (WINDOW_WIDTH - row_width) // 2
                                
                                x = start_x + col * (button_size + spacing)
                                y = center_y + row * (button_size + spacing)
                                
                                note_buttons.append(Button(x, y, button_size, button_size, note, 
                                                   NOTE_BUTTON_COLOR, NOTE_BUTTON_HOVER_COLOR))
                        
                        for button in note_buttons:
                            button.handle_mouse(pygame.mouse.get_pos())
                            button.draw(screen)
                        
                        # 添加中央区域的结果和提示
                        center_panel_rect = pygame.Rect(WINDOW_WIDTH//2 - 300, 150, 600, 100)
                        if result_text or show_random_note:
                            pygame.draw.rect(screen, PANEL_COLOR, center_panel_rect, border_radius=15)
                            pygame.draw.rect(screen, GRAY, center_panel_rect, 2, border_radius=15)
                        
                        # 显示结果和提示
                        if result_text:
                            result_rect = result_text.get_rect(center=(WINDOW_WIDTH//2, 200))
                            screen.blit(result_text, result_rect)
                            
                            if waiting_for_click:
                                hint_font = create_font(28)
                                hint_text = hint_font.render("点击继续下一题", True, TITLE_COLOR)
                                hint_rect = hint_text.get_rect(center=(WINDOW_WIDTH//2, 240))
                                screen.blit(hint_text, hint_rect)
                        
                        elif show_random_note:
                            hint_font = create_font(36)
                            hint_text = hint_font.render("请选择听到的音符", True, TITLE_COLOR)
                            hint_rect = hint_text.get_rect(center=(WINDOW_WIDTH//2, 200))
                            screen.blit(hint_text, hint_rect)
            
            # 事件处理
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                    break
                
                if event.type == pygame.MOUSEBUTTONDOWN:
                    pos = pygame.mouse.get_pos()
                    
                    if is_adding_note:
                        # 添加音符界面的事件处理
                        if back_button.is_clicked(pos):
                            is_adding_note = False
                            is_scale_mode = previous_mode
                            note_input_text = ""
                            freq_input_text = ""
                            input_active = None
                            if not is_scale_mode:
                                note_buttons = create_note_buttons()  # 刷新音符按钮
                            continue
                        
                        # 检查输入框点击
                        if note_input_rect.collidepoint(pos):
                            input_active = "note"
                        elif freq_input_rect.collidepoint(pos):
                            input_active = "freq"
                        else:
                            input_active = None
                        
                        # 检查添加按钮点击
                        if add_button.is_clicked(pos):
                            if note_input_text and freq_input_text:
                                try:
                                    freq = float(freq_input_text)
                                    if add_new_note(note_input_text, freq):
                                        is_adding_note = False
                                        is_scale_mode = previous_mode
                                        # 重新加载音频
                                        current_sounds[note_input_text] = load_sound(note_input_text)
                                        note_input_text = ""
                                        freq_input_text = ""
                                        input_active = None
                                        if not is_scale_mode:
                                            note_buttons = create_note_buttons()  # 刷新音符按钮
                                except ValueError:
                                    pass
                    else:
                        # 主界面的事件处理
                        # 检查模式切换按钮点击
                        if scale_button.is_clicked(pos):
                            is_scale_mode = True
                            is_melody_mode = False
                            is_selecting_notes = True
                            note_buttons = []
                            show_random_note = False
                            result_text = None
                            waiting_for_click = False
                            continue
                        
                        if melody_button.is_clicked(pos):
                            is_melody_mode = True
                            is_scale_mode = False
                            is_selecting_notes = False
                            is_melody_setting = True
                            score = 0
                            melody_result = None
                            user_melody_selection = []
                            continue
                        
                        if single_button.is_clicked(pos):
                            is_scale_mode = False
                            is_melody_mode = False
                            is_selecting_notes = True
                            note_buttons = []
                            show_random_note = False
                            result_text = None
                            waiting_for_click = False
                            continue
                        
                        # 检查主题切换按钮点击
                        if theme_button.is_clicked(pos):
                            switch_theme()  # 切换主题
                            continue
                        
                        if is_melody_mode:
                            # 多音辨听模式的事件处理
                            if is_melody_setting:
                                # 检查旋律长度按钮点击
                                for i, button in enumerate(length_buttons):
                                    if button.is_clicked(pos):
                                        melody_length = MELODY_LENGTH_OPTIONS[i]
                                        break
                                
                                # 检查音域范围按钮点击
                                for i, button in enumerate(range_buttons):
                                    if button.is_clicked(pos):
                                        melody_range_index = i
                                        break
                                
                                # 检查开始练习按钮点击
                                if start_button.is_clicked(pos):
                                    is_melody_setting = False
                                    # 生成随机旋律但不立即播放
                                    melody_notes = generate_random_melody(
                                        RANGE_OPTIONS[melody_range_index]["notes"],
                                        melody_length
                                    )
                                    user_melody_selection = []
                                    melody_result = None
                                    melody_first_question = True  # 设置为第一题状态
                                    continue
                            else:
                                # 多音辨听练习界面的事件处理
                                # 检查返回设置按钮点击
                                if back_button.is_clicked(pos):
                                    is_melody_setting = True
                                    continue
                                
                                # 检查播放旋律按钮点击
                                if play_button.is_clicked(pos):
                                    play_melody(melody_notes, current_sounds)
                                    continue
                                
                                # 检查清除按钮点击
                                if clear_button.is_clicked(pos):
                                    user_melody_selection = []
                                    melody_result = None
                                    continue
                                
                                # 检查提交按钮点击
                                if submit_button and submit_button.is_clicked(pos):
                                    # 检查答案是否正确
                                    if user_melody_selection == melody_notes:
                                        melody_result = "正确"
                                        score += 10 * len(melody_notes)  # 根据旋律长度增加分数
                                        # 更新最高分
                                        if score > melody_high_score:
                                            melody_high_score = score
                                            save_high_score(melody_high_score)
                                        # 设置等待点击状态，不立即生成新旋律
                                        melody_waiting_for_click = True
                                    else:
                                        melody_result = "错误"
                                        # 重置分数
                                        score = 0
                                    continue
                                
                                # 检查已选择音符按钮点击（删除单个音符）
                                for i, button in enumerate(selected_buttons):
                                    if button.is_clicked(pos):
                                        # 删除单个选择的音符
                                        user_melody_selection.pop(i)
                                        melody_result = None
                                        break
                                
                                # 检查第一题开始按钮点击
                                if melody_first_question:
                                    start_first_button = Button(WINDOW_WIDTH//2 - 120, TOP_PADDING + 190, 240, 50, 
                                                       "开始第一题", SUCCESS_COLOR, (100, 255, 100))
                                    if start_first_button.is_clicked(pos):
                                        melody_first_question = False  # 切换到答题状态
                                        # 更新屏幕以立即移除提示框
                                        screen.fill(BACKGROUND_COLOR)
                                        # 重新绘制界面
                                        if is_melody_mode:
                                            draw_title(screen, "多音辨听")
                                            back_button.handle_mouse(pygame.mouse.get_pos())
                                            back_button.draw(screen)
                                            note_buttons, play_button, clear_button, submit_button, selected_buttons = draw_melody_practice_ui(
                                                screen, melody_notes, available_notes, user_melody_selection, score, melody_high_score)
                                        # 立即更新显示
                                        pygame.display.flip()
                                        # 然后再播放旋律
                                        play_melody(melody_notes, current_sounds)
                                        # 确保界面继续显示
                                        continue
                                    
                                
                                # 处理等待点击继续下一题的情况
                                if melody_waiting_for_click:
                                    if len(melody_notes) == len(user_melody_selection) and melody_result == "正确":
                                        # 生成下一个随机旋律，重置用户选择
                                        melody_notes = generate_random_melody(
                                            RANGE_OPTIONS[melody_range_index]["notes"], 
                                            melody_length)
                                        user_melody_selection = []
                                        melody_result = None
                                        melody_waiting_for_click = False
                                        # 更新屏幕以立即移除提示框
                                        screen.fill(BACKGROUND_COLOR)
                                        # 重新绘制界面
                                        if is_melody_mode:
                                            draw_title(screen, "多音辨听")
                                            back_button.handle_mouse(pygame.mouse.get_pos())
                                            back_button.draw(screen)
                                            note_buttons, play_button, clear_button, submit_button, selected_buttons = draw_melody_practice_ui(
                                                screen, melody_notes, available_notes, user_melody_selection, score, melody_high_score)
                                        # 立即更新显示
                                        pygame.display.flip()
                                        play_melody(melody_notes, current_sounds)
                                    else:
                                        # 重新尝试当前旋律
                                        user_melody_selection = []
                                        melody_result = None
                                        melody_waiting_for_click = False
                                        # 更新屏幕以立即移除提示框
                                        screen.fill(BACKGROUND_COLOR)
                                        # 重新绘制界面
                                        if is_melody_mode:
                                            draw_title(screen, "多音辨听")
                                            back_button.handle_mouse(pygame.mouse.get_pos())
                                            back_button.draw(screen)
                                            note_buttons, play_button, clear_button, submit_button, selected_buttons = draw_melody_practice_ui(
                                                screen, melody_notes, available_notes, user_melody_selection, score, melody_high_score)
                                        # 立即更新显示
                                        pygame.display.flip()
                                        play_melody(melody_notes, current_sounds)
                                    continue
                                
                                # 如果不是第一题准备状态，检查音符按钮点击
                                if not melody_first_question:
                                    # 检查音符按钮点击
                                    for i, button in enumerate(note_buttons):
                                        available_notes = RANGE_OPTIONS[melody_range_index]["notes"]
                                        if button.is_clicked(pos) and len(user_melody_selection) < len(melody_notes):
                                            note = available_notes[i]
                                            user_melody_selection.append(note)
                                            # 播放所选音符
                                            if note not in current_sounds:
                                                current_sounds[note] = load_sound(note)
                                            if current_sounds[note]:
                                                current_sounds[note].play()
                                            break
                        
                        elif is_scale_mode:
                            # 音阶模式的事件处理
                            # 检查音阶按钮点击
                            for button in scale_buttons:
                                if button.is_clicked(pos):
                                    note_buttons = create_note_buttons(button.text)
                                    break
                            
                            # 检查音符按钮点击
                            for button in note_buttons:
                                if button.is_clicked(pos):
                                    if button.text not in current_sounds:
                                        current_sounds[button.text] = load_sound(button.text)
                                    if current_sounds[button.text]:
                                        current_sounds[button.text].play()
                                    break
                        
                        else:  # 单音辨听模式
                            if is_selecting_notes:
                                # 检查音符按钮点击
                                for button in note_buttons:
                                    if button.is_clicked(pos):
                                        if button.text in selected_notes:
                                            selected_notes.remove(button.text)
                                        else:
                                            selected_notes.add(button.text)
                                            if button.text not in current_sounds:
                                                current_sounds[button.text] = load_sound(button.text)
                                            if current_sounds[button.text]:
                                                current_sounds[button.text].play()
                                        break
                                
                                # 检查开始练习按钮点击
                                if selected_notes:
                                    start_button = Button(WINDOW_WIDTH//2 - control_width//2, button_y, control_width, 60, 
                                                      "开始练习", SUCCESS_COLOR, (100, 220, 100))
                                    if start_button.is_clicked(pos):
                                        is_selecting_notes = False
                                        # 使用优化后的音符按钮布局
                                        notes_list = list(selected_notes)
                                        max_per_row = min(7, len(notes_list))
                                        rows = (len(notes_list) + max_per_row - 1) // max_per_row
                                        
                                        button_size = NOTE_BUTTON_SIZE
                                        spacing = BUTTON_SPACING
                                        
                                        # 计算垂直居中的起始位置
                                        total_height = rows * (button_size + spacing) - spacing
                                        center_y = TOP_PADDING + (WINDOW_HEIGHT - TOP_PADDING - CONTROL_PANEL_HEIGHT - total_height) // 2
                                        
                                        note_buttons = []
                                        for i, note in enumerate(notes_list):
                                            row = i // max_per_row
                                            col = i % max_per_row
                                            
                                            # 计算水平居中的布局
                                            row_items = min(max_per_row, len(notes_list) - row * max_per_row)
                                            row_width = row_items * button_size + (row_items - 1) * spacing
                                            start_x = (WINDOW_WIDTH - row_width) // 2
                                            
                                            x = start_x + col * (button_size + spacing)
                                            y = center_y + row * (button_size + spacing)
                                            
                                            note_buttons.append(Button(x, y, button_size, button_size, note, 
                                                               NOTE_BUTTON_COLOR, NOTE_BUTTON_HOVER_COLOR))
                                        score = 0
                                        continue
                                
                                # 检查添加音符按钮点击
                                add_note_button = Button(WINDOW_WIDTH - SIDE_PADDING - control_width, button_y, control_width, 60, 
                                                     "添加音符", BUTTON_COLOR, BUTTON_HOVER_COLOR)
                                if add_note_button.is_clicked(pos):
                                    previous_mode = is_scale_mode
                                    is_adding_note = True
                                    continue
                            else:
                                # 练习模式的事件处理
                                # 检查重新选择按钮点击
                                reselect_button = Button(20, 100, 180, 60, "重新选择", 
                                                     BUTTON_COLOR, BUTTON_HOVER_COLOR)
                                if reselect_button.is_clicked(pos):
                                    is_selecting_notes = True
                                    selected_notes.clear()
                                    note_buttons = []
                                    show_random_note = False
                                    result_text = None
                                    waiting_for_click = False
                                    continue
                                
                                # 检查随机按钮点击
                                random_button = Button(WINDOW_WIDTH - 200, 20, 180, 60, "随机音符", 
                                                    BUTTON_COLOR, BUTTON_HOVER_COLOR)
                                if random_button.is_clicked(pos):
                                    random_note = random.choice(list(selected_notes))
                                    show_random_note = True
                                    result_text = None
                                    waiting_for_click = False
                                    if random_note not in current_sounds:
                                        current_sounds[random_note] = load_sound(random_note)
                                    if current_sounds[random_note]:
                                        current_sounds[random_note].play()
                                
                                # 检查音符按钮点击（答题）
                                note_clicked = False
                                if show_random_note:
                                    for button in note_buttons:
                                        if button.is_clicked(pos):
                                            note_clicked = True
                                            if button.text == random_note:
                                                font = create_font(48)
                                                result_text = font.render("回答正确！", True, SUCCESS_COLOR)
                                                score += 10
                                                # 更新最高分
                                                if score > high_score:
                                                    high_score = score
                                                    save_high_score(high_score)
                                                waiting_for_click = True
                                            else:
                                                font = create_font(48)
                                                result_text = font.render("回答错误，请继续尝试", True, ERROR_COLOR)
                                                score = 0
                                            break
                                
                                # 如果等待点击，且点击的是空白区域，则继续下一题
                                if waiting_for_click and not note_clicked and not reselect_button.is_clicked(pos) and not random_button.is_clicked(pos):
                                    waiting_for_click = False
                                    show_random_note = False
                                    result_text = None
                                    # 自动播放下一个随机音符
                                    random_note = random.choice(list(selected_notes))
                                    show_random_note = True
                                    if random_note not in current_sounds:
                                        current_sounds[random_note] = load_sound(random_note)
                                    if current_sounds[random_note]:
                                        current_sounds[random_note].play()
                                
                                # 如果点击空白区域且当前有随机音符，则重新播放
                                elif show_random_note and not note_clicked and not reselect_button.is_clicked(pos) and not random_button.is_clicked(pos):
                                    if random_note not in current_sounds:
                                        current_sounds[random_note] = load_sound(random_note)
                                    if current_sounds[random_note]:
                                        current_sounds[random_note].play()
               
                if event.type == pygame.KEYDOWN and is_adding_note:
                    if input_active == "note":
                        if event.key == pygame.K_BACKSPACE:
                            note_input_text = note_input_text[:-1]
                        elif event.key == pygame.K_RETURN:
                            input_active = "freq"
                        else:
                            note_input_text += event.unicode
                    elif input_active == "freq":
                        if event.key == pygame.K_BACKSPACE:
                            freq_input_text = freq_input_text[:-1]
                        elif event.key == pygame.K_RETURN:
                            if note_input_text and freq_input_text:
                                try:
                                    freq = float(freq_input_text)
                                    if add_new_note(note_input_text, freq):
                                        is_adding_note = False
                                        is_scale_mode = previous_mode
                                        # 重新加载音频
                                        current_sounds[note_input_text] = load_sound(note_input_text)
                                        note_input_text = ""
                                        freq_input_text = ""
                                        input_active = None
                                        if not is_scale_mode:
                                            note_buttons = create_note_buttons()  # 刷新音符按钮
                                except ValueError:
                                    pass
                        else:
                            # 允许输入数字和小数点
                            if event.unicode.isdigit() or event.unicode == '.':
                                freq_input_text += event.unicode
            
            pygame.display.flip()
            
        pygame.quit()
        
    except Exception as e:
        logging.error(f"程序运行出错: {str(e)}")
        pygame.quit()
        raise

def switch_theme():
    """切换深色/浅色主题"""
    global is_dark_mode, current_theme, BACKGROUND_COLOR, TITLE_COLOR, BUTTON_COLOR
    global BUTTON_HOVER_COLOR, NOTE_BUTTON_COLOR, NOTE_BUTTON_HOVER_COLOR
    global SUCCESS_COLOR, ERROR_COLOR, SHADOW_COLOR, PANEL_COLOR, TEXT_COLOR, SECONDARY_TEXT_COLOR
    
    # 切换模式
    is_dark_mode = not is_dark_mode
    current_theme = DARK_MODE if is_dark_mode else LIGHT_MODE
    
    # 更新全局颜色变量
    BACKGROUND_COLOR = current_theme["BACKGROUND_COLOR"]
    TITLE_COLOR = current_theme["TITLE_COLOR"]
    BUTTON_COLOR = current_theme["BUTTON_COLOR"]
    BUTTON_HOVER_COLOR = current_theme["BUTTON_HOVER_COLOR"]
    NOTE_BUTTON_COLOR = current_theme["NOTE_BUTTON_COLOR"]
    NOTE_BUTTON_HOVER_COLOR = current_theme["NOTE_BUTTON_HOVER_COLOR"]
    SUCCESS_COLOR = current_theme["SUCCESS_COLOR"]
    ERROR_COLOR = current_theme["ERROR_COLOR"]
    SHADOW_COLOR = current_theme["SHADOW_COLOR"]
    PANEL_COLOR = current_theme["PANEL_COLOR"]
    TEXT_COLOR = current_theme["TEXT_COLOR"]
    SECONDARY_TEXT_COLOR = current_theme["SECONDARY_TEXT_COLOR"]
    
    # 保存主题设置
    save_theme_setting(is_dark_mode)

if __name__ == "__main__":
    try:
        # 检查并转换音频文件
        print("正在检查音频文件...")
        if not check_and_convert_audio_files():
            print("音频文件检查失败，程序可能无法正常工作！")
        
        main()
    except Exception as e:
        error_message = f"程序启动失败: {str(e)}\n{traceback.format_exc()}"
        logging.error(error_message)
        if not pygame.get_init():
            pygame.init()
        show_error_message("程序启动失败，请查看日志文件了解详情")
        pygame.time.wait(5000)
        pygame.quit()
        sys.exit(1)
