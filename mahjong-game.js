/**
 * 🀄 琴嵐 役満確定接待麻雀（専用スクリプト）
 * ・誰でもタップするだけで大三元・国士無双・四暗刻などの役満で100%上がれる！
 * ・スタート時に役満チャンス演出カットイン⚡
 * ・捨てるべき牌に「捨」ナビゲーション表示（迷わず打てる！）
 * ・ツモ時に「ツモ和了」ボタンが巨大点滅 ＆ 大盤振る舞い紙吹雪ファンファーレ🎉
 */
(function () {
    const canvas = document.getElementById('mahjongCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ==========================================================================
    // 🔊 サウンド（Web Audio API）
    // ==========================================================================
    let audioCtx = null;
    function getAudio() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function unlockAudio() {
        const ac = getAudio();
        if (ac.state === 'suspended') ac.resume();
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
            const osc = ac.createOscillator();
            const g = ac.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
            g.gain.setValueAtTime(0.6, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.connect(g); g.connect(ac.destination);
            osc.start(now); osc.stop(now + 0.5);
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
                osc.connect(g); g.connect(ac.destination);
                osc.start(now); osc.stop(now + 0.4);
            });
        } catch (e) {}
    }

    // ==========================================================================
    // 🎊 紙吹雪パーティクル
    // ==========================================================================
    let confetti = [];
    function spawnConfetti() {
        confetti = [];
        const colors = ['#ffd700', '#ff3366', '#00ffcc', '#ffffff', '#f4a261', '#ff0055'];
        for (let i = 0; i < 70; i++) {
            confetti.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height * 0.8,
                w: Math.random() * 8 + 4,
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
        if (confetti.length === 0) return;
        confetti.forEach(p => {
            p.x += p.vx; p.y += p.vy; p.rot += p.vrot;
            if (p.y > canvas.height + 10) { p.y = -15; p.x = Math.random() * canvas.width; }
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
    }

    // ==========================================================================
    // 🀄 牌データ
    // ==========================================================================
    const TILE_INFO = {
        1: { name: '一萬', type: 'm', num: 1, text: '一', sub: '萬', color: '#cc0000' },
        2: { name: '二萬', type: 'm', num: 2, text: '二', sub: '萬', color: '#cc0000' },
        3: { name: '三萬', type: 'm', num: 3, text: '三', sub: '萬', color: '#cc0000' },
        4: { name: '四萬', type: 'm', num: 4, text: '四', sub: '萬', color: '#cc0000' },
        5: { name: '五萬', type: 'm', num: 5, text: '五', sub: '萬', color: '#cc0000' },
        6: { name: '六萬', type: 'm', num: 6, text: '六', sub: '萬', color: '#cc0000' },
        7: { name: '七萬', type: 'm', num: 7, text: '七', sub: '萬', color: '#cc0000' },
        8: { name: '八萬', type: 'm', num: 8, text: '八', sub: '萬', color: '#cc0000' },
        9: { name: '九萬', type: 'm', num: 9, text: '九', sub: '萬', color: '#cc0000' },

        11: { name: '一筒', type: 'p', num: 1, text: '1', sub: '筒', color: '#0066cc' },
        12: { name: '二筒', type: 'p', num: 2, text: '2', sub: '筒', color: '#0066cc' },
        13: { name: '三筒', type: 'p', num: 3, text: '3', sub: '筒', color: '#0066cc' },
        14: { name: '四筒', type: 'p', num: 4, text: '4', sub: '筒', color: '#0066cc' },
        15: { name: '五筒', type: 'p', num: 5, text: '5', sub: '筒', color: '#0066cc' },
        16: { name: '六筒', type: 'p', num: 6, text: '6', sub: '筒', color: '#0066cc' },
        17: { name: '七筒', type: 'p', num: 7, text: '7', sub: '筒', color: '#0066cc' },
        18: { name: '八筒', type: 'p', num: 8, text: '8', sub: '筒', color: '#0066cc' },
        19: { name: '九筒', type: 'p', num: 9, text: '9', sub: '筒', color: '#0066cc' },

        21: { name: '一索', type: 's', num: 1, text: '1', sub: '索', color: '#009933' },
        22: { name: '二索', type: 's', num: 2, text: '2', sub: '索', color: '#009933' },
        23: { name: '三索', type: 's', num: 3, text: '3', sub: '索', color: '#009933' },
        24: { name: '四索', type: 's', num: 4, text: '4', sub: '索', color: '#009933' },
        25: { name: '五索', type: 's', num: 5, text: '5', sub: '索', color: '#009933' },
        26: { name: '六索', type: 's', num: 6, text: '6', sub: '索', color: '#009933' },
        27: { name: '七索', type: 's', num: 7, text: '7', sub: '索', color: '#009933' },
        28: { name: '八索', type: 's', num: 8, text: '8', sub: '索', color: '#009933' },
        29: { name: '九索', type: 's', num: 9, text: '9', sub: '索', color: '#009933' },

        31: { name: '東', type: 'z', num: 1, text: '東', sub: '', color: '#111111' },
        32: { name: '南', type: 'z', num: 2, text: '南', sub: '', color: '#111111' },
        33: { name: '西', type: 'z', num: 3, text: '西', sub: '', color: '#111111' },
        34: { name: '北', type: 'z', num: 4, text: '北', sub: '', color: '#111111' },
        35: { name: '白', type: 'z', num: 5, text: '白', sub: '', color: '#666666' },
        36: { name: '發', type: 'z', num: 6, text: '發', sub: '', color: '#009933' },
        37: { name: '中', type: 'z', num: 7, text: '中', sub: '', color: '#cc0000' }
    };

    // ==========================================================================
    // 👑 役満プリセットテンプレート
    // ==========================================================================
    const YAKUMAN_TEMPLATES = [
        {
            name: '大三元 (役満)',
            hand: [35,35,35, 36,36,36, 37,37,37, 1,1,1, 15], // 15(五筒)が不要牌
            winningTile: 1, // 1m単騎
            discardHint: 15,
            score: 32000
        },
        {
            name: '国士無双 (役満)',
            hand: [1, 9, 11, 19, 21, 29, 31, 32, 33, 34, 35, 36, 12], // 12(二筒)が不要牌
            winningTile: 37, // 中ツモ
            discardHint: 12,
            score: 32000
        },
        {
            name: '四暗刻 (役満)',
            hand: [1,1,1, 9,9,9, 11,11,11, 31,31,31, 25], // 25(五索)が不要牌
            winningTile: 37,
            discardHint: 25,
            score: 32000
        },
        {
            name: '九蓮宝燈 (役満)',
            hand: [1,1,1, 2,3,4,5,6,7,8, 9,9, 18], // 18(八筒)が不要牌
            winningTile: 9, // 9mツモで九蓮宝燈完成
            discardHint: 18,
            score: 32000
        }
    ];

    let currentPreset = null;
    let hand = [];
    let tsumoTile = null;
    let discards = [];
    let isReadyToWin = false;
    let gameState = 'PLAY'; // 'PLAY', 'AGARI'
    let score = 25000;
    let turnCount = 0;

    function startNewGame() {
        unlockAudio();
        confetti = [];
        discards = [];
        turnCount = 0;
        isReadyToWin = false;
        gameState = 'PLAY';

        // 役満テンプレートをランダム選出
        currentPreset = YAKUMAN_TEMPLATES[Math.floor(Math.random() * YAKUMAN_TEMPLATES.length)];
        hand = [...currentPreset.hand].sort((a, b) => a - b);

        // 第1ツモ（不要牌が来る）
        tsumoTile = currentPreset.discardHint;
        playThunderSound();
    }

    function discard(index) {
        unlockAudio();
        playTone(600, 'square', 0.04, 0.3);

        let discarded;
        if (index === -1) {
            discarded = tsumoTile;
            tsumoTile = null;
        } else {
            discarded = hand.splice(index, 1)[0];
            if (tsumoTile !== null) {
                hand.push(tsumoTile);
                tsumoTile = null;
                hand.sort((a, b) => a - b);
            }
        }

        discards.push(discarded);
        turnCount++;

        // 🌟 1回でも捨てたら次のツモで必ず【大当たり牌】を接待ツモ！
        setTimeout(() => {
            tsumoTile = currentPreset.winningTile;
            isReadyToWin = true;
            playTone(900, 'triangle', 0.2, 0.35); // テンパイ・ツモSE
        }, 200);
    }

    function executeAgari() {
        if (!isReadyToWin) return;
        gameState = 'AGARI';
        score += currentPreset.score;
        spawnConfetti();
        playFanfare();
    }

    // ==========================================================================
    // 🎨 描画処理
    // ==========================================================================
    function drawTile(x, y, tileId, isLarge = false, isGlow = false) {
        const info = TILE_INFO[tileId];
        if (!info) return;

        const w = isLarge ? 22 : 18;
        const h = isLarge ? 32 : 26;

        ctx.save();
        if (isGlow) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 12;
        }

        ctx.fillStyle = isGlow ? '#fff9e6' : '#fcfaf2';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 3);
        ctx.fill();
        ctx.strokeStyle = isGlow ? '#ff9900' : '#2c2520';
        ctx.lineWidth = isGlow ? 2 : 1;
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = info.color;
        ctx.textAlign = 'center';

        if (info.type === 'z' || isLarge) {
            ctx.font = `bold ${isLarge ? 13 : 11}px "Noto Serif JP", serif`;
            ctx.fillText(info.text, x + w / 2, y + (info.sub ? h * 0.48 : h * 0.68));
            if (info.sub) {
                ctx.font = `bold ${isLarge ? 9 : 8}px sans-serif`;
                ctx.fillText(info.sub, x + w / 2, y + h * 0.88);
            }
        } else {
            ctx.font = `bold ${isLarge ? 11 : 9}px sans-serif`;
            ctx.fillText(info.num + info.sub, x + w / 2, y + h * 0.65);
        }
    }

    let pulseTime = 0;

    function draw() {
        pulseTime += 0.05;

        // 雀卓グリーン背景
        ctx.fillStyle = '#1b4d3e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 木枠
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        // ⚡ 役満チャンス告知ヘッダー
        ctx.fillStyle = '#0f2b23';
        ctx.fillRect(10, 10, 340, 52);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 340, 52);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 15px "Noto Serif JP", serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⚡ 役満チャンス！ ${currentPreset.name} ⚡`, 180, 32);

        ctx.fillStyle = '#00ffcc';
        ctx.font = '11px sans-serif';
        ctx.fillText(`持ち点: ${score}点  |  誰でも必ず上がれる接待モード中！`, 180, 50);

        // 捨て牌エリア
        ctx.fillStyle = '#163e32';
        ctx.fillRect(15, 72, 330, 85);
        ctx.strokeStyle = '#276753';
        ctx.strokeRect(15, 72, 330, 85);

        ctx.fillStyle = '#6ab098';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('【 捨て牌 】', 22, 86);

        discards.forEach((t, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            drawTile(25 + col * 24, 94 + row * 28, t, false);
        });

        // 巨大ツモ和了ボタン（当たり牌ツモ時に点滅）
        const actionY = 175;
        if (isReadyToWin && gameState === 'PLAY') {
            const pulse = Math.sin(pulseTime * 4) * 0.15 + 0.85;
            ctx.save();
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#ff2a2a';
            ctx.beginPath();
            ctx.roundRect(80, actionY, 200, 48, 8);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText('🀄 ツモ和了！！', 180, actionY + 31);
            ctx.restore();
        } else if (gameState === 'PLAY') {
            // ガイドメッセージ
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('👇「捨」マークの牌をタップして捨てよう！', 180, actionY + 28);
        }

        // 手牌エリア
        const handY = 320;
        ctx.fillStyle = '#0f2b23';
        ctx.fillRect(10, handY - 28, 340, 98);
        ctx.strokeStyle = '#276753';
        ctx.strokeRect(10, handY - 28, 340, 98);

        ctx.fillStyle = '#fcfaf2';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('【 あなたの手牌 】', 18, handY - 10);

        // 13枚の手牌描画
        hand.forEach((t, i) => {
            const x = 16 + i * 23;
            const isDiscardTarget = (t === currentPreset.discardHint && !isReadyToWin);
            drawTile(x, handY, t, true, isDiscardTarget);

            if (isDiscardTarget) {
                ctx.fillStyle = '#ff3366';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('捨▼', x + 11, handY - 2);
            }
        });

        // ツモ牌描画（右端）
        if (tsumoTile !== null) {
            const tsumoX = 16 + 13 * 23 + 6;
            const isWinningTsumo = isReadyToWin;
            drawTile(tsumoX, handY, tsumoTile, true, isWinningTsumo);

            ctx.fillStyle = isWinningTsumo ? '#ffd700' : '#ff3366';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isWinningTsumo ? '🎉当り' : '捨▼', tsumoX + 11, handY - 2);
        }

        // 紙吹雪描画
        updateAndDrawConfetti();

        // 🎉 役満アガリ祝賀画面
        if (gameState === 'AGARI') {
            ctx.fillStyle = 'rgba(10, 20, 15, 0.92)';
            ctx.fillRect(15, 110, 330, 250);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.strokeRect(15, 110, 330, 250);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 22px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText(`✨ ${currentPreset.name} ✨`, 180, 150);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText(`+${currentPreset.score} 点獲得！ 大勝利！`, 180, 185);

            ctx.fillStyle = '#a8e6cf';
            ctx.font = '13px sans-serif';
            ctx.fillText('琴嵐 役満大盤振る舞い！ごっつあんです！', 180, 220);

            // 次の役満へボタン
            ctx.fillStyle = '#f4a261';
            ctx.beginPath();
            ctx.roundRect(90, 280, 180, 44, 8);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#2c2520';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText('次の役満を狙う 🀄', 180, 308);
        }

        // 操作ガイド
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('「捨」の牌を1回捨てるだけで当たり牌が出現します！', 180, 480);
    }

    // ==========================================================================
    // 🎮 ループ ＆ タップ判定
    // ==========================================================================
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

        // アガリ画面の再挑戦ボタン
        if (gameState === 'AGARI') {
            if (p.x >= 90 && p.x <= 270 && p.y >= 270 && p.y <= 335) {
                startNewGame();
            }
            return;
        }

        // ツモ和了ボタンタップ
        if (isReadyToWin && p.x >= 80 && p.x <= 280 && p.y >= 170 && p.y <= 230) {
            executeAgari();
            return;
        }

        // 手牌タップ判定
        const handY = 320;
        if (p.y >= handY - 15 && p.y <= handY + 45) {
            for (let i = 0; i < hand.length; i++) {
                const x = 16 + i * 23;
                if (p.x >= x && p.x <= x + 22) {
                    discard(i);
                    return;
                }
            }
            if (tsumoTile !== null) {
                const tsumoX = 16 + 13 * 23 + 6;
                if (p.x >= tsumoX && p.x <= tsumoX + 22) {
                    discard(-1);
                    return;
                }
            }
        }
    }

    canvas.addEventListener('mousedown', (e) => handleInput(getCoords(e)));
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleInput(getCoords(e));
    }, { passive: false });

    startNewGame();

    window.startMahjongGame = function () {
        if (!animId) loop();
    };

    window.stopMahjongGame = function () {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    };
})();
