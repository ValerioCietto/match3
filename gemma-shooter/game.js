// Game settings
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let score = 0;
let gameLooping = true;
let playerX = 100;
let playerY = 100;
let ballX = 50;
let ballY = 50;

// Function to start the game
function startGame() {
  score = 0;
  gameLooping = false;
  playerX = 50;
  playerY = 50;
  ballX = 50;
  ballY = 50;
}

// Function to update the game display
function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the previous frame
    drawBallAndPlayer();
    drawScore();
}

function drawBallAndPlayer() {
  // Ball
  ctx.fillStyle = "blue";
  ctx.fillRect(ballX, ballY, 20, 20);

  // Player
  ctx.fillStyle = "red";
  ctx.beginPath();
  ctx.arc(playerX, playerY, 10, 50, 2 * Math.PI);
  ctx.fill();
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}


// Game loop
function gameLoop() {
    if (gameLooping) {
        update();
        requestAnimationFrame(gameLoop); // Schedule the next frame
    } else {
        await new Promise(resolve => setTimeout(resolve, 100));
        gameLooping = false;
    }

}

// Start the game loop
gameLoop();
