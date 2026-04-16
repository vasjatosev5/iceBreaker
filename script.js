// canvas
let canvas, ctx;
let WIDTH, HEIGHT;

// žoga
let x, y, dx, dy, r = 12; // Malo večja žogica
let ballMoving = false;

// paddle
let paddlex, paddlew = 120, paddleh = 15; // Širši in debelejši plošček

// input
let rightDown = false;
let leftDown = false;

// bricks
let bricks;
let NROWS = 6, NCOLS = 10; // Več kock (6 vrstic, 10 stolpcev)
let BRICKWIDTH, BRICKHEIGHT = 25, PADDING = 5; // Večje kocke in razmiki

// game state
let tocke = 0;
let lives = 3;
let running = false;
let speedMultiplier = 1;

// timer
let startTime = 0;

let isPaused = false;
let pauseStartTime = 0; // Pomaga nam ustaviti časovnik med pavzo

// snow (prilagojeno za 800x600)
let snowflakes = [];
for (let i = 0; i < 150; i++) { // Več snežink
  snowflakes.push({
    x: Math.random() * 800,
    y: Math.random() * 600,
    r: Math.random() * 3 + 1,
    d: Math.random(),
    opacity: Math.random() * 0.5 + 0.3
  });
}

// ---------------- START ----------------
// ---------------- START ----------------
function startGame() {
  if (running) return; 
  
  let tezavnost = document.getElementById("tezavnost").value;

  // Bolj očitne razlike v hitrosti žogice
  if (tezavnost === "easy") {
    speedMultiplier = 0.6; // 40 % počasneje (zelo opazno)
  } else if (tezavnost === "normal") {
    speedMultiplier = 1.0; // Osnovna hitrost
  } else {
    speedMultiplier = 1.5; // 50 % hitreje (pravi izziv!)
  }

  init();
}

// ---------------- INIT ----------------
function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");

  WIDTH = canvas.width;
  HEIGHT = canvas.height;

  resetGame();
  initBricks();

  startTime = Date.now();
  running = true;

  requestAnimationFrame(gameLoop);

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
}
// ---------------- PAVZA ----------------
function togglePause() {
  if (!running) return; // Ne moremo pavzirati, če igra ne teče

  isPaused = !isPaused;
  let btn = document.getElementById("btn-pavza");

  if (isPaused) {
    btn.innerText = "Nadaljuj";
    pauseStartTime = Date.now(); // Zabeležimo trenutek pavze
    
    // Narišemo polprosojno ozadje in napis PAVZA
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = "#00ccff";
    ctx.font = "bold 50px 'Orbitron'";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ccff";
    ctx.fillText("PAVZA", WIDTH / 2, HEIGHT / 2 + 15);
    ctx.shadowBlur = 0; // Resetiramo senco
    ctx.textAlign = "left"; // Resetiramo poravnavo
  } else {
    btn.innerText = "Pavza";
    // Premaknemo začetni čas za čas trajanja pavze, da sekunde ne preskočijo
    startTime += (Date.now() - pauseStartTime); 
    
    // Ponovno poženemo zanko
    requestAnimationFrame(gameLoop);
  }
}

// ---------------- RESET ----------------
function restartGame() {
  // 1. Popolnoma ustavimo igro in pavzo
  running = false;
  isPaused = false;
  document.getElementById("btn-pavza").innerText = "Pavza";

  // 2. Ponastavimo statistiko na začetne vrednosti
  tocke = 0;
  lives = 3;
  updateUI();
  document.getElementById("cas").innerText = "00:00";

  // 3. Če je bilo platno že inicializirano, ga počistimo in pripravimo
  if (ctx) {
    // Narišemo črno/temno ozadje
    ctx.fillStyle = "#020205"; 
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Dodamo neon napis, ki igralca usmeri
    ctx.fillStyle = "#00ccff";
    ctx.font = "bold 35px 'Orbitron'";
    ctx.textAlign = "center";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ccff";
    ctx.fillText("PRIPRAVLJEN?", WIDTH / 2, HEIGHT / 2 - 20);
    
    ctx.font = "20px 'Orbitron'";
    ctx.fillText("Izberi težavnost in klikni 'Začni igro'", WIDTH / 2, HEIGHT / 2 + 30);
    
    // Resetiramo nastavitve risanja
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
  }
}

// ---------------- RESET ----------------
function resetGame() {
  paddlex = WIDTH / 2 - paddlew / 2;
  resetBall();
  tocke = 0;
  lives = 3;
  updateUI();
}

// ---------------- RESET BALL ----------------
function resetBall() {
  x = paddlex + paddlew / 2;
  y = HEIGHT - paddleh - r - 2;

  // Hitrejša žogica za večji zaslon
  dx = 4.5 * speedMultiplier;
  dy = -4.5 * speedMultiplier;

  ballMoving = false;
}

// ---------------- BRICKS ----------------
function initBricks() {
  bricks = [];
  // Izračun širine, da zapolnijo zaslon glede na NCOLS in PADDING
  let totalPadding = (NCOLS + 1) * PADDING;
  BRICKWIDTH = (WIDTH - totalPadding) / NCOLS;

  for (let i = 0; i < NROWS; i++) {
    bricks[i] = [];
    for (let j = 0; j < NCOLS; j++) {
      bricks[i][j] = 1;
    }
  }
}

// ---------------- INPUT ----------------
function keyDown(e) {
  if (e.key === "ArrowRight") {
    rightDown = true;
    ballMoving = true; 
  }
  if (e.key === "ArrowLeft") {
    leftDown = true;
    ballMoving = true;
  }
}

