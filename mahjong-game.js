/**
 * 🀄 琴嵐 ランダム配牌＆超絶ツモアシスト麻雀（専用スクリプト）
 * ・配牌は毎回ランダム（自分で手牌を育てる面白さ！）
 * ・不要な牌に「捨」ナビゲーション表示（初心者でも迷わない）
 * ・打牌するたびに有効牌が自動的に引き寄せられる接待ツモエンジン
 * ・テンパイ（あと1枚）になったら100%当たり牌をツモって役満・高得点和了！
 * ・アガリ時の紙吹雪演出 ＆ ファンファーレ
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

    const ALL_TILE_IDS = Object.keys(TILE_INFO).map(Number);

    let wall = [];
    let hand = [];
    let tsumoTile = null;
    let discards = [];
    let doraTile = null;
    let isReadyToWin = false;
    let gameState = 'PLAY'; // 'PLAY', 'AGARI', 'RYUKYOKU'
    let agariResult = null;
    let score = 25000;
    let winningTiles = []; // 現在の当たり牌リスト
    let turnCount = 0;

    // 136枚の山牌生成＆シャッフル
    function initWall() {
        wall = [];
        ALL_TILE_IDS.forEach(id => {
            for (let i = 0; i < 4; i++) wall.push(id);
        });
        for (let i = wall.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wall[i], wall[j]] = [wall[j], wall[i]];
        }
    }

    function sortHand() {
        hand.sort((a, b) => a - b);
    }

    function startNewGame() {
        unlockAudio();
        confetti = [];
        discards = [];
        turnCount = 0;
        isReadyToWin = false;
        agariResult = null;
        gameState = 'PLAY';

        initWall();
        doraTile = wall.pop();

        // 🎲 完全ランダムな13枚配牌
        hand = [];
        for (let i = 0; i < 13; i++) {
            hand.push(wall.pop());
        }
        sortHand();

        // 第1ツモ
        drawNextTile();
    }

    // ==========================================================================
    // 🧲 接待ツモエンジン（有効牌＆当たり牌を強力に引き寄せる）
    // ==========================================================================
    function drawNextTile() {
        if (wall.length === 0 || discards.length >= 18) {
            gameState = 'RYUKYOKU';
            return;
        }

        // 1. テンパイ（あと1枚）状態かチェック
        findWaitingTiles();

        if (winningTiles.length > 0) {
            // テンパイ時は100%当たり牌をツモらせる！
            tsumoTile = winningTiles[Math.floor(Math.random() * winningTiles.length)];
            isReadyToWin = true;
            agariResult = calculateYaku([...hand, tsumoTile]);
            playTone(900, 'triangle', 0.25, 0.4);
            return;
        }

        // 2. テンパイ前：手牌のペア・連続牌に繋がりやすい有効牌を75%の確率で引き寄せる
        if (Math.random() < 0.75) {
            const usefulTiles = getUsefulTilesForHand();
            if (usefulTiles.length > 0) {
                tsumoTile = usefulTiles[Math.floor(Math.random() * usefulTiles.length)];
                playTone(480, 'triangle', 0.08, 0.2);
                return;
            }
        }

        // 3. 通常ツモ
        tsumoTile = wall.pop();
        playTone(440, 'triangle', 0.06, 0.15);
    }

    // 手牌と相性の良い牌（同じ牌や隣り合う数牌）をリストアップ
    function getUsefulTilesForHand() {
        const useful = new Set();
        hand.forEach(t => {
            useful.add(t); // 対子・刻子候補
            if (t < 30) {
                const num = t % 10;
                if (num > 1) useful.add(t - 1);
                if (num < 9) useful.add(t + 1);
            }
        });
        return Array.from(useful);
    }

    // テンパイ待ち牌を探索
    function findWaitingTiles() {
        winningTiles = [];
        if (hand.length !== 13) return;

        ALL_TILE_IDS.forEach(candidate => {
            const testHand = [...hand, candidate].sort((a, b) => a - b);
            if (isWinningHand(testHand)) {
                winningTiles.push(candidate);
            }
        });
    }

    // どの牌を切るべきか（孤立牌）を自動判定してナビ
    function getDiscardRecommendation() {
        if (isReadyToWin) return -999;

        const counts = {};
        const full = [...hand, tsumoTile].filter(Boolean);
        full.forEach(t => counts[t] = (counts[t] || 0) + 1);

        // 孤立している字牌（1枚だけの東南西北白發中）を最優先で推奨
        for (let t of full) {
            if (t >= 30 && counts[t] === 1) return t;
        }

        // 孤立している数牌（前後がつながっていない牌）
        for (let t of full) {
            if (t < 30 && counts[t] === 1) {
                const num = t % 10;
                const hasNeighbor = full.includes(t - 1) || full.includes(t + 1) || full.includes(t - 2) || full.includes(t + 2);
                if (!hasNeighbor) return t;
            }
        }

        // 特に孤立がなければ最初の単騎牌
        for (let t of full) {
            if (counts[t] === 1) return t;
        }

        return full[full.length - 1];
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
                sortHand();
            }
        }

        discards.push(discarded);
        turnCount++;

        setTimeout(() => {
            drawNextTile();
        }, 150);
    }

    // 4面子1雀頭 / 七対子 / 国士無双の和了判定
    function isWinningHand(tiles) {
        if (tiles.length !== 14) return false;

        const counts = {};
        tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);

        // 七対子
        if (Object.values(counts).filter(c => c === 2).length === 7) return true;

        // 国士無双
        const kokushi = [1, 9, 11, 19, 21, 29, 31, 32, 33, 34, 35, 36, 37];
        if (kokushi.every(kt => counts[kt] >= 1)) return true;

        // 4面子1雀頭
        const unique = Object.keys(counts).map(Number);
        for (let head of unique) {
            if (counts[head] >= 2) {
                const rem = [...tiles];
                rem.splice(rem.indexOf(head), 1);
                rem.splice(rem.indexOf(head), 1);
                if (canFormMentsu(rem)) return true;
            }
        }
        return false;
    }

    function canFormMentsu(tiles) {
        if (tiles.length === 0) return true;
        const first = tiles[0];

        // 刻子 (3枚同じ)
        if (tiles.filter(t => t === first).length >= 3) {
            const next = [...tiles];
            next.splice(next.indexOf(first), 1);
            next.splice(next.indexOf(first), 1);
            next.splice(next.indexOf(first), 1);
            if (canFormMentsu(next)) return true;
        }

        // 順子 (3枚連続)
        if (first < 30 && (first % 10) <= 7) {
            const s2 = first + 1;
            const s3 = first + 2;
            if (tiles.includes(s2) && tiles.includes(s3)) {
                const next = [...tiles];
                next.splice(next.indexOf(first), 1);
                next.splice(next.indexOf(s2), 1);
                next.splice(next.indexOf(s3), 1);
                if (canFormMentsu(next)) return true;
            }
        }
        return false;
    }

    // 役判定＆得点計算
    function calculateYaku(tiles) {
        const counts = {};
        tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);

        // 役満
        const kokushi = [1, 9, 11, 19, 21, 29, 31, 32, 33, 34, 35, 36, 37];
        if (kokushi.every(kt => counts[kt] >= 1)) {
            return { name: '国士無双 (役満)', score: 32000, yaku: ['国士無双 (役満)'] };
        }
        if (counts[35] >= 3 && counts[36] >= 3 && counts[37] >= 3) {
            return { name: '大三元 (役満)', score: 32000, yaku: ['大三元 (役満)'] };
        }
        if (Object.values(counts).filter(c => c >= 3).length === 4) {
            return { name: '四暗刻 (役満)', score: 32000, yaku: ['四暗刻 (役満)'] };
        }

        // 通常役
        const yakuList = ['門前清自摸和 (1翻)'];
        let han = 1;

        if (tiles.every(t => (t % 10 >= 2 && t % 10 <= 8 && t < 30))) {
            yakuList.push('断幺九 (1翻)'); han += 1;
        }

        const suits = new Set(tiles.filter(t => t < 30).map(t => Math.floor(t / 10)));
        const hasHonors = tiles.some(t => t >= 30);
        if (suits.size === 1 && !hasHonors) {
            yakuList.push('清一色 (6翻)'); han += 6;
        } else if (suits.size === 1 && hasHonors) {
            yakuList.push('混一色 (3翻)'); han += 3;
        }

        if (counts[35] >= 3) { yakuList.push('役牌 白 (1翻)'); han += 1; }
        if (counts[36] >= 3) { yakuList.push('役牌 發 (1翻)'); han += 1; }
        if (counts[37] >= 3) { yakuList.push('役牌 中 (1翻)'); han += 1; }
        if (counts[31] >= 3) { yakuList.push('自風 東 (1翻)'); han += 1; }
        if (Object.values(counts).filter(c => c === 2).length === 7) {
            yakuList.push('七対子 (2翻)'); han += 2;
        }

        let pts = 8000;
        let rankName = '満貫 (8000点)';
        if (han >= 13) { pts = 32000; rankName = '数え役満 (32000点)'; }
        else if (han >= 11) { pts = 24000; rankName = '三倍満 (24000点)'; }
        else if (han >= 8) { pts = 16000; rankName = '倍満 (16000点)'; }
        else if (han >= 6) { pts = 12000; rankName = '跳満 (12000点)'; }
        else if (han >= 4) { pts = 8000; rankName = '満貫 (8000点)'; }
        else if (han === 3) { pts = 4000; rankName = '3翻 4000点'; }
        else { pts = 2000; rankName = '2翻 2000点'; }

        return { name: rankName, score: pts, yaku: yakuList };
    }

    function executeAgari() {
        if (!isReadyToWin || !agariResult) return;
        gameState = 'AGARI';
        score += agariResult.score;
        spawnConfetti();
        playFanfare();
    }

    // ==========================================================================
    // 🎨 画面描画
    // ==========================================================================
    function drawTile(x, y, tileId, isLarge = false, isGlow = false) {
        const info = TILE_INFO[tileId];
        if (!info) return;

        const w = isLarge ? 22 : 18;
        const h = isLarge ? 32 : 26;

        ctx.save();
        if (isGlow) {
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 10;
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

        // 背景
        ctx.fillStyle = '#1b4d3e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 木枠
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        // ヘッダー情報バー
        ctx.fillStyle = '#0f2b23';
        ctx.fillRect(10, 10, 340, 52);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 340, 52);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`持ち点: ${score}点`, 20, 30);

        ctx.fillStyle = '#00ffcc';
        ctx.font = '11px sans-serif';
        ctx.fillText(`残ツモ: ${Math.max(0, 18 - discards.length)}回 (ツモ運UP中!)`, 20, 48);

        // ドラ表示牌
        ctx.fillStyle = '#f4a261';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('ドラ:', 205, 38);
        if (doraTile) {
            drawTile(245, 18, doraTile, false);
        }

        // 捨て牌エリア（河）
        ctx.fillStyle = '#163e32';
        ctx.fillRect(15, 70, 330, 85);
        ctx.strokeStyle = '#276753';
        ctx.strokeRect(15, 70, 330, 85);

        ctx.fillStyle = '#6ab098';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('【 捨て牌 】', 22, 84);

        discards.forEach((t, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            drawTile(25 + col * 24, 92 + row * 28, t, false);
        });

        // アクション・メッセージエリア
        const actionY = 175;
        if (isReadyToWin && gameState === 'PLAY') {
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
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(winningTiles.length > 0 ? '⚡ テンパイ中！当たり牌をツモるぞ！ ⚡' : '👇「捨」の牌をタップして手牌を育てよう！', 180, actionY + 28);
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

        // 推奨捨牌の取得
        const recommendedTile = getDiscardRecommendation();

        // 13枚の手牌描画
        hand.forEach((t, i) => {
            const x = 16 + i * 23;
            const isDiscardCandidate = (t === recommendedTile && !isReadyToWin);
            drawTile(x, handY, t, true, isDiscardCandidate);

            if (isDiscardCandidate) {
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
            const isTsumoDiscard = (tsumoTile === recommendedTile && !isReadyToWin);

            drawTile(tsumoX, handY, tsumoTile, true, isWinningTsumo || isTsumoDiscard);

            ctx.fillStyle = isWinningTsumo ? '#ffd700' : '#ff3366';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isWinningTsumo ? '🎉当り' : (isTsumoDiscard ? '捨▼' : 'ツモ'), tsumoX + 11, handY - 2);
        }

        // 紙吹雪描画
        updateAndDrawConfetti();

        // 🎉 和了祝賀画面
        if (gameState === 'AGARI' && agariResult) {
            ctx.fillStyle = 'rgba(10, 20, 15, 0.94)';
            ctx.fillRect(15, 100, 330, 265);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.strokeRect(15, 100, 330, 265);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 22px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText(`✨ ${agariResult.name} ✨`, 180, 140);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText(`+${agariResult.score} 点獲得！ 大勝利！`, 180, 175);

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#a8e6cf';
            agariResult.yaku.forEach((yk, idx) => {
                ctx.fillText(yk, 180, 210 + idx * 22);
            });

            // 次の局へボタン
            ctx.fillStyle = '#f4a261';
            ctx.beginPath();
            ctx.roundRect(90, 300, 180, 44, 8);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#2c2520';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText('もう一局打つ 🀄', 180, 328);
        } else if (gameState === 'RYUKYOKU') {
            ctx.fillStyle = 'rgba(10, 20, 15, 0.92)';
            ctx.fillRect(20, 150, 320, 160);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 150, 320, 160);

            ctx.fillStyle = '#fcfaf2';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('流局 (ツモ終了)', 180, 200);

            ctx.fillStyle = '#f4a261';
            ctx.beginPath();
            ctx.roundRect(100, 240, 160, 38, 6);
            ctx.fill();
            ctx.fillStyle = '#2c2520';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('もう一局打つ 🀄', 180, 264);
        }

        // 操作ガイド
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ランダム配牌中！「捨」の牌を切っていくと当たり牌が引き寄せられます！', 180, 480);
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

        if (gameState === 'AGARI' || gameState === 'RYUKYOKU') {
            if (p.x >= 90 && p.x <= 270 && p.y >= 240 && p.y <= 360) {
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
