const lico = document.getElementById('lico');
const svg = document.getElementById('lineCanvas');
const clones = [];
const isTouch = window.matchMedia('(pointer: coarse)').matches;
const cloneSound = new Audio('music/1.wav');

// Поместим SVG ниже по слоям (задний фон)
svg.style.position = 'absolute';
svg.style.top = 0;
svg.style.left = 0;
svg.style.zIndex = '0';
svg.style.pointerEvents = 'none'; // чтобы не мешал

// === Надпись "Я" под lico ===
const parent = lico.parentElement;
parent.style.position = 'relative';

const licoLabel = document.createElement('div');
licoLabel.textContent = 'Я';
Object.assign(licoLabel.style, {
  position: 'absolute',
  fontSize: '14px',
  fontFamily: 'sans-serif',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  color: 'black',
  zIndex: '1002',
  pointerEvents: 'none'
});
document.body.appendChild(licoLabel);


// === Инструкция ===
let instructionRevealed = false;
const instructionBox = document.createElement('div');
instructionBox.textContent = 'ВСЁ НАЧИНАЕТСЯ С «Я»';
Object.assign(instructionBox.style, {
  position: 'fixed', top: '0', left: '0', width: '100%',
  textAlign: 'center', fontSize: '20px',
  fontFamily: 'monospace', fontWeight: 'bold',
  background: 'white', zIndex: '1000', padding: '12px 0',
  textTransform: 'uppercase'
});
document.body.appendChild(instructionBox);

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
  setTimeout(() => instructionBox.remove(), 25000);
}

// === Обработка клика на lico ===
lico.addEventListener('mousedown', handleCreateClone);
lico.addEventListener('touchstart', handleCreateClone, { passive: false });
// Центрирование при загрузке
function centerLico() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  lico.style.position = 'absolute';
  lico.style.zIndex = '1001';
  lico.style.left = `${vw / 2}px`;
  lico.style.top = `${vh / 2}px`;
  lico.style.transform = 'translate(-50%, -50%)';
}
centerLico();
window.addEventListener('resize', centerLico);

function handleCreateClone(e) {
  e.preventDefault();
  if (!instructionRevealed) revealFullInstruction();

// Запретить создание клонов с lico3.png
  if (e.currentTarget.src && e.currentTarget.src.includes('lico3.png')) return;

  createClone(e.currentTarget);

}

