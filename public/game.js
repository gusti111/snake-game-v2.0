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

// [PENGEMBANGAN BARU] STATE UTK INPUT BUFFER, ANIMASI, DAN PARTIKEL
let inputQueue = [];      // Antrean input kontrol arah
let frameCount = 0;      // Penghitung frame global untuk animasi lidah
let particles = [];       // Penampung efek ledakan partikel saat makan

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

  // Reset state pengembangan baru
  inputQueue = [];
  particles = [];
  frameCount = 0;

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
// Memiliki peluang 15% menjadi Makanan Emas (Golden Apple)
// ============================================================
function generateFood() {
  let f;
  do {
    f = {
      x: Math.floor(Math.random() * COLS) * CELL,
      y: Math.floor(Math.random() * ROWS) * CELL
    };
  } while (snake && snake.some(s => s.x === f.x && s.y === f.y));
  
  // Tentukan tipe makanan (15% peluang makanan emas)
  f.isGold = Math.random() < 0.15;
  return f;
}

// ============================================================
// [PERCOBAAN] FUNGSI DRAW SNAKE
// Menggambar ular menggunakan output primitif persegi (rectangle)
// Ditambah pengembangan efek lidah ular dinamis yang melet-melet
// ============================================================
function drawSnake() {
  const col = LEVELS[levelIndex].color;

  snake.forEach((part, i) => {
    ctx.fillStyle = i === 0 ? "#ffffff" : col;  // kepala putih, badan warna level
    ctx.beginPath();
    ctx.roundRect(part.x + 1, part.y + 1, CELL - 2, CELL - 2, 4);
    ctx.fill();

    // Gambar komponen visual pada kepala ular
    if (i === 0) {
      // 1. Gambar Mata Ular
      ctx.fillStyle = "#1a1a2e";
      const ex = dx > 0 ? 13 : dx < 0 ? 4 : 6;
      const ey = dy > 0 ? 13 : dy < 0 ? 4 : 6;
      ctx.beginPath(); ctx.arc(part.x + ex, part.y + ey, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(part.x + ex + (dy !== 0 ? 7 : 0), part.y + ey + (dx !== 0 ? 7 : 0), 2, 0, Math.PI * 2); ctx.fill();

      // 2. [PENGEMBANGAN BARU] Gambar Lidah Ular Merah (Melet-melet)
      // Lidah keluar masuk memanfaatkan sisa pembagian (modulus) sirkulasi frame
      if (frameCount % 4 < 2) {
        ctx.strokeStyle = "#ff4e50";
        ctx.lineWidth = 2;
        ctx.beginPath();

        const centerX = part.x + CELL / 2;
        const centerY = part.y + CELL / 2;

        if (dx > 0) { // Menghadap Kanan
          ctx.moveTo(part.x + CELL, centerY);
          ctx.lineTo(part.x + CELL + 6, centerY);
          ctx.lineTo(part.x + CELL + 9, centerY - 3);
          ctx.moveTo(part.x + CELL + 6, centerY);
          ctx.lineTo(part.x + CELL + 9, centerY + 3);
        } else if (dx < 0) { // Menghadap Kiri
          ctx.moveTo(part.x, centerY);
          ctx.lineTo(part.x - 6, centerY);
          ctx.lineTo(part.x - 9, centerY - 3);
          ctx.moveTo(part.x - 6, centerY);
          ctx.lineTo(part.x - 9, centerY + 3);
        } else if (dy > 0) { // Menghadap Bawah
          ctx.moveTo(centerX, part.y + CELL);
          ctx.lineTo(centerX, part.y + CELL + 6);
          ctx.lineTo(centerX - 3, part.y + CELL + 9);
          ctx.moveTo(centerX, part.y + CELL + 6);
          ctx.lineTo(centerX + 3, part.y + CELL + 9);
        } else if (dy < 0) { // Menghadap Atas
          ctx.moveTo(centerX, part.y);
          ctx.lineTo(centerX, part.y - 6);
          ctx.lineTo(centerX - 3, part.y - 9);
          ctx.moveTo(centerX, part.y - 6);
          ctx.lineTo(centerX + 3, part.y - 9);
        }
        ctx.stroke();
      }
    }
  });
}

// ============================================================
// [PERCOBAAN] FUNGSI DRAW FOOD
// Menggambar makanan menggunakan primitif lingkaran (arc)
// Ditambah efek kilau transparansi dinamis khusus Makanan Emas
// ============================================================
function drawFood() {
  if (food.isGold) {
    // Efek Berkedip Makanan Emas menggunakan fungsi Gelombang Sinus (Math.sin)
    const alpha = 0.5 + Math.abs(Math.sin(frameCount * 0.4)) * 0.5;
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`; // Warna Emas Berkilau
    ctx.beginPath();
    ctx.arc(food.x + CELL / 2, food.y + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
    ctx.fill();

    // Highlight Putih di tengah buah emas
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(food.x + 7, food.y + 7, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Makanan Merah Biasa
    ctx.fillStyle = "#ff4e50";
    ctx.beginPath();
    ctx.arc(food.x + CELL / 2, food.y + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight oranye
    ctx.fillStyle = "#ff8c42";
    ctx.beginPath();
    ctx.arc(food.x + 7, food.y + 7, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================
// [PENGEMBANGAN BARU] FUNGSI MANAGEMENT EFEK PARTIKEL LEDAKAN
// ============================================================
function createBurstParticles(startX, startY, isGold) {
  const particleColor = isGold ? "#ffd700" : "#ff4e50";
  // Menghasilkan 8 pecahan partikel mini yang memancar keluar koordinat
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + (Math.random() * 0.4);
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({
      x: startX + CELL / 2,
      y: startY + CELL / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1.0,
      color: particleColor,
      size: 2 + Math.random() * 3
    });
  }
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.07; // Efek Memudar (Fade Out) berkala

    if (p.alpha <= 0) {
      particles.splice(i, 1); // Hapus partikel jika transparan
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      ctx.globalAlpha = 1.0; // Reset global alpha canvas
    }
  }
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
// ============================================================
function moveSnake() {
  // [PERBAIKAN BUG] Eksekusi perintah arah terdepan dari antrean buffer
  if (inputQueue.length > 0) {
    const nextMove = inputQueue.shift();
    dx = nextMove.dx;
    dy = nextMove.dy;
  }

  const cfg = LEVELS[levelIndex];
  let head = {
    x: snake[0].x + dx,
    y: snake[0].y + dy
  };

  // [UPGRADE LATIHAN] Perilaku dinding: wrap (tembus) atau mati
  if (cfg.wrap) {
    if (head.x >= canvas.width) head.x = 0;
    if (head.x < 0) head.x = canvas.width - CELL;
    if (head.y >= canvas.height) head.y = 0;
    if (head.y < 0) head.y = canvas.height - CELL;
  } else {
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
// ============================================================
function checkFood() {
  if (snake[0].x === food.x && snake[0].y === food.y) {
    snake.push({});        // tambah satu segmen ekor
    
    // Pemicu partikel ledakan di koordinat makanan yang dimakan
    createBurstParticles(food.x, food.y, food.isGold);

    // Hitung penambahan skor berdasarkan bobot makanan
    score += food.isGold ? 3 : 1; 

    // [PENGEMBANGAN] Perbarui best score jika skor saat ini lebih tinggi
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("snakeBestScore", bestScore); // simpan ke localStorage
      bestDisplay.textContent = bestScore;
    }

    food = generateFood(); // Memunculkan makanan baru secara acak
    updateInfoBar();       // Perbarui info bar di atas luar kanvas
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
// ============================================================
function gameLoop() {
  if (pauseLevel) return;

  frameCount++; // Naikkan counter frame animasi setiap tick berjalan

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
    updateAndDrawParticles(); // Tetap render partikel sisa jika ada
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
  updateAndDrawParticles(); // Menggambar dan memproses pecahan partikel

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
// [PERBAIKAN BUG] LOGIKA FILTER VALIDASI INPUT ANTREAN DIRECTION
// Mencegah ular berbalik arah 180 derajat yang memicu bug self-collision
// ============================================================
function addInput(nextDx, nextDy) {
  // Ambil referensi arah terakhir (dari isi antrean belakang, atau arah real ular saat ini)
  let lastMove = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : { dx: dx, dy: dy };

  // Blokir input jika berlawanan arah 180 derajat
  if (nextDx !== 0 && lastMove.dx !== 0) return;
  if (nextDy !== 0 && lastMove.dy !== 0) return;

  // Batasi isi antrean buffer maksimal 2 agar kontrol tetap responsif tanpa lag delay
  if (inputQueue.length < 2) {
    inputQueue.push({ dx: nextDx, dy: nextDy });
  }
}

// ============================================================
// [PERCOBAAN] KONTROL KEYBOARD
// ============================================================
document.addEventListener("keydown", (e) => {
  const key = e.key;

  if (key === "ArrowUp")         { addInput(0, -CELL); e.preventDefault(); }
  else if (key === "ArrowDown")  { addInput(0, CELL);  e.preventDefault(); }
  else if (key === "ArrowLeft")  { addInput(-CELL, 0); e.preventDefault(); }
  else if (key === "ArrowRight") { addInput(CELL, 0);  e.preventDefault(); }

  // restart saat game over
  if (gameOver && key === "Enter") {
    initGame();
    gameLoop();
  }
});

// ============================================================
// [PERCOBAAN] KONTROL MOUSE
// Klik canvas untuk mengubah arah ular
// ============================================================
canvas.addEventListener("click", (e) => {
  if (gameOver) { initGame(); gameLoop(); return; }

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;
  const head = snake[0];

  const diffX = mouseX - head.x;
  const diffY = mouseY - head.y;

  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > 0) addInput(CELL, 0);
    else addInput(-CELL, 0);
  } else {
    if (diffY > 0) addInput(0, CELL);
    else addInput(0, -CELL);
  }
});

// ============================================================
// [UPGRADE TUGAS] KONTROL SWIPE TOUCH
// Geser layar untuk mengubah arah ular di perangkat HP/tablet
// ============================================================
let touchStartX = 0, touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
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

  if (Math.abs(tdx) < 10 && Math.abs(tdy) < 10) return;

  if (Math.abs(tdx) > Math.abs(tdy)) {
    if (tdx > 0) addInput(CELL, 0);
    else addInput(-CELL, 0);
  } else {
    if (tdy > 0) addInput(0, CELL);
    else addInput(0, -CELL);
  }
  e.preventDefault();
}, { passive: false });

// ============================================================
// [PENGEMBANGAN] TOMBOL D-PAD (KONTROL HP)
// ============================================================
document.getElementById("btn-up").addEventListener("click", () => { addInput(0, -CELL); });
document.getElementById("btn-down").addEventListener("click", () => { addInput(0, CELL); });
document.getElementById("btn-left").addEventListener("click", () => { addInput(-CELL, 0); });
document.getElementById("btn-right").addEventListener("click", () => { addInput(CELL, 0); });

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
