// =================================================================
// 2D 游戏主控与行走渲染驱动模块
// =================================================================

// ========== 小王子经典语录数组 ==========
const QUOTES_LIST = [
    "星星真美，因为有一朵看不见的花。",
    "你在你的玫瑰花上耗费的时间，使得你的玫瑰花变得如此重要。",
    "使生活如此美丽的，是我们藏起来的真诚和童心。",
    "和你相遇怎么说呢，就像是一颗耀眼的星星通亮了一片荒芜的小宇宙。",
    "所有的大人都曾经是小孩，虽然，只有少数人记得。",
    "喜欢一个人的心情，像小王子星球上的猴面包树，不及时清理就会长满星球。",
    "有一天，我看了44次日落。",
    "你知道吗？人在难过的时候，就会爱上看日落。",
    "能快乐旅行的，一定是轻装旅行的人。",
    "星星发亮是为了让每一个人，有一天都能找到属于自己的星星。",
    "也许世界上也有五千朵和你一模一样的花，但只有你是我独一无二的玫瑰。",
    "因为是心甘情愿地沉溺，即使死亡也无须被拯救。",
    "只有用心灵才能看得清事物本质，真正重要的东西是肉眼无法看见的。",
    "生活才不是生命荒唐的编号，生活的意义在于生活本身。",
    "一旦你驯服了什么，就要对她负责，永远的负责。",
    "最大的问题不是长大，而是遗忘。",
    "忘记朋友是一件令人伤心的事情，但并不是人人都有朋友的。",
    "如果你说你在下午四点来，从三点钟开始，我就开始感觉很快乐，时间越临近，我就越来越感到快乐。",
    "沙漠之所以美丽，是因为在某个角落藏着一口井。",
    "这是最难做到的，审判自己比审判别人难得多。",
    "时间会缓和所有的悲伤，当你的悲伤被安抚以后，你就会因为认识过我而感到满足。",
    "即使在有人的地方，我们依然孤单。",
    "星星会发亮，是为了让每个人都能找到属于自己的星星。",
    "如果你爱上了某个星球的一朵花。那么，只要在夜晚仰望星空，就会觉得漫天的繁星就像一朵朵盛开的花。"
];

let worldWidth = 0;
let viewWidth = 0;
let viewHeight = 0;
let charWidth = 0;
let charHeight = 0;
let rosePosX = 0;
let rosePosYVh = 0;
let posX = 100; // 左边平地出发

// 全局情绪与运动控制状态共享
let currentEmotion = "neutral";
let isMoving = false;
let isAtRoseTouchPose = false;

// 抬头望左相关状态
let isLookingUp = false;
let restoreImageTimer = null;
let quoteFadeTimer = null;

// 情绪激活锁
let isEmotionActive = false;

// 提供给 main.js 调用的表情接收接口
function handleEmotionInput(emotion, skipWeather = false) {
    console.log("处理情绪对应的天气及帧切换:", emotion);
    currentEmotion = emotion;
    isEmotionActive = true;

    if (!skipWeather) {
        if (emotion === 'happy') {
            if (typeof switchWeather === 'function') switchWeather('1');
        } else if (emotion === 'surprise') {
            if (typeof switchWeather === 'function') switchWeather('2');
        } else if (emotion === 'sad') {
            if (typeof switchWeather === 'function') switchWeather('3');
        } else if (emotion === 'neutral') {
            if (typeof switchWeather === 'function') switchWeather('5');
        }
    }

    const character = document.getElementById('character');
    if (character && !isMoving && isAtRoseTouchPose && !isLookingUp) {
        character.style.backgroundImage = `url('${emotion}.png')`;
    }
}