// === Создание клона ===
function createClone(originElement) {
  try { cloneSound.currentTime = 0; cloneSound.play(); } catch {}

  const originRect = originElement.getBoundingClientRect();
  const originX = originRect.left + originRect.width / 2 + window.scrollX;
  const originY = originRect.top + originRect.height / 2 + window.scrollY;

  const clone = document.createElement('img');
  clone.src = 'images/lico.png';
  Object.assign(clone.style, {
    position: 'absolute',
    width: isTouch ? '25vw' : '180px',
    left: `${originX}px`,
    top: `${originY}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: '1001',
    cursor: 'pointer',
    transition: 'opacity 0.3s ease'
  });
  document.body.appendChild(clone);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('stroke', 'black');
  line.setAttribute('stroke-width', '5');
  svg.appendChild(line);

  const timerLabel = document.createElement('div');
  timerLabel.textContent = '...';
  Object.assign(timerLabel.style, {
    position: 'absolute',
    fontSize: '16px',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    background: 'white',
    padding: '2px 6px',
    border: '1px solid black',
    borderRadius: '4px',
    zIndex: '1002'
  });
  document.body.appendChild(timerLabel);

  const label = document.createElement('div');
  label.textContent = 'ТЫ';
  Object.assign(label.style, {
    position: 'absolute',
    fontSize: '14px',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    zIndex: '1002'
  });
  document.body.appendChild(label);

  const randomTimer = 20000 + Math.random() * 40000;

  const data = {
    clone,
    line,
    origin: originElement,
    label,
    timerLabel,
    isDragging: false,
    draggingOffset: { x: 0, y: 0 },
    targetX: originX,
    targetY: originY,
    lastUpdate: Date.now(),
    timer: randomTimer,
    lineStrokeWidth: 5,
    lineBlinkOn: false,
    blinkCounter: 0,
    fixed: false
  };

  clones.push(data);
  attachEvents(data);
  updateLine(line, originElement, clone);
}

// === Слежение за курсором ===
document.addEventListener('mousemove', e => {
  const x = e.clientX + window.scrollX;
  const y = e.clientY + window.scrollY;
  lico.style.left = `${x}px`;
  lico.style.top = `${y}px`;

  licoLabel.style.left = `${x}px`;
  licoLabel.style.top = `${y + 40}px`; // смещение ниже лица
});


document.addEventListener('touchmove', e => {
  const touch = e.touches[0];
  const x = touch.clientX + window.scrollX;
  const y = touch.clientY + window.scrollY;
  lico.style.left = `${x}px`;
  lico.style.top = `${y}px`;

  licoLabel.style.left = `${x}px`;
  licoLabel.style.top = `${y + 40}px`;
}, { passive: false });


// === События перетаскивания ===
function attachEvents(data) {
  const { clone } = data;
  let moved = false;

  clone.addEventListener('mousedown', start);
  clone.addEventListener('touchstart', start, { passive: false });

  function start(e) {
  if (data.fixed) return; // запрет перемещения замороженных клонов

  e.preventDefault();
  moved = false;
    const isTouch = e.type === 'touchstart';
    const x = isTouch ? e.touches[0].clientX : e.clientX;
    const y = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = clone.getBoundingClientRect();
    data.draggingOffset.x = x - rect.left;
    data.draggingOffset.y = y - rect.top;
    data.isDragging = true;

    const move = ev => {
      const mx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const my = ev.touches ? ev.touches[0].clientY : ev.clientY;
      data.targetX = mx - data.draggingOffset.x + clone.offsetWidth / 2;
      data.targetY = my - data.draggingOffset.y + clone.offsetHeight / 2;
      moved = true;
    };

    const stop = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', stop);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend', stop);
      data.isDragging = false;
      if (!moved) createClone(clone);
      else data.timer = 30000;
      data.lineBlinkOn = false;
      data.lineStrokeWidth = 5;
      data.line.setAttribute('stroke-dasharray', '');
      data.line.setAttribute('stroke', 'black');
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', stop);
    document.addEventListener('touchmove', move);
    document.addEventListener('touchend', stop);
  }
}

// === Вспомогательные ===
function getCenter(elem) {
  const rect = elem.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 + window.scrollX,
    y: rect.top + rect.height / 2 + window.scrollY
  };
}

function updateLine(line, from, to) {
  const p1 = getCenter(from);
  const p2 = getCenter(to);
  line.setAttribute('x1', p1.x);
  line.setAttribute('y1', p1.y);
  line.setAttribute('x2', p2.x);
  line.setAttribute('y2', p2.y);
}

// === Анимация ===
function animate() {
  const now = Date.now();
  for (const data of clones) {
    const { clone, line, origin, label, timerLabel } = data;

    if (!data.fixed) {
      const currentX = parseFloat(clone.style.left);
      const currentY = parseFloat(clone.style.top);
      const vx = (data.targetX - currentX) * 0.1;
      const vy = (data.targetY - currentY) * 0.1;
      const newX = Math.abs(vx) < 0.5 ? data.targetX : currentX + vx;
      const newY = Math.abs(vy) < 0.5 ? data.targetY : currentY + vy;
      clone.style.left = `${newX}px`;
      clone.style.top = `${newY}px`;

      updateLine(line, origin, clone);

      label.style.left = `${newX}px`;
      label.style.top = `${newY + 40}px`;

      timerLabel.style.left = `${newX}px`;
      timerLabel.style.top = `${newY - 60}px`;

      const elapsed = now - data.lastUpdate;
      const dist = Math.hypot(newX - getCenter(origin).x, newY - getCenter(origin).y);
      const decayRate = 1 + dist / 200;
      data.timer -= elapsed * decayRate;
      data.lastUpdate = now;

      const remaining = Math.max(0, data.timer);
      timerLabel.textContent = (remaining / 1000).toFixed(1);

      data.lineStrokeWidth = Math.max(1, (remaining / data.timer) * 5);
      line.setAttribute('stroke-width', data.lineStrokeWidth);

      if (remaining <= 0 && !data.fixed) {
        clone.src = 'images/lico3.png';
        data.fixed = true;
        data.timer = 0;
        line.setAttribute('stroke-dasharray', '10,5');
        line.setAttribute('stroke', 'black');
        line.setAttribute('stroke-width', 1);
        timerLabel.textContent = '0.0';
      }

      if (!data.fixed && remaining === 0) {
        data.lineBlinkOn = true;
      }

      if (data.lineBlinkOn && !data.fixed) {
        data.blinkCounter = (data.blinkCounter + 1) % 60;
        if (data.blinkCounter < 30) {
          line.setAttribute('stroke-dasharray', '10,5');
          line.setAttribute('stroke', 'black');
        } else {
          line.setAttribute('stroke-dasharray', '');
          line.setAttribute('stroke', 'transparent');
        }
      }
    }
  }
  // === Вращение клонов в сторону курсора ===
const cursor = {
  x: parseFloat(lico.style.left) + window.scrollX,
  y: parseFloat(lico.style.top) + window.scrollY
};

for (const data of clones) {
  const { clone } = data;

  const cloneCenter = getCenter(clone);
  const dx = cursor.x - cloneCenter.x;
  const dy = cursor.y - cloneCenter.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Сохраняем translate + добавляем вращение
  clone.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
}

  requestAnimationFrame(animate);
}

animate();
