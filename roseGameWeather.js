// =================================================================
// 2D 游戏环境天气渲染模块
// =================================================================
let starPoints = [];
let rainDrops = [];
let beamTime = 0;
let currentWeather = 'weather-default';

const weatherLayers = {
    '1': { id: 'weather-sunny', state: 'state-sunny' },
    '2': { id: 'weather-stars', state: 'state-stars' },
    '3': { id: 'weather-thunder', state: 'state-thunder' },
    '4': { id: 'weather-rain', state: 'state-rain' },
    '5': { id: 'weather-default', state: 'state-default' },
    '6': { id: 'weather-cloudy', state: 'state-cloudy' } 
};

// 星星粒子
function initStars() {
    const starField = document.getElementById('star-field');
    if (!starField) return;
    starField.width = worldWidth;
    starField.height = viewHeight;
    starPoints = [];
    for (let i = 0; i < 200; i++) {
        starPoints.push({
            x: Math.random() * worldWidth,
            y: Math.random() * (viewHeight * 0.7),
            size: Math.random() * 3 + 1,
            blinkSpeed: Math.random() * 0.12 + 0.03,
            alpha: Math.random(),
            growing: true,
            hue: Math.random() * 60 - 30
        });
    }
}

function drawStars() {
    const starField = document.getElementById('star-field');
    if (!starField || currentWeather !== 'weather-stars') return;
    const starCtx = starField.getContext('2d');
    starCtx.clearRect(0, 0, starField.width, starField.height);
    for (const s of starPoints) {
        if (s.growing) { s.alpha += s.blinkSpeed; if (s.alpha >= 1) s.growing = false; }
        else { s.alpha -= s.blinkSpeed; if (s.alpha <= 0.2) s.growing = true; }
        starCtx.shadowBlur = s.size * 6;
        starCtx.shadowColor = `rgba(255,255,255,${s.alpha * 0.6})`;
        starCtx.fillStyle = `rgba(255,255,255,${s.alpha})`;
        starCtx.beginPath();
        starCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        starCtx.fill();
    }
    starCtx.shadowBlur = 0;
}

// 晴天光束
function drawSunbeams() {
    const beamCanvas = document.getElementById('sunbeams-canvas');
    if (!beamCanvas || currentWeather !== 'weather-sunny') return;
    beamCanvas.width = worldWidth;
    beamCanvas.height = viewHeight;
    const beamCtx = beamCanvas.getContext('2d');
    beamCtx.clearRect(0, 0, beamCanvas.width, beamCanvas.height);
    const sx = 0;
    const sy = 0;
    beamTime += 0.005;
    const sway = Math.sin(beamTime) * 30;
    const beams = [
        { ex: -0.2, ey: 0.4, w: 140, a: 0.30 },
        { ex: 0.15, ey: 0.7, w: 160, a: 0.40 },
        { ex: 0.5, ey: 0.95, w: 180, a: 0.45 },
        { ex: 0.85, ey: 0.7, w: 160, a: 0.40 },
        { ex: 1.2, ey: 0.4, w: 140, a: 0.30 }
    ];
    for (const b of beams) {
        const ex = b.ex * worldWidth + sway;
        const ey = b.ey * viewHeight;
        const dx = ex - sx;
        const dy = ey - sy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;
        const hw = b.w / 2;
        beamCtx.beginPath();
        beamCtx.moveTo(sx, sy);
        beamCtx.lineTo(ex + nx * hw, ey + ny * hw);
        beamCtx.lineTo(ex - nx * hw, ey - ny * hw);
        beamCtx.closePath();
        const grad = beamCtx.createLinearGradient(sx, sy, ex, ey);
        grad.addColorStop(0, `rgba(255,255,220,${b.a})`);
        grad.addColorStop(0.3, `rgba(255,240,190,${b.a * 0.55})`);
        grad.addColorStop(0.6, `rgba(255,225,170,${b.a * 0.25})`);
        grad.addColorStop(1, 'rgba(255,210,150,0)');
        beamCtx.fillStyle = grad;
        beamCtx.fill();
    }
}

// 雨水天气
function initRain() {
    const rainCanvas = document.getElementById('rain-canvas');
    if (!rainCanvas) return;
    rainCanvas.width = worldWidth;
    rainCanvas.height = viewHeight;
    rainDrops = [];
    for (let i = 0; i < 500; i++) {
        rainDrops.push({
            x: Math.random() * worldWidth,
            y: Math.random() * viewHeight,
            length: Math.random() * 20 + 12,
            speed: Math.random() * 8 + 5,
            opacity: Math.random() * 0.4 + 0.4,
            width: Math.random() * 1.5 + 1
        });
    }
}

function drawRain() {
    const rainCanvas = document.getElementById('rain-canvas');
    if (!rainCanvas || currentWeather !== 'weather-rain') return;
    const rainCtx = rainCanvas.getContext('2d');
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    for (const d of rainDrops) {
        d.y += d.speed;
        if (d.y > viewHeight) { d.y = -d.length; d.x = Math.random() * worldWidth; }
        rainCtx.strokeStyle = `rgba(180,210,240,${d.opacity})`;
        rainCtx.lineWidth = d.width;
        rainCtx.beginPath();
        rainCtx.moveTo(d.x, d.y);
        rainCtx.lineTo(d.x - 2, d.y - d.length);
        rainCtx.stroke();
    }
}

// 转换天气触发器
function switchWeather(key) {
    const target = weatherLayers[key];
    const gameWorld = document.getElementById('game-world');
    if (!target || !gameWorld || currentWeather === target.id) return;
    document.querySelectorAll('.weather-layer').forEach(el => el.classList.remove('active'));
    const useDefault = ['weather-thunder', 'weather-stars', 'weather-rain'].includes(target.id);
    const bgId = useDefault ? 'weather-default' : target.id;
    const bgEl = document.getElementById(bgId);
    if (bgEl) bgEl.classList.add('active');
    Object.values(weatherLayers).forEach(w => gameWorld.classList.remove(w.state));
    gameWorld.classList.add(target.state);
    currentWeather = target.id;
    if (key === '2') initStars();
    if (key === '4') initRain();
}

// 调试按键 ➔ 情绪值映射表
const keyToEmotionMap = {
    '1': 'happy',
    '2': 'surprise',
    '4': 'sad',
    '5': 'neutral', 
    '5': 'neutral'
};

window.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        
        // 1. 改变天气样式
        switchWeather(e.key);
        
        // 2. 【核心修复二】：通过键盘按键调试时，传入 true 激活 skipWeather 参数。
        // 这将允许小王子变脸，但阻止变脸函数强行重置您刚刚手动按出来的雨天（4）或其它天气！
        const mappedEmotion = keyToEmotionMap[e.key];
        if (mappedEmotion && typeof handleEmotionInput === 'function') {
            handleEmotionInput(mappedEmotion, true); // 传入 true 代表跳过天气重置覆盖
        }
    }
});
