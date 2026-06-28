// =================================================================
// 1. 基础 3D 环境初始化
// =================================================================
const container = document.getElementById('canvas-container'); 
const scene = new THREE.Scene(); 
scene.background = new THREE.Color(0x020212); 
scene.fog = new THREE.FogExp2(0x020212, 0.005); 

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000); 
camera.position.set(0, 35, 160); 

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); 
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
renderer.setSize(window.innerWidth, window.innerHeight); 
container.appendChild(renderer.domElement); 

const controls = new THREE.OrbitControls(camera, renderer.domElement); 
controls.enabled = false; 
controls.enableDamping = true; 
controls.dampingFactor = 0.05; 
controls.maxPolarAngle = Math.PI / 2 - 0.02; 
controls.minDistance = 3.5; 
controls.maxDistance = 18; 

const spaceGroup = new THREE.Group(); 
const planetGroup = new THREE.Group(); 
const surfaceGroup = new THREE.Group(); 
scene.add(spaceGroup); 
scene.add(planetGroup); 
scene.add(surfaceGroup); 

let isLanding = false; 
let isLanded = false;
let isTransitioning = false;

// =================================================================
// 2. 3D 粒子纹理构造器
// =================================================================
function createParticleTexture(colorString, isGlow = false) { 
    const canvas = document.createElement('canvas'); 
    canvas.width = 64; canvas.height = 64; 
    const ctx = canvas.getContext('2d'); 
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); 
    if (isGlow) { 
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
        gradient.addColorStop(0.2, colorString); 
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.03)'); 
        gradient.addColorStop(1, 'rgba(0,0,0,0)'); 
    } else { 
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); 
        gradient.addColorStop(0.3, colorString); 
        gradient.addColorStop(1, 'rgba(0,0,0,0)'); 
    } 
    ctx.fillStyle = gradient; 
    ctx.fillRect(0, 0, 64, 64); 
    return new THREE.CanvasTexture(canvas); 
} 

const starTex = createParticleTexture('rgba(173, 216, 230, 0.8)'); 
const planetTex = createParticleTexture('rgba(255, 215, 0, 0.8)'); 
const glowTex = createParticleTexture('rgba(255, 165, 0, 0.35)', true); 
const sandTex = createParticleTexture('rgba(244, 164, 96, 0.7)'); 
const stemTex = createParticleTexture('rgba(59, 142, 72, 0.95)'); 
const leafTex = createParticleTexture('rgba(65, 150, 80, 0.9)'); 
const roseTex = createParticleTexture('rgba(230, 20, 30, 0.95)'); 
const magicTex = createParticleTexture('rgba(253, 224, 71, 0.95)'); 

// =================================================================
// 3. 星体粒子及人物粒子生成
// =================================================================
const starCount = 3500; 
const starGeometry = new THREE.BufferGeometry(); 
const starPositions = new Float32Array(starCount * 3); 
const starScales = new Float32Array(starCount); 
for (let i = 0; i < starCount * 3; i += 3) { 
    const radius = 250 + Math.random() * 250; 
    const u = Math.random(); const v = Math.random(); 
    const theta = u * 2 * Math.PI; const phi = Math.acos(2 * v - 1); 
    starPositions[i] = radius * Math.sin(phi) * Math.cos(theta); 
    starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta); 
    starPositions[i + 2] = radius * Math.cos(phi); 
    starScales[i / 3] = 0.5 + Math.random() * 2.0; 
} 
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3)); 
starGeometry.setAttribute('scale', new THREE.BufferAttribute(starScales, 1)); 
const starMaterial = new THREE.PointsMaterial({ size: 1.8, map: starTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9 }); 
const stars = new THREE.Points(starGeometry, starMaterial);
spaceGroup.add(stars); 

const planetRadius = 24; 
const planetPointsCount = 15000; 
const planetPositions = new Float32Array(planetPointsCount * 3); 
for (let i = 0; i < planetPointsCount * 3; i += 3) { 
    const u = Math.random(); const v = Math.random(); 
    const theta = u * 2 * Math.PI; const phi = Math.acos(2 * v - 1); 
    const r = planetRadius + (Math.random() - 0.5) * 0.4; 
    planetPositions[i] = r * Math.sin(phi) * Math.cos(theta); 
    planetPositions[i+1] = r * Math.sin(phi) * Math.sin(theta); 
    planetPositions[i+2] = r * Math.cos(phi); 
} 
const planetGeometry = new THREE.BufferGeometry();
planetGeometry.setAttribute('position', new THREE.BufferAttribute(planetPositions, 3)); 
const planetMaterial = new THREE.PointsMaterial({ size: 0.65, map: planetTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.95 }); 
const planetPoints = new THREE.Points(planetGeometry, planetMaterial);
planetGroup.add(planetPoints); 

