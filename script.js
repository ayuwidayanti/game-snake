// Konfigurasi Utama Game
const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 580;
const TOTAL_FOODS = 5; // Jumlah makanan yang aktif sekaligus

// Variabel Elemen DOM
const loginScreen = document.getElementById("loginScreen");
const gameScreen = document.getElementById("gameScreen");
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("usernameInput");

const playerDisplay = document.getElementById("playerDisplay");
const scoreDisplay = document.getElementById("scoreDisplay");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const levelDisplay = document.getElementById("levelDisplay");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Tema Warna Ular
const SNAKE_THEMES = [
    { head: "#2ecc71", body: "#27ae60" }, // Green
    { head: "#e74c3c", body: "#c0392b" }, // Red
    { head: "#9b59b6", body: "#8e44ad" }, // Purple
    { head: "#3498db", body: "#2980b9" }, // Blue
    { head: "#f1c40f", body: "#f39c12" }  // Gold
];

// Jenis Makanan (5 jenis dengan poin & warna berbeda)
const FOOD_TYPES = [
    { color: "#e74c3c", points: 10 }, // Merah (Normal)
    { color: "#f1c40f", points: 30 }, // Emas (Langka)
    { color: "#3498db", points: 20 }, // Biru
    { color: "#9b59b6", points: 15 }, // Ungu
    { color: "#2ecc71", points: 25 }  // Hijau
];

// State Game
let username = "";
let score = 0;
let highScore = 0;
let level = 1;
let speed = 120;
let gameRunning = false;
let gameLoopTimer = null;

let snake = [];
let direction = "RIGHT";
let nextDirection = "RIGHT";
let foods = []; // Menampung array 5 makanan
let currentThemeIdx = 0;

// Event Submit Form Login
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    username = usernameInput.value.trim() || "Player";
    playerDisplay.textContent = username;

    loginScreen.style.display = "none";
    gameScreen.style.display = "block";

    initGame();
});

// Event Listener Keyboard (Aman dari Bug Huruf 'A' Saat Login)
document.addEventListener("keydown", (e) => {
    // Abaikan input keyboard untuk kontrol game saat masih di layar login
    if (loginScreen.style.display !== "none") {
        return;
    }

    const key = e.key.toLowerCase();

    if ((key === "arrowup" || key === "w") && direction !== "DOWN") {
        e.preventDefault();
        nextDirection = "UP";
    } else if ((key === "arrowdown" || key === "s") && direction !== "UP") {
        e.preventDefault();
        nextDirection = "DOWN";
    } else if ((key === "arrowleft" || key === "a") && direction !== "RIGHT") {
        e.preventDefault();
        nextDirection = "LEFT";
    } else if ((key === "arrowright" || key === "d") && direction !== "LEFT") {
        e.preventDefault();
        nextDirection = "RIGHT";
    } else if (key === "r" && !gameRunning && gameScreen.style.display !== "none") {
        initGame();
    }
});

// Inisialisasi Game
function initGame() {
    snake = [
        { x: 100, y: 100 },
        { x: 100 - GRID_SIZE, y: 100 },
        { x: 100 - (GRID_SIZE * 2), y: 100 }
    ];
    
    direction = "RIGHT";
    nextDirection = "RIGHT";
    score = 0;
    level = 1;
    speed = 120;
    currentThemeIdx = 0;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    generateAllFoods();

    if (gameLoopTimer) clearInterval(gameLoopTimer);
    gameRunning = true;
    gameLoopTimer = setInterval(gameUpdate, speed);
}

// Memuat 5 Makanan Secara Acak
function generateAllFoods() {
    foods = [];
    for (let i = 0; i < TOTAL_FOODS; i++) {
        foods.push(createSingleFood());
    }
}

// Membuat 1 Makanan Baru
function createSingleFood() {
    const cols = CANVAS_WIDTH / GRID_SIZE;
    const rows = CANVAS_HEIGHT / GRID_SIZE;

    while (true) {
        const foodX = Math.floor(Math.random() * cols) * GRID_SIZE;
        const foodY = Math.floor(Math.random() * rows) * GRID_SIZE;

        // Cek agar tidak bertabrakan dengan tubuh ular
        const isOverlapSnake = snake.some(segment => segment.x === foodX && segment.y === foodY);
        // Cek agar tidak bertabrakan dengan makanan lain
        const isOverlapFood = foods.some(f => f.x === foodX && f.y === foodY);

        if (!isOverlapSnake && !isOverlapFood) {
            const randomType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
            return {
                x: foodX,
                y: foodY,
                color: randomType.color,
                points: randomType.points
            };
        }
    }
}