function initRoseGame() {
    const roseConfig = {
        percentX: 0.93,
        offsetY: 15
    };

    const character = document.getElementById('character');
    const gameWorld = document.getElementById('game-world');
    const container = document.getElementById('game-container');
    const layerRose = document.getElementById('layer-rose');
    const roseHalo = document.getElementById('rose-halo');
    const skyCanvas = document.getElementById('sky-canvas');
    const pCanvas = document.getElementById('particle-canvas');

    // 点击语录区域可关闭
    const quoteDisplayDiv = document.getElementById('quoteDisplay');
    if (quoteDisplayDiv) {
        quoteDisplayDiv.addEventListener('click', () => {
            quoteDisplayDiv.classList.remove('show');
        });
    }

    // =================================================================
    // 0. 全局云层控制与消散逻辑
    // =================================================================
    const cloudOverlay = document.getElementById('cloud-overlay');
    let isDispersed = false;

    function triggerCloudDisperse() {
        if (!cloudOverlay || isDispersed) return;
        cloudOverlay.classList.add('disperse');
        setTimeout(() => {
            isDispersed = true;
        }, 2500);
    }

    // =================================================================
    // 1. 窗口缩放适配
    // =================================================================
    function resizeCanvas() {
        worldWidth = gameWorld.clientWidth;
        viewWidth = container.clientWidth;
        viewHeight = container.clientHeight;
        charWidth = character.clientWidth;
        charHeight = character.clientHeight;
        skyCanvas.width = worldWidth;
        skyCanvas.height = viewHeight;

        if (typeof initStars === 'function') initStars();
        if (typeof initRain === 'function') initRain();
        updateRosePosition();

        if (isAtRoseTouchPose) {
            posX = rosePosX - charWidth - 40;
        }
    }

    function updateRosePosition() {
        rosePosX = worldWidth * roseConfig.percentX;
        rosePosYVh = getGroundHeight(rosePosX) + roseConfig.offsetY;
        pCanvas.style.left = rosePosX + 'px';
        pCanvas.style.bottom = rosePosYVh + 'vh';
        roseHalo.style.left = rosePosX + 'px';
        roseHalo.style.bottom = rosePosYVh + 'vh';
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const speed = 3;
    const imgPrefix = './';
    const keys = { left: false, right: false };
    const images = {
        left: [imgPrefix + '向左走1.png', imgPrefix + '向左走2.png'],
        right: [imgPrefix + '向右走1.png', imgPrefix + '向右走2.png']
    };
    let currentDirection = 'right';
    let currentFrameIndex = 0;
    let animationInterval = null;

    // ===== 捏耳朵反馈 =====
    let isPinching = false;
    let pinchScale = 1;

    character.style.backgroundImage = `url('${images.right[0]}')`;

    const initHeightVh = getGroundHeight(posX);
    character.style.bottom = initHeightVh + 'vh';
    character.style.left = posX + 'px';
    character.style.transform = `rotate(${getGroundAngle(posX)}deg) scale(${pinchScale})`;

    function pinchEar() {
        if (isPinching || isLookingUp) return;
        isPinching = true;
        const originalImg = character.style.backgroundImage;

        character.style.backgroundImage = "url('surprise.png')";
        pinchScale = 0.93;

        setTimeout(() => {
            character.style.backgroundImage = "url('happy.png')";
            pinchScale = 1;
        }, 300);

        setTimeout(() => {
            isPinching = false;
            character.style.backgroundImage = originalImg;
        }, 800);
        playEarStarEffect();
    }

    function playEarStarEffect() {
        const earP = document.getElementById('particle-canvas');
        const earCtx = earP.getContext('2d');
        let earParticles = [];
        for (let i = 0; i < 40; i++) {
            earParticles.push({
                x: 200 + (Math.random() - 0.5) * 100,
                y: 200 + (Math.random() - 0.5) * 100,
                size: Math.random() * 3 + 1,
                alpha: 1,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            });
        }
        function earLoop() {
            earCtx.clearRect(0, 0, 400, 400);
            for (let i = earParticles.length - 1; i >= 0; i--) {
                const p = earParticles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= 0.015;
                earCtx.save();
                earCtx.globalCompositeOperation = 'lighter';
                earCtx.fillStyle = `rgba(255,240,180,${p.alpha})`;
                earCtx.shadowBlur = 10;
                earCtx.shadowColor = "gold";
                earCtx.beginPath();
                earCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                earCtx.fill();
                earCtx.restore();
                if (p.alpha <= 0) earParticles.splice(i, 1);
            }
            if (earParticles.length > 0) requestAnimationFrame(earLoop);
        }
        earLoop();
    }

    character.addEventListener('click', pinchEar);
    character.addEventListener('touchstart', (e) => { e.preventDefault(); pinchEar(); });

    // =================================================================
    // 2. 地面贝塞尔曲线运动学
    // =================================================================
    function getGroundHeight(x) {
        let t = x / worldWidth;
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        const p0 = 14, p1 = 15, p2 = 65, p3 = 48;
        const mt = 1 - t;
        return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
    }

    function getGroundAngle(x) {
        const step = 15;
        const yCurrent = getGroundHeight(x);
        const yNext = getGroundHeight(Math.min(x + step, worldWidth));
        const dyVh = yNext - yCurrent;
        const dyPx = dyVh * (viewHeight / 100);
        const dxPx = step;
        const angleRad = Math.atan2(dyPx, dxPx);
        return -angleRad * (180 / Math.PI) * 0.75;
    }

    // 移动按键绑定
    window.addEventListener('keydown', (e) => {
        if (isAutoWalking) return;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            isAtRoseTouchPose = false;
            keys.left = true;
            if (!isLookingUp) setDirection('left');
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            isAtRoseTouchPose = false;
            keys.right = true;
            if (!isLookingUp) setDirection('right');
        }
    });
    window.addEventListener('keyup', (e) => {
        if (isAutoWalking) return;
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
        if (!keys.left && !keys.right && !isLookingUp) stopAnimation();
    });

    function setDirection(dir) {
        if (isLookingUp) return;
        currentDirection = dir;
        startAnimation();
    }

    function startAnimation() {
        if (isMoving || isLookingUp) return;
        isMoving = true;
        animationInterval = setInterval(() => {
            if (isLookingUp) return;
            currentFrameIndex = (currentFrameIndex + 1) % 2;
            character.style.backgroundImage = `url('${images[currentDirection][currentFrameIndex]}')`;
        }, 250);
    }

    function stopAnimation() {
        isMoving = false;
        clearInterval(animationInterval);
        animationInterval = null;
        currentFrameIndex = 1;

        if (isLookingUp) return;

        if (isAtRoseTouchPose) {
            if (isEmotionActive && currentEmotion && currentEmotion !== "") {
                character.style.backgroundImage = `url('${currentEmotion}.png')`;
            } else {
                character.style.backgroundImage = "url('小心触碰.png')";
            }
        } else {
            character.style.backgroundImage = `url('${images[currentDirection][currentFrameIndex]}')`;
        }
    }

    // ========== 显示随机语录（定义在 initRoseGame 内部） ==========
    function showRandomQuote() {
        const quoteDisplay = document.getElementById('quoteDisplay');
        const quoteTextElem = document.getElementById('randomQuoteText');
        if (!quoteDisplay || !quoteTextElem) return;

        if (quoteFadeTimer) clearTimeout(quoteFadeTimer);
        if (restoreImageTimer) clearTimeout(restoreImageTimer);

        isLookingUp = true;

        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        isMoving = false;

        character.style.backgroundImage = "url('./抬头望左.png')";
        character.classList.add('looking-up');

        if (quoteDisplay.classList.contains('show')) {
            quoteDisplay.classList.remove('show');
        }

        const randomIndex = Math.floor(Math.random() * QUOTES_LIST.length);
        const selectedQuote = QUOTES_LIST[randomIndex];
        quoteTextElem.innerHTML = selectedQuote;

        void quoteDisplay.offsetWidth;
        quoteDisplay.classList.add('show');

        quoteFadeTimer = setTimeout(() => {
            quoteDisplay.classList.remove('show');
            quoteFadeTimer = null;
        }, 3800);

        restoreImageTimer = setTimeout(() => {
            isLookingUp = false;
            character.classList.remove('looking-up');

            if (keys.left || keys.right) {
                startAnimation();
            } else {
                if (isAtRoseTouchPose) {
                    if (isEmotionActive && currentEmotion && currentEmotion !== "") {
                        character.style.backgroundImage = `url('${currentEmotion}.png')`;
                    } else {
                        character.style.backgroundImage = "url('小心触碰.png')";
                    }
                } else {
                    character.style.backgroundImage = `url('${images[currentDirection][1]}')`;
                }
            }
            restoreImageTimer = null;
        }, 4600);
    }

    // 暴露给全局，供 main.js 调用
    window.showRandomQuote = showRandomQuote;

    // =================================================================
    // 3. 自动化流程控制（自动播放云层消散 + 小王子右行走向玫瑰）
    // =================================================================
    let isAutoWalking = false;

    setTimeout(() => {
        triggerCloudDisperse();

        setTimeout(() => {
            isAutoWalking = true;
            // 【关键修复】启动行走动画
            setDirection('right');
        }, 2500);
    }, 500);

    if (typeof updateParticles === 'function') {
        requestAnimationFrame(updateParticles);
    }

    // =================================================================
    // 4. 走向玫瑰 2D 主循环更新驱动
    // =================================================================
    function updateGame() {
        if (viewWidth === 0 || viewHeight === 0 || charWidth === 0) {
            resizeCanvas();
        }

        // 自动行走逻辑（不抬头时才能移动和播放动画）
        if (isAutoWalking && !isLookingUp) {
            posX += speed;
            const targetX = rosePosX - charWidth - 40;
            if (posX >= targetX) {
                posX = targetX;
                isAutoWalking = false;
                isAtRoseTouchPose = true;
                stopAnimation();

                character.style.backgroundImage = "url('小心触碰.png')";

                setTimeout(() => {
                    const charCenter = posX + charWidth / 2;
                    const distanceToRose = Math.abs(charCenter - rosePosX);
                    const dynamicTriggerDistance = charWidth + 100;

                    if (distanceToRose < dynamicTriggerDistance) {
                        if (!window.isNearRose) {
                            window.isNearRose = true;
                            layerRose.classList.add('rose-glowing');
                            roseHalo.classList.add('halo-active');
                            if (typeof triggerRoseBurst === 'function') triggerRoseBurst();
                        }
                    }
                }, 800);
            }
        } else if (!isAutoWalking) {
            // 抬头状态下也可以移动位置
            if (keys.left) {
                posX -= speed;
                if (posX < 0) posX = 0;
            }
            if (keys.right) {
                posX += speed;
                if (posX > worldWidth - charWidth) posX = worldWidth - charWidth;
            }
        }

        const currentHeightVh = getGroundHeight(posX);
        character.style.bottom = currentHeightVh + 'vh';
        character.style.left = posX + 'px';

        const currentAngle = getGroundAngle(posX);
        character.style.transform = `rotate(${currentAngle}deg) scale(${pinchScale})`;

        if (!isAutoWalking) {
            const charCenter = posX + charWidth / 2;
            const distanceToRose = Math.abs(charCenter - rosePosX);
            const dynamicTriggerDistance = charWidth + 100;

            if (distanceToRose < dynamicTriggerDistance) {
                if (!window.isNearRose) {
                    window.isNearRose = true;
                    layerRose.classList.add('rose-glowing');
                    roseHalo.classList.add('halo-active');
                    if (typeof triggerRoseBurst === 'function') triggerRoseBurst();
                }
            } else {
                if (window.isNearRose) {
                    window.isNearRose = false;
                    layerRose.classList.remove('rose-glowing');
                    roseHalo.classList.remove('halo-active');

                    if (!isMoving && !isLookingUp) {
                        character.style.backgroundImage = `url('${images[currentDirection][1]}')`;
                    }
                }
            }
        }

        let zoom = 1.0;
        const maxZoom = 1.6, minZoom = 1.0, triggerDist = viewWidth / 2;
        if (posX < triggerDist) {
            let ratio = posX / triggerDist;
            zoom = maxZoom - (maxZoom - minZoom) * ratio;
        } else if (posX > worldWidth - triggerDist) {
            let distFromRight = worldWidth - posX;
            let ratio = distFromRight / triggerDist;
            zoom = maxZoom - (maxZoom - minZoom) * ratio;
        } else zoom = minZoom;

        let scaledPosX = posX * zoom;
        let scaledCharWidth = charWidth * zoom;
        let camX = scaledPosX - (viewWidth / 2) + (scaledCharWidth / 2);
        let scaledWorldWidth = worldWidth * zoom;
        let maxCamX = scaledWorldWidth - viewWidth;
        if (maxCamX < 0) maxCamX = 0;
        if (camX < 0) camX = 0;
        if (camX > maxCamX) camX = maxCamX;

        const posYPx = currentHeightVh * (viewHeight / 100);
        const scaledPosYCenter = (posYPx * zoom) + (charHeight * zoom / 2);
        let camY = scaledPosYCenter - (viewHeight / 2);
        let scaledWorldHeight = viewHeight * zoom;
        let maxCamY = scaledWorldHeight - viewHeight;
        if (maxCamY < 0) maxCamY = 0;
        if (camY < 0) camY = 0;
        if (camY > maxCamY) camY = maxCamY;

        // 检查是否启用狐狸相机跟随模式
if (window.isCameraFollowingFox && window.isFoxVisible && window.isFoxVisible()) {
    // 如果狐狸相机跟随模式启用，跳过游戏原有的相机更新
    // 让 foxWalk.js 来控制相机
} else {
    if (!window.isCameraFollowingFox) {
    gameWorld.style.transform = `translate(${-camX}px, ${camY}px) scale(${zoom})`;
}
}

        if (typeof updateMeteorsFX === 'function') updateMeteorsFX(camX);
        if (typeof drawStars === 'function') drawStars();
        if (typeof drawSunbeams === 'function') drawSunbeams();
        if (typeof drawRain === 'function') drawRain();

        requestAnimationFrame(updateGame);
    }
    requestAnimationFrame(updateGame);
}