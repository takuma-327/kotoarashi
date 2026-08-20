/**
 * 🎰 パチスロ 琴嵐（オーロラ祝賀 ＆ 嵐ランプ継続 ＆ 左フリーズ搭載版）
 * ・嵐ランプは777が当たるまでずっと点灯継続（ボーナス確定モード）⚡
 * ・1/100で左リール停止ボタンを押しても1秒間止まらないフリーズ演出！
 * ・クレジット1000枚突破で全体がオーロラに発光 ＆ 特大祝賀メッセージ表示✨
 * ・紙吹雪演出 ＆ 嵐専用激アツBGM ＆ 上から下へのスムーズ回転
 * ・指定配当（7:100 / ちゃんこ:48 / ビール:24 / 地鶏:18 / ベル:6）
 */
(function () {
    const canvas = document.getElementById('slotGameCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ==========================================================================
    // 🔊 サウンド ＆ BGMエンジン（Web Audio API）
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

    function unlockAudio() {
        const ac = getAudio();
        if (ac.state === 'suspended') {
            ac.resume();
        }
    }

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

    function playThunderSound() {
        try {
            const ac = getAudio();
            const now = ac.currentTime;

            const bufferSize = Math.floor(ac.sampleRate * 0.8);
            const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = ac.createBufferSource();
            noise.buffer = buffer;

            const filter = ac.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + 0.7);

            const noiseGain = ac.createGain();
            noiseGain.gain.setValueAtTime(0.9, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ac.destination);

            noise.start(now);
            noise.stop(now + 0.8);

            const osc = ac.createOscillator();
            const oscGain = ac.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

            oscGain.gain.setValueAtTime(0.6, now);
            oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

            osc.connect(oscGain);
            oscGain.connect(ac.destination);

            osc.start(now);
            osc.stop(now + 0.6);
        } catch (e) {}
    }

    function playFanfare() {
        try {
            const ac = getAudio();
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            notes.forEach((freq, i) => {
                const now = ac.currentTime + (i * 0.12);
                const osc = ac.createOscillator();
                const g = ac.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                g.gain.setValueAtTime(0.35, now);
                g.gain.linearRampToValueAtTime(0.001, now + 0.4);

                osc.connect(g);
                g.connect(ac.destination);

                osc.start(now);
                osc.stop(now + 0.4);
            });
        } catch (e) {}
    }

    // 🎵 BGMシーケンサー
    let bgmTimer = null;
    let bgmIndex = 0;

    const normalNotes = [
        293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 523.25, 440.00,
        392.00, 440.00, 523.25, 587.33, 698.46, 587.33, 523.25, 440.00
    ];

    const arashiNotes = [
        659.25, 783.99, 880.00, 987.77, 1174.66, 1318.51, 1174.66, 987.77,
        880.00, 987.77, 1174.66, 1318.51, 1567.98, 1318.51, 1174.66, 987.77
    ];

    function startSpinBGM(isArashi) {
        stopSpinBGM();
        bgmIndex = 0;

        const currentNotes = isArashi ? arashiNotes : normalNotes;
        const noteDuration = isArashi ? 0.10 : 0.13;

        bgmTimer = setInterval(() => {
            if (!state.reels.some(r => r.spinning)) {
                stopSpinBGM();
                return;
            }
            try {
                const ac = getAudio();
                const freq = currentNotes[bgmIndex % currentNotes.length];
                const now = ac.currentTime;

                const osc = ac.createOscillator();
                const g = ac.createGain();

                osc.type = isArashi ? 'sawtooth' : 'square';
                osc.frequency.setValueAtTime(freq, now);

                g.gain.setValueAtTime(isArashi ? 0.10 : 0.08, now);
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
    // 🎊 紙吹雪パーティクルシステム
    // ==========================================================================
    let confettiParticles = [];

    function spawnConfetti() {
        confettiParticles = [];
        const colors = ['#ffd700', '#ff3366', '#00ffcc', '#ffffff', '#f4a261', '#ff0055', '#ffe600'];
        for (let i = 0; i < 80; i++) {
            confettiParticles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height * 0.8,
                w: Math.random() * 9 + 5,
                h: Math.random() * 6 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 2.5,
                vy: Math.random() * 2.5 + 2,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.08
            });
        }
    }

    function updateAndDrawConfetti() {
        if (confettiParticles.length === 0) return;

        confettiParticles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.vrot;

            if (p.y > canvas.height + 10) {
                p.y = -15;
                p.x = Math.random() * canvas.width;
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
    }

    // ==========================================================================
    // 🎰 図柄＆配当設定
    // ==========================================================================
    const SYMBOLS = {
        SEVEN:   { id: 0, name: '7',     color: '#ff2a2a', pay: 100 },
        CHANKO:  { id: 1, name: 'ちゃんこ', icon: '🍲', pay: 48 },
        BEER:    { id: 2, name: '生ビール', icon: '🍺', pay: 24 },
        CHICKEN: { id: 3, name: '地鶏',   icon: '🍗', pay: 18 },
        BELL:    { id: 4, name: 'ベル',   icon: '🔔', pay: 6 },
        REPLAY:  { id: 5, name: 'リプレイ', icon: '🔄', pay: 0 }
    };

    const REEL_STRIP = [
        SYMBOLS.SEVEN,   SYMBOLS.REPLAY,  SYMBOLS.BELL,    SYMBOLS.CHICKEN,
        SYMBOLS.BEER,    SYMBOLS.CHANKO,  SYMBOLS.BELL,    SYMBOLS.SEVEN,
        SYMBOLS.CHICKEN, SYMBOLS.REPLAY,  SYMBOLS.BEER,    SYMBOLS.BELL,
        SYMBOLS.CHANKO,  SYMBOLS.SEVEN,   SYMBOLS.REPLAY,  SYMBOLS.CHICKEN,
        SYMBOLS.BELL,    SYMBOLS.BEER,    SYMBOLS.CHANKO,  SYMBOLS.REPLAY,
        SYMBOLS.BELL
    ];

    function getSymbolAt(index, isTransformed) {
        const normalizedIndex = (Math.floor(index) % REEL_STRIP.length + REEL_STRIP.length) % REEL_STRIP.length;
        const sym = REEL_STRIP[normalizedIndex];
        if (isTransformed && sym.id === SYMBOLS.REPLAY.id) {
            return SYMBOLS.SEVEN;
        }
        return sym;
    }

    let auroraHue = 0; // オーロラ色相カウンター

    const state = {
        credit: 50, bet: 3, win: 0, isReplay: false,
        status: 'IDLE', flashLamp: false, lampGlow: 0,
        isBonusMode: false, // ⚡ 777当たるまで継続するボーナスモード
        isLeftFreezing: false, // 左フリーズ中フラグ
        isCenterReverse: false,
        isBigWon: false,
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

        state.isBigWon = false;
        confettiParticles = [];
        state.isLeftFreezing = false;

        if (!state.isReplay) {
            if (state.credit < state.bet) {
                state.credit += 50;
                state.message = 'クレジット補充(+50枚)！ごっつあんです！';
            }
            state.credit -= state.bet;
        } else {
            state.isReplay = false;
            state.message = 'REPLAY！メダル消費なし';
        }

        state.win = 0;
        state.winLines = [];
        state.status = 'SPINNING';
        playTone(300, 'sawtooth', 0.12, 0.3);

        // 内部抽選 (8%で嵐ランプ点灯＆ボーナスモード突入)
        const rand = Math.random() * 100;
        if (rand < 8 || state.isBonusMode) {
            state.isBonusMode = true; // 777当たるまで継続！
            state.flashLamp = true;
            playThunderSound();
            state.message = '⚡ 嵐点灯中！777当たるまで継続！狙え！ ⚡';
        } else {
            state.message = 'ボタンを押してリールを止めよう！';
        }

        // 1/100 中リール逆回転
        state.isCenterReverse = (Math.random() < 0.01);
        if (state.isCenterReverse) {
            state.message = '⚡【怪奇演出】中リール逆回転中！？⚡';
        }

        const baseSpeed = state.isBonusMode ? 0.16 : 0.30;

        state.reels.forEach((r, idx) => {
            r.spinning = true;
            r.stopped = false;
            if (idx === 1 && state.isCenterReverse) {
                r.speed = -baseSpeed;
            } else {
                r.speed = baseSpeed;
            }
            state.btnStops[idx].active = true;
        });

        startSpinBGM(state.isBonusMode);
    }

    function stopReel(index) {
        const r = state.reels[index];
        if (!r.spinning || r.stopped) return;

        unlockAudio();

        // 🌀 1/100の確率で左リール（STOP 1）が1秒間止まらないフリーズ演出
        if (index === 0 && !state.isLeftFreezing && Math.random() < 0.01) {
            state.isLeftFreezing = true;
            state.btnStops[0].active = false;
            state.message = '⚡【フリーズ発生】ボタンが効かない！？⚡';
            playTone(90, 'sawtooth', 0.3, 0.5);

            setTimeout(() => {
                state.isLeftFreezing = false;
                executeStopReel(0);
            }, 1000); // 1秒遅延して停止
            return;
        }

        executeStopReel(index);
    }

    function executeStopReel(index) {
        const r = state.reels[index];
        if (!r.spinning || r.stopped) return;

        playTone(180, 'square', 0.08, 0.35);
        r.spinning = false;
        r.stopped = true;
        state.btnStops[index].active = false;

        let stopPos = (Math.round(r.pos) % REEL_STRIP.length + REEL_STRIP.length) % REEL_STRIP.length;

        // ボーナスモード中：最大4コマの引き込みアシスト
        if (state.isBonusMode) {
            for (let slip = 0; slip <= 4; slip++) {
                const checkPos = (stopPos + slip) % REEL_STRIP.length;
                const sym = getSymbolAt(checkPos, true);
                if (sym.id === SYMBOLS.SEVEN.id) {
                    stopPos = checkPos;
                    break;
                }
            }
        }

        r.pos = stopPos;

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

        const isTransformed = state.isBonusMode || state.isBigWon;

        const grid = state.reels.map(r => {
            const c = (Math.round(r.pos) % REEL_STRIP.length + REEL_STRIP.length) % REEL_STRIP.length;
            const t = (c - 1 + REEL_STRIP.length) % REEL_STRIP.length;
            const b = (c + 1) % REEL_STRIP.length;
            return [
                getSymbolAt(t, isTransformed),
                getSymbolAt(c, isTransformed),
                getSymbolAt(b, isTransformed)
            ];
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
                state.isBigWon = true;
                state.isBonusMode = false; // ⚡ 777当選でボーナスモード終了
                state.flashLamp = false;
                spawnConfetti();
                playFanfare();

                if (state.credit >= 1000) {
                    state.message = '✨ おめでとう！今月も琴嵐よろしく！！ ✨';
                } else {
                    state.message = '🎉 大当たり！ 777揃い 100枚獲得！ 🎉';
                }
            } else if (isRep) {
                state.message = '🔄 REPLAY！もう1回無料！';
                playTone(880, 'sine', 0.12, 0.25);
            } else {
                if (state.credit >= 1000) {
                    state.message = '✨ おめでとう！今月も琴嵐よろしく！！ ✨';
                } else if (state.isBonusMode) {
                    state.message = `✨ ${payout}枚獲得！ 嵐ランプ継続中！7を狙え！`;
                } else {
                    state.message = `✨ ${payout}枚 払い出し！ ごっつあんです！`;
                }
                playTone(880, 'sine', 0.12, 0.25);
            }
        } else {
            if (state.credit >= 1000) {
                state.message = '✨ おめでとう！今月も琴嵐よろしく！！ ✨';
            } else if (state.isBonusMode) {
                state.message = '⚡ 嵐ランプ点灯中！777当たるまで継続！ ⚡';
            } else if (state.credit <= 0) {
                state.message = 'クレジット0！インベーダーもやってね👾 (STARTで+50枚)';
            } else {
                state.message = 'ハズレ… 次回に期待！';
            }
        }

        setTimeout(() => { state.status = 'IDLE'; }, 500);
    }

    function draw() {
        auroraHue = (auroraHue + 1.5) % 360;
        const isOver1000 = state.credit >= 1000;

        // 1. ベース背景（1000枚以上時はオーロラ調の神秘的なグラデーション）
        if (isOver1000) {
            const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            bgGrad.addColorStop(0, `hsl(${auroraHue}, 60%, 15%)`);
            bgGrad.addColorStop(0.5, `hsl(${(auroraHue + 60) % 360}, 70%, 12%)`);
            bgGrad.addColorStop(1, `hsl(${(auroraHue + 120) % 360}, 60%, 18%)`);
            ctx.fillStyle = bgGrad;
        } else {
            ctx.fillStyle = '#1e1815';
        }
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. 枠線（1000枚以上時はオーロラ色に輝く）
        if (isOver1000) {
            ctx.strokeStyle = `hsl(${auroraHue}, 100%, 65%)`;
            ctx.shadowColor = `hsl(${auroraHue}, 100%, 75%)`;
            ctx.shadowBlur = 15;
            ctx.lineWidth = 5;
        } else {
            ctx.strokeStyle = '#d4af37';
            ctx.shadowBlur = 0;
            ctx.lineWidth = 4;
        }
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
        ctx.shadowBlur = 0;

        // 3. 上部エリア
        ctx.fillStyle = isOver1000 ? 'rgba(30, 20, 35, 0.85)' : '#2c221e';
        ctx.fillRect(15, 15, 330, 70);
        ctx.strokeStyle = isOver1000 ? `hsl(${(auroraHue + 40) % 360}, 90%, 60%)` : '#8c7025';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 15, 330, 70);

        // 嵐ランプ（ボーナスモード中は常時点灯）
        if (state.isBonusMode || state.flashLamp) {
            state.lampGlow = (state.lampGlow + 0.18) % Math.PI;
            ctx.fillStyle = `rgba(255, 20, 100, ${0.75 + Math.sin(state.lampGlow) * 0.25})`;
            ctx.shadowColor = '#ff0055';
            ctx.shadowBlur = 22;
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

        // タイトル
        ctx.fillStyle = isOver1000 ? '#ffd700' : '#f4a261';
        ctx.font = 'bold 17px "Noto Serif JP", serif';
        ctx.textAlign = 'center';
        ctx.fillText('パチスロ 琴嵐', 180, 42);

        // メーター表示
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(230, 23, 105, 54);
        ctx.fillStyle = isOver1000 ? '#ffd700' : '#00ffcc';
        ctx.font = '11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`CREDIT:${state.credit}`, 236, 40);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`BET:   ${state.bet}`, 236, 54);
        ctx.fillStyle = '#ff3366';
        ctx.fillText(`WIN:   ${state.win}`, 236, 68);

        // 4. リール窓
        const reelY = 100;
        const rowH = 60;
        const reelW = 80;
        const reelX = [40, 140, 240];

        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(25, reelY - 5, 310, rowH * 3 + 10);
        ctx.strokeStyle = isOver1000 ? `hsl(${auroraHue}, 90%, 60%)` : '#9e2a2b';
        ctx.lineWidth = 3;
        ctx.strokeRect(25, reelY - 5, 310, rowH * 3 + 10);

        const isTransformed = state.isBonusMode || state.isBigWon;

        state.reels.forEach((r, i) => {
            if (r.spinning) {
                r.pos = (r.pos + r.speed + REEL_STRIP.length) % REEL_STRIP.length;
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
                const rawIdx = (baseIndex + row - 1 + REEL_STRIP.length) % REEL_STRIP.length;
                const sym = getSymbolAt(rawIdx, isTransformed);
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

        // 紙吹雪描画
        updateAndDrawConfetti();

        // 5. 特大祝賀バナー（クレジット1000枚以上時）
        if (isOver1000) {
            ctx.save();
            const bannerGrad = ctx.createLinearGradient(20, 275, 340, 275);
            bannerGrad.addColorStop(0, `hsl(${auroraHue}, 100%, 45%)`);
            bannerGrad.addColorStop(0.5, `hsl(${(auroraHue + 60) % 360}, 100%, 55%)`);
            bannerGrad.addColorStop(1, `hsl(${(auroraHue + 120) % 360}, 100%, 45%)`);
            ctx.fillStyle = bannerGrad;
            ctx.beginPath();
            ctx.roundRect(15, 273, 330, 32, 6);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 6;
            ctx.font = 'bold 13px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText('✨ おめでとう！今月も琴嵐よろしく！！ ✨', 180, 294);
            ctx.restore();
        } else {
            // 通常メッセージバー
            ctx.fillStyle = '#111';
            ctx.fillRect(25, 283, 310, 22);

            if (state.isBonusMode) {
                ctx.fillStyle = '#ff3366';
            } else if (state.credit <= 0) {
                ctx.fillStyle = '#f4a261';
            } else {
                ctx.fillStyle = '#00ffcc';
            }

            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(state.message, 180, 298);
        }

        // 6. スタートボタン
        const canStart = state.status === 'IDLE';
        ctx.fillStyle = canStart ? (isOver1000 ? `hsl(${auroraHue}, 80%, 55%)` : '#f4a261') : '#555';
        ctx.beginPath();
        ctx.roundRect(state.btnStart.x, state.btnStart.y, state.btnStart.w, state.btnStart.h, 8);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.fillStyle = canStart ? '#2c2520' : '#888';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';

        let btnLabel = '🎰 START / レバーオン (3枚)';
        if (state.isReplay) btnLabel = '🔄 REPLAY START (0枚)';
        else if (state.credit < state.bet) btnLabel = '🪙 メダル補充＆START (+50枚)';

        ctx.fillText(btnLabel, 180, state.btnStart.y + 28);

        // 7. ストップボタン
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

        // 8. 配当表フッター
        ctx.fillStyle = isOver1000 ? '#fcfaf2' : '#aaa';
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