function keyUp(e) {
  if (e.key === "ArrowRight") rightDown = false;
  if (e.key === "ArrowLeft") leftDown = false;
}

// ---------------- UI ----------------
function updateUI() {
  document.getElementById("tocke").innerText = tocke;
  document.getElementById("lives").innerText = lives;
}

// ---------------- TIMER ----------------
function drawTimer() {
  if (!running) return;

  let elapsed = Math.floor((Date.now() - startTime) / 1000);
  let min = Math.floor(elapsed / 60);
  let sec = elapsed % 60;

  document.getElementById("cas").innerText =
    (min < 10 ? "0" : "") + min + ":" +
    (sec < 10 ? "0" : "") + sec;
}

// ---------------- DRAW ----------------
function drawBall() {
  let grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, r);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(1, "#00ccff");

  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ccff";

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowBlur = 0;
}

function drawPaddle() {
  let grad = ctx.createLinearGradient(paddlex, HEIGHT - paddleh, paddlex, HEIGHT);
  grad.addColorStop(0, "#66ccff");
  grad.addColorStop(0.5, "#0088cc");
  grad.addColorStop(1, "#004488");

  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00ccff";
  ctx.fillStyle = grad;

  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(paddlex, HEIGHT - paddleh, paddlew, paddleh, 8);
    ctx.fill();
  } else {
    ctx.fillRect(paddlex, HEIGHT - paddleh, paddlew, paddleh);
  }
  ctx.shadowBlur = 0;
}

function drawBricks() {
  for (let i = 0; i < NROWS; i++) {
    for (let j = 0; j < NCOLS; j++) {
      if (bricks[i][j]) {
        // Dodan zamik PADDING, da so kocke centrirane
        let bx = j * (BRICKWIDTH + PADDING) + PADDING;
        let by = i * (BRICKHEIGHT + PADDING) + PADDING + 20; // 20px spusta od stropa

        let grad = ctx.createLinearGradient(bx, by, bx, by + BRICKHEIGHT);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.9)"); 
        grad.addColorStop(0.3, "rgba(102, 204, 255, 0.8)");
        grad.addColorStop(1, "rgba(0, 102, 204, 0.9)");

        ctx.fillStyle = grad;
        
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(bx, by, BRICKWIDTH, BRICKHEIGHT, 5);
            ctx.fill();
        } else {
            ctx.fillRect(bx, by, BRICKWIDTH, BRICKHEIGHT);
        }

        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 2;
        if (ctx.roundRect) {
            ctx.stroke();
        } else {
            ctx.strokeRect(bx, by, BRICKWIDTH, BRICKHEIGHT);
        }
      }
    }
  }
}

function drawSnow() {
  snowflakes.forEach(f => {
    ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();

    f.y += f.d + 0.5;
    if (f.y > HEIGHT) {
      f.y = 0;
      f.x = Math.random() * WIDTH;
    }
  });
}

// ---------------- GAME LOOP ----------------
function gameLoop() {
  if (!running) return;
  
  if (isPaused) return;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  drawSnow();
  drawTimer();

  // Hitrejši premik za plošček zaradi večjega zaslona
  if (rightDown && paddlex + paddlew < WIDTH) paddlex += 8;
  if (leftDown && paddlex > 0) paddlex -= 8;

  if (!ballMoving) {
    x = paddlex + paddlew / 2;
    y = HEIGHT - paddleh - r - 2;
  }

  drawBricks(); 
  drawBall();
  drawPaddle();

  // collision bricks
  let row = Math.floor((y - 20) / (BRICKHEIGHT + PADDING)); // -20 zaradi spusta
  let col = Math.floor(x / (BRICKWIDTH + PADDING));

  if (ballMoving && row >= 0 && bricks[row] && bricks[row][col]) {
    bricks[row][col] = 0;
    dy = -dy;
    tocke++;
    updateUI();
  }

  // walls
  if (ballMoving && (x + dx > WIDTH - r || x + dx < r)) dx = -dx;
  if (ballMoving && y + dy < r) dy = -dy;

  // paddle / bottom
  if (ballMoving && y + dy > HEIGHT - r) {
    if (x > paddlex - r && x < paddlex + paddlew + r) { // Malo bolj prizanesljiv hitbox
      dx = 8 * ((x - (paddlex + paddlew / 2)) / paddlew);
      dy = -dy;
    } else {
      lives--;
      updateUI();

      if (lives <= 0) {
        running = false;
        showPopup("Game Over 💀", "Dosegel si " + tocke + " točk!");
        return;
      } else {
        resetBall();
      }
    }
  }

  // win
  if (tocke === NROWS * NCOLS) {
    running = false;
    showPopup("Zmaga 🎉", "Uničil si vse ledene kocke!");
    return;
  }

  if (ballMoving) {
    x += dx;
    y += dy;
  }

  requestAnimationFrame(gameLoop);
}

function showPopup(title, text) {
  document.getElementById("popup-title").innerText = title;
  document.getElementById("popup-text").innerText = text;
  document.getElementById("popup").classList.remove("hidden");
}

function closePopup() {
  document.getElementById("popup").classList.add("hidden");
  startGame(); 
}
function showNavodila() {
  document.getElementById("navodila-popup").classList.remove("hidden");
}

function closeNavodila() {
  document.getElementById("navodila-popup").classList.add("hidden");
}
// ---------------- VIZITKA ----------------
function showVizitka() {
  document.getElementById("vizitka-popup").classList.remove("hidden");
}

function closeVizitka() {
  document.getElementById("vizitka-popup").classList.add("hidden");
}