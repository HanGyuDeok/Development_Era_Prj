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
  const MAP_WIDTH = 3600; // 맵의 너비 (예: 4000px로 설정)

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

  class Unit {
    constructor({x, isEnemy = false, health, attPower, range, unitNum, width = 200, height = 200}) {
      this.element = document.createElement("div");
      this.element.style.position = "absolute";
      this.element.style.width = `${width}px`; // 동적 너비 적용
      this.element.style.height = `${height}px`; // 동적 높이 적용
      this.element.style.backgroundImage = isEnemy
        ? "url(./ani/enemy1/enemy1_1.png)"
        : `url(./ani/unit${unitNum}_ani/unit${unitNum}-1.png)`;
      if (unitNum !== 1 && !isEnemy) {
        this.element.style.transform = "scaleX(-1)"; // 아군 유닛 반전
      } else if (isEnemy) {
        this.element.style.transform = "scaleX(1)"; // 적군 유닛 기본 방향
      }
      this.element.style.backgroundSize = "cover";
      this.element.style.left = `${x}px`;
      this.element.style.bottom = `40px`;
      content.appendChild(this.element);
      this.atktype = "unit";
      this.x = x;
      this.speed = isEnemy ? -GAME_SPEED : GAME_SPEED;
      this.health = health;
      this.attackPower = attPower;
      this.range = range || 50;
      this.isEnemy = isEnemy;
      this.isFighting = false;
      this.unitNum = unitNum || (isEnemy ? "enemy1" : 100); // 적군 유닛은 "100"으로 설정 100번부터 시작
      this.element.classList.add(`${this.isEnemy ? "enemy1" : `unit${unitNum}`}-moving`); // 기본 이동 애니메이션 적용
    }

    update() {
      if (!this.isFighting && this.speed !== 0) {
        this.x += this.speed;
        this.element.style.left = `${this.x}px`;
        this.element.classList.add(`${this.isEnemy ? "enemy1" : `unit${this.unitNum}`}-moving`);
      } else if (!this.isFighting) {
        this.element.classList.remove(`${this.isEnemy ? "enemy1" : `unit${this.unitNum}`}-moving`);
      }

      // 맵 밖으로 나가면 제거
      if (this.x < 0 || this.x > MAP_WIDTH) {
        this.remove();
      }
    }

    distanceTo(target) {
      return Math.abs(this.x - target.x);
    }

    attack(target) {
      if (this.isFighting) return;

      this.isFighting = true;

      // 이동 애니메이션 제거하고 공격 애니메이션 추가
      this.element.classList.remove(`${this.isEnemy ? "enemy1" : `unit${this.unitNum}`}-moving`);
      this.element.classList.add(`${this.isEnemy ? "unit1" : `unit${this.unitNum}`}-attack`);
      if (this.unitNum === 1) {
        this.element.style.transform = "scaleX(-1)"
      }
      if (target.atktype === "unit") {
        target.health -= this.attackPower;
        if (target.health <= 0) {
          target.remove();
          if (target.isEnemy) {
            currentCoin += 1;
            updateCoinDisplay();
          }
        }
      } else if (target.atktype === "tower") {
        if (this.distanceTo(target) <= this.range) {
          target.takeDamage(this.attackPower);
          if (target.health <= 0) {
            this.isFighting = false; // 타워 파괴 후 전진 가능
          }
        }
      }

      // 공격 종료 후 이동 애니메이션 복구
      setTimeout(() => {
        this.isFighting = false;
        this.element.classList.remove(`${this.isEnemy ? "unit1" : `unit${this.unitNum}`}-attack`);
        if (this.unitNum === 1) {
          this.element.style.transform = "scaleX(-1)"
        }
        if (this.speed !== 0) {
          this.element.classList.add(`${this.isEnemy ? "enemy1" : `unit${this.unitNum}`}-moving`);
        }
      }, 1000); // 공격 지속 시간 (1초)
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
      this.screenElem = document.getElementById(isFriendly ? "friendly-base-tower" : "enemy-base-tower");
      this.isFriendly = isFriendly;
      this.atktype = "tower";
      this.health = health;
      this.attackPower = attackPower;
      this.range = range;
      this.x = isFriendly ? 520 : 3820;
      this.name = isFriendly ? "아군 타워" : "적군 타워";
      this.level = 1;
      this.isDestroyed = false; // 타워 파괴 상태 추적
    }

    attack(target) {
      if (!this.isDestroyed && target.atktype === "unit") {
        target.health -= this.attackPower;
        if (target.health <= 0) {
          target.remove();
        }
      }
    }

    takeDamage(damage) {
      if (!this.isDestroyed) {
        this.health -= damage;
        if (this.health <= 0) {
          this.destroy();
        }
      }
    }

    destroy() {
      if (this.screenElem && this.screenElem.parentNode) {
        this.screenElem.parentNode.removeChild(this.screenElem);
        this.isDestroyed = true;
        alert(`${this.name}가 파괴되었습니다.`);
      }
    }

    upgrade() {
      if (!this.isDestroyed) {
        this.level += 1;
        this.health += 1000;
        this.attackPower += 10;
        this.range += 10;
        if (this.screenElem) {
          this.screenElem.style.backgroundImage = "url('img/upgraded-tower.png')";
          this.screenElem.style.zIndex = "10";
        } else {
          console.error("타워 요소를 찾을 수 없습니다!");
        }
        console.log(`${this.name}가 레벨 ${this.level}로 업그레이드되었습니다!`);
      }
    }
  }

  const friendlyTower = new Tower(true, 5000, 30, 50);
  const enemyTower = new Tower(false, 5000, 30, 50);

  // 유닛 선택 화면 생성 함수
  function createUnitSelectionScreen() {
    let buttonsHTML = "";
    for (let i = 1; i <= 5; i++) {
      buttonsHTML += `<button class="unit-select" data-unit="${i}">유닛 ${i}/ 골드 : ${i}</button>`;
    }
    buttonsHTML += '<button id="backButton">뒤로 가기</button>';
    unitSelectionContainer.innerHTML = buttonsHTML;

    document.getElementById("backButton").addEventListener("click", () => {
      unitSelectionContainer.style.display = "none";
      unitCreateBtn.style.display = "block";
      towerUpgradeBtn.style.display = "block";
    });

    document.querySelectorAll(".unit-select").forEach((button) => {
      button.addEventListener("click", (e) => {
        const unitNumber = parseInt(e.target.getAttribute("data-unit"), 10);
        if (friendlyUnits.length < MAX_FRIENDLY_UNITS && currentCoin >= unitNumber) {
          currentCoin -= unitNumber;
          updateCoinDisplay();

          const lastUnitX = friendlyUnits.length > 0 ? friendlyUnits[friendlyUnits.length - 1].x : 400;

          let unit;
          switch (unitNumber) {
            case 1:
              unit = new Unit({x: 450, health: 100, attPower: 20, range: 50, unitNum: 1, width: 200, height: 200});
              break;
            case 2:
              unit = new Unit({x: 450, health: 200, attPower: 25, range: 50, unitNum: 2, width: 200, height: 250});
              break;
            case 3:
              unit = new Unit({x: 450, health: 300, attPower: 30, range: 50, unitNum: 3, width: 200, height: 200});
              break;
            case 4:
              unit = new Unit({x: 450, health: 100, attPower: 50, range: 600, unitNum: 4, width: 120, height: 150});
              break;
            case 5:
              unit = new Unit({x: 450, health: 200, attPower: 10000, range: 600, unitNum: 5, width: 160, height: 200});
              break;
          }
          friendlyUnits.push(unit);
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
      unitCreateBtn.style.display = "none";
      towerUpgradeBtn.style.display = "none";
      unitSelectionContainer.style.display = "block";
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

  if (towerUpgradeBtn) {
    towerUpgradeBtn.addEventListener("click", () => {
      upgradeTower();
    });
  }

  // 적 유닛 자동 생성
/*  setInterval(() => {
    if (!enemyTower.isDestroyed) {

      const enemy = new Unit({
        x: 3600,
        isEnemy: true,
        health: 1000,
        attPower: 50,
        range: 50,
        width: 300,
        height: 300
      });
      enemyUnits.push(enemy);
    }
  }, 5000);*/

  function checkCollisions() {
    // 아군 유닛과 적군 유닛 간의 상호작용
    friendlyUnits.forEach((friendly) => {
      enemyUnits.forEach((enemy) => {
        const distance = friendly.distanceTo(enemy);
        const friendlyRange = friendly.range;
        const enemyRange = enemy.range;

        if (distance <= enemyRange && distance > friendlyRange) {
          enemy.attack(friendly);
        } else if (distance <= friendlyRange && distance > enemyRange) {
          friendly.attack(enemy);
        } else if (distance <= friendlyRange && distance <= enemyRange) {
          friendly.attack(enemy);
          enemy.attack(friendly);
        }
      });
    });

    // 적군 유닛과 아군 타워 간의 상호작용
    if (!friendlyTower.isDestroyed) {
      enemyUnits.forEach((enemy) => {
        const distanceToTower = enemy.distanceTo(friendlyTower);
        const enemyRange = enemy.range;
        const towerRange = friendlyTower.range;

        if (distanceToTower <= enemyRange && distanceToTower > towerRange) {
          enemy.attack(friendlyTower);
        } else if (distanceToTower <= towerRange && distanceToTower > enemyRange) {
          friendlyTower.attack(enemy);
        } else if (distanceToTower <= towerRange && distanceToTower <= enemyRange) {
          enemy.attack(friendlyTower);
          friendlyTower.attack(enemy);
        }
      });
    }

    // 아군 유닛과 적군 타워 간의 상호작용
    if (!enemyTower.isDestroyed) {
      friendlyUnits.forEach((friendly) => {
        const distanceToTower = friendly.distanceTo(enemyTower);
        const friendlyRange = friendly.range;
        const towerRange = enemyTower.range;

        if (distanceToTower <= friendlyRange && distanceToTower > towerRange) {
          friendly.attack(enemyTower);
        } else if (distanceToTower <= towerRange && distanceToTower > friendlyRange) {
          enemyTower.attack(friendly);
        } else if (distanceToTower <= towerRange && distanceToTower <= friendlyRange) {
          friendly.attack(enemyTower);
          enemyTower.attack(friendly);
        }
      });
    }
  }

  const unitSpacing = 200;

  function dontOverlap() {
    for (let i = 1; i < friendlyUnits.length; i++) {
      const distance = friendlyUnits[i - 1].x - friendlyUnits[i].x;
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

// 유닛 및 타워 상태를 콘솔에 출력하는 함수
  function logUnitStatus() {
    console.clear(); // 이전 로그를 지워 깔끔하게 출력 (선택 사항)

    console.log("=== 아군 유닛 상태 ===");
    friendlyUnits.forEach((unit, index) => {
      console.log(
        `유닛 ${index + 1}: 체력=${unit.health}, 공격력=${unit.attackPower}, 사거리=${unit.range}, 위치=${unit.x.toFixed(2)}px, 전투중=${unit.isFighting}`
      );
    });

    console.log("=== 적군 유닛 상태 ===");
    enemyUnits.forEach((unit, index) => {
      console.log(
        `유닛 ${index + 1}: 체력=${unit.health}, 공격력=${unit.attackPower}, 사거리=${unit.range}, 위치=${unit.x.toFixed(2)}px, 전투중=${unit.isFighting}`
      );
    });

    console.log("=== 아군 타워 상태 ===");
    console.log(
      `체력=${friendlyTower.health}, 공격력=${friendlyTower.attackPower}, 사거리=${friendlyTower.range}, 레벨=${friendlyTower.level}, 파괴됨=${friendlyTower.isDestroyed}`
    );

    console.log("=== 적군 타워 상태 ===");
    console.log(
      `체력=${enemyTower.health}, 공격력=${enemyTower.attackPower}, 사거리=${enemyTower.range}, 레벨=${enemyTower.level}, 파괴됨=${enemyTower.isDestroyed}`
    );
  }

  // 게임 루프
  function gameLoop() {
    checkCollisions();
    dontOverlap();
    friendlyUnits.forEach((unit) => unit.update());
    enemyUnits.forEach((unit) => unit.update());
    requestAnimationFrame(gameLoop);
  }

  setInterval(() => {
    logUnitStatus();
  }, 1000);

  gameLoop();
});