// Konfigurasi Game
const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 560;
const TOTAL_FOODS = 5;

// Variabel Elemen DOM
const loadingScreen = document.getElementById("loadingScreen");
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

// Tombol D-Pad HP
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnRestart = document.getElementById("btnRestart");

// Palette Warna Soft untuk Tema Ular
const SNAKE_THEMES = [
    { head: "#48bb78", body: "#68d391" }, // Soft Mint Green
    { head: "#4299e1", body: "#63b3ed" }, // Soft Sky Blue
    { head: "#ed8936", body: "#fbd38d" }, // Soft Peach/Orange
    { head: "#9f7aea", body: "#b794f4" }, // Soft Lavender/Purple
    { head: "#f6e05e", body: "#faf089" }  // Soft Pastel Yellow
];

// 5 Jenis Makanan dengan Warna Pastel Soft & Poin Berbeda
const FOOD_TYPES = [
    { color: "#f56565", points: 10 }, // Soft Strawberry (+10)
    { color: "#ecc94b", points: 30 }, // Soft Banana Gold (+30)
    { color: "#4299e1", points: 20 }, // Soft Blueberry (+20)
    { color: "#ed64a6", points: 15 }, // Soft Pink (+15)
    { color: "#38b2ac", points: 25 }  // Soft Teal (+25)
];

// State Game
let username = "";
let score = 0;
let highScore = 0;
let level = 1;
let speed = 130;
let gameRunning = false;
let gameLoopTimer = null;

let snake = [];
let direction = "RIGHT";
let nextDirection = "RIGHT";
let foods = [];
let currentThemeIdx = 0;

// Efek Loading Saat Halaman Dibuka
window.addEventListener("load", () => {
    setTimeout(() => {
        loadingScreen.classList.add("hidden");
    }, 600);
});

// Event Submit Login
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    username = usernameInput.value.trim() || "Player";
    playerDisplay.textContent = username;

    loginScreen.style.display = "none";
    gameScreen.style.display = "block";

    initGame();
});

// Keyboard Controls (Aman dari ketikan huruf 'A' saat login)
document.addEventListener("keydown", (e) => {
    if (loginScreen.style.display !== "none") return;

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

// Touch / Button Controls D-Pad (HP)
function handleDirectionInput(newDir) {
    if (!gameRunning) return;
    if (newDir === "UP" && direction !== "DOWN") nextDirection = "UP";
    if (newDir === "DOWN" && direction !== "UP") nextDirection = "DOWN";
    if (newDir === "LEFT" && direction !== "RIGHT") nextDirection = "LEFT";
    if (newDir === "RIGHT" && direction !== "LEFT") nextDirection = "RIGHT";
}

btnUp.addEventListener("click", () => handleDirectionInput("UP"));
btnDown.addEventListener("click", () => handleDirectionInput("DOWN"));
btnLeft.addEventListener("click", () => handleDirectionInput("LEFT"));
btnRight.addEventListener("click", () => handleDirectionInput("RIGHT"));
btnRestart.addEventListener("click", () => {
    if (gameScreen.style.display !== "none") {
        initGame();
    }
});

// Touch swipe support pada canvas
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

canvas.addEventListener("touchend", (e) => {
    if (!gameRunning) return;
    let touchEndX = e.changedTouches[0].clientX;
    let touchEndY = e.changedTouches[0].clientY;

    let dx = touchEndX - touchStartX;
    let dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20 && direction !== "LEFT") nextDirection = "RIGHT";
        else if (dx < -20 && direction !== "RIGHT") nextDirection = "LEFT";
    } else {
        if (dy > 20 && direction !== "UP") nextDirection = "DOWN";
        else if (dy < -20 && direction !== "DOWN") nextDirection = "UP";
    }
}, { passive: true });

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
    speed = 130;
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

