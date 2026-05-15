// game.js
// Logika utama Snake Game menggunakan HTML5 Canvas API


// ============================================================
// [PERCOBAAN] SETUP CANVAS
// Ambil elemen canvas dan context 2D untuk menggambar
// Titik (0,0) ada di pojok kiri atas layar (sistem koordinat)
// ============================================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


// ============================================================
// [UPGRADE LATIHAN] REFERENSI ELEMEN UI PANEL LEVEL
// Elemen HTML untuk menampilkan info level dan tombol lanjut
// ============================================================
const levelPanel = document.getElementById("levelPanel");
const levelText = document.getElementById("levelText");
const scoreText = document.getElementById("scoreText");
const nextLevelBtn = document.getElementById("nextLevelBtn");
const scoreDisplay = document.getElementById("scoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const speedDisplay = document.getElementById("speedDisplay");

// [PENGEMBANGAN] Referensi elemen best score
const bestDisplay = document.getElementById("bestDisplay");


// ============================================================
// [UPGRADE LATIHAN] KONFIGURASI 3 LEVEL (versi latihan)
// Easy=200ms, Medium=150ms, Hard=75ms | skor 25 / 50 / >50
// ============================================================
// const LEVELS = [
//   { name: "Easy",   scoreLimit: 25,       speed: 200, wrap: true  },
//   { name: "Medium", scoreLimit: 50,       speed: 150, wrap: true  },
//   { name: "Hard",   scoreLimit: Infinity, speed: 75,  wrap: false },
// ];


// ============================================================
// [UPGRADE TUGAS] KONFIGURASI 5 LEVEL (versi tugas)
// Level 1–3 wrap dinding, Level 4–5 dinding mematikan
// Skor threshold: 25 / 50 / 75 / 100 / >100
// ============================================================
const LEVELS = [
  { name: "Level 1", scoreLimit: 25, speed: 250, wrap: true, color: "#a8ff78", cssClass: "lvl-1" },
  { name: "Level 2", scoreLimit: 50, speed: 200, wrap: true, color: "#78ffd6", cssClass: "lvl-2" },
  { name: "Level 3", scoreLimit: 75, speed: 150, wrap: true, color: "#ffd700", cssClass: "lvl-3" },
  { name: "Level 4", scoreLimit: 100, speed: 100, wrap: false, color: "#ff8c42", cssClass: "lvl-4" },
  { name: "Level 5", scoreLimit: Infinity, speed: 50, wrap: false, color: "#ff4e50", cssClass: "lvl-5" },
];


// ============================================================
// [PERCOBAAN] VARIABEL STATE DASAR GAME
// ============================================================
let snake, dx, dy, food, score, gameOver;

// [UPGRADE LATIHAN] Variabel tambahan untuk sistem level dan pause
let levelIndex, pauseLevel, loopTimer;

// [PENGEMBANGAN] Best score - diambil dari localStorage agar tersimpan permanen
let bestScore = parseInt(localStorage.getItem("snakeBestScore")) || 0;


// ============================================================
// [PENGEMBANGAN] UKURAN CANVAS RESPONSIF
// Canvas menyesuaikan layar perangkat (HP/laptop/tablet)
// Ukuran grid selalu kelipatan 20 agar grid tetap rapi
// ============================================================
const CELL = 20;  // ukuran satu sel grid dalam piksel
let COLS = 20;  // jumlah kolom grid
let ROWS = 20;  // jumlah baris grid

function resizeCanvas() {
  // ambil ukuran terkecil antara 400px dan 96% lebar layar
  const size = Math.min(400, Math.floor(window.innerWidth * 0.96 / CELL) * CELL);
  canvas.width = size;
  canvas.height = size;
  COLS = canvas.width / CELL;
  ROWS = canvas.height / CELL;
}

// Jalankan resize saat pertama load dan saat ukuran layar berubah
resizeCanvas();
window.addEventListener("resize", () => {
  resizeCanvas();
  // posisi ulang ular agar tidak keluar canvas setelah resize
  if (snake) {
    snake = snake.map(s => ({
      x: Math.min(s.x, canvas.width - CELL),
      y: Math.min(s.y, canvas.height - CELL)
    }));
  }
});


// ============================================================
// [PERCOBAAN] FUNGSI INISIALISASI GAME
// Reset semua variabel ke kondisi awal
// ============================================================
function initGame() {
  // posisi awal kepala ular di tengah canvas
  const startX = Math.floor(COLS / 2) * CELL;
  const startY = Math.floor(ROWS / 2) * CELL;
  snake = [{ x: startX, y: startY }];
  dx = CELL;   // gerak awal ke kanan
  dy = 0;
  food = generateFood();
  score = 0;
  gameOver = false;

  // [UPGRADE LATIHAN] Reset level dan pause
  levelIndex = 0;
  pauseLevel = false;
  clearTimeout(loopTimer);
  levelPanel.classList.remove("visible");

  // [UPGRADE LATIHAN] Perbarui info bar
  updateInfoBar();

  // [UPGRADE TUGAS] Terapkan tema warna level pertama
  applyLevelTheme();

  // [PENGEMBANGAN] Tampilkan best score dari localStorage
  bestDisplay.textContent = bestScore;
}


// ============================================================
// [PERCOBAAN] FUNGSI GENERATE FOOD
// Membuat posisi makanan acak pada grid, tidak bertabrakan dengan ular
// ============================================================
function generateFood() {
  let f;
  do {
    f = {
      x: Math.floor(Math.random() * COLS) * CELL,
      y: Math.floor(Math.random() * ROWS) * CELL
    };
  } while (snake && snake.some(s => s.x === f.x && s.y === f.y));
  return f;
}


// ============================================================
// [PERCOBAAN] FUNGSI DRAW SNAKE
// Menggambar ular menggunakan output primitif persegi (rectangle)
// ============================================================
function drawSnake() {
  // [UPGRADE TUGAS] Warna ular berubah sesuai level aktif
  const col = LEVELS[levelIndex].color;

  snake.forEach((part, i) => {
    ctx.fillStyle = i === 0 ? "#ffffff" : col;  // kepala putih, badan warna level
    ctx.beginPath();
    ctx.roundRect(part.x + 1, part.y + 1, CELL - 2, CELL - 2, 4);
    ctx.fill();

    // gambar mata pada kepala ular
    if (i === 0) {
      ctx.fillStyle = "#1a1a2e";
      const ex = dx > 0 ? 13 : dx < 0 ? 4 : 6;
      const ey = dy > 0 ? 13 : dy < 0 ? 4 : 6;
      ctx.beginPath(); ctx.arc(part.x + ex, part.y + ey, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(part.x + ex + (dy !== 0 ? 7 : 0), part.y + ey + (dx !== 0 ? 7 : 0), 2, 0, Math.PI * 2); ctx.fill();
    }
  });
}


// ============================================================
// [PERCOBAAN] FUNGSI DRAW FOOD
// Menggambar makanan menggunakan primitif lingkaran (arc)
// ============================================================
function drawFood() {
  ctx.fillStyle = "#ff4e50";
  ctx.beginPath();
  ctx.arc(food.x + CELL / 2, food.y + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
  // highlight kecil di atas makanan
  ctx.fillStyle = "#ff8c42";
  ctx.beginPath();
  ctx.arc(food.x + 7, food.y + 7, 3, 0, Math.PI * 2);
  ctx.fill();
}


// ============================================================
// [PERCOBAAN] FUNGSI DRAW SCORE
// Menampilkan skor di sudut kiri atas canvas
// ============================================================
function drawScore() {
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.font = "13px Arial";
  ctx.fillText("Score: " + score, 8, 18);
  // [UPGRADE LATIHAN] Tampilkan nama level di kanan atas
  ctx.fillText(LEVELS[levelIndex].name, canvas.width - 70, 18);
}


// ============================================================
// [PERCOBAAN] FUNGSI DRAW GAME OVER
// Menampilkan layar game over di atas canvas
// ============================================================
function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff4e50";
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

  ctx.fillStyle = "#eee";
  ctx.font = "18px Arial";
  ctx.fillText("Skor Akhir: " + score, canvas.width / 2, canvas.height / 2);

  // [PENGEMBANGAN] Tampilkan best score di layar game over
  ctx.fillStyle = "#ffd700";
  ctx.font = "14px Arial";
  ctx.fillText("🏆 Best Score: " + bestScore, canvas.width / 2, canvas.height / 2 + 28);

  ctx.fillStyle = "#aaa";
  ctx.font = "13px Arial";
  ctx.fillText("Enter / Klik / Tap untuk main lagi", canvas.width / 2, canvas.height / 2 + 56);
  ctx.textAlign = "left";
}


// ============================================================
// [PERCOBAAN] FUNGSI MOVE SNAKE
// Translasi posisi kepala ular lalu tambah kepala baru (unshift)
// dan hapus ekor (pop) = efek gerak maju
// ============================================================
function moveSnake() {
  const cfg = LEVELS[levelIndex];
  let head = {
    x: snake[0].x + dx,
    y: snake[0].y + dy
  };

  // [UPGRADE LATIHAN] Perilaku dinding: wrap (tembus) atau mati
  if (cfg.wrap) {
    // wrap kanan → kiri dan sebaliknya
    if (head.x >= canvas.width) head.x = 0;
    if (head.x < 0) head.x = canvas.width - CELL;
    // wrap bawah → atas dan sebaliknya
    if (head.y >= canvas.height) head.y = 0;
    if (head.y < 0) head.y = canvas.height - CELL;
  } else {
    // [UPGRADE LATIHAN] Tabrak dinding = game over (mode hard)
    if (head.x < 0 || head.x >= canvas.width ||
      head.y < 0 || head.y >= canvas.height) {
      gameOver = true;
    }
  }

  snake.unshift(head);  // tambah kepala baru
  snake.pop();          // hapus ekor
}


// ============================================================
// [PERCOBAAN] FUNGSI CHECK FOOD
// Cek apakah kepala ular menyentuh makanan
// Jika ya: panjang +1, generate makanan baru, skor +1
// ============================================================
function checkFood() {
  if (snake[0].x === food.x && snake[0].y === food.y) {
    snake.push({});        // tambah satu segmen ekor
    food = generateFood();
    score += 1;

    // [PENGEMBANGAN] Perbarui best score jika skor saat ini lebih tinggi
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("snakeBestScore", bestScore); // simpan ke localStorage
      bestDisplay.textContent = bestScore;
    }

    // [UPGRADE LATIHAN] Perbarui info bar dan cek naik level
    updateInfoBar();
    checkLevelUp();
  }
}


// ============================================================
// [PERCOBAAN] FUNGSI CHECK COLLISION
// Cek apakah kepala ular menabrak tubuhnya sendiri → game over
// ============================================================
function checkCollision() {
  const head = snake[0];
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      gameOver = true;
    }
  }
}


