// script.js
const lico = document.getElementById('lico');
const svg = document.getElementById('lineCanvas');
const clones = [];
const cloneSound = new Audio('music/1.wav');
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

// Инструкция: сначала "ВСЁ НАЧИНАЕТСЯ С 'Я'"
const instructionBox = document.createElement('div');
instructionBox.id = 'instruction';
instructionBox.textContent = 'ВСЁ НАЧИНАЕТСЯ С «Я»';
document.body.appendChild(instructionBox);

Object.assign(instructionBox.style, {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
  fontSize: '16px',
  textAlign: 'center',
  color: 'black',
  background: 'white',
  padding: '12px 0',
  zIndex: '1000',
  textTransform: 'uppercase'
});

let instructionRevealed = false;

function revealFullInstruction() {
  if (instructionRevealed) return;
  instructionRevealed = true;
  instructionBox.innerHTML = `
    ЭТО НЕ СИМУЛЯТОР ОБЩЕНИЯ<br>
    ЭТО СИМУЛЯТОР ЕГО ПОТЕРИ<br><br>
    ТЫ ПОЯВИЛСЯ<br>
    ТЕБЯ МОЖНО ОТПУСТИТЬ<br>
    ТЕБЯ МОЖНО УДЕРЖАТЬ<br>
    МОЖНО И ЗАБЫТЬ<br>
    ТЫ ТОЖЕ МОЖЕШЬ НАЧАТЬ
  `;
  setTimeout(() => {
    instructionBox.remove();
  }, 25000);
}

lico.addEventListener('mousedown', handleCreateClone);
lico.addEventListener('touchstart', handleCreateClone, { passive: false });

function handleCreateClone(e) {
  e.preventDefault();
  if (!instructionRevealed) {
    revealFullInstruction();
  }
  createClone(lico);
}

const originLabel = document.createElement('div');
originLabel.className = 'label';
originLabel.textContent = 'Я';
Object.assign(originLabel.style, {
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  zIndex: '1002'
});
document.body.appendChild(originLabel);

const counterLabel = document.createElement('div');
counterLabel.className = 'label counter-label';
counterLabel.textContent = 'связей = 0';
counterLabel.style.zIndex = '1002';
document.body.appendChild(counterLabel);
let totalConnections = 0;
let longestConnection = 0;

function getCenter(elem) {
  const rect = elem.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function updateLine(line, fromElem, toElem) {
  const from = getCenter(fromElem);
  const to = getCenter(toElem);
  line.setAttribute('x1', from.x);
  line.setAttribute('y1', from.y);
  line.setAttribute('x2', to.x);
  line.setAttribute('y2', to.y);
}

function createClone(originElement) {
  try {
    cloneSound.currentTime = 0;
    cloneSound.play();
  } catch (e) {
    console.log("Ошибка воспроизведения:", e);
  }

  const originCenter = getCenter(originElement);
  const clone = document.createElement('img');
  clone.src = 'images/lico.png';
  clone.className = 'clone';
  clone.style.left = `${originCenter.x}px`;
  clone.style.top = `${originCenter.y}px`;
  clone.style.width = isTouchDevice ? '18vw' : '150px';
  clone.style.zIndex = '1001';
  document.body.appendChild(clone);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('stroke', 'black');
  line.setAttribute('stroke-width', '5');
  svg.appendChild(line);

  const timerLabel = document.createElement('div');
  timerLabel.className = 'timer-label';
  timerLabel.textContent = '...';
  timerLabel.style.zIndex = '1002';
  document.body.appendChild(timerLabel);

  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = 'ТЫ';
  Object.assign(label.style, {
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    zIndex: '1002'
  });
  document.body.appendChild(label);

  const data = {
    clone,
    line,
    origin: originElement,
    startTime: Date.now(),
    isDragging: false,
    draggingOffset: { x: 0, y: 0 },
    targetX: originCenter.x,
    targetY: originCenter.y,
    timer: 20000 + Math.random() * 40000,
    lastUpdate: Date.now(),
    expired: false,
    timerLabel,
    label,
    warningLabel: null,
    springTimeout: null
  };

  clones.push(data);
  totalConnections++;
  counterLabel.textContent = `связей = ${totalConnections}`;
  attachEvents(data);
  updateLine(line, originElement, clone);
}




// ... остальная часть script.js без изменений ...


function attachEvents(data) {
  const { clone } = data;
  let mouseDownTime = 0;
  let moved = false;

  function startDrag(e) {
    if (data.expired) return;
    e.preventDefault();
    const isTouch = e.type === 'touchstart';
    const point = isTouch ? e.touches[0] : e;

    mouseDownTime = Date.now();
    moved = false;
    const cloneRect = clone.getBoundingClientRect();
    data.draggingOffset.x = point.clientX - cloneRect.left;
    data.draggingOffset.y = point.clientY - cloneRect.top;
    data.isDragging = true;

    function onMove(moveEvent) {
      const movePoint = isTouch ? moveEvent.touches[0] : moveEvent;
      moved = true;
      data.targetX = movePoint.clientX - data.draggingOffset.x + clone.offsetWidth / 2;
      data.targetY = movePoint.clientY - data.draggingOffset.y + clone.offsetHeight / 2;

      if (!data.expired) {
        data.timer = 20000 + Math.random() * 40000;
        data.lastUpdate = Date.now();
        data.line.classList.add('spring-effect');
        clearTimeout(data.springTimeout);
        data.springTimeout = setTimeout(() => {
          data.line.classList.remove('spring-effect');
        }, 400);
      }
    }

    function onUp() {
      const moveType = isTouch ? 'touchmove' : 'mousemove';
      const upType = isTouch ? 'touchend' : 'mouseup';

      document.removeEventListener(moveType, onMove);
      document.removeEventListener(upType, onUp);
      data.isDragging = false;

      if (!moved && Date.now() - mouseDownTime < 200) {
        if (clone.src.includes('lico3.png')) return;
        createClone(clone);
      }
    }

    const moveType = isTouch ? 'touchmove' : 'mousemove';
    const upType = isTouch ? 'touchend' : 'mouseup';
    document.addEventListener(moveType, onMove, { passive: false });
    document.addEventListener(upType, onUp, { passive: false });
  }

  clone.addEventListener('mousedown', startDrag);
  clone.addEventListener('touchstart', startDrag, { passive: false });

  // Поворот клона за курсором на десктопе
  if (!isTouchDevice) {
    document.addEventListener('mousemove', (e) => {
      if (data.isDragging || data.expired) return;
      const center = getCenter(clone);
      const dx = e.clientX - center.x;
      const dy = e.clientY - center.y;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      clone.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    });
  } else {
    document.addEventListener('touchmove', (e) => {
      if (data.isDragging || data.expired) return;
      const touch = e.touches[0];
      const center = getCenter(clone);
      const dx = touch.clientX - center.x;
      const dy = touch.clientY - center.y;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      clone.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }, { passive: true });
  }
}

function handleCreateClone(e) {
  e.preventDefault();

  // показываем полную инструкцию только при первом взаимодействии
  if (!instructionRevealed) {
    revealFullInstruction();
  }

  createClone(lico);
}

}

