/**
 * 公共交互逻辑 - 舟舟与小羊专属520网站
 * 包含：音乐播放器、歌单面板、暗号模式、全局导航等
 */

// 全局变量
let isPlaying = false;
let currentSongIndex = 0;
let songs = [];
let isSecretModeActive = false;
let isEditModeActive = false;

// DOM 元素缓存
const elements = {};

/**
 * 初始化函数
 */
function init() {
    cacheElements();
    loadSongData();
    initMusicPlayer();
    initPlaylistPanel();
    initSecretMode();
    initNavigation();
    initScrollAnimations();
}

/**
 * 缓存DOM元素
 */
function cacheElements() {
    elements.musicPlayer = document.getElementById('music-player');
    elements.bgm = document.getElementById('bgm');
    elements.musicIcon = document.getElementById('music-icon');
    elements.playlistPanel = document.getElementById('playlist-panel');
    elements.playlistTrigger = document.getElementById('playlist-trigger');
    elements.playlistItems = document.getElementById('playlist-items');
    elements.playPauseBtn = document.getElementById('play-pause-btn');
    elements.prevBtn = document.getElementById('prev-btn');
    elements.nextBtn = document.getElementById('next-btn');
    elements.currentSongTitle = document.getElementById('current-song-title');
    elements.secretOverlay = document.getElementById('secret-overlay');
    elements.secretInput = document.getElementById('secret-input');
    elements.secretSubmitBtn = document.getElementById('secret-submit-btn');
    elements.editModeBtn = document.getElementById('edit-mode-btn');
}

/**
 * 加载歌曲数据
 */
function loadSongData() {
    songs = [
        { title: "多少", url: "music/陈奕迅 - 多少.flac", artist: "陈奕迅" },
        { title: "I Do", url: "music/陈奕迅 - I Do.flac", artist: "陈奕迅" },
        { title: "我会忘记", url: "music/承桓 - 我会忘记 (我会放弃).ogg", artist: "承桓" }
    ];
}

/**
 * 初始化音乐播放器
 */
function initMusicPlayer() {
    if (!elements.musicPlayer || !elements.bgm) return;

    elements.musicPlayer.addEventListener('click', toggleMusic);
    
    // 歌曲结束自动播放下一首
    elements.bgm.addEventListener('ended', () => {
        playNextSong();
    });
}

/**
 * 切换音乐播放状态
 */
function toggleMusic() {
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

/**
 * 播放音乐
 */
function playMusic() {
    if (!elements.bgm) return;
    
    elements.bgm.play().then(() => {
        isPlaying = true;
        updateMusicIcon();
        updatePlaylistUI();
    }).catch(error => {
        console.log('播放失败:', error);
    });
}

/**
 * 暂停音乐
 */
function pauseMusic() {
    if (!elements.bgm) return;
    
    elements.bgm.pause();
    isPlaying = false;
    updateMusicIcon();
    updatePlaylistUI();
}

/**
 * 更新音乐图标状态
 */
function updateMusicIcon() {
    if (!elements.musicIcon) return;
    
    if (isPlaying) {
        elements.musicIcon.classList.remove('fa-music');
        elements.musicIcon.classList.add('fa-pause');
        elements.musicIcon.classList.add('fa-spin');
        elements.musicIcon.classList.replace('text-slate-400', 'text-primary');
    } else {
        elements.musicIcon.classList.remove('fa-pause', 'fa-spin');
        elements.musicIcon.classList.add('fa-music');
        elements.musicIcon.classList.replace('text-primary', 'text-slate-400');
    }
}

/**
 * 初始化歌单面板
 */
function initPlaylistPanel() {
    if (!elements.playlistPanel) return;

    // 渲染歌单列表
    renderPlaylist();
    
    // 绑定事件
    if (elements.playlistTrigger) {
        elements.playlistTrigger.addEventListener('click', togglePlaylistPanel);
    }
    
    if (elements.playPauseBtn) {
        elements.playPauseBtn.addEventListener('click', toggleMusic);
    }
    
    if (elements.prevBtn) {
        elements.prevBtn.addEventListener('click', playPrevSong);
    }
    
    if (elements.nextBtn) {
        elements.nextBtn.addEventListener('click', playNextSong);
    }
    
    // 点击外部关闭面板
    document.addEventListener('click', (e) => {
        if (elements.playlistPanel && 
            !elements.playlistPanel.contains(e.target) && 
            elements.playlistTrigger && 
            !elements.playlistTrigger.contains(e.target)) {
            closePlaylistPanel();
        }
    });
}

/**
 * 渲染歌单列表
 */
function renderPlaylist() {
    if (!elements.playlistItems) return;
    
    elements.playlistItems.innerHTML = songs.map((song, index) => `
        <div class="playlist-item ${index === currentSongIndex ? 'active' : ''}" 
             data-index="${index}">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                ${index === currentSongIndex && isPlaying ? 
                    '<div class="music-bars"><div class="music-bar"></div><div class="music-bar"></div><div class="music-bar"></div><div class="music-bar"></div></div>' :
                    `<span class="text-sm text-primary">${index + 1}</span>`
                }
            </div>
            <div class="flex-1 min-w-0">
                <div class="song-title text-sm font-medium text-slate-700 truncate">${song.title}</div>
            </div>
        </div>
    `).join('');
    
    // 绑定点击事件
    elements.playlistItems.querySelectorAll('.playlist-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            playSong(index);
        });
    });
}

