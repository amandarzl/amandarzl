const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

const bg = new Image();
bg.src = "assets/bedroom.png";

const sprite = new Image();
sprite.src = "assets/character.png";

let player = {
  x: 150,
  y: 220,
  width: 2,
  height: 2,
  speed: 2,
  target: null,
};

let keys = {};
let frameX = 0;
let frameY = 0;
let frameCount = 0;

const radioFiles = [
  "assets/songs/song1.mp3",
  "assets/songs/song2.mp3",
  "assets/songs/song3.mp3",
];

let radioIndex = -1;
const radioAudio = new Audio();
radioAudio.loop = true;

function startRadioTrack() {
  radioAudio.pause();
  radioAudio.src = radioFiles[radioIndex];
  radioAudio.currentTime = 0;
  radioAudio.play().catch(() => {
    console.warn("Audio playback blocked until user interacts with the page.");
  });
}

function stopRadio() {
  radioAudio.pause();
  radioAudio.currentTime = 0;
  hideMusicNotes();
}

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

  stopRadio();
  radioIndex = -1;
  hideMusicNotes();
}

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

function openGallery() {
  window.location.href = "gallery/gallery.html";
}

function openDesktop() {
  window.location.href = "desktop/loginpage/login.html";
}

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

  stopRadio();
  hideMusicNotes();
  radioIndex = -1;
  sleeping = true;
  sleepOverlay.classList.add("active");
  sleepOverlay.setAttribute("aria-hidden", "false");
  player.target = null;
  keys = {};

  sleepOverlay.addEventListener("mousemove", wakeFromSleep, { once: true });
}

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

function stationAtPoint(x, y) {
  return stations.find(
    (st) => x > st.x && x < st.x + st.width && y > st.y && y < st.y + st.height,
  );
}

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

function updateHint(near) {
  const modalOpen = contactModal && contactModal.classList.contains("active");
  const sleepOpen = sleepOverlay && sleepOverlay.classList.contains("active");
  if (modalOpen || sleepOpen) {
    hintEl.style.display = "none";
    return;
  }

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

    // Position popup relative to canvas
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
      frameX = 0; // reset to idle frame
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
    frameX = 0; // idle frame when not moving
  }

  ctx.drawImage(
    sprite,
    frameX * 320,
    frameY * 320,
    320,
    320,
    player.x,
    player.y,
    player.width * 36,
    player.height * 36,
  );
}

// ── GAME LOOP ────────────────────────────────────
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  if (keys["ArrowUp"] && canMove(player.x, player.y - player.speed))
    player.y -= player.speed;
  if (keys["ArrowDown"] && canMove(player.x, player.y + player.speed))
    player.y += player.speed;
  if (keys["ArrowLeft"] && canMove(player.x - player.speed, player.y))
    player.x -= player.speed;
  if (keys["ArrowRight"] && canMove(player.x + player.speed, player.y))
    player.x += player.speed;

  // Axis-aligned auto-walk with obstacle handling
  if (player.target) {
    let dx = player.target.x - player.x;
    let dy = player.target.y - player.y;

    if (Math.abs(dx) > 1) {
      let newX = player.x + Math.sign(dx) * player.speed;
      if (canMove(newX, player.y)) {
        player.x = newX;
        frameY = dx > 0 ? 1 : 2; // right or left
      } else if (Math.abs(dy) > 1) {
        let newY = player.y + Math.sign(dy) * player.speed;
        if (canMove(player.x, newY)) {
          player.y = newY;
          frameY = dy > 0 ? 0 : 3; // down or up
        }
      }
    } else if (Math.abs(dy) > 1) {
      let newY = player.y + Math.sign(dy) * player.speed;
      if (canMove(player.x, newY)) {
        player.y = newY;
        frameY = dy > 0 ? 0 : 3;
      } else if (Math.abs(dx) > 1) {
        let newX = player.x + Math.sign(dx) * player.speed;
        if (canMove(newX, player.y)) {
          player.x = newX;
          frameY = dx > 0 ? 1 : 2;
        }
      }
    } else {
      player.target = null;
      frameX = 0; // reset to idle frame
    }
  }

  drawPlayer();

  const near = nearStation();
  updateHint(near);

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

  requestAnimationFrame(gameLoop);
}

bg.onload = () => gameLoop();