function createSingleFood() {
    const cols = CANVAS_WIDTH / GRID_SIZE;
    const rows = CANVAS_HEIGHT / GRID_SIZE;

    while (true) {
        const foodX = Math.floor(Math.random() * cols) * GRID_SIZE;
        const foodY = Math.floor(Math.random() * rows) * GRID_SIZE;

        const isOverlapSnake = snake.some(s => s.x === foodX && s.y === foodY);
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

// Logic Loop
function gameUpdate() {
    direction = nextDirection;
    const head = { ...snake[0] };

    if (direction === "UP") head.y -= GRID_SIZE;
    if (direction === "DOWN") head.y += GRID_SIZE;
    if (direction === "LEFT") head.x -= GRID_SIZE;
    if (direction === "RIGHT") head.x += GRID_SIZE;

    // Tabrakan Dinding
    if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
        gameOver();
        return;
    }

    // Tabrakan Badan
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Makan
    const eatenIndex = foods.findIndex(f => f.x === head.x && f.y === head.y);

    if (eatenIndex !== -1) {
        const eatenFood = foods[eatenIndex];
        score += eatenFood.points;
        scoreDisplay.textContent = score;

        if (score > highScore) {
            highScore = score;
            highScoreDisplay.textContent = highScore;
        }

        const newLevel = Math.floor(score / 100) + 1;
        if (newLevel !== level) {
            level = newLevel;
            levelDisplay.textContent = level;
            currentThemeIdx = (currentThemeIdx + 1) % SNAKE_THEMES.length;
            if (speed > 55) {
                speed -= 8;
                clearInterval(gameLoopTimer);
                gameLoopTimer = setInterval(gameUpdate, speed);
            }
        }

        foods[eatenIndex] = createSingleFood();
    } else {
        snake.pop();
    }

    draw();
}

// Render Grafis Canvas
function draw() {
    // 1. Latar Belakang Warna Soft
    ctx.fillStyle = "#fafbfc";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Gambar Grid Garis Kotak-Kotak Tipis Soft
    ctx.strokeStyle = "#edf2f7";
    ctx.lineWidth = 1;

    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
    }

    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
    }

    // 3. Gambar 5 Makanan Soft Pastel
    foods.forEach(food => {
        const radius = GRID_SIZE / 2;
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(food.x + radius, food.y + radius, radius - 3, 0, Math.PI * 2);
        ctx.fill();

        // Kilat Makanan
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(food.x + radius - 2, food.y + radius - 2, radius / 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // 4. Gambar Ular Soft
    const theme = SNAKE_THEMES[currentThemeIdx];
    snake.forEach((segment, index) => {
        const r = 5; // Border radius melengkung halus
        ctx.fillStyle = index === 0 ? theme.head : theme.body;

        // Rounded Rect untuk Segmen Ular
        ctx.beginPath();
        ctx.roundRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2, [r]);
        ctx.fill();

        if (index === 0) {
            // Mata
            ctx.fillStyle = "#ffffff";
            let eyeX1, eyeY1, eyeX2, eyeY2;

            if (direction === "RIGHT") {
                eyeX1 = segment.x + GRID_SIZE - 6; eyeY1 = segment.y + 5;
                eyeX2 = segment.x + GRID_SIZE - 6; eyeY2 = segment.y + GRID_SIZE - 8;
            } else if (direction === "LEFT") {
                eyeX1 = segment.x + 6; eyeY1 = segment.y + 5;
                eyeX2 = segment.x + 6; eyeY2 = segment.y + GRID_SIZE - 8;
            } else if (direction === "UP") {
                eyeX1 = segment.x + 5; eyeY1 = segment.y + 6;
                eyeX2 = segment.x + GRID_SIZE - 8; eyeY2 = segment.y + 6;
            } else {
                eyeX1 = segment.x + 5; eyeY1 = segment.y + GRID_SIZE - 6;
                eyeX2 = segment.x + GRID_SIZE - 8; eyeY2 = segment.y + GRID_SIZE - 6;
            }

            ctx.fillRect(eyeX1, eyeY1, 3, 3);
            ctx.fillRect(eyeX2, eyeY2, 3, 3);
        }
    });
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoopTimer);

    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#e53e3e";
    ctx.font = "bold 32px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Permainan Selesai!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = "#4a5568";
    ctx.font = "600 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Skor Akhir: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.fillStyle = "#a0aec0";
    ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Tekan 'R' atau tombol ↻ di HP untuk bermain lagi", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
}
