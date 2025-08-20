// Initialize Kaboom.js
kaboom({
    global: true,
    width: 800,
    height: 600,
    scale: 1,
    debug: true,
    clearColor: [0.1, 0.1, 0.3, 1]
});

// Game constants
const PLAYER_SPEED = 200;
const ENEMY_SPEED = 35;
const ITEM_SPEED = 35;
const ENERGY_DECAY = 0.1;
const MAX_ENERGY = 100;

// Game state
let score = 0;

// Mobile controls
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

// Define colors using RGB values
const BLUE = [52/255, 152/255, 219/255, 1];
const RED = [231/255, 76/255, 60/255, 1];
const GREEN = [46/255, 204/255, 113/255, 1];
const YELLOW = [241/255, 196/255, 15/255, 1];
const WHITE = [1, 1, 1, 1];
const BLACK = [0, 0, 0, 1];

// Load assets
loadBean();

// Mobile controls setup
function setupMobileControls() {
    let moveLeft = false;
    let moveRight = false;
    
    leftBtn.addEventListener("touchstart", () => { moveLeft = true; });
    leftBtn.addEventListener("touchend", () => { moveLeft = false; });
    rightBtn.addEventListener("touchstart", () => { moveRight = true; });
    rightBtn.addEventListener("touchend", () => { moveRight = false; });
    
    // Return a function that will tell us which direction to move
    return () => {
        if (moveLeft) return -1;
        if (moveRight) return 1;
        return 0;
    };
}

const getMobileDirection = setupMobileControls();

// Start screen scene
scene("start", () => {
    add([
        text("THE BHAAVA GAME", 32),
        pos(width() / 2, height() / 4),
        origin("center"),
    ]);
    
    add([
        text("Collect alcohol and leaves to survive! Avoid enemies!", 18),
        pos(width() / 2, height() / 2),
        origin("center"),
    ]);
    
    const startBtn = add([
        rect(200, 60),
        pos(width() / 2, height() * 0.7),
        color(BLUE),
        origin("center"),
        "button",
    ]);
    
    add([
        text("START GAME", 22),
        pos(width() / 2, height() * 0.7),
        origin("center"),
        color(WHITE),
    ]);
    
    // Mouse click on button
    mouseClick(() => {
        const mpos = mousePos();
        if (startBtn.isHovering()) {
            go("game");
        }
    });
    
    // Touch for mobile
    mouseDown(() => {
        const mpos = mousePos();
        if (startBtn.isHovering()) {
            go("game");
        }
    });
    
    // Keyboard option
    keyPress("enter", () => {
        go("game");
    });
});