lico.addEventListener('mousedown', handleCreateClone);
lico.addEventListener('touchstart', handleCreateClone, { passive: false });

document.addEventListener('contextmenu', (e) => e.preventDefault());

if (!isTouchDevice) {
  document.addEventListener('mousemove', (e) => {
    const center = getCenter(lico);
    const dx = e.clientX - center.x;
    const dy = e.clientY - center.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    lico.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
  });
} else {
  document.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const center = getCenter(lico);
    const dx = touch.clientX - center.x;
    const dy = touch.clientY - center.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    lico.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
  }, { passive: true });
}

function animate() {
  const now = Date.now();
  for (const data of clones) {
    const { clone, line, origin, isDragging, targetX, targetY, expired, timerLabel, label } = data;
    if (expired) continue;

    const currentX = parseFloat(clone.style.left);
    const currentY = parseFloat(clone.style.top);

    const springStrength = 0.1;
    const damping = 0.8;
    const vx = (targetX - currentX) * springStrength;
    const vy = (targetY - currentY) * springStrength;
    const newX = currentX + vx * damping;
    const newY = currentY + vy * damping;

    clone.style.left = `${newX}px`;
    clone.style.top = `${newY}px`;
    updateLine(line, origin, clone);

    const dist = Math.hypot(newX - getCenter(origin).x, newY - getCenter(origin).y);
    const decayRate = 1 + dist / 200;
    const elapsed = now - data.lastUpdate;
    data.timer -= elapsed * decayRate;
    data.lastUpdate = now;

    const remaining = Math.max(0, data.timer);
    const thickness = Math.max(0.5, (remaining / 60000) * 5);
    line.setAttribute('stroke-width', thickness.toFixed(2));

    timerLabel.textContent = (remaining / 1000).toFixed(1);
    timerLabel.style.left = `${newX}px`;
    timerLabel.style.top = `${newY - 30}px`;

    label.style.left = `${newX}px`;
    label.style.top = `${newY + 25}px`;

    if (remaining < 5000) {
      const pulse = Math.abs(Math.sin(remaining / 200));
      line.setAttribute('stroke', `rgba(0,0,0,${pulse.toFixed(2)})`);
      line.setAttribute('stroke-dasharray', '5,2');

      if (!data.warningLabel) {
        const warning = document.createElement('div');
        warning.className = 'warning-label';
        warning.textContent = 'эта связь на исходе';
        document.body.appendChild(warning);
        data.warningLabel = warning;
      }

      data.warningLabel.style.left = `${newX}px`;
      data.warningLabel.style.top = `${newY - 80}px`;
    } else {
      line.setAttribute('stroke', 'black');
      line.removeAttribute('stroke-dasharray');
      if (data.warningLabel) {
        data.warningLabel.remove();
        data.warningLabel = null;
      }
    }

    if (remaining <= 0) {
      data.expired = true;
      line.remove();
      timerLabel.remove();
      if (data.warningLabel) data.warningLabel.remove();
      clone.src = 'images/lico3.png';
      label.textContent = 'пусто';
      label.style.color = 'gray';

      const totalTime = ((Date.now() - data.startTime) / 1000).toFixed(1);

      if (parseFloat(totalTime) > longestConnection) {
        longestConnection = parseFloat(totalTime);
        const box = document.getElementById('longest-connection-box');
        if (box) {
          box.textContent = `самое долгое ты был в связи — ${longestConnection.toFixed(1)} сек`;
        }
      }

      const summaryLabel = document.createElement('div');
      summaryLabel.className = 'summary-label';
      summaryLabel.textContent = `итого = ${totalTime} сек`;
      document.body.appendChild(summaryLabel);

      const center = getCenter(clone);
      summaryLabel.style.left = `${center.x}px`;
      summaryLabel.style.top = `${center.y + 40}px`;
    }
  }

  const licoCenter = getCenter(lico);
  originLabel.style.left = `${licoCenter.x}px`;
  originLabel.style.top = `${licoCenter.y + 15}px`;
  counterLabel.textContent = `сейчас связей = ${clones.filter(c => !c.expired).length}`;
  counterLabel.style.left = `${licoCenter.x}px`;
  counterLabel.style.top = `${licoCenter.y + 35}px`;

  requestAnimationFrame(animate);
}

animate();