/**
 * 切换歌单面板显示
 */
function togglePlaylistPanel() {
    if (!elements.playlistPanel) return;
    
    elements.playlistPanel.classList.toggle('open');
}

/**
 * 关闭歌单面板
 */
function closePlaylistPanel() {
    if (!elements.playlistPanel) return;
    
    elements.playlistPanel.classList.remove('open');
}

/**
 * 播放指定歌曲
 */
async function playSong(index) {
    if (index < 0 || index >= songs.length) return;
    
    currentSongIndex = index;
    const song = songs[index];
    let audioUrl = song.url;
    
    // 如果是QQ音乐链接，先解析
    if (song.isQQMusic) {
        try {
            const response = await fetch(`/api/qq-music?url=${encodeURIComponent(song.url)}`);
            const data = await response.json();
            if (data.url) {
                audioUrl = data.url;
            } else {
                console.log('QQ音乐解析失败:', data.error);
                showNotification('QQ音乐解析失败', 'error');
                return;
            }
        } catch (error) {
            console.log('QQ音乐解析错误:', error);
            showNotification('QQ音乐解析错误', 'error');
            return;
        }
    }
    
    if (elements.bgm) {
        elements.bgm.src = audioUrl;
        elements.bgm.load();
        playMusic();
    }
    
    if (elements.currentSongTitle) {
        elements.currentSongTitle.textContent = song.title;
    }
    
    renderPlaylist();
}

/**
 * 播放下一首
 */
function playNextSong() {
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
}

/**
 * 播放上一首
 */
function playPrevSong() {
    const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(prevIndex);
}

/**
 * 更新歌单UI
 */
function updatePlaylistUI() {
    renderPlaylist();
    
    if (elements.playPauseBtn) {
        const icon = elements.playPauseBtn.querySelector('i');
        if (icon) {
            if (isPlaying) {
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
            } else {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        }
    }
}

/**
 * 初始化暗号模式
 */
function initSecretMode() {
    // 长按Logo 3秒触发
    const logo = document.getElementById('logo');
    if (logo) {
        let pressTimer;
        logo.addEventListener('mousedown', () => {
            pressTimer = setTimeout(showSecretOverlay, 3000);
        });
        logo.addEventListener('mouseup', () => {
            clearTimeout(pressTimer);
        });
        logo.addEventListener('mouseleave', () => {
            clearTimeout(pressTimer);
        });
        
        // 移动端支持
        logo.addEventListener('touchstart', (e) => {
            e.preventDefault();
            pressTimer = setTimeout(showSecretOverlay, 3000);
        });
        logo.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });
    }
    
    // 快速点击底部红心3次触发
    const footerHeart = document.getElementById('footer-heart');
    if (footerHeart) {
        let clickCount = 0;
        let clickTimer;
        
        footerHeart.addEventListener('click', () => {
            clickCount++;
            
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            }
            
            if (clickCount >= 3) {
                clearTimeout(clickTimer);
                clickCount = 0;
                showSecretOverlay();
            }
        });
    }
    
    // 提交暗号
    if (elements.secretSubmitBtn) {
        elements.secretSubmitBtn.addEventListener('click', checkSecretCode);
    }
    
    if (elements.secretInput) {
        elements.secretInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkSecretCode();
            }
        });
    }
    
    // 编辑模式按钮
    if (elements.editModeBtn) {
        elements.editModeBtn.addEventListener('click', toggleEditMode);
    }
}