// Main game scene
scene("game", () => {
    layers([
        "bg",
        "game",
        "ui",
    ], "game");
    
    // Score display
    const scoreLabel = add([
        text("Score: 0", 16),
        pos(20, 20),
        layer("ui"),
    ]);
    
    // Energy bar background
    add([
        rect(204, 24),
        pos(width() / 2 - 102, 20),
        color(BLACK),
        layer("ui"),
    ]);
    
    // Energy bar
    const energyBar = add([
        rect(200, 20),
        pos(width() / 2 - 100, 22),
        color(GREEN),
        layer("ui"),
    ]);
    
    // Player character
    const player = add([
        sprite("baava-neutral"),
        pos(width() / 2, height() - 50),
        scale(1),
        area(),
        origin("center"),
        "player",
        {
            energy: MAX_ENERGY,
            showEffect: function(effect) {
                if (this._effectTimeout) clearTimeout(this._effectTimeout);
                if (effect === "bottle") {
                    this.use(sprite("baava-bottle"));
                } else if (effect === "leaf") {
                    this.use(sprite("baava-leaf"));
                }
                this._effectTimeout = setTimeout(() => {
                    this.use(sprite("baava-neutral"));
                }, 700); // Show effect for 0.7s
            }
        },
    ]);
    
    // Player movement
    onUpdate(() => {
        // First check keyboard
        let dir = 0;
        if (keyIsDown("left") || keyIsDown("a")) dir = -1;
        else if (keyIsDown("right") || keyIsDown("d")) dir = 1;
        
        // If no keyboard input, check mobile
        if (dir === 0) dir = getMobileDirection();
        
        // Move player
        player.move(dir * PLAYER_SPEED, 0);
        
        // Keep player within screen
        if (player.pos.x < 0) player.pos.x = 0;
        if (player.pos.x > width()) player.pos.x = width();
        
        // Decrease energy over time
        player.energy -= ENERGY_DECAY;
        energyBar.width = (player.energy / MAX_ENERGY) * 200;
        
        // Check for game over
        if (player.energy <= 0) {
            go("gameOver", score);
        }
    });
    
    // Spawn alcohol
    loop(2, () => {
        add([
            rect(16, 24),
            pos(rand(0, width()), 0),
            color(YELLOW),
            origin("center"),
            area(),
            "alcohol",
            {
                speed: ITEM_SPEED,
            }
        ]);
    });

    // Spawn leaves
    loop(1.5, () => {
        add([
            circle(10),
            pos(rand(0, width()), 0),
            color(GREEN),
            origin("center"),
            area(),
            "leaf",
            {
                speed: ITEM_SPEED * 0.8,
            }
        ]);
    });
    
    // Spawn enemies
    loop(3, () => {
        add([
            rect(24, 24),
            pos(rand(0, width()), 0),
            color(RED),
            origin("center"),
            area(),
            "enemy",
            {
                speed: ENEMY_SPEED,
            }
        ]);
    });
    
    // Move items down
    onUpdate("alcohol", (a) => {
        a.move(0, a.speed);
        if (a.pos.y > height()) destroy(a);
    });
    
    onUpdate("leaf", (l) => {
        l.move(0, l.speed);
        if (l.pos.y > height()) destroy(l);
    });
    
    onUpdate("enemy", (e) => {
        e.move(0, e.speed);
        if (e.pos.y > height()) destroy(e);
    });
    
    // Collisions
    player.onCollide("alcohol", (a) => {
        destroy(a);
        player.energy = Math.min(player.energy + 10, MAX_ENERGY);
        updateScore(10);
        player.showEffect && player.showEffect("bottle");
    });

    player.onCollide("leaf", (l) => {
        destroy(l);
        player.energy = Math.min(player.energy + 5, MAX_ENERGY);
        updateScore(5);
        player.showEffect && player.showEffect("leaf");
    });
    
    player.onCollide("enemy", (e) => {
        destroy(e);
        player.energy = Math.max(player.energy - 20, 0);
    });
});

// Game over scene
scene("gameOver", (finalScore) => {
    add([
        rect(width(), height()),
        color(BLACK),
        opacity(0.8),
    ]);
    
    add([
        text("GAME OVER", 40),
        pos(width() / 2, height() / 3),
        origin("center"),
        color(RED),
    ]);
    
    add([
        text("Bhaava ran out of energy!", 20),
        pos(width() / 2, height() / 2 - 30),
        origin("center"),
        color(WHITE),
    ]);
    
    add([
        text("Final Score: " + finalScore, 30),
        pos(width() / 2, height() / 2 + 30),
        origin("center"),
        color(YELLOW),
    ]);
    
    const restartBtn = add([
        rect(200, 60),
        pos(width() / 2, height() * 0.7),
        color(GREEN),
        origin("center"),
        "button",
    ]);
    
    add([
        text("PLAY AGAIN", 22),
        pos(width() / 2, height() * 0.7),
        origin("center"),
        color(WHITE),
    ]);
    
    // Mouse click on button
    mouseClick(() => {
        const mpos = mousePos();
        if (restartBtn.isHovering()) {
            score = 0;
            go("start");
        }
    });
    
    // Touch for mobile
    mouseDown(() => {
        const mpos = mousePos();
        if (restartBtn.isHovering()) {
            score = 0;
            go("start");
        }
    });
    
    // Keyboard option
    keyPress("enter", () => {
        score = 0;
        go("start");
    });
});

