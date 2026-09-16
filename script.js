const GRID_SIZE = 25;
const HEADER_HEIGHT = 0;

const COLORS = {
    background: "#f7f5f0",
    grid: "#eeeae2",
    header: "#e1dcd2",
    headerLine: "#c8c3b9",
    text: "#464b50",
    subText: "#82878c",
    button: "#a2b9a2",
    food: "#e17055",
    foodGlow: "#fab1a0",
    white: "#ffffff"
};

const SNAKE_PALETTES = [
    "#8ea98e",
    "#82a0b4",
    "#c39bb4",
    "#dca08c",
    "#b4aa82"
];

const ACCOUNTS = {
    "nella": "123",
    "ayu": "123",
    "admin": "admin"
};

const loadingScreen = document.getElementById("loading-screen");
const loginScreen = document.getElementById("login-screen");
const gameScreen = document.getElementById("game-screen");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("login-error");
const loginButton = document.getElementById("login-button");
const userInfo = document.getElementById("user-info");
const scoreInfo = document.getElementById("score-info");
const gameOver = document.getElementById("game-over");
const gameOverScore = document.getElementById("game-over-score");
const restartButton = document.getElementById("restart-button");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let currentUser = "";
let snake = [];
let direction = "RIGHT";
let nextDirection = "RIGHT";
let food = null;
let score = 0;
let level = 1;
let speed = 120;
let gameRunning = false;
let gameTimer = null;
let particles = [];
let currentPaletteIndex = 0;
let snakeColor = SNAKE_PALETTES[0];

let highScore = Number(localStorage.getItem("yukksnakeHighScore") || 0);

function resizeCanvas() {
    const area = document.getElementById("game-area");
    canvas.width = area.clientWidth;
    canvas.height = area.clientHeight;
    draw();
}

window.addEventListener("resize", resizeCanvas);

function showLogin() {
    loadingScreen.style.display = "none";
    loginScreen.style.display = "flex";
    usernameInput.focus();
}

function startLoading() {
    const start = Date.now();
    const duration = 2500;

    function loop() {
        const progress = Math.min(1, (Date.now() - start) / duration);
        progressBar.style.width = (progress * 100) + "%";
        progressText.textContent = Math.floor(progress * 100) + "%";

        if (progress >= 1) showLogin();
        else requestAnimationFrame(loop);
    }

    loop();
}

function login() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (ACCOUNTS[username] && ACCOUNTS[username] === password) {
        currentUser = username;
        loginError.textContent = "";
        loginScreen.style.display = "none";
        gameScreen.style.display = "flex";
        resetGame();
        resizeCanvas();
    } else {
        loginError.textContent = "Username / Password Salah!";
    }
}

loginButton.addEventListener("click", login);

usernameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") passwordInput.focus();
});

passwordInput.addEventListener("keydown", e => {
    if (e.key === "Enter") login();
});

function createFood() {
    const columns = Math.max(1, Math.floor(canvas.width / GRID_SIZE));
    const rows = Math.max(1, Math.floor(canvas.height / GRID_SIZE));

    while (true) {
        const position = {
            x: Math.floor(Math.random() * columns) * GRID_SIZE,
            y: Math.floor(Math.random() * rows) * GRID_SIZE
        };

        if (!snake.some(s => s.x === position.x && s.y === position.y)) {
            return position;
        }
    }
}

function resetGame() {
    stopGame();

    const startY = Math.max(GRID_SIZE, Math.floor(canvas.height / 2 / GRID_SIZE) * GRID_SIZE);

    snake = [
        { x: 100, y: startY },
        { x: 75, y: startY },
        { x: 50, y: startY }
    ];

    direction = "RIGHT";
    nextDirection = "RIGHT";
    score = 0;
    level = 1;
    speed = 120;
    currentPaletteIndex = 0;
    snakeColor = SNAKE_PALETTES[0];
    particles = [];
    food = createFood();

    gameOver.style.display = "none";
    gameRunning = true;

    updateHeader();
    startGame();
    draw();
}

function startGame() {
    clearInterval(gameTimer);
    gameTimer = setInterval(moveSnake, speed);
}

function stopGame() {
    clearInterval(gameTimer);
    gameTimer = null;
}

function changeDirection(newDirection) {
    const opposites = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT"
    };

    if (opposites[newDirection] !== direction) {
        nextDirection = newDirection;
    }
}

document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (key === "arrowup" || key === "w") {
        e.preventDefault();
        changeDirection("UP");
    } else if (key === "arrowdown" || key === "s") {
        e.preventDefault();
        changeDirection("DOWN");
    } else if (key === "arrowleft" || key === "a") {
        e.preventDefault();
        changeDirection("LEFT");
    } else if (key === "arrowright" || key === "d") {
        e.preventDefault();
        changeDirection("RIGHT");
    } else if (key === "r" && !gameRunning && gameScreen.style.display !== "none") {
        resetGame();
    } else if (e.key === "Escape" && gameScreen.style.display !== "none") {
        location.reload();
    }
});

