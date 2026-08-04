// ── CANVAS SETUP ─────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

// ── ASSETS ─────────────────────────────────
const bg = new Image();
bg.src = "assets/bedroom.png";
const sprite = new Image();
sprite.src = "assets/character.png";

// ── PRE-RENDERED BACKGROUND ──────────────────────
const bgCanvas = document.createElement("canvas");
bgCanvas.width = 640;
bgCanvas.height = 480;
const bgCtx = bgCanvas.getContext("2d");

// ── SPRITE FRAME SETUP ───────────────────────────
const SPRITE_W = 320;
const SPRITE_H = 320;
const spriteFrames = [];

// ── PLAYER STATE ─────────────────────────────────
let player = {
  x: 150,
  y: 220,
  width: 2,
  height: 2,
  speed: 120,
  target: null,
};

let lastTime = 0;

// ── INPUT & ANIMATION STATE ──────────────────────
let keys = {};
let frameX = 0;
let frameY = 0;
let frameCount = 0;

// ── RADIO / MUSIC SYSTEM ─────────────────────────
const radioFiles = [
  "assets/songs/song1.mp3",
  "assets/songs/song2.mp3",
  "assets/songs/song3.mp3",
];

const MUSIC_STORAGE_KEY = "musicState";
let radioIndex = -1;
const radioAudio = new Audio();
radioAudio.loop = true;