// Start with the start screen
start("start");

// Load sprites (we'll use simple colored blocks for now, but we can replace them with actual sprites later)
loadSprite("player", generatePlayerSprite());
loadSprite("alcohol", generateAlcoholSprite());
loadSprite("leaf", generateLeafSprite());
loadSprite("enemy", generateEnemySprite());
loadSprite("background", generateBackgroundSprite());
// Load GIFs for collection effects
loadSprite("baava-bottle", "/Baavagame/artifacts/baava-bottle.GIF");
loadSprite("baava-leaf", "/Baavagame/artifacts/baava-leaf.GIF");

// Generate pixel art sprites using Kaboom's sprite rendering
function generatePlayerSprite() {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    
    // Body (blue)
    ctx.fillStyle = "#3498db";
    ctx.fillRect(4, 8, 16, 24);
    
    // Head
    ctx.fillRect(6, 0, 12, 10);
    
    // Eyes
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(8, 3, 3, 3);
    ctx.fillRect(15, 3, 3, 3);
    
    // Pupils
    ctx.fillStyle = "#000000";
    ctx.fillRect(9, 4, 1, 1);
    ctx.fillRect(16, 4, 1, 1);
    
    // Mouth
    ctx.fillRect(10, 7, 4, 1);
    
    // Legs
    ctx.fillStyle = "#2980b9";
    ctx.fillRect(6, 28, 4, 4);
    ctx.fillRect(14, 28, 4, 4);
    
    return canvas;
}

function generateAlcoholSprite() {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 24;
    const ctx = canvas.getContext("2d");
    
    // Bottle
    ctx.fillStyle = "#f39c12";
    ctx.fillRect(4, 2, 8, 16);
    ctx.fillRect(2, 18, 12, 6);
    
    // Bottle top
    ctx.fillStyle = "#e67e22";
    ctx.fillRect(6, 0, 4, 2);
    
    // Shine
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(10, 5, 1, 3);
    
    return canvas;
}

function generateLeafSprite() {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    
    // Leaf shape
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.bezierCurveTo(12, 5, 16, 8, 8, 16);
    ctx.bezierCurveTo(0, 8, 4, 5, 8, 0);
    ctx.fill();
    
    // Stem
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(7, 10, 2, 6);
    
    // Vein
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(8, 2, 1, 10);
    
    return canvas;
}

function generateEnemySprite() {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext("2d");
    
    // Body
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(4, 4, 16, 16);
    
    // Eyes
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(6, 8, 4, 4);
    ctx.fillRect(14, 8, 4, 4);
    
    // Angry eyebrows
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(5, 6, 6, 2);
    ctx.fillRect(13, 6, 6, 2);
    
    // Mouth
    ctx.fillStyle = "#c0392b";
    ctx.fillRect(8, 14, 8, 2);
    
    return canvas;
}

