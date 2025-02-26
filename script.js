document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("audio");
  const audioBtn = document.getElementById("audio_btn");
  const icon = audioBtn.querySelector("i");
  const map = document.querySelector(".map");
  const content = document.querySelector(".content");
  const unitCreateBtn = document.getElementById("unitCreate");
  const leftSection = document.querySelector(".left");
  const rightSection = document.querySelector(".right");

  let isMouseInLeft = false;
  let isMouseInRight = false;
  const friendlyUnits = [];
  const enemyUnits = [];

  // 오디오 버튼 이벤트
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

  // 맵 스크롤 이벤트
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

  // 유닛 클래스 정의
  class Unit {
    constructor({ x, y, isEnemy = false, health, attPower}) {
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
      this.speed = isEnemy ? -2 : 2; // 적은 왼쪽, 아군은 오른쪽으로 이동
      this.health = health;
      this.attackPower = attPower;
      this.isEnemy = isEnemy;
      this.isFighting = false;
    }

    update() {
      if (!this.isFighting) {
        this.x += this.speed;
        this.element.style.left = `${this.x}px`;
      }

      // 맵 밖으로 나가면 제거
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
      content.removeChild(this.element);
      const array = this.isEnemy ? enemyUnits : friendlyUnits;
      const index = array.indexOf(this);
      if (index > -1) array.splice(index, 1);
    }
  }

  // 유닛 생성 버튼 이벤트{ 유닛이 한개인경우 }
  unitCreateBtn.addEventListener("click", () => {
    const unit = new Unit({ x: 400, y: 350, health: 100, attPower: 20}); // 왼쪽 기지에서 시작
    friendlyUnits.push(unit);
  });
  // 유닛생성 5개

  // 적 유닛 자동 생성
  setInterval(() => {
    if (enemyUnits.length < 1) {
      const enemy = new Unit({ x: 3600, y: 350, isEnemy: true, health: 100 }); // 오른쪽 기지에서 시작
      enemyUnits.push(enemy);
    }
  }, 5000); // 5초마다 1마리 생성

  // 충돌 감지 및 공격
  // 50수치값을 new 유닛 사거리 받아서
  function checkCollisions() {
    friendlyUnits.forEach((friendly) => {
      enemyUnits.forEach((enemy) => {
        const distance = Math.abs(friendly.x - enemy.x);
        if (distance < 50) { // 유닛 간 거리가 50px 미만일 때
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