// =================================================================
// 2D 游戏物理粒子与流星特效模块
// =================================================================
let particles2D = [];
let meteors2D = [];

// 【核心修复】：将 isNearRose 设为全局共享变量，确保 2D 移动核心与 特效渲染核心数据互通
window.isNearRose = false; 

// 玫瑰鲜花粒子类
class Particle2D {
    constructor(x, y, isBurst) {
        this.x = x;
        this.y = y;
        const types = ['star', 'ember', 'dust'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.size = Math.random() * 2.5 + 1;
        const colors = ['rgba(255, 215, 0, ', 'rgba(255, 75, 40, ', 'rgba(230, 0, 50, ', 'rgba(255, 235, 170, '];
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = 1.0;
        this.decay = Math.random() * 0.012 + 0.005;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
        this.wobbleAngle = Math.random() * Math.PI * 2;
        this.wobbleStrength = Math.random() * 0.6;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.04;
        if (isBurst) {
            const a = Math.random() * Math.PI * 2;
            const sp = Math.random() * 6 + 1.5;
            this.vx = Math.cos(a) * sp;
            this.vy = Math.sin(a) * sp;
        } else {
            this.vx = (Math.random() - 0.5) * 1.0;
            this.vy = -Math.random() * 1.5 - 0.4;
        }
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.x += Math.sin(this.wobbleAngle) * this.wobbleStrength;
        this.wobbleAngle += this.wobbleSpeed;
        this.angle += this.spin;
        this.alpha -= this.decay;
        this.vx *= 0.97;
        this.vy *= 0.97;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        if (this.type === 'star') {
            ctx.fillStyle = `rgba(255, 253, 235, ${this.alpha})`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(255, 200, 0, 1)';
            drawFourPointStar(ctx, this.x, this.y, this.size * 2.8, this.size * 0.5, this.angle);
        } else if (this.type === 'dust') {
            ctx.fillStyle = this.colorBase + this.alpha + ')';
            ctx.shadowBlur = 4;
            ctx.shadowColor = this.colorBase.replace(', ', ')');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3.0);
            grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
            grad.addColorStop(0.3, this.colorBase + this.alpha * 0.85 + ')');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3.0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

function drawFourPointStar(ctx, x, y, outerRadius, innerRadius, rotation) {
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
        let a = (i * Math.PI / 2) + rotation;
        ctx.lineTo(x + Math.cos(a) * outerRadius, y + Math.sin(a) * outerRadius);
        a += Math.PI / 4;
        ctx.lineTo(x + Math.cos(a) * innerRadius, y + Math.sin(a) * innerRadius);
    }
    ctx.closePath();
    ctx.fill();
}

// 玫瑰爆发爆发粒子
function triggerRoseBurst() {
    const pCanvas = document.getElementById('particle-canvas');
    if (!pCanvas) return;
    
    // 【核心安全保护】：强制设置缓冲区，防止转场拉伸引起的像素偏移
    if (pCanvas.width !== 400 || pCanvas.height !== 400) {
        pCanvas.width = 400;
        pCanvas.height = 400;
    }
    
    const cx = pCanvas.width / 2;
    const cy = pCanvas.height / 2;
    for (let i = 0; i < 80; i++) particles2D.push(new Particle2D(cx, cy, true));
}

function updateParticles() {
    const pCanvas = document.getElementById('particle-canvas');
    if (!pCanvas) return;
    
    // 【核心安全保护】：强制设置缓冲区
    if (pCanvas.width !== 400 || pCanvas.height !== 400) {
        pCanvas.width = 400;
        pCanvas.height = 400;
    }
    
    const pCtx = pCanvas.getContext('2d');
    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    
    // 动态提取画布中心点，确保在任何场景下粒子都从玫瑰正中心喷射
    const cx = pCanvas.width / 2;
    const cy = pCanvas.height / 2;

    if (!window.isNearRose && Math.random() < 0.025) particles2D.push(new Particle2D(cx, cy, false));
    if (window.isNearRose && Math.random() < 0.35) particles2D.push(new Particle2D(cx, cy, false));
    
    for (let i = particles2D.length - 1; i >= 0; i--) {
        const p = particles2D[i];
        p.update();
        p.draw(pCtx);
        if (p.alpha <= 0) particles2D.splice(i, 1);
    }
    requestAnimationFrame(updateParticles);
}

// 2D 流星
class Meteor2D {
    constructor(camX, vWidth, vHeight) {
        this.x = camX + Math.random() * (vWidth + 300);
        this.y = -80 - Math.random() * 120;
        this.angle = Math.PI * 0.74 + (Math.random() - 0.5) * 0.08;
        const isBig = Math.random() < 0.25;
        if (isBig) {
            this.thickness = Math.random() * 3.5 + 4.0;
            this.length = Math.random() * 180 + 220;
            this.speed = Math.random() * 8 + 14;
            this.maxAlpha = Math.random() * 0.2 + 0.8;
            this.alpha = this.maxAlpha;
            this.decay = Math.random() * 0.008 + 0.004;
        } else {
            this.thickness = Math.random() * 1.2 + 0.6;
            this.length = Math.random() * 80 + 50;
            this.speed = Math.random() * 8 + 10;
            this.maxAlpha = Math.random() * 0.3 + 0.5;
            this.alpha = this.maxAlpha;
            this.decay = Math.random() * 0.012 + 0.008;
        }
        const colors = [
            { head: '#ffffff', tail: 'rgba(186, 142, 255, 0)' },
            { head: '#ffffff', tail: 'rgba(255, 105, 180, 0)' },
            { head: '#e0f7ff', tail: 'rgba(0, 191, 255, 0)' },
            { head: '#fffdf0', tail: 'rgba(255, 215, 0, 0)' },
            { head: '#f0fff5', tail: 'rgba(100, 255, 170, 0)' }
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.alpha -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const tailX = this.x - Math.cos(this.angle) * this.length;
        const tailY = this.y - Math.sin(this.angle) * this.length;
        const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${this.alpha})`);
        grad.addColorStop(0.15, this.color.tail.replace('0)', `${this.alpha * 0.7})`));
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.shadowBlur = this.thickness * 4.0;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function updateMeteorsFX(camX) {
    const skyCanvas = document.getElementById('sky-canvas');
    if (!skyCanvas) return;
    const sCtx = skyCanvas.getContext('2d');
    sCtx.clearRect(0, 0, skyCanvas.width, skyCanvas.height);
    if (Math.random() < 0.01) meteors2D.push(new Meteor2D(camX, viewWidth, viewHeight));
    for (let i = meteors2D.length - 1; i >= 0; i--) {
        const m = meteors2D[i];
        m.update();
        m.draw(sCtx);
        if (m.alpha <= 0 || m.y > viewHeight || m.x < camX - 200) meteors2D.splice(i, 1);
    }
}