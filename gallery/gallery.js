const gallery = document.getElementById("gallery");
const modal = document.getElementById("illustration-modal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalNote = document.getElementById("modalNote");
const closeModal = document.getElementById("closeModal");
const burgerBtn = document.getElementById("burgerBtn");
const navMenu = document.getElementById("navMenu");

// ── CONTINUOUS MUSIC ─────────────────────────────
const MUSIC_STORAGE_KEY = "musicState";
const radioFiles = [
  "../assets/songs/song1.mp3",
  "../assets/songs/song2.mp3",
  "../assets/songs/song3.mp3",
];

const musicToggle = document.getElementById("musicToggle");
let galleryAudio = null;
let musicPlaying = false;

function saveMusicState() {
  if (!galleryAudio || !musicPlaying) {
    localStorage.removeItem(MUSIC_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    MUSIC_STORAGE_KEY,
    JSON.stringify({
      index: Number(galleryAudio.dataset.index),
      time: galleryAudio.currentTime || 0,
    }),
  );
}

function resumeMusic() {
  const saved = localStorage.getItem(MUSIC_STORAGE_KEY);
  if (!saved) return;

  try {
    const state = JSON.parse(saved);
    if (
      typeof state.index !== "number" ||
      state.index < 0 ||
      state.index >= radioFiles.length
    ) {
      return;
    }

    galleryAudio = new Audio(radioFiles[state.index]);
    galleryAudio.dataset.index = state.index;
    galleryAudio.loop = true;
    galleryAudio.currentTime = state.time || 0;
    galleryAudio
      .play()
      .then(() => {
        musicPlaying = true;
        musicToggle.textContent = "🔊";
      })
      .catch(() => {
        console.warn(
          "Audio playback blocked until user interacts with the page.",
        );
        musicPlaying = false;
        musicToggle.textContent = "🎵";
      });
  } catch (e) {
    console.warn("Could not resume music:", e);
  }
}

function toggleMusic() {
  if (!galleryAudio) {
    const saved = localStorage.getItem(MUSIC_STORAGE_KEY);
    if (!saved) return;
    const state = JSON.parse(saved);
    galleryAudio = new Audio(radioFiles[state.index]);
    galleryAudio.dataset.index = state.index;
    galleryAudio.loop = true;
    galleryAudio.currentTime = state.time || 0;
  }

  if (musicPlaying) {
    galleryAudio.pause();
    musicPlaying = false;
    musicToggle.textContent = "🎵";
  } else {
    galleryAudio
      .play()
      .then(() => {
        musicPlaying = true;
        musicToggle.textContent = "🔊";
      })
      .catch(() => {
        console.warn(
          "Audio playback blocked until user interacts with the page.",
        );
        musicPlaying = false;
      });
  }
}

if (musicToggle) {
  musicToggle.addEventListener("click", toggleMusic);
}

resumeMusic();

// Load illustrations from JSON
fetch("gallery.json")
  .then((response) => response.json())
  .then((illustrations) => {
    illustrations.forEach((item) => {
      const div = document.createElement("div");
      div.className = "gallery-item";
      div.dataset.title = item.title;
      div.dataset.note = item.note;

      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.title;

      const caption = document.createElement("p"); // NEW
      caption.textContent = item.title; // NEW

      div.appendChild(img); // capital C
      div.appendChild(caption);
      gallery.appendChild(div);

      // Click handler for modal
      div.addEventListener("click", () => {
        modalImage.src = item.src;
        modalTitle.textContent = item.title;
        modalNote.textContent = item.note;
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
      });
    });
  });

// Modal close
closeModal.addEventListener("click", () => {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
});

// Burger menu toggle
// burgerBtn.addEventListener("click", () => navMenu.classList.toggle("active"));

const goBack = document.getElementById("goBack");
goBack.addEventListener("click", () => {
  saveMusicState();
  window.location.href = "../index.html";
});
console.log(goBack);
