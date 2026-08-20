/**
 * 👾 琴嵐 インベーダー（専用スクリプト）
 * ・ドット絵 力士＆提灯インベーダー
 */
(function () {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 🔊 サウンド
    let audioCtx = null;
    function getAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playTone(freq, type, duration, gainVal = 0.15) {
        try {
            const ac = getAudio();
            const osc = ac.createOscillator();
            const g = ac.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ac.currentTime);
            g.gain.setValueAtTime(gainVal, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + duration);
            osc.connect(g); g.connect(ac.destination);
            osc.start(); osc.stop(ac.currentTime + duration);
        } catch (e) {}
    }

    // 🎨 ドット絵パレット＆マトリクス
    // 提灯ドット絵 (8x8)
    const SPRITE_LANTERN = [
        [0,0,1,1,1,1,0,0],
        [0,2,3,3,3,3,2,0],
        [2,3,3,3,3,3,3,2],
        [2,3,4,4,4,4,3,2],
        [2,3,4,4,4,4,3,2],
        [2,3,3,3,3,3,3,2],
        [0,2,3,3,3,3,2,0],
        [0,0,1,1,1,1,0,0]
    ];
    const COLOR_LANTERN = { 1: '#552211', 2: '#e76f51', 3: '#f4a261', 4: '#2c2520' };

    // 大将・力士顔ドット絵 (8x8)
    const SPRITE_SUMO_FACE = [
        [0,0,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,0],
        [0,2,2,2,2,2,2,0],
        [2,3,2,2,2,2,3,2],
        [2,2,4,2,2,4,2,2],
        [0,2,2,5,5,2,2,0],
        [0,0,2,2,2,2,0,0],
        [0,0,6,6,6,6,0,0]
    ];
    const COLOR_SUMO_FACE = { 1: '#1a1a1a', 2: '#fcd5b5', 3: '#e09f7a', 4: '#1a1a1a', 5: '#d62828', 6: '#2a9d8f' };

    // プレイヤー力士ドット絵 (12x12)
    const SPRITE_PLAYER = [
        [0,0,0,0,1,1,1,1,0,0,0,0],
        [0,0,0,1,1,1,1,1,1,0,0,0],
        [0,0,2,2,2,2,2,2,2,2,0,0],
        [0,2,2,3,2,2,2,2,3,2,2,0],
        [0,2,2,2,2,4,4,2,2,2,2,0],
        [0,0,2,2,2,2,2,2,2,2,0,0],
        [0,0,2,2,5,5,5,5,2,2,0,0],
        [0,2,2,5,5,5,5,5,5,2,2,0],
        [2,2,2,5,5,5,5,5,5,2,2,2],
        [0,0,2,5,5,5,5,5,5,2,0,0],
        [0,0,2,2,0,0,0,0,2,2,0,0],
        [0,0,1,1,0,0,0,0,1,1,0,0]
    ];
    const COLOR_PLAYER = { 1: '#111', 2: '#fcd5b5', 3: '#222', 4: '#d62828', 5: '#9e2a2b' };

    function drawPixelSprite(sprite, colors, startX, startY, pixelSize) {
        for (let r = 0; r < sprite.length; r++) {
            for (let c = 0; c < sprite[r].length; c++) {
                const val = sprite[r][c];
                if (val && colors[val]) {
                    ctx.fillStyle = colors[val];
                    ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }

    const state = {
        score: 0, highScore: 0,
        status: 'PLAY',
        player: { x: 160, y: 430, w: 36, h: 36, speed: 4.5 },
        bullets: [],
        invaders: [],
        dir: 1, speed: 0.8,
        shootCooldown: 0,
        keys: { left: false, right: false, shoot: false }
    };

    function initInvaders() {
        state.invaders = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 6; c++) {
                state.invaders.push({
                    x: 35 + c * 48,
                    y: 80 + r * 42,
                    type: r === 1 ? 'face' : 'lantern',
                    alive: true,
                    pts: r === 1 ? 30 : 10
                });
            }
        }
        state.dir = 1;
        state.speed = 0.8;
    }

    function resetGame() {
        state.score = 0;
        state.bullets = [];
        state.player.x = 160;
        initInvaders();
        state.status = 'PLAY';
    }

    function update() {
        if (state.status !== 'PLAY') return;

        // 自機移動
        if (state.keys.left && state.player.x > 15) state.player.x -= state.player.speed;
        if (state.keys.right && state.player.x < canvas.width - state.player.w - 15) state.player.x += state.player.speed;

        // 弾発射
        if (state.shootCooldown > 0) state.shootCooldown--;
        if (state.keys.shoot && state.shootCooldown <= 0) {
            state.bullets.push({
                x: state.player.x + state.player.w / 2 - 2,
                y: state.player.y,
                w: 4, h: 10
            });
            state.shootCooldown = 16;
            playTone(800, 'square', 0.04, 0.15);
        }

        // 弾更新
        for (let i = state.bullets.length - 1; i >= 0; i--) {
            const b = state.bullets[i];
            b.y -= 7;
            if (b.y < 40) {
                state.bullets.splice(i, 1);
                continue;
            }

            for (let j = 0; j < state.invaders.length; j++) {
                const inv = state.invaders[j];
                if (inv.alive &&
                    b.x + b.w > inv.x && b.x < inv.x + 28 &&
                    b.y < inv.y + 28 && b.y + b.h > inv.y) {
                    inv.alive = false;
                    state.score += inv.pts;
                    if (state.score > state.highScore) state.highScore = state.score;
                    state.bullets.splice(i, 1);
                    playTone(200, 'sawtooth', 0.08, 0.2);
                    break;
                }
            }
        }

        // 敵移動
        const aliveInvaders = state.invaders.filter(inv => inv.alive);
        if (aliveInvaders.length === 0) {
            state.status = 'CLEAR';
            playTone(1000, 'sine', 0.4, 0.3);
            return;
        }

        let shiftDown = false;
        aliveInvaders.forEach(inv => {
            if ((inv.x + 28 >= canvas.width - 15 && state.dir > 0) ||
                (inv.x <= 15 && state.dir < 0)) {
                shiftDown = true;
            }
        });

        if (shiftDown) {
            state.dir *= -1;
            aliveInvaders.forEach(inv => {
                inv.y += 14;
                if (inv.y + 28 >= state.player.y) {
                    state.status = 'GAMEOVER';
                    playTone(100, 'sawtooth', 0.4, 0.4);
                }
            });
            state.speed += 0.15;
        } else {
            aliveInvaders.forEach(inv => {
                inv.x += state.dir * state.speed;
            });
        }
    }

    function draw() {
        ctx.fillStyle = '#0e0e12';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 枠
        ctx.strokeStyle = '#9e2a2b';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // スコア
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${state.score}`, 20, 32);
        ctx.textAlign = 'right';
        ctx.fillText(`HI: ${state.highScore}`, canvas.width - 20, 32);

        // インベーダー描画
        state.invaders.forEach(inv => {
            if (inv.alive) {
                if (inv.type === 'lantern') {
                    drawPixelSprite(SPRITE_LANTERN, COLOR_LANTERN, inv.x, inv.y, 3.5);
                } else {
                    drawPixelSprite(SPRITE_SUMO_FACE, COLOR_SUMO_FACE, inv.x, inv.y, 3.5);
                }
            }
        });

        // 弾描画
        ctx.fillStyle = '#ffff00';
        state.bullets.forEach(b => {
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        // プレイヤー力士描画
        drawPixelSprite(SPRITE_PLAYER, COLOR_PLAYER, state.player.x, state.player.y, 3);

        // オーバーレイ
        if (state.status === 'GAMEOVER') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(20, 180, canvas.width - 40, 140);
            ctx.fillStyle = '#ff3366';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', 180, 235);
            ctx.fillStyle = '#fff';
            ctx.font = '13px sans-serif';
            ctx.fillText('タップで再挑戦！', 180, 275);
        } else if (state.status === 'CLEAR') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(20, 180, canvas.width - 40, 140);
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✨ 全滅！ごっつあんです！ ✨', 180, 235);
            ctx.fillStyle = '#fff';
            ctx.font = '13px sans-serif';
            ctx.fillText('タップで次のラウンドへ！', 180, 275);
        }
    }

    let animId = null;
    function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
    }

    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function handleTouch(p) {
        getAudio();
        if (state.status !== 'PLAY') {
            resetGame();
            return;
        }
        state.player.x = Math.max(15, Math.min(canvas.width - state.player.w - 15, p.x - state.player.w / 2));
        state.keys.shoot = true;
    }

    canvas.addEventListener('mousedown', (e) => handleTouch(getCoords(e)));
    canvas.addEventListener('mousemove', (e) => {
        if (state.status === 'PLAY') {
            const p = getCoords(e);
            state.player.x = Math.max(15, Math.min(canvas.width - state.player.w - 15, p.x - state.player.w / 2));
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleTouch(getCoords(e));
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (state.status === 'PLAY') {
            e.preventDefault();
            const p = getCoords(e);
            state.player.x = Math.max(15, Math.min(canvas.width - state.player.w - 15, p.x - state.player.w / 2));
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => { state.keys.shoot = false; });

    window.addEventListener('keydown', (e) => {
        if (canvas.style.display === 'none') return;
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') state.keys.left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') state.keys.right = true;
        if (e.code === 'Space') {
            e.preventDefault();
            if (state.status !== 'PLAY') resetGame();
            else state.keys.shoot = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') state.keys.left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') state.keys.right = false;
        if (e.code === 'Space') state.keys.shoot = false;
    });

    initInvaders();

    window.initGame = function () {
        if (!animId) loop();
    };

    window.stopGame = function () {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    };
})();
