// =================================================================
// 狐狸特效模块（最终版 - 调低烟花最大大小）
// =================================================================

(function() {
    console.log("🔥 foxEffects.js 已加载");

    // 爱心图片
    const heartImg = new Image();
    heartImg.src = 'heart.png';
    heartImg.onload = () => console.log("✅ 爱心图片加载成功");
    heartImg.onerror = () => console.error("❌ 爱心图片加载失败，请检查 heart.png");

    // 4张烟花图片
    const fireworkImages = ['firework1.png', 'firework2.png', 'firework3.png', 'firework4.png'];
    fireworkImages.forEach(img => {
        const testImg = new Image();
        testImg.src = img;
        testImg.onload = () => console.log(`✅ 烟花图片加载成功: ${img}`);
        testImg.onerror = () => console.error(`❌ 烟花图片加载失败: ${img}`);
    });

    // 随机获取烟花图片
    function getRandomFirework() {
        const randomIndex = Math.floor(Math.random() * fireworkImages.length);
        return fireworkImages[randomIndex];
    }

    // 显示爱心函数
    window.showHearts = function() {
        console.log("💖 showHearts 被调用");
        
        const fox = document.getElementById('fox');
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        
        if (fox && fox.style.display === 'block') {
            const rect = fox.getBoundingClientRect();
            x = rect.left + rect.width / 2;
            y = rect.bottom - 10;
            console.log("找到狐狸，脚底位置:", x, y);
        } else {
            console.log("未找到狐狸，在屏幕中央显示");
        }
        
        const heartCount = Math.floor(Math.random() * 2) + 2;
        
        console.log(`💖 显示 ${heartCount} 个爱心`);
        
        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                const offsetX = (Math.random() - 0.5) * 30;
                const startSize = 35 + Math.random() * 25;
                
                const heart = document.createElement('div');
                heart.style.cssText = `
                    position: fixed;
                    left: ${x + offsetX - startSize/2}px;
                    top: ${y}px;
                    width: ${startSize}px;
                    height: ${startSize}px;
                    background-image: url('heart.png');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    z-index: 100 !important;
                    pointer-events: none;
                    filter: drop-shadow(0 0 5px rgba(255,51,102,0.5));
                    opacity: 1;
                `;
                document.body.appendChild(heart);
                
                const startY = y;
                let currentFrame = 0;
                const totalFrames = 60;
                const frameInterval = 33;
                
                const interval = setInterval(() => {
                    currentFrame++;
                    const progress = currentFrame / totalFrames;
                    const newY = startY - progress * 300;
                    const newSize = startSize * (1 - progress) + 3;
                    const newOpacity = 1 - progress;
                    
                    heart.style.top = newY + 'px';
                    heart.style.width = newSize + 'px';
                    heart.style.height = newSize + 'px';
                    heart.style.opacity = newOpacity;
                    
                    if (currentFrame >= totalFrames) {
                        clearInterval(interval);
                        heart.remove();
                    }
                }, frameInterval);
            }, i * 120);
        }
    };
    
    // 显示烟花函数（调低最大大小）
    window.showFireworks = function() {
        console.log("🎆 showFireworks 被调用");
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        const fireworkCount = Math.floor(Math.random() * 2) + 2;
        
        console.log(`🎆 显示 ${fireworkCount} 个烟花，最大大小调低`);
        
        for (let i = 0; i < fireworkCount; i++) {
            setTimeout(() => {
                const x = (Math.random() * (screenWidth - 400)) + 200;
                const yMin = screenHeight * 0.12;
                const yMax = screenHeight * 0.65;
                const y = yMin + Math.random() * (yMax - yMin);
                
                // 大小：最小100px，最大300px（原来150-525px）
                const size = 100 + Math.random() * 200;
                
                const fireworkImg = getRandomFirework();
                
                const firework = document.createElement('div');
                firework.style.cssText = `
                    position: fixed;
                    left: ${x - size/2}px;
                    top: ${y - size/2}px;
                    width: 0px;
                    height: 0px;
                    background-image: url('${fireworkImg}');
                    background-size: contain;
                    background-repeat: no-repeat;
                    background-position: center;
                    z-index: 8 !important;
                    pointer-events: none;
                    filter: drop-shadow(0 0 15px rgba(255,100,0,0.8));
                    opacity: 0;
                    transition: all 0.6s ease-out;
                `;
                document.body.appendChild(firework);
                
                setTimeout(() => {
                    firework.style.width = size + 'px';
                    firework.style.height = size + 'px';
                    firework.style.opacity = '1';
                }, 10);
                
                setTimeout(() => {
                    firework.style.opacity = '0';
                }, 700);
                
                setTimeout(() => {
                    firework.remove();
                }, 1300);
            }, i * 150);
        }
    };
    
    window.addEventListener('keydown', function(event) {
        const key = event.key;
        
        if (key === '8') {
            event.preventDefault();
            console.log("👉 按了8，显示爱心");
            window.showHearts();
        } else if (key === '9') {
            event.preventDefault();
            console.log("👉 按了9，显示烟花");
            window.showFireworks();
        }
    });
    
    console.log("✅ 特效模块优化完成");
    console.log("   - 烟花大小: 100-300px");
})();