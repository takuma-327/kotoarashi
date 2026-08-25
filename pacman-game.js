/**
 * 🟡 琴嵐 パックマン（専用スクリプト）
 * ・パワーエサ（🍲ちゃんこ鍋）で無敵化＆ゴースト撃退！
 * ・PC（矢印キー / WASD）＆ スマホ（画面スワイプ）対応
 * ・Web Audio API によるレトロサウンド完全内蔵
 */
(function () {
    const canvas = document.getElementById('pacmanCanvas');
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

    function playTone(freq, type, duration, gainVal = 0.15) {
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

    // ==========================================================================
    // 🗺️ 迷路マップ定義 (15列 × 17行)
    // 1: 壁, 2: 米粒(通常ドット), 3: パワーちゃんこ鍋, 0: 通路, 4: ゴースト初期位置
    // ==========================================================================
    const TILE_SIZE = 22;
    const MAP_COLS = 15;
    const MAP_ROWS = 17;
    const OFFSET_X = (canvas.width - MAP_COLS * TILE_SIZE) / 2;
    const OFFSET_Y = 65;

    const ORIGINAL_MAP = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,3,2,2,2,2,2,1,2,2,2,2,2,3,1],
        [1,2,1,1,2,1,2,1,2,1,2,1,1,2,1],
        [1,2,1,1,2,1,2,1,2,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,1,1,1,2,1,1,2,1],
        [1,2,2,2,2,2,2,1,2,2,2,2,2,2,1],
        [1,1,1,1,2,1,0,0,0,1,2,1,1,1,1],
        [0,0,0,1,2,1,4,4,4,1,2,1,0,0,0],
        [1,1,1,1,2,1,1,1,1,1,2,1,1,1,1],
        [1,2,2,2,2,2,2,1,2,2,2,2,2,2,1],
        [1,2,1,1,2,1,1,1,1,1,2,1,1,2,1],
        [1,2,2,1,2,2,2,2,2,2,2,1,2,2,1],
        [1,1,2,1,2,1,2,1,2,1,2,1,2,1,1],
        [1,3,2,2,2,1,2,1,2,1,2,2,2,3,1],
        [1,2,1,1,1,1,2,1,2,1,1,1,1,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    let map = [];
    let score = 0;
    let highScore = 0;
    let lives = 3;
    let gameState = 'PLAY'; // 'PLAY', 'GAMEOVER', 'CLEAR'
    let powerTimer = 0; // 無敵（イジケ）時間

    // パックマン（力士）
    const pacman = {
        gridX: 7, gridY: 12,
        x: 7 * TILE_SIZE + TILE_SIZE / 2,
        y: 12 * TILE_SIZE + TILE_SIZE / 2,
        dirX: 0, dirY: 0,
        nextDirX: 0, nextDirY: 0,
        speed: 2,
        mouthAngle: 0.2,
        mouthSpeed: 0.04
    };

    // ゴースト（赤・ピンク・水色・オレンジ）
    const ghostColors = ['#ff2a2a', '#ff99cc', '#00ddff', '#ff9900'];
    let ghosts = [];

    function initGhosts() {
        ghosts = [
            { x: 7 * TILE_SIZE + TILE_SIZE / 2, y: 7 * TILE_SIZE + TILE_SIZE / 2, dirX: 1, dirY: 0, color: ghostColors[0], isScared: false, alive: true },
            { x: 6 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2, dirX: -1, dirY: 0, color: ghostColors[1], isScared: false, alive: true },
            { x: 7 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2, dirX: 0, dirY: -1, color: ghostColors[2], isScared: false, alive: true },
            { x: 8 * TILE_SIZE + TILE_SIZE / 2, y: 8 * TILE_SIZE + TILE_SIZE / 2, dirX: 0, dirY: 1, color: ghostColors[3], isScared: false, alive: true }
        ];
    }

    function resetGame() {
        map = ORIGINAL_MAP.map(row => [...row]);
        score = 0;
        lives = 3;
        powerTimer = 0;
        resetPositions();
        gameState = 'PLAY';
    }

    function resetPositions() {
        pacman.gridX = 7; pacman.gridY = 12;
        pacman.x = 7 * TILE_SIZE + TILE_SIZE / 2;
        pacman.y = 12 * TILE_SIZE + TILE_SIZE / 2;
        pacman.dirX = 0; pacman.dirY = 0;
        pacman.nextDirX = 0; pacman.nextDirY = 0;
        initGhosts();
    }

    function isWall(gx, gy) {
        if (gx < 0 || gx >= MAP_COLS || gy < 0 || gy >= MAP_ROWS) return false;
        return map[gy][gx] === 1;
    }

    // ==========================================================================
    // 🕹️ 更新ロジック
    // ==========================================================================
    function update() {
        if (gameState !== 'PLAY') return;

        // パワータイマーカウントダウン
        if (powerTimer > 0) {
            powerTimer--;
            if (powerTimer === 0) {
                ghosts.forEach(g => g.isScared = false);
            }
        }

        // 口パクアニメーション
        pacman.mouthAngle += pacman.mouthSpeed;
        if (pacman.mouthAngle > 0.45 || pacman.mouthAngle < 0.05) {
            pacman.mouthSpeed = -pacman.mouthSpeed;
        }

        // 次の進行方向転換判定（タイルの中心付近で曲がる）
        const curGX = Math.floor(pacman.x / TILE_SIZE);
        const curGY = Math.floor(pacman.y / TILE_SIZE);
        const centerX = curGX * TILE_SIZE + TILE_SIZE / 2;
        const centerY = curGY * TILE_SIZE + TILE_SIZE / 2;

        if (Math.abs(pacman.x - centerX) < 3 && Math.abs(pacman.y - centerY) < 3) {
            if (pacman.nextDirX !== 0 || pacman.nextDirY !== 0) {
                if (!isWall(curGX + pacman.nextDirX, curGY + pacman.nextDirY)) {
                    pacman.dirX = pacman.nextDirX;
                    pacman.dirY = pacman.nextDirY;
                    pacman.x = centerX;
                    pacman.y = centerY;
                }
            }
        }

        // パックマン移動
        const nextX = pacman.x + pacman.dirX * pacman.speed;
        const nextY = pacman.y + pacman.dirY * pacman.speed;
        const targetGX = Math.floor((nextX + pacman.dirX * 10) / TILE_SIZE);
        const targetGY = Math.floor((nextY + pacman.dirY * 10) / TILE_SIZE);

        if (!isWall(targetGX, targetGY)) {
            pacman.x = nextX;
            pacman.y = nextY;
        }

        // ワープトンネル（左右の端）
        if (pacman.x < 0) pacman.x = MAP_COLS * TILE_SIZE;
        if (pacman.x > MAP_COLS * TILE_SIZE) pacman.x = 0;

        // ドット＆パワーエサ取得判定
        const pGX = Math.floor(pacman.x / TILE_SIZE);
        const pGY = Math.floor(pacman.y / TILE_SIZE);

        if (pGX >= 0 && pGX < MAP_COLS && pGY >= 0 && pGY < MAP_ROWS) {
            if (map[pGY][pGX] === 2) {
                map[pGY][pGX] = 0;
                score += 10;
                playTone(550, 'triangle', 0.05, 0.1); // ワカワカ音
            } else if (map[pGY][pGX] === 3) {
                map[pGY][pGX] = 0;
                score += 50;
                powerTimer = 350; // 約6秒間無敵
                ghosts.forEach(g => { if (g.alive) g.isScared = true; });
                playTone(880, 'square', 0.2, 0.3); // パワーアップ音
            }
        }

        // クリア判定
        const remainingDots = map.flat().filter(tile => tile === 2 || tile === 3).length;
        if (remainingDots === 0) {
            gameState = 'CLEAR';
            playTone(1046, 'sine', 0.5, 0.3);
            return;
        }

        // ゴースト移動＆衝突判定
        const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

        ghosts.forEach(g => {
            if (!g.alive) return;

            const gGX = Math.floor(g.x / TILE_SIZE);
            const gGY = Math.floor(g.y / TILE_SIZE);
            const gCenterX = gGX * TILE_SIZE + TILE_SIZE / 2;
            const gCenterY = gGY * TILE_SIZE + TILE_SIZE / 2;

            if (Math.abs(g.x - gCenterX) < 2 && Math.abs(g.y - gCenterY) < 2) {
                // 移動可能な方向を探索
                const validDirs = directions.filter(d => {
                    if (d.x === -g.dirX && d.y === -g.dirY) return false; // 逆走防止
                    return !isWall(gGX + d.x, gGY + d.y);
                });

                if (validDirs.length > 0) {
                    const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
                    g.dirX = chosen.x;
                    g.dirY = chosen.y;
                } else if (isWall(gGX + g.dirX, gGY + g.dirY)) {
                    g.dirX = -g.dirX;
                    g.dirY = -g.dirY;
                }
            }

            const gSpeed = g.isScared ? 1.2 : 1.6;
            g.x += g.dirX * gSpeed;
            g.y += g.dirY * gSpeed;

            // 衝突判定
            const dist = Math.hypot(pacman.x - g.x, pacman.y - g.y);
            if (dist < TILE_SIZE * 0.8) {
                if (g.isScared) {
                    // ゴースト撃退！
                    g.alive = false;
                    score += 200;
                    playTone(900, 'sawtooth', 0.15, 0.4);
                    setTimeout(() => {
                        g.x = 7 * TILE_SIZE + TILE_SIZE / 2;
                        g.y = 8 * TILE_SIZE + TILE_SIZE / 2;
                        g.isScared = false;
                        g.alive = true;
                    }, 4000);
                } else {
                    // ミス！
                    lives--;
                    playTone(150, 'sawtooth', 0.4, 0.4);
                    if (lives <= 0) {
                        gameState = 'GAMEOVER';
                    } else {
                        resetPositions();
                    }
                }
            }
        });

        if (score > highScore) highScore = score;
    }

    // ==========================================================================
    // 🎨 画面描画
    // ==========================================================================
    function draw() {
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 枠線
        ctx.strokeStyle = '#9e2a2b';
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

        // スコア ＆ ライフヘッダー
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 18, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`HIGH: ${highScore}`, canvas.width - 18, 30);

        // ライフアイコン（力士）
        ctx.fillStyle = '#f4a261';
        for (let i = 0; i < lives; i++) {
            ctx.beginPath();
            ctx.arc(25 + i * 22, 48, 8, 0.2 * Math.PI, 1.8 * Math.PI);
            ctx.lineTo(25 + i * 22, 48);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(OFFSET_X, OFFSET_Y);

        // 迷路描画
        for (let r = 0; r < MAP_ROWS; r++) {
            for (let c = 0; c < MAP_COLS; c++) {
                const cell = map[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;

                if (cell === 1) {
                    ctx.fillStyle = '#1e3d59';
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = '#17b978';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                } else if (cell === 2) {
                    // 米粒エサ
                    ctx.fillStyle = '#fcfaf2';
                    ctx.beginPath();
                    ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (cell === 3) {
                    // パワーちゃんこ鍋🍲
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('🍲', x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 5);
                }
            }
        }

        // パックマン描画（口を開閉する力士パックマン）
        let angle = 0;
        if (pacman.dirX === 1) angle = 0;
        else if (pacman.dirX === -1) angle = Math.PI;
        else if (pacman.dirY === 1) angle = Math.PI / 2;
        else if (pacman.dirY === -1) angle = -Math.PI / 2;

        ctx.save();
        ctx.translate(pacman.x, pacman.y);
        ctx.rotate(angle);
        ctx.fillStyle = '#f4a261'; // 力士肌色
        ctx.beginPath();
        ctx.arc(0, 0, TILE_SIZE / 2 - 2, pacman.mouthAngle * Math.PI, (2 - pacman.mouthAngle) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fill();
        // 髷（まげ）装飾
        ctx.fillStyle = '#111';
        ctx.fillRect(-6, -TILE_SIZE / 2 - 1, 4, 3);
        ctx.restore();

        // ゴースト描画
        ghosts.forEach(g => {
            if (!g.alive) return;
            ctx.save();
            ctx.translate(g.x, g.y);

            // イジケ状態（青色）または通常カラー
            ctx.fillStyle = g.isScared ? (powerTimer < 80 && Math.floor(powerTimer / 10) % 2 === 0 ? '#ffffff' : '#2255ff') : g.color;

            // ゴースト本体
            ctx.beginPath();
            ctx.arc(0, -2, TILE_SIZE / 2 - 3, Math.PI, 0, false);
            ctx.lineTo(TILE_SIZE / 2 - 3, TILE_SIZE / 2 - 4);
            ctx.lineTo(0, TILE_SIZE / 2 - 8);
            ctx.lineTo(-TILE_SIZE / 2 + 3, TILE_SIZE / 2 - 4);
            ctx.fill();

            // 目
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-3, -3, 3, 0, Math.PI * 2);
            ctx.arc(3, -3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000088';
            ctx.beginPath();
            ctx.arc(-3 + g.dirX, -3 + g.dirY, 1.5, 0, Math.PI * 2);
            ctx.arc(3 + g.dirX, -3 + g.dirY, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });

        ctx.restore();

        // ゲームオーバー ＆ クリア演出
        if (gameState === 'GAMEOVER') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(20, 180, canvas.width - 40, 140);
            ctx.fillStyle = '#ff3366';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', 180, 235);
            ctx.fillStyle = '#fff';
            ctx.font = '13px sans-serif';
            ctx.fillText('タップで再挑戦！', 180, 275);
        } else if (gameState === 'CLEAR') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(20, 180, canvas.width - 40, 140);
            ctx.fillStyle = '#00ffcc';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('✨ 全完食！ごっつあんです！ ✨', 180, 235);
            ctx.fillStyle = '#fff';
            ctx.font = '13px sans-serif';
            ctx.fillText('タップで次のラウンドへ！', 180, 275);
        }

        // フッター
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PC: 矢印キー / WASD (移動) | スマホ: スワイプ', 180, 480);
    }

    // ==========================================================================
    // 🎮 ループ ＆ 入力イベント
    // ==========================================================================
    let animId = null;
    function loop() {
        update();
        draw();
        animId = requestAnimationFrame(loop);
    }

    // キーボード入力
    window.addEventListener('keydown', (e) => {
        if (canvas.style.display === 'none') return;
        getAudio();

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }

        if (gameState !== 'PLAY') {
            resetGame();
            return;
        }

        if (e.code === 'ArrowUp' || e.code === 'KeyW') { pacman.nextDirX = 0; pacman.nextDirY = -1; }
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') { pacman.nextDirX = 0; pacman.nextDirY = 1; }
        else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { pacman.nextDirX = -1; pacman.nextDirY = 0; }
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') { pacman.nextDirX = 1; pacman.nextDirY = 0; }
    });

    // スマホタッチ＆スワイプ入力
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        getAudio();
        if (gameState !== 'PLAY') {
            resetGame();
            return;
        }
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (gameState !== 'PLAY') return;

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        if (Math.abs(diffX) > 20 || Math.abs(diffY) > 20) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                pacman.nextDirX = diffX > 0 ? 1 : -1;
                pacman.nextDirY = 0;
            } else {
                pacman.nextDirX = 0;
                pacman.nextDirY = diffY > 0 ? 1 : -1;
            }
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        }
    }, { passive: false });

    resetGame();

    // グローバル公開関数
    window.startPacmanGame = function () {
        if (!animId) loop();
    };

    window.stopPacmanGame = function () {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    };
})();
