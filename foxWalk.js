// =================================================================
// 狐狸行走控制模块（云层动画 + 稳定相机）
// =================================================================

(function() {
    // ---------- 配置参数 ----------
    const LEFT_IMAGES_COUNT = 10;
    const RIGHT_IMAGES_COUNT = 11;
    const BASE_STEP_PX = 100;
    const FRAME_INTERVAL_MS = 80;
    const PROXIMITY_THRESHOLD = 120;

    const LEFT_IMG_PATH = (index) => `l${index}.png`;
    const RIGHT_IMG_PATH = (index) => `r${index}.png`;

    // ---------- 状态变量 ----------
    let currentDirection = 'right';
    let currentFrameIndex = 0;
    let animationTimer = null;
    let isMoving = false;
    let rightStepPattern = 0;
    let hasShownQuote = false;
    let quoteHideTimer = null;
    let isFoxVisible = false;
    let isSummoning = false;

    window.isCameraFollowingFox = false;
    window.isFoxVisibleFlag = false;

    let foxX = 250;
    let gameWorld = null;
    let gameContainer = null;
    let viewHeight = 0;
    let worldWidth = 0;
    let viewWidth = 0;

    let foxDiv = null;
    let treeDiv = null;
    let cameraInterval = null;

    const gameWorldElem = document.getElementById('game-world');
    const gameContainerElem = document.getElementById('game-container');
    const princeDiv = document.getElementById('character');

    // 贝塞尔曲线
    function getGroundHeightDefault(x, worldWidth) {
        if (!worldWidth || worldWidth <= 0) return 14;
        let t = x / worldWidth;
        if (t < 0) t = 0;
        if (t > 1) t = 1;
        const p0 = 14, p1 = 15, p2 = 65, p3 = 48;
        const mt = 1 - t;
        return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
    }

    function getGroundHeight(x) {
        return getGroundHeightDefault(x, worldWidth);
    }

    function getGroundAngle(x) {
        const step = 20;
        const yCurrent = getGroundHeight(x);
        const yNext = getGroundHeight(Math.min(x + step, worldWidth));
        const dyVh = yNext - yCurrent;
        const dyPx = dyVh * (viewHeight / 100);
        const dxPx = step;
        const angleRad = Math.atan2(dyPx, dxPx);
        return -angleRad * (180 / Math.PI) * 0.3;
    }

    function updateWorldParams() {
        if (gameWorldElem) {
            worldWidth = gameWorldElem.clientWidth;
            viewHeight = window.innerHeight;
        }
        if (gameContainerElem) {
            viewWidth = gameContainerElem.clientWidth;
        }
        if (worldWidth <= 0) worldWidth = window.innerWidth;
        if (viewWidth <= 0) viewWidth = window.innerWidth;
    }

    // ========== 创建树元素 ==========
    function createTreeElement() {
        if (!gameWorldElem) return;
        
        let existingTree = document.getElementById('fox-tree');
        if (existingTree) existingTree.remove();
        
        treeDiv = document.createElement('div');
        treeDiv.id = 'fox-tree';
        gameWorldElem.appendChild(treeDiv);
        
        const groundHeightVh = getGroundHeight(100);
        const groundHeightPx = (groundHeightVh / 100) * viewHeight;
        
        treeDiv.style.position = 'absolute';
        treeDiv.style.bottom = (groundHeightPx - 60) + 'px';
        treeDiv.style.left = '-30px';
        treeDiv.style.width = '800px';
        treeDiv.style.height = '1000px';
        treeDiv.style.backgroundImage = "url('tree.png')";
        treeDiv.style.backgroundSize = 'contain';
        treeDiv.style.backgroundRepeat = 'no-repeat';
        treeDiv.style.backgroundPosition = 'center bottom';
        treeDiv.style.pointerEvents = 'none';
        treeDiv.style.zIndex = '2';
        
        console.log("树元素已创建");
    }

    function updateTreePosition() {
        if (!treeDiv) return;
        const groundHeightVh = getGroundHeight(100);
        const groundHeightPx = (groundHeightVh / 100) * viewHeight;
        treeDiv.style.bottom = (groundHeightPx - 60) + 'px';
    }

    // ========== 创建狐狸元素 ==========
    function createFoxElement() {
        if (!gameWorldElem) return false;
        
        let existingFox = document.getElementById('fox');
        if (existingFox) existingFox.remove();
        
        foxDiv = document.createElement('div');
        foxDiv.id = 'fox';
        gameWorldElem.appendChild(foxDiv);
        
        foxDiv.style.position = 'absolute';
        foxDiv.style.width = '300px';
        foxDiv.style.height = '300px';
        foxDiv.style.backgroundSize = 'contain';
        foxDiv.style.backgroundRepeat = 'no-repeat';
        foxDiv.style.backgroundPosition = 'center bottom';
        foxDiv.style.pointerEvents = 'none';
        foxDiv.style.transition = 'none';
        foxDiv.style.zIndex = '5';
        foxDiv.style.display = 'none';
        
        return true;
    }

    // ========== 切换图层 ==========
    function switchLayers() {
        if (!treeDiv || !foxDiv) return;
        treeDiv.style.zIndex = '2';
        foxDiv.style.zIndex = '8';
        console.log("图层已切换：树=2，狐狸=8");
    }

    // ========== 相机跟随核心（极其平滑，减少晃动） ==========
    let currentCamX = 0;
    let currentCamY = 0;
    let targetCamX = 0;
    let targetCamY = 0;
    let lastCameraUpdate = 0;

    function updateCameraTarget() {
        if (!gameWorldElem) return;
        
        updateWorldParams();
        
        let targetX = 250;
        if (isFoxVisible && foxDiv && foxDiv.style.display === 'block') {
            targetX = foxX;
        }
        
        const zoom = 1.0;
        const charWidth = 300;
        
        targetCamX = targetX - (viewWidth / 2) + (charWidth / 2);
        let scaledWorldWidth = worldWidth;
        let maxCamX = scaledWorldWidth - viewWidth;
        if (maxCamX < 0) maxCamX = 0;
        targetCamX = Math.max(0, Math.min(targetCamX, maxCamX));
        
        const groundHeightVh = getGroundHeight(targetX);
        const posYPx = groundHeightVh * (viewHeight / 100);
        const charHeight = 300;
        targetCamY = posYPx + (charHeight / 2) - (viewHeight / 2);
        let maxCamY = viewHeight - viewHeight;
        if (maxCamY < 0) maxCamY = 0;
        targetCamY = Math.max(0, Math.min(targetCamY, maxCamY));
    }

    function forceUpdateCamera() {
        if (!window.isCameraFollowingFox || !gameWorldElem) return false;
        
        // 更新目标位置
        updateCameraTarget();
        
        // 极其平滑的跟随（每步只移动5%的距离）
        currentCamX = currentCamX + (targetCamX - currentCamX) * 0.05;
        currentCamY = currentCamY + (targetCamY - currentCamY) * 0.05;
        
        const newTransform = `translate(${-currentCamX}px, ${-currentCamY}px) scale(1)`;
        gameWorldElem.style.transform = newTransform;
        
        return true;
    }

    function startCameraFollowLoop() {
        if (cameraInterval) {
            clearInterval(cameraInterval);
        }
        
        // 初始化当前位置
        updateCameraTarget();
        currentCamX = targetCamX;
        currentCamY = targetCamY;
        
        // 更流畅的更新频率（60fps，但移动速度慢）
        cameraInterval = setInterval(() => {
            if (window.isCameraFollowingFox) {
                forceUpdateCamera();
            }
        }, 16);
        
        console.log("相机跟随循环已启动（超平滑模式）");
    }

    // ========== 更新狐狸位置 ==========
    function updateFoxPosition() {
        if (!foxDiv) return;
        
        updateWorldParams();
        
        let groundHeightVh = getGroundHeight(foxX);
        const groundHeightPx = (groundHeightVh / 100) * viewHeight;
        
        foxDiv.style.bottom = groundHeightPx + 'px';
        foxDiv.style.left = foxX + 'px';
        foxDiv.style.top = 'auto';
    }

    function setFoxImage(direction, index) {
        if (!foxDiv) return;
        
        let imgPath = '';
        if (direction === 'left') {
            const imgIndex = (index % LEFT_IMAGES_COUNT) + 1;
            imgPath = LEFT_IMG_PATH(imgIndex);
        } else {
            const imgIndex = (index % RIGHT_IMAGES_COUNT) + 1;
            imgPath = RIGHT_IMG_PATH(imgIndex);
        }
        foxDiv.style.backgroundImage = `url('${imgPath}')`;
    }

    // ========== 显示狐狸 ==========
    function showFoxWithAnimation() {
        if (!foxDiv) return;
        
        console.log("🦊 显示狐狸动画");
        
        switchLayers();
        foxDiv.style.display = 'block';
        isFoxVisible = true;
        window.isFoxVisibleFlag = true;
        
        updateFoxPosition();
        setFoxImage('right', 0);
        
        if (!window.isCameraFollowingFox) {
            window.isCameraFollowingFox = true;
        }
        
        // 更新相机目标
        updateCameraTarget();
        
        foxDiv.style.animation = 'foxAppear 0.4s ease-out';
        setTimeout(() => {
            if (foxDiv) foxDiv.style.animation = '';
        }, 400);
    }

// ========== 召唤狐狸（云层遮挡时间延长一倍） ==========
function summonFox() {
    console.log("=== 召唤狐狸 ===");
    
    if (isSummoning) {
        console.log("召唤中，请勿重复点击");
        return;
    }
    
    if (isFoxVisible) {
        console.log("狐狸已经出现了");
        return;
    }
    
    if (!foxDiv) {
        createFoxElement();
    }
    
    const cloudOverlay = document.getElementById('cloud-overlay');
    
    if (!cloudOverlay) {
        console.error("找不到云层元素");
        showFoxWithAnimation();
        return;
    }
    
    isSummoning = true;
    
    if (foxDiv) {
        foxDiv.style.display = 'none';
    }
    
    window.isCameraFollowingFox = false;
    
    if (cameraInterval) {
        clearInterval(cameraInterval);
        cameraInterval = null;
    }
    
    // 重置云层状态
    cloudOverlay.classList.remove('disperse');
    void cloudOverlay.offsetHeight;
    console.log("🌫️ 云层聚集...");
    
    // 后台启动相机循环并切换到树的位置（时间延长一倍：800ms → 1600ms）
    setTimeout(() => {
        console.log("📷 后台切换到树的视角");
        window.isCameraFollowingFox = true;
        startCameraFollowLoop();
        
        setTimeout(() => {
            updateCameraTarget();
            currentCamX = targetCamX;
            currentCamY = targetCamY;
            forceUpdateCamera();
        }, 50);
    }, 1600);  // 从800ms改为1600ms
    
    // 开始云层消散（时间延长一倍：800ms → 1600ms）
    setTimeout(() => {
        cloudOverlay.classList.add('disperse');
        console.log("🌫️ 云层消散（5000ms）...");
    }, 1600);  // 从800ms改为1600ms
    
    // 云层完全消散后，树出现（1600 + 5000 = 6600ms）
    setTimeout(() => {
        console.log("🌳 云层消散完成，树已就位");
        forceUpdateCamera();
    }, 1600 + 5000);
    
    // 狐狸出现（2800ms → 改为在云层消散后出现）
    setTimeout(() => {
        console.log("🦊 狐狸从树后出现！");
        showFoxWithAnimation();
        isSummoning = false;
        
        const event = new CustomEvent('foxSummoned', {
            detail: { message: "小狐狸出现了", timestamp: Date.now() }
        });
        window.dispatchEvent(event);
        
    }, 1600 + 3000);  // 4600ms（在云层消散过程中出现，比之前晚一点）
}

    // ========== 行走控制 ==========
    function stopAnimation() {
        if (animationTimer) {
            clearInterval(animationTimer);
            animationTimer = null;
        }
        isMoving = false;
    }

    function startWalkAnimation(totalFrames, direction, deltaX) {
        if (!isFoxVisible) return false;
        if (isMoving) return false;

        updateWorldParams();
        
        const startX = foxX;
        const endX = startX + deltaX;
        const maxLeft = worldWidth - 300;
        const clampedEndX = Math.max(0, Math.min(endX, maxLeft));
        const clampedDeltaX = clampedEndX - startX;
        const clampedFrameDeltaX = clampedDeltaX / totalFrames;

        stopAnimation();
        isMoving = true;
        
        let currentFrame = 0;
        const walkingDirection = direction;

        if (currentDirection !== walkingDirection) {
            currentDirection = walkingDirection;
            currentFrameIndex = 0;
            setFoxImage(currentDirection, currentFrameIndex);
        }

        animationTimer = setInterval(() => {
            currentFrameIndex++;
            const maxFrames = (currentDirection === 'left') ? LEFT_IMAGES_COUNT : RIGHT_IMAGES_COUNT;
            currentFrameIndex = currentFrameIndex % maxFrames;
            setFoxImage(currentDirection, currentFrameIndex);

            foxX += clampedFrameDeltaX;
            const maxX = worldWidth - 300;
            foxX = Math.max(0, Math.min(foxX, maxX));
            
            updateFoxPosition();
            
            if (window.isCameraFollowingFox) {
                // 行走时更新相机目标位置
                updateCameraTarget();
            }

            currentFrame++;

            if (currentFrame >= totalFrames) {
                clearInterval(animationTimer);
                animationTimer = null;
                isMoving = false;
                updateFoxPosition();
                checkProximityToPrince();
            }
        }, FRAME_INTERVAL_MS);

        return true;
    }

    function walkLeft() {
        if (!isFoxVisible || isMoving) return;
        startWalkAnimation(6, 'left', -BASE_STEP_PX);
    }

    function walkRight() {
        if (!isFoxVisible || isMoving) return;
        let steps = (rightStepPattern === 0) ? 6 : 4;
        rightStepPattern = 1 - rightStepPattern;
        startWalkAnimation(steps, 'right', BASE_STEP_PX);
    }

    // ========== 靠近检测 ==========
    function showFoxQuote() {
        if (hasShownQuote) return;
        
        const quoteDisplay = document.getElementById('quoteDisplay');
        const quoteTextElem = document.getElementById('randomQuoteText');
        
        if (!quoteDisplay || !quoteTextElem) return;
        
        if (quoteHideTimer) clearTimeout(quoteHideTimer);
        
        quoteTextElem.innerHTML = "请你......驯养我吧";
        quoteDisplay.classList.add('show');
        hasShownQuote = true;
        
        console.log("🦊 狐狸靠近小王子，显示语录：请你......驯养我吧");
        
        quoteHideTimer = setTimeout(() => {
            quoteDisplay.classList.remove('show');
            quoteHideTimer = null;
        }, 5000);
        
        setTimeout(() => {
            hasShownQuote = false;
        }, 10000);
    }

    function checkProximityToPrince() {
        if (!princeDiv || !foxDiv || !isFoxVisible || hasShownQuote) return;
        
        const princeRect = princeDiv.getBoundingClientRect();
        const foxRect = foxDiv.getBoundingClientRect();
        
        const horizontalDistance = Math.abs((princeRect.left + princeRect.width/2) - (foxRect.left + foxRect.width/2));
        const verticalDistance = Math.abs(princeRect.bottom - foxRect.bottom);
        
        if (horizontalDistance < PROXIMITY_THRESHOLD && verticalDistance < 100) {
            showFoxQuote();
        }
    }

    // ========== 键盘控制 ==========
    function onKeyDown(event) {
        if (!isFoxVisible) return;
        const key = event.key.toLowerCase();
        if (key === 'l') {
            event.preventDefault();
            walkLeft();
        } else if (key === 'r') {
            event.preventDefault();
            walkRight();
        }
    }

    function onWindowResize() {
        updateWorldParams();
        updateFoxPosition();
        if (treeDiv) updateTreePosition();
        if (window.isCameraFollowingFox) {
            updateCameraTarget();
            forceUpdateCamera();
        }
    }

    // ========== 对外接口 ==========
    window.handleFoxDirection = function(direction) {
        if (!isFoxVisible) return;
        if (direction === 'left') walkLeft();
        else if (direction === 'right') walkRight();
    };
    
    window.summonFox = summonFox;
    window.isFoxVisible = () => isFoxVisible;
    window.getFoxDebugInfo = function() {
        return { 
            foxX, 
            isFoxVisible, 
            isCameraFollowingFox: window.isCameraFollowingFox,
            isSummoning: isSummoning
        };
    };
    window.resetFoxQuote = function() {
        hasShownQuote = false;
        if (quoteHideTimer) {
            clearTimeout(quoteHideTimer);
        }
        const quoteDisplay = document.getElementById('quoteDisplay');
        if (quoteDisplay) {
            quoteDisplay.classList.remove('show');
        }
        console.log("狐狸语录状态已重置");
    };

    // ========== 初始化 ==========
    function init() {
        const waitForGameWorld = setInterval(() => {
            const gameWorld = document.getElementById('game-world');
            if (gameWorld) {
                clearInterval(waitForGameWorld);
                createTreeElement();
                createFoxElement();
                updateWorldParams();
                updateTreePosition();
                window.addEventListener('keydown', onKeyDown);
                window.addEventListener('resize', onWindowResize);
                setInterval(() => {
                    if (!isMoving && isFoxVisible) checkProximityToPrince();
                }, 500);
                console.log("狐狸模块初始化完成");
                console.log("相机跟随：超平滑模式（每步移动5%）");
                console.log("云层动画：已恢复原有效果");
            }
        }, 100);
    }

    init();
})();