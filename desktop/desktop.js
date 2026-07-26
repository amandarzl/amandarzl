/* ============ Clock ============ */
function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  document.getElementById("clock").textContent = `${hours}:${minutes} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000 * 30);

/* ============ Window management ============ */
let topZ = 100;

function updateDockForWindow(win) {
  const windowId = win.id;
  const dockItem = document.querySelector(
    `.dock-item[data-window="${windowId}"]`,
  );
  const divider = document.querySelector(".dock-divider");

  if (!dockItem) return;

  const isDocked =
    win.classList.contains("is-open") || win.classList.contains("is-minimized");
  dockItem.style.display = isDocked ? "flex" : "none";

  if (divider) {
    const anyDockedWindow =
      document.querySelectorAll(".window.is-open, .window.is-minimized")
        .length > 0;
    divider.style.display = anyDockedWindow ? "block" : "none";
  }
}

function bringDockItemToFront(win) {
  const dock = document.querySelector(".dock");
  const dockItem = document.querySelector(
    `.dock-item[data-window="${win.id}"]`,
  );
  const divider = document.querySelector(".dock-divider");

  if (dockItem && dock && divider) {
    // Move the dock item just before the divider
    dock.insertBefore(dockItem, divider);
  }
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  const wasClosed =
    !win.classList.contains("is-open") &&
    !win.classList.contains("is-minimized");

  if (win.classList.contains("is-minimized")) {
    win.classList.remove("is-minimized");
    win.classList.add("is-open");
    win.style.display = "flex";

    // Restore fullscreen if it was maximized before minimizing
    if (win.dataset.wasMaximized === "true") {
      delete win.dataset.wasMaximized;
      maximizeWindow(win);
    }
  } else if (wasClosed) {
    win.classList.add("is-open");
    win.style.display = "flex";
    win.style.top = (win.dataset.defaultTop || "50") + "px";
    win.style.left = (win.dataset.defaultLeft || "50") + "px";
    win.style.width = win.dataset.defaultW + "px";
    win.style.height = win.dataset.defaultH + "px";

    // Only reorder dock when opening from closed
    bringDockItemToFront(win);
  }

  // Always bring to front visually
  win.style.zIndex = ++topZ;
  updateDockForWindow(win);
}

function closeWindow(win) {
  win.classList.remove("is-open", "is-minimized", "is-maximized");
  win.style.display = "none";
  updateDockForWindow(win);
}

function minimizeWindow(win) {
  // Track if window was maximized so we can restore fullscreen on reopen
  if (win.classList.contains("is-maximized")) {
    win.dataset.wasMaximized = "true";
    win.classList.remove("is-maximized");
  } else {
    delete win.dataset.wasMaximized;
  }

  win.classList.remove("is-open");
  win.classList.add("is-minimized");
  win.style.display = "none";
  updateDockForWindow(win);
}

function focusWindow(win) {
  win.style.zIndex = ++topZ;
}

/* NEW maximize/restore functions */
function maximizeWindow(win) {
  win.dataset.wasManuallyMaximized = "true";

  // Save the HTML defaults if not already saved (so drag-from-fullscreen
  // can unmark maximized class but still allow button to restore defaults)
  win.classList.add("is-maximized");
  win.style.top = "0";
  win.style.left = "0";
  win.style.width = "100%";
  win.style.height = "100%";
  win.style.borderRadius = "0";
}

function restoreWindow(win) {
  win.classList.remove("is-maximized");
  delete win.dataset.wasManuallyMaximized;

  // Always restore to the HTML-defined defaults (data-default-* attributes)
  // so the maximize button always brings the window back to its original size
  win.style.top = (win.dataset.defaultTop || "50") + "px";
  win.style.left = (win.dataset.defaultLeft || "50") + "px";
  win.style.width = win.dataset.defaultW + "px";
  win.style.height = win.dataset.defaultH + "px";

  win.style.borderRadius = "";
}

// Open from desktop folders
document.querySelectorAll(".folder").forEach((folder) => {
  folder.addEventListener("click", () => {
    openWindow(folder.dataset.window);
  });
});

// Open from dock
document.querySelectorAll(".dock-item[data-window]").forEach((item) => {
  item.addEventListener("click", () => {
    openWindow(item.dataset.window);
  });
});

// Hide dock items for windows that are closed by default
document.querySelectorAll(".window").forEach((win) => {
  updateDockForWindow(win);
});

// Traffic light buttons
document.querySelectorAll(".window").forEach((win) => {
  win.addEventListener("mousedown", () => focusWindow(win));

  win.querySelector('[data-action="close"]').addEventListener("click", (e) => {
    e.stopPropagation();
    if (win.classList.contains("is-maximized")) {
      restoreWindow(win);
    }
    closeWindow(win);
  });

  win.querySelector('[data-action="min"]').addEventListener("click", (e) => {
    e.stopPropagation();
    minimizeWindow(win);
  });

  win.querySelector('[data-action="max"]').addEventListener("click", (e) => {
    e.stopPropagation();
    if (win.classList.contains("is-maximized")) {
      restoreWindow(win);
    } else if (win.dataset.wasManuallyMaximized === "true") {
      // Window was dragged out of fullscreen — clicking maximize again
      // should restore to defaults, not go fullscreen again
      restoreWindow(win);
    } else {
      maximizeWindow(win);
    }
  });
});

/* ============ Dragging ============ */
document.querySelectorAll(".window-header").forEach((header) => {
  const win = header.closest(".window");
  const stage = win.parentElement;
  let offsetX = 0,
    offsetY = 0,
    dragging = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  header.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".window-control")) return;

    if (win.classList.contains("is-maximized")) {
      // Keep fullscreen size but remove the is-maximized class
      // so CSS !important rules don't block dragging.
      // Do NOT overwrite dataset.prev* — those store the pre-maximize
      // dimensions so the maximize button can restore to defaults.
      const stageRect = stage.getBoundingClientRect();
      win.classList.remove("is-maximized");
      win.style.top = "0";
      win.style.left = "0";
      win.style.width = stageRect.width + "px";
      win.style.height = stageRect.height + "px";
      win.style.borderRadius = "0";

      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    } else {
      const rect = win.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    }

    dragging = true;
    focusWindow(win);
    e.preventDefault();
  });

  document.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    const stageRect = stage.getBoundingClientRect();
    const winRect = win.getBoundingClientRect();
    const nextLeft = e.clientX - stageRect.left - offsetX;
    const nextTop = e.clientY - stageRect.top - offsetY;
    const minLeft = -winRect.width;
    const maxLeft = stageRect.width;
    const minTop = -winRect.height;
    const maxTop = stageRect.height;

    win.style.left = `${clamp(nextLeft, minLeft, maxLeft)}px`;
    win.style.top = `${clamp(nextTop, minTop, maxTop)}px`;
  });

  document.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
  });
});

/* ============ Logout modal ============ */
const logoutOverlay = document.getElementById("logoutOverlay");
const logoutBtn = document.getElementById("logoutBtn");
const dockLogout = document.getElementById("dockLogout");
const logoutYes = document.getElementById("logoutYes");
const logoutNo = document.getElementById("logoutNo");

if (logoutOverlay && logoutYes && logoutNo) {
  function openLogoutModal() {
    logoutOverlay.classList.add("is-open");
  }
  function closeLogoutModal() {
    logoutOverlay.classList.remove("is-open");
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", openLogoutModal);
  }

  if (dockLogout) {
    dockLogout.addEventListener("click", openLogoutModal);
  }

  logoutNo.addEventListener("click", closeLogoutModal);
  logoutOverlay.addEventListener("click", (e) => {
    if (e.target === logoutOverlay) closeLogoutModal();
  });

  logoutYes.addEventListener("click", () => {
    const homeUrl = new URL("../index.html", window.location.href);
    window.location.assign(homeUrl);
  });
}
