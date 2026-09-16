// Konfigurasi Game
const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 560;
const TOTAL_FOODS = 5;

// DOM Elements
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

// Tema Warna Ular Soft Pastels
const SNAKE_THEMES = [
    { head: "#48bb78", body: "#68d391" }, // Soft Emerald
    { head: "#4299e1", body: "#63b3ed" }, // Soft Blue
    { head: "#ed8936", body: "#f6ad55" }, // Soft Amber
    { head: "#9f7aea", body: "#b794f4" }, // Soft Purple
    { head: "#e53e3e", body: "#fc8181" }  // Soft Coral
];

// Jenis Makanan (5 jenis pastel dengan poin)
const FOOD_TYPES = [
    { color: "#fc8181", points: 10 }, // Soft Red
    { color: "#f6ad55", points: 30 }, // Soft Gold
    { color: "#63b3ed", points: 20 }, // Soft Blue
    { color: "#b794f4", points: 15 }, // Soft Purple
    { color: "#68d391", points: 25 }  // Soft Green
];

// State Game
let username = "";
let score = 0;
let highScore = 0;
let level = 1;
let speed = 120;
let gameRunning = false;
let isPaused = false;
let gameLoopTimer = null;

let snake = [];
let direction = "RIGHT";
let nextDirection = "RIGHT";
let foods = [];
let currentThemeIdx = 0;

// Simulasi Loading Screen
window.addEventListener("load", () => {
    setTimeout(() => {
        loadingScreen.style.opacity = "0";
        loadingScreen.style.visibility = "hidden";
    }, 1800);
});

// Event Form Login
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    username = usernameInput.value.trim() || "Player";
    playerDisplay.textContent = username;

    loginScreen.style.display = "none";
    gameScreen.style.display = "block";

    initGame();
});

// Event Keyboard (Aman dari Bug Huruf A saat Login)
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
    } else if (key === "r" && !gameRunning) {
        initGame();
    } else if (key === "p" && gameRunning) {
        togglePause();
    }
});

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameLoopTimer);
        drawPauseOverlay();
    } else {
        gameLoopTimer = setInterval(gameUpdate, speed);
    }
}

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
    isPaused = false;

    scoreDisplay.textContent = score;
    levelDisplay.textContent = level;

    generateAllFoods();

    if (gameLoopTimer) clearInterval(gameLoopTimer);
    gameRunning = true;
    gameLoopTimer = setInterval(gameUpdate, speed);
}

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

        const isOverlapSnake = snake.some(segment => segment.x === foodX && segment.y === foodY);
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

function gameUpdate() {
    direction = nextDirection;

    const head = { ...snake[0] };

    if (direction === "UP") head.y -= GRID_SIZE;
    if (direction === "DOWN") head.y += GRID_SIZE;
    if (direction === "LEFT") head.x -= GRID_SIZE;
    if (direction === "RIGHT") head.x += GRID_SIZE;

    // Cek Dinding
    if (head.x < 0 || head.x >= CANVAS_WIDTH || head.y < 0 || head.y >= CANVAS_HEIGHT) {
        gameOver();
        return;
    }

    // Cek Tabrakan Diri Sendiri
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    // Memakan makanan
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
            if (speed > 50) {
                speed -= 10;
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

// Render Grafis
function draw() {
    // 1. Background Soft Canvas
    ctx.fillStyle = "#fafbfc";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Garis Kotak-Kotak Tipis (Soft Grid Lines)
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

    // 3. Render 5 Makanan (Soft Bulat dengan Ring)
    foods.forEach(food => {
        const radius = GRID_SIZE / 2;
        const cx = food.x + radius;
        const cy = food.y + radius;

        // Lingkaran Makanan
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
        ctx.fill();

        // Soft Highlight Sparkle
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 2, radius / 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // 4. Render Ular Pastel
    const theme = SNAKE_THEMES[currentThemeIdx];
    snake.forEach((segment, index) => {
        const x = segment.x + 1;
        const y = segment.y + 1;
        const w = GRID_SIZE - 2;
        const h = GRID_SIZE - 2;
        const r = 6; // Rounded corner untuk bentuk ular lebih soft

        if (index === 0) {
            // Kepala Ular
            ctx.fillStyle = theme.head;
            drawRoundedRect(ctx, x, y, w, h, r);

            // Mata Ular
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
        } else {
            // Badan Ular
            ctx.fillStyle = theme.body;
            drawRoundedRect(ctx, x, y, w, h, 4);
        }
    });
}

// Helper Rounded Rect
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
}

function drawPauseOverlay() {
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#2d3748";
    ctx.font = "800 32px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    ctx.fillStyle = "#718096";
    ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Tekan 'P' untuk Melanjutkan Permainan", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoopTimer);

    ctx.fillStyle = "rgba(247, 250, 252, 0.88)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#e53e3e";
    ctx.font = "800 36px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = "#2d3748";
    ctx.font = "600 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(`Skor Perolehan: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.fillStyle = "#718096";
    ctx.font = "500 14px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText("Tekan 'R' untuk Memulai Kembali", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
}