// ============================================================
// [UPGRADE LATIHAN] FUNGSI CHECK LEVEL UP
// Cek apakah skor sudah melewati batas level saat ini
// ============================================================
function checkLevelUp() {
  const cfg = LEVELS[levelIndex];
  if (score > cfg.scoreLimit && levelIndex < LEVELS.length - 1) {
    showLevelTransition(levelIndex + 1);
  }
}


// ============================================================
// [UPGRADE LATIHAN] FUNGSI SHOW LEVEL TRANSITION
// Tampilkan panel level dan pause game sementara
// ============================================================
function showLevelTransition(newIdx) {
  pauseLevel = true;
  levelIndex = newIdx;

  const cfg = LEVELS[levelIndex];
  levelPanel.classList.add("visible");
  levelText.textContent = "🎉 " + cfg.name.toUpperCase();
  scoreText.textContent = "Skor: " + score + "  |  Speed baru: " + cfg.speed + "ms";

  updateInfoBar();

  // [UPGRADE TUGAS] Terapkan tema warna level baru
  applyLevelTheme();
}


// ============================================================
// [UPGRADE TUGAS] FUNGSI APPLY LEVEL THEME
// Ubah class CSS body agar warna border canvas berubah per level
// ============================================================
function applyLevelTheme() {
  document.body.className = LEVELS[levelIndex].cssClass;
}


