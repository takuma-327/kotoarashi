/**
 * 🀄 琴嵐 1対1 対戦麻雀（専用スクリプト）
 * ・画面上部の大将（COM）とリアルタイム1局勝負！
 * ・大将の捨て牌から「ロン和了！」＆ 自分のツモで「ツモ和了！」
 * ・プレイヤーがテンパイすると大将が当たり牌を振り込む接待AI搭載
 * ・打牌ナビゲーション（捨▼）＆ 点数移動 ＆ 紙吹雪ファンファーレ
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
        for (let i = 0; i < 75; i++) {
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
        13: { name: '三筒', type: 'p', num: 3, text: '三', sub: '筒', color: '#0066cc' },
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

    // ==========================================================================
    // ⚔️ 対戦状態管理
    // ==========================================================================
    let wall = [];
    let playerHand = [];
    let playerTsumo = null;
    let playerDiscards = [];
    let playerScore = 25000;

    let comHand = [];
    let comDiscards = [];
    let comScore = 25000;
    let comDialogue = 'いらっしゃい！お手柔らかに頼むで！';

    let doraTile = null;
    let turn = 'PLAYER'; // 'PLAYER', 'COM', 'RON_CHANCE'
    let gameState = 'PLAY'; // 'PLAY', 'AGARI', 'RYUKYOKU'
    let agariData = null; // 和了情報 { type: 'TSUMO'|'RON', winner: 'PLAYER', name, score, yaku }
    let playerWinningTiles = [];
    let lastComDiscard = null;

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

    function startNewGame() {
        unlockAudio();
        confetti = [];
        playerDiscards = [];
        comDiscards = [];
        playerWinningTiles = [];
        lastComDiscard = null;
        agariData = null;
        gameState = 'PLAY';
        turn = 'PLAYER';

        initWall();
        doraTile = wall.pop();

        // プレイヤー配牌
        playerHand = [];
        for (let i = 0; i < 13; i++) playerHand.push(wall.pop());
        playerHand.sort((a, b) => a - b);

        // 大将（COM）配牌
        comHand = [];
        for (let i = 0; i < 13; i++) comHand.push(wall.pop());
        comHand.sort((a, b) => a - b);

        comDialogue = 'さあ、一勝負いこうか！';
        drawPlayerTile();
    }

    // プレイヤーのツモ（接待引き寄せ機能付き）
    function drawPlayerTile() {
        if (wall.length === 0 || playerDiscards.length >= 18) {
            gameState = 'RYUKYOKU';
            return;
        }

        turn = 'PLAYER';
        findPlayerWinningTiles();

        // テンパイ時は高確率(40%)で自力ツモ和了
        if (playerWinningTiles.length > 0 && Math.random() < 0.40) {
            playerTsumo = playerWinningTiles[Math.floor(Math.random() * playerWinningTiles.length)];
            playTone(900, 'triangle', 0.2, 0.4);
            return;
        }

        // 有効牌の引き寄せ (65%)
        if (Math.random() < 0.65) {
            const useful = getUsefulTiles(playerHand);
            if (useful.length > 0) {
                playerTsumo = useful[Math.floor(Math.random() * useful.length)];
                playTone(480, 'triangle', 0.08, 0.2);
                return;
            }
        }

        playerTsumo = wall.pop();
        playTone(440, 'triangle', 0.06, 0.15);
    }

    function getUsefulTiles(handTiles) {
        const useful = new Set();
        handTiles.forEach(t => {
            useful.add(t);
            if (t < 30) {
                const num = t % 10;
                if (num > 1) useful.add(t - 1);
                if (num < 9) useful.add(t + 1);
            }
        });
        return Array.from(useful);
    }

    function findPlayerWinningTiles() {
        playerWinningTiles = [];
        if (playerHand.length !== 13) return;
        ALL_TILE_IDS.forEach(cand => {
            const test = [...playerHand, cand].sort((a, b) => a - b);
            if (isWinningHand(test)) playerWinningTiles.push(cand);
        });
    }

    // プレイヤー打牌
    function playerDiscard(index) {
        unlockAudio();
        playTone(600, 'square', 0.04, 0.3);

        let discarded;
        if (index === -1) {
            discarded = playerTsumo;
            playerTsumo = null;
        } else {
            discarded = playerHand.splice(index, 1)[0];
            if (playerTsumo !== null) {
                playerHand.push(playerTsumo);
                playerTsumo = null;
                playerHand.sort((a, b) => a - b);
            }
        }

        playerDiscards.push(discarded);
        findPlayerWinningTiles();

        // 大将のターンへ移行
        turn = 'COM';
        setTimeout(comTurn, 600);
    }

    // 大将（COM）の思考と打牌
    function comTurn() {
        if (gameState !== 'PLAY') return;

        // 大将ツモ
        const comTsumo = wall.pop();
        if (!comTsumo || comDiscards.length >= 18) {
            gameState = 'RYUKYOKU';
            return;
        }
        comHand.push(comTsumo);

        // 🎯 接待ロジック：プレイヤーがテンパイしていれば、70%の確率で当たり牌を振り込む
        let discardTile;
        if (playerWinningTiles.length > 0 && Math.random() < 0.70) {
            discardTile = playerWinningTiles[Math.floor(Math.random() * playerWinningTiles.length)];
            comDialogue = 'あっ… この牌、危ないか！？';
        } else {
            // 通常打牌（ランダムに1枚捨てる）
            const idx = Math.floor(Math.random() * comHand.length);
            discardTile = comHand.splice(idx, 1)[0];
            const phrases = ['ほいっ！', 'どうや？', 'この牌はどうだ？', 'えいっ！', '勝負や！'];
            comDialogue = phrases[Math.floor(Math.random() * phrases.length)];
        }

        comDiscards.push(discardTile);
        lastComDiscard = discardTile;
        playTone(500, 'square', 0.05, 0.25);

        // プレイヤーの「ロン和了」判定チェック
        if (playerWinningTiles.includes(discardTile)) {
            turn = 'RON_CHANCE';
            playTone(950, 'triangle', 0.3, 0.5); // ロンチャンスSE
        } else {
            // 次のプレイヤーターンへ
            setTimeout(drawPlayerTile, 600);
        }
    }

    // 和了実行（ツモ or ロン）
    function executePlayerWin(isRon) {
        unlockAudio();
        const winTile = isRon ? lastComDiscard : playerTsumo;
        const fullHand = [...playerHand, winTile].sort((a, b) => a - b);
        const result = calculateYaku(fullHand);

        gameState = 'AGARI';
        agariData = {
            type: isRon ? 'RON' : 'TSUMO',
            winner: 'PLAYER',
            name: result.name,
            score: result.score,
            yaku: result.yaku
        };

        // 点数移動（大将から全額受け取る）
        playerScore += result.score;
        comScore -= result.score;
        comDialogue = '参った！お見事！ごっつあんです！';

        spawnConfetti();
        playFanfare();
    }

    // ロンスルーして自分のツモへ進む
    function skipRon() {
        turn = 'PLAYER';
        drawPlayerTile();
    }

    // 捨て牌ナビ（孤立牌の推奨）
    function getPlayerDiscardHint() {
        if (playerTsumo !== null && playerWinningTiles.includes(playerTsumo)) return -999;
        const counts = {};
        const full = [...playerHand, playerTsumo].filter(Boolean);
        full.forEach(t => counts[t] = (counts[t] || 0) + 1);

        for (let t of full) {
            if (t >= 30 && counts[t] === 1) return t; // 孤立字牌
        }
        for (let t of full) {
            if (t < 30 && counts[t] === 1) {
                const hasNeighbor = full.includes(t - 1) || full.includes(t + 1);
                if (!hasNeighbor) return t;
            }
        }
        return full[0];
    }

    // 和了・役判定ロジック
    function isWinningHand(tiles) {
        if (tiles.length !== 14) return false;
        const counts = {};
        tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);

        if (Object.values(counts).filter(c => c === 2).length === 7) return true; // 七対子
        const kokushi = [1, 9, 11, 19, 21, 29, 31, 32, 33, 34, 35, 36, 37];
        if (kokushi.every(kt => counts[kt] >= 1)) return true; // 国士無双

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
        if (tiles.filter(t => t === first).length >= 3) {
            const next = [...tiles];
            next.splice(next.indexOf(first), 3);
            if (canFormMentsu(next)) return true;
        }
        if (first < 30 && (first % 10) <= 7) {
            const s2 = first + 1, s3 = first + 2;
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

    function calculateYaku(tiles) {
        const counts = {};
        tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);

        const kokushi = [1, 9, 11, 19, 21, 29, 31, 32, 33, 34, 35, 36, 37];
        if (kokushi.every(kt => counts[kt] >= 1)) return { name: '国士無双 (役満)', score: 32000, yaku: ['国士無双 (役満)'] };
        if (counts[35] >= 3 && counts[36] >= 3 && counts[37] >= 3) return { name: '大三元 (役満)', score: 32000, yaku: ['大三元 (役満)'] };
        if (Object.values(counts).filter(c => c >= 3).length === 4) return { name: '四暗刻 (役満)', score: 32000, yaku: ['四暗刻 (役満)'] };

        const yakuList = ['立直 (1翻)'];
        let han = 1;
        if (tiles.every(t => (t % 10 >= 2 && t % 10 <= 8 && t < 30))) { yakuList.push('断幺九 (1翻)'); han += 1; }
        const suits = new Set(tiles.filter(t => t < 30).map(t => Math.floor(t / 10)));
        const hasHonors = tiles.some(t => t >= 30);
        if (suits.size === 1 && !hasHonors) { yakuList.push('清一色 (6翻)'); han += 6; }
        else if (suits.size === 1 && hasHonors) { yakuList.push('混一色 (3翻)'); han += 3; }
        if (counts[35] >= 3) { yakuList.push('役牌 白 (1翻)'); han += 1; }
        if (counts[36] >= 3) { yakuList.push('役牌 發 (1翻)'); han += 1; }
        if (counts[37] >= 3) { yakuList.push('役牌 中 (1翻)'); han += 1; }
        if (Object.values(counts).filter(c => c === 2).length === 7) { yakuList.push('七対子 (2翻)'); han += 2; }

        let pts = 8000;
        let rankName = '満貫 (8000点)';
        if (han >= 13) { pts = 32000; rankName = '数え役満 (32000点)'; }
        else if (han >= 11) { pts = 24000; rankName = '三倍満 (24000点)'; }
        else if (han >= 8) { pts = 16000; rankName = '倍満 (16000点)'; }
        else if (han >= 6) { pts = 12000; rankName = '跳満 (12000点)'; }
        else if (han >= 4) { pts = 8000; rankName = '満貫 (8000点)'; }
        else { pts = 4000; rankName = '3翻 4000点'; }

        return { name: rankName, score: pts, yaku: yakuList };
    }

    // ==========================================================================
    // 🎨 画面描画
    // ==========================================================================
    function drawTile(x, y, tileId, isLarge = false, isGlow = false) {
        const info = TILE_INFO[tileId];
        if (!info) return;

        const w = isLarge ? 22 : 16;
        const h = isLarge ? 32 : 23;

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
            ctx.font = `bold ${isLarge ? 13 : 10}px "Noto Serif JP", serif`;
            ctx.fillText(info.text, x + w / 2, y + (info.sub ? h * 0.48 : h * 0.68));
            if (info.sub) {
                ctx.font = `bold ${isLarge ? 9 : 7}px sans-serif`;
                ctx.fillText(info.sub, x + w / 2, y + h * 0.88);
            }
        } else {
            ctx.font = `bold ${isLarge ? 11 : 8}px sans-serif`;
            ctx.fillText(info.num + info.sub, x + w / 2, y + h * 0.68);
        }
    }

    // 牌の裏面描画（COMの手牌用）
    function drawTileBack(x, y) {
        ctx.fillStyle = '#f4a261';
        ctx.beginPath();
        ctx.roundRect(x, y, 14, 20, 2);
        ctx.fill();
        ctx.strokeStyle = '#2c2520';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#e76f51';
        ctx.fillRect(x + 2, y + 2, 10, 16);
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

        // 1. トップステータスバー
        ctx.fillStyle = '#0f2b23';
        ctx.fillRect(10, 10, 340, 32);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(10, 10, 340, 32);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`あなた: ${playerScore}点`, 20, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`大将: ${comScore}点`, 335, 30);

        // 2. 大将（COM）エリア (Y: 48 ~ 115)
        ctx.fillStyle = '#163e32';
        ctx.fillRect(15, 48, 330, 68);
        ctx.strokeStyle = '#276753';
        ctx.strokeRect(15, 48, 330, 68);

        // 大将アイコン ＆ セリフ
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 12px "Noto Serif JP", serif';
        ctx.textAlign = 'left';
        ctx.fillText('🥋 大将 (元・琴嵐)', 24, 66);

        // フキダシ
        ctx.fillStyle = '#0f2b23';
        ctx.beginPath();
        ctx.roundRect(140, 52, 195, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#00ffcc';
        ctx.font = '10px sans-serif';
        ctx.fillText(comDialogue, 146, 66);

        // 大将の伏せ牌（13枚）
        for (let i = 0; i < 13; i++) {
            drawTileBack(24 + i * 16, 78);
        }

        // 3. 河（捨て牌）エリア (Y: 122 ~ 220)
        ctx.fillStyle = '#123329';
        ctx.fillRect(15, 122, 330, 100);
        ctx.strokeStyle = '#276753';
        ctx.strokeRect(15, 122, 330, 100);

        // 大将の河 (上2段)
        ctx.fillStyle = '#88c2a8';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('【 大将の河 】', 22, 134);
        comDiscards.forEach((t, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            drawTile(85 + col * 18, 124 + row * 24, t, false);
        });

        // プレイヤーの河 (下2段)
        ctx.fillStyle = '#88c2a8';
        ctx.fillText('【 あなたの河 】', 22, 184);
        playerDiscards.forEach((t, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            drawTile(85 + col * 18, 174 + row * 24, t, false);
        });

        // ドラ表示
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('ドラ:', 245, 168);
        if (doraTile) drawTile(275, 150, doraTile, false);

        // 4. アクション ＆ メッセージエリア (Y: 230 ~ 285)
        const actionY = 232;

        if (turn === 'RON_CHANCE' && gameState === 'PLAY') {
            // ⚡ ロン和了ボタン（点滅）
            ctx.save();
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#ff2a2a';
            ctx.beginPath();
            ctx.roundRect(40, actionY, 135, 46, 8);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText('🀄 ロン和了！', 107, actionY + 30);
            ctx.restore();

            // スルーボタン
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.roundRect(190, actionY + 6, 120, 36, 6);
            ctx.fill();
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText('スルー (見送り)', 250, actionY + 29);
        } else if (playerTsumo !== null && playerWinningTiles.includes(playerTsumo) && gameState === 'PLAY') {
            // ⚡ ツモ和了ボタン（点滅）
            ctx.save();
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#ff2a2a';
            ctx.beginPath();
            ctx.roundRect(80, actionY, 200, 46, 8);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText('🀄 ツモ和了！！', 180, actionY + 30);
            ctx.restore();
        } else if (gameState === 'PLAY') {
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            if (turn === 'COM') {
                ctx.fillText('大将が考え中… 💭', 180, actionY + 28);
            } else if (playerWinningTiles.length > 0) {
                ctx.fillText('⚡ テンパイ中！大将の捨て牌をロンかツモで狙え！ ⚡', 180, actionY + 28);
            } else {
                ctx.fillText('👇「捨」マークの不要牌を切ってテンパイを目指そう！', 180, actionY + 28);
            }
        }

        // 5. プレイヤー手牌エリア (Y: 295 ~ 410)
        const handY = 325;
        ctx.fillStyle = '#0f2b23';
        ctx.fillRect(10, handY - 28, 340, 96);
        ctx.strokeStyle = '#276753';
        ctx.strokeRect(10, handY - 28, 340, 96);

        ctx.fillStyle = '#fcfaf2';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('【 あなたの手牌 】', 18, handY - 10);

        const hintTile = getPlayerDiscardHint();

        // 13枚の手牌
        playerHand.forEach((t, i) => {
            const x = 16 + i * 23;
            const isHint = (t === hintTile && turn === 'PLAYER' && !playerWinningTiles.includes(playerTsumo));
            drawTile(x, handY, t, true, isHint);

            if (isHint) {
                ctx.fillStyle = '#ff3366';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('捨▼', x + 11, handY - 2);
            }
        });

        // プレイヤーのツモ牌（右端）
        if (playerTsumo !== null) {
            const tsumoX = 16 + 13 * 23 + 6;
            const isWin = playerWinningTiles.includes(playerTsumo);
            const isHint = (playerTsumo === hintTile && !isWin);
            drawTile(tsumoX, handY, playerTsumo, true, isWin || isHint);

            ctx.fillStyle = isWin ? '#ffd700' : (isHint ? '#ff3366' : '#00ffcc');
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isWin ? '🎉当り' : (isHint ? '捨▼' : 'ツモ'), tsumoX + 11, handY - 2);
        }

        // 紙吹雪描画
        updateAndDrawConfetti();

        // 6. 和了結果モーダル
        if (gameState === 'AGARI' && agariData) {
            ctx.fillStyle = 'rgba(10, 20, 15, 0.95)';
            ctx.fillRect(15, 95, 330, 275);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 4;
            ctx.strokeRect(15, 95, 330, 275);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 22px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText(`✨ ${agariData.type === 'RON' ? 'ロン和了！' : 'ツモ和了！'} ${agariData.name} ✨`, 180, 135);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText(`大将から +${agariData.score} 点獲得！ 大勝利！`, 180, 170);

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#a8e6cf';
            agariData.yaku.forEach((yk, idx) => {
                ctx.fillText(yk, 180, 202 + idx * 20);
            });

            // もう一局ボタン
            ctx.fillStyle = '#f4a261';
            ctx.beginPath();
            ctx.roundRect(90, 305, 180, 44, 8);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#2c2520';
            ctx.font = 'bold 15px sans-serif';
            ctx.fillText('もう一局勝負！ 🀄', 180, 333);
        } else if (gameState === 'RYUKYOKU') {
            ctx.fillStyle = 'rgba(10, 20, 15, 0.92)';
            ctx.fillRect(20, 150, 320, 160);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 150, 320, 160);

            ctx.fillStyle = '#fcfaf2';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('流局 (引き分け)', 180, 200);

            ctx.fillStyle = '#f4a261';
            ctx.beginPath();
            ctx.roundRect(100, 240, 160, 38, 6);
            ctx.fill();
            ctx.fillStyle = '#2c2520';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('もう一局打つ 🀄', 180, 264);
        }

        // フッター
        ctx.fillStyle = '#aaa';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('大将との1対1対戦中！テンパイしたらロンかツモで決めよう！', 180, 480);
    }

    // ==========================================================================
    // 🎮 ループ ＆ タップ入力判定
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

        // アガリ・流局画面のリトライ
        if (gameState === 'AGARI' || gameState === 'RYUKYOKU') {
            if (p.x >= 90 && p.x <= 270 && p.y >= 230 && p.y <= 360) {
                startNewGame();
            }
            return;
        }

        // ロン和了チャンス中
        if (turn === 'RON_CHANCE') {
            if (p.x >= 40 && p.x <= 175 && p.y >= 230 && p.y <= 280) {
                executePlayerWin(true); // ロン和了
                return;
            } else if (p.x >= 190 && p.x <= 310 && p.y >= 230 && p.y <= 280) {
                skipRon(); // スルー
                return;
            }
        }

        // ツモ和了ボタンタップ
        if (playerTsumo !== null && playerWinningTiles.includes(playerTsumo) && p.x >= 80 && p.x <= 280 && p.y >= 230 && p.y <= 280) {
            executePlayerWin(false); // ツモ和了
            return;
        }

        // プレイヤーターン時の手牌タップ（打牌）
        if (turn === 'PLAYER') {
            const handY = 325;
            if (p.y >= handY - 15 && p.y <= handY + 45) {
                for (let i = 0; i < playerHand.length; i++) {
                    const x = 16 + i * 23;
                    if (p.x >= x && p.x <= x + 22) {
                        playerDiscard(i);
                        return;
                    }
                }
                if (playerTsumo !== null) {
                    const tsumoX = 16 + 13 * 23 + 6;
                    if (p.x >= tsumoX && p.x <= tsumoX + 22) {
                        playerDiscard(-1); // ツモ切り
                        return;
                    }
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
