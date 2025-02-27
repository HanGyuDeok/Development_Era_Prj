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
  const coin = document.querySelector(".coin_box");
  let coin_count = document.getElementById("coin");

  // 상태 변수
  const GAME_SPEED = 2;
  let isMouseInLeft = false;
  let isMouseInRight = false;
  let currentCoin = parseInt(coin_count.textContent, 10);  // 시작할 때 코인 값
  const friendlyUnits = [];
  const enemyUnits = [];
  const MAX_FRIENDLY_UNITS = 100; // 최대 유닛 수 제한

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
    coin_count.textContent = currentCoin.toString();  // 코인 값 업데이트
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
      this.atktype = 'unit'
      this.x = x;
      this.speed = isEnemy ? -GAME_SPEED : GAME_SPEED;
      this.health = health;
      this.attackPower = attPower;
      this.range = range || 50; // 기본 사거리 50
      this.isEnemy = isEnemy;
      this.isFighting = false;
      this.attackSpeed = 1;
    }

    update() {
      if (!this.isFighting) { // isFight는 항상 false 상태. 트루면 스피드를 줌. 맨 처음 유닛 생성시 이속 주는거임
        this.x += this.speed;
        this.element.style.left = `${this.x}px`;
      }
      // if (this.x < -50 || this.x > 4050) { //TODO 이제 나무와 부딪혔을 때 나무 떄리는 로직 구현 필요
      //   this.remove();
      // }
    }

    distanceTo(tower) {
      // 타워와의 거리 계산
      return (this.x - tower.x);
    }


    attack(target) {
//       if (this.isFighting) return; // 이미 공격 중이면 중복 공격 방지

//       this.isFighting = true; // 공격 중 상태 설정
//       console.log(`유닛이 공격을 시작합니다! 대상 남은 체력: ${target.health}`);

//       setTimeout(() => {
//         target.health -= this.attackPower;
//         console.log(`유닛이 공격을 가했습니다! 대상 남은 체력: ${target.health}`);

//         if (target.health <= 0) {
//           target.remove();
//           this.isFighting = false; // 적이 죽었으니 다시 이동 가능
//           if (target.isEnemy) {
//             currentCoin += 1; // 코인 증가
//             updateCoinDisplay();
//           }
//         } else {
//           this.isFighting = false; // 공격 후 다시 공격 가능하도록 설정
//         }
//       }, 1000); // 1초 공격 딜레이
      // 유닛을 공격함
      if (target.atktype === 'unit') {
        this.isFighting = true;
        target.health -= this.attackPower;
        if (target.health <= 0) {
          target.remove();
          this.isFighting = false;
          if (target.isEnemy) { // 적이 죽으면 코인 1 증가
            currentCoin += 1;
            updateCoinDisplay();
          }
        } else {
          // 타워와의 거리가 유닛의 사거리 이내인지 확인
          if (this.distanceTo(target) <= this.range) {
            console.log("타워를 공격합니다!");
            target.takeDamage(this.attackPower); // 타워에 피해를 줌
          } else {
            console.log("타워가 사거리 밖에 있습니다.");
          }
        }

      }
    }
      //
      // attack(tower) {
      //   // 타워와의 거리가 유닛의 사거리 이내인지 확인
      //   if (this.distanceTo(tower) <= this.range) {
      //     console.log("타워를 공격합니다!");
      //     tower.takeDamage(this.attackPower); // 타워에 피해를 줌
      //   } else {
      //     console.log("타워가 사거리 밖에 있습니다.");
      //   }
      // }


      remove()
      {
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element);
        }
        const array = this.isEnemy ? enemyUnits : friendlyUnits;
        const index = array.indexOf(this);
        if (index > -1) array.splice(index, 1);
        if (!this.isEnemy) {
          array[0].speed = GAME_SPEED; // 아군이든 적이든 선두 유닛 전진
          console.log("======= 아군 선두 유닛이 다시 전진합니다 =======")
        }
      }
    }

    class Tower {
    constructor(isFriendly, health, attackPower, range) {
      this.screenElem = document.querySelector(isFriendly?'friendly-base-tower':'enemy-base-tower');
      // 나중에 이 요소를 상위 요소에서 removeChild 형태로 삭제하면 됨!
      this.isFriendly = isFriendly; // true: 아군 타워, false: 적군 타워
      this.atktype = 'tower'
      this.health = health; // 타워 체력
      this.attackPower = attackPower; // 공격력
      this.range = range; // 사거리
      this.x = isFriendly ? 520 : 3820; // 아군 타워일 경우 x 좌표 520, 적군 타워일 경우 3820
      this.name = isFriendly ? '아군 타워' : '적군 타워'; // 이름 설정
    }

    attack(target) {
      // 유닛을 공격함
      if(target.atktype === 'unit'){
        this.isFighting = true;
        target.health -= this.attackPower;
        if (target.health <= 0) {
          target.remove();
          this.isFighting = false;
        }
      }

    }
    // 체력을 감소시키는 메서드
    takeDamage(Unit) {
      const damage = Unit.attPower;
      this.health -= damage;
      if (this.health <= 0) {
        this.destroy();
      }
    }

    // 타워를 파괴하는 메서드
    destroy(tower) {
      if (tower) {
        // 타워의 종류 확인
        const towerType = tower.classList.contains('ally') ? '아군' : '적군';
        tower.remove(); // 타워 요소 제거
        alert(towerType + " 타워가 파괴되었습니다.");
      }
    }
  }

  const friendlyTower = new Tower( // 아군 타워 생성 메소드
      true,
      5000,
      30,
      50
  );

  const enemyTower = new Tower(
      false,
      5000,
      30,
      50
  )
  // 유닛 선택 화면 생성 함수
  function createUnitSelectionScreen() {
    let buttonsHTML = '';
    for (let i = 1; i <= 5; i++) {
      buttonsHTML += `<button class="unit-select" data-unit="${i}">유닛 ${i}/ 골드 : ${i}</button>`;
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
        const unitNumber = parseInt(e.target.getAttribute("data-unit"), 10)
        console.log(`유닛 ${unitNumber} 선택됨`);
        if (friendlyUnits.length < MAX_FRIENDLY_UNITS) {
          if (currentCoin >= unitNumber) { // 코인이 충분한 경우에만 유닛 생성
            currentCoin -= unitNumber; // 코인 차감
            updateCoinDisplay(); // UI 업데이트

            let unit;
            switch (unitNumber) {
              case 1:
                unit = new Unit({
                  x: 400,
                  y: 350,
                  health: 100,
                  attPower: 20,
                  range: 50,
                });
                break;
              case 2:
                unit = new Unit({
                  x: 400,
                  y: 350,
                  health: 200,
                  attPower: 25,
                  range: 55,
                });
                break;
              case 3:
                unit = new Unit({
                  x: 400,
                  y: 350,
                  health: 300,
                  attPower: 30,
                  range: 60,
                });
                break;
              case 4:
                unit = new Unit({
                  x: 400,
                  y: 350,
                  health: 400,
                  attPower: 35,
                  range: 65,
                });
                break;
              case 5:
                unit = new Unit({
                  x: 400,
                  y: 350,
                  health:5300,
                  attPower: 40,
                  range: 70,
                });
                break;
              default:
                console.log("잘못된 유닛 번호");
                return;
            }
            friendlyUnits.push(unit);
            unit.element.classList.add(`unit${unitNumber}-moving`);
          } else {
            console.log("코인이 부족합니다!");
          }
        } else {
          console.log("최대 유닛 수(5개)에 도달했습니다!");
        }
      });
    });
  }

  // 유닛 생성 버튼 이벤트
  if (unitCreateBtn) {
    unitCreateBtn.addEventListener("click", () => {
      unitCreateBtn.style.display = 'none';
      unitSelectionContainer.style.display = 'block';
      createUnitSelectionScreen();
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
    // 화면 상 모든 유닛 간 거리에 따라 동작 제어
    // 만나면 Action 취함
    // 게임 루프 진행될 때 (1 tick) 마다 호출
    // 전부 체크하기만 하면 됨
    // 편리하게 짜든지, 성능 및 알고리즘에 충실하게 짜든지 => 선택에 따름

    friendlyUnits.forEach((friendly) => {
          enemyUnits.forEach((enemy) => {
                const distance = Math.abs(friendly.x - enemy.x);
                if (distance < friendly.range || distance < enemy.range) {
                  friendly.attack(enemy);
                  enemy.attack(friendly);
                }
                const unitToFtower = Math.abs(enemy.x - friendlyTower.x);
                if(unitToFtower < enemy.range || unitToFtower <  friendlyTower.range) {
                  friendlyTower.attack(enemy);
                  enemy.attack(friendlyTower);
                }
              }
              // friendlyTower 체크 로직 추가
          );
          // enemyTower 채크 로직 추가
          const unitToEtower = Math.abs(friendly.x - enemyTower.x);
          if(unitToEtower < friendly.range || unitToEtower < enemyTower.range){
            enemyTower.attack(friendly);
            friendly.attack(enemyTower);
          }
        }
    );
  }

  const unitSpacing = 200; // 유닛 간 최소 간격
  const startX = 400; // 유닛이 생성될 기본 위치

  function dontOverlap() {
    if (friendlyUnits.length < 2) return;

    friendlyUnits.forEach((unit, index) => {
      if (index > 0) {
        const distance = Math.abs(friendlyUnits[index].x - friendlyUnits[index - 1].x);

        if (distance < unitSpacing) {
          if (friendlyUnits[index].speed !== 0) { // 상태 변화가 있을 때만 로그 출력
            console.log(`유닛 ${index}가 유닛 ${index - 1}과 너무 가까워서 정지합니다.`);
          }
          friendlyUnits[index].speed = 0;
        } else {
          // 거리 간격이 충분해지면 뒤 유닛이 다시 움직이도록
          if (friendlyUnits[index].speed === 0 && friendlyUnits[index - 1].speed > 0) {
            friendlyUnits[index].speed = GAME_SPEED; // 뒤 유닛이 다시 움직이도록 속도 설정
            console.log(`유닛 ${index}가 유닛 ${index - 1}을 따라 다시 움직입니다.`);
          }
          friendlyUnits[index].speed = 2;
        }
      }
    });
  }
  return newX;
}
  // 게임 루프
  function gameLoop() {
    friendlyUnits.forEach((unit) => unit.update());
    enemyUnits.forEach((unit) => unit.update());
    dontOverlap();
    checkCollisions();
    requestAnimationFrame(gameLoop);
  }

  gameLoop();
});

