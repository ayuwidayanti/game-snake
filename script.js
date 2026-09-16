// Konfigurasi Game
const GRID_SIZE = 20;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 580;
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

// D-Pad Mobile Buttons
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

// Palette Soft & Vintage (Antique White, Peru, Plum, Soft Muted Tones)
const SNAKE_THEMES = [
    { head: "#cd853f", body: "#dda0dd" }, // Peru + Plum
    { head: "#8b5a2b", body: "#e6be8a" }, // Dark Warm Brown + Soft Caramel
    { head: "#b87333", body: "#d8a7b1" }, // Copper + Soft Pastel Rose
    { head: "#9b72aa", body: "#c8b6ff" }, // Soft Lavender
    { head: "#6b8e23", body: "#c2d49d" }  // Olive Green + Sage
];

// 5 Makanan Warna Soft
const FOOD_TYPES = [
    { color: "#cd853f", points: 10 }, // Peru
    { color: "#dda0dd", points: 30 }, // Plum
    { color: "#b87333", points: 20 }, // Warm Bronze
    { color: "#8b5a2b", points: 15 }, // Warm Coffee
    { color: "#9b72aa", points: 25 }  // Pastel Lavender
];

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
let foods = [];
let currentThemeIdx = 0;

// Simulasi Loading Screen saat pertama kali dimuat
window.addEventListener("load", () => {
    setTimeout(() => {
        loadingScreen.style.opacity = "0";
        setTimeout(() => {
            loadingScreen.style.visibility = "hidden";
        }, 400);
    }, 1200); // Tampil selama 1.2 detik
});

// Event Login
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    username = usernameInput.value.trim() || "Player";
    playerDisplay.textContent = username;

    loginScreen.style.display = "none";
    gameScreen.style.display = "block";

    initGame();
});

// Event Listener Keyboard (Aman dari Bug Huruf 'A' saat Login)
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

// Controls D-Pad Mobile Joystick
function setupMobileControls() {
    const triggerDir = (dir) => {
        if (!gameRunning && gameScreen.style.display !== "none") {
            initGame();
            return;
        }
        if (dir === "UP" && direction !== "DOWN") nextDirection = "UP";
        if (dir === "DOWN" && direction !== "UP") nextDirection = "DOWN";
        if (dir === "LEFT" && direction !== "RIGHT") nextDirection = "LEFT";
        if (dir === "RIGHT" && direction !== "LEFT") nextDirection = "RIGHT";
    };

    btnUp.addEventListener("pointerdown", (e) => { e.preventDefault(); triggerDir("UP"); });
    btnDown.addEventListener("pointerdown", (e) => { e.preventDefault(); triggerDir("DOWN"); });
    btnLeft.addEventListener("pointerdown", (e) => { e.preventDefault(); triggerDir("LEFT"); });
    btnRight.addEventListener("pointerdown", (e) => { e.preventDefault(); triggerDir("RIGHT"); });
}
setupMobileControls();

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

    // Tabrakan Diri Sendiri
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

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

// Render Grafis dengan Soft Grid Lines & Warm Background
function draw() {
    // 1. Background Antique White Solid
    ctx.fillStyle = "#faebd7";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Kotak-kotak Bergaris Tipis/Kecil (Soft Grid Lines)
    ctx.strokeStyle = "#f0dfcc";
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

    // 3. Gambar 5 Makanan Soft
    foods.forEach(food => {
        ctx.fillStyle = food.color;
        ctx.beginPath();
        const radius = GRID_SIZE / 2;
        ctx.arc(food.x + radius, food.y + radius, radius - 3, 0, Math.PI * 2);
        ctx.fill();

        // Kilatan Cahaya Soft
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(food.x + radius - 3, food.y + radius - 3, radius / 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // 4. Gambar Ular Soft Theme
    const theme = SNAKE_THEMES[currentThemeIdx];
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Kepala Rounded Soft
            ctx.fillStyle = theme.head;
            drawRoundedRect(ctx, segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 6);

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
            drawRoundedRect(ctx, segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 4);
        }
    });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function gameOver() {
    gameRunning = false;
    clearInterval(gameLoopTimer);

    ctx.fillStyle = "rgba(250, 235, 215, 0.88)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#8b5a2b";
    ctx.font = "bold 34px 'Quicksand', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.fillStyle = "#cd853f";
    ctx.font = "bold 18px 'Quicksand', sans-serif";
    ctx.fillText(`Skor Akhir: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    ctx.fillStyle = "#a08c84";
    ctx.font = "14px 'Quicksand', sans-serif";
    ctx.fillText("Tekan 'R' atau Sentuh D-Pad untuk Main Lagi", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}