function generateBackgroundSprite() {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    
    // Sky
    ctx.fillStyle = "#3498db";
    ctx.fillRect(0, 0, 800, 400);
    
    // Ground
    ctx.fillStyle = "#27ae60";
    ctx.fillRect(0, 400, 800, 200);
    
    // Fair tents (simple shapes)
    for (let i = 0; i < 5; i++) {
        const x = i * 160 + 20;
        
        // Tent
        ctx.fillStyle = ["#e74c3c", "#f1c40f", "#9b59b6", "#2ecc71", "#e67e22"][i];
        ctx.beginPath();
        ctx.moveTo(x, 300);
        ctx.lineTo(x + 120, 300);
        ctx.lineTo(x + 60, 220);
        ctx.fill();
        
        // Tent entrance
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(x + 45, 260, 30, 40);
    }
    
    // Clouds
    ctx.fillStyle = "#ecf0f1";
    for (let i = 0; i < 8; i++) {
        const x = i * 100 + 50;
        const y = i * 20 + 50;
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 15, y - 10, 20, 0, Math.PI * 2);
        ctx.arc(x + 30, y, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas;
}

// Mobile control handling
function setupMobileControls() {
    let leftPressed = false;
    let rightPressed = false;
    
    leftBtn.addEventListener("touchstart", () => {
        leftPressed = true;
    });
    
    leftBtn.addEventListener("touchend", () => {
        leftPressed = false;
    });
    
    rightBtn.addEventListener("touchstart", () => {
        rightPressed = true;
    });
    
    rightBtn.addEventListener("touchend", () => {
        rightPressed = false;
    });
    
    // Return a function that will be called every frame to check the state
    return () => {
        if (leftPressed) return -1;
        if (rightPressed) return 1;
        return 0;
    };
}

// Mobile controls already set up earlier
// Removed duplicate declaration: const getMobileDirection = setupMobileControls();

// Create a start scene
scene("start", () => {
    // Show background
    add([
        sprite("background"),
        pos(width() / 2, height() / 2),
        origin("center"),
        scale(1)
    ]);
    
    // Game title
    add([
        text("The Bhaava Game", {
            size: 40,
            width: width() - 100,
            font: "sink",
        }),
        pos(width() / 2, height() / 3),
        origin("center"),
        color(255, 255, 255),
    ]);
    
    // Instructions
    add([
        text("Help Bhaava collect alcohol and leaves\nwhile avoiding enemies!", {
            size: 16,
            width: width() - 100,
            font: "sink",
            lineSpacing: 8,
        }),
        pos(width() / 2, height() / 2),
        origin("center"),
        color(255, 255, 255),
    ]);
    
    // Start button
    const startBtn = add([
        rect(200, 60),
        pos(width() / 2, height() * 0.7),
        origin("center"),
        color(231, 76, 60),
        area(),
    ]);
    
    // Start button text
    add([
        text("Start Game", {
            size: 24,
            font: "sink",
        }),
        pos(width() / 2, height() * 0.7),
        origin("center"),
        color(255, 255, 255),
    ]);
    
    // Click handler for start button
    startBtn.onClick(() => {
        go("game");
    });
    
    // Also allow keyboard to start
    onKeyPress("enter", () => {
        go("game");
    });
});

// Create the main game scene
scene("game", () => {
    gameStarted = true;
    
    // Set up the game
    gravity(0);
    
    // Add background
    add([
        sprite("background"),
        pos(width() / 2, height() / 2),
        origin("center"),
        scale(1),
        fixed(),
        z(-10),
    ]);
    
    // Add player
    const player = add([
        sprite("player"),
        pos(width() / 2, height() - 50),
        origin("center"),
        area(),
        "player",
        {
            energy: MAX_ENERGY,
            speed: SPEED,
            direction: 0,
        }
    ]);
    
    // Energy bar background
    const energyBarBg = add([
        rect(200, 20),
        pos(width() / 2, 20),
        origin("center"),
        fixed(),
        color(127, 140, 141),
    ]);
    
    // Energy bar
    const energyBar = add([
        rect(200, 20),
        pos(width() / 2 - 100, 20),
        origin("topleft"),
        fixed(),
        color(46, 204, 113),
        {
            width: 200,
        }
    ]);
    
    // Score display
    const scoreText = add([
        text("Score: 0", {
            size: 16,
            font: "sink",
        }),
        pos(20, 20),
        fixed(),
        color(255, 255, 255),
    ]);
    
    // Update score function
    function updateScore(points) {
        score += points;
        scoreText.text = "Score: " + score;
    }
    
    // Player movement
    onUpdate(() => {
        // Check keyboard input
        let dir = 0;
        
        if (isKeyDown("left") || isKeyDown("a")) {
            dir = -1;
        } else if (isKeyDown("right") || isKeyDown("d")) {
            dir = 1;
        }
        
        // Check mobile input if no keyboard input
        if (dir === 0) {
            dir = getMobileDirection();
        }
        
        player.direction = dir;
        
        // Move the player
        player.move(player.direction * player.speed, 0);
        
        // Keep player within screen bounds
        if (player.pos.x < 0) {
            player.pos.x = 0;
        }
        if (player.pos.x > width()) {
            player.pos.x = width();
        }
        
        // Decrease energy over time
        player.energy -= ENERGY_DECAY;
        
        // Update energy bar
        energyBar.width = (player.energy / MAX_ENERGY) * 200;
        
        // End game if energy reaches zero
        if (player.energy <= 0) {
            go("gameOver", score);
        }
    });
    
    // Spawn alcohol
    loop(2, () => {
        if (!gameStarted) return;
        
        add([
            sprite("alcohol"),
            pos(rand(0, width()), 0),
            origin("center"),
            area(),
            "alcohol",
            { speed: ITEM_SPEED }
        ]);
    });
    
    // Spawn leaves
    loop(1.5, () => {
        if (!gameStarted) return;
        
        add([
            sprite("leaf"),
            pos(rand(0, width()), 0),
            origin("center"),
            area(),
            "leaf",
            { speed: ITEM_SPEED * 0.8 }
        ]);
    });
    
    // Spawn enemies
    loop(3, () => {
        if (!gameStarted) return;
        
        add([
            sprite("enemy"),
            pos(rand(0, width()), 0),
            origin("center"),
            area(),
            "enemy",
            { speed: ENEMY_SPEED }
        ]);
    });
    
    // Move items down
    onUpdate("alcohol", (alcohol) => {
        alcohol.move(0, alcohol.speed);
        
        if (alcohol.pos.y > height()) {
            destroy(alcohol);
        }
    });
    
    onUpdate("leaf", (leaf) => {
        leaf.move(0, leaf.speed);
        
        if (leaf.pos.y > height()) {
            destroy(leaf);
        }
    });
    
    onUpdate("enemy", (enemy) => {
        enemy.move(0, enemy.speed);
        
        if (enemy.pos.y > height()) {
            destroy(enemy);
        }
    });
    
    // Collisions
    player.onCollide("alcohol", (alcohol) => {
        destroy(alcohol);
        player.energy = Math.min(player.energy + 10, MAX_ENERGY);
        updateScore(10);
    });
    
    player.onCollide("leaf", (leaf) => {
        destroy(leaf);
        player.energy = Math.min(player.energy + 5, MAX_ENERGY);
        updateScore(5);
    });
    
    player.onCollide("enemy", (enemy) => {
        destroy(enemy);
        player.energy = Math.max(player.energy - 20, 0);
    });
});

// Game over scene
scene("gameOver", (finalScore) => {
    gameStarted = false;
    
    // Game over display
    add([
        rect(width(), height()),
        color(0, 0, 0),
        opacity(0.8),
    ]);
    
    add([
        text("GAME OVER", {
            size: 50,
            width: width() - 100,
            font: "sink",
        }),
        pos(width() / 2, height() / 3),
        origin("center"),
        color(231, 76, 60),
    ]);
    
    add([
        text("Bhaava ran out of energy!", {
            size: 20,
            width: width() - 100,
            font: "sink",
        }),
        pos(width() / 2, height() / 2 - 30),
        origin("center"),
        color(255, 255, 255),
    ]);
    
    add([
        text("Final Score: " + finalScore, {
            size: 30,
            font: "sink",
        }),
        pos(width() / 2, height() / 2 + 30),
        origin("center"),
        color(241, 196, 15),
    ]);
    
    // Restart button
    const restartBtn = add([
        rect(200, 60),
        pos(width() / 2, height() * 0.7),
        origin("center"),
        color(46, 204, 113),
        area(),
    ]);
    
    add([
        text("Play Again", {
            size: 24,
            font: "sink",
        }),
        pos(width() / 2, height() * 0.7),
        origin("center"),
        color(255, 255, 255),
    ]);
    
    // Click handler for restart button
    restartBtn.onClick(() => {
        score = 0;
        go("start");
    });
    
    // Also allow keyboard to restart
    onKeyPress("enter", () => {
        score = 0;
        go("start");
    });
});

// Start with the start screen
go("start");
