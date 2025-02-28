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
  const GAME_SPEED = 5; // 유닛 이동 속도 (화소 단위/프레임)
  let isMouseInLeft = false; // 마우스가 맵 좌측에 있는지 여부 (스크롤 제어용)
  let isMouseInRight = false; // 마우스가 맵 우측에 있는지 여부 (스크롤 제어용)
  let currentCoin = parseInt(coin_count.textContent, 10); // 현재 보유 코인 수 (초기값은 HTML에서 가져옴)
  const friendlyUnits = []; // 아군 유닛을 저장하는 배열
  const enemyUnits = []; // 적군 유닛을 저장하는 배열
  const MAX_FRIENDLY_UNITS = 100; // 아군 유닛 최대 생성 가능 수
  const MAP_WIDTH = 3800; // 맵의 너비 (feature/intersection/gyu에서 추가)

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
      this.x = isFriendly ? 240 : 3820;
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
          currentCoin += 1;
          updateCoinDisplay();
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
            this.screenElem.style.width = "550px";
            this.screenElem.style.backgroundSize = "contain";
            this.screenElem.style.left = "60px";
          } else if (this.level === 3) {
            this.screenElem.style.backgroundImage = "url('img/upgraded-tower.png')";
            this.screenElem.style.width = "600px";
            this.screenElem.style.backgroundSize = "contain";
            this.screenElem.style.left = "120px";
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
  const friendlyTower = new Tower(true, 5000, 5, 200);
  const enemyTower = new Tower(false, 10000, 5, 200);

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
    console.log("start 와 stage 요소가 정상적으로 선택되었습니다.");
    start.addEventListener("click", () => {
      console.log("start 버튼 클릭됨");
      start.style.display = "none";
      stage.style.display = "flex";
    });
  } else {
    console.error("start 또는 stage 요소를 찾을 수 없습니다.", {start, stage});
  }

  function startGameLogic() {
    console.log("게임 로직이 시작되었습니다!");

    // 5초마다 적 유닛 생성
    setInterval(() => {
      if (!enemyTower.isDestroyed && enemyUnits.length < 2) {
        const enemy = new Unit({
          x: 3600,
          y: 40,
          isEnemy: true,
          health: 1200,
          attPower: 100,
          range: 170,
          width: 300,
          height: 300
        });
        enemyUnits.push(enemy);
        console.log("새로운 적 유닛 생성됨", enemyUnits);
      }
    }, 5000);
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
      startGameLogic();
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

  class Unit {
    constructor({x, y, isEnemy = false, health, attPower, range, unitNum, width = 200, height = 200}) {
      // 유닛 컨테이너 요소 생성
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
      this.element.style.bottom = `${y}px`;

      // 체력바 컨테이너 추가 (기지 바와 유사한 스타일 적용)
      this.healthBarContainer = document.createElement("div");
      this.healthBarContainer.style.position = "absolute";
      this.healthBarContainer.style.width = `${width - 60}px`;
      this.healthBarContainer.style.height = "15px"; // 기지 바와 동일한 높이
      this.healthBarContainer.style.top = "-20px"; // 유닛 위에 위치
      this.healthBarContainer.style.left = "40px";
      this.healthBarContainer.style.backgroundColor = "#555"; // 바탕색
      this.healthBarContainer.style.borderRadius = "5px";
      this.healthBarContainer.style.overflow = "hidden";
      if (unitNum !== 1 && !isEnemy) {
        this.healthBarContainer.style.transform = "scaleX(-1)";
      }

      // 체력바 내부 (그라디언트와 효과 적용)
      this.healthBar = document.createElement("div");
      this.healthBar.style.width = "100%"; // 초기 체력 100%
      this.healthBar.style.height = "100%";
      this.healthBar.style.background = `
      linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent),
      linear-gradient(to right, ${isEnemy ? '#ff3019' : '#00cc00'} 0%, ${isEnemy ? '#e73827' : '#009900'} 50%, ${isEnemy ? '#ff3019' : '#00cc00'} 100%)
    `; // 적군은 빨강, 아군은 초록 계열
      this.healthBar.style.boxShadow = "inset 0 0 5px #000";
      this.healthBar.style.borderRadius = "5px";
      this.healthBar.style.transition = "width 0.3s ease";

      // 체력 텍스트 추가
      this.healthText = document.createElement("div");
      this.healthText.className = "health-text";
      this.healthText.style.position = "absolute";
      this.healthText.style.top = "50%";
      this.healthText.style.left = "50%";
      this.healthText.style.transform = "translate(-50%, -50%)";
      this.healthText.style.color = "#fff";
      this.healthText.style.textShadow = "1px 1px 2px #000";
      this.healthText.style.zIndex = "20";
      this.healthText.style.fontSize = "12px"; // 유닛 크기에 맞게 조정
      this.healthText.style.pointerEvents = "none";
      this.healthText.textContent = `${health}/${health}`; // 초기 체력 표시

      this.healthBarContainer.appendChild(this.healthBar);
      this.healthBarContainer.appendChild(this.healthText);
      this.element.appendChild(this.healthBarContainer);

      content.appendChild(this.element);

      // 속성 초기화
      this.atktype = "unit";
      this.x = x;
      this.speed = isEnemy ? -GAME_SPEED : GAME_SPEED;
      this.maxHealth = health; // 최대 체력 저장
      this.health = health;
      this.attackPower = attPower;
      this.range = range || 50;
      this.isEnemy = isEnemy;
      this.isFighting = false;
      this.unitNum = unitNum || (isEnemy ? "enemy1" : 100);
      this.element.classList.add(`${this.isEnemy ? "enemy1" : `unit${unitNum}`}-moving`);
    }

    // 유닛 상태 업데이트
    update() {
      if (!this.isFighting && this.speed !== 0) {
        this.x += this.speed;
        this.element.style.left = `${this.x}px`;
        this.element.classList.add(`${this.isEnemy ? "enemy1" : `unit${this.unitNum}`}-moving`);
      } else if (!this.isFighting) {
        this.element.classList.remove(`${this.isEnemy ? "enemy1" : `unit${this.unitNum}`}-moving`);
      }

      // 체력바와 텍스트 업데이트
      this.updateHealthBar();

      // 맵 밖으로 나가면 제거
      if (this.x < 0 || this.x > MAP_WIDTH) {
        this.remove();
      }
    }

    // 체력바와 텍스트 업데이트 메서드
    updateHealthBar() {
      const healthPercentage = Math.max(0, (this.health / this.maxHealth) * 100); // 음수 방지
      this.healthBar.style.width = `${healthPercentage}%`;
      this.healthText.textContent = `${Math.max(0, this.health)}/${this.maxHealth}`; // 현재 체력/최대 체력
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
        this.healthBarContainer.style.transform = "scaleX(-1)";
      }

      if (target.atktype === "unit") {
        target.health -= this.attackPower;
        target.updateHealthBar(); // 공격받은 유닛의 체력바 업데이트
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
            this.isFighting = false;
          }
        }
      }

      setTimeout(() => {
        this.isFighting = false;
        this.element.classList.remove(`${this.isEnemy ? "unit1" : `unit${this.unitNum}`}-attack`);
        if (this.unitNum === 1) {
          this.element.style.transform = "scaleX(-1)";
          this.healthBarContainer.style.transform = "scaleX(-1)";
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
      buttonsHTML += `<button class="unit-select unit${i}" data-unit="${i}">${i} $</button>`;
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

          let unit;
          switch (unitNumber) {
            case 1:
              unit = new Unit({
                x: 330,
                y: 40,
                health: 500,
                attPower: 100,
                range: 170,
                unitNum: 1,
                width: 200,
                height: 200
              });
              break;
            case 2:
              unit = new Unit({
                x: 330,
                y: 40,
                health: 1500,
                attPower: 150,
                range: 170,
                unitNum: 2,
                width: 200,
                height: 250
              });
              break;
            case 3:
              unit = new Unit({
                x: 330,
                y: 40,
                health: 700,
                attPower: 200,
                range: 220,
                unitNum: 3,
                width: 200,
                height: 200
              });
              break;
            case 4:
              unit = new Unit({
                x: 330,
                y: 150,
                health: 100,
                attPower: 600,
                range: 600,
                unitNum: 4,
                width: 150,
                height: 150
              });
              break;
            case 5:
              unit = new Unit({
                x: 330,
                y: 40,
                health: 200,
                attPower: 1200,
                range: 600,
                unitNum: 5,
                width: 160,
                height: 200
              });
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