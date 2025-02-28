document.addEventListener("DOMContentLoaded", () => {
  // DOM 요소 - HTML에서 필요한 요소들을 JavaScript로 가져옴
  const audio = document.getElementById("audio"); // 배경 음악을 재생할 오디오 요소
  const audioBtn = document.getElementById("audio_btn"); // 오디오 재생/정지 버튼
  const icon = audioBtn.querySelector("i"); // 오디오 버튼 내 아이콘 (음소거/소리 상태 표시)
  const start = document.querySelector(".start"); // 게임 시작 버튼을 포함한 시작 화면
  const stage = document.querySelector(".stage"); // 난이도 선택 화면
  const easy = document.getElementById("easy"); // 쉬운 난이도 선택 버튼
  const map = document.querySelector(".map"); // 게임 맵을 표시하는 영역
  const content = document.querySelector(".content"); // 유닛과 타워가 표시되는 실제 게임 콘텐츠 영역
  const unitCreateBtn = document.getElementById("unitCreate"); // 유닛 생성 버튼
  const towerUpgradeBtn = document.getElementById("towerUpgrade"); // 타워 업그레이드 버튼
  const unitSelectionContainer = document.getElementById("unitSelectionContainer"); // 유닛 선택 UI를 표시할 컨테이너
  const leftSection = document.querySelector(".map-section.left"); // 맵 좌측 스크롤 영역
  const rightSection = document.querySelector(".map-section.right"); // 맵 우측 스크롤 영역
  const coin = document.querySelector(".coin_box"); // 코인 수를 표시하는 박스
  let coin_count = document.getElementById("coin"); // 현재 코인 수를 표시하는 요소

  // 상태 변수 - 게임의 전반적인 상태를 관리
  const GAME_SPEED = 2; // 유닛 이동 속도 (화소 단위/프레임)
  let isMouseInLeft = false; // 마우스가 맵 좌측에 있는지 여부 (스크롤 제어용)
  let isMouseInRight = false; // 마우스가 맵 우측에 있는지 여부 (스크롤 제어용)
  let currentCoin = parseInt(coin_count.textContent, 10); // 현재 보유 코인 수 (초기값은 HTML에서 가져옴)
  const friendlyUnits = []; // 아군 유닛을 저장하는 배열
  const enemyUnits = []; // 적군 유닛을 저장하는 배열
  const MAX_FRIENDLY_UNITS = 100; // 아군 유닛 최대 생성 가능 수
  const MAP_WIDTH = 3600; // 맵의 너비 (feature/intersection/gyu에서 추가)

  // Tower 클래스 정의
  class Tower {
    constructor(isFriendly, health, attackPower, range) {
      this.screenElem = document.getElementById(isFriendly ? 'friendly-base-tower' : 'enemy-base-tower');
      this.isFriendly = isFriendly;
      this.atktype = 'tower';
      this.health = health;
      this.maxHealth = health;
      this.attackPower = attackPower;
      this.range = range;
      this.x = isFriendly ? 520 : 3820;
      this.name = isFriendly ? '아군 타워' : '적군 타워';
      this.level = 1;
      this.isDestroyed = false; // 타워 파괴 상태 추적 (feature/intersection/gyu에서 추가)
      this.healthBar = isFriendly
        ? document.querySelector('#friendly_base_bar .friendly_base_health')
        : document.querySelector('#enemy_base_bar .enemy_base_health');
      if (!this.healthBar) {
        console.error(`${this.name}의 체력 바를 찾을 수 없습니다.`);
      }
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
          this.health = 0;
          this.destroy();
        }
        this.updateHealthBar();
        console.log(`${this.name} 체력: ${this.health}`);
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
        this.maxHealth += 1000;
        this.attackPower += 10;
        this.range += 10;
        if (this.screenElem) {
          if (this.level === 2) {
            this.screenElem.style.backgroundImage = "url('img/upgraded-tower2.png')";
            this.screenElem.style.width = "350px";
          } else if (this.level === 3) {
            this.screenElem.style.backgroundImage = "url('img/upgraded-tower.png')";
            this.screenElem.style.width = "600px";
            document.getElementById("friendly_base_bar").style.width = "400px";
          }
          this.screenElem.style.zIndex = "10";
        } else {
          console.error("타워 요소를 찾을 수 없습니다!");
        }
        this.updateHealthBar();
        console.log(`${this.name}가 레벨 ${this.level}로 업그레이드되었습니다!`);
      }
    }

    updateHealthBar() {
      if (this.healthBar) {
        const healthPercentage = (this.health / this.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercentage}%`;
        const barContainer = this.healthBar.parentElement;
        let healthText = barContainer.querySelector('.health-text');
        if (!healthText) {
          healthText = document.createElement('div');
          healthText.className = 'health-text';
          barContainer.appendChild(healthText);
        }
        healthText.textContent = `${Math.round(this.health)} / ${this.maxHealth}`;
      }
    }
  }

  // 타워 인스턴스 생성
  const friendlyTower = new Tower(true, 5000, 30, 50);
  const enemyTower = new Tower(false, 5000, 30, 50);

  // 오디오 버튼 이벤트 - 배경 음악 재생/정지 토글
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

  // 시작 화면 이벤트 - 게임 시작 버튼 클릭 시 난이도 선택 화면 표시
  if (start && stage) {
    console.log("start와 stage 요소가 정상적으로 선택되었습니다.");
    start.addEventListener("click", () => {
      console.log("start 버튼 클릭됨");
      start.style.display = "none";
      stage.style.display = "flex";
    });
  } else {
    console.error("start 또는 stage 요소를 찾을 수 없습니다.", { start, stage });
  }

  // 난이도 선택 이벤트 - "EASY" 버튼 클릭 시 게임 시작
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

  // 맵 스크롤 이벤트 - 마우스 위치에 따라 맵을 좌우로 스크롤
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
    setInterval(scrollContent, 6); // 6ms마다 스크롤 업데이트 (약 166fps)
  }

  // 코인 표시 업데이트 함수 - UI에 현재 코인 수 반영
  function updateCoinDisplay() {
    coin_count.textContent = currentCoin.toString();
  }

  // 유닛 클래스 정의
  class Unit {
    constructor({x, isEnemy = false, health, attPower, range, unitNum, width = 200, height = 200}) {
      this.element = document.createElement("div");
      this.element.style.position = "absolute";
      this.element.style.width = `${width}px`;
      this.element.style.height = `${height}px`;
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
      this.unitNum = unitNum || (isEnemy ? "enemy1" : 100);
      this.element.classList.add(`${this.isEnemy ? "enemy1" : `unit${unitNum}`}-moving`);
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
      this.element.classList.remove(`${this.isEnemy ? "enemy1" : `unit${this.unitNum}`}-moving`);
      this.element.classList.add(`${this.isEnemy ? "unit1" : `unit${this.unitNum}`}-attack`);
      if (this.unitNum === 1) {
        this.element.style.transform = "scaleX(-1)";
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

      setTimeout(() => {
        this.isFighting = false;
        this.element.classList.remove(`${this.isEnemy ? "unit1" : `unit${this.unitNum}`}-attack`);
        if (this.unitNum === 1) {
          this.element.style.transform = "scaleX(-1)";
        }
        if (this.speed !== 0) {
          this.element.classList.add(`${this.isEnemy ? "enemy1" : `unit${this.unitNum}`}-moving`);
        }
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

  // 초기 체력 바 설정
  friendlyTower.updateHealthBar();
  enemyTower.updateHealthBar();

  // 유닛 선택 화면 생성 함수
  function createUnitSelectionScreen() {
    let buttonsHTML = '';
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

    document.querySelectorAll(".unit-select").forEach(button => {
      button.addEventListener("click", (e) => {
        const unitNumber = parseInt(e.target.getAttribute("data-unit"), 10);
        if (friendlyUnits.length < MAX_FRIENDLY_UNITS && currentCoin >= unitNumber) {
          currentCoin -= unitNumber;
          updateCoinDisplay();

          const lastUnitX = friendlyUnits.length > 0 ? friendlyUnits[friendlyUnits.length - 1].x : 400;

          let unit;
          switch (unitNumber) {
            case 1:
              unit = new Unit({x: 250, health: 100, attPower: 20, range: 50, unitNum: 1, width: 200, height: 200});
              break;
            case 2:
              unit = new Unit({x: 250, health: 200, attPower: 25, range: 50, unitNum: 2, width: 200, height: 250});
              break;
            case 3:
              unit = new Unit({x: 250, health: 300, attPower: 30, range: 50, unitNum: 3, width: 200, height: 200});
              break;
            case 4:
              unit = new Unit({x: 250, health: 100, attPower: 50, range: 600, unitNum: 4, width: 120, height: 150});
              break;
            case 5:
              unit = new Unit({x: 250, health: 200, attPower: 10000, range: 600, unitNum: 5, width: 160, height: 200});
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

  // 유닛 생성 버튼 이벤트
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

  // 적 유닛 자동 생성 - 주석 처리된 부분 해제 및 통합
  setInterval(() => {
    if (!enemyTower.isDestroyed && enemyUnits.length < 1) {
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
  }, 5000);

  // 충돌 감지 - feature/intersection/gyu의 상세 로직 사용
  function checkCollisions() {
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

  // 유닛 겹침 방지
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
    console.clear();
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