const glowPointsCount = 3500; 
const glowPositions = new Float32Array(glowPointsCount * 3); 
for (let i = 0; i < glowPointsCount * 3; i += 3) { 
    const u = Math.random(); const v = Math.random(); 
    const theta = u * 2 * Math.PI; const phi = Math.acos(2 * v - 1); 
    const r = planetRadius * (1.05 + Math.random() * 0.22); 
    glowPositions[i] = r * Math.sin(phi) * Math.cos(theta); 
    glowPositions[i+1] = r * Math.sin(phi) * Math.sin(theta); 
    glowPositions[i+2] = r * Math.cos(phi); 
} 
const glowGeometry = new THREE.BufferGeometry();
glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3)); 
const glowMaterial = new THREE.PointsMaterial({ size: 2.2, map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6 }); 
const glowPoints = new THREE.Points(glowGeometry, glowMaterial);
planetGroup.add(glowPoints); 

const groundY = -3.8; 
const sandMaterial = new THREE.PointsMaterial({ size: 0.45, map: sandTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0 }); 
const sandPointsCount = 10000; 
const sandPositions = new Float32Array(sandPointsCount * 3); 
for (let i = 0; i < sandPointsCount; i++) { 
    const x = (Math.random() - 0.5) * 80; const z = (Math.random() - 0.5) * 80; 
    const y = Math.sin(x * 0.1) * Math.cos(z * 0.08) * 1.5 + groundY; 
    sandPositions[i*3] = x; sandPositions[i*3+1] = y; sandPositions[i*3+2] = z; 
} 
const sandGeom = new THREE.BufferGeometry();
sandGeom.setAttribute('position', new THREE.BufferAttribute(sandPositions, 3)); 
surfaceGroup.add(new THREE.Points(sandGeom, sandMaterial)); 

const roseCenterX = 1.0; const roseCenterZ = 0.0; const stemHeight = 3.6; const roseTopY = groundY + stemHeight; 
const stemRes = 900; const stemPositions = new Float32Array(stemRes * 3); 
for (let i = 0; i < stemRes; i++) { 
    const y = groundY + (i / stemRes) * stemHeight; 
    stemPositions[i*3] = Math.sin(y * 1.8) * 0.02 + roseCenterX; stemPositions[i*3+1] = y; stemPositions[i*3+2] = Math.cos(y * 1.8) * 0.02 + roseCenterZ; 
} 
const stemGeom = new THREE.BufferGeometry(); stemGeom.setAttribute('position', new THREE.BufferAttribute(stemPositions, 3)); 
const stemMat = new THREE.PointsMaterial({ size: 0.38, map: stemTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0 }); 
surfaceGroup.add(new THREE.Points(stemGeom, stemMat)); 

const flowerCount = 3300; const flowerPos = new Float32Array(flowerCount * 3); 
for (let i = 0; i < flowerCount; i++) { 
    const layer = i % 5; let radius, y, angle; 
    if (layer === 0) { const t = Math.random(); angle = t * Math.PI * 10; radius = 0.03 + 0.15 * t; y = roseTopY + t * 0.6; } 
    else if (layer <= 2) { const t = Math.random(); angle = t * Math.PI * 6.5 + layer * 1.5; radius = 0.1 + 0.38 * Math.pow(t, 1.2); y = roseTopY + 0.05 + t * 0.75 + Math.sin(angle * 3) * 0.06; } 
    else { const t = Math.random(); const lobe = Math.floor(Math.random() * 5); const spread = (Math.random() - 0.5) * 0.95; angle = lobe * (Math.PI * 2/5) + spread; radius = 0.28 + 0.75 * Math.sin(t * Math.PI * 0.5) + (1.0 - Math.abs(spread)) * 0.16; y = roseTopY + 0.15 + t * 0.8 - Math.pow(t, 2.5) * 0.2 + Math.sin(angle * 5) * 0.05; } 
    flowerPos[i*3] = radius * Math.cos(angle) + roseCenterX; flowerPos[i*3+1] = y; flowerPos[i*3+2] = radius * Math.sin(angle) + roseCenterZ; 
} 
const flowerGeom = new THREE.BufferGeometry(); flowerGeom.setAttribute('position', new THREE.BufferAttribute(flowerPos, 3)); 
const flowerMat = new THREE.PointsMaterial({ size: 0.42, map: roseTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0 }); 
surfaceGroup.add(new THREE.Points(flowerGeom, flowerMat)); 