/**
 * 显示暗号输入框
 */
function showSecretOverlay() {
    if (!elements.secretOverlay) return;
    
    elements.secretOverlay.classList.add('active');
    if (elements.secretInput) {
        elements.secretInput.focus();
    }
}

/**
 * 隐藏暗号输入框
 */
function hideSecretOverlay() {
    if (!elements.secretOverlay) return;
    
    elements.secretOverlay.classList.remove('active');
    if (elements.secretInput) {
        elements.secretInput.value = '';
    }
}

/**
 * 检查暗号
 */
function checkSecretCode() {
    if (!elements.secretInput) return;
    
    const code = elements.secretInput.value.trim();
    
    // 这里设置你们的专属暗号
    const secretCode = "5201314";
    
    if (code === secretCode) {
        hideSecretOverlay();
        activateEditMode();
        showNotification("解锁成功！创作者模式已开启");
    } else {
        showNotification("暗号不对哦～", "error");
        elements.secretInput.value = '';
        elements.secretInput.focus();
    }
}

/**
 * 激活编辑模式
 */
function activateEditMode() {
    isSecretModeActive = true;
    isEditModeActive = true;
    
    // 显示编辑按钮
    if (elements.editModeBtn) {
        elements.editModeBtn.classList.add('active');
    }
    
    // 显示所有添加按钮
    document.querySelectorAll('.add-record-btn').forEach(btn => {
        btn.classList.add('active');
    });
    
    // 存储编辑模式状态
    localStorage.setItem('editMode', 'active');
}

/**
 * 切换编辑模式
 */
function toggleEditMode() {
    isEditModeActive = !isEditModeActive;
    
    if (elements.editModeBtn) {
        const icon = elements.editModeBtn.querySelector('i');
        if (icon) {
            if (isEditModeActive) {
                icon.classList.remove('fa-unlock');
                icon.classList.add('fa-lock');
            } else {
                icon.classList.remove('fa-lock');
                icon.classList.add('fa-unlock');
            }
        }
    }
    
    // 切换添加按钮显示
    document.querySelectorAll('.add-record-btn').forEach(btn => {
        if (isEditModeActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * 初始化全局导航
 */
function initNavigation() {
    // 平滑滚动锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * 初始化滚动动画
 */
function initScrollAnimations() {
    // 使用Intersection Observer实现懒加载动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // 观察所有需要动画的元素
    document.querySelectorAll('.glass-card, .timeline-item').forEach(el => {
        observer.observe(el);
    });
}

/**
 * 显示通知
 */
function showNotification(message, type = 'success') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] px-6 py-3 rounded-full text-sm font-medium shadow-lg transition-all duration-500 translate-y-[-20px] opacity-0`;
    
    if (type === 'success') {
        notification.classList.add('bg-primary', 'text-white');
    } else {
        notification.classList.add('bg-red-500', 'text-white');
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.remove('translate-y-[-20px]', 'opacity-0');
        notification.classList.add('translate-y-0', 'opacity-100');
    }, 10);
    
    // 隐藏动画
    setTimeout(() => {
        notification.classList.remove('translate-y-0', 'opacity-100');
        notification.classList.add('translate-y-[-20px]', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

/**
 * 加载外部数据
 */
async function loadExternalData() {
    try {
        const response = await fetch('data/content.json');
        if (response.ok) {
            const data = await response.json();
            // 处理加载的数据
            if (data.songs) {
                songs = data.songs;
                renderPlaylist();
            }
            if (data.messages) {
                // 更新情话文案
            }
        }
    } catch (error) {
        console.log('加载外部数据失败，使用默认数据');
    }
}

/**
 * 保存数据到本地存储
 */
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('保存到本地存储失败:', error);
    }
}

/**
 * 从本地存储加载数据
 */
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('从本地存储加载失败:', error);
        return null;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    init();
    loadExternalData();
    
    // 检查是否已激活编辑模式
    if (localStorage.getItem('editMode') === 'active') {
        activateEditMode();
    }
});

// 导出全局函数供HTML使用
window.toggleMusic = toggleMusic;
window.playSong = playSong;
window.playNextSong = playNextSong;
window.playPrevSong = playPrevSong;
window.showSecretOverlay = showSecretOverlay;
window.hideSecretOverlay = hideSecretOverlay;
window.toggleEditMode = toggleEditMode;