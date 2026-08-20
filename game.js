/**
 * 🎮 地鶏家 琴嵐 - アーケードゲームコレクション
 * 1. 🎰 3リール本格パチスロ「パチスロ 琴嵐」
 * 2. 👾 レトロシューティング「琴嵐 インベーダー」
 */

(function () {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let currentGame = 'slot'; // 'slot' or 'invader'
    let animationId = null;

    // ==========================================================================
    // 🔊 共通 Web Audio API（効果音）
    // ==========================================================================
    let audioCtx = null;
    function getAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playTone(freq, type, duration, gainVal = 0.2) {
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

    // ==========================================================================
    // 🎰 ゲーム1: パチスロ 琴嵐
    // ==========================================================================
    const SYMBOLS = {
        SEVEN:   { id: 0, name: '7', color: '#ff2a2a', pay: 300 },
        CHANKO:  { id: 1, name: 'ちゃんこ', icon: '🍲', pay: 100 },
        BELL:    { id: 2, name: 'ベル', icon: '🔔', pay: 10 },
        CHICKEN: { id: 3, name: '地鶏', icon: '🍗', pay: 8 },
        BEER:    { id: 4, name: 'ビール', icon: '🍺', pay: 5 },
        REPLAY:  { id: 5, name: 'リプレイ', icon: '🔄', pay: 0 }
    };

    const REEL_STRIP = [
        SYMBOLS.SEVEN,   SYMBOLS.REPLAY,  SYMBOLS.BELL,    SYMBOLS.CHICKEN,
        SYMBOLS.CHANKO,  SYMBOLS.BEER,    SYMBOLS.BELL,    SYMBOLS.SEVEN,
        SYMBOLS.CHICKEN, SYMBOLS.REPLAY,  SYMBOLS.CHANKO,  SYMBOLS.BELL,
        SYMBOLS.BEER,    SYMBOLS.SEVEN,   SYMBOLS.REPLAY,  SYMBOLS.CHICKEN,
        SYMBOLS.BELL,    SYMBOLS.CHANKO,  SYMBOLS.BEER,    SYMBOLS.REPLAY,
        SYMBOLS.BELL
    ];

    const slotState = {
        credit: 50, bet: 3, win: 0, isReplay: false,
        status: 'IDLE', flashLamp: false, lampGlow: 0,
        message: 'STARTボタンでレバーオン！',
        reels: [
            { pos: 0, speed: 0, spinning: false, stopped: true },
            { pos: 7, speed: 0, spinning: false, stopped: true },
            { pos: 14, speed: 0, spinning: false, stopped: true }
        ],
        btnStart: { x: 40, y: 310, w: 280, h: 44 },
        btnStops: [
            { x: 40,  y: 370, w: 80, h: 55, active: false },
            { x: 140, y: 370, w: 80, h: 55, active: false },
            { x: 240, y: 370, w: 80, h: 55, active: false }
        ],
        winLines: []
    };

    function startSlotSpin() {
        if (slotState.status !== 'IDLE') return;
        getAudio();

        if (!slotState.isReplay) {
            if (slotState.credit < slotState.bet) {
                slotState.credit += 50;
                slotState.message = 'メダル自動補充(+50枚)';
            }
            slotState.credit -= slotState.bet;
        } else {
            slotState.isReplay = false;
            slotState.message = 'REPLAY！メダル消費なし';
        }

        slotState.win = 0;
        slotState.winLines = [];
        slotState.status = 'SPINNING';
        playTone(300, 'sawtooth', 0.12, 0.3);

        // 内部抽選 (4% BIG, 5% REG)
        const rand = Math.random() * 100;
        if (rand < 9) {
            slotState.flashLamp = true;
            playTone(120, 'sawtooth', 0.15, 0.5); // ガコッ音
            slotState.message = '⚡ 嵐ランプ点灯！激アツ！ ⚡';
        }

        slotState.reels.forEach((r, idx) => {
            r.spinning = true;
            r.stopped = false;
            r.speed = 0.45;
            slotState.btnStops[idx].active = true;
        });
    }

    function stopSlotReel(index) {
        const r = slotState.reels[index];
        if (!r.spinning || r.stopped) return;

        playTone(180, 'square', 0.08, 0.3);
        r.spinning = false;
        r.stopped = true;
        slotState.btnStops[index].active = false;
        r.pos = Math.round(r.pos) % REEL_STRIP.length;

        if (slotState.reels.every(reel => reel.stopped)) {
            checkSlotResult();
        }
    }

    function checkSlotResult() {
        slotState.status = 'PAYING';
        slotState.winLines = [];
        let payout = 0;
        let isRep = false;
        let isBig = false;

        const grid = slotState.reels.map(r => {
            const c = Math.round(r.pos) % REEL_STRIP.length;
            const t = (c - 1 + REEL_STRIP.length) % REEL_STRIP.length;
            const b = (c + 1) % REEL_STRIP.length;
            return [REEL_STRIP[t], REEL_STRIP[c], REEL_STRIP[b]];
        });

        const lines = [
            { slots: [grid[0][0], grid[1][0], grid[2][0]], y: 130 },
            { slots: [grid[0][1], grid[1][1], grid[2][1]], y: 190 },
            { slots: [grid[0][2], grid[1][2], grid[2][2]], y: 250 },
            { slots: [grid[0][0], grid[1][1], grid[2][2]], diag: 'down' },
            { slots: [grid[0][2], grid[1][1], grid[2][0]], diag: 'up' }
        ];

        lines.forEach(l => {
            const [s1, s2, s3] = l.slots;
            if (s1.id === s2.id && s2.id === s3.id) {
                slotState.winLines.push(l);
                payout += s1.pay;
                if (s1.id === SYMBOLS.REPLAY.id) isRep = true;
                if (s1.id === SYMBOLS.SEVEN.id) isBig = true;
            }
        });

        if (payout > 0 || isRep) {
            slotState.win = payout;
            slotState.credit += payout;
            slotState.isReplay = isRep;

            if (isBig) {
                slotState.message = '🎉 BIG BONUS 300枚獲得！ 🎉';
                playTone(523, 'triangle', 0.4, 0.4);
            } else if (isRep) {
                slotState.message = '🔄 REPLAY！もう1回無料！';
                playTone(987, 'sine', 0.1, 0.2);
            } else {
                slotState.message = `✨ ${payout}枚 払い出し！ ごっつあんです！`;
                playTone(987, 'sine', 0.1, 0.2);
            }
        } else {
            slotState.message = 'ハズレ… 次回に期待！';
        }

        if (payout >= 100 || !slotState.flashLamp) {
            slotState.flashLamp = false;
        }

        setTimeout(() => { slotState.status = 'IDLE'; }, 500);
    }

    function drawSlot() {
        ctx.fillStyle = '#1e1815';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 枠装飾
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // 告知ランプ ＆ メーター
        ctx.fillStyle = '#2c221e';
        ctx.fillRect(15, 15, 330, 70);
        ctx.strokeStyle = '#8c7025';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, 330, 70);

        if (slotState.flashLamp) {
            slotState.lampGlow = (slotState.lampGlow + 0.15) % Math.PI;
            ctx.fillStyle = `rgba(255, 20, 100, ${0.7 + Math.sin(slotState.lampGlow) * 0.3})`;
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 20;
        } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#443333';
        }
        ctx.font = 'bold 22px "Noto Serif JP", serif';
        ctx.textAlign = 'left';
        ctx.fillText('⚡嵐⚡', 25, 45);
        ctx.font = '10px sans-serif';
        ctx.fillText('CHANCE', 28, 62);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#f4a261';
        ctx.font = 'bold 17px "Noto Serif JP", serif';
        ctx.textAlign = 'center';
        ctx.fillText('パチスロ 琴嵐', 180, 42);

        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(230, 23, 105, 54);
        ctx.fillStyle = '#00ffcc';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`CREDIT:${slotState.credit}`, 236, 40);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`BET:   ${slotState.bet}`, 236, 54);
        ctx.fillStyle = '#ff3366';
        ctx.fillText(`WIN:   ${slotState.win}`, 236, 68);

        // リール窓
        const reelY = 100;
        const rowH = 60;
        const reelW = 80;
        const reelX = [40, 140, 240];

        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(25, reelY - 5, 310, rowH * 3 + 10);
        ctx.strokeStyle = '#9e2a2b';
        ctx.lineWidth = 3;
        ctx.strokeRect(25, reelY - 5, 310, rowH * 3 + 10);

        slotState.reels.forEach((r, i) => {
            if (r.spinning) r.pos = (r.pos + r.speed) % REEL_STRIP.length;

            const rx = reelX[i];
            const baseIndex = Math.floor(r.pos);
            const offset = (r.pos - baseIndex) * rowH;

            ctx.save();
            ctx.beginPath();
            ctx.rect(rx, reelY, reelW, rowH * 3);
            ctx.clip();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(rx, reelY, reelW, rowH * 3);

            for (let row = -1; row <= 4; row++) {
                const sIdx = (baseIndex + row + REEL_STRIP.length * 2) % REEL_STRIP.length;
                const sym = REEL_STRIP[sIdx];
                const sy = reelY + row * rowH - offset;

                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 1;
                ctx.strokeRect(rx, sy, reelW, rowH);

                if (sym.id === SYMBOLS.SEVEN.id) {
                    ctx.fillStyle = sym.color;
                    ctx.font = 'bold 36px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('7', rx + reelW / 2, sy + 44);
                } else {
                    ctx.font = '28px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(sym.icon, rx + reelW / 2, sy + 38);
                    ctx.fillStyle = '#333';
                    ctx.font = 'bold 10px sans-serif';
                    ctx.fillText(sym.name, rx + reelW / 2, sy + 53);
                }
            }

            // シャドウ
            const grad = ctx.createLinearGradient(rx, reelY, rx, reelY + rowH * 3);
            grad.addColorStop(0, 'rgba(0,0,0,0.4)');
            grad.addColorStop(0.15, 'rgba(0,0,0,0)');
            grad.addColorStop(0.85, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(0,0,0,0.4)');
            ctx.fillStyle = grad;
            ctx.fillRect(rx, reelY, reelW, rowH * 3);

            ctx.restore();
        });

        // 当たりライン描画
        if (slotState.winLines.length > 0) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 4;
            slotState.winLines.forEach(l => {
                ctx.beginPath();
                if (l.y) {
                    ctx.moveTo(30, l.y); ctx.lineTo(330, l.y);
                } else if (l.diag === 'down') {
                    ctx.moveTo(35, 130); ctx.lineTo(325, 250);
                } else if (l.diag === 'up') {
                    ctx.moveTo(35, 250); ctx.lineTo(325, 130);
                }
                ctx.stroke();
            });
        }

        // メッセージバー
        ctx.fillStyle = '#111';
        ctx.fillRect(25, 283, 310, 22);
        ctx.fillStyle = '#00ffcc';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slotState.message, 180, 298);

        // スタートボタン
        const canStart = slotState.status === 'IDLE';
        ctx.fillStyle = canStart ? '#f4a261' : '#555';
        ctx.beginPath();
        ctx.roundRect(slotState.btnStart.x, slotState.btnStart.y, slotState.btnStart.w, slotState.btnStart.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.fillStyle = canStart ? '#2c2520' : '#888';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slotState.isReplay ? '🔄 REPLAY START (0枚)' : '🎰 START / レバーオン (3枚)', 180, slotState.btnStart.y + 28);

        // ストップボタン
        slotState.btnStops.forEach((b, idx) => {
            ctx.fillStyle = b.active ? '#9e2a2b' : '#333';
            ctx.beginPath();
            ctx.roundRect(b.x, b.y, b.w, b.h, 8);
            ctx.fill();
            ctx.strokeStyle = b.active ? '#ffcccc' : '#555';
            ctx.stroke();
            ctx.fillStyle = b.active ? '#fff' : '#777';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText(`STOP ${idx + 1}`, b.x + b.w / 2, b.y + 33);
        });

        // フッター案内
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.fillText('PC: Space(スタート) / Z, X, C(ストップ)', 180, 455);
        ctx.fillText('7揃い:300枚 / 鍋:100枚 / ベル:10枚 / 地鶏:8枚', 180, 475);
    }

    // ==========================================================================
    // 👾 ゲーム2: 琴嵐 インベーダー
    // ==========================================================================
    const invaderState = {
        score: 0,
        highScore: 0,
        lives: 3,
        status: 'START', // 'START', 'PLAY', 'GAMEOVER', 'CLEAR'
        player: { x: 160, y: 440, w: 32, h: 20, speed: 4.5 },
        bullets: [],
        invaders: [],
        invaderSpeed: 1,
        invaderDir: 1,
        shootCooldown: 0,
        keys: { left: false, right: false, shoot: false }
    };

    function initInvaders() {
        invaderState.invaders = [];
        const rows = 4;
        const cols = 6;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                invaderState.invaders.push({
                    x: 35 + c * 48,
                    y: 60 + r * 38,
                    w: 28,
                    h: 24,
                    alive: true,
                    type: r === 0 ? '🍗' : (r === 1 ? '🍺' : '🍲'),
                    pts: (4 - r) * 10
                });
            }
        }
        invaderState.invaderSpeed = 1;
        invaderState.invaderDir = 1;
    }

    function resetInvaderGame() {
        invaderState.score = 0;
        invaderState.lives = 3;
        invaderState.bullets = [];
        invaderState.player.x = 160;
        initInvaders();
        invaderState.status = 'PLAY';
    }

    function updateInvaders() {
        if (invaderState.status !== 'PLAY') return;

        // 自機移動
        if (invaderState.keys.left && invaderState.player.x > 15) {
            invaderState.player.x -= invaderState.player.speed;
        }
        if (invaderState.keys.right && invaderState.player.x < canvas.width - invaderState.player.w - 15) {
            invaderState.player.x += invaderState.player.speed;
        }

        // 弾発射
        if (invaderState.shootCooldown > 0) invaderState.shootCooldown--;
        if (invaderState.keys.shoot && invaderState.shootCooldown <= 0) {
            invaderState.bullets.push({
                x: invaderState.player.x + invaderState.player.w / 2 - 2,
                y: invaderState.player.y,
                w: 4, h: 10
            });
            invaderState.shootCooldown = 18;
            playTone(800, 'square', 0.04, 0.15);
        }

        // 弾移動
        for (let i = invaderState.bullets.length - 1; i >= 0; i--) {
            const b = invaderState.bullets[i];
            b.y -= 7;
            if (b.y < 30) {
                invaderState.bullets.splice(i, 1);
                continue;
            }

            // 弾とインベーダーの衝突
            for (let j = 0; j < invaderState.invaders.length; j++) {
                const inv = invaderState.invaders[j];
                if (inv.alive &&
                    b.x + b.w > inv.x && b.x < inv.x + inv.w &&
                    b.y < inv.y + inv.h && b.y + b.h > inv.y) {
                    inv.alive = false;
                    invaderState.score += inv.pts;
                    if (invaderState.score > invaderState.highScore) {
                        invaderState.highScore = invaderState.score;
                    }
                    invaderState.bullets.splice(i, 1);
                    playTone(200, 'sawtooth', 0.08, 0.2);
                    break;
                }
            }
        }

        // インベーダー移動
        let shiftDown = false;
        const living = invaderState.invaders.filter(inv => inv.alive);

        if (living.length === 0) {
            invaderState.status = 'CLEAR';
            playTone(1000, 'sine', 0.4, 0.3);
            return;
        }

        living.forEach(inv => {
            if ((inv.x + inv.w >= canvas.width - 15 && invaderState.invaderDir > 0) ||
                (inv.x <= 15 && invaderState.invaderDir < 0)) {
                shiftDown = true;
            }
        });

        if (shiftDown) {
            invaderState.invaderDir *= -1;
            living.forEach(inv => {
                inv.y += 12;
                if (inv.y + inv.h >= invaderState.player.y) {
                    invaderState.status = 'GAMEOVER';
                    playTone(100, 'sawtooth', 0.4, 0.4);
                }
            });
            invaderState.invaderSpeed += 0.15;
        } else {
            living.forEach(inv => {
                inv.x += invaderState.invaderDir * invaderState.invaderSpeed;
            });
        }
    }

    function drawInvader() {
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 枠
        ctx.strokeStyle = '#9e2a2b';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // スコアヘッダー
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${invaderState.score}`, 20, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`HI: ${invaderState.highScore}`, canvas.width - 20, 30);

        // インベーダー描画
        invaderState.invaders.forEach(inv => {
            if (inv.alive) {
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(inv.type, inv.x + inv.w / 2, inv.y + inv.h);
            }
        });

        // 弾描画
        ctx.fillStyle = '#ffff00';
        invaderState.bullets.forEach(b => {
            ctx.fillRect(b.x, b.y, b.w, b.h);
        });

        // 自機描画（力士・ちゃんこ鍋スタイル）
        ctx.fillStyle = '#f4a261';
        ctx.beginPath();
        ctx.roundRect(invaderState.player.x, invaderState.player.y, invaderState.player.w, invaderState.player.h, 4);
        ctx.fill();
        ctx.fillStyle = '#9e2a2b';
        ctx.fillRect(invaderState.player.x + invaderState.player.w / 2 - 4, invaderState.player.y - 6, 8, 6);
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#2c2520';
        ctx.textAlign = 'center';
        ctx.fillText('琴', invaderState.player.x + invaderState.player.w / 2, invaderState.player.y + 14);

        // ゲーム状態オーバーレイ
        if (invaderState.status === 'START') {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(10, 150, canvas.width - 20, 200);
            ctx.fillStyle = '#f4a261';
            ctx.font = 'bold 20px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText('👾 琴嵐 インベーダー', 180, 210);
            ctx.fillStyle = '#fff';
            ctx.font = '13px sans-serif';
            ctx.fillText('タップまたはSpaceでゲーム開始！', 180, 260);
        } else if (invaderState.status === 'GAMEOVER') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(10, 150, canvas.width - 20, 200);
            ctx.fillStyle = '#ff3366';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', 180, 220);
            ctx.fillStyle = '#fff';
            ctx.font = '13px sans-serif';
            ctx.fillText('タップで再挑戦！', 180, 270);
        } else if (invaderState.status === 'CLEAR') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(10, 150, canvas.width - 20, 200);
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✨ 全滅！ごっつあんです！ ✨', 180, 220);
            ctx.fillStyle = '#fff';
            ctx.font = '13px sans-serif';
            ctx.fillText('タップで次のラウンドへ！', 180, 270);
        }

        // フッター
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PC: ← → 移動 / Space 連射', 180, 480);
    }

    // ==========================================================================
    // 🕹️ メインループ ＆ イベントハンドラー
    // ==========================================================================
    function gameLoop() {
        if (currentGame === 'slot') {
            drawSlot();
        } else {
            updateInvaders();
            drawInvader();
        }
        animationId = requestAnimationFrame(gameLoop);
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

    function handleSlotTouch(p) {
        if (p.x >= slotState.btnStart.x && p.x <= slotState.btnStart.x + slotState.btnStart.w &&
            p.y >= slotState.btnStart.y && p.y <= slotState.btnStart.y + slotState.btnStart.h) {
            startSlotSpin();
            return;
        }
        slotState.btnStops.forEach((b, idx) => {
            if (b.active && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
                stopSlotReel(idx);
            }
        });
    }

    function handleInvaderTouch(p) {
        getAudio();
        if (invaderState.status !== 'PLAY') {
            resetInvaderGame();
            return;
        }
        invaderState.player.x = Math.max(15, Math.min(canvas.width - invaderState.player.w - 15, p.x - invaderState.player.w / 2));
        invaderState.keys.shoot = true;
    }

    canvas.addEventListener('mousedown', (e) => {
        const p = getCoords(e);
        if (currentGame === 'slot') handleSlotTouch(p);
        else handleInvaderTouch(p);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (currentGame === 'invader' && invaderState.status === 'PLAY') {
            const p = getCoords(e);
            invaderState.player.x = Math.max(15, Math.min(canvas.width - invaderState.player.w - 15, p.x - invaderState.player.w / 2));
        }
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const p = getCoords(e);
        if (currentGame === 'slot') handleSlotTouch(p);
        else handleInvaderTouch(p);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (currentGame === 'invader' && invaderState.status === 'PLAY') {
            e.preventDefault();
            const p = getCoords(e);
            invaderState.player.x = Math.max(15, Math.min(canvas.width - invaderState.player.w - 15, p.x - invaderState.player.w / 2));
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        if (currentGame === 'invader') invaderState.keys.shoot = false;
    });

    window.addEventListener('keydown', (e) => {
        const modal = document.getElementById('game-modal');
        if (!modal || !modal.classList.contains('active')) return;

        if (currentGame === 'slot') {
            if (e.code === 'Space') { e.preventDefault(); startSlotSpin(); }
            else if (e.code === 'KeyZ' || e.code === 'Digit1') stopSlotReel(0);
            else if (e.code === 'KeyX' || e.code === 'Digit2') stopSlotReel(1);
            else if (e.code === 'KeyC' || e.code === 'Digit3') stopSlotReel(2);
        } else {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') invaderState.keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') invaderState.keys.right = true;
            if (e.code === 'Space') {
                e.preventDefault();
                if (invaderState.status !== 'PLAY') resetInvaderGame();
                else invaderState.keys.shoot = true;
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (currentGame === 'invader') {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') invaderState.keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') invaderState.keys.right = false;
            if (e.code === 'Space') invaderState.keys.shoot = false;
        }
    });

    // ==========================================================================
    // 🌐 グローバル公開関数（タブ切り替え・モーダル連動）
    // ==========================================================================
    window.switchGame = function (gameName) {
        currentGame = gameName;
        document.querySelectorAll('.game-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.game === gameName);
        });

        const inst = document.getElementById('game-instruction-text');
        if (inst) {
            if (gameName === 'slot') {
                inst.innerHTML = 'PC: Space（スタート） / Z, X, C（ストップ）<br>スマホ: 画面のボタンをタップ';
            } else {
                inst.innerHTML = 'PC: ← →（移動） / Space（連射）<br>スマホ: 画面スライド（移動＆自動連射）';
            }
        }
    };

    window.initGame = function () {
        if (!animationId) {
            gameLoop();
        }
    };

    window.stopGame = function () {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    };
})();