const foliageCount = 1800; const foliagePos = new Float32Array(foliageCount * 3); 
for (let i = 0; i < foliageCount; i++) { 
    let x, y, z; 
    if (i < 300) { const index = i % 5; const angle = index * (Math.PI * 2/5); const d = Math.random(); const r = d * 0.45; x = roseCenterX + r * Math.sin(angle); y = roseTopY - 0.1 - (d*d)*0.2; z = roseCenterZ + r * Math.cos(angle); } 
    else if (i < 1100) { const t = Math.random(); const length = 1.3; const attachY = groundY + stemHeight * 0.35; if (t < 0.2) { x = roseCenterX - 0.85 * t * length; y = attachY - 0.2 * t * length; z = roseCenterZ + 0.3 * t * length; } else { x = roseCenterX - 0.8; y = attachY - 0.2; z = roseCenterZ + 0.3; } } 
    else { const t = Math.random(); const attachY = groundY + stemHeight * 0.6; x = roseCenterX + 0.8 * t; y = attachY + 0.2 * t; z = roseCenterZ - 0.2 * t; } 
    foliagePos[i*3] = x; foliagePos[i*3+1] = y; foliagePos[i*3+2] = z; 
} 
const foliageGeom = new THREE.BufferGeometry(); foliageGeom.setAttribute('position', new THREE.BufferAttribute(foliagePos, 3)); 
const leafMat = new THREE.PointsMaterial({ size: 0.33, map: leafTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0 }); 
surfaceGroup.add(new THREE.Points(foliageGeom, leafMat)); 

const magicCount = 200; const magicGeom = new THREE.BufferGeometry(); const magicPos = new Float32Array(magicCount * 3); const magicVels = []; 
for (let i = 0; i < magicCount; i++) { 
    const r = 0.4 + Math.random() * 2.0; const angle = Math.random() * Math.PI * 2; 
    magicPos[i*3] = Math.cos(angle) * r + roseCenterX; magicPos[i*3+1] = roseTopY + (Math.random()-0.5)*1.5; magicPos[i*3+2] = Math.sin(angle) * r + roseCenterZ; 
    magicVels.push({ x: (Math.random()-0.5)*0.005, y: 0.003+Math.random()*0.005, z: (Math.random()-0.5)*0.005, angleSpeed: 0.01+Math.random()*0.015, radius: r }); 
} 
magicGeom.setAttribute('position', new THREE.BufferAttribute(magicPos, 3)); 
const magicMat = new THREE.PointsMaterial({ size: 0.38, map: magicTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0 }); 
surfaceGroup.add(new THREE.Points(magicGeom, magicMat)); 

