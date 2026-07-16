// ==========================================
// 🎮 琴嵐ミニゲーム (game.js)
// ==========================================

function initGame() {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const gameWidth = canvas.width;
  const gameHeight = canvas.height;

  // --- ドット絵データ ---
  const sumoSprite = [
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 2, 1, 1, 1, 1, 2, 0],
      [0, 1, 2, 1, 1, 2, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 2, 2, 1, 1, 1],
      [0, 1, 3, 3, 3, 3, 1, 0],
      [0, 0, 2, 0, 0, 2, 0, 0],
      [0, 2, 2, 0, 0, 2, 2, 0]
  ];

  const tebasakiSprite = [
      [0, 0, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 1, 0, 0],
      [0, 0, 2, 2, 2, 0, 0, 0],
      [0, 2, 2, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 0, 0],
      [2, 2, 2, 2, 2, 0, 0, 0],
      [0, 2, 2, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  const chankoSprite = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 0, 3, 2, 0, 0],
      [0, 2, 2, 3, 3, 2, 2, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  const onigiriSprite = [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 2, 2, 1, 1, 1],
      [1, 1, 1, 2, 2, 1, 1, 1],
      [1, 1, 1, 2, 2, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0]
  ];

  const yakitoriSprite = [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 2, 2, 2, 2, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 3, 3, 0, 0, 0]
  ];

  const takoyakiSprite = [
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 2, 2, 1, 3, 1, 0],
      [1, 2, 2, 2, 2, 1, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 4, 0, 4, 0, 4, 0, 4],
      [4, 0, 4, 0, 4, 0, 4, 0]
  ];

  const pixelSize = 5; 
  const sumoWidth = sumoSprite[0].length * pixelSize;
  const sumoHeight = sumoSprite.length * pixelSize;

  const bulletSize = 3; 
  const bulletWidth = 8 * bulletSize;
  const bulletHeight = 8 * bulletSize;

  const enemySize = 4; 
  const enemyWidth = 8 * enemySize;
  const enemyHeight = 8 * enemySize;

  let player = {
      x: gameWidth / 2 - sumoWidth / 2,
      y: gameHeight - sumoHeight - 20,
      speed: 6,
      isDragging: false
  };

  let bullets = [];
  let enemies = [];
  let score = 0;
  let gameOver = false;
  let shootCooldown = 0;
  const shootInterval = 15;

  let enemyDirection = 1; 
  let enemySpeed = 1.5;
  let enemyStepDown = 15; 

  const keys = {};
  let animationId; // ループ停止用のID

  function spawnEnemies() {
      enemies = [];
      const rows = 3; 
      const cols = 6; 
      const startX = 30;
      const startY = 50;
      const spacingX = 50;
      const spacingY = 45;

      for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
              enemies.push({
                  x: startX + c * spacingX,
                  y: startY + r * spacingY,
                  type: r % 2, 
                  alive: true
              });
          }
      }
  }

  // イベントリスナー（重複登録防止のために関数内でバインド）
  function handleKeyDown(e) {
      if (gameOver) {
          resetGame();
      }
      keys[e.code] = true;
  }
  function handleKeyUp(e) {
      keys[e.code] = false;
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  canvas.addEventListener('touchstart', (e) => {
      if (gameOver) {
          resetGame();
          return;
      }
      player.isDragging = true;
      handleTouch(e);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
      if (player.isDragging) {
          handleTouch(e);
      }
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
      player.isDragging = false;
  });

  function handleTouch(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touchX = (e.touches[0].clientX - rect.left) * (gameWidth / rect.width);
      
      player.x = touchX - sumoWidth / 2;
      if (player.x < 0) player.x = 0;
      if (player.x > gameWidth - sumoWidth) player.x = gameWidth - sumoWidth;
  }

  function shoot() {
      if (shootCooldown > 0) return;
      const type = Math.floor(Math.random() * 3);
      bullets.push({
          x: player.x + sumoWidth / 2 - bulletWidth / 2,
          y: player.y - bulletHeight,
          speed: 8,
          type: type
      });
      shootCooldown = shootInterval;
  }

  function checkCollision(rect1, rect2) {
      return rect1.x < rect2.x + rect2.width &&
             rect1.x + rect1.width > rect2.x &&
             rect1.y < rect2.y + rect2.height &&
             rect1.y + rect1.height > rect2.y;
  }

  function drawPlayer() {
      for (let r = 0; r < sumoSprite.length; r++) {
          for (let c = 0; c < sumoSprite[r].length; c++) {
              const pixel = sumoSprite[r][c];
              if (pixel === 0) continue;
              if (pixel === 1) ctx.fillStyle = '#f4cc9f'; 
              else if (pixel === 2) ctx.fillStyle = '#fcfaf2'; 
              else if (pixel === 3) ctx.fillStyle = '#9e2a2b'; 
              ctx.fillRect(player.x + (c * pixelSize), player.y + (r * pixelSize), pixelSize, pixelSize);
          }
      }
  }

  function drawBullet(bullet) {
      let sprite;
      if (bullet.type === 0) sprite = tebasakiSprite;
      else if (bullet.type === 1) sprite = chankoSprite;
      else sprite = onigiriSprite;

      for (let r = 0; r < sprite.length; r++) {
          for (let c = 0; c < sprite[r].length; c++) {
              const pixel = sprite[r][c];
              if (pixel === 0) continue;
              if (bullet.type === 0) {
                  ctx.fillStyle = (pixel === 1) ? '#ffffff' : '#b27a3d';
              } else if (bullet.type === 1) {
                  if (pixel === 1) ctx.fillStyle = '#e76f51';
                  else if (pixel === 2) ctx.fillStyle = '#2a9d8f';
                  else ctx.fillStyle = '#e9c46a';
              } else {
                  ctx.fillStyle = (pixel === 1) ? '#ffffff' : '#2c2520';
              }
              ctx.fillRect(bullet.x + (c * bulletSize), bullet.y + (r * bulletSize), bulletSize, bulletSize);
          }
      }
  }

  function drawEnemy(enemy) {
      let sprite = (enemy.type === 0) ? yakitoriSprite : takoyakiSprite;
      for (let r = 0; r < sprite.length; r++) {
          for (let c = 0; c < sprite[r].length; c++) {
              const pixel = sprite[r][c];
              if (pixel === 0) continue;
              if (enemy.type === 0) {
                  if (pixel === 1) ctx.fillStyle = '#e76f51';
                  else if (pixel === 2) ctx.fillStyle = '#8ab17d';
                  else ctx.fillStyle = '#e9c46a';
              } else {
                  if (pixel === 1) ctx.fillStyle = '#cb997e';
                  else if (pixel === 2) ctx.fillStyle = '#3d348b';
                  else if (pixel === 3) ctx.fillStyle = '#8ab17d';
                  else ctx.fillStyle = '#ffb5a7';
              }
              ctx.fillRect(enemy.x + (c * enemySize), enemy.y + (r * enemySize), enemySize, enemySize);
          }
      }
  }

  function drawScore() {
      ctx.fillStyle = '#fcfaf2';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText(`SCORE: ${score}`, 15, 30);
  }

  function drawGameOver() {
      ctx.fillStyle = 'rgba(26, 21, 18, 0.85)';
      ctx.fillRect(0, 0, gameWidth, gameHeight);
      ctx.fillStyle = '#9e2a2b';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ゲームオーバー', gameWidth / 2, gameHeight / 2 - 20);
      ctx.fillStyle = '#fcfaf2';
      ctx.font = '14px sans-serif';
      ctx.fillText('画面をタッチ / キー入力で再挑戦', gameWidth / 2, gameHeight / 2 + 30);
      ctx.textAlign = 'left';
  }

  function update() {
      if (gameOver) {
          drawGameOver();
          animationId = requestAnimationFrame(update);
          return;
      }

      ctx.clearRect(0, 0, gameWidth, gameHeight);

      if (keys['ArrowLeft'] || keys['KeyA']) {
          player.x -= player.speed;
          if (player.x < 0) player.x = 0;
      }
      if (keys['ArrowRight'] || keys['KeyD']) {
          player.x += player.speed;
          if (player.x > gameWidth - sumoWidth) player.x = gameWidth - sumoWidth;
      }

      if (player.isDragging || keys['Space']) {
          shoot();
      }
      if (shootCooldown > 0) shootCooldown--;

      for (let i = bullets.length - 1; i >= 0; i--) {
          bullets[i].y -= bullets[i].speed;
          if (bullets[i].y < -bulletHeight) {
              bullets.splice(i, 1);
              continue;
          }
          drawBullet(bullets[i]);
      }

      let touchWall = false;
      for (let i = 0; i < enemies.length; i++) {
          enemies[i].x += enemySpeed * enemyDirection;
          if (enemies[i].x < 0 || enemies[i].x > gameWidth - enemyWidth) {
              touchWall = true;
          }
          if (enemies[i].y + enemyHeight > player.y) {
              gameOver = true;
          }
      }

      if (touchWall) {
          enemyDirection *= -1;
          for (let i = 0; i < enemies.length; i++) {
              enemies[i].y += enemyStepDown;
          }
      }

      for (let i = 0; i < enemies.length; i++) {
          drawEnemy(enemies[i]);
      }

      for (let b = bullets.length - 1; b >= 0; b--) {
          for (let e = enemies.length - 1; e >= 0; e--) {
              const bulletRect = { x: bullets[b].x, y: bullets[b].y, width: bulletWidth, height: bulletHeight };
              const enemyRect = { x: enemies[e].x, y: enemies[e].y, width: enemyWidth, height: enemyHeight };
              if (checkCollision(bulletRect, enemyRect)) {
                  bullets.splice(b, 1);
                  enemies.splice(e, 1);
                  score += 100;
                  break;
              }
          }
      }

      if (enemies.length === 0) {
          enemySpeed += 0.3;
          spawnEnemies();
      }

      drawPlayer();
      drawScore();

      animationId = requestAnimationFrame(update);
  }

  function resetGame() {
      score = 0;
      gameOver = false;
      enemySpeed = 1.5;
      enemyDirection = 1;
      bullets = [];
      player.x = gameWidth / 2 - sumoWidth / 2;
      spawnEnemies();
  }

  // ゲーム停止用のクリーンアップ処理（ポップアップを閉じた時用）
  window.stopGame = function() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
  };

  spawnEnemies();
  update();
}