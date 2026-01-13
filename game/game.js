const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const panel = document.getElementById("panel");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const quoteEl = document.getElementById("quote");

const W = canvas.width;
const H = canvas.height;

const groundY = H * 0.82;

const QUOTES = [
  "Se non trovi il senso, almeno scegli una direzione.",
  "Non devi vincere tutto: devi diventare più vero.",
  "La vita accelera. Tu prova a restare presente.",
  "Ogni salto è una decisione: paura o possibilità?",
  "Realizzarsi è restare fedeli a ciò che senti."
];

function randQuote(){
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

const state = {
  running: false,
  paused: false,
  t: 0,
  speed: 6,
  score: 0,
  best: Number(localStorage.getItem("leopard_best") || 0),

  // cat physics
  px: W * 0.18,
  py: groundY,
  vy: 0,
  onGround: true,

  // cat size (used for collisions)
  cw: 74,
  ch: 46
};

bestEl.textContent = state.best;

const obstacles = [];
const sparks = [];

function reset(){
  state.t = 0;
  state.speed = 6;
  state.score = 0;
  state.px = W * 0.18;
  state.py = groundY;
  state.vy = 0;
  state.onGround = true;
  obstacles.length = 0;
  sparks.length = 0;
  scoreEl.textContent = "0";
}

function start(){
  reset();
  state.running = true;
  state.paused = false;
  panel.style.display = "none";
  pauseBtn.textContent = "Pausa";
  quoteEl.textContent = "";
}

function end(){
  state.running = false;

  if (state.score > state.best){
    state.best = state.score;
    localStorage.setItem("leopard_best", String(state.best));
    bestEl.textContent = state.best;
  }

  quoteEl.textContent = randQuote();
  startBtn.textContent = "Riprova";
  panel.style.display = "block";
}

function togglePause(){
  if (!state.running) return;
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? "Riprendi" : "Pausa";
}

function jump(){
  if (!state.running || state.paused) return;
  if (state.onGround){
    state.vy = -14.8;
    state.onGround = false;
  }
}

function spawnObstacle(){
  const tall = Math.random() < 0.45;
  const h = tall ? 96 : 58;
  const w = tall ? 22 : 34;
  obstacles.push({
    x: W + 30,
    y: groundY - h,
    w, h,
    tag: tall ? "giudizio" : "abitudine",
    scored: false
  });
}

function spawnSpark(){
  sparks.push({
    x: W + 30,
    y: groundY - 120 - Math.random() * 120,
    r: 10,
    taken: false
  });
}

function rectRectCollide(ax, ay, aw, ah, bx, by, bw, bh){
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function update(){
  if (!state.running || state.paused) return;

  state.t += 1;
  state.speed = Math.min(14, 6 + state.t / 600);

  // gravity
  state.vy += 0.65;
  state.py += state.vy;

  if (state.py >= groundY){
    state.py = groundY;
    state.vy = 0;
    state.onGround = true;
  }

  // spawn cadence
  if (state.t % 85 === 0) spawnObstacle();
  if (state.t % 120 === 0 && Math.random() < 0.75) spawnSpark();

  // cat hitbox (a bit smaller than the drawing)
  const catX = state.px - state.cw * 0.48;
  const catY = (state.py - state.ch) + 6;
  const catW = state.cw * 0.9;
  const catH = state.ch * 0.78;

  // obstacles
  for (let i = obstacles.length - 1; i >= 0; i--){
    const o = obstacles[i];
    o.x -= state.speed;

    if (rectRectCollide(catX, catY, catW, catH, o.x, o.y, o.w, o.h)){
      return end();
    }

    if (!o.scored && o.x + o.w < catX){
      o.scored = true;
      state.score += 1;
      scoreEl.textContent = String(state.score);
    }

    if (o.x + o.w < -50) obstacles.splice(i, 1);
  }

  // sparks
  for (let i = sparks.length - 1; i >= 0; i--){
    const s = sparks[i];
    s.x -= state.speed;

    if (!s.taken){
      // circle vs cat rect
      const cx = s.x, cy = s.y, cr = s.r;
      const closestX = Math.max(catX, Math.min(cx, catX + catW));
      const closestY = Math.max(catY, Math.min(cy, catY + catH));
      const dx = cx - closestX;
      const dy = cy - closestY;
      if (dx*dx + dy*dy <= cr*cr){
        s.taken = true;
        state.score += 3;
        scoreEl.textContent = String(state.score);
      }
    }

    if (s.x < -50) sparks.splice(i, 1);
  }
}

function drawLeopardCat(x, y, w, h, t){
  // x,y = bottom-center anchor
  const bodyY = y - h;
  const bodyX = x - w/2;

  // body base
  ctx.save();

  // slight bob
  const bob = Math.sin(t/6) * 1.2;
  const bx = bodyX;
  const by = bodyY + bob;

  // tail
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(210,170,110,.95)";
  ctx.beginPath();
  ctx.moveTo(bx + w*0.15, by + h*0.65);
  ctx.quadraticCurveTo(bx - w*0.05, by + h*0.55, bx + w*0.08, by + h*0.35);
  ctx.stroke();

  // tail tip dark
  ctx.strokeStyle = "rgba(35,28,20,.95)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(bx + w*0.02, by + h*0.42);
  ctx.quadraticCurveTo(bx - w*0.02, by + h*0.40, bx + w*0.03, by + h*0.33);
  ctx.stroke();

  // body
  roundRect(bx + w*0.18, by + h*0.42, w*0.62, h*0.40, 14);
  ctx.fillStyle = "rgba(210,170,110,.98)"; // leopard base
  ctx.fill();

  // head
  roundRect(bx + w*0.62, by + h*0.30, w*0.26, h*0.26, 12);
  ctx.fillStyle = "rgba(220,180,120,.98)";
  ctx.fill();

  // ears
  ctx.fillStyle = "rgba(220,180,120,.98)";
  tri(bx + w*0.70, by + h*0.30, bx + w*0.74, by + h*0.22, bx + w*0.78, by + h*0.30);
  tri(bx + w*0.80, by + h*0.30, bx + w*0.84, by + h*0.22, bx + w*0.88, by + h*0.30);

  // inner ears
  ctx.fillStyle = "rgba(240,210,190,.75)";
  tri(bx + w*0.72, by + h*0.30, bx + w*0.74, by + h*0.25, bx + w*0.76, by + h*0.30);
  tri(bx + w*0.84, by + h*0.30, bx + w*0.86, by + h*0.25, bx + w*0.88, by + h*0.30);

  // legs (running)
  const step = Math.sin(t/5);
  ctx.strokeStyle = "rgba(190,150,95,.98)";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  // back leg
  ctx.beginPath();
  ctx.moveTo(bx + w*0.34, by + h*0.78);
  ctx.lineTo(bx + w*(0.30 + step*0.05), by + h*0.92);
  ctx.stroke();
  // front leg
  ctx.beginPath();
  ctx.moveTo(bx + w*0.62, by + h*0.78);
  ctx.lineTo(bx + w*(0.66 - step*0.05), by + h*0.92);
  ctx.stroke();

  // spots (leopard)
  ctx.fillStyle = "rgba(35,28,20,.55)";
  const spots = [
    [0.32,0.48,7],[0.40,0.54,6],[0.48,0.49,7],[0.56,0.56,6],
    [0.60,0.46,5],[0.44,0.60,6],[0.53,0.44,5],[0.36,0.58,5]
  ];
  for (const [sx, sy, r] of spots){
    ctx.beginPath();
    ctx.arc(bx + w*sx, by + h*sy, r, 0, Math.PI*2);
    ctx.fill();
  }
  // a couple on head
  ctx.beginPath(); ctx.arc(bx + w*0.74, by + h*0.38, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + w*0.83, by + h*0.40, 3.5, 0, Math.PI*2); ctx.fill();

  // face: eyes + nose
  ctx.fillStyle = "rgba(20,20,22,.95)";
  ctx.beginPath(); ctx.arc(bx + w*0.76, by + h*0.40, 3.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(bx + w*0.85, by + h*0.40, 3.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath();
  ctx.arc(bx + w*0.81, by + h*0.46, 3.2, 0, Math.PI*2);
  ctx.fillStyle = "rgba(60,35,30,.95)";
  ctx.fill();

  // tiny aura (idea)
  ctx.beginPath();
  ctx.arc(x + w*0.18, by + h*0.40, 10 + Math.sin(t/7)*1.2, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(110,231,255,.25)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.restore();
}

function roundRect(x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}
function tri(x1,y1,x2,y2,x3,y3){
  ctx.beginPath();
  ctx.moveTo(x1,y1);
  ctx.lineTo(x2,y2);
  ctx.lineTo(x3,y3);
  ctx.closePath();
  ctx.fill();
}

function draw(){
  ctx.clearRect(0,0,W,H);

  // subtle lines
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  for (let y = 60; y < H; y += 70){
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // ground
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.fillRect(0, groundY+18, W, 2);
  ctx.globalAlpha = 1;

  // sparks
  for (const s of sparks){
    if (s.taken) continue;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fillStyle = "rgba(110,231,255,.95)";
    ctx.fill();
  }

  // obstacles
  for (const o of obstacles){
    ctx.fillStyle = o.tag === "abitudine" ? "rgba(255,255,255,.65)" : "rgba(167,139,250,.75)";
    ctx.fillRect(o.x, o.y, o.w, o.h);
  }

  // cat
  drawLeopardCat(state.px, state.py, state.cw, state.ch, state.t);

  // pause overlay
  if (state.paused){
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "rgba(233,236,241,.95)";
    ctx.font = "700 34px system-ui";
    ctx.fillText("Pausa", W/2 - 55, H/2);
    ctx.font = "500 16px system-ui";
    ctx.fillStyle = "rgba(233,236,241,.75)";
    ctx.fillText("Premi P o il bottone per riprendere", W/2 - 150, H/2 + 30);
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", togglePause);

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === " " || k === "spacebar") { e.preventDefault(); jump(); }
  if (k === "p") togglePause();
  if (k === "r" && !state.running) start();
});

canvas.addEventListener("pointerdown", () => jump(), { passive: true });

// initial text
quoteEl.textContent = "Corri. Schiva. Raccogli scintille. E resta vero.";
bestEl.textContent = state.best;
loop();
