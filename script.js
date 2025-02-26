document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소
  const audio = document.getElementById("audio");
  const audioBtn = document.getElementById("audio_btn");
  const icon = audioBtn.querySelector("i");
  const start = document.querySelector(".start");
  const stage = document.querySelector(".stage");
  const easy = document.getElementById("easy");
  const map = document.querySelector(".map");
  const content = document.querySelector(".content");
  const unitCreateBtn = document.getElementById("unitCreate");
  const unitSelectionContainer = document.getElementById("unitSelectionContainer");
  const leftSection = document.querySelector(".map-section.left");
  const rightSection = document.querySelector(".map-section.right");

  // 상태 변수
  let isMouseInLeft = false;
  let isMouseInRight = false;
  const friendlyUnits = [];
  const enemyUnits = [];
  const MAX_FRIENDLY_UNITS = 5; // 최대 유닛 수 제한

  // 오디오 버튼 이벤트
  if (audioBtn && audio && icon) {
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
  }

  // 시작 화면 이벤트
  if (start && stage) {
    start.addEventListener("click", () => {
      start.style.display = "none";
      stage.style.display = "flex";
    });
  }

  if (easy && content && map) {
    easy.addEventListener("click", () => {
      stage.style.display = "none";
      content.style.display = "block";
      map.style.display = "block";
      unitCreateBtn.style.display = "block";
    });
  }

  // 맵 스크롤 이벤트
  if (leftSection && rightSection && map) {
    leftSection.addEventListener("mouseenter", () => {
      isMouseInLeft = true;
      scrollContent();
    });
    rightSection.addEventListener("mouseenter", () => {
      isMouseInRight = true;
      scrollContent();
    });
    map.addEventListener("mouseleave", () => {
      isMouseInLeft = false;
      isMouseInRight = false;
    });
    map.addEventListener("mouseenter", () => {
      isMouseInRight = false;
      isMouseInLeft = false;
    });

    function scrollContent() {
      if (isMouseInLeft) map.scrollLeft -= 10;
      if (isMouseInRight) map.scrollLeft += 10;
    }
    setInterval(scrollContent, 6);
  }

  // 유닛 클래스 정의
  class Unit {
    constructor({ x, y, isEnemy = false, health, attPower, range }) {
      this.element = document.createElement("div");
      this.element.style.position = "absolute";
      this.element.style.width = "200px";
      this.element.style.height = "200px";
      this.element.style.backgroundImage = isEnemy
          ? "url('img/enemy-unit.png')"
          : "url('img/friendly-unit.png')";
      this.element.style.backgroundSize = "cover";
      this.element.style.left = `${x}px`;
      this.element.style.top = `${y}px`;
      content.appendChild(this.element);

      this.x = x;
      this.y = y;
      this.speed = isEnemy ? -2 : 2;
      this.health = health;
      this.attackPower = attPower;
      this.range = range || 50; // 기본 사거리 50
      this.isEnemy = isEnemy;
      this.isFighting = false;
    }

    update() {
      if (!this.isFighting) {
        this.x += this.speed;
        this.element.style.left = `${this.x}px`;
      }
      if (this.x < -50 || this.x > 4050) {
        this.remove();
      }
    }

    attack(target) {
      this.isFighting = true;
      target.health -= this.attackPower;
      if (target.health <= 0) {
        target.remove();
        this.isFighting = false;
      }
    }

    remove() {
      if (this.element.parentNode) {
        content.removeChild(this.element);
      }
      const array = this.isEnemy ? enemyUnits : friendlyUnits;
      const index = array.indexOf(this);
      if (index > -1) array.splice(index, 1);
    }
  }

  // 유닛 생성 버튼 이벤트
  if (unitCreateBtn) {
    unitCreateBtn.addEventListener("click", () => {
      if (friendlyUnits.length < MAX_FRIENDLY_UNITS) {
        unitCreateBtn.style.display = 'none';
        unitSelectionContainer.style.display = 'block';

        let buttonsHTML = '';
        for (let i = 1; i <= 5; i++) {
          buttonsHTML += `<button class="unit-select" data-unit="${i}">유닛 ${i}</button>`;
        }
        buttonsHTML += '<button id="backButton">뒤로 가기</button>';

        unitSelectionContainer.innerHTML = buttonsHTML;

        // 뒤로 가기 버튼에 이벤트 리스너 추가
        document.getElementById("backButton").addEventListener("click", () => {
          unitSelectionContainer.style.display = 'none';
          unitCreateBtn.style.display = 'block';
        });

        // 유닛 선택 버튼들에 이벤트 리스너 추가
        document.querySelectorAll(".unit-select").forEach(button => {
          button.addEventListener("click", (e) => {
            const unitNumber = e.target.getAttribute("data-unit");
            console.log(`유닛 ${unitNumber} 선택됨`);
            const unit = new Unit({
              x: 400,
              y: 350,
              health: 100,
              attPower: 20,
              range: 50,
            });
            friendlyUnits.push(unit);
          });
        });
      } else {
        console.log("최대 유닛 수(5개)에 도달했습니다!");
      }
    });
  }

  // 적 유닛 자동 생성
  setInterval(() => {
    if (enemyUnits.length < 1) {
      const enemy = new Unit({
        x: 3600,
        y: 350,
        isEnemy: true,
        health: 100,
        attPower: 10,
        range: 50,
      });
      enemyUnits.push(enemy);
    }
  }, 5000);

  // 충돌 감지 및 공격 (사거리 반영)
  function checkCollisions() {
    friendlyUnits.forEach((friendly) => {
      enemyUnits.forEach((enemy) => {
        const distance = Math.abs(friendly.x - enemy.x);
        if (distance < friendly.range || distance < enemy.range) {
          friendly.attack(enemy);
          enemy.attack(friendly);
        }
      });
    });
  }

  // 게임 루프
  function gameLoop() {
    friendlyUnits.forEach((unit) => unit.update());
    enemyUnits.forEach((unit) => unit.update());
    checkCollisions();
    requestAnimationFrame(gameLoop);
  }
  gameLoop();
});
