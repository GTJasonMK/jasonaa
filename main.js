// 获取当前配置
// const config = window.appConfig || {
//    audio: { correctAnswerDelay: 1000, autoPlayNextNote: true },
//    game: { startingDifficulty: 0, defaultMelodyLength: 3 }
// };

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
    
    // 游戏卡片鼠标悬停效果，移除冗余的点击事件处理
    const gameCards = document.querySelectorAll('.game-card:not(.coming-soon)');
    
    gameCards.forEach(card => {
        // 移除冗余的点击事件监听器，使用HTML中的onclick属性
        
        // 添加鼠标悬停效果
        card.addEventListener('mouseenter', function() {
            this.classList.add('card-hover');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('card-hover');
        });
    });
    
    // 音乐练习选项点击事件
    const musicCards = document.querySelectorAll('.music-card');
    const musicContainers = document.querySelectorAll('.music-container');
    
    musicCards.forEach(card => {
        card.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
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
                    // 使用音乐模块的loadMusicContent函数加载相应的音乐练习内容
                    if (window.musicFunctions && window.musicFunctions.loadMusicContent) {
                        window.musicFunctions.loadMusicContent(id);
                    }
                }
            }
        });
    });
}); 



