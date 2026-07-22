const gallery = document.getElementById("gallery");
const modal = document.getElementById("illustration-modal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalNote = document.getElementById("modalNote");
const closeModal = document.getElementById("closeModal");
const burgerBtn = document.getElementById("burgerBtn");
const navMenu = document.getElementById("navMenu");

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
burgerBtn.addEventListener("click", () => navMenu.classList.toggle("active"));