// ============================================================
// [UPGRADE LATIHAN] FUNGSI UPDATE INFO BAR
// Perbarui teks skor, level, dan speed di UI atas canvas
// ============================================================
function updateInfoBar() {
  scoreDisplay.textContent = score;
  levelDisplay.textContent = LEVELS[levelIndex].name;
  speedDisplay.textContent = LEVELS[levelIndex].speed + "ms";
}


// ============================================================
// [PERCOBAAN] GAME LOOP
// Fungsi utama yang berjalan berulang menggunakan setTimeout
// Urutan: clear → logika → gambar → setTimeout → ulangi
// ============================================================
function gameLoop() {
  // [UPGRADE LATIHAN] Hentikan loop saat pause (menunggu tombol lanjut level)
  if (pauseLevel) return;

  // bersihkan canvas setiap frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // gambar titik grid sebagai latar (efek visual ringan)
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let gx = 0; gx < COLS; gx++)
    for (let gy = 0; gy < ROWS; gy++)
      ctx.fillRect(gx * CELL + 9, gy * CELL + 9, 2, 2);

  // jika game over: tampilkan layar game over dan hentikan loop
  if (gameOver) {
    drawSnake();
    drawFood();
    drawScore();
    drawGameOver();
    return;
  }

  // jalankan logika game
  moveSnake();
  checkFood();
  checkCollision();

  // gambar semua objek ke canvas
  drawSnake();
  drawFood();
  drawScore();

  // [UPGRADE LATIHAN] Kecepatan loop menyesuaikan level aktif (dynamic speed)
  loopTimer = setTimeout(gameLoop, LEVELS[levelIndex].speed);
}


