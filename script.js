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

  // 오디오 버튼 이벤트 - 배경 음악 재생/정지 토글
  if (audioBtn && audio && icon) {
    audioBtn.addEventListener("click", () => {
      if (audio.paused) { // 오디오가 정지 상태라면
        icon.classList.remove("fa-volume-xmark"); // 음소거 아이콘 제거
        icon.classList.add("fa-volume-high"); // 소리 아이콘 추가
        audio.play(); // 음악 재생
      } else { // 오디오가 재생 중이라면
        icon.classList.remove("fa-volume-high"); // 소리 아이콘 제거
        icon.classList.add("fa-volume-xmark"); // 음소거 아이콘 추가
        audio.pause(); // 음악 정지
      }
    });
  }

  // 시작 화면 이벤트 - 게임 시작 버튼 클릭 시 난이도 선택 화면 표시
  if (start && stage) {
    start.addEventListener("click", () => {
      start.style.display = "none"; // 시작 화면 숨김
      stage.style.display = "flex"; // 난이도 선택 화면 표시
    });
  }

  // 난이도 선택 이벤트 - "EASY" 버튼 클릭 시 게임 시작
  if (easy && content && map) {
    easy.addEventListener("click", () => {
      stage.style.display = "none"; // 난이도 선택 화면 숨김
      content.style.display = "block"; // 게임 콘텐츠 영역 표시
      map.style.display = "block"; // 맵 영역 표시
      unitCreateBtn.style.display = "block"; // 유닛 생성 버튼 표시
      towerUpgradeBtn.style.display = "block"; // 타워 업그레이드 버튼 표시
      coin.style.display = "block"; // 코인 표시 박스 표시
    });
  }

  // 맵 스크롤 이벤트 - 마우스 위치에 따라 맵을 좌우로 스크롤
  if (leftSection && rightSection && map) {
    leftSection.addEventListener("mouseenter", () => {
      isMouseInLeft = true; // 마우스가 좌측에 들어감
      scrollContent(); // 스크롤 시작
    });
    rightSection.addEventListener("mouseenter", () => {
      isMouseInRight = true; // 마우스가 우측에 들어감
      scrollContent(); // 스크롤 시작
    });
    map.addEventListener("mouseleave", () => {
      isMouseInLeft = false; // 스크롤 중지
      isMouseInRight = false;
    });
    map.addEventListener("mouseenter", () => {
      isMouseInRight = false; // 맵 중앙에 들어오면 스크롤 초기화
      isMouseInLeft = false;
    });

    // 스크롤 동작을 수행하는 함수
    function scrollContent() {
      if (isMouseInLeft) map.scrollLeft -= 10; // 좌측으로 10px 스크롤
      if (isMouseInRight) map.scrollLeft += 10; // 우측으로 10px 스크롤
    }
    setInterval(scrollContent, 6); // 6ms마다 스크롤 업데이트 (약 166fps)
  }

  // 코인 표시 업데이트 함수 - UI에 현재 코인 수 반영
  function updateCoinDisplay() {
    coin_count.textContent = currentCoin.toString();
  }

  // 유닛 클래스 정의 - 아군/적군 유닛의 속성과 동작 관리
  class Unit {
    constructor({x, isEnemy = false, health, attPower, range}) {
      this.element = document.createElement("div"); // 유닛을 나타낼 DOM 요소 생성
      this.element.style.position = "absolute"; // 절대 위치 지정
      this.element.style.width = "200px"; // 유닛 너비
      this.element.style.height = "200px"; // 유닛 높이
      this.element.style.backgroundImage = isEnemy
          ? "url('img/enemy-unit.png')" // 적군 이미지
          : "url('img/friendly-unit.png')"; // 아군 이미지
      this.element.style.backgroundSize = "cover"; // 이미지 크기 맞춤
      this.element.style.left = `${x}px`; // 초기 x 위치
      this.element.style.bottom = `5px`; // 맵 하단에서 5px 위
      content.appendChild(this.element); // 콘텐츠 영역에 추가
      this.atktype = 'unit'; // 공격 타입 (유닛)
      this.x = x; // 현재 x 좌표
      this.speed = isEnemy ? -GAME_SPEED : GAME_SPEED; // 이동 속도 (적: 왼쪽, 아군: 오른쪽)
      this.health = health; // 체력
      this.attackPower = attPower; // 공격력
      this.range = range || 50; // 사거리 (기본값 50)
      this.isEnemy = isEnemy; // 적군 여부
      this.isFighting = false; // 전투 중 여부
    }

    // 유닛 위치 업데이트 - 전투 중이 아니면 이동
    update() {
      if (!this.isFighting) {
        this.x += this.speed; // 속도만큼 x 좌표 이동
        this.element.style.left = `${this.x}px`; // DOM에 반영
      }
    }

    // 타겟과의 거리 계산
    distanceTo(target) {
      return Math.abs(this.x - target.x);
    }

    // 공격 로직 - 유닛 또는 타워를 공격
    attack(target) {
      if (this.isFighting) return; // 이미 싸우고 있으면 중복 공격 방지

      this.isFighting = true; // 전투 상태로 전환
      if (target.atktype === 'unit') { // 대상이 유닛일 경우
        target.health -= this.attackPower; // 대상 체력 감소
        if (target.health <= 0) { // 체력이 0 이하로 떨어지면
          target.remove(); // 대상 제거
          if (target.isEnemy) { // 적군이면 코인 증가
            currentCoin += 1;
            updateCoinDisplay();
          }
        }
      } else if (target.atktype === 'tower') { // 대상이 타워일 경우
        if (this.distanceTo(target) <= this.range) { // 사거리 내에 있으면
          target.takeDamage(this.attackPower); // 타워에 피해 입힘
        }
      }
      setTimeout(() => { // 1초 후 전투 상태 해제
        this.isFighting = false;
      }, 1000);
    }

    // 유닛 제거 - DOM과 배열에서 삭제
    remove() {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element); // DOM에서 제거
      }
      const array = this.isEnemy ? enemyUnits : friendlyUnits; // 적군/아군 배열 선택
      const index = array.indexOf(this);
      if (index > -1) {
        array.splice(index, 1); // 배열에서 제거
        if (!this.isEnemy && index === 0 && array.length > 0) { // 첫 아군 유닛 제거 시
          array[0].speed = GAME_SPEED; // 다음 유닛 이동 시작
        }
      }
    }
  }

  // 타워 클래스 정의 - 아군/적군 타워의 속성과 동작 관리
  class Tower {
    constructor(isFriendly, health, attackPower, range) {
      this.screenElem = document.getElementById(isFriendly ? 'friendly-base-tower' : 'enemy-base-tower'); // 타워 DOM 요소 (ID로 선택)
      this.isFriendly = isFriendly; // 아군 여부
      this.atktype = 'tower'; // 공격 타입 (타워)
      this.health = health; // 체력
      this.attackPower = attackPower; // 공격력
      this.range = range; // 사거리
      this.x = isFriendly ? 520 : 3820; // 초기 x 위치 (아군: 520px, 적군: 3820px)
      this.name = isFriendly ? '아군 타워' : '적군 타워'; // 타워 이름
      this.level = 1; // 타워 레벨 (초기값 1)
    }

    // 유닛 공격 - 근처 유닛에 피해를 입힘
    attack(target) {
      if (target.atktype === 'unit') {
        target.health -= this.attackPower;
        if (target.health <= 0) {
          target.remove();
        }
      }
    }

    // 피해 입음 - 체력 감소 및 파괴 체크
    takeDamage(damage) {
      this.health -= damage;
      if (this.health <= 0) {
        this.destroy(); // 체력 0 이하 시 파괴
      }
    }

    // 타워 파괴 - DOM에서 제거 및 알림
    destroy() {
      if (this.screenElem && this.screenElem.parentNode) {
        this.screenElem.parentNode.removeChild(this.screenElem);
        alert(`${this.name}가 파괴되었습니다.`);
      }
    }

    // 타워 업그레이드 - 속성 강화 및 이미지 변경
    upgrade() {
      this.level += 1; // 레벨 증가
      this.health += 1000; // 체력 1000 증가
      this.attackPower += 10; // 공격력 10 증가
      this.range += 10; // 사거리 10 증가
      if (this.screenElem) {
        this.screenElem.style.backgroundImage = "url('img/upgraded-tower.png')"; // 업그레이드 이미지 적용
        this.screenElem.style.zIndex = "10"; // 다른 요소 위에 표시
      } else {
        console.error("타워 요소를 찾을 수 없습니다!"); // DOM 요소 없으면 에러 출력
      }
      console.log(`${this.name}가 레벨 ${this.level}로 업그레이드되었습니다!`);
    }
  }

  // 타워 인스턴스 생성
  const friendlyTower = new Tower(true, 5000, 30, 50); // 아군 타워 (체력: 5000, 공격력: 30, 사거리: 50)
  const enemyTower = new Tower(false, 5000, 30, 50); // 적군 타워

  // 유닛 선택 화면 생성 함수 - 유닛 생성 UI 표시
  function createUnitSelectionScreen() {
    let buttonsHTML = '';
    for (let i = 1; i <= 5; i++) { // 5가지 유닛 버튼 생성
      buttonsHTML += `<button class="unit-select" data-unit="${i}">유닛 ${i}/ 골드 : ${i}</button>`;
    }
    buttonsHTML += '<button id="backButton">뒤로 가기</button>'; // 뒤로 가기 버튼
    unitSelectionContainer.innerHTML = buttonsHTML; // 컨테이너에 HTML 삽입

    // 뒤로 가기 버튼 이벤트 - 유닛 선택 UI 닫기
    document.getElementById("backButton").addEventListener("click", () => {
      unitSelectionContainer.style.display = 'none';
      unitCreateBtn.style.display = 'block';
      towerUpgradeBtn.style.display = 'block';
    });

    // 유닛 선택 버튼 이벤트 - 선택한 유닛 생성
    document.querySelectorAll(".unit-select").forEach(button => {
      button.addEventListener("click", (e) => {
        const unitNumber = parseInt(e.target.getAttribute("data-unit"), 10);
        if (friendlyUnits.length < MAX_FRIENDLY_UNITS && currentCoin >= unitNumber) {
          currentCoin -= unitNumber; // 코인 소모
          updateCoinDisplay();

          const lastUnitX = friendlyUnits.length > 0 ? friendlyUnits[friendlyUnits.length - 1].x : 400; // 마지막 유닛 위치 기준
          const newX = lastUnitX - 250; // 새 유닛은 250px 뒤에 생성

          let unit;
          switch (unitNumber) { // 유닛 번호에 따라 다른 속성으로 생성
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
          friendlyUnits.push(unit); // 배열에 추가
          unit.element.classList.add(`unit${unitNumber}-moving`); // 이동 애니메이션 클래스 추가
        } else if (friendlyUnits.length >= MAX_FRIENDLY_UNITS) {
          console.log("최대 유닛 수(100개)에 도달했습니다!");
        } else {
          console.log("코인이 부족합니다!");
        }
      });
    });
  }

  // 유닛 생성 버튼 이벤트 - 유닛 선택 UI 표시
  if (unitCreateBtn) {
    unitCreateBtn.addEventListener("click", () => {
      unitCreateBtn.style.display = 'none'; // 버튼 숨김
      towerUpgradeBtn.style.display = 'none'; // 타워 업그레이드 버튼 숨김
      unitSelectionContainer.style.display = 'block'; // 유닛 선택 UI 표시
      createUnitSelectionScreen();
    });
  }

  // 타워 업그레이드 함수 - 아군 타워 업그레이드 실행
  function upgradeTower() {
    const upgradeCost = 5; // 업그레이드 비용
    if (currentCoin >= upgradeCost) {
      currentCoin -= upgradeCost; // 코인 소모
      updateCoinDisplay();
      friendlyTower.upgrade(); // 타워 업그레이드
    } else {
      console.log("코인이 부족합니다!");
    }
  }

  // 타워 업그레이드 버튼 이벤트 - 업그레이드 함수 호출
  if (towerUpgradeBtn) {
    towerUpgradeBtn.addEventListener("click", () => {
      upgradeTower();
    });
  }

  // 적 유닛 자동 생성 - 5초마다 적 유닛 생성
  setInterval(() => {
    if (enemyUnits.length < 1) { // 적 유닛이 없으면 생성
      const enemy = new Unit({
        x: 3600, // 맵 오른쪽에서 시작
        isEnemy: true,
        health: 100,
        attPower: 10,
        range: 50,
      });
      enemyUnits.push(enemy);
    }
  }, 5000);

  // 충돌 감지 - 유닛과 타워 간 전투 처리
  function checkCollisions() {
    friendlyUnits.forEach(friendly => { // 모든 아군 유닛 순회
      enemyUnits.forEach(enemy => { // 모든 적군 유닛 순회
        if (friendly.distanceTo(enemy) <= Math.max(friendly.range, enemy.range)) { // 사거리 내에 있으면
          friendly.attack(enemy); // 아군이 적군 공격
          enemy.attack(friendly); // 적군이 아군 공격
        }
      });
      if (friendly.distanceTo(enemyTower) <= Math.max(friendly.range, enemyTower.range)) { // 적 타워와의 충돌
        friendly.attack(enemyTower);
        enemyTower.attack(friendly);
      }
    });

    enemyUnits.forEach(enemy => { // 적군 유닛이 아군 타워 공격
      if (enemy.distanceTo(friendlyTower) <= Math.max(enemy.range, friendlyTower.range)) {
        enemy.attack(friendlyTower);
        friendlyTower.attack(enemy);
      }
    });
  }

  const unitSpacing = 200; // 아군 유닛 간 최소 간격

  // 유닛 겹침 방지 - 아군 유닛 간 간격 유지 및 이동 제어
  function dontOverlap() {
    for (let i = 1; i < friendlyUnits.length; i++) {
      const distance = friendlyUnits[i-1].x - friendlyUnits[i].x; // 앞 유닛과의 거리
      if (distance < unitSpacing) {
        friendlyUnits[i].speed = 0; // 너무 가까우면 정지
      } else if (friendlyUnits[i].speed === 0) {
        friendlyUnits[i].speed = GAME_SPEED; // 간격이 충분하면 이동 재개
      }
    }
    if (friendlyUnits.length > 0 && !friendlyUnits[0].isFighting) { // 첫 유닛 이동 보장
      friendlyUnits[0].speed = GAME_SPEED;
    }
  }

  // 게임 루프 - 게임 상태를 지속적으로 업데이트
  function gameLoop() {
    checkCollisions(); // 충돌 체크
    dontOverlap(); // 유닛 간격 조정
    friendlyUnits.forEach(unit => unit.update()); // 아군 유닛 위치 업데이트
    enemyUnits.forEach(unit => unit.update()); // 적군 유닛 위치 업데이트
    requestAnimationFrame(gameLoop); // 다음 프레임 요청 (약 60fps)
  }

  gameLoop(); // 게임 루프 시작
});