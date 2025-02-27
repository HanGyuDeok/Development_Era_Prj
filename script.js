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
  const towerUpgradeBtn = document.getElementById("towerUpgrade");
  const unitSelectionContainer = document.getElementById("unitSelectionContainer");
  const leftSection = document.querySelector(".map-section.left");
  const rightSection = document.querySelector(".map-section.right");
  const coin = document.querySelector(".coin_box");
  let coin_count = document.getElementById("coin");

  // 상태 변수
  const GAME_SPEED = 2;
  let isMouseInLeft = false;
  let isMouseInRight = false;
  let currentCoin = parseInt(coin_count.textContent, 10);
  const friendlyUnits = [];
  const enemyUnits = [];
  const MAX_FRIENDLY_UNITS = 100;

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
      towerUpgradeBtn.style.display = "block";
      coin.style.display = "block";
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

  function updateCoinDisplay() {
    coin_count.textContent = currentCoin.toString();
  }

  // 유닛 클래스 정의
  class Unit {
    constructor({x, isEnemy = false, health, attPower, range}) {
      this.element = document.createElement("div");
      this.element.style.position = "absolute";
      this.element.style.width = "200px";
      this.element.style.height = "200px";
      this.element.style.backgroundImage = isEnemy
          ? "url('img/enemy-unit.png')"
          : "url('img/friendly-unit.png')";
      this.element.style.backgroundSize = "cover";
      this.element.style.left = `${x}px`;
      this.element.style.bottom = `5px`;
      content.appendChild(this.element);
      this.atktype = 'unit';
      this.x = x;
      this.speed = isEnemy ? -GAME_SPEED : GAME_SPEED;
      this.health = health;
      this.attackPower = attPower;
      this.range = range || 50;
      this.isEnemy = isEnemy;
      this.isFighting = false;
    }

    update() {
      if (!this.isFighting) {
        this.x += this.speed;
        this.element.style.left = `${this.x}px`;
      }
    }

    distanceTo(target) {
      return Math.abs(this.x - target.x);
    }

    attack(target) {
      if (this.isFighting) return;

      this.isFighting = true;
      if (target.atktype === 'unit') {
        target.health -= this.attackPower;
        if (target.health <= 0) {
          target.remove();
          if (target.isEnemy) {
            currentCoin += 1;
            updateCoinDisplay();
          }
        }
      } else if (target.atktype === 'tower') {
        if (this.distanceTo(target) <= this.range) {
          target.takeDamage(this.attackPower);
        }
      }
      setTimeout(() => {
        this.isFighting = false;
      }, 1000);
    }

    remove() {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      const array = this.isEnemy ? enemyUnits : friendlyUnits;
      const index = array.indexOf(this);
      if (index > -1) {
        array.splice(index, 1);
        if (!this.isEnemy && index === 0 && array.length > 0) {
          array[0].speed = GAME_SPEED;
        }
      }
    }
  }

  class Tower {
    constructor(isFriendly, health, attackPower, range) {
      this.screenElem = document.querySelector(isFriendly ? '.friendly-base-tower' : '.enemy-base-tower');
      this.isFriendly = isFriendly;
      this.atktype = 'tower';
      this.health = health;
      this.attackPower = attackPower;
      this.range = range;
      this.x = isFriendly ? 520 : 3820;
      this.name = isFriendly ? '아군 타워' : '적군 타워';
      this.level = 1; // 타워 레벨 추가
    }

    attack(target) {
      if (target.atktype === 'unit') {
        target.health -= this.attackPower;
        if (target.health <= 0) {
          target.remove();
        }
      }
    }

    takeDamage(damage) {
      this.health -= damage;
      if (this.health <= 0) {
        this.destroy();
      }
    }

    destroy() {
      if (this.screenElem && this.screenElem.parentNode) {
        this.screenElem.parentNode.removeChild(this.screenElem);
        alert(`${this.name}가 파괴되었습니다.`);
      }
    }

    upgrade() {
      this.level += 1;
      this.health += 1000; // 체력 증가
      this.attackPower += 10; // 공격력 증가
      this.range += 10; // 사거리 증가
      if (this.screenElem) {
        this.screenElem.style.backgroundImage = "url('img/upgraded-tower.png')";
        this.screenElem.style.zIndex = "10";
      }
      console.log(`${this.name}가 레벨 ${this.level}로 업그레이드되었습니다!`);
    }
  }

  const friendlyTower = new Tower(true, 5000, 30, 50);
  const enemyTower = new Tower(false, 5000, 30, 50);

  // 유닛 선택 화면 생성 함수
  function createUnitSelectionScreen() {
    let buttonsHTML = '';
    for (let i = 1; i <= 5; i++) {
      buttonsHTML += `<button class="unit-select" data-unit="${i}">유닛 ${i}/ 골드 : ${i}</button>`;
    }
    buttonsHTML += '<button id="backButton">뒤로 가기</button>';
    unitSelectionContainer.innerHTML = buttonsHTML;

    document.getElementById("backButton").addEventListener("click", () => {
      unitSelectionContainer.style.display = 'none';
      unitCreateBtn.style.display = 'block';
      towerUpgradeBtn.style.display = 'block';
    });

    document.querySelectorAll(".unit-select").forEach(button => {
      button.addEventListener("click", (e) => {
        const unitNumber = parseInt(e.target.getAttribute("data-unit"), 10);
        if (friendlyUnits.length < MAX_FRIENDLY_UNITS && currentCoin >= unitNumber) {
          currentCoin -= unitNumber;
          updateCoinDisplay();

          const lastUnitX = friendlyUnits.length > 0 ? friendlyUnits[friendlyUnits.length - 1].x : 400;
          const newX = lastUnitX - 250;

          let unit;
          switch (unitNumber) {
            case 1:
              unit = new Unit({x: newX, health: 100, attPower: 20, range: 50});
              break;
            case 2:
              unit = new Unit({x: newX, health: 200, attPower: 25, range: 55});
              break;
            case 3:
              unit = new Unit({x: newX, health: 300, attPower: 30, range: 60});
              break;
            case 4:
              unit = new Unit({x: newX, health: 400, attPower: 35, range: 65});
              break;
            case 5:
              unit = new Unit({x: newX, health: 500, attPower: 40, range: 70});
              break;
          }
          friendlyUnits.push(unit);
          unit.element.classList.add(`unit${unitNumber}-moving`);
        } else if (friendlyUnits.length >= MAX_FRIENDLY_UNITS) {
          console.log("최대 유닛 수(100개)에 도달했습니다!");
        } else {
          console.log("코인이 부족합니다!");
        }
      });
    });
  }

  if (unitCreateBtn) {
    unitCreateBtn.addEventListener("click", () => {
      unitCreateBtn.style.display = 'none';
      towerUpgradeBtn.style.display = 'none';
      unitSelectionContainer.style.display = 'block';
      createUnitSelectionScreen();
    });
  }

  // 타워 업그레이드 함수
  function upgradeTower() {
    const upgradeCost = 5;
    if (currentCoin >= upgradeCost) {
      currentCoin -= upgradeCost;
      updateCoinDisplay();
      friendlyTower.upgrade();
    } else {
      console.log("코인이 부족합니다!");
    }
  }

  // 타워 업그레이드 버튼 이벤트
  if (towerUpgradeBtn) {
    towerUpgradeBtn.addEventListener("click", () => {
      upgradeTower();
    });
  }

  // 적 유닛 자동 생성
  setInterval(() => {
    if (enemyUnits.length < 1) {
      const enemy = new Unit({
        x: 3600,
        isEnemy: true,
        health: 100,
        attPower: 10,
        range: 50,
      });
      enemyUnits.push(enemy);
    }
  }, 5000);

  // 충돌 감지
  function checkCollisions() {
    friendlyUnits.forEach(friendly => {
      enemyUnits.forEach(enemy => {
        if (friendly.distanceTo(enemy) <= Math.max(friendly.range, enemy.range)) {
          friendly.attack(enemy);
          enemy.attack(friendly);
        }
      });

      if (friendly.distanceTo(enemyTower) <= Math.max(friendly.range, enemyTower.range)) {
        friendly.attack(enemyTower);
        enemyTower.attack(friendly);
      }
    });

    enemyUnits.forEach(enemy => {
      if (enemy.distanceTo(friendlyTower) <= Math.max(enemy.range, friendlyTower.range)) {
        enemy.attack(friendlyTower);
        friendlyTower.attack(enemy);
      }
    });
  }

  const unitSpacing = 200;

  function dontOverlap() {
    for (let i = 1; i < friendlyUnits.length; i++) {
      const distance = friendlyUnits[i-1].x - friendlyUnits[i].x;
      if (distance < unitSpacing) {
        friendlyUnits[i].speed = 0;
      } else if (friendlyUnits[i].speed === 0) {
        friendlyUnits[i].speed = GAME_SPEED;
      }
    }
    if (friendlyUnits.length > 0 && !friendlyUnits[0].isFighting) {
      friendlyUnits[0].speed = GAME_SPEED;
    }
  }

  // 게임 루프
  function gameLoop() {
    checkCollisions();
    dontOverlap();
    friendlyUnits.forEach(unit => unit.update());
    enemyUnits.forEach(unit => unit.update());
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});