// Update Pergerakan & Logika Permainan
function gameUpdate() {
    direction = nextDirection;

    const head = { ...snake[0] };

    if (direction === "UP") head.y -= GRID_SIZE;
    if (direction === "DOWN") head.y += GRID_SIZE;
    if (direction === "LEFT") head.x -= GRID_SIZE;
    if (direction === "RIGHT") head.x += GRID_SIZE;

    // Cek Tabrakan Dinding
    if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
        gameOver();
        return;
    }

    // Cek Tabrakan dengan Diri Sendiri
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }

    // Tambahkan kepala baru
    snake.unshift(head);

    // Cek Apakah Kepala Memakan Salah Satu dari 5 Makanan
    const eatenIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);

    if (eatenIndex !== -1) {
        const eatenFood = foods[eatenIndex];
        score += eatenFood.points;
        scoreDisplay.textContent = score;

        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
        }

        // Naikkan level tiap kelipatan 100 poin
        const newLevel = Math.floor(score / 100) + 1;
        if (newLevel !== level) {
            level = newLevel;
            levelDisplay.textContent = level;
            
            // Ganti warna ular dan percepat laju ular
            currentThemeIdx = (currentThemeIdx + 1) % SNAKE_THEMES.length;
            if (speed > 50) {
                speed -= 10;
                clearInterval(gameLoopTimer);
                gameLoopTimer = setInterval(gameUpdate, speed);
            }
        }

        // Ganti makanan yang dimakan dengan yang baru
        foods[eatenIndex] = createSingleFood();
    } else {
        // Hapus ekor jika tidak memakan makanan
        snake.pop();
    }

    draw();
}

// Render Grafis ke Canvas
function draw() {
    // 1. Gambar Latar Belakang Dark Solid (Tanpa Motif Catur)
    ctx.fillStyle = "#0f121a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Gambar 5 Makanan
    foods.forEach(food => {
        ctx.fillStyle = food.color;
        ctx.beginPath();
        const radius = GRID_SIZE / 2;
        ctx.arc(food.x + radius, food.y + radius, radius - 2, 0, Math.PI * 2);
        ctx.fill();

        // Kilatan Cahaya Makanan
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(food.x + radius - 3, food.y + radius - 3, radius / 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // 3. Gambar Ular
    const theme = SNAKE_THEMES[currentThemeIdx];
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Kepala
            ctx.fillStyle = theme.head;
            ctx.fillRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);

            // Mata Ular
            ctx.fillStyle = "#ffffff";
            let eyeX1, eyeY1, eyeX2, eyeY2;

            if (direction === "RIGHT") {
                eyeX1 = segment.x + GRID_SIZE - 6; eyeY1 = segment.y + 5;
                eyeX2 = segment.x + GRID_SIZE - 6; eyeY2 = segment.y + GRID_SIZE - 7;
            } else if (direction === "LEFT") {
                eyeX1 = segment.x + 6; eyeY1 = segment.y + 5;
                eyeX2 = segment.x + 6; eyeY2 = segment.y + GRID_SIZE - 7;
            } else if (direction === "UP") {
                eyeX1 = segment.x + 5; eyeY1 = segment.y + 6;
                eyeX2 = segment.x + GRID_SIZE - 7; eyeY2 = segment.y + 6;
            } else {
                eyeX1 = segment.x + 5; eyeY1 = segment.y + GRID_SIZE - 6;
                eyeX2 = segment.x + GRID_SIZE - 7; eyeY2 = segment.y + GRID_SIZE - 6;
            }

            ctx.fillRect(eyeX1, eyeY1, 3, 3);
            ctx.fillRect(eyeX2, eyeY2, 3, 3);
        } else {
            // Badan
            ctx.fillStyle = theme.body;
            ctx.fillRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
    });
}

// Game Over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoopTimer);

    ctx.fillStyle = "rgba(10, 12, 18, 0.85)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#e74c3c";
    ctx.font = "bold 36px 'Poppins', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = "#ecf0f1";
    ctx.font = "18px 'Poppins', sans-serif";
    ctx.fillText(`Skor Akhir: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.fillStyle = "#8b949e";
    ctx.font = "14px 'Poppins', sans-serif";
    ctx.fillText("Tekan 'R' untuk Restart Permainan", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}
