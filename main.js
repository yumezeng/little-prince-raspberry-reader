// =================================================================
// 1. 树莓派 Socket.io 通信逻辑映射
// =================================================================
const RASPBERRY_PI_IP = "10.121.236.236";
const socket = io(`http://${RASPBERRY_PI_IP}:5000`, {
    transports: ['websocket']
});
socket.on('connect', () => {
    console.log("已成功连接到树莓派硬件端！");
});

// 第一动作：监听 'pat_head' 信号 ➔ 触发 3D 星球降落
socket.on('pat_head', (msg) => {
    console.log("收到硬件信号：检测到拍拍头，启动 3D 降落动画...");
    triggerPatHeadLanding();
});

// 第二动作：监听 'pat_back' 信号 ➔ 触发转场至 2D 游戏
socket.on('pat_back', () => {
    console.log("收到硬件信号：检测到抚摸背部，开始播放转场动画，进入 2D 星球...");
    onDocumentClick();
});

// ========== 召唤狐狸信号 ==========
socket.on('summon_fox', () => {
    console.log("召唤狐狸");
    if (typeof window.summonFox === 'function') {
        window.summonFox();
    } else {
        console.warn("summonFox 函数未找到");
    }
});

// ========== 捏耳朵触发语录信号 ==========
socket.on('touch_ear', () => {
    console.log("捏耳朵触发语录");
    triggerQuoteAndLookUp();
});

// ========== 手势识别信号 ==========
socket.on('gesture', (data) => {
    console.log("收到手势信号:", data);
    let gesture = data.value || data;
    console.log("手势方向:", gesture);

    // 左右手势：控制小狐狸
    if (gesture === 'left') {
        console.log("向左手势 - 控制狐狸向左");
        if (typeof window.handleFoxDirection === 'function') {
            window.handleFoxDirection('left');
        } else {
            console.warn("狐狸行走模块未加载");
        }
    } else if (gesture === 'right') {
        console.log("向右手势 - 控制狐狸向右");
        if (typeof window.handleFoxDirection === 'function') {
            window.handleFoxDirection('right');
        } else {
            console.warn("狐狸行走模块未加载");
        }
    }
    // 上下手势：触发烟花和爱心
    else if (gesture === 'up') {
        console.log("向上手势 - 触发烟花");
        if (typeof window.showFireworks === 'function') {
            window.showFireworks();
        } else {
            console.log("烟花效果: 暂无实现");
        }
    } else if (gesture === 'down') {
        console.log("向下手势 - 触发爱心");
        if (typeof window.showHearts === 'function') {
            window.showHearts();
        } else {
            console.log("爱心效果: 暂无实现");
        }
    }
});

// 第三动作：接收并解析表情信号
socket.on('emotion', (data) => {
    console.log("收到树莓派情绪信号:", data);
    let emotionVal = "";

    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            emotionVal = parsed.value;
        } catch (e) {
            emotionVal = data;
        }
    } else if (data && data.value) {
        emotionVal = data.value;
    } else {
        emotionVal = data;
    }

    if (typeof handleEmotionInput === 'function') {
        handleEmotionInput(emotionVal);
    }
});

// ========== 狐狸方向控制监听 ==========
socket.on('fox_direction', (data) => {
    console.log("收到树莓派狐狸方向信号:", data);
    if (data && data.direction) {
        if (typeof window.handleFoxDirection === 'function') {
            window.handleFoxDirection(data.direction);
        } else {
            console.warn("狐狸行走模块未加载，无法响应方向指令");
        }
    }
});

// =================================================================
// 2. 本地网页测试 - 控制面板调试按钮绑定
// =================================================================
const btnHead = document.getElementById('debug-btn-head');
if (btnHead) {
    btnHead.addEventListener('click', () => {
        console.log("调试触发：模拟拍头进行 3D 降落...");
        triggerPatHeadLanding();
    });
}

const btnBack = document.getElementById('debug-btn-back');
if (btnBack) {
    btnBack.addEventListener('click', () => {
        console.log("调试触发：模拟抚背进行转场...");
        onDocumentClick();
    });
}

// 捏耳朵触发语录按钮
const btnQuote = document.getElementById('debug-btn-quote');
if (btnQuote) {
    btnQuote.addEventListener('click', () => {
        console.log("调试触发：捏耳朵触发语录...");
        triggerQuoteAndLookUp();
    });
}

// 召唤狐狸按钮
const btnSummonFox = document.getElementById('debug-btn-summon-fox');
if (btnSummonFox) {
    btnSummonFox.addEventListener('click', () => {
        console.log("调试触发：召唤小狐狸");
        if (typeof window.summonFox === 'function') {
            window.summonFox();
        } else {
            console.warn("summonFox 函数未找到，请确保 foxWalk.js 已加载");
        }
    });
}

// =================================================================
// 3. 全局函数
// =================================================================
function triggerQuoteAndLookUp() {
    const roseWrapper = document.getElementById('rose-game-wrapper');
    const isRoseGameActive = roseWrapper && roseWrapper.classList.contains('show');

    if (isRoseGameActive) {
        if (typeof window.showRandomQuote === 'function') {
            window.showRandomQuote();
        } else if (typeof showRandomQuote === 'function') {
            showRandomQuote();
        } else {
            console.log("语录功能尚未初始化，请等待2D游戏加载完成");
        }
    } else {
        console.log("2D游戏尚未激活，请在转场后再试");
    }
}

// 全局效果函数占位符
window.handleFoxDirection = window.handleFoxDirection || function(direction) {
    console.log("狐狸方向:", direction);
};

window.showFireworks = window.showFireworks || function() {
    console.log("播放烟花效果");
};

window.showHearts = window.showHearts || function() {
    console.log("播放爱心效果");
};

window.summonFox = window.summonFox || function() {
    console.log("召唤狐狸（占位符）");
};

window.showRandomQuote = window.showRandomQuote || function() {
    console.log("显示随机语录（占位符）");
};