const princeOffsetX = -1.6; const princeOffsetZ = -0.2; const princeBodyCount = 3800; 
const colGreen = new THREE.Color(0x6ecb5a); const colSkin = new THREE.Color(0xe0bca2); const colBrown = new THREE.Color(0x6f4e37); const colGold = new THREE.Color(0xfbc02d); 
const pBodyPos = new Float32Array(princeBodyCount * 3); const pBodyCol = new Float32Array(princeBodyCount * 3); 
for (let i = 0; i < princeBodyCount; i++) { 
    let x=0, y=0, z=0, col=colGreen; const rand = Math.random(); 
    if (rand < 0.08) { const isL = Math.random() > 0.5; x = (isL?-0.22:0.22) + (Math.random()*0.1); y = Math.random()*0.25; z = (Math.random()-0.2)*0.38; col=colBrown; } 
    else if (rand < 0.35) { const isL = Math.random() > 0.5; const t = Math.random(); const r = 0.14 + Math.sin(t*Math.PI)*0.18; const a = Math.random()*Math.PI*2; x = (isL?-0.22:0.22) + r*Math.cos(a); y = 0.25+t*1.85; z=r*Math.sin(a); } 
    else if (rand < 0.7) { const t = Math.random(); const r = 0.44*(1.0-t*0.36); const a = Math.random()*Math.PI*2; x=r*Math.cos(a); y=2.1+t*2.6; z=r*Math.sin(a); } 
    else if (rand < 0.79) { const isL = Math.random() > 0.5; const t = Math.random(); x = (isL?-1:1)*(0.34+t*0.18); y = 4.3-t*1.85; col = t>0.88?colSkin:colGreen; } 
    else { const a = Math.random()*Math.PI*2; const p = Math.acos(2*Math.random()-1); const r = Math.random()*0.65; x=r*Math.sin(p)*Math.cos(a); y=5.35+r*Math.sin(p)*Math.sin(a); z=r*Math.cos(p); col=colSkin; } 
    pBodyPos[i*3]=x+princeOffsetX; pBodyPos[i*3+1]=y+groundY; pBodyPos[i*3+2]=z+princeOffsetZ; pBodyCol[i*3]=col.r; pBodyCol[i*3+1]=col.g; pBodyCol[i*3+2]=col.b; 
} 
const pBodyGeom = new THREE.BufferGeometry(); pBodyGeom.setAttribute('position', new THREE.BufferAttribute(pBodyPos, 3)); pBodyGeom.setAttribute('color', new THREE.BufferAttribute(pBodyCol, 3)); 
const pBodyMat = new THREE.PointsMaterial({ size: 0.38, vertexColors: true, map: createParticleTexture('rgba(255,255,255,1)'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0 }); 
surfaceGroup.add(new THREE.Points(pBodyGeom, pBodyMat)); 

const hairCount = 2000; const pHairPos = new Float32Array(hairCount*3); 
for (let i = 0; i < hairCount; i++) { 
    const a = Math.random()*Math.PI*2; const p = Math.acos(Math.random()*1.5-0.5); const r = 0.58 + (Math.random()<0.38?Math.random()*0.42:0.1); 
    pHairPos[i*3] = r*Math.sin(p)*Math.cos(a)+princeOffsetX; pHairPos[i*3+1] = 5.35+r*Math.sin(p)*Math.sin(a)*0.8+0.18+groundY; pHairPos[i*3+2] = r*Math.cos(p)+princeOffsetZ; 
} 
const pHairGeom = new THREE.BufferGeometry(); pHairGeom.setAttribute('position', new THREE.BufferAttribute(pHairPos, 3)); 
const pHairMat = new THREE.PointsMaterial({ size: 0.35, color: colGold, map: magicTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0 }); 
surfaceGroup.add(new THREE.Points(pHairGeom, pHairMat)); 

const scarfCount = 900; const scarfGeom = new THREE.BufferGeometry(); const scarfPos = new Float32Array(scarfCount*3); const scarfSegs = []; 
for (let i = 0; i < scarfCount; i++) { const t = i/scarfCount; scarfSegs.push({ u: t, wr: (Math.random()-0.5)*0.28, tr: (Math.random()-0.5)*0.08 }); } 
scarfGeom.setAttribute('position', new THREE.BufferAttribute(scarfPos, 3)); 
const scarfMat = new THREE.PointsMaterial({ size: 0.38, color: colGold, map: magicTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0 }); 
surfaceGroup.add(new THREE.Points(scarfGeom, scarfMat)); 

// =================================================================
// 4. 动态交互事件：拍拍头（pat_head）触发 3D 降落
// =================================================================
let hasBegunLanding = false;

function triggerPatHeadLanding() {
    if (hasBegunLanding) return; 
    hasBegunLanding = true;
    autoDescend();
}

function autoDescend() { 
    isLanding = true; 
    const duration = 4.5; 
    gsap.to(camera.position, { 
        x: 0, y: 0.8, z: 9.8, duration: duration, ease: 'power3.inOut', 
        onUpdate: () => camera.lookAt(-0.3, -0.8, 0), 
        onComplete: () => { 
            isLanded = true;
            controls.enabled = true; controls.target.set(-0.3, -0.8, 0); 
            document.getElementById('quote-box').classList.add('show'); 
        } 
    }); 
    gsap.to(planetMaterial, { opacity: 0, duration: 3 }); 
    gsap.to(glowMaterial, { opacity: 0, duration: 2.5 }); 
    [sandMaterial, stemMat, leafMat, flowerMat, magicMat, pBodyMat, pHairMat, scarfMat].forEach((m, i) => { 
        gsap.to(m, { opacity: 1, duration: 4, delay: 0.4 + i*0.1 }); 
    }); 
} 

// 转场逻辑：对应抚摸背部动作。
function onDocumentClick() {
    if (!isLanded || isTransitioning) return;
    isTransitioning = true;
    document.getElementById('quote-box').classList.remove('show');

    // 1. 触发逆云层遮挡动画：云层迅速向内聚拢，阻挡视线
    const cloudOverlay = document.getElementById('cloud-overlay');
    if (cloudOverlay) {
        cloudOverlay.classList.remove('disperse'); 
    }

    // 2. 2.5秒后，云层已完美遮住视口。此时在幕后默默切换场景
    setTimeout(() => {
        // 隐藏 3D 渲染器容器
        document.getElementById('canvas-container').style.display = 'none';
        
        // 【核心修复】：在这里彻底将 3D 流星画布隐藏并关闭，彻底防止其继续在 2D 小游戏上方不重合地渲染！
        document.getElementById('meteor-canvas').style.display = 'none';
        
        // 显示 2D 容器
        const wrapper = document.getElementById('rose-game-wrapper');
        wrapper.classList.add('show');
        
        // 下一帧执行 2D 初始化，确保容器已处于可视状态
        requestAnimationFrame(() => initRoseGame()); 
    }, 2500);
}

// =================================================================
// 5. 3D 流星画布动画组件
// =================================================================
const mCanvas = document.getElementById('meteor-canvas');
const mCtx = mCanvas.getContext('2d');
let spaceMeteors = [];

function resizeMeteorCanvas() {
    mCanvas.width = window.innerWidth;
    mCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeMeteorCanvas);
resizeMeteorCanvas();

function createMeteor() {
    return {
        x: Math.random() * mCanvas.width + mCanvas.width * 0.2, 
        y: Math.random() * mCanvas.height * 0.5 - 100,
        len: Math.random() * 80 + 20, 
        speed: Math.random() * 0.5 + 0.4, 
        opacity: 1,
        drift: Math.random() * 0.2 + 0.1 
    };
}

function startMeteors() {
    function updateMeteors() {
        mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
        if (Math.random() < 0.03) spaceMeteors.push(createMeteor());

        for (let i = spaceMeteors.length - 1; i >= 0; i--) {
            let m = spaceMeteors[i];
            m.x -= m.speed;           
            m.y += m.speed * m.drift; 
            m.opacity -= 0.0025;      

            if (m.opacity <= 0) {
                spaceMeteors.splice(i, 1);
                continue;
            }

            mCtx.save();
            mCtx.beginPath();
            let grad = mCtx.createLinearGradient(m.x, m.y, m.x + m.len, m.y - m.len * m.drift);
            grad.addColorStop(0, `rgba(255, 255, 240, ${m.opacity})`);
            grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
            mCtx.strokeStyle = grad;
            mCtx.lineWidth = 1.5;
            mCtx.lineCap = 'round';
            mCtx.moveTo(m.x, m.y);
            mCtx.lineTo(m.x + m.len, m.y - m.len * m.drift);
            mCtx.stroke();
            mCtx.restore();
        }
        requestAnimationFrame(updateMeteors);
    }
    updateMeteors();
}

// =================================================================
// 6. 三维系统每帧渲染循环
// =================================================================
const clock = new THREE.Clock(); 
function animate() { 
    requestAnimationFrame(animate); 
    if (document.getElementById('canvas-container').style.display === 'none') return;
    const time = clock.getElapsedTime(); 
    spaceGroup.rotation.y = time * 0.008; 
    
    const scales = starGeometry.attributes.scale.array; 
    for (let i = 0; i < starCount; i++) scales[i] = (Math.sin(time * 2 + i) + 1.1) * 0.7; 
    starGeometry.attributes.scale.needsUpdate = true; 

    if (!isLanding || (isTransitioning && planetMaterial.opacity > 0)) { 
        planetGroup.rotation.y = time * 0.025; 
    } 
    
    if (isLanding && !isTransitioning) { 
        const sPos = scarfGeom.attributes.position.array; 
        for (let i = 0; i < scarfCount; i++) { 
            const seg = scarfSegs[i]; const u = seg.u; 
            sPos[i*3] = princeOffsetX + u*2.8 + seg.tr; 
            sPos[i*3+1] = groundY + 4.68 + Math.sin(time*4.8 - u*5)*0.38*u - Math.pow(u,1.8)*0.5 + seg.wr*(1-u*0.6); 
            sPos[i*3+2] = princeOffsetZ + Math.cos(time*3.8 - u*3.5)*0.28*u + seg.wr; 
        } 
        scarfGeom.attributes.position.needsUpdate = true; 
        
        const mPos = magicGeom.attributes.position.array; 
        for (let i = 0; i < magicCount; i++) { 
            const v = magicVels[i]; mPos[i*3+1] += v.y; 
            if (mPos[i*3+1] > roseTopY + 2.2) mPos[i*3+1] = roseTopY - 0.2; 
        } 
        magicGeom.attributes.position.needsUpdate = true; 
        controls.update(); 
    } 
    renderer.render(scene, camera); 
} 

window.onload = () => { 
    startMeteors(); 
    console.log("3D 环境初始化完成。等待拍拍头信号(pat_head)以启动降落过程。");
}; 

window.addEventListener('resize', () => { 
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
}); 
animate();