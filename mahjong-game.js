/**
 * 🀄 琴嵐 役作り麻雀（専用スクリプト）
 * ・1人打ちで役満・高得点を目指す麻雀ゲーム
 * ・役判定（立直、ツモ、タンヤオ、ピンフ、混一色、清一色、七対子、四暗刻、大三元、国士無双など）
 * ・タップで不要牌を切るだけの簡単操作
 * ・Web Audio API による打牌音・ツモ音・ファンファーレ内蔵
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

    function playTone(freq, type, duration, gainVal = 0.2) {
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

    // 打牌音（カチッ）
    function playDiscardSound() {
        playTone(600, 'square', 0.04, 0.3);
    }

    // リーチ音
    function playRiichiSound() {
        playTone(1200, 'triangle', 0.25, 0.4);
    }

    // アガリファンファーレ
    function playAgariSound() {
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

    // ==========================================================================
    // 🀄 牌定義 ＆ 山牌生成
    // ==========================================================================
    // 萬子: 1m-9m (1-9), 筒子: 1p-9p (11-19), 索子: 1s-9s (21-29)
    // 字牌: 東(31), 南(32), 西(33), 北(34), 白(35), 發(36), 中(37)
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
    let hand = [];      // 13枚の手牌
    let tsumoTile = null; // ツモ牌（14枚目）
    let discards = [];  // 捨て牌（河）
    let doraTile = null;
    let isRiichi = false;
    let isTenpai = false;
    let canTsumoAgari = false;
    let gameState = 'PLAY'; // 'PLAY', 'AGARI', 'RYUKYOKU'
    let agariResult = null;
    let score = 25000;
    let roundCount = 1;

    // 山牌初期化（各4枚、計136枚）
    function initWall() {
        wall = [];
        ALL_TILE_IDS.forEach(id => {
            for (let i = 0; i < 4; i++) {
                wall.push(id);
            }
        });
        // シャッフル
        for (let i = wall.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wall[i], wall[j]] = [wall[j], wall[i]];
        }
    }

    function sortHand() {
        hand.sort((a, b) => a - b);
    }

    function startNewGame() {
        initWall();
        hand = [];
        discards = [];
        isRiichi = false;
        isTenpai = false;
        canTsumoAgari = false;
        agariResult = null;
        gameState = 'PLAY';

        // ドラ表示牌
        doraTile = wall.pop();

        // 13枚配牌
        for (let i = 0; i < 13; i++) {
            hand.push(wall.pop());
        }
        sortHand();

        // 第1ツモ
        drawTile();
    }

    function drawTile() {
        if (wall.length === 0 || discards.length >= 18) {
            gameState = 'RYUKYOKU';
            return;
        }
        tsumoTile = wall.pop();
        checkWinningAndTenpai();
    }

    function discardTile(index) {
        let discarded;
        if (index === -1) {
            // ツモ切り
            discarded = tsumoTile;
            tsumoTile = null;
        } else {
            // 手牌から切る
            discarded = hand.splice(index, 1)[0];
            if (tsumoTile !== null) {
                hand.push(tsumoTile);
                tsumoTile = null;
                sortHand();
            }
        }

        discards.push(discarded);
        playDiscardSound();

        // リーチ時はオートツモ切り判定
        setTimeout(() => {
            drawTile();
        }, 120);
    }

    // ==========================================================================
    // 🧠 和了・テンパイ・役判定ロジック
    // ==========================================================================
    function checkWinningAndTenpai() {
        if (!tsumoTile) return;
        const fullHand = [...hand, tsumoTile].sort((a, b) => a - b);
        const win = isWinningHand(fullHand);

        if (win) {
            canTsumoAgari = true;
            agariResult = calculateYaku(fullHand);
        } else {
            canTsumoAgari = false;
        }
    }

    // 4面子1雀頭 / 七対子 / 国士無双 判定
    function isWinningHand(tiles) {
        if (tiles.length !== 14) return false;

        // 七対子判定
        const counts = {};
        tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);
        const pairs = Object.values(counts).filter(c => c === 2).length;
        if (pairs === 7) return true;

        // 国士無双判定
        const kokushiTiles = [1, 9, 11, 19, 21, 29, 31, 32, 33, 34, 35, 36, 37];
        const hasAllKokushi = kokushiTiles.every(kt => counts[kt] >= 1);
        if (hasAllKokushi) return true;

        // 通常手 (4面子 + 1雀頭)
        const uniqueTiles = Object.keys(counts).map(Number);
        for (let head of uniqueTiles) {
            if (counts[head] >= 2) {
                const remaining = [...tiles];
                // 雀頭を2枚除く
                remaining.splice(remaining.indexOf(head), 1);
                remaining.splice(remaining.indexOf(head), 1);
                if (canFormMentsu(remaining)) return true;
            }
        }
        return false;
    }

    function canFormMentsu(tiles) {
        if (tiles.length === 0) return true;
        const first = tiles[0];

        // 刻子判定 (同じ牌3枚)
        if (tiles.filter(t => t === first).length >= 3) {
            const nextTiles = [...tiles];
            nextTiles.splice(nextTiles.indexOf(first), 1);
            nextTiles.splice(nextTiles.indexOf(first), 1);
            nextTiles.splice(nextTiles.indexOf(first), 1);
            if (canFormMentsu(nextTiles)) return true;
        }

        // 順子判定 (数牌の連続3枚)
        if (first < 30 && (first % 10) <= 7) {
            const second = first + 1;
            const third = first + 2;
            if (tiles.includes(second) && tiles.includes(third)) {
                const nextTiles = [...tiles];
                nextTiles.splice(nextTiles.indexOf(first), 1);
                nextTiles.splice(nextTiles.indexOf(second), 1);
                nextTiles.splice(nextTiles.indexOf(third), 1);
                if (canFormMentsu(nextTiles)) return true;
            }
        }

        return false;
    }

    // 役判定＆得点計算
    function calculateYaku(tiles) {
        const yakuList = [];
        let han = 0;
        let isYakuman = false;

        const counts = {};
        tiles.forEach(t => counts[t] = (counts[t] || 0) + 1);

        // 役満判定
        const kokushiTiles = [1, 9, 11, 19, 21, 29, 31, 32, 33, 34, 35, 36, 37];
        if (kokushiTiles.every(kt => counts[kt] >= 1)) {
            return { yaku: ['国士無双 (役満)'], han: 13, score: 32000, name: '役満' };
        }
        if (counts[35] >= 3 && counts[36] >= 3 && counts[37] >= 3) {
            return { yaku: ['大三元 (役満)'], han: 13, score: 32000, name: '役満' };
        }
        const tripletCount = Object.values(counts).filter(c => c >= 3).length;
        if (tripletCount === 4) {
            return { yaku: ['四暗刻 (役満)'], han: 13, score: 32000, name: '役満' };
        }

        // 通常役
        if (isRiichi) { yakuList.push('立直 (1翻)'); han += 1; }
        yakuList.push('門前清自摸和 (1翻)'); han += 1;

        // タンヤオ (1,9,字牌なし)
        const isTanyao = tiles.every(t => (t % 10 >= 2 && t % 10 <= 8 && t < 30));
        if (isTanyao) { yakuList.push('断幺九 (1翻)'); han += 1; }

        // 清一色 / 混一色
        const suits = new Set(tiles.filter(t => t < 30).map(t => Math.floor(t / 10)));
        const hasHonors = tiles.some(t => t >= 30);
        if (suits.size === 1 && !hasHonors) {
            yakuList.push('清一色 (6翻)'); han += 6;
        } else if (suits.size === 1 && hasHonors) {
            yakuList.push('混一色 (3翻)'); han += 3;
        }

        // 役牌 (白・發・中・自風東)
        if (counts[35] >= 3) { yakuList.push('役牌 白 (1翻)'); han += 1; }
        if (counts[36] >= 3) { yakuList.push('役牌 發 (1翻)'); han += 1; }
        if (counts[37] >= 3) { yakuList.push('役牌 中 (1翻)'); han += 1; }
        if (counts[31] >= 3) { yakuList.push('自風 東 (1翻)'); han += 1; }

        // 七対子
        const pairs = Object.values(counts).filter(c => c === 2).length;
        if (pairs === 7) { yakuList.push('七対子 (2翻)'); han += 2; }

        // 得点
        let pts = 0;
        let rankName = '';
        if (han >= 13) { pts = 32000; rankName = '数え役満'; }
        else if (han >= 11) { pts = 24000; rankName = '三倍満'; }
        else if (han >= 8) { pts = 16000; rankName = '倍満'; }
        else if (han >= 6) { pts = 12000; rankName = '跳満'; }
        else if (han >= 4) { pts = 8000; rankName = '満貫'; }
        else if (han === 3) { pts = 4000; rankName = '3翻 4000点'; }
        else if (han === 2) { pts = 2000; rankName = '2翻 2000点'; }
        else { pts = 1000; rankName = '1翻 1000点'; }

        return { yaku: yakuList, han, score: pts, name: rankName };
    }

    function executeAgari() {
        if (!canTsumoAgari || !agariResult) return;
        gameState = 'AGARI';
        score += agariResult.score;
        playAgariSound();
    }

    // ==========================================================================
    // 🎨 描画処理 (360 x 500)
    // ==========================================================================
    function drawTileObject(x, y, tileId, isLarge = false) {
        const info = TILE_INFO[tileId];
        if (!info) return;

        const w = isLarge ? 22 : 18;
        const h = isLarge ? 32 : 26;

        // 牌の背・表面
        ctx.fillStyle = '#fcfaf2';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 3);
        ctx.fill();
        ctx.strokeStyle = '#2c2520';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 牌の文字
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

    function draw() {
        // 背景（雀卓グリーン）
        ctx.fillStyle = '#1b4d3e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 枠線（木枠）
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        // 上部ステータスバー
        ctx.fillStyle = '#0f2b23';
        ctx.fillRect(10, 10, 340, 48);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(10, 10, 340, 48);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`持ち点: ${score}点`, 20, 30);

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px sans-serif';
        ctx.fillText(`残ツモ: ${Math.max(0, 18 - discards.length)}回`, 20, 48);

        // ドラ表示
        ctx.fillStyle = '#f4a261';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('ドラ表示牌:', 190, 38);
        if (doraTile) {
            drawTileObject(265, 18, doraTile, false);
        }

        // 捨て牌エリア（河: 6枚×3行）
        ctx.fillStyle = '#163e32';
        ctx.fillRect(15, 66, 330, 95);
        ctx.strokeStyle = '#276753';
        ctx.lineWidth = 1;
        ctx.strokeRect(15, 66, 330, 95);

        ctx.fillStyle = '#6ab098';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('【 自分の河 (捨て牌) 】', 22, 80);

        discards.forEach((t, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const x = 25 + col * 23;
            const y = 88 + row * 28;
            drawTileObject(x, y, t, false);
        });

        // アクションボタン ＆ メッセージエリア
        const actionY = 175;
        if (canTsumoAgari && gameState === 'PLAY') {
            // ツモ和了ボタン（点滅）
            ctx.fillStyle = '#ff2a2a';
            ctx.beginPath();
            ctx.roundRect(110, actionY, 140, 36, 6);
            ctx.fill();
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🀄 ツモ和了！！', 180, actionY + 24);
        } else if (!isRiichi && discards.length > 0 && gameState === 'PLAY') {
            // リーチボタン
            ctx.fillStyle = '#2c2520';
            ctx.beginPath();
            ctx.roundRect(125, actionY, 110, 32, 6);
            ctx.fill();
            ctx.strokeStyle = '#f4a261';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#f4a261';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚡ リーチ宣言', 180, actionY + 21);
        }

        // 手牌エリア
        const handY = 320;
        ctx.fillStyle = '#0f2b23';
        ctx.fillRect(10, handY - 25, 340, 95);
        ctx.strokeStyle = '#276753';
        ctx.strokeRect(10, handY - 25, 340, 95);

        ctx.fillStyle = '#fcfaf2';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('【 手牌（タップして打牌） 】', 18, handY - 8);

        // 13枚の手牌描画
        hand.forEach((t, i) => {
            const x = 16 + i * 23;
            drawTileObject(x, handY, t, true);
        });

        // ツモ牌描画（少し離して右端に配置）
        if (tsumoTile !== null) {
            const tsumoX = 16 + 13 * 23 + 6;
            drawTileObject(tsumoX, handY, tsumoTile, true);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ツモ', tsumoX + 11, handY + 44);
        }

        // アガリ結果モーダルオーバーレイ
        if (gameState === 'AGARI' && agariResult) {
            ctx.fillStyle = 'rgba(10, 20, 15, 0.9)';
            ctx.fillRect(15, 120, 330, 240);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(15, 120, 330, 240);

            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 20px "Noto Serif JP", serif';
            ctx.textAlign = 'center';
            ctx.fillText(`✨ ${agariResult.name} ✨`, 180, 155);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(`+${agariResult.score} 点獲得！ ごっつあんです！`, 180, 185);

            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#a8e6cf';
            agariResult.yaku.forEach((yk, idx) => {
                ctx.fillText(yk, 180, 215 + idx * 20);
            });

            // 次の局ボタン
            ctx.fillStyle = '#f4a261';
            ctx.beginPath();
            ctx.roundRect(100, 305, 160, 38, 6);
            ctx.fill();
            ctx.fillStyle = '#2c2520';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('次の局へ進む 🀄', 180, 329);
        } else if (gameState === 'RYUKYOKU') {
            ctx.fillStyle = 'rgba(10, 20, 15, 0.9)';
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

        // フッター
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('手牌をタップで打牌 / 役満を目指してツモろう！', 180, 480);
    }

    // ==========================================================================
    // 🎮 ループ ＆ クリック・タッチイベント
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
        getAudio();

        // アガリ・流局画面のボタン
        if (gameState === 'AGARI' || gameState === 'RYUKYOKU') {
            if (p.x >= 100 && p.x <= 260 && p.y >= 240 && p.y <= 350) {
                startNewGame();
            }
            return;
        }

        // ツモ和了ボタン
        if (canTsumoAgari && p.x >= 110 && p.x <= 250 && p.y >= 175 && p.y <= 211) {
            executeAgari();
            return;
        }

        // リーチボタン
        if (!isRiichi && p.x >= 125 && p.x <= 235 && p.y >= 175 && p.y <= 207) {
            isRiichi = true;
            playRiichiSound();
            return;
        }

        // 手牌タップ判定 (Y: 320〜352)
        const handY = 320;
        if (p.y >= handY - 10 && p.y <= handY + 45) {
            // 13枚の手牌
            for (let i = 0; i < hand.length; i++) {
                const x = 16 + i * 23;
                if (p.x >= x && p.x <= x + 22) {
                    discardTile(i);
                    return;
                }
            }
            // ツモ牌 (一番右端)
            if (tsumoTile !== null) {
                const tsumoX = 16 + 13 * 23 + 6;
                if (p.x >= tsumoX && p.x <= tsumoX + 22) {
                    discardTile(-1); // ツモ切り
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

    // グローバル公開関数
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