document.getElementById("btn-up").addEventListener("pointerdown", () => changeDirection("UP"));
document.getElementById("btn-down").addEventListener("pointerdown", () => changeDirection("DOWN"));
document.getElementById("btn-left").addEventListener("pointerdown", () => changeDirection("LEFT"));
document.getElementById("btn-right").addEventListener("pointerdown", () => changeDirection("RIGHT"));

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", e => {
    const touch = e.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}, { passive: true });

canvas.addEventListener("touchend", e => {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (Math.abs(dx) < 25 && Math.abs(dy) < 25) return;

    if (Math.abs(dx) > Math.abs(dy)) {
        changeDirection(dx > 0 ? "RIGHT" : "LEFT");
    } else {
        changeDirection(dy > 0 ? "DOWN" : "UP");
    }
}, { passive: true });

function moveSnake() {
    if (!gameRunning) return;

    direction = nextDirection;

    const head = {
        x: snake[0].x,
        y: snake[0].y
    };

    if (direction === "UP") head.y -= GRID_SIZE;
    if (direction === "DOWN") head.y += GRID_SIZE;
    if (direction === "LEFT") head.x -= GRID_SIZE;
    if (direction === "RIGHT") head.x += GRID_SIZE;

    if (
        head.x < 0 ||
        head.x + GRID_SIZE > canvas.width ||
        head.y < 0 ||
        head.y + GRID_SIZE > canvas.height
    ) {
        endGame();
        return;
    }

    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    const ateFood = head.x === food.x && head.y === food.y;

    if (ateFood) {
        score += 10;

        if (score > highScore) {
            highScore = score;
            localStorage.setItem("yukksnakeHighScore", highScore);
        }

        currentPaletteIndex =
            (currentPaletteIndex + 1) % SNAKE_PALETTES.length;

        snakeColor = SNAKE_PALETTES[currentPaletteIndex];

        addParticles(food.x, food.y, snakeColor);

        if (score % 30 === 0) {
            level++;
            speed = Math.max(50, speed - 15);
            startGame();
        }

        food = createFood();
    } else {
        snake.pop();
    }

    updateHeader();
    draw();
}

function endGame() {
    gameRunning = false;
    stopGame();
    gameOverScore.textContent = `Skor: ${score} | Best: ${highScore}`;
    gameOver.style.display = "flex";
}

restartButton.addEventListener("click", resetGame);

function updateHeader() {
    userInfo.textContent = `yukksnake | ${currentUser} (Lvl ${level})`;
    scoreInfo.textContent = `Skor: ${score}   Best: ${highScore}`;
}

function addParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x + GRID_SIZE / 2,
            y: y + GRID_SIZE / 2,
            vx: (Math.random() - .5) * 5,
            vy: (Math.random() - .5) * 5,
            radius: 3 + Math.random() * 2,
            life: 20,
            color
        });
    }
}

function updateParticles() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.radius *= .94;
    });

    particles = particles.filter(p => p.life > 0 && p.radius > .5);
}

function drawBackground() {
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += GRID_SIZE) {
        for (let x = 0; x < canvas.width; x += GRID_SIZE) {
            const gx = Math.floor(x / GRID_SIZE);
            const gy = Math.floor(y / GRID_SIZE);

            if ((gx + gy) % 2 === 0) {
                ctx.fillStyle = COLORS.grid;
                ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
            }
        }
    }
}

function drawFood() {
    const cx = food.x + GRID_SIZE / 2;
    const cy = food.y + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2 - 2;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.food;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx - 3, cy - 3, radius / 3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.foodGlow;
    ctx.fill();
}

function drawEye(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#3c3c3c";
    ctx.fill();
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x + 1;
        const y = segment.y + 1;
        const size = GRID_SIZE - 2;

        ctx.fillStyle = index === 0 ? snakeColor : darkenColor(snakeColor, 15);
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, index === 0 ? 7 : 5);
        ctx.fill();

        if (index === 0) {
            let e1, e2;

            if (direction === "RIGHT") {
                e1 = { x: x + size - 6, y: y + 7 };
                e2 = { x: x + size - 6, y: y + size - 7 };
            } else if (direction === "LEFT") {
                e1 = { x: x + 6, y: y + 7 };
                e2 = { x: x + 6, y: y + size - 7 };
            } else if (direction === "UP") {
                e1 = { x: x + 7, y: y + 6 };
                e2 = { x: x + size - 7, y: y + 6 };
            } else {
                e1 = { x: x + 7, y: y + size - 6 };
                e2 = { x: x + size - 7, y: y + size - 6 };
            }

            drawEye(e1.x, e1.y);
            drawEye(e2.x, e2.y);
        }
    });
}

function darkenColor(hex, amount) {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 255) - amount);
    const b = Math.max(0, (num & 255) - amount);
    return `rgb(${r}, ${g}, ${b})`;
}

function drawParticles() {
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.globalAlpha = Math.max(0, p.life / 20);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

function draw() {
    if (!canvas.width || !canvas.height) return;

    drawBackground();

    if (food) drawFood();

    drawSnake();
    updateParticles();
    drawParticles();
}

function animationLoop() {
    if (gameRunning) draw();
    requestAnimationFrame(animationLoop);
}

document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

startLoading();
animationLoop();
