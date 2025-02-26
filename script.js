window.addEventListener("resize", () => {
  window.resizeTo(window.innerWidth, 800);
});

document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("audio");
  const audioBtn = document.getElementById("audio_btn");
  const icon = audioBtn.querySelector("i");
  const start = document.querySelector(".start");
  const stage = document.querySelector(".stage");
  const easy = document.getElementById("easy");
  const content = document.querySelector(".content");

  audioBtn.addEventListener("click", () => {
    if (audio.paused) {
      icon.classList.remove("fa-volume-xmark");
      icon.classList.add("fa-volume-high");
      audio.play();
    } else {
      icon.classList.remove("fa-volume-high");
      icon.classList.add("fa-volume-xmark");
      audio.pause();
    }
  });

  start.addEventListener("click", () => {
    start.style.display = "none";
    stage.style.display = "flex";
  });

  easy.addEventListener("click", () => {
    stage.style.display = "none";
    content.style.display = "block";
  });
});

const map = document.querySelector('.map');
const leftSection = document.querySelector('.left');
const rightSection = document.querySelector('.right');
const centerSection = document.querySelector('.center');

let isMouseInLeft = false;
let isMouseInRight = false;

leftSection.addEventListener('mouseenter', () => {
  isMouseInLeft = true;
  scrollContent();
});

rightSection.addEventListener('mouseenter', () => {
  isMouseInRight = true;
  scrollContent();
});

map.addEventListener('mouseleave', () => {
  isMouseInLeft = false;
  isMouseInRight = false;
});
map.addEventListener('mouseenter', () => {
  isMouseInRight = false;
  isMouseInLeft = false;
})

function scrollContent() {
  if (isMouseInLeft) {
    map.scrollLeft = map.scrollLeft - 10;
  }

  if (isMouseInRight) {
    map.scrollLeft = map.scrollLeft + 10;
  }
}

setInterval(() => {
  scrollContent();
}, 6);