// ============================================================
// [UPGRADE LATIHAN] TOMBOL LANJUT LEVEL
// Resume game setelah pause saat naik level
// ============================================================
nextLevelBtn.addEventListener("click", () => {
  pauseLevel = false;
  levelPanel.classList.remove("visible");
  gameLoop();
});


// ============================================================
// [PERCOBAAN] KONTROL KEYBOARD
// Arrow keys untuk mengubah arah ular
// Enter untuk restart saat game over
// ============================================================
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (key === "ArrowUp" && dy === 0) { dx = 0; dy = -CELL; e.preventDefault(); }
  else if (key === "ArrowDown" && dy === 0) { dx = 0; dy = CELL; e.preventDefault(); }
  else if (key === "ArrowLeft" && dx === 0) { dx = -CELL; dy = 0; e.preventDefault(); }
  else if (key === "ArrowRight" && dx === 0) { dx = CELL; dy = 0; e.preventDefault(); }

  // restart saat game over
  if (gameOver && key === "Enter") {
    initGame();
    gameLoop();
  }
});


// ============================================================
// [PERCOBAAN] KONTROL MOUSE
// Klik canvas untuk mengubah arah ular
// Arah dominan (horizontal atau vertikal) yang dipakai
// ============================================================
canvas.addEventListener("click", (e) => {
  if (gameOver) { initGame(); gameLoop(); return; }

  const rect = canvas.getBoundingClientRect();
  // [PENGEMBANGAN] Skala koordinat klik agar akurat di canvas responsif
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  const head = snake[0];

  const diffX = mouseX - head.x;
  const diffY = mouseY - head.y;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    dx = diffX > 0 ? CELL : -CELL;
    dy = 0;
  } else {
    dx = 0;
    dy = diffY > 0 ? CELL : -CELL;
  }
});


// ============================================================
// [UPGRADE TUGAS] KONTROL SWIPE TOUCH
// Geser layar untuk mengubah arah ular di perangkat HP/tablet
// ============================================================
let touchStartX = 0, touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  // INTERSEPSI ABSOLUT: Jika game over, sentuhan apa pun akan merestart game
  if (gameOver) {
    initGame();
    gameLoop();
    e.preventDefault();
    return;
  }

  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", (e) => {
  const tdx = e.changedTouches[0].clientX - touchStartX;
  const tdy = e.changedTouches[0].clientY - touchStartY;

  // minimal swipe 10px agar tidak terlalu sensitif
  if (Math.abs(tdx) < 10 && Math.abs(tdy) < 10) return;

  if (Math.abs(tdx) > Math.abs(tdy)) {
    if (tdx > 0 && dx === 0) { dx = CELL; dy = 0; }
    else if (tdx < 0 && dx === 0) { dx = -CELL; dy = 0; }
  } else {
    if (tdy > 0 && dy === 0) { dx = 0; dy = CELL; }
    else if (tdy < 0 && dy === 0) { dx = 0; dy = -CELL; }
  }
  e.preventDefault();
}, { passive: false });


// ============================================================
// [PENGEMBANGAN] TOMBOL D-PAD (KONTROL HP)
// Tombol arah fisik di layar untuk perangkat tanpa keyboard
// ============================================================
document.getElementById("btn-up").addEventListener("click", () => { if (dy === 0) { dx = 0; dy = -CELL; } });
document.getElementById("btn-down").addEventListener("click", () => { if (dy === 0) { dx = 0; dy = CELL; } });
document.getElementById("btn-left").addEventListener("click", () => { if (dx === 0) { dx = -CELL; dy = 0; } });
document.getElementById("btn-right").addEventListener("click", () => { if (dx === 0) { dx = CELL; dy = 0; } });

// Touch events D-Pad (agar responsif di HP tanpa delay)
["btn-up", "btn-down", "btn-left", "btn-right"].forEach(id => {
  document.getElementById(id).addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.target.click();
  }, { passive: false });
});


// ============================================================
// [PERCOBAAN] MULAI GAME
// ============================================================
initGame();
gameLoop();