function saveMusicState() {
  if (radioIndex === -1) {
    localStorage.removeItem(MUSIC_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    MUSIC_STORAGE_KEY,
    JSON.stringify({
      index: radioIndex,
      time: radioAudio.currentTime || 0,
    }),
  );
}

function restoreMusicState() {
  const saved = localStorage.getItem(MUSIC_STORAGE_KEY);
  if (!saved) return false;

  try {
    const state = JSON.parse(saved);
    if (
      typeof state.index !== "number" ||
      state.index < 0 ||
      state.index >= radioFiles.length
    ) {
      return false;
    }
    radioIndex = state.index;
    radioAudio.src = radioFiles[radioIndex];
    radioAudio.currentTime = state.time || 0;
    showMusicNotes();
    return true;
  } catch (e) {
    console.warn("Could not restore music state:", e);
    return false;
  }
}

function startRadioTrack() {
  radioAudio.pause();
  radioAudio.src = radioFiles[radioIndex];
  radioAudio.currentTime = 0;
  radioAudio.play().catch(() => {
    console.warn("Audio playback blocked until user interacts with the page.");
  });
  saveMusicState();
}

function stopRadio() {
  radioAudio.pause();
  radioAudio.currentTime = 0;
  hideMusicNotes();
  saveMusicState();
}

// ── MUSIC NOTES INDICATOR ────────────────────────
const musicNotesEl = document.getElementById("music-notes");

function showMusicNotes() {
  if (musicNotesEl) {
    musicNotesEl.style.display = "block";
    musicNotesEl.setAttribute("aria-hidden", "false");
  }
}

function hideMusicNotes() {
  if (musicNotesEl) {
    musicNotesEl.style.display = "none";
    musicNotesEl.setAttribute("aria-hidden", "true");
  }
}

function playMusic() {
  if (radioIndex === -1) {
    radioIndex = 0;
    startRadioTrack();
    showMusicNotes();
    return;
  }

  if (radioIndex < radioFiles.length - 1) {
    radioIndex += 1;
    startRadioTrack();
    showMusicNotes();
    return;
  }

  radioIndex = -1;
  stopRadio();
  hideMusicNotes();
}

// ── CONTACT MODAL ────────────────────────────────
const contactModal = document.getElementById("contact-modal");
const closeContactModalBtn = document.getElementById("close-contact-modal");

function openContacts() {
  if (contactModal) {
    contactModal.classList.add("active");
    contactModal.setAttribute("aria-hidden", "false");
    player.target = null;
    keys = {};
  }
}

function closeContactModal() {
  if (contactModal) {
    contactModal.classList.remove("active");
    contactModal.setAttribute("aria-hidden", "true");
  }
}

if (closeContactModalBtn) {
  closeContactModalBtn.addEventListener("click", closeContactModal);
}

if (contactModal) {
  contactModal.addEventListener("click", (event) => {
    if (event.target === contactModal) {
      closeContactModal();
    }
  });
}

// ── PAGE NAVIGATION ──────────────────────────────
function openGallery() {
  saveMusicState();
  window.location.href = "gallery/gallery.html";
}

function openDesktop() {
  saveMusicState();
  window.location.href = "desktop/loginpage/login.html";
}

// ── SLEEP OVERLAY ────────────────────────────────
const sleepOverlay = document.getElementById("sleep-overlay");
let sleeping = false;

function wakeFromSleep() {
  if (!sleeping) return;
  sleeping = false;
  sleepOverlay.classList.remove("active");
  sleepOverlay.setAttribute("aria-hidden", "true");
  player.target = null;
  keys = {};
}

function restHere() {
  if (!sleepOverlay) {
    window.location.href = "bed/bed.html";
    return;
  }

  radioIndex = -1;
  stopRadio();
  hideMusicNotes();
  sleeping = true;
  sleepOverlay.classList.add("active");
  sleepOverlay.setAttribute("aria-hidden", "false");
  player.target = null;
  keys = {};

  sleepOverlay.addEventListener("mousemove", wakeFromSleep, { once: true });
}

// ── INTERACTIVE STATIONS ─────────────────────────
const stations = [
  {
    name: "contact",
    x: 120,
    y: 100,
    width: 60,
    height: 30,
    action: openContacts,
  },
  { name: "bed", x: 45, y: 210, width: 60, height: 80, action: restHere },
  {
    name: "gallery",
    x: 450,
    y: 260,
    width: 100,
    height: 30,
    action: openGallery,
  },
  {
    name: "desktop",
    x: 480,
    y: 90,
    width: 40,
    height: 50,
    action: openDesktop,
  },
  { name: "radio", x: 370, y: 110, width: 40, height: 20, action: playMusic },
];

// Return the station that contains the given point, if any
function stationAtPoint(x, y) {
  return stations.find(
    (st) => x > st.x && x < st.x + st.width && y > st.y && y < st.y + st.height,
  );
}

// ── WALLS (COLLISION BOUNDARIES) ─────────────────
const walls = [
  { x: 0, y: 0, width: 610, height: 110 },
  { x: 0, y: 400, width: 640, height: 10 },
  { x: 0, y: 0, width: 10, height: 480 },
  { x: 630, y: 0, width: 10, height: 480 },
  { x: 590, y: 350, width: 10, height: 30 },
  // { x: 480, y: 160, width: 5,  height: 10  },
];

// ── NEAR STATION ─────────────────────────────────
function nearStation() {
  const pw = player.width * 36;
  const ph = player.height * 36;
  const cx = player.x + pw / 2;
  const cy = player.y + ph / 2;
  const DIST = 40;

  return stations.find(
    (st) =>
      cx > st.x - DIST &&
      cx < st.x + st.width + DIST &&
      cy > st.y - DIST &&
      cy < st.y + st.height + DIST,
  );
}

// ── SHOW / HIDE HINT ─────────────────────────────
const hintEl = document.getElementById("hint-bubble");
const hintText = document.getElementById("hintText");
const yesBtn = document.getElementById("stationYes");
const noBtn = document.getElementById("stationNo");
let dismissedStation = null;
let lastNearStation = null;

function updateHint(near) {
  const modalOpen = contactModal && contactModal.classList.contains("active");
  const sleepOpen = sleepOverlay && sleepOverlay.classList.contains("active");
  if (modalOpen || sleepOpen) {
    lastNearStation = null;
    if (hintEl.style.display !== "none") hintEl.style.display = "none";
    return;
  }

  if (near === lastNearStation) return;
  lastNearStation = near;

  if (near && near !== dismissedStation) {
    if (near.name === "radio") {
      hintEl.style.display = "none";
      return;
    }

    hintEl.style.display = "block";

    const action = near.action || null;

    switch (near.name) {
      case "contact":
        hintText.textContent = `Do you want to open your contacts?`;
        break;

      case "bed":
        hintText.textContent = `Do you want to rest here?`;
        break;

      case "gallery":
        hintText.textContent = `Do you want to view the gallery?`;
        break;

      case "desktop":
        hintText.textContent = `Do you want to use the desktop?`;
        break;
    }

    // Wire buttons
    yesBtn.onclick = () => {
      if (action) action();
      dismissedStation = null;
      player.target = null;
      hintEl.style.display = "none";
    };
    noBtn.onclick = () => {
      dismissedStation = near;
      player.target = null;
      hintEl.style.display = "none";
    };

    const rect = canvas.getBoundingClientRect();
    hintEl.style.left = rect.width / 2 + "px";
    hintEl.style.top = rect.height - 36 + "px";
  } else if (!near) {
    dismissedStation = null;
    hintEl.style.display = "none";
  } else {
    hintEl.style.display = "none";
  }
}

// ── COLLISION ────────────────────────────────────
function canMove(newX, newY) {
  const pw = player.width * 36;
  const ph = player.height * 36;

  for (let w of walls) {
    if (
      newX + pw > w.x &&
      newX < w.x + w.width &&
      newY + ph > w.y &&
      newY < w.y + w.height
    ) {
      return false;
    }
  }
  for (let st of stations) {
    if (
      newX + pw > st.x &&
      newX < st.x + st.width &&
      newY + ph > st.y &&
      newY < st.y + st.height
    ) {
      return false;
    }
  }
  return true;
}

// ── INPUT ────────────────────────────────────────
window.addEventListener("keydown", (e) => {
  const modalOpen = contactModal && contactModal.classList.contains("active");
  const sleepOpen = sleepOverlay && sleepOverlay.classList.contains("active");

  if (modalOpen || sleepOpen) {
    e.preventDefault();
    return;
  }

  keys[e.key] = true;

  if (e.key === "e" || e.key === "E" || e.key === "Enter") {
    const near = nearStation();
    if (near && near.action) {
      near.action();
      // stop auto-walk when interacting
      player.target = null;
      frameX = 0;
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (contactModal && contactModal.classList.contains("active")) return;
  if (sleepOverlay && sleepOverlay.classList.contains("active")) return;
  keys[e.key] = false;
});

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  const station = stationAtPoint(mouseX, mouseY);
  if (!station) return;

  if (station.name === "radio") {
    if (station.action) station.action();
    return;
  }

  player.target = {
    x: station.x + station.width / 2,
    y: station.y + station.height / 2,
  };
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  const station = stationAtPoint(mouseX, mouseY);
  canvas.style.cursor = station ? "pointer" : "default";
});

// ── DRAW PLAYER ──────────────────────────────────
function drawPlayer() {
  if (keys["ArrowUp"]) frameY = 3;
  else if (keys["ArrowDown"]) frameY = 0;
  else if (keys["ArrowLeft"]) frameY = 2;
  else if (keys["ArrowRight"]) frameY = 1;

  if (
    keys["ArrowUp"] ||
    keys["ArrowDown"] ||
    keys["ArrowLeft"] ||
    keys["ArrowRight"] ||
    player.target
  ) {
    frameCount++;
    if (frameCount % 10 === 0) frameX = (frameX + 1) % 4;
  } else {
    frameX = 0;
  }

  const spriteFrame = spriteFrames[frameY] && spriteFrames[frameY][frameX];
  if (spriteFrame) {
    ctx.drawImage(spriteFrame, player.x, player.y);
  }
}

// ── GAME LOOP ────────────────────────────────────
function gameLoop(timestamp) {
  if (lastTime === 0) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  const sleepActive = sleepOverlay && sleepOverlay.classList.contains("active");

  if (!sleepActive) {
    ctx.drawImage(bgCanvas, 0, 0);

    // Arrow-key movement with collision checks
    if (keys["ArrowUp"] && canMove(player.x, player.y - player.speed * dt))
      player.y -= player.speed * dt;
    if (keys["ArrowDown"] && canMove(player.x, player.y + player.speed * dt))
      player.y += player.speed * dt;
    if (keys["ArrowLeft"] && canMove(player.x - player.speed * dt, player.y))
      player.x -= player.speed * dt;
    if (keys["ArrowRight"] && canMove(player.x + player.speed * dt, player.y))
      player.x += player.speed * dt;

    // Auto-walk toward the clicked station target
    if (player.target) {
      let dx = player.target.x - player.x;
      let dy = player.target.y - player.y;

      if (Math.abs(dx) > 1) {
        let newX = player.x + Math.sign(dx) * player.speed * dt;
        if (canMove(newX, player.y)) {
          player.x = newX;
          frameY = dx > 0 ? 1 : 2;
        } else if (Math.abs(dy) > 1) {
          let newY = player.y + Math.sign(dy) * player.speed * dt;
          if (canMove(player.x, newY)) {
            player.y = newY;
            frameY = dy > 0 ? 0 : 3;
          }
        }
      } else if (Math.abs(dy) > 1) {
        let newY = player.y + Math.sign(dy) * player.speed * dt;
        if (canMove(player.x, newY)) {
          player.y = newY;
          frameY = dy > 0 ? 0 : 3;
        } else if (Math.abs(dx) > 1) {
          let newX = player.x + Math.sign(dx) * player.speed * dt;
          if (canMove(newX, player.y)) {
            player.x = newX;
            frameY = dx > 0 ? 1 : 2;
          }
        }
      } else {
        player.target = null;
        frameX = 0;
      }
    }

    drawPlayer();
  }

  const near = nearStation();
  updateHint(near);

  requestAnimationFrame(gameLoop);
}

// ── GAME START ───────────────────────────────────
function tryStartGame() {
  if (!bgLoaded || !spriteLoaded) return;

  // Resume music from a previous page if it was playing
  if (restoreMusicState()) {
    radioAudio.play().catch(() => {
      console.warn(
        "Audio playback blocked until user interacts with the page.",
      );
    });
  }
  requestAnimationFrame(gameLoop);
}

// ── ASSET LOADING ────────────────────────────────
let bgLoaded = false;
bg.onload = () => {
  bgCtx.drawImage(bg, 0, 0, bgCanvas.width, bgCanvas.height);
  bgLoaded = true;
  tryStartGame();
};

let spriteLoaded = false;
sprite.onload = () => {
  const pw = player.width * 36;
  const ph = player.height * 36;
  for (let row = 0; row < 4; row++) {
    spriteFrames[row] = [];
    for (let col = 0; col < 4; col++) {
      const c = document.createElement("canvas");
      c.width = pw;
      c.height = ph;
      const cctx = c.getContext("2d");
      cctx.drawImage(
        sprite,
        col * SPRITE_W,
        row * SPRITE_H,
        SPRITE_W,
        SPRITE_H,
        0,
        0,
        pw,
        ph,
      );
      spriteFrames[row][col] = c;
    }
  }
  spriteLoaded = true;
  tryStartGame();
};

// // Walls = red
// ctx.strokeStyle = "rgba(255, 0, 0, 0.6)";
// ctx.lineWidth = 2;
// walls.forEach(w => {
//   ctx.strokeRect(w.x, w.y, w.width, w.height);
// });

// // Stations = green
// ctx.strokeStyle = "rgba(0, 255, 0, 0.6)";
// stations.forEach(st => {
//   ctx.strokeRect(st.x, st.y, st.width, st.height);
// });
