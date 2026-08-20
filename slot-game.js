/**
 * 🎰 パチスロ 琴嵐（音声修正＆BGM搭載版）
 * ・ブラウザ自動再生制限対応（AudioContext アンロック機構）
 * ・回転中8bit和風BGM ＆ 各種効果音（レバー・停止・告知・ファンファーレ）
 * ・上から下へのスムーズなリール回転
 * ・指定配当（7:100 / ちゃんこ:48 / ビール:24 / 地鶏:18 / ベル:6）
 */
(function () {
    const canvas = document.getElementById('slotGameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ==========================================================================
    // 🔊 サウンド ＆ BGMエンジン（Web Audio API 強力アンロック版）
    // ==========================================================================
    let audioCtx = null;

    function getAudio() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // ユーザー操作時の音声強制アンロック
    function unlockAudio() {
        const ac = getAudio();
        if (ac.state === 'suspended') {
            ac.resume();
        }
    }

    // 単音SE生成（安全な線形減衰）
    function playTone(freq, type, duration, gainVal = 0.25) {
        try {
            const ac = getAudio();
            const osc = ac.createOscillator();
            const g = ac.createGain();
            const now = ac.currentTime;

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);

            g.gain.setValueAtTime(gainVal, now);
            g.gain.linearRampToValueAtTime(0.001, now + duration);

            osc.connect(g);
            g.connect(ac.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {}
    }

    // 大当たりファンファーレ
    function playFanfare() {
        try {
            const ac = getAudio();
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            notes.forEach((freq, i) => {
                const now = ac.currentTime + (i * 0.12);
                const osc = ac.createOscillator();
                const g = ac.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                g.gain.setValueAtTime(0.35, now);
                g.gain.linearRampToValueAtTime(0.001, now + 0.35);

                osc.connect(g);
                g.connect(ac.destination);

                osc.start(now);
                osc.stop(now + 0.35);
            });
        } catch (e) {}
    }

    // 🎵 回転中 BGMシーケンサー（レトロ和風メロディループ）
    let bgmTimer = null;
    let bgmIndex = 0;
    const bgmNotes = [
        293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00,
        392.00, 440.00, 523.25, 587.33, 698.46, 587.33, 523.25, 440.00
    ];

    function startSpinBGM() {
        stopSpinBGM();
        bgmIndex = 0;
        const noteDuration = 0.12;

        bgmTimer = setInterval(() => {
            if (!state.reels.some(r => r.spinning)) {
                stopSpinBGM();
                return;
            }
            try {
                const ac = getAudio();
                const freq = bgmNotes[bgmIndex % bgmNotes.length];
                const now = ac.currentTime;

                const osc = ac.createOscillator();
                const g = ac.createGain();

                osc.type = 'square'; // 8bitゲーム調の矩形波
                osc.frequency.setValueAtTime(freq, now);

                g.gain.setValueAtTime(0.08, now); // 耳障りにならない適度な音量
                g.gain.linearRampToValueAtTime(0.001, now + noteDuration);

                osc.connect(g);
                g.connect(ac.destination);

                osc.start(now);
                osc.stop(now + noteDuration);

                bgmIndex++;
            } catch (e) {}
        }, noteDuration * 1000);
    }

    function stopSpinBGM() {
        if (bgmTimer) {
            clearInterval(bgmTimer);
            bgmTimer = null;
        }
    }

    // ==========================================================================
    // 🎰 図柄＆配当設定
    // ==========================================================================
    const SYMBOLS = {
        SEVEN:   { id: 0, name: '7',     color: '#ff2a2a', pay: 100 }, // 大当たり 100枚
        CHANKO:  { id: 1, name: 'ちゃんこ', icon: '🍲', pay: 48 },   // 48枚
        BEER:    { id: 2, name: '生ビール', icon: '🍺', pay: 24 },   // 24枚
        CHICKEN: { id: 3, name: '地鶏',   icon: '🍗', pay: 18 },   // 18枚
        BELL:    { id: 4, name: 'ベル',   icon: '🔔', pay: 6 },    // 6枚
        REPLAY:  { id: 5, name: 'リプレイ', icon: '🔄', pay: 0 }     // 再遊技
    };

    const REEL_STRIP = [
        SYMBOLS.SEVEN,   SYMBOLS.REPLAY,  SYMBOLS.BELL,    SYMBOLS.CHICKEN,
        SYMBOLS.BEER,    SYMBOLS.CHANKO,  SYMBOLS.BELL,    SYMBOLS.SEVEN,
        SYMBOLS.CHICKEN, SYMBOLS.REPLAY,  SYMBOLS.BEER,    SYMBOLS.BELL,
        SYMBOLS.CHANKO,  SYMBOLS.SEVEN,   SYMBOLS.REPLAY,  SYMBOLS.CHICKEN,
        SYMBOLS.BELL,    SYMBOLS.BEER,    SYMBOLS.CHANKO,  SYMBOLS.REPLAY,
        SYMBOLS.BELL
    ];

    const state = {
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

    function startSpin() {
        if (state.status !== 'IDLE') return;
        unlockAudio();

        if (!state.isReplay) {
            if (state.credit < state.bet) {
                state.credit += 50;
                state.message = 'メダル自動補充(+50枚)';
            }
            state.credit -= state.bet;
        } else {
            state.isReplay = false;
            state.message = 'REPLAY！メダル消費なし';
        }

        state.win = 0;
        state.winLines = [];
        state.status = 'SPINNING';
        playTone(300, 'sawtooth', 0.12, 0.3); // レバーオンSE

        // 内部抽選 (5%で7告知)
        const rand = Math.random() * 100;
        if (rand < 5) {
            state.flashLamp = true;
            playTone(110, 'sawtooth', 0.18, 0.6); // 告知「ガコッ！」音
            state.message = '⚡ 嵐ランプ点灯！7を狙え！ ⚡';
        }

        state.reels.forEach((r, idx) => {
            r.spinning = true;
            r.stopped = false;
            r.speed = 0.45;
            state.btnStops[idx].active = true;
        });

        startSpinBGM();
    }

    function stopReel(index) {
        const r = state.reels[index];
        if (!r.spinning || r.stopped) return;

        unlockAudio();
        playTone(180, 'square', 0.08, 0.35); // 停止SE（バシッ！）
        r.spinning = false;
        r.stopped = true;
        state.btnStops[index].active = false;
        
        r.pos = Math.round(r.pos) % REEL_STRIP.length;

        if (state.reels.every(reel => reel.stopped)) {
            stopSpinBGM();
            checkResult();
        }
    }

    function checkResult() {
        state.status = 'PAYING';
        state.winLines = [];
        let payout = 0;
        let isRep = false;
        let isBig = false;

        const grid = state.reels.map(r => {
            const c = (Math.round(r.pos) % REEL_STRIP.length + REEL_STRIP.length) % REEL_STRIP.length;
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
                state.winLines.push(l);
                payout += s1.pay;
                if (s1.id === SYMBOLS.REPLAY.id) isRep = true;
                if (s1.id === SYMBOLS.SEVEN.id) isBig = true;
            }
        });

        if (payout > 0 || isRep) {
            state.win = payout;
            state.credit += payout;
            state.isReplay = isRep;

            if (isBig) {
                state.message = '🎉 大当たり！ 7揃い 100枚獲得！ 🎉';
                playFanfare();
            } else if (isRep) {
                state.message = '🔄 REPLAY！もう1回無料！';
                playTone(880, 'sine', 0.12, 0.25);
            } else {
                state.message = `✨ ${payout}枚 払い出し！ ごっつあんです！`;
                playTone(880, 'sine', 0.12, 0.25);
            }
        } else {
            state.message = 'ハズレ… 次回に期待！';
        }

        if (isBig || !state.flashLamp) {
            state.flashLamp = false;
        }

        setTimeout(() => { state.status = 'IDLE'; }, 500);
    }

    function draw() {
        ctx.fillStyle = '#1e1815';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 枠
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // ランプ ＆ メーター
        ctx.fillStyle = '#2c221e';
        ctx.fillRect(15, 15, 330, 70);
        ctx.strokeStyle = '#8c7025';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, 330, 70);

        if (state.flashLamp) {
            state.lampGlow = (state.lampGlow + 0.15) % Math.PI;
            ctx.fillStyle = `rgba(255, 20, 100, ${0.7 + Math.sin(state.lampGlow) * 0.3})`;
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
        ctx.fillText(`CREDIT:${state.credit}`, 236, 40);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`BET:   ${state.bet}`, 236, 54);
        ctx.fillStyle = '#ff3366';
        ctx.fillText(`WIN:   ${state.win}`, 236, 68);

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

        state.reels.forEach((r, i) => {
            if (r.spinning) {
                r.pos = (r.pos + r.speed) % REEL_STRIP.length;
            }

            const rx = reelX[i];
            const baseIndex = Math.floor(r.pos);
            const offset = (r.pos - baseIndex) * rowH;

            ctx.save();
            ctx.beginPath();
            ctx.rect(rx, reelY, reelW, rowH * 3);
            ctx.clip();

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(rx, reelY, reelW, rowH * 3);

            for (let row = -1; row <= 3; row++) {
                const sIdx = ((baseIndex + row - 1) % REEL_STRIP.length + REEL_STRIP.length) % REEL_STRIP.length;
                const sym = REEL_STRIP[sIdx];
                const sy = reelY + row * rowH + offset;

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
        if (state.winLines.length > 0) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 4;
            state.winLines.forEach(l => {
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
        ctx.fillText(state.message, 180, 298);

        // スタートボタン
        const canStart = state.status === 'IDLE';
        ctx.fillStyle = canStart ? '#f4a261' : '#555';
        ctx.beginPath();
        ctx.roundRect(state.btnStart.x, state.btnStart.y, state.btnStart.w, state.btnStart.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.fillStyle = canStart ? '#2c2520' : '#888';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(state.isReplay ? '🔄 REPLAY START (0枚)' : '🎰 START / レバーオン (3枚)', 180, state.btnStart.y + 28);

        // ストップボタン
        state.btnStops.forEach((b, idx) => {
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

        // 配当表フッター
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.fillText('配当: 7(100枚) / ちゃんこ(48枚) / ビール(24枚)', 180, 455);
        ctx.fillText('地鶏(18枚) / ベル(6枚) / リプレイ(再遊技)', 180, 472);
    }

    let animId = null;
    function loop() {
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

    function handleInput(p) {
        unlockAudio();
        if (p.x >= state.btnStart.x && p.x <= state.btnStart.x + state.btnStart.w &&
            p.y >= state.btnStart.y && p.y <= state.btnStart.y + state.btnStart.h) {
            startSpin();
            return;
        }
        state.btnStops.forEach((b, idx) => {
            if (b.active && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
                stopReel(idx);
            }
        });
    }

    canvas.addEventListener('mousedown', (e) => handleInput(getCoords(e)));
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput(getCoords(e));
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
        if (canvas.style.display === 'none') return;
        unlockAudio();
        if (e.code === 'Space') { e.preventDefault(); startSpin(); }
        else if (e.code === 'KeyZ' || e.code === 'Digit1') stopReel(0);
        else if (e.code === 'KeyX' || e.code === 'Digit2') stopReel(1);
        else if (e.code === 'KeyC' || e.code === 'Digit3') stopReel(2);
    });

    window.startSlotGame = function () {
        if (!animId) loop();
    };

    window.stopSlotGame = function () {
        stopSpinBGM();
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    };
})();
